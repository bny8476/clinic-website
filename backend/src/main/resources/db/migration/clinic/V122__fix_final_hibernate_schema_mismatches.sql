-- V122__fix_final_hibernate_schema_mismatches.sql
-- Fix all remaining Hibernate entity vs DB schema mismatches.

-- ============================================================
-- clinical_referrals
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clinical_referrals' AND column_name='encounter_id')
    THEN
        ALTER TABLE clinical_referrals ADD COLUMN encounter_id BIGINT;
    END IF;
END $$;

-- ============================================================
-- coupons
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='coupons' AND column_name='updated_at')
    THEN
        ALTER TABLE coupons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================
-- documents
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='ocr_status')
    THEN
        ALTER TABLE documents ADD COLUMN ocr_status VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='ocr_text')
    THEN
        ALTER TABLE documents ADD COLUMN ocr_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='uploaded_at')
    THEN
        ALTER TABLE documents ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='parent_document_id')
    THEN
        ALTER TABLE documents ADD COLUMN parent_document_id BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='expires_at')
    THEN
        ALTER TABLE documents ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================
-- home_visit_requests
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='home_visit_requests' AND column_name='reason_for_visit')
    THEN
        ALTER TABLE home_visit_requests ADD COLUMN reason_for_visit TEXT;
    END IF;
END $$;

-- ============================================================
-- lab_results
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_results' AND column_name='pathologist_comments')
    THEN
        ALTER TABLE lab_results ADD COLUMN pathologist_comments TEXT;
    END IF;
END $$;

-- ============================================================
-- lab_test_requests
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_test_requests' AND column_name='released_at')
    THEN
        ALTER TABLE lab_test_requests ADD COLUMN released_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_test_requests' AND column_name='rejected_at')
    THEN
        ALTER TABLE lab_test_requests ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_test_requests' AND column_name='rejection_reason')
    THEN
        ALTER TABLE lab_test_requests ADD COLUMN rejection_reason VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_test_requests' AND column_name='rejection_notes')
    THEN
        ALTER TABLE lab_test_requests ADD COLUMN rejection_notes TEXT;
    END IF;
END $$;

-- ============================================================
-- patient_documents
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patient_documents' AND column_name='storage_key')
    THEN
        ALTER TABLE patient_documents ADD COLUMN storage_key VARCHAR(255);
    END IF;
END $$;

-- ============================================================
-- prescription_items
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescription_items' AND column_name='prescribed_quantity')
    THEN
        ALTER TABLE prescription_items ADD COLUMN prescribed_quantity INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescription_items' AND column_name='medicine_id')
    THEN
        ALTER TABLE prescription_items ADD COLUMN medicine_id BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescription_items' AND column_name='remaining_quantity')
    THEN
        ALTER TABLE prescription_items ADD COLUMN remaining_quantity INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescription_items' AND column_name='dispensed_quantity')
    THEN
        ALTER TABLE prescription_items ADD COLUMN dispensed_quantity INTEGER;
    END IF;
END $$;
