"""
Checkout & Order Router
-----------------------
POST /api/checkout/initiate       – validate cart, create order, create Razorpay order
POST /api/checkout/verify-payment – verify Razorpay signature, capture, generate invoice, notify
GET  /api/checkout/orders/{id}    – single order detail (with items)
GET  /api/checkout/orders          – list orders (admin)
GET  /api/checkout/invoice/{id}   – download invoice PDF
POST /api/checkout/orders/{id}/status – update order status (admin)
GET  /api/checkout/config          – return Razorpay key_id to frontend
"""

import os
import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.config import settings
from models.order import Order, OrderItem, Payment, Invoice
from models.models import Product
from schemas.order import CheckoutRequest, OrderOut, PaymentVerifyRequest, PaymentOut, InvoiceOut
from services import razorpay_service, invoice_service, notification_service

router = APIRouter()

TAX_RATE      = Decimal("18.0")   # GST %
FREE_SHIP_MIN = Decimal("2000")   # Free shipping above ₹2000
SHIPPING_FEE  = Decimal("150")    # Flat shipping below threshold


# ── helpers ───────────────────────────────────────────────────────────────────

def _generate_order_number() -> str:
    ts  = datetime.utcnow().strftime("%y%m%d")
    uid = str(uuid.uuid4()).split("-")[0].upper()
    return f"HAG-{ts}-{uid}"

def _generate_invoice_number(order_id: int) -> str:
    year  = datetime.utcnow().year
    month = datetime.utcnow().month
    return f"INV/{year}/{month:02d}/{order_id:05d}"

def _calculate_totals(items_in, shipping_override: Decimal = None):
    subtotal = sum(
        Decimal(str(item.unit_price)) * item.quantity
        for item in items_in
    )
    shipping = (
        shipping_override
        if shipping_override is not None
        else (Decimal("0") if subtotal >= FREE_SHIP_MIN else SHIPPING_FEE)
    )
    taxable   = subtotal + shipping
    tax_amt   = (taxable * TAX_RATE / 100).quantize(Decimal("0.01"), ROUND_HALF_UP)
    total     = subtotal + shipping + tax_amt
    return subtotal, shipping, tax_amt, total


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/config")
def get_razorpay_config():
    """Return Razorpay key_id so the frontend can load the checkout widget."""
    return {
        "key_id":   razorpay_service.get_key_id(),
        "currency": "INR",
    }


@router.post("/initiate", response_model=dict)
def initiate_checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    """
    1. Validate products exist and compute totals server-side (prevents price tampering).
    2. Create an Order + OrderItems in DB (status=pending).
    3. Create a Razorpay order.
    4. Return Razorpay order_id + amount to the frontend.
    """
    if not payload.items:
        raise HTTPException(400, "Cart is empty")

    # Validate + snapshot each product
    validated_items = []
    for item_in in payload.items:
        if not item_in.is_custom:
            product = db.query(Product).filter(Product.id == item_in.product_id).first()
            if not product:
                raise HTTPException(404, f"Product {item_in.product_id} not found")
            # Use server-side price for non-custom items
            unit_price = Decimal(str(product.price))
            name       = product.name
            category   = product.category.name if product.category else None
        else:
            # Custom items: trust the provided price (artisan will confirm via WhatsApp)
            unit_price = Decimal(str(item_in.unit_price))
            name       = item_in.product_name
            category   = item_in.product_category

        validated_items.append({
            "product_id":       item_in.product_id if not item_in.is_custom else None,
            "product_name":     name,
            "product_category": category,
            "unit_price":       unit_price,
            "quantity":         max(1, item_in.quantity),
            "line_total":       unit_price * max(1, item_in.quantity),
            "custom_config":    item_in.custom_config,
            "ai_preview_id":    item_in.ai_preview_id,
            "is_custom":        item_in.is_custom,
        })

    subtotal, shipping, tax_amt, total = _calculate_totals(
        [type("I", (), v)() for v in validated_items]
    )

    order_number = _generate_order_number()

    # Create DB order
    order = Order(
        order_number    = order_number,
        customer_name   = payload.customer_name,
        customer_email  = payload.customer_email,
        customer_phone  = payload.customer_phone,
        address_line1   = payload.address_line1,
        address_line2   = payload.address_line2,
        city            = payload.city,
        state           = payload.state,
        pincode         = payload.pincode,
        country         = payload.country,
        delivery_notes  = payload.delivery_notes,
        subtotal        = subtotal,
        tax_amount      = tax_amt,
        shipping_amount = shipping,
        discount_amount = Decimal("0"),
        total_amount    = total,
        status          = "pending",
    )
    db.add(order)
    db.flush()   # get order.id

    for v in validated_items:
        db.add(OrderItem(order_id=order.id, **v))

    # Create Razorpay order
    try:
        rz_order = razorpay_service.create_razorpay_order(
            total, order_number, payload.customer_name, payload.customer_email or ""
        )
        order.razorpay_order_id = rz_order["id"]
    except Exception as e:
        # If Razorpay is not configured, return a demo mode response
        print(f"[razorpay] {e} — running in DEMO mode")
        order.razorpay_order_id = f"demo_{uuid.uuid4().hex[:16]}"
        rz_order = {
            "id":       order.razorpay_order_id,
            "amount":   int(total * 100),
            "currency": "INR",
            "demo":     True,
        }

    # Create Payment record
    payment = Payment(
        order_id          = order.id,
        razorpay_order_id = order.razorpay_order_id,
        amount            = total,
        currency          = "INR",
        status            = "created",
    )
    db.add(payment)
    db.commit()
    db.refresh(order)

    return {
        "order_id":          order.id,
        "order_number":      order.order_number,
        "razorpay_order_id": rz_order["id"],
        "amount_paise":      int(total * 100),
        "amount_inr":        float(total),
        "currency":          "INR",
        "demo_mode":         rz_order.get("demo", False),
        "key_id":            razorpay_service.get_key_id(),
    }


