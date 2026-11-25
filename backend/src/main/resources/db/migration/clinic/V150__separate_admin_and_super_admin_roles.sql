-- V150__separate_admin_and_super_admin_roles.sql
-- Ensure admin@clinic.com does not have ROLE_SUPER_ADMIN
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@clinic.com')
  AND role_id = (SELECT id FROM roles WHERE name = 'ROLE_SUPER_ADMIN');

-- Ensure superadmin@clinic.com exists and has ROLE_SUPER_ADMIN
INSERT INTO users (email, password_hash, first_name, last_name, enabled, failed_login_attempts, created_at, updated_at)
SELECT 'superadmin@clinic.com', '$2a$10$at2tctCif3dv1tKDp.8Nf.WyyJFFiWx5Azr0syoBNVrw9zxddE4SO', 'Super', 'Admin', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@clinic.com');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'superadmin@clinic.com' AND r.name = 'ROLE_SUPER_ADMIN'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);
