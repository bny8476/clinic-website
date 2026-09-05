-- V81__add_lab_catalog_and_barcodes.sql
-- Enhance lab_test_catalog with more configuration
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS container_type VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS collection_instructions TEXT;
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS method VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS insurance_eligible BOOLEAN DEFAULT true;
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS preparation_instructions TEXT;

-- Create lab_barcodes table to manage specimen barcodes properly
CREATE TABLE IF NOT EXISTS lab_barcodes (
    id BIGSERIAL PRIMARY KEY,
    barcode_value VARCHAR(50) UNIQUE NOT NULL,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    lab_request_number VARCHAR(50) NOT NULL, -- To group multiple requests
    specimen_type VARCHAR(100) NOT NULL,
    container_type VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by BIGINT REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PRINTED' -- PRINTED, SCANNED, REJECTED
);

CREATE INDEX IF NOT EXISTS idx_lab_barcode_value ON lab_barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_lab_barcode_req_num ON lab_barcodes(lab_request_number);
