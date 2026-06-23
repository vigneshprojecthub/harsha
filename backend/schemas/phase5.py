from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ── Reviews ──────────────────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    product_id:     Optional[int] = None
    order_id:       Optional[int] = None
    reviewer_name:  str
    reviewer_phone: Optional[str] = None
    reviewer_email: Optional[str] = None
    rating:         int
    title:          Optional[str] = None
    body:           Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class ReviewUpdate(BaseModel):
    is_published: Optional[bool] = None
    is_featured:  Optional[bool] = None
    is_verified:  Optional[bool] = None

class ReviewOut(BaseModel):
    id:             int
    product_id:     Optional[int]
    order_id:       Optional[int]
    reviewer_name:  str
    rating:         int
    title:          Optional[str]
    body:           Optional[str]
    photos:         List[str]
    is_verified:    bool
    is_published:   bool
    is_featured:    bool
    created_at:     datetime

    class Config:
        from_attributes = True


# ── Coupons ───────────────────────────────────────────────────────────────────
class CouponCreate(BaseModel):
    code:            str
    description:     Optional[str] = None
    discount_type:   str = "percent"   # "percent" | "flat"
    discount_value:  Decimal
    min_order_value: Decimal = Decimal("0")
    max_discount:    Optional[Decimal] = None
    valid_from:      Optional[datetime] = None
    valid_until:     Optional[datetime] = None
    max_uses:        Optional[int] = None
    uses_per_user:   int = 1
    campaign:        Optional[str] = None

class CouponValidateRequest(BaseModel):
    code:        str
    order_value: Decimal
    phone:       Optional[str] = None

class CouponValidateResponse(BaseModel):
    valid:           bool
    discount_amount: Decimal = Decimal("0")
    message:         str
    coupon:          Optional["CouponOut"] = None

class CouponOut(BaseModel):
    id:              int
    code:            str
    description:     Optional[str]
    discount_type:   str
    discount_value:  Decimal
    min_order_value: Decimal
    max_discount:    Optional[Decimal]
    valid_until:     Optional[datetime]
    is_active:       bool
    total_used:      int
    max_uses:        Optional[int]
    campaign:        Optional[str]

    class Config:
        from_attributes = True

CouponValidateResponse.model_rebuild()


# ── Abandoned Cart ────────────────────────────────────────────────────────────
class AbandonedCartUpsert(BaseModel):
    session_id:  str
    phone:       Optional[str] = None
    email:       Optional[str] = None
    name:        Optional[str] = None
    cart_data:   list
    total_value: Decimal = Decimal("0")

class AbandonedCartOut(BaseModel):
    id:                  int
    session_id:          str
    phone:               Optional[str]
    name:                Optional[str]
    total_value:         Decimal
    cart_data:           list
    reminder_sent_count: int
    recovered:           bool
    created_at:          datetime

    class Config:
        from_attributes = True


# ── Referral ──────────────────────────────────────────────────────────────────
class ReferralCreate(BaseModel):
    referrer_phone: str
    referrer_name:  Optional[str] = None

class ReferralOut(BaseModel):
    id:              int
    referrer_phone:  str
    referrer_name:   Optional[str]
    referral_code:   str
    referee_phone:   Optional[str]
    referee_order_id: Optional[int]
    referrer_rewarded: bool
    reward_coupon_code: Optional[str]
    created_at:      datetime

    class Config:
        from_attributes = True


# ── Analytics ─────────────────────────────────────────────────────────────────
class AnalyticsEventIn(BaseModel):
    event_type: str
    session_id: Optional[str] = None
    product_id: Optional[int] = None
    order_id:   Optional[int] = None
    value:      Optional[float] = None
    metadata:   Optional[dict] = None
