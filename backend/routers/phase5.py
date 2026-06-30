"""
Phase 5 Router — all new endpoints
"""
import uuid
import os
import shutil
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends
from core.auth import get_current_admin, Depends, HTTPException, UploadFile, File, Form, Request, BackgroundTasks, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.config import settings
from models.phase5 import (
    Review, Coupon, CouponUsage, AbandonedCart, Referral, AnalyticsEvent
)
from schemas.phase5 import (
    ReviewCreate, ReviewUpdate, ReviewOut,
    CouponCreate, CouponOut, CouponValidateRequest, CouponValidateResponse,
    AbandonedCartUpsert, AbandonedCartOut,
    ReferralCreate, ReferralOut,
    AnalyticsEventIn,
)
from services import whatsapp_bot, instagram_service, analytics_service

router = APIRouter()


# ════════════════════════════════════════════════════════════════════
#  WHATSAPP BOT
# ════════════════════════════════════════════════════════════════════

@router.get("/whatsapp/webhook")
async def wa_verify(
    hub_mode: str       = Query(None, alias="hub.mode"),
    hub_challenge: str  = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """Meta webhook verification handshake."""
    from services.whatsapp_bot import WA_VERIFY_TOKEN
    if hub_mode == "subscribe" and hub_verify_token == WA_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(403, "Verification failed")


@router.post("/whatsapp/webhook")
async def wa_incoming(request: Request, background_tasks: BackgroundTasks):
    """
    Receive incoming WhatsApp messages from Meta Cloud API.
    Processes auto-replies asynchronously so Meta gets 200 immediately.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "ok"}

    async def _process():
        try:
            entry = body.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            for msg in messages:
                if msg.get("type") != "text":
                    continue
                sender  = msg["from"]
                text    = msg["text"]["body"]
                reply   = whatsapp_bot.get_auto_reply(text, sender)
                if reply:
                    await whatsapp_bot.send_whatsapp_message(sender, reply)
        except Exception as e:
            print(f"[wa_webhook] Processing error: {e}")

    background_tasks.add_task(_process)
    return {"status": "ok"}


@router.post("/whatsapp/send-test")
async def wa_send_test(phone: str, message: str):
    """Dev helper: send a test WhatsApp message."""
    ok = await whatsapp_bot.send_whatsapp_message(phone, message)
    return {"sent": ok}


# ════════════════════════════════════════════════════════════════════
#  INSTAGRAM
# ════════════════════════════════════════════════════════════════════

@router.get("/instagram/posts")
async def get_instagram_posts(
    limit: int = Query(12, ge=1, le=50),
    media_type: Optional[str] = Query(None),
):
    """Fetch recent Instagram posts (cached for 1 hour)."""
    posts = await instagram_service.fetch_instagram_posts(limit, media_type)
    return {"posts": posts, "count": len(posts)}


@router.post("/instagram/refresh-token")
async def refresh_ig_token():
    """Refresh Instagram long-lived token (call monthly)."""
    new_token = await instagram_service.refresh_instagram_token()
    if new_token:
        return {"success": True, "note": "Update INSTAGRAM_ACCESS_TOKEN in .env"}
    raise HTTPException(500, "Token refresh failed")


@router.post("/instagram/clear-cache")
async def clear_ig_cache():
    """Force-refresh Instagram feed (clears 1-hour cache, next request fetches fresh)."""
    instagram_service.clear_cache()
    return {"success": True, "message": "Cache cleared — next request will fetch fresh posts"}


# ════════════════════════════════════════════════════════════════════
#  REVIEWS
# ════════════════════════════════════════════════════════════════════

@router.get("/reviews", response_model=List[ReviewOut])
def get_reviews(
    product_id:  Optional[int]  = None,
    featured:    Optional[bool] = None,
    min_rating:  int = 1,
    skip: int = 0, limit: int = 20,
    db: Session = Depends(get_db),
):
    q = db.query(Review).filter(Review.is_published == True)
    if product_id: q = q.filter(Review.product_id == product_id)
    if featured:   q = q.filter(Review.is_featured == True)
    if min_rating > 1: q = q.filter(Review.rating >= min_rating)
    return q.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/reviews", response_model=ReviewOut, status_code=201)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = Review(**review.model_dump(), photos=[])
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


@router.post("/reviews/{review_id}/photos", response_model=ReviewOut)
async def upload_review_photo(
    review_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")

    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    fname = f"review_{review_id}_{uuid.uuid4().hex[:8]}.{ext}"
    with open(os.path.join(settings.UPLOAD_DIR, fname), "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    url = f"/uploads/{fname}"

    review.photos = list(review.photos or []) + [url]
    db.commit()
    db.refresh(review)
    return review


@router.patch("/reviews/{review_id}", response_model=ReviewOut)
def admin_update_review(review_id: int, update: ReviewUpdate, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(review, k, v)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    db.delete(review)
    db.commit()


@router.get("/reviews/summary")
def review_summary(db: Session = Depends(get_db)):
    return analytics_service.get_review_summary(db)


# ════════════════════════════════════════════════════════════════════
#  COUPONS
# ════════════════════════════════════════════════════════════════════

@router.get("/coupons", response_model=List[CouponOut])
def list_coupons(active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Coupon)
    if active_only:
        now = datetime.now(timezone.utc)
        q = q.filter(
            Coupon.is_active == True,
            (Coupon.valid_from == None) | (Coupon.valid_from <= now),
            (Coupon.valid_until == None) | (Coupon.valid_until >= now),
        )
    return q.order_by(Coupon.created_at.desc()).all()


@router.post("/coupons", response_model=CouponOut, status_code=201)
def create_coupon(coupon: CouponCreate, db: Session = Depends(get_db)):
    existing = db.query(Coupon).filter(Coupon.code == coupon.code.upper()).first()
    if existing:
        raise HTTPException(400, "Coupon code already exists")
    db_coupon = Coupon(**coupon.model_dump(), code=coupon.code.upper())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon


@router.post("/coupons/validate", response_model=CouponValidateResponse)
def validate_coupon(body: CouponValidateRequest, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.code == body.code.upper()).first()
    now = datetime.now(timezone.utc)

    if not coupon or not coupon.is_active:
        return CouponValidateResponse(valid=False, message="Invalid or expired coupon code")

    if coupon.valid_from and coupon.valid_from > now:
        return CouponValidateResponse(valid=False, message="Coupon is not yet active")

    if coupon.valid_until and coupon.valid_until < now:
        return CouponValidateResponse(valid=False, message="This coupon has expired")

    if coupon.max_uses and coupon.total_used >= coupon.max_uses:
        return CouponValidateResponse(valid=False, message="Coupon usage limit reached")

    if body.order_value < coupon.min_order_value:
        return CouponValidateResponse(
            valid=False,
            message=f"Minimum order value ₹{coupon.min_order_value} required"
        )

    # Check per-user usage
    if body.phone and coupon.uses_per_user:
        used = db.query(CouponUsage).filter(
            CouponUsage.coupon_id == coupon.id,
            CouponUsage.phone == body.phone
        ).count()
        if used >= coupon.uses_per_user:
            return CouponValidateResponse(valid=False, message="You've already used this coupon")

    # Compute discount
    if coupon.discount_type == "percent":
        discount = body.order_value * coupon.discount_value / Decimal("100")
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:
        discount = min(coupon.discount_value, body.order_value)

    from schemas.phase5 import CouponOut as COut
    return CouponValidateResponse(
        valid=True,
        discount_amount=discount,
        message=f"✅ Coupon applied! You save ₹{discount:.0f}",
        coupon=COut.model_validate(coupon),
    )


@router.delete("/coupons/{coupon_id}", status_code=204)
def delete_coupon(coupon_id: int, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    db.delete(coupon)
    db.commit()


@router.patch("/coupons/{coupon_id}/toggle", dependencies=[Depends(get_current_admin)])
def toggle_coupon(coupon_id: int, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    coupon.is_active = not coupon.is_active
    db.commit()
    return {"id": coupon_id, "is_active": coupon.is_active}


# ════════════════════════════════════════════════════════════════════
#  ABANDONED CART RECOVERY
# ════════════════════════════════════════════════════════════════════

@router.post("/abandoned-cart", response_model=AbandonedCartOut)
def upsert_abandoned_cart(body: AbandonedCartUpsert, db: Session = Depends(get_db)):
    existing = db.query(AbandonedCart).filter(AbandonedCart.session_id == body.session_id).first()
    if existing:
        for k, v in body.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    cart = AbandonedCart(**body.model_dump())
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


@router.post("/abandoned-cart/{session_id}/recover")
def mark_recovered(session_id: str, order_id: int, db: Session = Depends(get_db)):
    cart = db.query(AbandonedCart).filter(AbandonedCart.session_id == session_id).first()
    if cart:
        cart.recovered = True
        cart.recovered_order_id = order_id
        db.commit()
    return {"recovered": True}


@router.post("/abandoned-cart/send-reminders", dependencies=[Depends(get_current_admin)])
async def send_abandoned_cart_reminders(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Send WhatsApp reminders to carts abandoned > 2 hours ago with < 3 reminders sent.
    Call this from a cron job (e.g. every 2 hours).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    carts = db.query(AbandonedCart).filter(
        AbandonedCart.recovered == False,
        AbandonedCart.phone != None,
        AbandonedCart.reminder_sent_count < 3,
        AbandonedCart.created_at <= cutoff,
    ).all()

    sent = 0
    for cart in carts:
        coupon_code = "COMEBACK10" if cart.reminder_sent_count == 0 else None

        async def _send(c=cart, code=coupon_code):
            ok = await whatsapp_bot.send_abandoned_cart_reminder(
                c.phone, c.name or "there", c.cart_data, float(c.total_value), code
            )
            if ok:
                c.reminder_sent_count += 1
                c.last_reminder_at = datetime.now(timezone.utc)
                db.commit()

        background_tasks.add_task(_send)
        sent += 1

    return {"reminders_queued": sent}


@router.get("/abandoned-cart", response_model=List[AbandonedCartOut])
def list_abandoned_carts(recovered: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(AbandonedCart)
    if recovered is not None:
        q = q.filter(AbandonedCart.recovered == recovered)
    return q.order_by(AbandonedCart.created_at.desc()).limit(100).all()


# ════════════════════════════════════════════════════════════════════
#  REFERRALS
# ════════════════════════════════════════════════════════════════════

def _gen_referral_code(name: str, phone: str) -> str:
    base = (name[:4] if name else "HAG").upper().replace(" ", "")
    suffix = phone[-4:] if phone else uuid.uuid4().hex[:4].upper()
    return f"{base}{suffix}"


@router.post("/referrals/generate", response_model=ReferralOut)
def generate_referral(body: ReferralCreate, db: Session = Depends(get_db)):
    """Generate a referral code for an existing customer."""
    existing = db.query(Referral).filter(
        Referral.referrer_phone == body.referrer_phone,
        Referral.referee_phone == None
    ).first()
    if existing:
        return existing

    code = _gen_referral_code(body.referrer_name or "", body.referrer_phone)
    # Ensure uniqueness
    while db.query(Referral).filter(Referral.referral_code == code).first():
        code = code[:6] + uuid.uuid4().hex[:3].upper()

    ref = Referral(
        referrer_phone = body.referrer_phone,
        referrer_name  = body.referrer_name,
        referee_phone  = "PENDING",
        referral_code  = code,
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


@router.post("/referrals/apply")
def apply_referral(
    referral_code: str,
    referee_phone: str,
    referee_name: Optional[str] = None,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Customer applies a referral code during checkout."""
    ref = db.query(Referral).filter(Referral.referral_code == referral_code.upper()).first()
    if not ref:
        raise HTTPException(404, "Invalid referral code")
    if ref.referee_phone not in (None, "PENDING") and ref.referee_phone != referee_phone:
        raise HTTPException(400, "Referral code already used by another customer")
    if ref.referrer_phone == referee_phone:
        raise HTTPException(400, "You cannot use your own referral code")

    ref.referee_phone = referee_phone
    ref.referee_name  = referee_name
    if order_id:
        ref.referee_order_id = order_id

    # Create reward coupon for referee (10% off)
    coupon_code = f"REF{referral_code[-4:]}10"
    existing = db.query(Coupon).filter(Coupon.code == coupon_code).first()
    if not existing:
        reward = Coupon(
            code="REF" + referral_code[-4:] + "10",
            description=f"Referral reward — 10% off for {referee_name or referee_phone}",
            discount_type="percent",
            discount_value=Decimal("10"),
            max_uses=1,
            uses_per_user=1,
            campaign="referral",
        )
        db.add(reward)
        ref.reward_coupon_code = coupon_code
        ref.referee_rewarded = True

    db.commit()
    return {
        "success": True,
        "referrer": ref.referrer_name,
        "reward_coupon": ref.reward_coupon_code,
        "message": f"Referral applied! Use code {ref.reward_coupon_code} for 10% off your order.",
    }


@router.get("/referrals", response_model=List[ReferralOut])
def list_referrals(db: Session = Depends(get_db)):
    return db.query(Referral).order_by(Referral.created_at.desc()).limit(100).all()


# ════════════════════════════════════════════════════════════════════
#  ANALYTICS EVENTS (frontend tracking)
# ════════════════════════════════════════════════════════════════════

@router.post("/analytics/event", status_code=202)
def track_event(event: AnalyticsEventIn, db: Session = Depends(get_db)):
    db.add(AnalyticsEvent(**event.model_dump()))
    db.commit()
    return {"tracked": True}


# ════════════════════════════════════════════════════════════════════
#  ANALYTICS DASHBOARD
# ════════════════════════════════════════════════════════════════════

@router.get("/analytics/overview", dependencies=[Depends(get_current_admin)])
def analytics_overview(days: int = 30, db: Session = Depends(get_db)):
    return {
        "sales":       analytics_service.get_sales_overview(db, days),
        "funnel":      analytics_service.get_conversion_funnel(db, days),
        "categories":  analytics_service.get_category_breakdown(db),
        "reviews":     analytics_service.get_review_summary(db),
        "top_coupons": analytics_service.get_coupon_performance(db),
    }


@router.get("/analytics/daily-revenue", dependencies=[Depends(get_current_admin)])
def daily_revenue(days: int = 30, db: Session = Depends(get_db)):
    return analytics_service.get_daily_revenue(db, days)


@router.get("/analytics/top-products", dependencies=[Depends(get_current_admin)])
def top_products(limit: int = 10, db: Session = Depends(get_db)):
    return analytics_service.get_top_products(db, limit)


@router.get("/analytics/top-customers", dependencies=[Depends(get_current_admin)])
def top_customers(limit: int = 10, db: Session = Depends(get_db)):
    return analytics_service.get_top_customers(db, limit)


@router.get("/instagram/image-proxy")
async def instagram_image_proxy(url: str):
    """
    Proxy Instagram CDN images through our backend.
    Instagram's CDN sometimes blocks hotlinking from external domains (CORS/referrer checks),
    and signed URLs expire after a few hours. This endpoint fetches fresh and streams it through,
    avoiding both issues.
    """
    import httpx
    from fastapi.responses import Response

    # Allow any https Instagram/Facebook CDN domain (was using buggy and/or precedence before)
    is_valid = url.startswith("https://") and (
        "fbcdn.net" in url or "cdninstagram.com" in url or "instagram." in url
    )
    if not is_valid:
        print(f"[instagram-proxy] Rejected invalid URL: {url[:100]}")
        raise HTTPException(400, "Invalid Instagram CDN URL")

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                }
            )
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "image/jpeg")
            print(f"[instagram-proxy] OK {resp.status_code} {content_type} {len(resp.content)} bytes")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=3600"},
            )
    except httpx.HTTPStatusError as e:
        print(f"[instagram-proxy] HTTP {e.response.status_code} fetching: {url[:150]}")
        raise HTTPException(502, f"Instagram CDN returned {e.response.status_code}")
    except Exception as e:
        print(f"[instagram-proxy] Error: {e} | URL: {url[:150]}")
        raise HTTPException(502, f"Failed to fetch Instagram image: {str(e)}")


@router.get("/instagram/debug-raw")
async def instagram_debug_raw():
    """
    DEBUG: Returns the raw, unprocessed Instagram API response.
    Use this to verify thumbnail_url is actually present in the API data.
    Remove or protect this endpoint after debugging.
    """
    import httpx
    from services.instagram_service import IG_TOKEN, IG_BIZ_ID, IG_BASE

    if not IG_TOKEN or not IG_BIZ_ID:
        return {"error": "Instagram not configured", "has_token": bool(IG_TOKEN), "has_biz_id": bool(IG_BIZ_ID)}

    fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
    url    = f"{IG_BASE}/{IG_BIZ_ID}/media"
    params = {"fields": fields, "limit": 8, "access_token": IG_TOKEN}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        return {
            "status_code": resp.status_code,
            "raw_response": resp.json(),
        }
