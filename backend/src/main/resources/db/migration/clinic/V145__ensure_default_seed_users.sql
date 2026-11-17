-- V145__ensure_default_seed_users.sql
-- Ensure essential roles exist
INSERT INTO roles (name, description, login_portal) 
SELECT 'ROLE_ADMIN', 'System Administrator', 'admin' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_ADMIN');

INSERT INTO roles (name, description, login_portal) 
SELECT 'ROLE_SUPER_ADMIN', 'Super Administrator', 'super-admin' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_SUPER_ADMIN');

INSERT INTO roles (name, description, login_portal) 
SELECT 'ROLE_DOCTOR', 'Doctor', 'doctor' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_DOCTOR');

INSERT INTO roles (name, description, login_portal) 
SELECT 'ROLE_PATIENT', 'Standard patient role', 'patient' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_PATIENT');

-- Ensure admin@clinic.com (Password: Clinic@2026#Admin)
INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'admin@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Admin', 'User', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@clinic.com');

UPDATE users 
SET password_hash = '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 
    enabled = true, 
    failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'admin@clinic.com';

-- Ensure doctor@clinic.com (Password: Clinic@2026#Doctor)
INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'doctor@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'John', 'Doe', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'doctor@clinic.com');

UPDATE users 
SET password_hash = '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 
    enabled = true, 
    failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'doctor@clinic.com';

-- Ensure patient@clinic.com (Password: Clinic@2026#Patient)
INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'patient@clinic.com', '$2a$10$6kkQBlZ.gMkb1NMsfd9h7u2gTv.On/tzhSWbC/mvNlqIQ2T/Ktu3q', 'John', 'Smith', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patient@clinic.com');

UPDATE users 
SET password_hash = '$2a$10$6kkQBlZ.gMkb1NMsfd9h7u2gTv.On/tzhSWbC/mvNlqIQ2T/Ktu3q', 
    enabled = true, 
    failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'patient@clinic.com';

-- Link admin to ROLE_ADMIN and ROLE_SUPER_ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@clinic.com' AND r.name IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- Link doctor to ROLE_DOCTOR
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'doctor@clinic.com' AND r.name = 'ROLE_DOCTOR'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- Link patient to ROLE_PATIENT
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'patient@clinic.com' AND r.name = 'ROLE_PATIENT'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);
