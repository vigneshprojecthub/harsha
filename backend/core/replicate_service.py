"""
Replicate AI service for embroidery preview generation.

Uses img2img with ControlNet / inpainting approach:
  - Model: stability-ai/stable-diffusion-img2img  (fast, reliable)
  - Fallback: black-forest-labs/flux-dev for higher fidelity

The flow:
  1. User uploads garment + embroidery reference
  2. We build a rich prompt describing the embroidery style
  3. Replicate processes and returns the generated preview URL
  4. We download + save it locally
"""

import httpx
import asyncio
import time
import os
import uuid
from typing import Optional

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "")
BASE_URL = "https://api.replicate.com/v1"

# Primary model: stable-diffusion-img2img (fast, good for garment overlay)
SD_IMG2IMG_VERSION = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"

# Alternative: FLUX for higher quality
FLUX_VERSION = "black-forest-labs/flux-dev"


def build_embroidery_prompt(custom_instructions: str = "", reference_style: str = "") -> str:
    """
    Build a rich, specific prompt for embroidery overlay generation.
    The more specific the prompt, the better the style preservation.
    """
    base_prompt = (
        "A garment with intricate handcrafted embroidery work, "
        "traditional Indian Aari thread embroidery with gold and silk thread, "
        "delicate floral motifs and geometric patterns, "
        "vibrant colors on fabric, close-up photography, "
        "professional fashion photography, soft studio lighting, "
        "highly detailed embroidery stitching, premium quality craftsmanship"
    )

    if reference_style:
        base_prompt += f", {reference_style} style embroidery"

    if custom_instructions and custom_instructions.strip():
        base_prompt += f", {custom_instructions.strip()}"

    base_prompt += (
        ", sharp focus, 8k resolution, photorealistic, "
        "textile art, handmade craftsmanship"
    )

    return base_prompt


def build_negative_prompt() -> str:
    return (
        "blurry, low quality, distorted, ugly, bad anatomy, "
        "watermark, text, logo, cartoon, painting, illustration, "
        "CGI, 3D render, oversaturated, washed out"
    )


async def create_prediction(
    image_url: str,
    prompt: str,
    negative_prompt: str,
    strength: float = 0.65,
) -> dict:
    """
    Submit an img2img prediction to Replicate.
    Returns the prediction object (id + status).
    """
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN is not set in environment variables")

    payload = {
        "version": SD_IMG2IMG_VERSION,
        "input": {
            "image": image_url,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "prompt_strength": strength,   # how much to deviate from original
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
            "scheduler": "DPMSolverMultistep",
            "num_outputs": 1,
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE_URL}/predictions",
            json=payload,
            headers={
                "Authorization": f"Token {REPLICATE_API_TOKEN}",
                "Content-Type": "application/json",
            }
        )
        response.raise_for_status()
        return response.json()


async def poll_prediction(prediction_id: str, max_wait: int = 180) -> dict:
    """
    Poll Replicate until the prediction completes or fails.
    Returns the final prediction object.
    """
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN is not set")

    start = time.time()
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            elapsed = time.time() - start
            if elapsed > max_wait:
                raise TimeoutError(f"Prediction timed out after {max_wait}s")

            response = await client.get(
                f"{BASE_URL}/predictions/{prediction_id}",
                headers={"Authorization": f"Token {REPLICATE_API_TOKEN}"}
            )
            response.raise_for_status()
            data = response.json()

            status = data.get("status")
            if status == "succeeded":
                return data
            elif status == "failed":
                raise RuntimeError(f"Prediction failed: {data.get('error', 'Unknown error')}")
            elif status == "canceled":
                raise RuntimeError("Prediction was canceled")

            # Adaptive polling: faster at start, slower later
            wait = 2 if elapsed < 20 else 4
            await asyncio.sleep(wait)


async def cancel_prediction(prediction_id: str) -> bool:
    """Cancel a running prediction."""
    if not REPLICATE_API_TOKEN:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{BASE_URL}/predictions/{prediction_id}/cancel",
                headers={"Authorization": f"Token {REPLICATE_API_TOKEN}"}
            )
            return r.status_code == 200
    except Exception:
        return False


async def download_and_save_image(url: str, upload_dir: str) -> str:
    """
    Download the generated image from Replicate CDN and save locally.
    Returns the local file path / URL.
    """
    filename = f"preview_{uuid.uuid4()}.png"
    filepath = os.path.join(upload_dir, filename)

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        with open(filepath, "wb") as f:
            f.write(response.content)

    return f"/uploads/{filename}"


async def generate_embroidery_preview(
    image_url: str,              # publicly accessible URL of garment
    custom_instructions: str,
    upload_dir: str,
    strength: float = 0.65,
) -> tuple[str, str, str]:
    """
    Full pipeline: submit → poll → download → return (local_url, prompt, prediction_id)
    """
    prompt = build_embroidery_prompt(custom_instructions=custom_instructions)
    negative_prompt = build_negative_prompt()

    # Submit
    prediction = await create_prediction(
        image_url=image_url,
        prompt=prompt,
        negative_prompt=negative_prompt,
        strength=strength,
    )
    prediction_id = prediction["id"]

    # Wait for completion
    result = await poll_prediction(prediction_id)

    # The output is a list of image URLs
    output_urls = result.get("output", [])
    if not output_urls:
        raise RuntimeError("No output images returned from Replicate")

    output_url = output_urls[0] if isinstance(output_urls, list) else output_urls

    # Download and store locally
    local_url = await download_and_save_image(output_url, upload_dir)

    return local_url, prompt, prediction_id
