from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from core.database import Base


class AIPreview(Base):
    __tablename__ = "ai_previews"

    id = Column(Integer, primary_key=True, index=True)

    # Linked order (optional – set after user confirms)
    order_id = Column(Integer, ForeignKey("custom_orders.id", ondelete="SET NULL"), nullable=True)

    # Stored file paths / URLs
    original_image_url = Column(String(500), nullable=False)   # garment photo
    reference_image_url = Column(String(500), nullable=True)   # embroidery reference
    generated_preview_url = Column(String(500), nullable=True) # AI output

    # Generation metadata
    prompt = Column(Text, nullable=True)
    custom_instructions = Column(Text, nullable=True)
    replicate_prediction_id = Column(String(200), nullable=True)
    model_version = Column(String(200), nullable=True)

    # Status: pending | processing | completed | failed
    status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)

    # Timing
    generation_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
