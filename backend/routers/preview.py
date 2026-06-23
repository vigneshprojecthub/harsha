"""
AI Preview Router
-----------------
POST /api/preview/upload          - Upload garment + reference images, create preview record
POST /api/preview/{id}/generate   - Trigger Replicate generation (async background task)
GET  /api/preview/{id}            - Poll status + get result
POST /api/preview/{id}/regenerate - Re-run generation with updated instructions
POST /api/preview/{id}/confirm    - Link preview to a custom order
GET  /api/preview/order/{order_id} - All previews for an order
DELETE /api/preview/{id}          - Delete preview + files
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
import os, uuid, shutil, time, asyncio

from core.database import get_db
from core.config import settings
from core.replicate_service import generate_embroidery_preview
from models.preview import AIPreview
from schemas.preview import AIPreviewOut, AIPreviewLinkOrder

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

def _save_upload(file: UploadFile, prefix: str) -> str:
    """Save an uploaded file, return relative URL."""
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "jpg"
    filename = f"{prefix}_{uuid.uuid4()}.{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return f"/uploads/{filename}"


def _public_url(relative_url: str) -> str:
    """Build an absolute URL Replicate can fetch."""
    base = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    return f"{base}{relative_url}"


async def _run_generation(preview_id: int, db_session_factory):
    """Background task: call Replicate, update DB record."""
    # Create a fresh DB session for the background task
    db: Session = db_session_factory()
    try:
        preview = db.query(AIPreview).filter(AIPreview.id == preview_id).first()
        if not preview:
            return

        preview.status = "processing"
        db.commit()

        start = time.time()
        image_url = _public_url(preview.original_image_url)

        local_url, prompt, prediction_id = await generate_embroidery_preview(
            image_url=image_url,
            custom_instructions=preview.custom_instructions or "",
            upload_dir=settings.UPLOAD_DIR,
        )

        elapsed = round(time.time() - start, 1)

        preview.generated_preview_url = local_url
        preview.prompt = prompt
        preview.replicate_prediction_id = prediction_id
        preview.generation_seconds = elapsed
        preview.status = "completed"
        preview.error_message = None
        db.commit()

    except Exception as exc:
        db.query(AIPreview).filter(AIPreview.id == preview_id).update(
            {"status": "failed", "error_message": str(exc)[:500]}
        )
        db.commit()
    finally:
        db.close()


# ── routes ───────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=AIPreviewOut, status_code=201)
async def upload_images(
    background_tasks: BackgroundTasks,
    original_image: UploadFile = File(..., description="Garment / shirt / dress photo"),
    reference_image: Optional[UploadFile] = File(None, description="Embroidery reference (optional)"),
    custom_instructions: Optional[str] = Form(None),
    auto_generate: bool = Form(True, description="Start generation immediately after upload"),
    db: Session = Depends(get_db),
):
    """
    Upload garment + optional embroidery reference, create a preview record,
    and optionally kick off AI generation straight away.
    """
    original_url = _save_upload(original_image, "garment")
    reference_url = _save_upload(reference_image, "ref") if reference_image else None

    preview = AIPreview(
        original_image_url=original_url,
        reference_image_url=reference_url,
        custom_instructions=custom_instructions,
        status="pending",
    )
    db.add(preview)
    db.commit()
    db.refresh(preview)

    if auto_generate:
        from core.database import SessionLocal
        background_tasks.add_task(_run_generation, preview.id, SessionLocal)
        preview.status = "processing"
        db.commit()
        db.refresh(preview)

    return preview


@router.post("/{preview_id}/generate", response_model=AIPreviewOut)
async def trigger_generation(
    preview_id: int,
    background_tasks: BackgroundTasks,
    custom_instructions: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Manually trigger (or re-trigger) AI generation for a preview."""
    preview = db.query(AIPreview).filter(AIPreview.id == preview_id).first()
    if not preview:
        raise HTTPException(404, "Preview not found")
    if preview.status == "processing":
        raise HTTPException(409, "Generation already in progress")

    if custom_instructions is not None:
        preview.custom_instructions = custom_instructions

    preview.status = "processing"
    preview.error_message = None
    preview.generated_preview_url = None
    db.commit()
    db.refresh(preview)

    from core.database import SessionLocal
    background_tasks.add_task(_run_generation, preview.id, SessionLocal)
    return preview


@router.get("/{preview_id}", response_model=AIPreviewOut)
def get_preview(preview_id: int, db: Session = Depends(get_db)):
    """Poll the status and result of a preview (used by frontend long-poll)."""
    preview = db.query(AIPreview).filter(AIPreview.id == preview_id).first()
    if not preview:
        raise HTTPException(404, "Preview not found")
    return preview


@router.post("/{preview_id}/regenerate", response_model=AIPreviewOut)
async def regenerate(
    preview_id: int,
    background_tasks: BackgroundTasks,
    custom_instructions: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Regenerate with new instructions. Resets previous result."""
    preview = db.query(AIPreview).filter(AIPreview.id == preview_id).first()
    if not preview:
        raise HTTPException(404, "Preview not found")

    if custom_instructions is not None:
        preview.custom_instructions = custom_instructions

    preview.status = "processing"
    preview.generated_preview_url = None
    preview.error_message = None
    preview.prompt = None
    preview.replicate_prediction_id = None
    db.commit()
    db.refresh(preview)

    from core.database import SessionLocal
    background_tasks.add_task(_run_generation, preview.id, SessionLocal)
    return preview


@router.post("/{preview_id}/confirm", response_model=AIPreviewOut)
def confirm_and_link(
    preview_id: int,
    body: AIPreviewLinkOrder,
    db: Session = Depends(get_db),
):
    """Link a completed preview to a custom order (user hit 'Confirm Design')."""
    preview = db.query(AIPreview).filter(AIPreview.id == preview_id).first()
    if not preview:
        raise HTTPException(404, "Preview not found")
    if preview.status != "completed":
        raise HTTPException(400, "Preview must be completed before confirming")

    preview.order_id = body.order_id
    db.commit()
    db.refresh(preview)
    return preview


@router.get("/order/{order_id}", response_model=List[AIPreviewOut])
def get_previews_by_order(order_id: int, db: Session = Depends(get_db)):
    return db.query(AIPreview).filter(AIPreview.order_id == order_id).all()


@router.delete("/{preview_id}", status_code=204)
def delete_preview(preview_id: int, db: Session = Depends(get_db)):
    preview = db.query(AIPreview).filter(AIPreview.id == preview_id).first()
    if not preview:
        raise HTTPException(404, "Preview not found")

    # Clean up local files
    for url in [preview.original_image_url, preview.reference_image_url, preview.generated_preview_url]:
        if url:
            local_path = url.lstrip("/").replace("uploads/", settings.UPLOAD_DIR + "/", 1)
            if os.path.exists(local_path):
                os.remove(local_path)

    db.delete(preview)
    db.commit()
