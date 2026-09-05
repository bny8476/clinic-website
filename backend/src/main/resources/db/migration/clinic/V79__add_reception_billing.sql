-- Migration: V79__add_reception_billing.sql
-- Description: Adds tables for reception billing, payments, and insurance verifications

CREATE TABLE IF NOT EXISTS clinic_bills (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT,
    appointment_id BIGINT,
    walk_in_id BIGINT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (walk_in_id) REFERENCES walk_in_registrations(id)
);

CREATE TABLE IF NOT EXISTS clinic_bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    department VARCHAR(100),
    FOREIGN KEY (bill_id) REFERENCES clinic_bills(id)
);

CREATE TABLE IF NOT EXISTS clinic_payments (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES clinic_bills(id)
);

CREATE TABLE IF NOT EXISTS insurance_verifications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    coverage_details TEXT,
    verified_at TIMESTAMP,
    verified_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);
