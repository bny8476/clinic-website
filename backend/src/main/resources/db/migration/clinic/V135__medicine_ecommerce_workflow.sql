-- V135: Medicine Master & E-Commerce Workflow Schema Enhancement

-- 1. Enhance ecommerce_products with full Medicine Master fields
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS brand_name            VARCHAR(200);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS manufacturer          VARCHAR(300);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS composition           TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS dosage_form           VARCHAR(100);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS strength              VARCHAR(100);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS unit                  VARCHAR(50);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS indications           TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS usage_instructions    TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS precautions           TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS side_effects          TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS storage_instructions   TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS discount_price        DECIMAL(10,2);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS tax_percentage        DECIMAL(5,2) DEFAULT 0;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS minimum_stock_level   INT DEFAULT 10;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS medicine_image        VARCHAR(500);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS doctor_id             BIGINT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS version               BIGINT DEFAULT 0;

-- 2. Enhance ecommerce_orders with Doctor & Patient linkage and snapshots
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS doctor_id       BIGINT;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS patient_id      BIGINT;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS subtotal        DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS tax_amount      DECIMAL(10,2) DEFAULT 0;

-- 3. Enhance ecommerce_order_items with historical snapshots
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS medicine_name_snapshot VARCHAR(300);
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS discount_amount        DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS tax_amount             DECIMAL(10,2) DEFAULT 0;

-- 4. Enhance notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id   BIGINT;

-- 5. Useful Indexes for search & filtering
CREATE INDEX IF NOT EXISTS idx_ec_products_name ON ecommerce_products(title);
CREATE INDEX IF NOT EXISTS idx_ec_products_generic ON ecommerce_products(generic_name);
CREATE INDEX IF NOT EXISTS idx_ec_products_doctor ON ecommerce_products(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ec_orders_doctor ON ecommerce_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ec_orders_patient ON ecommerce_orders(patient_id);
