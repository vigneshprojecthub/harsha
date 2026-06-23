from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

logger = logging.getLogger(__name__)

# ── App setup FIRST (before DB) so /health always responds ───────────────────
app = FastAPI(title="Harsha Art Gallery API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten after confirming frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Health check (no DB needed) ───────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Harsha Art Gallery API v5", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ── Database + routers (wrapped so startup error is logged, not fatal) ────────
def _setup_db_and_routers():
    try:
        from core.database import engine, Base
        import models.preview
        import models.order
        import models.tracking
        import models.phase5

        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified ✓")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.error("Check that DATABASE_URL env var is set to your Neon connection string.")
        # Don't raise — let the app start so /health still works
        return

    from routers import products, categories, orders, admin, preview, checkout, tracking, phase5

    app.include_router(products.router,   prefix="/api/products",   tags=["products"])
    app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
    app.include_router(orders.router,     prefix="/api/orders",     tags=["custom-orders"])
    app.include_router(admin.router,      prefix="/api/admin",      tags=["admin"])
    app.include_router(preview.router,    prefix="/api/preview",    tags=["ai-preview"])
    app.include_router(checkout.router,   prefix="/api/checkout",   tags=["checkout"])
    app.include_router(tracking.router,   prefix="/api/tracking",   tags=["tracking"])
    app.include_router(phase5.router,     prefix="/api",            tags=["phase5"])

    logger.info("All routers registered ✓")


_setup_db_and_routers()


@app.get("/health/db")
def health_db():
    """Check database connectivity — use this to debug Neon connection."""
    from core.database import check_db_connection
    db_ok = check_db_connection()
    return {
        "status":   "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
    }
