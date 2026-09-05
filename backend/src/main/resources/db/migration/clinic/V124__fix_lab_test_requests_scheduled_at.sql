-- V124__fix_lab_test_requests_scheduled_at.sql
-- Fix remaining Hibernate entity vs DB schema mismatches (scheduled_at on lab_test_requests).

ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

