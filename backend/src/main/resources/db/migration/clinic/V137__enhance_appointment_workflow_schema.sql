-- V137: Enhance Appointment Workflow Schema for Enterprise Booking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_number VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_id BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'UNPAID';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS insurance_id BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rescheduled_from BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_source VARCHAR(30) DEFAULT 'PATIENT_PORTAL';

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_number ON appointments(appointment_number) WHERE appointment_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS appointment_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    performed_by_id BIGINT,
    performed_by_role VARCHAR(50),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_logs_appointment ON appointment_audit_logs(appointment_id);
