-- Phase 2 Migration: AI Previews table
-- Run this against your existing harsha_gallery database

CREATE TABLE IF NOT EXISTS ai_previews (
    id SERIAL PRIMARY KEY,

    -- Optional link to a custom order (set after user confirms design)
    order_id INTEGER REFERENCES custom_orders(id) ON DELETE SET NULL,

    -- File paths / URLs (stored as relative /uploads/... paths)
    original_image_url  VARCHAR(500) NOT NULL,
    reference_image_url VARCHAR(500),
    generated_preview_url VARCHAR(500),

    -- AI generation metadata
    prompt                  TEXT,
    custom_instructions     TEXT,
    replicate_prediction_id VARCHAR(200),
    model_version           VARCHAR(200),

    -- Status: pending | processing | completed | failed
    status        VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,

    -- Timing
    generation_seconds FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_previews_order_id ON ai_previews(order_id);
CREATE INDEX IF NOT EXISTS idx_ai_previews_status   ON ai_previews(status);
