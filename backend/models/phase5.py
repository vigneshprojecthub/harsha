"""
Phase 5 Models
- Review           : star rating + text + photos per product/order
- Coupon           : discount codes with usage tracking
- AbandonedCart    : snapshot of carts not converted
- Referral         : referrer → referee tracking with rewards
- AnalyticsEvent   : lightweight event log for conversion funnel
"""

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float,
    DateTime, ForeignKey, JSON, Numeric, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id",   ondelete="SET NULL"),  nullable=True)

    # Reviewer (no account required — stored by name/phone)
    reviewer_name  = Column(String(200), nullable=False)
    reviewer_phone = Column(String(20),  nullable=True)
    reviewer_email = Column(String(200), nullable=True)

    rating   = Column(Integer, nullable=False)    # 1–5
    title    = Column(String(200), nullable=True)
    body     = Column(Text,        nullable=True)
    photos   = Column(JSON, default=[])           # list of URLs

    is_verified  = Column(Boolean, default=False)   # admin-verified purchase
    is_published = Column(Boolean, default=True)    # admin can hide
    is_featured  = Column(Boolean, default=False)   # show on homepage

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("order_id", "product_id", name="uq_review_order_product"),
    )


class Coupon(Base):
    __tablename__ = "coupons"

    id         = Column(Integer, primary_key=True, index=True)
    code       = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(String(300), nullable=True)

    # Type: "percent" | "flat"
    discount_type  = Column(String(20),  default="percent")
    discount_value = Column(Numeric(10, 2), nullable=False)   # % or ₹ off
    min_order_value = Column(Numeric(10, 2), default=0)
    max_discount    = Column(Numeric(10, 2), nullable=True)   # cap for percent coupons

    # Validity
    valid_from  = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    is_active   = Column(Boolean, default=True)

    # Usage limits
    max_uses     = Column(Integer, nullable=True)   # None = unlimited
    uses_per_user = Column(Integer, default=1)
    total_used   = Column(Integer, default=0)

    # Festival / campaign tag
    campaign = Column(String(100), nullable=True)   # e.g. "diwali2025"

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usages = relationship("CouponUsage", back_populates="coupon")


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id         = Column(Integer, primary_key=True, index=True)
    coupon_id  = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False)
    order_id   = Column(Integer, ForeignKey("orders.id",  ondelete="SET NULL"),  nullable=True)
    phone      = Column(String(20), nullable=True)
    discount_given = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    coupon = relationship("Coupon", back_populates="usages")


class AbandonedCart(Base):
    __tablename__ = "abandoned_carts"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)

    # Contact (may be partial — filled as user types in checkout)
    phone = Column(String(20), nullable=True, index=True)
    email = Column(String(200), nullable=True)
    name  = Column(String(200), nullable=True)

    cart_data  = Column(JSON, nullable=False)   # array of cart items
    total_value = Column(Numeric(10, 2), default=0)

    # Recovery tracking
    reminder_sent_count = Column(Integer, default=0)
    last_reminder_at    = Column(DateTime(timezone=True), nullable=True)
    recovered           = Column(Boolean, default=False)  # True if they completed checkout
    recovered_order_id  = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())


class Referral(Base):
    __tablename__ = "referrals"

    id           = Column(Integer, primary_key=True, index=True)
    referrer_phone = Column(String(20), nullable=False, index=True)
    referrer_name  = Column(String(200), nullable=True)
    referee_phone  = Column(String(20), nullable=False, index=True)
    referee_name   = Column(String(200), nullable=True)

    referral_code  = Column(String(20), unique=True, nullable=False, index=True)

    # Reward tracking
    referee_order_id    = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    referrer_rewarded   = Column(Boolean, default=False)
    referee_rewarded    = Column(Boolean, default=False)
    reward_coupon_code  = Column(String(30), nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class AnalyticsEvent(Base):
    """Lightweight funnel event log — no third-party dependency."""
    __tablename__ = "analytics_events"

    id         = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    # Types: page_view | product_view | add_to_cart | checkout_start
    #        payment_start | order_complete | coupon_applied | review_submitted

    session_id  = Column(String(64), nullable=True, index=True)
    product_id  = Column(Integer, nullable=True)
    order_id    = Column(Integer, nullable=True)
    value       = Column(Float, nullable=True)      # monetary value where relevant
    event_metadata = Column("metadata", JSON, nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
