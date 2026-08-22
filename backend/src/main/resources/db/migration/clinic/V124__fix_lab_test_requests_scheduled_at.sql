-- V124__fix_lab_test_requests_scheduled_at.sql
-- Fix remaining Hibernate entity vs DB schema mismatches (scheduled_at on lab_test_requests).

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_test_requests' AND column_name='scheduled_at')
    THEN
        ALTER TABLE lab_test_requests ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
