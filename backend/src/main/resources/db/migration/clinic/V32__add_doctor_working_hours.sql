CREATE TABLE IF NOT EXISTS doctor_working_hours (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL,       -- 0=Sunday .. 6=Saturday
    start_time TIME NOT NULL,            -- e.g. 10:00:00
    end_time TIME NOT NULL,              -- e.g. 16:00:00
    slot_duration_minutes INT NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    branch_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_working_hours_valid CHECK (end_time > start_time),
    CONSTRAINT uq_doctor_day UNIQUE (doctor_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_working_hours_doctor ON doctor_working_hours(doctor_id);

CREATE TABLE IF NOT EXISTS doctor_schedule_overrides (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    is_unavailable BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = day off entirely
    start_time TIME,                              -- used only if is_unavailable = FALSE
    end_time TIME,
    reason VARCHAR(255),
    branch_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_doctor_override_date UNIQUE (doctor_id, override_date)
);
