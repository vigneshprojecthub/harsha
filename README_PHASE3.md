# Phase 3 — Cart, Checkout, Razorpay, Invoice & Order Confirmation

## What's New

### Backend
| File | Purpose |
|------|---------|
| `models/order.py` | 4 new tables: orders, order_items, payments, invoices |
| `schemas/order.py` | Pydantic schemas for all checkout entities |
| `routers/checkout.py` | Full checkout API: initiate → verify → invoice → notify |
| `services/razorpay_service.py` | Razorpay order creation + HMAC payment verification |
| `services/invoice_service.py` | ReportLab PDF invoice with branded design |
| `services/notification_service.py` | SMTP email + WhatsApp URL builder |
| `migrate_phase3.sql` | DB migration script |

### Frontend
| File | Purpose |
|------|---------|
| `context/CartContext.jsx` | Global cart state with localStorage persistence |
| `components/cart/CartDrawer.jsx` | Slide-in cart panel with item management |
| `components/cart/AddToCartButton.jsx` | Animated add-to-cart with success feedback |
| `components/cart/CartIcon.jsx` | Navbar icon with animated badge count |
| `pages/checkout/CheckoutPage.jsx` | Shipping address + contact + order summary |
| `pages/checkout/PaymentPage.jsx` | Razorpay widget + demo mode fallback |
| `pages/orders/OrderConfirmationPage.jsx` | Animated success page with confetti |

---

## Setup

### 1. Razorpay Keys
```bash
# Add to backend/.env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
```
Get keys from: https://dashboard.razorpay.com → Settings → API Keys

> **Demo mode**: If keys are missing, the payment page enters demo mode and simulates a payment — perfect for testing.

### 2. Email (SMTP)
```bash
# Add to backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_16char_app_password   # Google App Password
FROM_EMAIL=Harsha Art Gallery <your@gmail.com>
```
Generate Google App Password: myaccount.google.com → Security → App passwords

### 3. Install new dependencies
```bash
cd backend
pip install razorpay==1.4.1 reportlab==4.2.0
# or
pip install -r requirements.txt
```

### 4. Run DB migration
```bash
psql -U postgres -d harsha_gallery -f backend/migrate_phase3.sql
# or just restart FastAPI — SQLAlchemy auto-creates tables
```

---

## API Reference

```
POST /api/checkout/initiate
  Body: { customer_name, customer_phone, customer_email?, address fields, items[] }
  → Creates Order + OrderItems, creates Razorpay order
  → Returns: { order_id, order_number, razorpay_order_id, amount_paise, key_id }

POST /api/checkout/verify-payment
  Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  → Verifies HMAC signature
  → Marks payment captured, order confirmed
  → Generates invoice PDF
  → Sends confirmation email (background)
  → Returns: { order_number, invoice_number, invoice_pdf_url, whatsapp_url }

GET  /api/checkout/orders             → List all orders (admin)
GET  /api/checkout/orders/{id}        → Single order with items
POST /api/checkout/orders/{id}/status → Update status
GET  /api/checkout/invoice/{order_id} → Download invoice PDF
GET  /api/checkout/config             → Returns Razorpay key_id
```

---

## Invoice PDF

Generated using **ReportLab** with full branding:
- Harsha Art Gallery header with GSTIN placeholder
- Bill-To address block
- Itemised product table with alternating row colours
- Tax breakdown (GST 18%)
- Grand total bar in dark gold
- Branded footer

Invoices saved to `uploads/invoice_INV-YYYY-MM-XXXXX.pdf` and served via `/uploads/`.

---

## Complete Flow

```
Product Detail / Products Page
    ↓ "Add to Cart"
Cart Drawer (slide-in)
    ↓ "Proceed to Checkout"
/checkout (shipping + contact form)
    ↓ "Proceed to Payment"
/checkout/payment
    ↓ Razorpay widget opens (or demo button)
    ↓ Payment captured
    ↓ HMAC verified on backend
    ↓ Invoice PDF generated
    ↓ Confirmation email sent (background)
/order-confirmation
    ↓ Animated success + confetti
    ↓ Download Invoice PDF button
    ↓ "Connect on WhatsApp" button → pre-filled order summary
```

---

## Tax & Pricing Logic

| Rule | Value |
|------|-------|
| GST Rate | 18% on (subtotal + shipping) |
| Free Shipping Threshold | ₹2,000 |
| Flat Shipping Rate | ₹150 |
| Price Validation | Server-side (prevents tampering) |
| Custom Items | Client price trusted (artisan confirms via WhatsApp) |
