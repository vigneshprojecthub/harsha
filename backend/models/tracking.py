"""
Phase 4: Order Tracking Models
- OrderTrackingEvent  : one row per status change with notes + timestamp
- OrderProgressPhoto  : artisan uploads progress photos per event
- TrackingToken       : short-lived public token so customers track without login
"""

from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


# ── 8 customer-facing statuses ───────────────────────────────────────────────
TRACKING_STATUSES = [
    "order_placed",
    "design_approval",
    "embroidery_started",
    "in_progress",
    "quality_check",
    "packed",
    "shipped",
    "delivered",
]

STATUS_META = {
    "order_placed":      {"label": "Order Placed",       "icon": "📋", "color": "#c8860f"},
    "design_approval":   {"label": "Design Approval",    "icon": "✏️",  "color": "#9b59b6"},
    "embroidery_started":{"label": "Embroidery Started", "icon": "🪡",  "color": "#2980b9"},
    "in_progress":       {"label": "In Progress",        "icon": "⚙️",  "color": "#f39c12"},
    "quality_check":     {"label": "Quality Check",      "icon": "🔍",  "color": "#27ae60"},
    "packed":            {"label": "Packed",             "icon": "📦",  "color": "#16a085"},
    "shipped":           {"label": "Shipped",            "icon": "🚚",  "color": "#2c3e50"},
    "delivered":         {"label": "Delivered",          "icon": "🎉",  "color": "#27ae60"},
}


class OrderTrackingEvent(Base):
    __tablename__ = "order_tracking_events"

    id       = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    status     = Column(String(50),  nullable=False)   # one of TRACKING_STATUSES
    notes      = Column(Text,        nullable=True)    # admin note shown to customer
    admin_note = Column(Text,        nullable=True)    # internal note (not shown)
    updated_by = Column(String(100), nullable=True)    # admin name/ID

    # Notifications sent flags
    whatsapp_sent = Column(Boolean, default=False)
    email_sent    = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order  = relationship("Order",               back_populates="tracking_events")
    photos = relationship("OrderProgressPhoto",  back_populates="event", cascade="all, delete-orphan")


class OrderProgressPhoto(Base):
    __tablename__ = "order_progress_photos"

    id       = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("order_tracking_events.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id",                ondelete="CASCADE"), nullable=False)

    url       = Column(String(500), nullable=False)
    caption   = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("OrderTrackingEvent", back_populates="photos")


class TrackingToken(Base):
    """
    Short-lived public token that lets customers view their order
    without creating an account. Generated at order confirmation.
    """
    __tablename__ = "tracking_tokens"

    id       = Column(Integer, primary_key=True, index=True)
    token    = Column(String(64), unique=True, nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # None = never expires