@router.post("/verify-payment", response_model=dict)
async def verify_payment(
    body: PaymentVerifyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    1. Verify HMAC signature from Razorpay.
    2. Mark payment captured.
    3. Mark order confirmed.
    4. Generate invoice PDF.
    5. Send email + return WhatsApp URL.
    """
    payment = (
        db.query(Payment)
        .filter(Payment.razorpay_order_id == body.razorpay_order_id)
        .first()
    )
    if not payment:
        raise HTTPException(404, "Payment record not found")

    order = db.query(Order).filter(Order.id == payment.order_id).first()

    # Verify signature (skip in demo mode)
    demo_mode = body.razorpay_order_id.startswith("demo_")
    if not demo_mode:
        valid = razorpay_service.verify_payment_signature(
            body.razorpay_order_id,
            body.razorpay_payment_id,
            body.razorpay_signature,
        )
        if not valid:
            payment.status = "failed"
            payment.error_message = "Signature verification failed"
            db.commit()
            raise HTTPException(400, "Payment verification failed — invalid signature")

        # Fetch method from Razorpay
        try:
            rz_payment = razorpay_service.fetch_payment_details(body.razorpay_payment_id)
            payment.method = rz_payment.get("method")
        except Exception:
            pass

    # Update payment
    payment.razorpay_payment_id = body.razorpay_payment_id
    payment.razorpay_signature  = body.razorpay_signature
    payment.status              = "captured"
    payment.captured_at         = datetime.utcnow()

    # Update order
    order.status = "confirmed"
    db.flush()

    # Generate invoice
    inv_number = _generate_invoice_number(order.id)
    invoice = Invoice(
        order_id        = order.id,
        invoice_number  = inv_number,
        subtotal        = order.subtotal,
        tax_rate        = float(TAX_RATE),
        tax_amount      = order.tax_amount,
        shipping_amount = order.shipping_amount,
        total_amount    = order.total_amount,
    )
    db.add(invoice)
    db.flush()

    # Build PDF
    try:
        pdf_url = invoice_service.generate_invoice_pdf(order, invoice, settings.UPLOAD_DIR)
        invoice.pdf_url = pdf_url
    except Exception as e:
        print(f"[invoice] PDF generation failed: {e}")
        pdf_url = None

    # Phase 4: create initial tracking event + token
    from models.tracking import OrderTrackingEvent as TrackingEvent, TrackingToken
    import uuid as _uuid
    initial_event = TrackingEvent(
        order_id   = order.id,
        status     = "order_placed",
        notes      = "Your order has been confirmed and payment received. Our artisans will begin working shortly.",
        updated_by = "System",
    )
    db.add(initial_event)
    tracking_token_obj = db.query(TrackingToken).filter(TrackingToken.order_id == order.id).first()
    if not tracking_token_obj:
        tracking_token_obj = TrackingToken(token=_uuid.uuid4().hex, order_id=order.id)
        db.add(tracking_token_obj)

    db.commit()
    db.refresh(order)
    db.refresh(invoice)
    tracking_token = tracking_token_obj.token

    # Notifications in background
    def _notify():
        pdf_real_path = pdf_url.lstrip("/").replace("uploads/", settings.UPLOAD_DIR + "/", 1) if pdf_url else None
        notification_service.send_order_confirmation_email(order, invoice, pdf_real_path)

    background_tasks.add_task(_notify)

    whatsapp_url = notification_service.build_whatsapp_order_url(order, invoice)

    return {
        "success":         True,
        "order_id":        order.id,
        "order_number":    order.order_number,
        "invoice_number":  invoice.invoice_number,
        "invoice_pdf_url": pdf_url,
        "whatsapp_url":    whatsapp_url,
        "tracking_token":  tracking_token,
        "tracking_url":    f"/track/{tracking_token}",
        "total_amount":    float(order.total_amount),
    }


@router.get("/orders", response_model=List[OrderOut])
def list_orders(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.post("/orders/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    allowed = {"pending", "confirmed", "processing", "shipped", "delivered", "cancelled"}
    if status not in allowed:
        raise HTTPException(400, f"Status must be one of: {', '.join(allowed)}")
    order.status = status
    db.commit()
    return {"order_id": order_id, "status": status}


@router.get("/invoice/{order_id}")
def download_invoice(order_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    if not invoice or not invoice.pdf_url:
        raise HTTPException(404, "Invoice not found or PDF not yet generated")

    # Resolve to filesystem path
    pdf_path = invoice.pdf_url.lstrip("/")
    if not os.path.exists(pdf_path):
        pdf_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(invoice.pdf_url))

    if not os.path.exists(pdf_path):
        raise HTTPException(404, "Invoice PDF file not found on disk")

    return FileResponse(
        path         = pdf_path,
        media_type   = "application/pdf",
        filename     = f"invoice_{invoice.invoice_number.replace('/', '-')}.pdf",
    )
