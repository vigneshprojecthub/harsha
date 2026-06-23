-- Phase 5 Migration: Reviews, Coupons, Abandoned Carts, Referrals, Analytics
-- Run against existing harsha_gallery database

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
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, product_id)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product    ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published  ON reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_coupons_code       ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_abandoned_phone    ON abandoned_carts(phone);
CREATE INDEX IF NOT EXISTS idx_referral_code      ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_analytics_type     ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session  ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ts       ON analytics_events(created_at);

-- Seed festival coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, campaign, max_uses)
VALUES
  ('WELCOME10',  'Welcome offer — 10% off your first order', 'percent', 10, 500, 200, 'welcome', 100),
  ('DIWALI25',   'Diwali 2025 — 25% off all products',      'percent', 25, 1000, 500, 'diwali2025', 200),
  ('COMEBACK10', 'We missed you! 10% off',                  'percent', 10, 0,    150, 'abandoned_cart', NULL),
  ('FLAT500',    'Flat ₹500 off on orders above ₹3000',     'flat',    500,3000,  NULL, 'festive', 50)
ON CONFLICT (code) DO NOTHING;
