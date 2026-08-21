-- Phase 2: Schema extensions for Laboratory Workflow

-- 1. Add lab_request_number to lab_test_requests
ALTER TABLE lab_test_requests
ADD COLUMN IF NOT EXISTS lab_request_number VARCHAR(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_lab_request_number'
    ) THEN
        ALTER TABLE lab_test_requests
        ADD CONSTRAINT uk_lab_request_number UNIQUE (lab_request_number);
    END IF;
END $$;

-- 2. Create lab_sample_collections child table
CREATE TABLE IF NOT EXISTS lab_sample_collections (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    sample_type VARCHAR(100),
    collector_name VARCHAR(100),
    remarks TEXT,
    sample_image_url VARCHAR(255),
    collected_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_sample_request FOREIGN KEY (request_id) REFERENCES lab_test_requests(id) ON DELETE CASCADE,
    CONSTRAINT uk_sample_request UNIQUE (request_id)
);

-- 3. Create lab_processing_details child table
CREATE TABLE IF NOT EXISTS lab_processing_details (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    assigned_technician_id BIGINT,
    machine_used VARCHAR(100),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_processing_request FOREIGN KEY (request_id) REFERENCES lab_test_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_processing_tech FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_processing_request UNIQUE (request_id)
);

-- 4. Extend lab_results for drafts and critical flags
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false;

-- 5. Extend lab_test_catalog for reference data
ALTER TABLE lab_test_catalog
ADD COLUMN IF NOT EXISTS reference_range VARCHAR(255);

ALTER TABLE lab_test_catalog
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
