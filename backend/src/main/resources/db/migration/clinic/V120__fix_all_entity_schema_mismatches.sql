-- V120__fix_all_entity_schema_mismatches.sql
-- Comprehensive migration to align all entity field definitions with the actual DB schema.
-- All changes are wrapped in idempotent DO blocks so this is safe to re-run.

-- ============================================================
-- ai_chat_messages: rename legacy columns to match entity
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_chat_messages' AND column_name='sender')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_chat_messages' AND column_name='sender_type')
    THEN
        ALTER TABLE ai_chat_messages RENAME COLUMN sender TO sender_type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_chat_messages' AND column_name='created_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_chat_messages' AND column_name='sent_at')
    THEN
        ALTER TABLE ai_chat_messages RENAME COLUMN created_at TO sent_at;
    END IF;
END $$;

-- ============================================================
-- ambulances: add new columns the entity expects
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='ambulance_type')
    THEN
        ALTER TABLE ambulances ADD COLUMN ambulance_type VARCHAR(50);
        -- Copy from legacy column 'type' if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='type')
        THEN
            UPDATE ambulances SET ambulance_type = type;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='equipment')
    THEN
        ALTER TABLE ambulances ADD COLUMN equipment TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='capacity')
    THEN
        ALTER TABLE ambulances ADD COLUMN capacity INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='fleet_registration_number')
    THEN
        ALTER TABLE ambulances ADD COLUMN fleet_registration_number VARCHAR(50);
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='registration_number')
        THEN
            UPDATE ambulances SET fleet_registration_number = registration_number;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulances' AND column_name='maintenance_status')
    THEN
        ALTER TABLE ambulances ADD COLUMN maintenance_status VARCHAR(50) DEFAULT 'OK';
    END IF;
END $$;

-- ============================================================
-- appointments: add appointment_type
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='appointment_type')
    THEN
        ALTER TABLE appointments ADD COLUMN appointment_type VARCHAR(30);
    END IF;
END $$;

-- ============================================================
-- permissions: entity uses field names that map to action_type / resource_type
-- The DB already has action_type and resource_type columns,
-- but the entity @Column(name="action_type") maps to field "action"
-- and @Column(name="resource_type") maps to field "resource".
-- These are ALREADY correctly named in the DB, the scanner false-positived on this.
-- No change needed.
-- ============================================================

-- ============================================================
-- anesthesia_records: rename columns to match entity
-- ============================================================
DO $$
BEGIN
    -- anesthesiologist_id <- anesthetist_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='anesthetist_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='anesthesiologist_id')
    THEN
        ALTER TABLE anesthesia_records RENAME COLUMN anesthetist_id TO anesthesiologist_id;
    END IF;

    -- start_time <- anesthesia_start
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='anesthesia_start')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='start_time')
    THEN
        ALTER TABLE anesthesia_records RENAME COLUMN anesthesia_start TO start_time;
    END IF;

    -- end_time <- anesthesia_end
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='anesthesia_end')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='end_time')
    THEN
        ALTER TABLE anesthesia_records RENAME COLUMN anesthesia_end TO end_time;
    END IF;

    -- notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='notes')
    THEN
        ALTER TABLE anesthesia_records ADD COLUMN notes TEXT;
    END IF;

    -- created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anesthesia_records' AND column_name='created_at')
    THEN
        ALTER TABLE anesthesia_records ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================
-- surgery_bookings: rename and add columns to match entity
-- ============================================================
DO $$
BEGIN
    -- primary_surgeon_id <- surgeon_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='surgeon_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='primary_surgeon_id')
    THEN
        ALTER TABLE surgery_bookings RENAME COLUMN surgeon_id TO primary_surgeon_id;
    END IF;

    -- operation_theatre_id <- ot_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='ot_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='operation_theatre_id')
    THEN
        ALTER TABLE surgery_bookings RENAME COLUMN ot_id TO operation_theatre_id;
    END IF;

    -- surgery_type <- procedure_name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='procedure_name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='surgery_type')
    THEN
        ALTER TABLE surgery_bookings RENAME COLUMN procedure_name TO surgery_type;
    END IF;

    -- scheduled_start_time <- scheduled_start
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='scheduled_start')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='scheduled_start_time')
    THEN
        ALTER TABLE surgery_bookings RENAME COLUMN scheduled_start TO scheduled_start_time;
    END IF;

    -- diagnosis column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='diagnosis')
    THEN
        ALTER TABLE surgery_bookings ADD COLUMN diagnosis TEXT;
    END IF;

    -- estimated_duration_minutes (was calculated from scheduled_end - scheduled_start)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='estimated_duration_minutes')
    THEN
        ALTER TABLE surgery_bookings ADD COLUMN estimated_duration_minutes INTEGER NOT NULL DEFAULT 60;
        -- Backfill from scheduled_start/end difference if both exist
        UPDATE surgery_bookings 
        SET estimated_duration_minutes = EXTRACT(EPOCH FROM (scheduled_end - scheduled_start_time)) / 60
        WHERE scheduled_end IS NOT NULL AND scheduled_start_time IS NOT NULL
          AND estimated_duration_minutes = 60;
    END IF;

    -- actual_start_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='actual_start_time')
    THEN
        ALTER TABLE surgery_bookings ADD COLUMN actual_start_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- actual_end_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='actual_end_time')
    THEN
        ALTER TABLE surgery_bookings ADD COLUMN actual_end_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_bookings' AND column_name='created_at')
    THEN
        ALTER TABLE surgery_bookings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================
