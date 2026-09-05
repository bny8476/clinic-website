-- V69__add_advanced_eprescribing.sql
-- Phase 9 Batch 2: Advanced E-Prescribing & Clinical Safety

-- Enhance prescriptions with encounter link and digital signature fields
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS encounter_id BIGINT REFERENCES clinical_encounters(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Draft'; -- Draft, Signed, Void, Cancelled
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Create a dedicated table for structured overrides if not fully covered by cds_alerts
CREATE TABLE IF NOT EXISTS cds_overrides (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES cds_alerts(id),
    prescription_id BIGINT REFERENCES prescriptions(id),
    overridden_by BIGINT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cds_overrides_alert ON cds_overrides(alert_id);
CREATE INDEX IF NOT EXISTS idx_cds_overrides_prescription ON cds_overrides(prescription_id);
