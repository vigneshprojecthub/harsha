from fastapi import APIRouter, Depends
from core.auth import get_current_admin, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from models.models import Category, Product

router = APIRouter(dependencies=[Depends(get_current_admin)])

@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    """Seed the database with initial categories and sample products"""
    categories_data = [
        {"name": "Aari Work", "slug": "aari-work", "description": "Traditional Aari embroidery with intricate needle work", "image_url": "/uploads/cat-aari.jpg"},
        {"name": "Thread Embroidery", "slug": "thread-embroidery", "description": "Beautiful thread work in vibrant colors", "image_url": "/uploads/cat-thread.jpg"},
        {"name": "Bead Work", "slug": "bead-work", "description": "Stunning bead arrangements on fabric and frames", "image_url": "/uploads/cat-bead.jpg"},
        {"name": "Sequence Work", "slug": "sequence-work", "description": "Glamorous sequin embellishments", "image_url": "/uploads/cat-sequence.jpg"},
        {"name": "Wedding Frames", "slug": "wedding-frames", "description": "Handcrafted wedding photo frames with embroidery", "image_url": "/uploads/cat-wedding.jpg"},
    ]

    created_cats = {}
    for cat_data in categories_data:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            cat = Category(**cat_data)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            created_cats[cat_data["slug"]] = cat.id
        else:
            created_cats[cat_data["slug"]] = existing.id

    products_data = [
        {
            "name": "Bridal Blouse Aari Work",
            "description": "Stunning hand-crafted Aari work blouse with gold and silver thread detailing. Perfect for weddings and special occasions.",
            "category_id": created_cats["aari-work"],
            "price": 2500.0,
            "images": [],
            "customizable": True,
            "is_featured": True,
            "stock": 10
        },
        {
            "name": "Floral Thread Embroidery Cushion",
            "description": "Hand-embroidered cushion cover with delicate floral patterns in multi-color threads.",
            "category_id": created_cats["thread-embroidery"],
            "price": 850.0,
            "images": [],
            "customizable": True,
            "is_featured": True,
            "stock": 25
        },
        {
            "name": "Peacock Bead Work Saree Border",
            "description": "Intricate peacock motif bead work saree border with handcrafted beading.",
            "category_id": created_cats["bead-work"],
            "price": 3200.0,
            "images": [],
            "customizable": True,
            "is_featured": True,
            "stock": 5
        },
        {
            "name": "Bridal Sequence Lehenga Panel",
            "description": "Exquisite sequence work on lehenga panels with mirror work accents.",
            "category_id": created_cats["sequence-work"],
            "price": 5500.0,
            "images": [],
            "customizable": True,
            "is_featured": True,
            "stock": 3
        },
        {
            "name": "Wedding Memory Frame",
            "description": "Personalized wedding photo frame with Aari work border and couple names embroidered.",
            "category_id": created_cats["wedding-frames"],
            "price": 1800.0,
            "images": [],
            "customizable": True,
            "is_featured": True,
            "stock": 15
        },
        {
            "name": "Aari Work Dupatta",
            "description": "Lightweight chiffon dupatta with hand-crafted Aari embroidery borders.",
            "category_id": created_cats["aari-work"],
            "price": 1200.0,
            "images": [],
            "customizable": False,
            "is_featured": False,
            "stock": 20
        },
    ]

    for prod_data in products_data:
        existing = db.query(Product).filter(Product.name == prod_data["name"]).first()
        if not existing:
            product = Product(**prod_data)
            db.add(product)
    db.commit()

    return {"message": "Database seeded successfully", "categories": len(categories_data), "products": len(products_data)}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    from models.models import CustomOrder
    return {
        "total_products": db.query(Product).count(),
        "total_categories": db.query(Category).count(),
        "total_orders": db.query(CustomOrder).count(),
        "pending_orders": db.query(CustomOrder).filter(CustomOrder.status == "pending").count(),
    }