-- operation_theatres: rename 'name' to 'ot_name'
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='operation_theatres' AND column_name='name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='operation_theatres' AND column_name='ot_name')
    THEN
        ALTER TABLE operation_theatres RENAME COLUMN name TO ot_name;
    END IF;
END $$;

-- ============================================================
-- surgery_notes: rename columns to match entity
-- ============================================================
DO $$
BEGIN
    -- surgeon_id <- author_user_id (FK to doctor_profiles)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_notes' AND column_name='surgeon_id')
    THEN
        ALTER TABLE surgery_notes ADD COLUMN surgeon_id BIGINT;
    END IF;

    -- pre_op_diagnosis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_notes' AND column_name='pre_op_diagnosis')
    THEN
        ALTER TABLE surgery_notes ADD COLUMN pre_op_diagnosis TEXT;
    END IF;

    -- post_op_diagnosis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_notes' AND column_name='post_op_diagnosis')
    THEN
        ALTER TABLE surgery_notes ADD COLUMN post_op_diagnosis TEXT;
    END IF;

    -- procedure_performed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_notes' AND column_name='procedure_performed')
    THEN
        ALTER TABLE surgery_notes ADD COLUMN procedure_performed TEXT;
    END IF;

    -- findings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_notes' AND column_name='findings')
    THEN
        ALTER TABLE surgery_notes ADD COLUMN findings TEXT;
    END IF;

    -- complications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgery_notes' AND column_name='complications')
    THEN
        ALTER TABLE surgery_notes ADD COLUMN complications TEXT;
    END IF;
END $$;

-- ============================================================
-- surgical_team_members: add assigned_at
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surgical_team_members' AND column_name='assigned_at')
    THEN
        ALTER TABLE surgical_team_members ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================
-- pre_op_checklists: rename 'items' to 'checklist_data', add 'notes'
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_op_checklists' AND column_name='items')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_op_checklists' AND column_name='checklist_data')
    THEN
        ALTER TABLE pre_op_checklists RENAME COLUMN items TO checklist_data;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_op_checklists' AND column_name='notes')
    THEN
        ALTER TABLE pre_op_checklists ADD COLUMN notes TEXT;
    END IF;
END $$;

-- ============================================================
-- dicom_studies: add missing columns
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dicom_studies' AND column_name='status')
    THEN
        ALTER TABLE dicom_studies ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dicom_studies' AND column_name='technician_id')
    THEN
        ALTER TABLE dicom_studies ADD COLUMN technician_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dicom_studies' AND column_name='acquisition_device')
    THEN
        ALTER TABLE dicom_studies ADD COLUMN acquisition_device VARCHAR(100);
    END IF;
END $$;

-- ============================================================
-- imaging_procedures: add new capability columns
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='imaging_procedures' AND column_name='requires_contrast')
    THEN
        ALTER TABLE imaging_procedures ADD COLUMN requires_contrast BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='imaging_procedures' AND column_name='preparation_instructions')
    THEN
        ALTER TABLE imaging_procedures ADD COLUMN preparation_instructions TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='imaging_procedures' AND column_name='duration_minutes')
    THEN
        ALTER TABLE imaging_procedures ADD COLUMN duration_minutes INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='imaging_procedures' AND column_name='turnaround_target_hours')
    THEN
        ALTER TABLE imaging_procedures ADD COLUMN turnaround_target_hours INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='imaging_procedures' AND column_name='radiation_safety_notes')
    THEN
        ALTER TABLE imaging_procedures ADD COLUMN radiation_safety_notes TEXT;
    END IF;
END $$;

-- ============================================================
-- imaging_requests: add turnaround_target_sla
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='imaging_requests' AND column_name='turnaround_target_sla')
    THEN
        ALTER TABLE imaging_requests ADD COLUMN turnaround_target_sla TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================
-- employees: add new HR fields
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='reporting_manager_id')
    THEN
        ALTER TABLE employees ADD COLUMN reporting_manager_id BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='emergency_contact_name')
    THEN
        ALTER TABLE employees ADD COLUMN emergency_contact_name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='emergency_contact_phone')
    THEN
        ALTER TABLE employees ADD COLUMN emergency_contact_phone VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='bank_account_number')
    THEN
        ALTER TABLE employees ADD COLUMN bank_account_number VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='bank_routing_number')
    THEN
        ALTER TABLE employees ADD COLUMN bank_routing_number VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='tax_identifier')
    THEN
        ALTER TABLE employees ADD COLUMN tax_identifier VARCHAR(50);
    END IF;
