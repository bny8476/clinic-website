-- Migration for Phase 8 Batch 1: Patient Portal

-- Dependent Profiles
CREATE TABLE IF NOT EXISTS dependent_profiles (
    id BIGSERIAL PRIMARY KEY,
    guardian_patient_id BIGINT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    relationship VARCHAR(50),
    medical_history_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_dependent_guardian FOREIGN KEY (guardian_patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

-- Emergency Contacts (replaces plain text fields)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50),
    primary_phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    consent_to_contact BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_emergency_contact_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS patient_notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_notif_pref_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    UNIQUE(patient_id, category)
);

-- Consent Versions
CREATE TABLE IF NOT EXISTS consent_versions (
    id BIGSERIAL PRIMARY KEY,
    consent_type VARCHAR(50) NOT NULL UNIQUE,
    version_id VARCHAR(50) NOT NULL,
    document_text TEXT NOT NULL,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient Consents
DROP TABLE IF EXISTS patient_consents;
CREATE TABLE IF NOT EXISTS patient_consents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    consent_version_id BIGINT NOT NULL,
    is_granted BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_consent_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_consent_version FOREIGN KEY (consent_version_id) REFERENCES consent_versions(id)
);

-- Seed initial consent versions
INSERT INTO consent_versions (consent_type, version_id, document_text, is_latest) VALUES
('TELECONSULTATION', 'v1.0.0', 'I consent to receive healthcare services via telemedicine...', true),
('DATA_EXPORT', 'v1.0.0', 'I authorize the export of my complete medical history...', true),
('AI_ASSISTANT', 'v1.0.0', 'I understand this AI is not a doctor and I consent to its use...', true),
('GENERAL_TREATMENT', 'v1.0.0', 'I consent to general medical treatment by the clinic staff...', true);
