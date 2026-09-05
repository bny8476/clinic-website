-- V89: Ambulance Phase 20 Core Schema Updates

-- 1. Ambulance Drivers
CREATE TABLE IF NOT EXISTS ambulance_drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE (user_id)
);

-- 2. Ambulance Paramedics
CREATE TABLE IF NOT EXISTS ambulance_paramedics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_number VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    is_available BOOLEAN NOT NULL DEFAULT true,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE (user_id)
);

-- 3. Hospital Destinations
CREATE TABLE IF NOT EXISTS hospital_destinations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    emergency_capacity INT,
    is_internal_branch BOOLEAN NOT NULL DEFAULT false,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL
);

-- 4. Update Ambulances Table
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS driver_id BIGINT REFERENCES ambulance_drivers(id) ON DELETE SET NULL;
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BLS';
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS equipment_level VARCHAR(50);
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);

-- 5. Update Emergency Requests Table
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_name VARCHAR(100);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_phone VARCHAR(30);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_relation VARCHAR(50);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS incident_description TEXT;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS clinical_red_flags TEXT;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS hospital_destination_id BIGINT REFERENCES hospital_destinations(id) ON DELETE SET NULL;

-- 6. Ambulance Assignments (Active Trips)
CREATE TABLE IF NOT EXISTS ambulance_assignments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    ambulance_id BIGINT NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
    paramedic_id BIGINT REFERENCES ambulance_paramedics(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED', -- ASSIGNED, EN_ROUTE, ON_SCENE, TRANSPORTING, ARRIVED_AT_HOSPITAL, COMPLETED, CANCELLED
    estimated_arrival_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (request_id)
);

-- 7. Trip Histories
CREATE TABLE IF NOT EXISTS ambulance_trip_histories (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES ambulance_assignments(id) ON DELETE CASCADE,
    total_distance_km DECIMAL(10, 2),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    fuel_used DECIMAL(10, 2),
    outcome VARCHAR(100),
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assignment_id)
);

-- 8. Emergency Patient Records (Pre-Hospital Care)
CREATE TABLE IF NOT EXISTS emergency_patient_records (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    vitals_summary TEXT,
    interventions TEXT,
    medication_administered TEXT,
    crew_notes TEXT,
    handover_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (request_id)
);

-- 9. Ambulance Trip Billings
CREATE TABLE IF NOT EXISTS ambulance_trip_billings (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES ambulance_trip_histories(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    dispatch_fee DECIMAL(10, 2),
    distance_fee DECIMAL(10, 2),
    equipment_fee DECIMAL(10, 2),
    oxygen_fee DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, INVOICED, PAID, WAIVED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (trip_id)
);

CREATE INDEX IF NOT EXISTS idx_ambulance_assignments_status ON ambulance_assignments(status);
CREATE INDEX IF NOT EXISTS idx_ambulance_trip_billings_status ON ambulance_trip_billings(status);
