CREATE TABLE IF NOT EXISTS doctor_prescription_templates (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_doc_template ON doctor_prescription_templates (doctor_id);


CREATE TABLE IF NOT EXISTS doctor_prescription_template_items (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    strength VARCHAR(50),
    dosage VARCHAR(50),
    frequency VARCHAR(100),
    duration VARCHAR(50),
    timing VARCHAR(50),
    instructions VARCHAR(255),
    FOREIGN KEY (template_id) REFERENCES doctor_prescription_templates(id) ON DELETE CASCADE
);
