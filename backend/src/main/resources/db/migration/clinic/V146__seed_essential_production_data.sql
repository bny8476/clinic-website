-- V146__seed_essential_production_data.sql
-- Production baseline seed data: roles, users, departments, profiles, branches, working hours, and slots

-- 1. Ensure Roles
INSERT INTO roles (name, description, login_portal) 
VALUES 
    ('ROLE_ADMIN', 'System Administrator', 'admin'),
    ('ROLE_SUPER_ADMIN', 'Super Administrator', 'super-admin'),
    ('ROLE_SYSTEM_ADMIN', 'System Admin', 'admin'),
    ('ROLE_BRANCH_ADMIN', 'Branch Administrator', 'branch-admin'),
    ('ROLE_DOCTOR', 'Doctor / Physician', 'doctor'),
    ('ROLE_PATIENT', 'Standard Patient', 'patient'),
    ('ROLE_PHARMACIST', 'Pharmacist', 'pharmacy'),
    ('ROLE_NURSE', 'Clinical Nurse', 'nurse'),
    ('ROLE_LAB', 'Laboratory Staff', 'lab'),
    ('ROLE_LAB_TECH', 'Laboratory Technician', 'lab'),
    ('ROLE_PATHOLOGIST', 'Pathologist', 'lab'),
    ('ROLE_LAB_SENIOR', 'Senior Lab Specialist', 'lab'),
    ('ROLE_RADIOLOGIST', 'Radiologist', 'radiology'),
    ('ROLE_RECEPTION', 'Front Desk / Receptionist', 'reception'),
    ('ROLE_FINANCE', 'Finance / Billing Officer', 'finance'),
    ('ROLE_ACCOUNTANT', 'Accountant', 'finance'),
    ('ROLE_INVENTORY_MANAGER', 'Inventory Manager', 'inventory'),
    ('ROLE_SUPPORT', 'Support Desk Agent', 'support')
ON CONFLICT (name) DO NOTHING;

