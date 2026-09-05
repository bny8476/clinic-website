-- V113: Add Idempotency Key to Finance Payments

ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;
