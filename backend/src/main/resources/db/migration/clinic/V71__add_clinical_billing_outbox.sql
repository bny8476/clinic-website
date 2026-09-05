-- V71__add_clinical_billing_outbox.sql

CREATE TABLE IF NOT EXISTS billing_outbox (
    id BIGSERIAL PRIMARY KEY,
    encounter_id BIGINT NOT NULL REFERENCES clinical_encounters(id),
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    doctor_id BIGINT NOT NULL REFERENCES users(id),
    service_type VARCHAR(100) NOT NULL, -- e.g., "Consultation", "Procedure"
    service_code VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processed, Failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);