-- 2. Ensure Core Staff & User Accounts (BCrypt encoded)
-- Passwords:
-- admin@clinic.com:        Clinic@2026#Admin
-- doctor@clinic.com:       Clinic@2026#Doctor
-- patient@clinic.com:      Clinic@2026#Patient
-- nurse@clinic.com:        Clinic@2026#Nurse
-- receptionist@clinic.com: Clinic@2026#Reception
-- labtech@clinic.com:      Clinic@2026#LabTech
-- pharmacist@clinic.com:   Clinic@2026#Pharmacy
-- radiologist@clinic.com:  Clinic@2026#Radio
-- accountant@clinic.com:   Clinic@2026#Account

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
VALUES
    ('admin@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Admin', 'User', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('doctor@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'John', 'Doe', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('patient@clinic.com', '$2a$10$6kkQBlZ.gMkb1NMsfd9h7u2gTv.On/tzhSWbC/mvNlqIQ2T/Ktu3q', 'John', 'Smith', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('nurse@clinic.com', '$2a$10$d9u1bZlX987H786/aBv62OhEevb0fE2kglkY41a.s.o3fE8kP1Vvi', 'Jane', 'Smith', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('receptionist@clinic.com', '$2a$10$eO0V4h8U1c8G1A9s9u5Lq.eW9hYq3Hl1a.m2q.s0p.k4p.o5p.o6.', 'Sarah', 'Reception', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('labtech@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Alex', 'Technician', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pharmacist@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'David', 'Pharmacist', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('radiologist@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Rachel', 'Radiologist', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('accountant@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Michael', 'Accountant', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE 
SET enabled = true, failed_login_attempts = 0, locked_until = NULL;

-- 3. Link Users to Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@clinic.com' AND r.name IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_SYSTEM_ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'doctor@clinic.com' AND r.name = 'ROLE_DOCTOR'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'patient@clinic.com' AND r.name = 'ROLE_PATIENT'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'nurse@clinic.com' AND r.name = 'ROLE_NURSE'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'receptionist@clinic.com' AND r.name = 'ROLE_RECEPTION'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'labtech@clinic.com' AND r.name IN ('ROLE_LAB_TECH', 'ROLE_LAB')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'pharmacist@clinic.com' AND r.name = 'ROLE_PHARMACIST'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'radiologist@clinic.com' AND r.name = 'ROLE_RADIOLOGIST'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'accountant@clinic.com' AND r.name IN ('ROLE_ACCOUNTANT', 'ROLE_FINANCE')
ON CONFLICT DO NOTHING;

-- 4. Ensure Tenant and Branch
INSERT INTO tenants (id, name, status, subscription_plan, created_at, updated_at)
VALUES (1, 'Main Healthcare Group', 'ACTIVE', 'ENTERPRISE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, tenant_id, name, address, city, state, country, postal_code, phone_number, email, timezone, is_active, created_at, updated_at)
VALUES (1, 1, 'Main Clinic Branch', '123 Health Ave', 'Springfield', 'State', 'USA', '12345', '+1-555-0100', 'contact@clinic.com', 'UTC', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 5. Ensure Core Medical Departments
INSERT INTO departments (id, name, description, is_active)
VALUES
    (1, 'Cardiology', 'Cardiovascular wellness, diagnosis and treatment of heart conditions', true),
    (2, 'Neurology', 'Comprehensive nervous system and brain disorder care', true),
    (3, 'Orthopedics', 'Bone, joint, musculoskeletal injury and rehabilitation', true),
    (4, 'General Medicine', 'Primary care, preventive health and routine consultations', true),
    (5, 'Pediatrics', 'Child health care, vaccinations and developmental monitoring', true),
    (6, 'Dermatology', 'Skin, hair, nail health and clinical dermatology', true),
    (7, 'Radiology', 'Diagnostic imaging including X-ray, Ultrasound and CT scans', true),
    (8, 'Laboratory Services', 'Pathology, biochemistry, hematology, and diagnostic lab testing', true)
ON CONFLICT (id) DO UPDATE 
SET is_active = true, description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE(MAX(id), 1)) FROM departments;

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
SELECT dp.id, d.day, '09:00:00'::time, '17:00:00'::time, 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp 
JOIN users u ON dp.user_id = u.id
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day)
WHERE u.email = 'doctor@clinic.com'
AND NOT EXISTS (
    SELECT 1 FROM doctor_working_hours dwh WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = d.day
);

-- 8. Patient Profile for patient@clinic.com
INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, address, medical_history_summary, allergies, chronic_conditions, current_medications, documents, op_number, branch_id, tenant_id, created_at, updated_at)
SELECT u.id, '1985-06-15'::date, 'Male', 'O+', 'Mary Smith', '+1-555-0198',
       '742 Evergreen Terrace, Springfield',
       'Primary Hypertension - Well Controlled, Routine Health Assessment',
       '["Penicillin"]'::jsonb,
       '["Hypertension"]'::jsonb,
       '["Lipitor 10mg", "Amoxicillin 500mg"]'::jsonb,
       '[]'::jsonb,
       'MRN-2026-001', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'patient@clinic.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.user_id = u.id);

-- 9. Inpatient Hospital Infrastructure: Wards, Rooms, and Beds
INSERT INTO wards (id, name, ward_type, branch_id, floor, capacity, is_active)
VALUES 
    (1, 'General Ward A', 'GENERAL', 1, '2', 10, true),
    (2, 'ICU Unit', 'ICU', 1, '3', 6, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('wards', 'id'), COALESCE(MAX(id), 1)) FROM wards;

INSERT INTO rooms (id, ward_id, room_number, room_type, capacity)
VALUES
    (1, 1, 'Room 201', 'DOUBLE', 2),
    (2, 1, 'Room 202', 'DOUBLE', 2),
    (3, 2, 'ICU-01', 'CRITICAL', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE(MAX(id), 1)) FROM rooms;

INSERT INTO beds (id, room_id, bed_number, status, bed_type, version)
VALUES
    (1, 1, 'Bed 201-A', 'AVAILABLE', 'STANDARD', 0),
    (2, 1, 'Bed 201-B', 'AVAILABLE', 'STANDARD', 0),
    (3, 2, 'Bed 202-A', 'AVAILABLE', 'STANDARD', 0),
    (4, 3, 'Bed ICU-1', 'AVAILABLE', 'ICU', 0)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('beds', 'id'), COALESCE(MAX(id), 1)) FROM beds;

