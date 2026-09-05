ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100);

ALTER TABLE staff_assignments ADD COLUMN IF NOT EXISTS role_id BIGINT;
-- We need to populate role_id for existing rows or allow null temporarily if there are existing rows,
-- assuming clean schema for simplicity or default value. 
-- In a real migration we'd map string role to role_id.
-- Let's drop the string role column after.
ALTER TABLE staff_assignments DROP COLUMN IF EXISTS role;
ALTER TABLE staff_assignments ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE staff_assignments ADD CONSTRAINT fk_staff_assignments_role FOREIGN KEY (role_id) REFERENCES roles(id);
