-- V25: Insurance Portal Schema

CREATE TABLE IF NOT EXISTS insurance_pre_authorizations (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name   VARCHAR(200) NOT NULL,
    policy_number   VARCHAR(100),
    procedure_name  VARCHAR(255) NOT NULL,
    estimated_cost  DECIMAL(12, 2) NOT NULL,
    approved_amount DECIMAL(12, 2),
    status          VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, APPROVED, REJECTED, PENDING_INFO
    denial_reason   TEXT,
    submitted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    adjudicated_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_insurance_preauth_patient ON insurance_pre_authorizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_preauth_status ON insurance_pre_authorizations(status);
