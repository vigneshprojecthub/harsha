-- ============================================================
-- HARSHA ART GALLERY — COMPLETE DATABASE MIGRATION
-- Run this ONCE in Neon SQL Editor to set up all tables
-- ============================================================

-- ── Phase 1: Core tables ────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url   VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    slug          VARCHAR(200) UNIQUE NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2) NOT NULL,
    sale_price    NUMERIC(10,2),
    images        JSONB DEFAULT '[]',
    category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_featured   BOOLEAN DEFAULT FALSE,
    is_active     BOOLEAN DEFAULT TRUE,
    stock         INTEGER DEFAULT 0,
    tags          JSONB DEFAULT '[]',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_orders (
    id              SERIAL PRIMARY KEY,
    customer_name   VARCHAR(200) NOT NULL,
    customer_phone  VARCHAR(20)  NOT NULL,
    customer_email  VARCHAR(200),
    garment_type    VARCHAR(100),
    description     TEXT,
    reference_image VARCHAR(500),
    budget          NUMERIC(10,2),
    deadline        DATE,
    status          VARCHAR(50) DEFAULT 'pending',
    admin_notes     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Phase 2: AI Preview ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_previews (
    id              SERIAL PRIMARY KEY,
    session_id      VARCHAR(64),
    original_image  VARCHAR(500),
    result_image    VARCHAR(500),
    style           VARCHAR(100),
    instructions    TEXT,
    status          VARCHAR(30) DEFAULT 'pending',
    replicate_id    VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Phase 3: Orders, Payments, Invoices ─────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                  SERIAL PRIMARY KEY,
    order_number        VARCHAR(30) UNIQUE NOT NULL,
    customer_name       VARCHAR(200) NOT NULL,
    customer_phone      VARCHAR(20)  NOT NULL,
    customer_email      VARCHAR(200),
    address_line1       VARCHAR(300),
    address_line2       VARCHAR(300),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    subtotal            NUMERIC(10,2) DEFAULT 0,
    shipping            NUMERIC(10,2) DEFAULT 0,
    tax                 NUMERIC(10,2) DEFAULT 0,
    discount            NUMERIC(10,2) DEFAULT 0,
    total_amount        NUMERIC(10,2) DEFAULT 0,
    coupon_code         VARCHAR(30),
    status              VARCHAR(50) DEFAULT 'order_placed',
    payment_status      VARCHAR(30) DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity     INTEGER NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    total_price  NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id                   SERIAL PRIMARY KEY,
    order_id             INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    razorpay_order_id    VARCHAR(100),
    razorpay_payment_id  VARCHAR(100),
    razorpay_signature   VARCHAR(300),
    amount               NUMERIC(10,2) NOT NULL,
    currency             VARCHAR(10) DEFAULT 'INR',
    status               VARCHAR(30) DEFAULT 'pending',
    method               VARCHAR(50),
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    pdf_url      VARCHAR(500),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Phase 4: Tracking ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_tracking_events (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    status        VARCHAR(50) NOT NULL,
    notes         TEXT,
    admin_note    TEXT,
    updated_by    VARCHAR(100),
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    email_sent    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_progress_photos (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER REFERENCES order_tracking_events(id) ON DELETE CASCADE NOT NULL,
    order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    url        VARCHAR(500) NOT NULL,
    caption    VARCHAR(300),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_tokens (
    id         SERIAL PRIMARY KEY,
    token      VARCHAR(64) UNIQUE NOT NULL,
    order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ── Phase 5: Reviews, Coupons, Analytics ────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id               SERIAL PRIMARY KEY,
    product_id       INTEGER REFERENCES products(id) ON DELETE CASCADE,
    order_id         INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    reviewer_name    VARCHAR(200) NOT NULL,
    reviewer_phone   VARCHAR(20),
    reviewer_email   VARCHAR(200),
    rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title            VARCHAR(200),
    body             TEXT,
    photos           JSONB DEFAULT '[]',
    is_verified      BOOLEAN DEFAULT FALSE,
    is_published     BOOLEAN DEFAULT TRUE,
    is_featured      BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
    id               SERIAL PRIMARY KEY,
    code             VARCHAR(30) UNIQUE NOT NULL,
    description      VARCHAR(300),
    discount_type    VARCHAR(20) DEFAULT 'percent',
    discount_value   NUMERIC(10,2) NOT NULL,
    min_order_value  NUMERIC(10,2) DEFAULT 0,
    max_discount     NUMERIC(10,2),
    valid_from       TIMESTAMPTZ,
    valid_until      TIMESTAMPTZ,
    is_active        BOOLEAN DEFAULT TRUE,
    max_uses         INTEGER,
    uses_per_user    INTEGER DEFAULT 1,
    total_used       INTEGER DEFAULT 0,
    campaign         VARCHAR(100),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_usages (
    id               SERIAL PRIMARY KEY,
    coupon_id        INTEGER REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
    order_id         INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    phone            VARCHAR(20),
    discount_given   NUMERIC(10,2) NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abandoned_carts (
    id                   SERIAL PRIMARY KEY,
    session_id           VARCHAR(64) UNIQUE NOT NULL,
    phone                VARCHAR(20),
    email                VARCHAR(200),
    name                 VARCHAR(200),
    cart_data            JSONB NOT NULL,
    total_value          NUMERIC(10,2) DEFAULT 0,
    reminder_sent_count  INTEGER DEFAULT 0,
    last_reminder_at     TIMESTAMPTZ,
    recovered            BOOLEAN DEFAULT FALSE,
    recovered_order_id   INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referrals (
    id                 SERIAL PRIMARY KEY,
    referrer_phone     VARCHAR(20) NOT NULL,
    referrer_name      VARCHAR(200),
    referee_phone      VARCHAR(20) NOT NULL,
    referee_name       VARCHAR(200),
    referral_code      VARCHAR(20) UNIQUE NOT NULL,
    referee_order_id   INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    referrer_rewarded  BOOLEAN DEFAULT FALSE,
    referee_rewarded   BOOLEAN DEFAULT FALSE,
    reward_coupon_code VARCHAR(30),
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id         SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    session_id VARCHAR(64),
    product_id INTEGER,
    order_id   INTEGER,
    value      FLOAT,
    metadata   JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── All indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order       ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_order ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_order ON order_progress_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_token ON tracking_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_order ON tracking_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product      ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published    ON reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_coupons_code         ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_abandoned_phone      ON abandoned_carts(phone);
CREATE INDEX IF NOT EXISTS idx_analytics_type       ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_ts         ON analytics_events(created_at);

-- ── Seed coupons ────────────────────────────────────────────
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, campaign, max_uses)
VALUES
  ('WELCOME10',  'Welcome offer — 10% off your first order', 'percent', 10, 500,  200,  'welcome',        100),
  ('DIWALI25',   'Diwali 2025 — 25% off all products',       'percent', 25, 1000, 500,  'diwali2025',     200),
  ('COMEBACK10', 'We missed you! 10% off',                   'percent', 10, 0,    150,  'abandoned_cart', NULL),
  ('FLAT500',    'Flat ₹500 off on orders above ₹3000',      'flat',    500,3000, NULL, 'festive',        50)
ON CONFLICT (code) DO NOTHING;

-- Done!
SELECT 'Migration complete! All tables created.' AS status;
