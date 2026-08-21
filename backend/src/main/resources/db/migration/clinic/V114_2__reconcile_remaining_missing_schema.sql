-- Comprehensive Reconcilation of Remaining Skipped Migrations (V63, V92)
-- Flyway ignored these migrations on production because of outOfOrder=false and the baselineVersion.
-- This script safely applies them using IF NOT EXISTS.

-- ==========================================
-- Source: V63__implement_radiology_workflow.sql
-- ==========================================

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



-- ==========================================
-- Source: V92__init_hospital_systems_schema.sql
-- ==========================================

-- 1. Shared Foundation: Ward / Room / Bed
DROP TABLE IF EXISTS bed_assignments CASCADE;
DROP TABLE IF EXISTS ward_transfers CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE IF NOT EXISTS wards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50) NOT NULL,
    branch_id BIGINT NOT NULL,
    floor VARCHAR(50),
    capacity INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    ward_id BIGINT NOT NULL REFERENCES wards(id),
    room_number VARCHAR(50) NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL DEFAULT 0
);

-- Note: beds table might already exist. If it does, we modify it. If not, we create it.
-- We will just DROP and CREATE because the existing one was a stub.
DROP TABLE IF EXISTS beds CASCADE;
CREATE TABLE IF NOT EXISTS beds (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    bed_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    bed_type VARCHAR(50),
    version BIGINT NOT NULL DEFAULT 0
);

-- 2. Inpatient: Admission & Care
DROP TABLE IF EXISTS inpatient_admissions CASCADE;
CREATE TABLE IF NOT EXISTS admissions (
    id BIGSERIAL PRIMARY KEY,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    admitting_doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    bed_id BIGINT NOT NULL REFERENCES beds(id),
    admission_type VARCHAR(50) NOT NULL,
    admitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    discharged_at TIMESTAMP WITH TIME ZONE,
    admission_reason TEXT,
    branch_id BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS bed_transfers (
    id BIGSERIAL PRIMARY KEY,
    admission_id BIGINT NOT NULL REFERENCES admissions(id),
    from_bed_id BIGINT NOT NULL REFERENCES beds(id),
    to_bed_id BIGINT NOT NULL REFERENCES beds(id),
    transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    transferred_by_user_id BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS discharge_summaries (
    id BIGSERIAL PRIMARY KEY,
    admission_id BIGINT NOT NULL REFERENCES admissions(id),
    discharging_doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    diagnosis TEXT,
    treatment_summary TEXT,
    medications_on_discharge TEXT,
    follow_up_instructions TEXT,
    follow_up_appointment_id BIGINT REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Modify Existing Nursing Tables to link to admissions
ALTER TABLE nurse_patient_assignment ADD COLUMN IF NOT EXISTS admission_id BIGINT REFERENCES admissions(id);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS admission_id BIGINT REFERENCES admissions(id);
ALTER TABLE nursing_notes ADD COLUMN IF NOT EXISTS admission_id BIGINT REFERENCES admissions(id);
ALTER TABLE medication_administration_records ADD COLUMN IF NOT EXISTS admission_id BIGINT REFERENCES admissions(id);

-- 3. Emergency Department
CREATE TABLE IF NOT EXISTS emergency_encounters (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patient_profiles(id),
    arrival_mode VARCHAR(50) NOT NULL,
    ambulance_request_id BIGINT,
    arrived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    disposition VARCHAR(50),
    admission_id BIGINT REFERENCES admissions(id),
    assigned_doctor_id BIGINT REFERENCES doctor_profiles(id),
    branch_id BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS triage_assessments (
    id BIGSERIAL PRIMARY KEY,
    emergency_encounter_id BIGINT NOT NULL REFERENCES emergency_encounters(id),
    triaged_by_user_id BIGINT NOT NULL REFERENCES users(id),
    triage_level VARCHAR(50) NOT NULL,
    chief_complaint TEXT,
    triaged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_orders (
    id BIGSERIAL PRIMARY KEY,
    emergency_encounter_id BIGINT NOT NULL REFERENCES emergency_encounters(id),
    ordered_by_user_id BIGINT NOT NULL REFERENCES users(id),
    order_type VARCHAR(50) NOT NULL,
    reference_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Modify existing tables to link to emergency encounters
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS emergency_encounter_id BIGINT REFERENCES emergency_encounters(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS emergency_encounter_id BIGINT REFERENCES emergency_encounters(id);


-- 4. Operation Theatre
CREATE TABLE IF NOT EXISTS operation_theatres (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    branch_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS surgery_bookings (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    admission_id BIGINT REFERENCES admissions(id),
    ot_id BIGINT NOT NULL REFERENCES operation_theatres(id),
    surgeon_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    procedure_name VARCHAR(200) NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    branch_id BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pre_op_checklists (
    id BIGSERIAL PRIMARY KEY,
    surgery_booking_id BIGINT NOT NULL UNIQUE REFERENCES surgery_bookings(id),
    items JSONB NOT NULL,
    completed_by_user_id BIGINT NOT NULL REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surgical_team_members (
    id BIGSERIAL PRIMARY KEY,
    surgery_booking_id BIGINT NOT NULL REFERENCES surgery_bookings(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS anesthesia_records (
    id BIGSERIAL PRIMARY KEY,
    surgery_booking_id BIGINT NOT NULL UNIQUE REFERENCES surgery_bookings(id),
    anesthetist_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    anesthesia_type VARCHAR(50) NOT NULL,
    pre_anesthesia_assessment TEXT,
    anesthesia_start TIMESTAMP WITH TIME ZONE,
    anesthesia_end TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS surgery_notes (
    id BIGSERIAL PRIMARY KEY,
    surgery_booking_id BIGINT NOT NULL REFERENCES surgery_bookings(id),
    note_type VARCHAR(50) NOT NULL,
    author_user_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surgery_inventory_usages (
    id BIGSERIAL PRIMARY KEY,
    surgery_booking_id BIGINT NOT NULL REFERENCES surgery_bookings(id),
    stock_adjustment_id BIGINT NOT NULL,
    quantity_used INT NOT NULL,
    recorded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS surgery_booking_id BIGINT REFERENCES surgery_bookings(id);


