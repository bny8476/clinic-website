-- V140: Enhance Medicine Orders Schema & Seed Real Medicine Products for Doctor Sales & E-Commerce Workflow

CREATE TABLE IF NOT EXISTS doctor_medicines (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(1024),
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(100),
    stock_quantity INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_medicines_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicine_orders (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_orders_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_medicine_orders_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_medicine_orders_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE IF NOT EXISTS medicine_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    doctor_medicine_id BIGINT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price_at_order DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES medicine_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_medicine FOREIGN KEY (doctor_medicine_id) REFERENCES doctor_medicines(id)
);

ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS prescription_id BIGINT;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS branch_id BIGINT;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID';
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS medicine_id BIGINT;
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS dosage VARCHAR(100);
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS frequency VARCHAR(100);
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Foreign key & Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uq_medicine_orders_order_number ON medicine_orders(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient_id ON medicine_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_doctor_id ON medicine_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_prescription_id ON medicine_orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_status ON medicine_orders(status);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_payment_status ON medicine_orders(payment_status);

-- Seed comprehensive real medicine catalog in ecommerce_products if missing
INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Paracetamol 500mg Tablet', 'Paracetamol', 'Calpol', 'GSK Pharmaceuticals', 'PRESCRIPTION', 35.00, 40.00, 250,
       false, 'Tablet', '500mg', '10 Tablets', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Paracetamol 500mg Tablet');

INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Amoxicillin 500mg Capsule', 'Amoxicillin', 'Mox 500', 'Sun Pharma', 'ANTIBIOTIC', 120.00, 140.00, 180,
       true, 'Capsule', '500mg', '10 Capsules', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Amoxicillin 500mg Capsule');

INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Cetirizine 10mg Tablet', 'Cetirizine HCI', 'Cetzine', 'Dr. Reddys Labs', 'ALLERGY', 45.00, 50.00, 300,
       false, 'Tablet', '10mg', '10 Tablets', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Cetirizine 10mg Tablet');

INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Azithromycin 500mg Tablet', 'Azithromycin', 'Aziwok 500', 'Cipla', 'ANTIBIOTIC', 115.00, 130.00, 150,
       true, 'Tablet', '500mg', '3 Tablets', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Azithromycin 500mg Tablet');

INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Pantoprazole 40mg Tablet', 'Pantoprazole', 'Pan 40', 'Alkem Laboratories', 'GASTRIC', 95.00, 110.00, 200,
       false, 'Tablet', '40mg', '15 Tablets', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Pantoprazole 40mg Tablet');

INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Metformin 500mg SR Tablet', 'Metformin', 'Glycomet 500', 'USV Private Limited', 'DIABETES', 38.00, 45.00, 400,
       true, 'Tablet', '500mg', '20 Tablets', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Metformin 500mg SR Tablet');

INSERT INTO ecommerce_products (
    title, generic_name, brand_name, manufacturer, category, price, mrp, stock_quantity,
    prescription_required, dosage_form, dosage_strength, pack_size, is_active, product_status,
    cold_chain_required, return_eligible, regulatory_status, tax_class,
    created_at, updated_at
)
SELECT 'Ibuprofen 400mg Tablet', 'Ibuprofen', 'Brufen 400', 'Abbott', 'PAINKILLER', 30.00, 35.00, 350,
       false, 'Tablet', '400mg', '15 Tablets', true, 'ACTIVE', false, true, 'APPROVED', 'MEDICINE_12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE title = 'Ibuprofen 400mg Tablet');
