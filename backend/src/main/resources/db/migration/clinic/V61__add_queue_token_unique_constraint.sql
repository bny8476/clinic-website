ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS generated_date DATE;
UPDATE queue_tokens SET generated_date = CAST(generated_at AS DATE);
ALTER TABLE queue_tokens ALTER COLUMN generated_date SET NOT NULL;
ALTER TABLE queue_tokens ADD CONSTRAINT uq_queue_token_branch_day UNIQUE (branch_id, token_number, generated_date);
