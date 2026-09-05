-- V120__fix_all_entity_schema_mismatches.sql
-- Comprehensive migration to align all entity field definitions with the actual DB schema.



-- ambulances
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS ambulance_type VARCHAR(50);
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS fleet_registration_number VARCHAR(50);
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS maintenance_status VARCHAR(50) DEFAULT 'OK';

-- appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(30);

-- anesthesia_records
ALTER TABLE anesthesia_records RENAME COLUMN anesthetist_id TO anesthesiologist_id;
ALTER TABLE anesthesia_records RENAME COLUMN anesthesia_start TO start_time;
ALTER TABLE anesthesia_records RENAME COLUMN anesthesia_end TO end_time;
ALTER TABLE anesthesia_records ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE anesthesia_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- surgery_bookings
ALTER TABLE surgery_bookings RENAME COLUMN surgeon_id TO primary_surgeon_id;
ALTER TABLE surgery_bookings RENAME COLUMN ot_id TO operation_theatre_id;
ALTER TABLE surgery_bookings RENAME COLUMN procedure_name TO surgery_type;
ALTER TABLE surgery_bookings RENAME COLUMN scheduled_start TO scheduled_start_time;
ALTER TABLE surgery_bookings ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE surgery_bookings ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER NOT NULL DEFAULT 60;
ALTER TABLE surgery_bookings ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE surgery_bookings ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE surgery_bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- operation_theatres
ALTER TABLE operation_theatres RENAME COLUMN name TO ot_name;

-- surgery_notes
ALTER TABLE surgery_notes ADD COLUMN IF NOT EXISTS surgeon_id BIGINT;
ALTER TABLE surgery_notes ADD COLUMN IF NOT EXISTS pre_op_diagnosis TEXT;
ALTER TABLE surgery_notes ADD COLUMN IF NOT EXISTS post_op_diagnosis TEXT;
ALTER TABLE surgery_notes ADD COLUMN IF NOT EXISTS procedure_performed TEXT;
ALTER TABLE surgery_notes ADD COLUMN IF NOT EXISTS findings TEXT;
ALTER TABLE surgery_notes ADD COLUMN IF NOT EXISTS complications TEXT;

-- surgical_team_members
ALTER TABLE surgical_team_members ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- pre_op_checklists
ALTER TABLE pre_op_checklists RENAME COLUMN items TO checklist_data;
ALTER TABLE pre_op_checklists ADD COLUMN IF NOT EXISTS notes TEXT;

-- dicom_studies
ALTER TABLE dicom_studies ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE dicom_studies ADD COLUMN IF NOT EXISTS technician_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE dicom_studies ADD COLUMN IF NOT EXISTS acquisition_device VARCHAR(100);

-- imaging_procedures
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS requires_contrast BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS preparation_instructions TEXT;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS turnaround_target_hours INTEGER;
ALTER TABLE imaging_procedures ADD COLUMN IF NOT EXISTS radiation_safety_notes TEXT;

-- imaging_requests
ALTER TABLE imaging_requests ADD COLUMN IF NOT EXISTS turnaround_target_sla TIMESTAMP WITH TIME ZONE;

-- employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id BIGINT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_routing_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_identifier VARCHAR(50);

-- attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift_id BIGINT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS regularization_reason VARCHAR(200);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS regularization_status VARCHAR(30);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS approved_by BIGINT;

-- salary_components
ALTER TABLE salary_components ADD COLUMN IF NOT EXISTS amount_type VARCHAR(30) NOT NULL DEFAULT 'FIXED';
ALTER TABLE salary_components ADD COLUMN IF NOT EXISTS value NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- payroll_runs
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS processed_by BIGINT;

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS patient_profile_id BIGINT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS insurance_coverage NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS patient_responsibility NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_reference ON payments(payment_reference);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- insurance_claims
ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS deductible_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS copay_amount NUMERIC(12, 2) DEFAULT 0;

-- expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_by BIGINT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);

-- ledger_entries
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS journal_entry_id BIGINT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS account_id BIGINT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;

-- NEW TABLE: documents
CREATE TABLE IF NOT EXISTS documents (
    id                  BIGSERIAL PRIMARY KEY,
    owner_type          VARCHAR(50) NOT NULL,
    owner_id            BIGINT NOT NULL,
    document_type       VARCHAR(50) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    storage_key         VARCHAR(512) NOT NULL,
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    original_filename   VARCHAR(255),
    version_number      INTEGER NOT NULL DEFAULT 1,
    previous_version_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    branch_id           BIGINT,
    tenant_id           BIGINT,
    uploaded_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    content_hash        VARCHAR(128),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_owner ON documents(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_doc_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_doc_branch ON documents(branch_id);

-- NEW TABLE: document_shares
CREATE TABLE IF NOT EXISTS document_shares (
    id                  BIGSERIAL PRIMARY KEY,
    document_id         BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_with_user_id BIGINT,
    share_token         VARCHAR(100) UNIQUE,
    permission_level    VARCHAR(50) NOT NULL DEFAULT 'VIEW',
    expires_at          TIMESTAMP WITH TIME ZONE,
    created_by_user_id  BIGINT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at          TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_doc_share_token ON document_shares(share_token);

-- NEW TABLE: document_signatures
CREATE TABLE IF NOT EXISTS document_signatures (
    id                      BIGSERIAL PRIMARY KEY,
    document_id             BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    signed_by_user_id       BIGINT NOT NULL,
    signed_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content_hash_at_signing VARCHAR(128) NOT NULL,
    ip_address              VARCHAR(50),
    signature_note          VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_doc_sig_document ON document_signatures(document_id);

-- NEW TABLE: compliance_audit_logs
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id                  BIGSERIAL PRIMARY KEY,
    event_id            VARCHAR(100) NOT NULL UNIQUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id            BIGINT,
    actor_role          VARCHAR(100),
    actor_type          VARCHAR(50),
    tenant_id           BIGINT,
    module_name         VARCHAR(100),
    action_name         VARCHAR(100) NOT NULL,
    resource_type       VARCHAR(100),
    resource_id         VARCHAR(100),
    patient_id          BIGINT,
    reference_id        VARCHAR(100),
    before_values       TEXT,
    after_values        TEXT,
    outcome             VARCHAR(50) NOT NULL,
    reason              TEXT,
    session_id          VARCHAR(100),
    ip_address          VARCHAR(50),
    user_agent          VARCHAR(255),
    source_channel      VARCHAR(50),
    sensitivity_level   VARCHAR(50),
    break_glass_used    BOOLEAN NOT NULL DEFAULT FALSE,
    previous_hash       VARCHAR(128),
    record_hash         VARCHAR(128) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_patient    ON compliance_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_user       ON compliance_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_module     ON compliance_audit_logs(module_name);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON compliance_audit_logs(action_name);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON compliance_audit_logs(created_at);

-- NEW TABLE: branch_budgets
CREATE TABLE IF NOT EXISTS branch_budgets (
    id               BIGSERIAL PRIMARY KEY,
    branch_id        BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    budget_year      INTEGER NOT NULL,
    budget_month     INTEGER NOT NULL,
    allocated_amount NUMERIC(12, 2) NOT NULL,
    spent_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status           VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE,
    UNIQUE (branch_id, budget_year, budget_month)
);
