"""
Cloudinary Storage Service
--------------------------
Replaces local disk uploads with Cloudinary CDN.
Falls back to local disk if Cloudinary is not configured.

Setup:
1. Sign up at cloudinary.com (free — 25 GB storage)
2. Dashboard → API Keys → copy Cloud Name, API Key, API Secret
3. Add to .env:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
"""

import os
import uuid
import shutil
from typing import Optional
from fastapi import UploadFile

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY    = os.getenv("CLOUDINARY_API_KEY",    "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

_cloudinary_configured = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

if _cloudinary_configured:
    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name = CLOUDINARY_CLOUD_NAME,
            api_key    = CLOUDINARY_API_KEY,
            api_secret = CLOUDINARY_API_SECRET,
            secure     = True,
        )
        print("[cloudinary] Configured ✓")
    except ImportError:
        _cloudinary_configured = False
        print("[cloudinary] cloudinary package not installed — falling back to local disk")
else:
    print("[cloudinary] Not configured — using local disk uploads")


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB   = 10


async def upload_file(
    file: UploadFile,
    folder: str = "harsha-gallery",
    upload_dir: str = "uploads",
) -> str:
    """
    Upload a file to Cloudinary (if configured) or local disk.
    Returns the public URL string.
    """
    # Validate type
    if file.content_type not in ALLOWED_TYPES:
        from fastapi import HTTPException
        raise HTTPException(400, f"Only images allowed (got {file.content_type})")

    content = await file.read()

    # Validate size
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        from fastapi import HTTPException
        raise HTTPException(400, f"File too large (max {MAX_SIZE_MB} MB)")

    if _cloudinary_configured:
        return await _upload_to_cloudinary(content, folder, file.filename or "upload")
    else:
        return _save_to_disk(content, file.filename or "upload.jpg", upload_dir)


async def _upload_to_cloudinary(content: bytes, folder: str, filename: str) -> str:
    """Upload bytes to Cloudinary, return secure URL."""
    import asyncio
    import io

    public_id = f"{folder}/{uuid.uuid4().hex}"
    file_obj   = io.BytesIO(content)

    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: cloudinary.uploader.upload(
            file_obj,
            public_id     = public_id,
            folder        = folder,
            overwrite     = True,
            resource_type = "image",
            quality       = "auto:good",   # auto-compress
            fetch_format  = "auto",        # serve WebP to browsers that support it
        )
    )
    url = result.get("secure_url", "")
    print(f"[cloudinary] Uploaded → {url}")
    return url


def _save_to_disk(content: bytes, filename: str, upload_dir: str) -> str:
    """Fallback: save to local disk, return relative /uploads/ path."""
    os.makedirs(upload_dir, exist_ok=True)
    ext      = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    fname    = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, fname)
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{fname}"


async def delete_file(url: str) -> bool:
    """Delete a file from Cloudinary or local disk."""
    if not url:
        return False

    if _cloudinary_configured and url.startswith("https://res.cloudinary.com"):
        try:
            # Extract public_id from URL
            # e.g. https://res.cloudinary.com/cloud/image/upload/v123/harsha-gallery/abc.jpg
            # → public_id = harsha-gallery/abc
            parts = url.split("/upload/")
            if len(parts) == 2:
                path      = parts[1]
                # Strip version segment (v1234567890/)
                if path.startswith("v") and "/" in path:
                    path = path.split("/", 1)[1]
                public_id = path.rsplit(".", 1)[0]
                cloudinary.uploader.destroy(public_id)
                return True
        except Exception as e:
            print(f"[cloudinary] Delete failed: {e}")
        return False

    # Local disk
    if url.startswith("/uploads/"):
        local_path = url.lstrip("/")
        if os.path.exists(local_path):
            os.remove(local_path)
            return True
    return False


def is_cloudinary_url(url: str) -> bool:
    return url.startswith("https://res.cloudinary.com")


def get_storage_type() -> str:
    return "cloudinary" if _cloudinary_configured else "local"
