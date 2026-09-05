CREATE TABLE IF NOT EXISTS doctor_followups (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    linked_appointment_id BIGINT,
    follow_up_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(user_id),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (linked_appointment_id) REFERENCES appointments(id)
);

CREATE INDEX IF NOT EXISTS idx_followup_doctor ON doctor_followups(doctor_id);
CREATE INDEX IF NOT EXISTS idx_followup_patient ON doctor_followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_followup_date ON doctor_followups(follow_up_date);
