-- V22: eCommerce Schema

CREATE TABLE IF NOT EXISTS ecommerce_products (
    id             BIGSERIAL PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    category       VARCHAR(100) NOT NULL DEFAULT 'WELLNESS', -- WELLNESS, SUPPLEMENTS, OTC_MEDICINE, DEVICES, PERSONAL_CARE
    price          DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    sku            VARCHAR(100) UNIQUE,
    image_url      VARCHAR(500),
    medicine_id    BIGINT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ecommerce_orders (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount     DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city    VARCHAR(100) NOT NULL,
    postal_code      VARCHAR(20) NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    tracking_number  VARCHAR(100),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shipped_at       TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ecommerce_order_items (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
    product_id  BIGINT NOT NULL REFERENCES ecommerce_products(id) ON DELETE CASCADE,
    quantity    INT NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_products_category ON ecommerce_products(category);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_user ON ecommerce_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON ecommerce_orders(status);
