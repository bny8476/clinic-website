CREATE TABLE IF NOT EXISTS walk_in_registrations (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patient_profiles(id) ON DELETE SET NULL, -- Can be null if new patient
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    reason_for_visit TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'WAITING' -- WAITING, IN_CONSULTATION, COMPLETED, CANCELLED
);

CREATE TABLE IF NOT EXISTS queue_tokens (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    walk_in_id BIGINT REFERENCES walk_in_registrations(id) ON DELETE CASCADE,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE CASCADE,
    token_number INT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'WAITING', -- WAITING, CALLED, SERVED, SKIPPED
    UNIQUE(branch_id, token_number, generated_at) -- Approximation of daily reset uniqueness
);