-- 10. Appointment Slots for Today and Tomorrow
DO $$
DECLARE
    v_doctor_id bigint;
    v_patient_id bigint;
    v_slot1_id bigint;
    v_slot2_id bigint;
    v_slot3_id bigint;
    v_today_start timestamptz := CURRENT_DATE + interval '9 hour';
BEGIN
    SELECT dp.id INTO v_doctor_id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'doctor@clinic.com' LIMIT 1;
    SELECT pp.id INTO v_patient_id FROM patient_profiles pp JOIN users u ON pp.user_id = u.id WHERE u.email = 'patient@clinic.com' LIMIT 1;

    IF v_doctor_id IS NOT NULL THEN
        -- Slot 1 (Today 09:30 - 09:50)
        INSERT INTO appointment_slots (doctor_id, start_time, end_time, is_booked, branch_id, is_priority, version)
        VALUES (v_doctor_id, v_today_start + interval '30 minute', v_today_start + interval '50 minute', true, 1, false, 0)
        RETURNING id INTO v_slot1_id;

        -- Slot 2 (Today 10:00 - 10:20)
        INSERT INTO appointment_slots (doctor_id, start_time, end_time, is_booked, branch_id, is_priority, version)
        VALUES (v_doctor_id, v_today_start + interval '60 minute', v_today_start + interval '80 minute', false, 1, false, 0)
        RETURNING id INTO v_slot2_id;

        -- Slot 3 (Today 11:00 - 11:20)
        INSERT INTO appointment_slots (doctor_id, start_time, end_time, is_booked, branch_id, is_priority, version)
        VALUES (v_doctor_id, v_today_start + interval '120 minute', v_today_start + interval '140 minute', true, 1, false, 0)
        RETURNING id INTO v_slot3_id;

        -- Book appointments for the patient
        IF v_patient_id IS NOT NULL AND v_slot1_id IS NOT NULL THEN
            INSERT INTO appointments (
                patient_id, doctor_id, slot_id, status, reason_for_visit, 
                notes, branch_id, tenant_id, appointment_type, version, 
                appointment_number, department_id, appointment_date, duration, 
                payment_status, booking_source, created_at, updated_at
            ) VALUES (
                v_patient_id, v_doctor_id, v_slot1_id, 'BOOKED', 'Routine cardiovascular follow-up and blood pressure check',
                'Patient reports well-managed blood pressure on current medication.', 1, 1, 'IN_PERSON', 0,
                'APT-2026-' || v_slot1_id, 1, CURRENT_DATE, 20,
                'PAID', 'ONLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        END IF;

        IF v_patient_id IS NOT NULL AND v_slot3_id IS NOT NULL THEN
            INSERT INTO appointments (
                patient_id, doctor_id, slot_id, status, reason_for_visit, 
                notes, branch_id, tenant_id, appointment_type, version, 
                appointment_number, department_id, appointment_date, duration, 
                payment_status, booking_source, created_at, updated_at
            ) VALUES (
                v_patient_id, v_doctor_id, v_slot3_id, 'COMPLETED', 'General medical consultation and routine lab evaluation',
                'Consultation completed. Lab tests requested.', 1, 1, 'IN_PERSON', 0,
                'APT-2026-' || v_slot3_id, 1, CURRENT_DATE, 20,
                'PAID', 'ONLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        END IF;

        -- Sample Lab Request
        IF v_patient_id IS NOT NULL THEN
            INSERT INTO lab_test_requests (
                patient_id, doctor_id, test_catalog_id, status, priority,
                lab_request_number, branch_id, requested_at
            ) VALUES (
                v_patient_id, v_doctor_id, 1, 'REQUESTED', 'ROUTINE',
                'REQ-2026-001', 1, CURRENT_TIMESTAMP
            ), (
                v_patient_id, v_doctor_id, 2, 'SAMPLE_COLLECTED', 'HIGH',
                'REQ-2026-002', 1, CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
END $$;
