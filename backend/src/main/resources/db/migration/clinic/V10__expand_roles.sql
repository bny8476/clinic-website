-- 1. Add login_portal to roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS login_portal VARCHAR(50);

-- Update existing roles
UPDATE roles SET login_portal = 'patient' WHERE name = 'ROLE_PATIENT';
UPDATE roles SET login_portal = 'doctor' WHERE name = 'ROLE_DOCTOR';
UPDATE roles SET login_portal = 'admin' WHERE name = 'ROLE_ADMIN';
UPDATE roles SET login_portal = 'branch-admin' WHERE name = 'ROLE_BRANCH_ADMIN';

-- Insert new roles
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_SUPER_ADMIN', 'Super Administrator', 'super-admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_SUPER_ADMIN');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_NURSE', 'Nurse', 'nurse' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_NURSE');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_RECEPTION', 'Receptionist', 'reception' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_RECEPTION');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_PHARMACIST', 'Pharmacist', 'pharmacist' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_PHARMACIST');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_LAB_TECH', 'Laboratory Technician', 'lab' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_LAB_TECH');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_RADIOLOGIST', 'Radiologist', 'radiologist' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_RADIOLOGIST');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_ACCOUNTANT', 'Accountant', 'accountant' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_ACCOUNTANT');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_HR', 'Human Resources', 'hr' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_HR');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_FINANCE', 'Finance', 'finance' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_FINANCE');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_INVENTORY_MANAGER', 'Inventory Manager', 'inventory' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_INVENTORY_MANAGER');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_CUSTOMER_SUPPORT', 'Customer Support', 'customer-support' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_CUSTOMER_SUPPORT');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_MARKETING', 'Marketing', 'marketing' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_MARKETING');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_VENDOR', 'Vendor', 'vendor' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_VENDOR');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_INSURANCE', 'Insurance Provider', 'insurance' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_INSURANCE');
INSERT INTO roles (name, description, login_portal) SELECT 'ROLE_AMBULANCE', 'Ambulance Service', 'ambulance' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_AMBULANCE');

-- 2. Expand users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- 3. Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    trusted BOOLEAN DEFAULT false,
    UNIQUE(user_id, device_id)
);
