-- Phase 4 Migration: Order Tracking
-- Run against existing harsha_gallery database

CREATE TABLE IF NOT EXISTS order_tracking_events (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    status       VARCHAR(50)  NOT NULL,
    notes        TEXT,
    admin_note   TEXT,
    updated_by   VARCHAR(100),
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    email_sent   BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_order   ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_order   ON order_progress_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_token   ON tracking_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_order   ON tracking_tokens(order_id);
