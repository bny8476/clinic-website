-- V132_132_113.1__fix_pharmacy_medicines_defaults.sql
-- Ensures default values exist for created_at, updated_at, and is_deleted on pharmacy_medicines

ALTER TABLE pharmacy_medicines ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE pharmacy_medicines ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE pharmacy_medicines ALTER COLUMN is_deleted SET DEFAULT false;
