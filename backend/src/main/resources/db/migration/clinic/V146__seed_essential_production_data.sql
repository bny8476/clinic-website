-- V146__seed_essential_production_data.sql
-- Production baseline seed data: roles, users, departments, profiles, branches, working hours, and slots
-- Compatible with both PostgreSQL and H2 databases

-- 1. Ensure Roles
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_ADMIN', 'System Administrator', 'admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_ADMIN');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_SUPER_ADMIN', 'Super Administrator', 'super-admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_SUPER_ADMIN');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_SYSTEM_ADMIN', 'System Admin', 'admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_SYSTEM_ADMIN');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_BRANCH_ADMIN', 'Branch Administrator', 'branch-admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_BRANCH_ADMIN');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_DOCTOR', 'Doctor / Physician', 'doctor' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_DOCTOR');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_PATIENT', 'Standard Patient', 'patient' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_PATIENT');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_PHARMACIST', 'Pharmacist', 'pharmacy' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_PHARMACIST');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_NURSE', 'Clinical Nurse', 'nurse' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_NURSE');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_LAB', 'Laboratory Staff', 'lab' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_LAB');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_LAB_TECH', 'Laboratory Technician', 'lab' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_LAB_TECH');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_PATHOLOGIST', 'Pathologist', 'lab' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_PATHOLOGIST');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_LAB_SENIOR', 'Senior Lab Specialist', 'lab' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_LAB_SENIOR');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_RADIOLOGIST', 'Radiologist', 'radiology' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_RADIOLOGIST');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_RECEPTION', 'Front Desk / Receptionist', 'reception' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_RECEPTION');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_FINANCE', 'Finance / Billing Officer', 'finance' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_FINANCE');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_ACCOUNTANT', 'Accountant', 'finance' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_ACCOUNTANT');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_INVENTORY_MANAGER', 'Inventory Manager', 'inventory' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_INVENTORY_MANAGER');
INSERT INTO roles (name, description, login_portal)
SELECT 'ROLE_SUPPORT', 'Support Desk Agent', 'support' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_SUPPORT');

-- 2. Ensure Core Staff & User Accounts (BCrypt encoded)
INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'admin@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Admin', 'User', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'doctor@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'John', 'Doe', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'doctor@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'patient@clinic.com', '$2a$10$6kkQBlZ.gMkb1NMsfd9h7u2gTv.On/tzhSWbC/mvNlqIQ2T/Ktu3q', 'John', 'Smith', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patient@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'nurse@clinic.com', '$2a$10$d9u1bZlX987H786/aBv62OhEevb0fE2kglkY41a.s.o3fE8kP1Vvi', 'Jane', 'Smith', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nurse@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'receptionist@clinic.com', '$2a$10$eO0V4h8U1c8G1A9s9u5Lq.eW9hYq3Hl1a.m2q.s0p.k4p.o5p.o6.', 'Sarah', 'Reception', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'receptionist@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'labtech@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Alex', 'Technician', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'labtech@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'pharmacist@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'David', 'Pharmacist', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'pharmacist@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'radiologist@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Rachel', 'Radiologist', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'radiologist@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'accountant@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Michael', 'Accountant', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'accountant@clinic.com');

UPDATE users 
SET enabled = true, failed_login_attempts = 0, locked_until = NULL
WHERE email IN (
    'admin@clinic.com', 'doctor@clinic.com', 'patient@clinic.com', 
    'nurse@clinic.com', 'receptionist@clinic.com', 'labtech@clinic.com', 
    'pharmacist@clinic.com', 'radiologist@clinic.com', 'accountant@clinic.com'
);

-- 3. Link Users to Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@clinic.com' AND r.name IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_SYSTEM_ADMIN')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'doctor@clinic.com' AND r.name = 'ROLE_DOCTOR'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'patient@clinic.com' AND r.name = 'ROLE_PATIENT'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'nurse@clinic.com' AND r.name = 'ROLE_NURSE'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'receptionist@clinic.com' AND r.name = 'ROLE_RECEPTION'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'labtech@clinic.com' AND r.name IN ('ROLE_LAB_TECH', 'ROLE_LAB')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'pharmacist@clinic.com' AND r.name = 'ROLE_PHARMACIST'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'radiologist@clinic.com' AND r.name = 'ROLE_RADIOLOGIST'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'accountant@clinic.com' AND r.name IN ('ROLE_ACCOUNTANT', 'ROLE_FINANCE')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- 4. Ensure Tenant and Branch
INSERT INTO tenants (id, name, status, subscription_plan, created_at, updated_at)
SELECT 1, 'Main Healthcare Group', 'ACTIVE', 'ENTERPRISE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE id = 1);

INSERT INTO branches (id, tenant_id, name, address, city, state, country, postal_code, phone_number, email, timezone, is_active, created_at, updated_at)
SELECT 1, 1, 'Main Clinic Branch', '123 Health Ave', 'Springfield', 'State', 'USA', '12345', '+1-555-0100', 'contact@clinic.com', 'UTC', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE id = 1);

-- 5. Ensure Core Medical Departments
INSERT INTO departments (id, name, description, is_active)
SELECT 1, 'Cardiology', 'Cardiovascular wellness, diagnosis and treatment of heart conditions', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 1);

INSERT INTO departments (id, name, description, is_active)
SELECT 2, 'Neurology', 'Comprehensive nervous system and brain disorder care', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 2);

