ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS void_reason VARCHAR(255);

ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS past_surgeries JSONB DEFAULT '[]';
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS family_history JSONB DEFAULT '[]';
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS current_medications JSONB DEFAULT '[]';
