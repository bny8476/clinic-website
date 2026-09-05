ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refills_allowed INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refills_remaining INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refill_interval_days INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_registration_number VARCHAR(255);

ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS substitution_allowed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS prescription_reconciliation_mismatches (
    id BIGSERIAL PRIMARY KEY,
    clinical_prescription_id BIGINT NOT NULL,
    clinic_status VARCHAR(50),
    pharmacy_status VARCHAR(50),
    mismatch_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255)
);

-- Note: The specific role name might depend on the environment setup. 
-- In PostgreSQL, REVOKE removes privileges. 
-- Assuming standard usage, we'll try to revoke from PUBLIC.
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
