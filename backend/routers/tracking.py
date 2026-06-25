"""
Order Tracking Router — Phase 4
---------------------------------
REST:
  GET  /api/tracking/order/{order_id}           — admin: full timeline
  GET  /api/tracking/token/{token}              — public: timeline via tracking token
  POST /api/tracking/order/{order_id}/status    — admin: add status event
  POST /api/tracking/order/{order_id}/photo     — admin: upload progress photo
  GET  /api/tracking/order/{order_id}/photos    — list photos for order
  POST /api/tracking/token/{order_id}/generate  — generate public tracking token
  GET  /api/tracking/admin/active               — all orders with pending/active status

WebSocket:
  WS /api/tracking/ws/order/{order_id}          — customer/admin watches one order
  WS /api/tracking/ws/admin                     — admin dashboard watches all orders
"""

import uuid
import os
import shutil
from services.storage import upload_file as cloud_upload
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from core.config import settings
from core.ws_manager import manager
from models.order import Order
from models.tracking import OrderTrackingEvent, OrderProgressPhoto, TrackingToken, TRACKING_STATUSES, STATUS_META
from schemas.tracking import TrackingEventCreate, TrackingEventOut, ProgressPhotoOut, OrderTimelineOut, TrackingTokenOut
from services.tracking_notifications import (
    build_status_whatsapp_url, send_status_update_email
)

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_order_or_404(order_id: int, db: Session) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order

def _build_timeline(order: Order, events: list) -> dict:
    current = events[-1].status if events else "order_placed"
    cur_meta = STATUS_META.get(current, {})
    current_idx = TRACKING_STATUSES.index(current) if current in TRACKING_STATUSES else 0

    all_statuses = []
    for i, s in enumerate(TRACKING_STATUSES):
        meta = STATUS_META[s]
        state = "completed" if i < current_idx else ("active" if i == current_idx else "upcoming")
        all_statuses.append({
            "key":   s,
            "label": meta["label"],
            "icon":  meta["icon"],
            "color": meta["color"],
            "state": state,
        })

    return {
        "order_id":            order.id,
        "order_number":        order.order_number,
        "current_status":      current,
        "current_status_label": cur_meta.get("label", current),
        "current_status_icon":  cur_meta.get("icon", "📌"),
        "customer_name":       order.customer_name,
        "events":              events,
        "all_statuses":        all_statuses,
    }

def _get_tracking_token(order_id: int, db: Session) -> Optional[str]:
    tok = db.query(TrackingToken).filter(TrackingToken.order_id == order_id).first()
    return tok.token if tok else None


# ── WebSocket endpoints ───────────────────────────────────────────────────────

@router.websocket("/ws/order/{order_id}")
async def ws_order(websocket: WebSocket, order_id: int):
    """Customer / admin subscribes to live updates for one order."""
    await manager.connect_order(websocket, order_id)
    try:
        # Send a welcome ping immediately
        await websocket.send_json({"type": "connected", "order_id": order_id})
        while True:
            # Keep connection alive; client can send "ping" → we reply "pong"
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect_order(websocket, order_id)


@router.websocket("/ws/admin")
async def ws_admin(websocket: WebSocket):
    """Admin dashboard — receives updates for ALL orders."""
    await manager.connect_admin(websocket)
    try:
        await websocket.send_json({"type": "connected", "role": "admin", **manager.stats()})
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", **manager.stats()})
    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)


# ── REST: Status update ───────────────────────────────────────────────────────

