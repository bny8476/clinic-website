-- Add Advanced Prescription fields
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS symptoms TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP;

-- Add Advanced PrescriptionItem fields
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS strength VARCHAR(50);
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS timing VARCHAR(50);

-- Also add to pharmacy mirroring table

-- Vitals table
CREATE TABLE IF NOT EXISTS vitals (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT,
    height_cm INT,
    weight_kg INT,
    blood_pressure VARCHAR(50),
    pulse_bpm INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient_profiles(id)
);
