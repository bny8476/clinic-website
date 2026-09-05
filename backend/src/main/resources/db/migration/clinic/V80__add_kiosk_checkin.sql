-- V80__add_kiosk_checkin.sql
-- Description: Kiosk self-check-in records and reception document scanning audit

-- Kiosk self-check-in sessions
CREATE TABLE IF NOT EXISTS kiosk_checkins (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patient_profiles(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    appointment_id BIGINT REFERENCES appointments(id),
    checkin_method VARCHAR(50) NOT NULL DEFAULT 'KIOSK', -- KIOSK, RECEPTION, WALK_IN
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, CHECKED_IN, NO_SHOW
    kiosk_station VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_staff BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_checkin_branch ON kiosk_checkins(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_kiosk_checkin_patient ON kiosk_checkins(patient_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_checkin_appointment ON kiosk_checkins(appointment_id);

-- Reception document scanning audit — who uploaded a document on behalf of a patient
CREATE TABLE IF NOT EXISTS reception_document_uploads (
    id BIGSERIAL PRIMARY KEY,
    patient_document_id BIGINT NOT NULL REFERENCES patient_documents(id),
    uploaded_by_staff_id BIGINT REFERENCES users(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    scan_device VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reception_doc_upload_patient_doc ON reception_document_uploads(patient_document_id);
CREATE INDEX IF NOT EXISTS idx_reception_doc_upload_branch ON reception_document_uploads(branch_id);
