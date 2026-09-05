-- V123__fix_patient_profiles_documents_column.sql
-- Fix remaining Hibernate entity vs DB schema mismatches.

-- ============================================================
-- patient_profiles
-- ============================================================
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]'::jsonb;

