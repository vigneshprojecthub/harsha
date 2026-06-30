# 🎨 Harsha Art Gallery — Full Stack E-Commerce

A premium handcrafted art gallery website built with **React + FastAPI + PostgreSQL**.

---

## 📁 Project Structure

```
harsha-art-gallery/
├── frontend/                    # React (Vite) app
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/         # Landing page sections
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── FeaturedProducts.jsx
│   │   │   │   ├── CategoriesSection.jsx
│   │   │   │   ├── WhyChooseUs.jsx
│   │   │   │   ├── Testimonials.jsx
│   │   │   │   ├── FAQSection.jsx
│   │   │   │   └── CTABanner.jsx
│   │   │   ├── layout/          # Navbar, Footer, Layouts
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── AdminLayout.jsx
│   │   │   └── products/        # Product components
│   │   │       └── ProductCard.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Landing page (all sections)
│   │   │   ├── ProductsPage.jsx     # Product listing with filters
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CustomOrderPage.jsx  # WhatsApp-integrated order form
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       ├── AdminProductForm.jsx  # Add/Edit products
│   │   │       └── AdminOrders.jsx
│   │   └── utils/
│   │       ├── api.js               # Axios API client
│   │       └── whatsapp.js          # WhatsApp URL builder
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
└── backend/                     # FastAPI app
    ├── main.py                  # App entry point
    ├── core/
    │   ├── config.py            # Settings (env vars)
    │   └── database.py          # SQLAlchemy setup
    ├── models/
    │   └── models.py            # DB models
    ├── schemas/
    │   └── schemas.py           # Pydantic schemas
    ├── routers/
    │   ├── products.py          # CRUD + image upload
    │   ├── categories.py
    │   ├── orders.py            # Custom orders
    │   └── admin.py             # Seed + stats
    ├── requirements.txt
    ├── setup.sql                # DB setup reference
    └── .env.example
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

---

### 1. Database Setup

```bash
# Create DB
psql -U postgres -c "CREATE DATABASE harsha_gallery;"

# Or run the setup SQL
psql -U postgres -d harsha_gallery -f backend/setup.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and WhatsApp number

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**
API Docs (Swagger): **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 4. Seed the Database

Visit **http://localhost:5173/admin** and click **"Seed Database"** to populate:
- 5 categories (Aari Work, Thread Embroidery, Bead Work, Sequence Work, Wedding Frames)
- 6 sample products

---

## 🔧 Configuration

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/harsha_gallery
SECRET_KEY=your-secret-key-change-in-production
UPLOAD_DIR=uploads
WHATSAPP_NUMBER=919344946069    # Your WhatsApp number with country code
```

Edit `frontend/src/utils/whatsapp.js`:
```js
const WHATSAPP_NUMBER = '919344946069'  // Replace with actual number
```

---

## 📱 Features

### Public Site
| Page | URL | Features |
|------|-----|---------|
| Landing | `/` | Hero, Featured Products, Categories, Why Choose Us, Testimonials, FAQ |
| Gallery | `/products` | Search, category filter, product grid |
| Product Detail | `/products/:id` | Images, info, WhatsApp enquiry, custom order CTA |
| Custom Order | `/custom-order` | Form + image upload → WhatsApp redirect |

### Admin Panel
| Page | URL | Features |
|------|-----|---------|
| Dashboard | `/admin` | Stats, DB seed, quick actions |
| Products | `/admin/products` | List, delete, edit |
| Add/Edit | `/admin/products/new` | Image upload, all fields |
| Orders | `/admin/orders` | View orders, update status, WhatsApp customer |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Display font | Playfair Display (serif) |
| Body font | Lato (sans-serif) |
| Accent font | Cormorant Garamond (italic serif) |
| Primary color | Gold (`#c8860f`) |
| Background | Ivory (`#f8f4ec`) |
| Dark | Charcoal (`#1a1510`) |

---

## 📋 API Endpoints

### Products
- `GET    /api/products` — list (query: `category_id`, `featured`, `search`, `skip`, `limit`)
- `GET    /api/products/:id` — single product
- `POST   /api/products` — create
- `PUT    /api/products/:id` — update
- `DELETE /api/products/:id` — delete
- `POST   /api/products/upload-image` — upload image file

### Categories
- `GET    /api/categories` — list all
- `POST   /api/categories` — create
- `DELETE /api/categories/:id` — delete

### Orders
- `POST   /api/orders/custom` — create custom order
- `GET    /api/orders/custom` — list all orders
- `PATCH  /api/orders/custom/:id/status` — update status
- `POST   /api/orders/upload-reference` — upload reference image

### Admin
- `POST   /api/admin/seed` — seed DB with sample data
- `GET    /api/admin/stats` — dashboard statistics

---

## 🚀 Production Deployment

### Frontend (Vercel / Netlify)
```bash
cd frontend && npm run build
# Upload dist/ folder
# Set environment variable: VITE_API_URL=https://your-api.com
```

### Backend (Railway / Render / VPS)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Update CORS origins in `backend/main.py` to include your production URL.

---

## 📞 WhatsApp Integration

When a customer submits a custom order:
1. Order is saved to the database
2. WhatsApp opens with a pre-filled message containing all order details
3. The shop owner receives the enquiry directly in WhatsApp Business

To change the WhatsApp number, update:
- `backend/.env` → `WHATSAPP_NUMBER`
- `frontend/src/utils/whatsapp.js` → `WHATSAPP_NUMBER`
- `frontend/src/components/landing/CTABanner.jsx` → hardcoded href
