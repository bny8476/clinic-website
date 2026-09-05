CREATE TABLE IF NOT EXISTS nurse_patient_assignment (
    id BIGSERIAL PRIMARY KEY,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, DISCHARGED, REASSIGNED
    UNIQUE(nurse_id, patient_id, status)
);

CREATE TABLE IF NOT EXISTS vital_signs (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2),
    blood_pressure VARCHAR(20),
    heart_rate INT,
    respiratory_rate INT,
    oxygen_saturation DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS nursing_notes (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
