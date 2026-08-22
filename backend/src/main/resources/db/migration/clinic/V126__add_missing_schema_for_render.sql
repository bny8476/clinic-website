-- V126__add_missing_schema_for_render.sql
-- Safely add the prescription_refill_requests table which was skipped on Render
-- due to Flyway baseline configuration.

CREATE TABLE IF NOT EXISTS prescription_refill_requests (
    id BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by_doctor_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prr_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);
