# 🚀 Deployment Guide — Harsha Art Gallery

**Total cost: ₹0/month** using free tiers of Neon, Render, Vercel, and Cloudinary.

---

## Overview

```
GitHub (your code)
    ↓ auto-deploy
Render (backend API)  ←→  Neon (PostgreSQL)
    ↓ static files via Cloudinary CDN
Vercel (React frontend)
    ↓ UptimeRobot keeps Render awake
```

---

## Part 1 — GitHub Setup (5 min)

### 1a. Create repository
1. Go to **github.com** → New Repository
2. Name: `harsha-art-gallery`
3. Set to **Private** (your business code)
4. Don't initialize with README (you already have one)

### 1b. Push your code
```bash
cd /path/to/harsha-art-gallery

git init
git add .
git commit -m "Initial commit — Harsha Art Gallery Phase 1-5"

git remote add origin https://github.com/YOUR_USERNAME/harsha-art-gallery.git
git branch -M main
git push -u origin main
```

### 1c. Verify
Open github.com/YOUR_USERNAME/harsha-art-gallery — you should see all your files.

---

## Part 2 — Database on Neon (5 min)

### 2a. Sign up
1. Go to **neon.tech** → Sign up (GitHub login is easiest)
2. New Project → Name: `harsha-gallery` → Region: `AWS / ap-southeast-1` (Singapore — closest to India)
3. Click Create Project

### 2b. Get your connection string
Dashboard → Connection Details → copy the **Connection string**. It looks like:
```
postgresql://neondb_owner:AbCdEf123@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```
Save this — you'll need it for Render.

### 2c. Run migrations
```bash
# Install psql if needed: sudo apt install postgresql-client
# OR use the Neon SQL editor (Dashboard → SQL Editor)

DATABASE_URL="postgresql://neondb_owner:AbCdEf123@ep-xxx.neon.tech/neondb?sslmode=require"

psql "$DATABASE_URL" -f backend/setup.sql
psql "$DATABASE_URL" -f backend/migrate_phase2.sql
psql "$DATABASE_URL" -f backend/migrate_phase3.sql
psql "$DATABASE_URL" -f backend/migrate_phase4.sql
psql "$DATABASE_URL" -f backend/migrate_phase5.sql
```

> **Alternative**: Paste each .sql file's contents into the Neon SQL Editor and click Run.

---

## Part 3 — File Storage on Cloudinary (5 min)

### 3a. Sign up
1. Go to **cloudinary.com** → Sign up (free)
2. Dashboard → API Keys section
3. Note your: **Cloud Name**, **API Key**, **API Secret**

### 3b. Create upload presets (optional but recommended)
Dashboard → Settings → Upload → Add upload preset:
- Name: `harsha-gallery`
- Signing mode: Signed
- Folder: `harsha-gallery`

---

## Part 4 — Backend on Render (15 min)

### 4a. Create account
Go to **render.com** → Sign up with GitHub

### 4b. New Web Service
1. Dashboard → New → Web Service
2. Connect your GitHub repo: `harsha-art-gallery`
3. Configure:
   - **Name**: `harsha-gallery-api`
   - **Region**: Singapore (closest to India)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 4c. Add environment variables
In Render dashboard → Environment → Add each variable:

```
DATABASE_URL           = (paste from Neon)
CLOUDINARY_CLOUD_NAME  = (from Cloudinary dashboard)
CLOUDINARY_API_KEY     = (from Cloudinary dashboard)
CLOUDINARY_API_SECRET  = (from Cloudinary dashboard)
RAZORPAY_KEY_ID        = rzp_test_xxx (from razorpay.com)
RAZORPAY_KEY_SECRET    = xxx
SMTP_HOST              = smtp.gmail.com
SMTP_PORT              = 587
SMTP_USER              = your@gmail.com
SMTP_PASSWORD          = xxxx xxxx xxxx xxxx
FROM_EMAIL             = Harsha Art Gallery <your@gmail.com>
WHATSAPP_NUMBER        = 919876543210
WHATSAPP_API_TOKEN     = (from Meta developers)
WHATSAPP_PHONE_NUMBER_ID = (from Meta developers)
WHATSAPP_VERIFY_TOKEN  = harsha_gallery_verify_2025
REPLICATE_API_TOKEN    = r8_xxx (from replicate.com)
INSTAGRAM_ACCESS_TOKEN = (from Meta developers)
INSTAGRAM_BUSINESS_ID  = (from Meta developers)
SECRET_KEY             = (generate: python -c "import secrets; print(secrets.token_hex(32))")
UPLOAD_DIR             = uploads
```

> Set `PUBLIC_BASE_URL` and `PUBLIC_FRONTEND_URL` AFTER you know both URLs.

### 4d. Deploy
Click **Create Web Service** → wait 3–5 minutes.

Your API URL: `https://harsha-gallery-api.onrender.com`

### 4e. Test it
```bash
curl https://harsha-gallery-api.onrender.com/health
# Should return: {"status":"healthy"}

curl https://harsha-gallery-api.onrender.com/
# Should return: {"message":"Harsha Art Gallery API v5","status":"running"}
```

