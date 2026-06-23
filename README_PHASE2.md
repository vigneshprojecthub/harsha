# Phase 2 — AI Customization Preview

## What's New

### Backend additions
| File | Purpose |
|------|---------|
| `models/preview.py` | `ai_previews` SQLAlchemy model |
| `schemas/preview.py` | Pydantic request/response schemas |
| `routers/preview.py` | 7 REST endpoints for the full generation lifecycle |
| `core/replicate_service.py` | Replicate API client + prompt engineering |
| `migrate_phase2.sql` | DB migration for the new table |

### Frontend additions
| File | Purpose |
|------|---------|
| `pages/AIPreviewPage.jsx` | 4-step wizard orchestrator |
| `components/preview/StepIndicator.jsx` | Animated progress indicator |
| `components/preview/ImageDropZone.jsx` | Drag-and-drop image upload |
| `components/preview/GeneratingAnimation.jsx` | Animated loading experience |
| `components/preview/PreviewResult.jsx` | Before/after comparison + actions |
| `components/preview/ConfirmOrderModal.jsx` | Final order confirmation |
| `components/landing/AIPreviewBanner.jsx` | Landing page feature section |
| `utils/previewApi.js` | API client + long-polling helper |

---

## Setup for Phase 2

### 1. Get a Replicate API Token

1. Sign up at [replicate.com](https://replicate.com)
2. Go to Account → API tokens → Create token
3. Add to `backend/.env`:
   ```
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

### 2. Set PUBLIC_BASE_URL

Replicate needs to be able to download your uploaded garment image. Set the URL where your backend is reachable:

```env
# Development (use ngrok if testing locally)
PUBLIC_BASE_URL=https://abc123.ngrok.io

# Production
PUBLIC_BASE_URL=https://your-api-domain.com
```

> **Local dev tip**: Run `ngrok http 8000` and paste the HTTPS URL into `PUBLIC_BASE_URL`.

### 3. Apply the database migration

```bash
psql -U postgres -d harsha_gallery -f backend/migrate_phase2.sql
```

Or just restart the FastAPI app — SQLAlchemy will auto-create the table.

### 4. Install new backend dependencies

```bash
cd backend
pip install httpx==0.27.0 replicate==0.29.0
# or
pip install -r requirements.txt
```

---

## API Reference — Preview Endpoints

```
POST /api/preview/upload
  Body (multipart): original_image*, reference_image, custom_instructions, auto_generate
  → Creates preview record, kicks off generation if auto_generate=true
  → Returns: AIPreviewOut

GET  /api/preview/{id}
  → Returns current status + URLs (use for polling)

POST /api/preview/{id}/regenerate
  Body (multipart): custom_instructions (optional)
  → Resets and re-runs generation

POST /api/preview/{id}/confirm
  Body (JSON): { "order_id": 123 }
  → Links preview to a custom order

GET  /api/preview/order/{order_id}
  → All previews for an order

DELETE /api/preview/{id}
  → Deletes preview + cleans up local files
```

---

## AI Model Used

**Stability AI SDXL img2img** via Replicate:
- Model: `stability-ai/sdxl`
- Mode: image-to-image (preserves garment shape)
- Strength: 0.65 (preserves ~35% of original structure)
- Steps: 30
- Guidance scale: 7.5

### Prompt strategy

The system builds a rich prompt:
```
"A garment with intricate handcrafted embroidery work, traditional Indian Aari thread 
embroidery with gold and silk thread, delicate floral motifs and geometric patterns, 
vibrant colors on fabric, {user_style}, {user_instructions}, sharp focus, 8k resolution, 
photorealistic, textile art, handmade craftsmanship"
```

### Upgrading to FLUX

For higher quality, swap the model version in `core/replicate_service.py`:
```python
SD_IMG2IMG_VERSION = "black-forest-labs/flux-dev"
```
Note: FLUX costs more per prediction (~$0.03 vs ~$0.005).

---

## UX Flow

```
Landing Page
    ↓ "Try AI Preview" button
/ai-preview
    Step 1: Upload garment photo
    Step 2: Choose embroidery style + optional reference image
    Step 3: Add custom instructions + quick-add chips
    Step 4: Generation loading animation (cycling messages, thread spinner)
         ↓ on complete
    Before/After comparison (zoomable)
    Refine instructions → Regenerate
    Download preview
    Confirm Design →
         ConfirmOrderModal (name + phone)
         ↓ on submit
    Order saved to DB + preview linked
    WhatsApp opens with pre-filled order details
```

---

## Error Handling

| Scenario | UX Response |
|----------|-------------|
| No API token | Error message with `.env` setup instructions |
| Replicate timeout (>3 min) | "Timed out" error + retry button |
| Network error | Error message + retry / start over |
| Invalid image format | Rejected at upload with clear message |
| Generation failed on Replicate | Error + option to retry or start over |
