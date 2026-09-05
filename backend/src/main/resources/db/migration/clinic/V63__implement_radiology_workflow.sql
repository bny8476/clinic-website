-- Phase 6: Radiology and PACS Workflow enhancements

-- 1. Extend imaging_requests
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS encounter_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL;

-- Migrate existing statuses to the new strict state machine
-- Existing statuses: REQUESTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
UPDATE imaging_requests SET status = 'ORDERED' WHERE status = 'REQUESTED';
UPDATE imaging_requests SET status = 'REPORTING' WHERE status = 'IN_PROGRESS';
UPDATE imaging_requests SET status = 'RELEASED' WHERE status = 'COMPLETED';

-- 2. Extend radiology_reports
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS is_addendum BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS parent_report_id BIGINT REFERENCES radiology_reports(id) ON DELETE CASCADE;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS structured_data JSONB;

-- 3. Create dicom_studies table
CREATE TABLE IF NOT EXISTS dicom_studies (
    id BIGSERIAL PRIMARY KEY,
    study_instance_uid VARCHAR(255) NOT NULL UNIQUE,
    accession_number VARCHAR(100),
    request_id BIGINT NOT NULL REFERENCES imaging_requests(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    modality VARCHAR(30) NOT NULL,
    study_date TIMESTAMP WITH TIME ZONE,
    series_count INTEGER NOT NULL DEFAULT 0,
    instance_count INTEGER NOT NULL DEFAULT 0,
    storage_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create radiology_access_logs table
CREATE TABLE IF NOT EXISTS radiology_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id BIGINT REFERENCES imaging_requests(id) ON DELETE CASCADE,
    dicom_study_id BIGINT REFERENCES dicom_studies(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL, -- VIEW_REPORT, DOWNLOAD_REPORT, VIEW_DICOM_STUDY
    ip_address VARCHAR(45),
    accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dicom_studies_request ON dicom_studies(request_id);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_patient ON dicom_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_radiology_logs_user ON radiology_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_radiology_logs_request ON radiology_access_logs(request_id);
