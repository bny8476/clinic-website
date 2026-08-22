-- V118__update_ambulance_assignments_schema.sql

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ambulance_assignments' 
          AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE ambulance_assignments ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ambulance_assignments' 
          AND column_name = 'hospital_destination_id'
    ) THEN
        ALTER TABLE ambulance_assignments ADD COLUMN hospital_destination_id BIGINT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ambulance_assignments' 
          AND column_name = 'driver_id'
    ) THEN
        ALTER TABLE ambulance_assignments ADD COLUMN driver_id BIGINT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ambulance_assignments' 
          AND column_name = 'paramedic_id'
    ) THEN
        ALTER TABLE ambulance_assignments ADD COLUMN paramedic_id BIGINT;
    END IF;
END $$;
