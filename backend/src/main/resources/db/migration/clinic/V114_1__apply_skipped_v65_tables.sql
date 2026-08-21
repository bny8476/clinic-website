-- Safely create tables from V65 in case Flyway skipped V65 due to out-of-order merging
CREATE TABLE IF NOT EXISTS home_visit_requests (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    address TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time VARCHAR(100) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    symptoms_reason TEXT,
    urgency VARCHAR(50) NOT NULL DEFAULT 'Routine',
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Requested',
    assigned_staff_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_home_visit_patient ON home_visit_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_home_visit_status ON home_visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_home_visit_branch ON home_visit_requests(branch_id);

CREATE TABLE IF NOT EXISTS teleconsultation_requests (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    preferred_dates VARCHAR(255) NOT NULL,
    preferred_times VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    attached_document_url VARCHAR(1024),
    language_preference VARCHAR(100) NOT NULL DEFAULT 'English',
    status VARCHAR(50) NOT NULL DEFAULT 'Requested',
    assigned_doctor_id BIGINT REFERENCES users(id),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    join_link VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teleconsult_patient ON teleconsultation_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_teleconsult_status ON teleconsultation_requests(status);
