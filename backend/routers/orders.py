from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.config import settings
from models.models import CustomOrder
from schemas.schemas import CustomOrderCreate, CustomOrderOut
from services.storage import upload_file

router = APIRouter()

@router.post("/custom", response_model=CustomOrderOut)
def create_custom_order(order: CustomOrderCreate, db: Session = Depends(get_db)):
    db_order = CustomOrder(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/custom", response_model=List[CustomOrderOut])
def get_custom_orders(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(CustomOrder).offset(skip).limit(limit).all()

@router.get("/custom/{order_id}", response_model=CustomOrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(CustomOrder).filter(CustomOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.patch("/custom/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(CustomOrder).filter(CustomOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return {"message": "Status updated", "status": status}

@router.post("/upload-reference")
async def upload_reference_image(file: UploadFile = File(...)):
    url = await upload_file(file, folder="harsha-gallery/references", upload_dir=settings.UPLOAD_DIR)
    return {"url": url}
