-- Phase 3 Migration: Orders, Order Items, Payments, Invoices
-- Run against existing harsha_gallery database

CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    order_number     VARCHAR(30)  UNIQUE NOT NULL,
    customer_name    VARCHAR(200) NOT NULL,
    customer_email   VARCHAR(200),
    customer_phone   VARCHAR(20)  NOT NULL,
    address_line1    VARCHAR(300) NOT NULL,
    address_line2    VARCHAR(300),
    city             VARCHAR(100) NOT NULL,
    state            VARCHAR(100) NOT NULL,
    pincode          VARCHAR(20)  NOT NULL,
    country          VARCHAR(100) DEFAULT 'India',
    delivery_notes   TEXT,
    subtotal         NUMERIC(10,2) DEFAULT 0,
    tax_amount       NUMERIC(10,2) DEFAULT 0,
    shipping_amount  NUMERIC(10,2) DEFAULT 0,
    discount_amount  NUMERIC(10,2) DEFAULT 0,
    total_amount     NUMERIC(10,2) NOT NULL,
    status           VARCHAR(50)  DEFAULT 'pending',
    razorpay_order_id VARCHAR(100),
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
    id               SERIAL PRIMARY KEY,
    order_id         INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id       INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name     VARCHAR(200) NOT NULL,
    product_category VARCHAR(100),
    unit_price       NUMERIC(10,2) NOT NULL,
    quantity         INTEGER DEFAULT 1,
    line_total       NUMERIC(10,2) NOT NULL,
    custom_config    JSONB,
    ai_preview_id    INTEGER REFERENCES ai_previews(id) ON DELETE SET NULL,
    is_custom        BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS payments (
    id                   SERIAL PRIMARY KEY,
    order_id             INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    razorpay_order_id    VARCHAR(100),
    razorpay_payment_id  VARCHAR(100),
    razorpay_signature   VARCHAR(300),
    amount               NUMERIC(10,2) NOT NULL,
    currency             VARCHAR(10)   DEFAULT 'INR',
    method               VARCHAR(50),
    status               VARCHAR(50)   DEFAULT 'created',
    error_code           VARCHAR(100),
    error_message        TEXT,
    captured_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id               SERIAL PRIMARY KEY,
    order_id         INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    invoice_number   VARCHAR(30) UNIQUE NOT NULL,
    invoice_date     TIMESTAMPTZ DEFAULT NOW(),
    pdf_url          VARCHAR(500),
    subtotal         NUMERIC(10,2) DEFAULT 0,
    tax_rate         FLOAT DEFAULT 18.0,
    tax_amount       NUMERIC(10,2) DEFAULT 0,
    shipping_amount  NUMERIC(10,2) DEFAULT 0,
    total_amount     NUMERIC(10,2) NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number      ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay          ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order        ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay        ON payments(razorpay_payment_id);
