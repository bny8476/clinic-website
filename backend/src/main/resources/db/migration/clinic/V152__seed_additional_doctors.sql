-- V152__seed_additional_doctors.sql
-- Seed specialist doctors across primary clinic departments: Pediatrics, Orthopedics, Neurology, Dermatology, General Medicine

-- 1. Ensure User Accounts for Doctors
INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'emily.davis@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'Emily', 'Davis', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'emily.davis@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'michael.lee@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'Michael', 'Lee', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'michael.lee@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'sarah.jenkins@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'Sarah', 'Jenkins', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah.jenkins@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'robert.chen@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'Robert', 'Chen', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'robert.chen@clinic.com');

INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'amanda.smith@clinic.com', '$2a$10$EXjDWnzJn2rTwnAtCqwzW.WekZP7wv4/GB4Fc8gv1jQnUbroNd6bK', 'Amanda', 'Smith', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'amanda.smith@clinic.com');

-- 2. Link Doctors to ROLE_DOCTOR
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email IN ('emily.davis@clinic.com', 'michael.lee@clinic.com', 'sarah.jenkins@clinic.com', 'robert.chen@clinic.com', 'amanda.smith@clinic.com')
  AND r.name = 'ROLE_DOCTOR'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- 3. Doctor Profiles
-- Dr. Emily Davis (Pediatrics)
INSERT INTO doctor_profiles (user_id, specialty, qualifications, experience_years, consultation_fee, bio, registration_number, is_active, branch_id, created_at, updated_at)
SELECT u.id, 'Pediatrics', 'MBBS, MD (Pediatrics), FAAP', 11, 85.00,
       'Board-certified pediatrician dedicated to comprehensive child health, developmental monitoring, and preventive care.',
       'DOC-PED-2026-42', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'emily.davis@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- Dr. Michael Lee (Orthopedics)
INSERT INTO doctor_profiles (user_id, specialty, qualifications, experience_years, consultation_fee, bio, registration_number, is_active, branch_id, created_at, updated_at)
SELECT u.id, 'Orthopedics', 'MS (Ortho), MCh, FACS', 16, 120.00,
       'Senior orthopedic surgeon specializing in joint replacement, sports traumatology, arthroscopic surgery, and musculoskeletal rehabilitation.',
       'DOC-SURG-2026-19', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'michael.lee@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- Dr. Sarah Jenkins (Neurology)
INSERT INTO doctor_profiles (user_id, specialty, qualifications, experience_years, consultation_fee, bio, registration_number, is_active, branch_id, created_at, updated_at)
SELECT u.id, 'Neurology', 'MBBS, MD (Neurology), DM', 14, 130.00,
       'Clinical neurologist focusing on migraine therapies, neuropathic disorders, neurodegenerative care, and comprehensive EEG evaluation.',
       'DOC-NEUR-2026-31', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'sarah.jenkins@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- Dr. Robert Chen (Dermatology)
INSERT INTO doctor_profiles (user_id, specialty, qualifications, experience_years, consultation_fee, bio, registration_number, is_active, branch_id, created_at, updated_at)
SELECT u.id, 'Dermatology', 'MBBS, MD (Dermatology)', 9, 90.00,
       'Dermatologist specializing in clinical dermatology, acne therapies, allergic skin conditions, and aesthetic skin health.',
       'DOC-DERM-2026-55', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'robert.chen@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- Dr. Amanda Smith (General Medicine)
INSERT INTO doctor_profiles (user_id, specialty, qualifications, experience_years, consultation_fee, bio, registration_number, is_active, branch_id, created_at, updated_at)
SELECT u.id, 'General Medicine', 'MBBS, MD (Internal Medicine)', 13, 75.00,
       'Consultant in internal medicine focusing on lifestyle disease management, routine preventive checkups, and diagnostic medicine.',
       'DOC-GEN-2026-73', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'amanda.smith@clinic.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- 4. Update Department Head Doctors
UPDATE departments 
SET head_doctor_id = (SELECT dp.id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'sarah.jenkins@clinic.com' LIMIT 1)
WHERE id = 2; -- Neurology

UPDATE departments 
SET head_doctor_id = (SELECT dp.id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'michael.lee@clinic.com' LIMIT 1)
WHERE id = 3; -- Orthopedics

UPDATE departments 
SET head_doctor_id = (SELECT dp.id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'amanda.smith@clinic.com' LIMIT 1)
WHERE id = 4; -- General Medicine

UPDATE departments 
SET head_doctor_id = (SELECT dp.id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'emily.davis@clinic.com' LIMIT 1)
WHERE id = 5; -- Pediatrics

UPDATE departments 
SET head_doctor_id = (SELECT dp.id FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.email = 'robert.chen@clinic.com' LIMIT 1)
WHERE id = 6; -- Dermatology

-- 5. Doctor Working Hours (Mon-Fri for all doctors)
INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, branch_id, created_at, updated_at)
SELECT dp.id, d.day_num, '09:00:00', '17:00:00', 20, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctor_profiles dp
CROSS JOIN (SELECT 1 AS day_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) d
WHERE dp.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM doctor_working_hours dwh 
    WHERE dwh.doctor_id = dp.id AND dwh.day_of_week = d.day_num
  );
