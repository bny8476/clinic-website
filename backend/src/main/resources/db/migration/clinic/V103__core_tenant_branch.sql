ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- branch_id already exists in appointments

ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- branch_id already exists in patient_profiles

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- branch_id already exists in invoices

ALTER TABLE emergency_patient_records ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
ALTER TABLE emergency_patient_records ADD COLUMN IF NOT EXISTS branch_id BIGINT;

-- Clean up orphan IDs before enforcing FK constraints
INSERT INTO branches (id, name, address, city, state, country, postal_code, timezone, created_at, updated_at) 
SELECT 1, 'Main Branch', '123 Main St', 'City', 'State', 'Country', '000000', 'UTC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
WHERE NOT EXISTS (SELECT 1 FROM branches);

UPDATE patient_profiles SET branch_id = (SELECT id FROM branches LIMIT 1) WHERE branch_id NOT IN (SELECT id FROM branches);
UPDATE appointments SET branch_id = NULL WHERE branch_id IS NOT NULL AND branch_id NOT IN (SELECT id FROM branches);
UPDATE appointments SET tenant_id = NULL WHERE tenant_id IS NOT NULL AND tenant_id NOT IN (SELECT id FROM tenants);
UPDATE patient_profiles SET tenant_id = NULL WHERE tenant_id IS NOT NULL AND tenant_id NOT IN (SELECT id FROM tenants);
UPDATE invoices SET tenant_id = NULL WHERE tenant_id IS NOT NULL AND tenant_id NOT IN (SELECT id FROM tenants);
UPDATE emergency_patient_records SET branch_id = NULL WHERE branch_id IS NOT NULL AND branch_id NOT IN (SELECT id FROM branches);
UPDATE emergency_patient_records SET tenant_id = NULL WHERE tenant_id IS NOT NULL AND tenant_id NOT IN (SELECT id FROM tenants);

-- Add foreign keys for tenant and branch
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

ALTER TABLE patient_profiles ADD CONSTRAINT fk_patient_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE patient_profiles ADD CONSTRAINT fk_patient_profiles_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
-- fk for invoices to branch already exists from V15

ALTER TABLE emergency_patient_records ADD CONSTRAINT fk_emergency_records_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE emergency_patient_records ADD CONSTRAINT fk_emergency_records_branch FOREIGN KEY (branch_id) REFERENCES branches(id);
