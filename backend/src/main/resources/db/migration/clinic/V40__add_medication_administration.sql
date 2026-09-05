CREATE TABLE IF NOT EXISTS medication_administration_records (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT,
    prescription_item_id BIGINT,
    patient_name VARCHAR(255),
    bed_number VARCHAR(100),
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    scheduled_time TIMESTAMP,
    administered_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'DUE',
    administered_by_user_id BIGINT,
    notes VARCHAR(255)
);
