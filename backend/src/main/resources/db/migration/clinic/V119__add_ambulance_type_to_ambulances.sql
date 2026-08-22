-- V119__add_ambulance_type_to_ambulances.sql

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ambulances' 
          AND column_name = 'ambulance_type'
    ) THEN
        ALTER TABLE ambulances ADD COLUMN ambulance_type VARCHAR(50);
    END IF;
END $$;
