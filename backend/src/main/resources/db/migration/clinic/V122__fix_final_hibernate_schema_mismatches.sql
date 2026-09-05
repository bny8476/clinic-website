-- V122__fix_final_hibernate_schema_mismatches.sql
-- Fix all remaining Hibernate entity vs DB schema mismatches.

ALTER TABLE clinical_referrals ADD COLUMN IF NOT EXISTS encounter_id BIGINT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE home_visit_requests ADD COLUMN IF NOT EXISTS reason_for_visit TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS pathologist_comments TEXT;

ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255);
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255);

ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS prescribed_quantity INTEGER;
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS medicine_id BIGINT;
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS remaining_quantity INTEGER;
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS dispensed_quantity INTEGER;

