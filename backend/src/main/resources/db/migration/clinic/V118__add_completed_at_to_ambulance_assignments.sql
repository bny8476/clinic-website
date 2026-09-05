-- V118__update_ambulance_assignments_schema.sql

ALTER TABLE ambulance_assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ambulance_assignments ADD COLUMN IF NOT EXISTS hospital_destination_id BIGINT;
ALTER TABLE ambulance_assignments ADD COLUMN IF NOT EXISTS driver_id BIGINT;
ALTER TABLE ambulance_assignments ADD COLUMN IF NOT EXISTS paramedic_id BIGINT;

