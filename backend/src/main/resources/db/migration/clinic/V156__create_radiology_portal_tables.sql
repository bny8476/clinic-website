-- V156: Create and update Radiology Portal tables
-- Covers Imaging Procedures, Modalities, Imaging Requests, and Radiology Reports

CREATE TABLE IF NOT EXISTS imaging_procedures (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    modality VARCHAR(30) NOT NULL DEFAULT 'XRAY',
    body_part VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_contrast BOOLEAN DEFAULT FALSE,
    preparation_instructions TEXT,
    duration_minutes INT DEFAULT 30,
    turnaround_target_hours INT,
    radiation_safety_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS modality VARCHAR(30) DEFAULT 'XRAY';
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS body_part VARCHAR(100);
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS requires_contrast BOOLEAN DEFAULT FALSE;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS preparation_instructions TEXT;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS turnaround_target_hours INT;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS radiation_safety_notes TEXT;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS radiology_modalities (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    modality_type VARCHAR(30) NOT NULL,
    room_location VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    assigned_technician_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE radiology_modalities ADD COLUMN IF NOT EXISTS room_location VARCHAR(100);
ALTER TABLE radiology_modalities ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'AVAILABLE';
ALTER TABLE radiology_modalities ADD COLUMN IF NOT EXISTS assigned_technician_id BIGINT;
ALTER TABLE radiology_modalities ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE radiology_modalities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE radiology_modalities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS imaging_requests (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT,
    procedure_id BIGINT NOT NULL REFERENCES imaging_procedures(id) ON DELETE RESTRICT,
    modality_id BIGINT REFERENCES radiology_modalities(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    clinical_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ORDERED',
    accession_number VARCHAR(100),
    dicom_study_uid VARCHAR(150),
    turnaround_target_sla TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    queue_token VARCHAR(50),
    queue_status VARCHAR(50) DEFAULT 'WAITING',
    preparation_completed BOOLEAN DEFAULT FALSE,
    preparation_notes TEXT,
    acquisition_started_at TIMESTAMP WITH TIME ZONE,
    acquisition_completed_at TIMESTAMP WITH TIME ZONE,
    performed_by_user_id BIGINT,
    technician_notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    critical_notes TEXT,
    critical_acknowledged BOOLEAN DEFAULT FALSE,
    critical_acknowledged_by VARCHAR(100),
    critical_acknowledged_at TIMESTAMP WITH TIME ZONE,
    encounter_id BIGINT,
    branch_id BIGINT DEFAULT 1,
    invoice_id BIGINT
);

-- In case imaging_requests already exists from earlier migrations, ensure all columns are present
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS accession_number VARCHAR(100);
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS dicom_study_uid VARCHAR(150);
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS modality_id BIGINT;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS turnaround_target_sla TIMESTAMP WITH TIME ZONE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS queue_token VARCHAR(50);
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS queue_status VARCHAR(50) DEFAULT 'WAITING';
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS preparation_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS preparation_notes TEXT;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS acquisition_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS acquisition_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS performed_by_user_id BIGINT;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS technician_notes TEXT;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS critical_notes TEXT;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS critical_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS critical_acknowledged_by VARCHAR(100);
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS critical_acknowledged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS encounter_id BIGINT;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS branch_id BIGINT DEFAULT 1;
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS invoice_id BIGINT;

CREATE TABLE IF NOT EXISTS radiology_reports (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL UNIQUE REFERENCES imaging_requests(id) ON DELETE CASCADE,
    radiologist_id BIGINT,
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    recommendations TEXT,
    technique TEXT,
    comparison TEXT,
    clinical_indication TEXT,
    dicom_study_uid VARCHAR(150),
    dicom_image_url VARCHAR(500),
    pdf_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by BIGINT,
    is_addendum BOOLEAN NOT NULL DEFAULT FALSE,
    parent_report_id BIGINT REFERENCES radiology_reports(id) ON DELETE SET NULL,
    amendment_reason TEXT,
    structured_data JSONB
);

-- Ensure columns exist if table was partially migrated previously
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS recommendations TEXT;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS technique TEXT;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS comparison TEXT;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS clinical_indication TEXT;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS dicom_study_uid VARCHAR(150);
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS dicom_image_url VARCHAR(500);
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS amendment_reason TEXT;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS structured_data JSONB;

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_imaging_requests_patient ON imaging_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_doctor ON imaging_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_status ON imaging_requests(status);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_priority ON imaging_requests(priority);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_requested_at ON imaging_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_branch ON imaging_requests(branch_id);
CREATE INDEX IF NOT EXISTS idx_radiology_reports_request ON radiology_reports(request_id);
CREATE INDEX IF NOT EXISTS idx_radiology_reports_status ON radiology_reports(status);
CREATE INDEX IF NOT EXISTS idx_radiology_modalities_status ON radiology_modalities(status);