END $$;

-- ============================================================
-- attendance: add new fields
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attendance' AND column_name='shift_id')
    THEN
        ALTER TABLE attendance ADD COLUMN shift_id BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attendance' AND column_name='regularization_reason')
    THEN
        ALTER TABLE attendance ADD COLUMN regularization_reason VARCHAR(200);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attendance' AND column_name='regularization_status')
    THEN
        ALTER TABLE attendance ADD COLUMN regularization_status VARCHAR(30);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attendance' AND column_name='approved_by')
    THEN
        ALTER TABLE attendance ADD COLUMN approved_by BIGINT;
    END IF;
END $$;

-- ============================================================
-- leave_balances: entity field 'year' maps to column 'leave_year'
-- DB already has 'leave_year'; entity uses @Column(name="leave_year"). OK.
-- ============================================================

-- ============================================================
-- salary_components: add amount_type and rename amount to value
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salary_components' AND column_name='amount_type')
    THEN
        ALTER TABLE salary_components ADD COLUMN amount_type VARCHAR(30) NOT NULL DEFAULT 'FIXED';
    END IF;

    -- Entity uses 'value' but DB has 'amount' - add 'value' and copy from 'amount'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salary_components' AND column_name='value')
    THEN
        ALTER TABLE salary_components ADD COLUMN value NUMERIC(12, 2) NOT NULL DEFAULT 0;
        UPDATE salary_components SET value = amount;
    END IF;
END $$;

-- ============================================================
-- payroll_runs: add processed_by
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payroll_runs' AND column_name='processed_by')
    THEN
        ALTER TABLE payroll_runs ADD COLUMN processed_by BIGINT;
    END IF;
END $$;

-- ============================================================
-- invoices: add finance fields expected by Invoice entity
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='patient_profile_id')
    THEN
        ALTER TABLE invoices ADD COLUMN patient_profile_id BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='insurance_coverage')
    THEN
        ALTER TABLE invoices ADD COLUMN insurance_coverage NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='patient_responsibility')
    THEN
        ALTER TABLE invoices ADD COLUMN patient_responsibility NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='amount_paid')
    THEN
        ALTER TABLE invoices ADD COLUMN amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='outstanding_balance')
    THEN
        ALTER TABLE invoices ADD COLUMN outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- payments: add columns expected by Payment entity
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='payment_reference')
    THEN
        ALTER TABLE payments ADD COLUMN payment_reference VARCHAR(100);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_reference ON payments(payment_reference) WHERE payment_reference IS NOT NULL;
    END IF;

    -- status column (entity has PaymentStatus enum stored as string)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='status')
    THEN
        ALTER TABLE payments ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='created_at')
    THEN
        ALTER TABLE payments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='updated_at')
    THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================
-- insurance_claims: add deductible_amount and copay_amount
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='insurance_claims' AND column_name='deductible_amount')
    THEN
        ALTER TABLE insurance_claims ADD COLUMN deductible_amount NUMERIC(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='insurance_claims' AND column_name='copay_amount')
    THEN
        ALTER TABLE insurance_claims ADD COLUMN copay_amount NUMERIC(12, 2) DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- expenses: add missing finance fields
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='status')
    THEN
        ALTER TABLE expenses ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='approved_by')
    THEN
        ALTER TABLE expenses ADD COLUMN approved_by BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='approved_at')
    THEN
        ALTER TABLE expenses ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='rejection_reason')
    THEN
        ALTER TABLE expenses ADD COLUMN rejection_reason VARCHAR(500);
    END IF;
END $$;

-- ============================================================
-- ledger_entries: entity uses JournalEntry FK and ChartOfAccount FK
-- DB has simple columns. Add FK columns.
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ledger_entries' AND column_name='journal_entry_id')
    THEN
        ALTER TABLE ledger_entries ADD COLUMN journal_entry_id BIGINT;
        -- Add FK if journal_entries table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries')
        THEN
            ALTER TABLE ledger_entries 
                ADD CONSTRAINT fk_ledger_journal_entry 
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ledger_entries' AND column_name='account_id')
    THEN
        ALTER TABLE ledger_entries ADD COLUMN account_id BIGINT;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='chart_of_accounts')
        THEN
            ALTER TABLE ledger_entries 
                ADD CONSTRAINT fk_ledger_account 
                FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ledger_entries' AND column_name='debit_amount')
    THEN
        ALTER TABLE ledger_entries ADD COLUMN debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ledger_entries' AND column_name='credit_amount')
    THEN
        ALTER TABLE ledger_entries ADD COLUMN credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- NEW TABLE: documents
-- ============================================================
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

-- ============================================================
-- NEW TABLE: document_shares
-- ============================================================
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

-- ============================================================
-- NEW TABLE: document_signatures
-- ============================================================
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

-- ============================================================
-- NEW TABLE: compliance_audit_logs
-- ============================================================
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

-- ============================================================
-- NEW TABLE: branch_budgets
-- ============================================================
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