### 4f. Seed the database
```bash
curl -X POST https://harsha-gallery-api.onrender.com/api/admin/seed
# Returns: {"message":"Database seeded successfully",...}
```

---

## Part 5 — Frontend on Vercel (10 min)

### 5a. Sign up
Go to **vercel.com** → Sign up with GitHub

### 5b. Import project
1. Dashboard → Add New → Project
2. Import `harsha-art-gallery` from GitHub
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### 5c. Add environment variables
In Vercel → Settings → Environment Variables:
```
VITE_API_URL   = https://harsha-gallery-api.onrender.com
VITE_WS_URL    = wss://harsha-gallery-api.onrender.com
```

### 5d. Deploy
Click **Deploy** → wait 2–3 minutes.

Your site URL: `https://harsha-gallery.vercel.app`

### 5e. Update backend URLs
Go back to Render → Environment and update:
```
PUBLIC_BASE_URL     = https://harsha-gallery-api.onrender.com
PUBLIC_FRONTEND_URL = https://harsha-gallery.vercel.app
```

---

## Part 6 — Keep Render Awake with UptimeRobot (5 min)

Render free tier sleeps after 15 minutes of inactivity (takes ~30s to wake up).
UptimeRobot pings it every 5 minutes for free, keeping it always-on.

### 6a. Sign up
Go to **uptimerobot.com** → Sign up (free — 50 monitors)

### 6b. Create monitor
1. Add New Monitor
2. Monitor Type: **HTTP(S)**
3. Friendly Name: `Harsha Gallery API`
4. URL: `https://harsha-gallery-api.onrender.com/health`
5. Monitoring Interval: **5 minutes**
6. Click Create Monitor

That's it — your API now stays awake 24/7 for free.

---

## Part 7 — Custom Domain (optional, free)

### Option A: Freenom (.tk / .ml / .ga domains — free)
1. Go to **freenom.com**
2. Search for `harshaartgallery` → get a free .tk domain
3. In Vercel: Settings → Domains → Add your domain
4. In Freenom: Add Vercel's DNS records

### Option B: Buy a .in domain (₹800/year)
1. GoDaddy or Namecheap → search `harshaartgallery.in`
2. In Vercel: Settings → Domains → Add domain
3. Update nameservers in your registrar to Vercel's

---

## Gmail App Password (for email sending)

1. Go to **myaccount.google.com**
2. Security → 2-Step Verification → enable it
3. Search "App passwords" → create one for "Mail"
4. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)
5. Add as `SMTP_PASSWORD` in Render

---

## Razorpay Setup

### Test mode (use now for testing)
1. Sign up at **razorpay.com**
2. Settings → API Keys → Generate Test Key
3. Use `rzp_test_xxx` as `RAZORPAY_KEY_ID`

### Live mode (when ready to accept real payments)
1. Complete KYC on Razorpay dashboard
2. Activate live mode
3. Generate Live Key → replace `rzp_test_` with `rzp_live_`

---

## Deployment Checklist

```
□ Code pushed to GitHub
□ Neon DB created + migrations run
□ Cloudinary account created + keys saved
□ Render service deployed + all env vars set
□ API health check passing
□ Database seeded (POST /api/admin/seed)
□ Vercel deployed + env vars set
□ Both PUBLIC_BASE_URL and PUBLIC_FRONTEND_URL updated in Render
□ UptimeRobot monitor created
□ End-to-end test: browse → add to cart → checkout (demo mode)
□ Gmail App Password configured + test email received
```

---

## After Going Live

### Auto-deploy on git push
Both Render and Vercel auto-redeploy when you push to `main`:
```bash
git add .
git commit -m "Update product photos"
git push
# Render and Vercel automatically redeploy in ~3 minutes
```

### Monitor your app
- Render dashboard → Logs (see server errors)
- Vercel dashboard → Functions → Logs
- UptimeRobot → sends email if site goes down

### Upgrade path (when traffic grows)
| Service | Free → Paid | Monthly cost |
|---------|------------|-------------|
| Render  | No sleep, custom domain | $7 |
| Neon    | 10 GB DB | $19 |
| Vercel  | More bandwidth | $20 |
| Cloudinary | 225 GB storage | $89 |

For most small businesses, the free tier handles 5,000–50,000 visitors/month comfortably.

---

## Troubleshooting

### "Application failed to respond" on Render
- Check Render Logs → look for Python errors
- Most common: missing env var — double-check all variables are set

### Database connection error
- Ensure `?sslmode=require` is at the end of your Neon URL
- Neon free tier pauses after 5 days of inactivity — go to Neon dashboard and click "Resume"

### Images not showing after deploy
- Cloudinary env vars missing → check Render environment variables
- Old local `/uploads/` URLs in DB → re-upload images via admin panel

### Vercel "Page not found" on refresh
- The `vercel.json` rewrites handle this — ensure it's committed to GitHub

### WhatsApp webhook not receiving messages
- Your Render URL must be HTTPS and publicly accessible
- Register webhook in Meta developer portal: `https://harsha-gallery-api.onrender.com/api/whatsapp/webhook`
- Verify token must match `WHATSAPP_VERIFY_TOKEN` in Render env vars
