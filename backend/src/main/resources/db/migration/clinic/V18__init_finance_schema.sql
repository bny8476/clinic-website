-- V18: Finance Module Schema
-- invoices table already exists from V7 + V15. Finance adds payments, expenses, insurance_claims.

CREATE TABLE IF NOT EXISTS payments (
    id                BIGSERIAL PRIMARY KEY,
    invoice_id        BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount            DECIMAL(12, 2) NOT NULL,
    payment_method    VARCHAR(30) NOT NULL DEFAULT 'CASH', -- CASH, CARD, UPI, INSURANCE, ONLINE
    transaction_ref   VARCHAR(200),
    paid_by           BIGINT REFERENCES users(id) ON DELETE SET NULL,
    recorded_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
    paid_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes             TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
    id           BIGSERIAL PRIMARY KEY,
    branch_id    BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    category     VARCHAR(80) NOT NULL,  -- UTILITIES, SALARY, SUPPLIES, MAINTENANCE, OTHER
    description  TEXT NOT NULL,
    amount       DECIMAL(12, 2) NOT NULL,
    incurred_on  DATE NOT NULL,
    recorded_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    receipt_url  VARCHAR(500),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insurance_claims (
    id               BIGSERIAL PRIMARY KEY,
    patient_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id       BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    provider_name    VARCHAR(200) NOT NULL,
    claim_number     VARCHAR(100),
    claimed_amount   DECIMAL(12, 2) NOT NULL,
    approved_amount  DECIMAL(12, 2),
    status           VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED
    submitted_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at       TIMESTAMP WITH TIME ZONE,
    notes            TEXT
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_payments_invoice      ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_date  ON expenses(branch_id, incurred_on);
CREATE INDEX IF NOT EXISTS idx_insurance_status      ON insurance_claims(status);
