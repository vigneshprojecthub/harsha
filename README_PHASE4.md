# Phase 4 — Live Order Tracking

## What's New

### Backend (5 new files)
| File | Purpose |
|------|---------|
| `models/tracking.py` | 3 tables: `order_tracking_events`, `order_progress_photos`, `tracking_tokens` |
| `schemas/tracking.py` | Pydantic schemas for events, photos, full timeline |
| `routers/tracking.py` | REST + WebSocket endpoints — status update, photo upload, timeline, public token |
| `core/ws_manager.py` | WebSocket ConnectionManager — per-order rooms + global admin room |
| `services/tracking_notifications.py` | WhatsApp URL builder + HTML email for status updates |
| `migrate_phase4.sql` | DB migration |

### Frontend (6 new files)
| File | Purpose |
|------|---------|
| `hooks/useOrderTracking.js` | WebSocket hook with exponential back-off reconnect + HTTP polling fallback |
| `components/tracking/TrackingTimeline.jsx` | 8-step progress stepper + event timeline + photo grid with lightbox |
| `components/tracking/LiveStatusBadge.jsx` | Animated live/reconnecting connection indicator |
| `pages/tracking/OrderTrackingPage.jsx` | Public tracking page — by token URL or manual search |
| `pages/dashboard/CustomerDashboard.jsx` | Customer order history — find by phone, select order, see live timeline |
| `pages/admin/AdminTracking.jsx` | Admin panel — active orders list, status updater, photo uploader, token generator |

---

## Setup

### 1. DB Migration
```bash
psql -U postgres -d harsha_gallery -f backend/migrate_phase4.sql
# Or just restart FastAPI — SQLAlchemy auto-creates tables
```

### 2. WebSocket URL (frontend)
```bash
# frontend/.env
VITE_WS_URL=ws://localhost:8000
# Production:
VITE_WS_URL=wss://your-api-domain.com
```

### 3. Install websockets
```bash
pip install websockets==12.0
# or
pip install -r requirements.txt
```

---

## API Reference

### REST
```
POST /api/tracking/order/{order_id}/status
  Body: { status, notes?, admin_note?, updated_by? }
  → Creates event, updates order.status, broadcasts WS, sends email

GET  /api/tracking/order/{order_id}
  → Full timeline with all events + photos (admin)

GET  /api/tracking/token/{token}
  → Public timeline by token (customer)

POST /api/tracking/order/{order_id}/photo
  Multipart: file*, caption?, event_id?
  → Uploads photo, broadcasts via WS

POST /api/tracking/token/{order_id}/generate
  → Creates or returns existing tracking token

GET  /api/tracking/admin/active
  → All non-delivered orders with current status

GET  /api/tracking/ws/stats
  → Active WebSocket connection counts
```

### WebSocket
```
WS  /api/tracking/ws/order/{order_id}
  → Customer/admin subscribes to one order's updates
  → Receives: { type, status, label, icon, notes, timestamp }
  → Send "ping" → receive "pong"

WS  /api/tracking/ws/admin
  → Admin dashboard — receives ALL order updates
```

---

## The 8 Tracking Statuses

| Status Key | Customer Label | Icon |
|------------|---------------|------|
| `order_placed` | Order Placed | 📋 |
| `design_approval` | Design Approval | ✏️ |
| `embroidery_started` | Embroidery Started | 🪡 |
| `in_progress` | In Progress | ⚙️ |
| `quality_check` | Quality Check | 🔍 |
| `packed` | Packed | 📦 |
| `shipped` | Shipped | 🚚 |
| `delivered` | Delivered | 🎉 |

---

## Full Flow

```
Customer places order → payment verified
  ↓ auto-generates tracking token
  ↓ creates initial "order_placed" event
  ↓ tracking URL included in confirmation page + email

Order Confirmation Page
  ↓ shows live tracking card with copy button
  ↓ /track/{token} link

/track/{token}  ← customer bookmarks this
  ↓ shows 8-step progress stepper
  ↓ WebSocket connected (live badge)
  ↓ event timeline with admin notes + photos

Admin → /admin/tracking
  ↓ active orders list (live updates via admin WS)
  ↓ select order → update status
  ↓ write customer note + internal note
  ↓ upload progress photo (auto-attaches to latest event)
  ↓ generate / send tracking link via WhatsApp
  ↓ broadcasts to customer WS → UI updates instantly

Customer sees update in real-time:
  - Step stepper advances to new status
  - New event appears in timeline with note
  - Progress photos load in grid (click to lightbox)
  - Email sent with progress bar + "Track Live" button
```

---

## WebSocket Architecture

```
                ┌──────────────────────┐
                │   ConnectionManager  │
                │  (core/ws_manager.py)│
                └──────────┬───────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
   order_rooms         admin_sockets    broadcast helpers
   {1: {ws1, ws2},    {ws_admin1,      broadcast_to_order()
    5: {ws3},          ws_admin2}      broadcast_to_admins()
    9: {ws4}}                          broadcast_order_update()
         │                 │
   Customer WS         Admin WS
   /ws/order/1        /ws/admin
```

Each status update broadcasts to BOTH the order's room AND all admin sockets.

---

## Notification Emails

Status update emails include:
- Current status badge with icon
- Visual progress bar (% complete)
- Admin note (if any)
- Step-by-step journey so far
- "Track Your Order Live" button → tracking token URL
