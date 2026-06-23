from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from core.database import engine, Base
from routers import products, categories, orders, admin, preview, checkout, tracking, phase5
import models.preview
import models.order
import models.tracking
import models.phase5

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Harsha Art Gallery API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(products.router,  prefix="/api/products",   tags=["products"])
app.include_router(categories.router,prefix="/api/categories", tags=["categories"])
app.include_router(orders.router,    prefix="/api/orders",     tags=["custom-orders"])
app.include_router(admin.router,     prefix="/api/admin",      tags=["admin"])
app.include_router(preview.router,   prefix="/api/preview",    tags=["ai-preview"])
app.include_router(checkout.router,  prefix="/api/checkout",   tags=["checkout"])
app.include_router(tracking.router,  prefix="/api/tracking",   tags=["tracking"])
app.include_router(phase5.router,    prefix="/api",            tags=["phase5"])

@app.get("/")
def root():
    return {"message": "Harsha Art Gallery API v5", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
