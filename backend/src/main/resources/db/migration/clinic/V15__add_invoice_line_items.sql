-- Extend invoices table with line-item billing fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- Generate invoice numbers for any existing rows
UPDATE invoices SET invoice_number = CONCAT('INV-', LPAD(CAST(id AS VARCHAR), 5, '0')) WHERE invoice_number IS NULL;

-- Create invoice line items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    item_type VARCHAR(50) NOT NULL DEFAULT 'OTHER', -- APPOINTMENT, LAB_TEST, PHARMACY, CONSULTATION, OTHER
    reference_id BIGINT -- nullable FK to the originating record
);
