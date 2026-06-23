from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float,
    DateTime, ForeignKey, JSON, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, nullable=False, index=True)

    # Customer
    customer_name  = Column(String(200), nullable=False)
    customer_email = Column(String(200), nullable=True)
    customer_phone = Column(String(20), nullable=False)

    # Shipping address
    address_line1  = Column(String(300), nullable=False)
    address_line2  = Column(String(300), nullable=True)
    city           = Column(String(100), nullable=False)
    state          = Column(String(100), nullable=False)
    pincode        = Column(String(20),  nullable=False)
    country        = Column(String(100), default="India")

    # Delivery
    delivery_notes = Column(Text, nullable=True)

    # Financials (stored in paise for Razorpay compat, displayed in ₹)
    subtotal        = Column(Numeric(10, 2), default=0)
    tax_amount      = Column(Numeric(10, 2), default=0)
    shipping_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount    = Column(Numeric(10, 2), nullable=False)

    # Status: pending | confirmed | processing | shipped | delivered | cancelled
    status = Column(String(50), default="pending")

    # Razorpay order reference
    razorpay_order_id = Column(String(100), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items    = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment  = relationship("Payment",   back_populates="order", uselist=False)
    invoice  = relationship("Invoice",   back_populates="order", uselist=False)

    tracking_events = relationship(
        "OrderTrackingEvent",
        back_populates="order",
        cascade="all, delete-orphan"
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)

    # Snapshot of product at time of order
    product_id          = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name        = Column(String(200), nullable=False)
    product_category    = Column(String(100), nullable=True)
    unit_price          = Column(Numeric(10, 2), nullable=False)
    quantity            = Column(Integer, default=1)
    line_total          = Column(Numeric(10, 2), nullable=False)

    # Custom config (from AI preview / custom order)
    custom_config       = Column(JSON, nullable=True)
    ai_preview_id       = Column(Integer, ForeignKey("ai_previews.id", ondelete="SET NULL"), nullable=True)
    is_custom           = Column(Boolean, default=False)

    order = relationship("Order", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id       = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Razorpay IDs
    razorpay_order_id   = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    razorpay_signature  = Column(String(300), nullable=True)

    amount        = Column(Numeric(10, 2), nullable=False)   # in ₹
    currency      = Column(String(10), default="INR")
    method        = Column(String(50), nullable=True)         # card / upi / netbanking

    # Status: created | attempted | captured | failed | refunded
    status = Column(String(50), default="created")

    error_code    = Column(String(100), nullable=True)
    error_message = Column(Text,         nullable=True)

    captured_at = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="payment")


class Invoice(Base):
    __tablename__ = "invoices"

    id       = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)

    invoice_number = Column(String(30), unique=True, nullable=False)
    invoice_date   = Column(DateTime(timezone=True), server_default=func.now())

    # PDF stored locally
    pdf_url = Column(String(500), nullable=True)

    # Snapshot of totals at invoice time
    subtotal        = Column(Numeric(10, 2), default=0)
    tax_rate        = Column(Float, default=18.0)   # GST 18%
    tax_amount      = Column(Numeric(10, 2), default=0)
    shipping_amount = Column(Numeric(10, 2), default=0)
    total_amount    = Column(Numeric(10, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="invoice")
