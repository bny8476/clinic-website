-- V44: Ledger Schema for P&L

CREATE TABLE IF NOT EXISTS ledger_entries (
    id                BIGSERIAL PRIMARY KEY,
    branch_id         BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    entry_date        DATE NOT NULL,
    entry_type        VARCHAR(20) NOT NULL, -- 'REVENUE' or 'EXPENSE'
    category          VARCHAR(80) NOT NULL, -- 'OPD', 'PHARMACY', 'LAB', 'SALARY', 'STOCK', 'RENT', 'OTHER'
    amount            DECIMAL(14, 2) NOT NULL,
    reference_id      VARCHAR(100), -- ID of the payment, invoice, or expense
    description       TEXT,
    recorded_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20);
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS category VARCHAR(80);
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS amount DECIMAL(14, 2);
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_branch_date ON ledger_entries(branch_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_type_cat ON ledger_entries(entry_type, category);
