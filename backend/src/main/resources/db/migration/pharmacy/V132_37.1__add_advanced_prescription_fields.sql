ALTER TABLE pharmacy_prescription_items ADD COLUMN IF NOT EXISTS strength VARCHAR(50);
ALTER TABLE pharmacy_prescription_items ADD COLUMN IF NOT EXISTS timing VARCHAR(50);
