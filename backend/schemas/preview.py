from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AIPreviewCreate(BaseModel):
    original_image_url: str
    reference_image_url: Optional[str] = None
    custom_instructions: Optional[str] = None


class AIPreviewGenerateRequest(BaseModel):
    preview_id: int
    custom_instructions: Optional[str] = None


class AIPreviewLinkOrder(BaseModel):
    order_id: int


class AIPreviewOut(BaseModel):
    id: int
    order_id: Optional[int] = None
    original_image_url: str
    reference_image_url: Optional[str] = None
    generated_preview_url: Optional[str] = None
    prompt: Optional[str] = None
    custom_instructions: Optional[str] = None
    replicate_prediction_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    generation_seconds: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
