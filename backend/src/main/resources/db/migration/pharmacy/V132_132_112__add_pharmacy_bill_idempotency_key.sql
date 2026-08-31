-- Add idempotency_key to pharmacy_sales_bills to prevent duplicate billing
ALTER TABLE pharmacy_sales_bills
ADD COLUMN idempotency_key VARCHAR(100);

-- Make idempotency_key unique
ALTER TABLE pharmacy_sales_bills
ADD CONSTRAINT uk_pharmacy_sales_bills_idempotency_key UNIQUE (idempotency_key);
