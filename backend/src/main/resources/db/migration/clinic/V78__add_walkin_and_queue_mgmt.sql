ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS queue_transfers (
    id BIGSERIAL PRIMARY KEY,
    token_id BIGINT NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
    from_doctor_id BIGINT REFERENCES users(id),
    to_doctor_id BIGINT REFERENCES users(id),
    reason TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transferred_by_user_id BIGINT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS no_shows (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    appointment_id BIGINT REFERENCES appointments(id),
    walk_in_id BIGINT REFERENCES walk_in_registrations(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id BIGINT REFERENCES users(id),
    reason TEXT
);

ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 0;
ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS current_department VARCHAR(100) DEFAULT 'GENERAL';
