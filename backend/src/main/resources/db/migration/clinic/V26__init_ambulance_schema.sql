-- V26: Ambulance Emergency Module Schema

CREATE TABLE IF NOT EXISTS ambulances (
    id                BIGSERIAL PRIMARY KEY,
    vehicle_number    VARCHAR(50) NOT NULL UNIQUE,
    model             VARCHAR(100),
    driver_name       VARCHAR(100) NOT NULL,
    driver_phone      VARCHAR(30) NOT NULL,
    current_latitude  DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    status            VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, DISPATCHED, MAINTENANCE
    is_active         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS emergency_requests (
    id                    BIGSERIAL PRIMARY KEY,
    request_number        VARCHAR(50) NOT NULL UNIQUE,
    patient_id            BIGINT REFERENCES users(id) ON DELETE SET NULL,
    pickup_address        TEXT NOT NULL,
    pickup_latitude       DECIMAL(10, 8),
    pickup_longitude      DECIMAL(11, 8),
    emergency_type        VARCHAR(100) NOT NULL DEFAULT 'CARDIAC',
    priority              VARCHAR(20) NOT NULL DEFAULT 'CRITICAL', -- CRITICAL, URGENT, ROUTINE
    status                VARCHAR(30) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, DISPATCHED, EN_ROUTE, COMPLETED, CANCELLED
    assigned_ambulance_id BIGINT REFERENCES ambulances(id) ON DELETE SET NULL,
    requested_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at          TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
