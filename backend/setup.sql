-- Harsha Art Gallery - PostgreSQL Setup
-- Run these commands to set up the database

-- Create database
CREATE DATABASE harsha_gallery;

-- Connect to database
\c harsha_gallery

-- The tables will be auto-created by SQLAlchemy when you run the FastAPI app.
-- But here are the SQL equivalents for reference:

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    price FLOAT NOT NULL,
    images JSONB DEFAULT '[]',
    customizable BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS custom_orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    product_type VARCHAR(200) NOT NULL,
    reference_image_url VARCHAR(500),
    notes TEXT,
    delivery_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, description) VALUES
('Aari Work', 'aari-work', 'Traditional Aari embroidery with intricate needle work'),
('Thread Embroidery', 'thread-embroidery', 'Beautiful thread work in vibrant colors'),
('Bead Work', 'bead-work', 'Stunning bead arrangements on fabric and frames'),
('Sequence Work', 'sequence-work', 'Glamorous sequin embellishments'),
('Wedding Frames', 'wedding-frames', 'Handcrafted wedding photo frames with embroidery')
ON CONFLICT (slug) DO NOTHING;
