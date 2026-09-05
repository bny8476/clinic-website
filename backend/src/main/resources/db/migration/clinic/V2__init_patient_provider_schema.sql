CREATE TABLE IF NOT EXISTS patient_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL, -- References identity-service.users(id)
    date_of_birth DATE,
    gender VARCHAR(10),
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    medical_history_summary TEXT,
    branch_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL, -- References identity-service.users(id)
    specialty VARCHAR(100) NOT NULL,
    qualifications TEXT NOT NULL,
    experience_years INTEGER,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    bio TEXT,
    registration_number VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    branch_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_slots (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    branch_id BIGINT NOT NULL,
    version BIGINT DEFAULT 0, -- For optimistic locking
    UNIQUE (doctor_id, start_time) -- Prevent overlapping slots for same doctor
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    slot_id BIGINT NOT NULL UNIQUE REFERENCES appointment_slots(id),
    status VARCHAR(20) NOT NULL, -- BOOKED, CANCELLED, COMPLETED, NO_SHOW
    reason_for_visit TEXT,
    notes TEXT,
    branch_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
