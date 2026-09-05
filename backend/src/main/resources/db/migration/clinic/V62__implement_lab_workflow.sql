-- Phase 5: Laboratory Information System Workflow enhancements

-- 1. Extend lab_test_catalog
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS specimen_type VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS turnaround_target_hours INTEGER;
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- 2. Extend lab_test_requests
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS encounter_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL;
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL;

-- Migrate existing statuses to the new strict state machine
UPDATE lab_test_requests SET status = 'DRAFT' WHERE status = 'REQUESTED' AND (sample_collected_at IS NULL);
UPDATE lab_test_requests SET status = 'COLLECTED' WHERE status = 'SAMPLE_COLLECTED';
UPDATE lab_test_requests SET status = 'IN_PROGRESS' WHERE status = 'PROCESSING';

-- 3. Extend lab_sample_collections
ALTER TABLE lab_sample_collections ADD COLUMN IF NOT EXISTS storage_state VARCHAR(50);
ALTER TABLE lab_sample_collections ADD COLUMN IF NOT EXISTS chain_of_custody JSONB;
ALTER TABLE lab_sample_collections ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(100);

-- 4. Create lab_test_panels
CREATE TABLE IF NOT EXISTS lab_test_panels (
    id BIGSERIAL PRIMARY KEY,
    panel_id BIGINT NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    test_id BIGINT NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    CONSTRAINT uk_panel_test UNIQUE (panel_id, test_id)
);

-- 5. Create lab_reference_range_history
CREATE TABLE IF NOT EXISTS lab_reference_range_history (
    id BIGSERIAL PRIMARY KEY,
    test_catalog_id BIGINT NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    reference_range VARCHAR(255) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);
