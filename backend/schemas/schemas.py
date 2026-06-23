from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    price: float
    images: Optional[List[str]] = []
    customizable: bool = False
    is_featured: bool = False
    stock: int = 0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None
    customizable: Optional[bool] = None
    is_featured: Optional[bool] = None
    stock: Optional[int] = None

class ProductOut(ProductBase):
    id: int
    category: CategoryOut
    created_at: datetime

    class Config:
        from_attributes = True

# Custom Order Schemas
class CustomOrderCreate(BaseModel):
    customer_name: str
    phone: str
    product_type: str
    reference_image_url: Optional[str] = None
    notes: Optional[str] = None
    delivery_date: Optional[str] = None

class CustomOrderOut(CustomOrderCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