INSERT INTO departments (id, name, description, is_active)
SELECT 3, 'Orthopedics', 'Bone, joint, musculoskeletal injury and rehabilitation', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 3);

INSERT INTO departments (id, name, description, is_active)
SELECT 4, 'General Medicine', 'Primary care, preventive health and routine consultations', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 4);

INSERT INTO departments (id, name, description, is_active)
SELECT 5, 'Pediatrics', 'Child health care, vaccinations and developmental monitoring', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 5);

INSERT INTO departments (id, name, description, is_active)
SELECT 6, 'Dermatology', 'Skin, hair, nail health and clinical dermatology', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 6);

INSERT INTO departments (id, name, description, is_active)
SELECT 7, 'Radiology', 'Diagnostic imaging including X-ray, Ultrasound and CT scans', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 7);

INSERT INTO departments (id, name, description, is_active)
SELECT 8, 'Laboratory Services', 'Pathology, biochemistry, hematology, and diagnostic lab testing', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 8);

UPDATE departments SET is_active = true WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8);

-- 6. Doctor Profile for doctor@clinic.com
INSERT INTO doctor_profiles (user_id, specialty, qualifications, experience_years, consultation_fee, bio, registration_number, is_active, branch_id, created_at, updated_at)
SELECT u.id, 'Cardiology', 'MBBS, MD (Cardiology), FACC', 12, 50.00,
       'Senior Consultant Cardiologist specializing in preventive heart health, hypertension, and clinical diagnostics.',
       'DOC-CARD-2026-88', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- Update head doctor of Cardiology
UPDATE departments 
SET head_doctor_id = (SELECT dp.id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com' LIMIT 1)
WHERE id = 1;

-- 7. Doctor Working Hours (Mon-Fri)
INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, branch_id, created_at, updated_at)
SELECT dp.id, 1, '09:00:00', '17:00:00', 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_working_hours dwh WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = 1);

INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, branch_id, created_at, updated_at)
SELECT dp.id, 2, '09:00:00', '17:00:00', 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_working_hours dwh WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = 2);

INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, branch_id, created_at, updated_at)
SELECT dp.id, 3, '09:00:00', '17:00:00', 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_working_hours dwh WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = 3);

INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, branch_id, created_at, updated_at)
SELECT dp.id, 4, '09:00:00', '17:00:00', 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_working_hours dwh WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = 4);

INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, branch_id, created_at, updated_at)
SELECT dp.id, 5, '09:00:00', '17:00:00', 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_working_hours dwh WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = 5);

-- 8. Patient Profile for patient@clinic.com
INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, address, medical_history_summary, allergies, chronic_conditions, current_medications, documents, op_number, branch_id, tenant_id, created_at, updated_at)
SELECT u.id, '1985-06-15', 'Male', 'O+', 'Mary Smith', '+1-555-0198',
       '742 Evergreen Terrace, Springfield',
       'Primary Hypertension - Well Controlled, Routine Health Assessment',
       '["Penicillin"]',
       '["Hypertension"]',
       '["Lipitor 10mg", "Amoxicillin 500mg"]',
       '[]',
       'MRN-2026-001', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'patient@clinic.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.user_id = u.id);

-- 9. Inpatient Hospital Infrastructure: Wards, Rooms, and Beds
INSERT INTO wards (id, name, ward_type, branch_id, floor, capacity, is_active)
SELECT 1, 'General Ward A', 'GENERAL', 1, '2', 10, true
WHERE NOT EXISTS (SELECT 1 FROM wards WHERE id = 1);

INSERT INTO wards (id, name, ward_type, branch_id, floor, capacity, is_active)
SELECT 2, 'ICU Unit', 'ICU', 1, '3', 6, true
WHERE NOT EXISTS (SELECT 1 FROM wards WHERE id = 2);

INSERT INTO rooms (id, ward_id, room_number, room_type, capacity)
SELECT 1, 1, 'Room 201', 'DOUBLE', 2
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE id = 1);

INSERT INTO rooms (id, ward_id, room_number, room_type, capacity)
SELECT 2, 1, 'Room 202', 'DOUBLE', 2
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE id = 2);

INSERT INTO rooms (id, ward_id, room_number, room_type, capacity)
SELECT 3, 2, 'ICU-01', 'CRITICAL', 1
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE id = 3);

INSERT INTO beds (id, room_id, bed_number, status, bed_type, version)
SELECT 1, 1, 'Bed 201-A', 'AVAILABLE', 'STANDARD', 0
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE id = 1);

INSERT INTO beds (id, room_id, bed_number, status, bed_type, version)
SELECT 2, 1, 'Bed 201-B', 'AVAILABLE', 'STANDARD', 0
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE id = 2);

INSERT INTO beds (id, room_id, bed_number, status, bed_type, version)
SELECT 3, 2, 'Bed 202-A', 'AVAILABLE', 'STANDARD', 0
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE id = 3);

INSERT INTO beds (id, room_id, bed_number, status, bed_type, version)
SELECT 4, 3, 'Bed ICU-1', 'AVAILABLE', 'ICU', 0
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE id = 4);

-- 10. Sample Appointment Slots for doctor@clinic.com
INSERT INTO appointment_slots (doctor_id, start_time, end_time, is_booked, branch_id, is_priority, version)
SELECT dp.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 1, false, 0
FROM doctor_profiles dp 
JOIN users u ON dp.user_id = u.id 
WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (SELECT 1 FROM appointment_slots s WHERE s.doctor_id = dp.id);
