-- V17: HR Module Schema
-- employees links to users via user_id — no name/email duplication
CREATE TABLE IF NOT EXISTS employees (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department  VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    employment_type VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME', -- FULL_TIME, PART_TIME, CONTRACT, INTERN
    date_of_joining DATE NOT NULL,
    salary      DECIMAL(12, 2),
    branch_id   BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id          BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    check_in    TIMESTAMP WITH TIME ZONE,
    check_out   TIMESTAMP WITH TIME ZONE,
    status      VARCHAR(20) NOT NULL DEFAULT 'PRESENT', -- PRESENT, ABSENT, HALF_DAY, ON_LEAVE
    UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id           BIGSERIAL PRIMARY KEY,
    employee_id  BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type   VARCHAR(30) NOT NULL DEFAULT 'CASUAL', -- CASUAL, SICK, EARNED, MATERNITY, UNPAID
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    reason       TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reviewed_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at  TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status    ON leave_requests(status);
