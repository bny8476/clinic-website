-- V119__add_ambulance_type_to_ambulances.sql

ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS ambulance_type VARCHAR(50);

