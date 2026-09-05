CREATE TABLE IF NOT EXISTS patient_consents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    form_type VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    agreed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_consent_user FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hr_attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    CONSTRAINT fk_hr_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
