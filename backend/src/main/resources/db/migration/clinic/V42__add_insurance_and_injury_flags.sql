ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS insurance_status VARCHAR(50);
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS injury_status VARCHAR(50);
