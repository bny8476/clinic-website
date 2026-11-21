-- Add missing clinical and demographic fields to dependent_profiles
ALTER TABLE dependent_profiles ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE dependent_profiles ADD COLUMN IF NOT EXISTS contact_number VARCHAR(25);
ALTER TABLE dependent_profiles ADD COLUMN IF NOT EXISTS allergies TEXT;

-- Add missing notes column to doctor_prescription_templates
ALTER TABLE doctor_prescription_templates ADD COLUMN IF NOT EXISTS notes TEXT;
