ALTER TABLE appointments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_unique_active_slot ON appointments(slot_id);


