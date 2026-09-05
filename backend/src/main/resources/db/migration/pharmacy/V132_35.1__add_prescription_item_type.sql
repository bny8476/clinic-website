ALTER TABLE pharmacy_prescription_items
ADD COLUMN IF NOT EXISTS type VARCHAR(50);
