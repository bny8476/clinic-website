-- V149__fix_finance_schema_and_constraints.sql
-- Fix constraints and column requirements for Finance module operations

-- 1. Payments: allow initiating standalone payments before allocating to invoices
ALTER TABLE payments ALTER COLUMN invoice_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN paid_at DROP NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'INITIATED';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

-- 2. Insurance Claims: ensure invoice_id is optional and amounts have defaults
ALTER TABLE insurance_claims ALTER COLUMN invoice_id DROP NOT NULL;
ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS deductible_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS copay_amount NUMERIC(12, 2) DEFAULT 0;

-- 3. Cashier Sessions: ensure defaults for collections and float
ALTER TABLE cashier_sessions ALTER COLUMN card_collections SET DEFAULT 0;
ALTER TABLE cashier_sessions ALTER COLUMN cash_collections SET DEFAULT 0;
ALTER TABLE cashier_sessions ALTER COLUMN digital_collections SET DEFAULT 0;
ALTER TABLE cashier_sessions ALTER COLUMN refunds_issued SET DEFAULT 0;
ALTER TABLE cashier_sessions ALTER COLUMN variance_amount SET DEFAULT 0;
