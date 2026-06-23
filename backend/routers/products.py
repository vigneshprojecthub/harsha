from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.config import settings
from models.models import Product, Category
from schemas.schemas import ProductCreate, ProductUpdate, ProductOut
from services.storage import upload_file, delete_file

router = APIRouter()

@router.get("/", response_model=List[ProductOut])
def get_products(
    skip: int = 0,
    limit: int = 20,
    category_id: Optional[int] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if featured is not None:
        query = query.filter(Product.is_featured == featured)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductOut)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Delete images from storage
    for img_url in (db_product.images or []):
        await delete_file(img_url)
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    url = await upload_file(file, folder="harsha-gallery/products", upload_dir=settings.UPLOAD_DIR)
    return {"url": url, "filename": url.split("/")[-1]}
