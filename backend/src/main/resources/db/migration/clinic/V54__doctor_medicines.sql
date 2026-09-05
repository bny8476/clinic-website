-- V54: Create Doctor-Managed Medicine Catalog and Ordering schema

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
    status VARCHAR(50) NOT NULL, -- PENDING, PAID, CANCELLED, FULFILLED
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_orders_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_medicine_orders_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_medicine_orders_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE IF NOT EXISTS medicine_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    doctor_medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price_at_order DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES medicine_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_medicine FOREIGN KEY (doctor_medicine_id) REFERENCES doctor_medicines(id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_medicines_doctor_id ON doctor_medicines(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient_id ON medicine_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_doctor_id ON medicine_orders(doctor_id);
