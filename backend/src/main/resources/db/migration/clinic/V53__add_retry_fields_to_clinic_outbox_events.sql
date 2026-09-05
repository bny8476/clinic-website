ALTER TABLE clinic_outbox_events ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE clinic_outbox_events ADD COLUMN IF NOT EXISTS last_error TEXT;
