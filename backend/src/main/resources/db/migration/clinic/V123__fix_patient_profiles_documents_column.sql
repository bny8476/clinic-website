-- V123__fix_patient_profiles_documents_column.sql
-- Fix remaining Hibernate entity vs DB schema mismatches.

-- ============================================================
-- patient_profiles
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patient_profiles' AND column_name='documents')
    THEN
        ALTER TABLE patient_profiles ADD COLUMN documents JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
END $$;