@router.post("/order/{order_id}/status", response_model=TrackingEventOut)
async def add_status_event(
    order_id: int,
    payload: TrackingEventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Admin pushes a new status. Creates a tracking event, updates order.status,
    broadcasts via WebSocket, and queues email + WhatsApp notifications.
    """
    if payload.status not in TRACKING_STATUSES:
        raise HTTPException(400, f"Invalid status. Choose from: {', '.join(TRACKING_STATUSES)}")

    order = _get_order_or_404(order_id, db)

    # Create tracking event
    event = OrderTrackingEvent(
        order_id   = order_id,
        status     = payload.status,
        notes      = payload.notes,
        admin_note = payload.admin_note,
        updated_by = payload.updated_by or "Admin",
    )
    db.add(event)

    # Mirror status on the main order record
    order.status = payload.status
    db.commit()
    db.refresh(event)

    # Reload with photos (empty at creation)
    event_out = db.query(OrderTrackingEvent)\
        .options(joinedload(OrderTrackingEvent.photos))\
        .filter(OrderTrackingEvent.id == event.id)\
        .first()

    # Get tracking token for notification URLs
    tracking_token = _get_tracking_token(order_id, db)
    meta = STATUS_META.get(payload.status, {})

    # ── WebSocket broadcast ───────────────────────────────────────────────────
    ws_payload = {
        "type":     "status_update",
        "order_id": order_id,
        "order_number": order.order_number,
        "status":   payload.status,
        "label":    meta.get("label", payload.status),
        "icon":     meta.get("icon", "📌"),
        "color":    meta.get("color", "#c8860f"),
        "notes":    payload.notes,
        "updated_by": payload.updated_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    background_tasks.add_task(manager.broadcast_order_update, order_id, ws_payload)

    # ── Email + WhatsApp notifications ────────────────────────────────────────
    def _notify():
        # Email
        sent = send_status_update_email(order, payload.status, payload.notes, tracking_token)
        if sent:
            event_out.email_sent = True
            db.commit()

    background_tasks.add_task(_notify)

    return event_out


# ── REST: Timeline ────────────────────────────────────────────────────────────

@router.get("/order/{order_id}", response_model=dict)
def get_order_timeline(order_id: int, db: Session = Depends(get_db)):
    """Admin: full order timeline with all events and photos."""
    order = _get_order_or_404(order_id, db)
    events = (
        db.query(OrderTrackingEvent)
        .options(joinedload(OrderTrackingEvent.photos))
        .filter(OrderTrackingEvent.order_id == order_id)
        .order_by(OrderTrackingEvent.created_at)
        .all()
    )
    token = _get_tracking_token(order_id, db)
    result = _build_timeline(order, events)
    result["tracking_token"] = token
    result["whatsapp_url"] = (
        build_status_whatsapp_url(order, result["current_status"], None, token)
        if order.customer_phone else None
    )
    return result


@router.get("/token/{token}", response_model=dict)
def get_timeline_by_token(token: str, db: Session = Depends(get_db)):
    """Public: customer tracks order using a token (no auth needed)."""
    try:
        tok = db.query(TrackingToken).filter(TrackingToken.token == token).first()
    except Exception as e:
        # Table doesn't exist yet — migrations not run
        raise HTTPException(500, f"Tracking tables not set up yet. Run migrate_phase4.sql on your database. Error: {str(e)}")

    if not tok:
        raise HTTPException(404, "Tracking link not found or expired")

    order = db.query(Order).filter(Order.id == tok.order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")

    try:
        events = (
            db.query(OrderTrackingEvent)
            .options(joinedload(OrderTrackingEvent.photos))
            .filter(OrderTrackingEvent.order_id == tok.order_id)
            .order_by(OrderTrackingEvent.created_at)
            .all()
        )
    except Exception:
        events = []

    result = _build_timeline(order, events)
    # Mask customer details for privacy on public endpoint
    name = result.get("customer_name", "Customer")
    result["customer_name"] = (name.split()[0] + "…") if name else "Customer…"
    return result


# ── REST: Generate tracking token ─────────────────────────────────────────────

@router.post("/token/{order_id}/generate", response_model=TrackingTokenOut)
def generate_tracking_token(order_id: int, db: Session = Depends(get_db)):
    """Create (or return existing) a public tracking token for an order."""
    _get_order_or_404(order_id, db)
    existing = db.query(TrackingToken).filter(TrackingToken.order_id == order_id).first()
    if existing:
        return existing
    tok = TrackingToken(token=uuid.uuid4().hex, order_id=order_id)
    db.add(tok)
    db.commit()
    db.refresh(tok)
    return tok


# ── REST: Progress photos ─────────────────────────────────────────────────────

@router.post("/order/{order_id}/photo", response_model=ProgressPhotoOut)
async def upload_progress_photo(
    order_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    event_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """Admin uploads a progress photo, optionally linked to a specific event."""
    _get_order_or_404(order_id, db)

    # Save file
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "jpg"
    filename = f"progress_{order_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    url = f"/uploads/{filename}"

    # If no event_id provided, attach to the latest event
    if not event_id:
        latest = (
            db.query(OrderTrackingEvent)
            .filter(OrderTrackingEvent.order_id == order_id)
            .order_by(OrderTrackingEvent.created_at.desc())
            .first()
        )
        event_id = latest.id if latest else None

    photo = OrderProgressPhoto(order_id=order_id, event_id=event_id, url=url, caption=caption)
    db.add(photo)
    db.commit()
    db.refresh(photo)

    # Broadcast photo to WebSocket room
    ws_payload = {
        "type":      "photo_added",
        "order_id":  order_id,
        "photo_url": url,
        "caption":   caption,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    background_tasks.add_task(manager.broadcast_order_update, order_id, ws_payload)
    return photo


@router.get("/order/{order_id}/photos", response_model=List[ProgressPhotoOut])
def get_order_photos(order_id: int, db: Session = Depends(get_db)):
    return (
        db.query(OrderProgressPhoto)
        .filter(OrderProgressPhoto.order_id == order_id)
        .order_by(OrderProgressPhoto.created_at)
        .all()
    )


# ── REST: Admin active orders dashboard ───────────────────────────────────────

@router.get("/admin/active")
def get_active_orders(db: Session = Depends(get_db)):
    """Return all non-delivered orders with their current tracking status."""
    from models.order import Order as OrderModel
    orders = (
        db.query(OrderModel)
        .filter(OrderModel.status.notin_(["delivered", "cancelled"]))
        .order_by(OrderModel.created_at.desc())
        .limit(100)
        .all()
    )
    result = []
    for o in orders:
        latest_event = (
            db.query(OrderTrackingEvent)
            .filter(OrderTrackingEvent.order_id == o.id)
            .order_by(OrderTrackingEvent.created_at.desc())
            .first()
        )
        meta = STATUS_META.get(o.status, {})
        result.append({
            "id":           o.id,
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "status":       o.status,
            "status_label": meta.get("label", o.status),
            "status_icon":  meta.get("icon", "📌"),
            "status_color": meta.get("color", "#c8860f"),
            "last_update":  latest_event.created_at.isoformat() if latest_event else o.created_at.isoformat(),
            "total_amount": float(o.total_amount),
            "created_at":   o.created_at.isoformat(),
        })
    return result


@router.get("/ws/stats")
def ws_stats():
    """Dev helper: how many WebSocket connections are active."""
    return manager.stats()
