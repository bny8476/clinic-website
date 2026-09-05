-- V70__add_referral_and_communication_tables.sql

CREATE TABLE IF NOT EXISTS clinical_referrals (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    referring_doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    referred_to_specialty VARCHAR(100),
    referred_to_doctor_id BIGINT REFERENCES doctor_profiles(id),
    referred_to_facility VARCHAR(255),
    reason_for_referral TEXT NOT NULL,
    clinical_notes TEXT,
    priority VARCHAR(50) DEFAULT 'Routine',
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical_attachments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_path TEXT NOT NULL,
    document_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    patient_id BIGINT REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
