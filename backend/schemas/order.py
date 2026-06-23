from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ── Cart Item (frontend sends, we validate) ──────────────────────────────────
class CartItemIn(BaseModel):
    product_id:       int
    product_name:     str
    product_category: Optional[str] = None
    unit_price:       Decimal
    quantity:         int = 1
    custom_config:    Optional[dict] = None
    ai_preview_id:    Optional[int] = None
    is_custom:        bool = False


# ── Checkout ─────────────────────────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    # Customer
    customer_name:  str
    customer_email: Optional[str] = None
    customer_phone: str

    # Shipping
    address_line1:  str
    address_line2:  Optional[str] = None
    city:           str
    state:          str
    pincode:        str
    country:        str = "India"
    delivery_notes: Optional[str] = None

    # Cart
    items: List[CartItemIn]


# ── Order Out ─────────────────────────────────────────────────────────────────
class OrderItemOut(BaseModel):
    id:               int
    product_id:       Optional[int]
    product_name:     str
    product_category: Optional[str]
    unit_price:       Decimal
    quantity:         int
    line_total:       Decimal
    is_custom:        bool
    custom_config:    Optional[dict]
    ai_preview_id:    Optional[int]

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id:               int
    order_number:     str
    customer_name:    str
    customer_email:   Optional[str]
    customer_phone:   str
    address_line1:    str
    address_line2:    Optional[str]
    city:             str
    state:            str
    pincode:          str
    country:          str
    delivery_notes:   Optional[str]
    subtotal:         Decimal
    tax_amount:       Decimal
    shipping_amount:  Decimal
    discount_amount:  Decimal
    total_amount:     Decimal
    status:           str
    razorpay_order_id: Optional[str]
    created_at:       datetime
    items:            List[OrderItemOut]

    class Config:
        from_attributes = True


# ── Payment ───────────────────────────────────────────────────────────────────
class PaymentVerifyRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str


class PaymentOut(BaseModel):
    id:                  int
    order_id:            int
    razorpay_order_id:   Optional[str]
    razorpay_payment_id: Optional[str]
    amount:              Decimal
    currency:            str
    method:              Optional[str]
    status:              str
    captured_at:         Optional[datetime]
    created_at:          datetime

    class Config:
        from_attributes = True


# ── Invoice ───────────────────────────────────────────────────────────────────
class InvoiceOut(BaseModel):
    id:             int
    order_id:       int
    invoice_number: str
    invoice_date:   datetime
    pdf_url:        Optional[str]
    subtotal:       Decimal
    tax_rate:       float
    tax_amount:     Decimal
    shipping_amount: Decimal
    total_amount:   Decimal

    class Config:
        from_attributes = True
