ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS assigned_pharmacy_user_id BIGINT;
ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_assigned_pharmacy_user FOREIGN KEY (assigned_pharmacy_user_id) REFERENCES users(id) ON DELETE SET NULL;

