-- V155: Create Laboratory Portal tables
-- Covers Test Catalog, Lab Requests, Lab Samples, Lab Results, and Lab Reports

CREATE TABLE IF NOT EXISTS test_catalogs (
    id BIGSERIAL PRIMARY KEY,
    test_code VARCHAR(50) NOT NULL UNIQUE,
    test_name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'General Pathology',
    specimen_type VARCHAR(100) NOT NULL DEFAULT 'Whole Blood',
    container_type VARCHAR(100) DEFAULT 'EDTA Lavender Top',
    turnaround_target_hours INT DEFAULT 4,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reference_range VARCHAR(200) DEFAULT 'Normal',
    unit VARCHAR(50) DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_requests (
    id BIGSERIAL PRIMARY KEY,
    lab_request_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    patient_profile_id BIGINT,
    patient_user_id BIGINT,
    doctor_id BIGINT,
    doctor_user_id BIGINT,
    patient_first_name VARCHAR(100),
    patient_last_name VARCHAR(100),
    doctor_name VARCHAR(150),
    branch_id BIGINT DEFAULT 1,
    test_catalog_id BIGINT REFERENCES test_catalogs(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    clinical_notes TEXT,
    result_value TEXT,
    reference_range VARCHAR(200),
    unit VARCHAR(50),
    is_abnormal BOOLEAN DEFAULT FALSE,
    is_critical BOOLEAN DEFAULT FALSE,
    critical_acknowledged BOOLEAN DEFAULT FALSE,
    critical_acknowledged_by VARCHAR(100),
    critical_acknowledged_at TIMESTAMP WITH TIME ZONE,
    technical_comments TEXT,
    rejection_reason TEXT,
    file_url TEXT,
    recollection_required BOOLEAN DEFAULT FALSE,
    verified_by_user_id BIGINT,
    verified_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    collected_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    result_entered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_samples (
    id BIGSERIAL PRIMARY KEY,
    sample_barcode VARCHAR(100) NOT NULL UNIQUE,
    lab_request_id BIGINT NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
    sample_type VARCHAR(100) NOT NULL,
    container_type VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'COLLECTED',
    collected_by_user_id BIGINT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by_user_id BIGINT,
    received_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_reports (
    id BIGSERIAL PRIMARY KEY,
    report_number VARCHAR(50) NOT NULL UNIQUE,
    lab_request_id BIGINT NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
    report_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    pdf_url TEXT,
    summary_findings TEXT,
    verified_by_user_id BIGINT,
    verified_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_requests_patient ON lab_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_doctor ON lab_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON lab_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_requests_priority ON lab_requests(priority);
CREATE INDEX IF NOT EXISTS idx_lab_requests_requested_at ON lab_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_test_catalogs_code ON test_catalogs(test_code);
CREATE INDEX IF NOT EXISTS idx_lab_samples_barcode ON lab_samples(sample_barcode);
