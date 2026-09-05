-- V20: Radiology Schema

CREATE TABLE IF NOT EXISTS imaging_procedures (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(200) NOT NULL,
    modality      VARCHAR(30) NOT NULL, -- XRAY, MRI, CT, ULTRASOUND, PET
    body_part     VARCHAR(100),
    price         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS imaging_requests (
    id            BIGSERIAL PRIMARY KEY,
    patient_id    BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_id     BIGINT REFERENCES doctor_profiles(id) ON DELETE SET NULL,
    procedure_id  BIGINT NOT NULL REFERENCES imaging_procedures(id) ON DELETE CASCADE,
    priority      VARCHAR(20) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, URGENT, STAT
    clinical_notes TEXT,
    status        VARCHAR(30) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    requested_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_at  TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS radiology_reports (
    id             BIGSERIAL PRIMARY KEY,
    request_id     BIGINT NOT NULL UNIQUE REFERENCES imaging_requests(id) ON DELETE CASCADE,
    radiologist_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    findings       TEXT NOT NULL,
    impression     TEXT NOT NULL,
    dicom_study_uid VARCHAR(255),
    dicom_image_url VARCHAR(500),
    status         VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, FINALIZED
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at   TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_imaging_requests_status ON imaging_requests(status);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_patient ON imaging_requests(patient_id);
