from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models.tracking import STATUS_META, TRACKING_STATUSES


class TrackingEventCreate(BaseModel):
    status:     str
    notes:      Optional[str] = None
    admin_note: Optional[str] = None
    updated_by: Optional[str] = "Admin"


class TrackingEventOut(BaseModel):
    id:         int
    order_id:   int
    status:     str
    notes:      Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    photos:     List["ProgressPhotoOut"] = []

    # Computed fields
    @property
    def status_label(self) -> str:
        return STATUS_META.get(self.status, {}).get("label", self.status)

    @property
    def status_icon(self) -> str:
        return STATUS_META.get(self.status, {}).get("icon", "📌")

    class Config:
        from_attributes = True


class ProgressPhotoOut(BaseModel):
    id:        int
    order_id:  int
    url:       str
    caption:   Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Resolve forward ref
TrackingEventOut.model_rebuild()


class TrackingTokenOut(BaseModel):
    token:    str
    order_id: int

    class Config:
        from_attributes = True


class OrderTimelineOut(BaseModel):
    """Full timeline returned to customer (public / via token)."""
    order_id:     int
    order_number: str
    current_status: str
    current_status_label: str
    current_status_icon:  str
    customer_name: str
    events:       List[TrackingEventOut]
    all_statuses: List[dict]   # ordered list with completed/active/upcoming

    class Config:
        from_attributes = True


class WSMessage(BaseModel):
    """Shape of messages broadcast over WebSocket."""
    type:      str          # "status_update" | "photo_added" | "ping"
    order_id:  Optional[int] = None
    status:    Optional[str] = None
    label:     Optional[str] = None
    icon:      Optional[str] = None
    notes:     Optional[str] = None
    photo_url: Optional[str] = None
    timestamp: Optional[str] = None
