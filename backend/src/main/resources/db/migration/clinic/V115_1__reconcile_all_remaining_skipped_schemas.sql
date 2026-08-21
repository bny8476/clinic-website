-- Comprehensive Reconcilation of ALL Remaining Skipped Migrations (V61-V114)
-- Flyway ignored these migrations on production because of outOfOrder=false and the baselineVersion.
-- This script safely applies them using IF NOT EXISTS.

-- ==========================================
-- Source: V61__add_queue_token_unique_constraint.sql
-- ==========================================

ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS generated_date DATE;
UPDATE queue_tokens SET generated_date = CAST(generated_at AS DATE);
ALTER TABLE queue_tokens ALTER COLUMN generated_date SET NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_queue_token_branch_day') THEN
        ALTER TABLE queue_tokens ADD CONSTRAINT uq_queue_token_branch_day UNIQUE (branch_id, token_number, generated_date);
    END IF;
END $$;



-- ==========================================
-- Source: V62__implement_lab_workflow.sql
-- ==========================================

-- Phase 5: Laboratory Information System Workflow enhancements

-- 1. Extend lab_test_catalog
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS specimen_type VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS turnaround_target_hours INTEGER;
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- 2. Extend lab_test_requests
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS encounter_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL;
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL;

-- Migrate existing statuses to the new strict state machine
UPDATE lab_test_requests SET status = 'DRAFT' WHERE status = 'REQUESTED' AND (sample_collected_at IS NULL);
UPDATE lab_test_requests SET status = 'COLLECTED' WHERE status = 'SAMPLE_COLLECTED';
UPDATE lab_test_requests SET status = 'IN_PROGRESS' WHERE status = 'PROCESSING';

-- 3. Extend lab_sample_collections
ALTER TABLE lab_sample_collections ADD COLUMN IF NOT EXISTS storage_state VARCHAR(50);
ALTER TABLE lab_sample_collections ADD COLUMN IF NOT EXISTS chain_of_custody JSONB;
ALTER TABLE lab_sample_collections ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(100);

-- 4. Create lab_test_panels
CREATE TABLE IF NOT EXISTS lab_test_panels (
    id BIGSERIAL PRIMARY KEY,
    panel_id BIGINT NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    test_id BIGINT NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    CONSTRAINT uk_panel_test UNIQUE (panel_id, test_id)
);

-- 5. Create lab_reference_range_history
CREATE TABLE IF NOT EXISTS lab_reference_range_history (
    id BIGSERIAL PRIMARY KEY,
    test_catalog_id BIGINT NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    reference_range VARCHAR(255) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);



-- ==========================================
-- Source: V64__add_patient_portal_batch_1.sql
-- ==========================================

-- Migration for Phase 8 Batch 1: Patient Portal

-- Dependent Profiles
CREATE TABLE IF NOT EXISTS dependent_profiles (
    id BIGSERIAL PRIMARY KEY,
    guardian_patient_id BIGINT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    relationship VARCHAR(50),
    medical_history_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_dependent_guardian FOREIGN KEY (guardian_patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

-- Emergency Contacts (replaces plain text fields)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50),
    primary_phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    consent_to_contact BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_emergency_contact_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS patient_notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_notif_pref_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    UNIQUE(patient_id, category)
);

-- Consent Versions
CREATE TABLE IF NOT EXISTS consent_versions (
    id BIGSERIAL PRIMARY KEY,
    consent_type VARCHAR(50) NOT NULL UNIQUE,
    version_id VARCHAR(50) NOT NULL,
    document_text TEXT NOT NULL,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient Consents
DROP TABLE IF EXISTS patient_consents;
CREATE TABLE IF NOT EXISTS patient_consents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    consent_version_id BIGINT NOT NULL,
    is_granted BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_consent_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_consent_version FOREIGN KEY (consent_version_id) REFERENCES consent_versions(id)
);

-- Seed initial consent versions
INSERT INTO consent_versions (consent_type, version_id, document_text, is_latest) VALUES
('TELECONSULTATION', 'v1.0.0', 'I consent to receive healthcare services via telemedicine...', true),
('DATA_EXPORT', 'v1.0.0', 'I authorize the export of my complete medical history...', true),
('AI_ASSISTANT', 'v1.0.0', 'I understand this AI is not a doctor and I consent to its use...', true),
('GENERAL_TREATMENT', 'v1.0.0', 'I consent to general medical treatment by the clinic staff...', true)
ON CONFLICT (consent_type) DO NOTHING;



-- ==========================================
-- Source: V66__add_patient_portal_batch_3.sql
-- ==========================================

-- V66__add_patient_portal_batch_3.sql
-- Add tables for AI Assistant and Patient Documents

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_session_patient ON ai_chat_sessions(patient_id);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES ai_chat_sessions(id),
    sender VARCHAR(50) NOT NULL, -- 'USER' or 'AI'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_msg_session ON ai_chat_messages(session_id);

CREATE TABLE IF NOT EXISTS patient_documents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'Lab Report', 'Prescription', 'Medical Record', 'Other'
    file_url VARCHAR(1024) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_doc_patient ON patient_documents(patient_id);



-- ==========================================
-- Source: V67__add_patient_portal_batch_4.sql
-- ==========================================

-- V67__add_patient_portal_batch_4.sql
-- Add tables for Insurance Claims, Payments, and Notifications

CREATE TABLE IF NOT EXISTS patient_insurance_claims (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    claim_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_claims_patient ON patient_insurance_claims(patient_id);

CREATE TABLE IF NOT EXISTS patient_portal_payments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_portal_payments_patient ON patient_portal_payments(patient_id);

CREATE TABLE IF NOT EXISTS patient_notifications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_notif_patient ON patient_notifications(patient_id);



-- ==========================================
-- Source: V68__add_clinical_encounter_tables.sql
-- ==========================================

-- V68__add_clinical_encounter_tables.sql
-- Phase 9 Batch 1: Encounter, SOAP Note, Diagnosis, Allergies

CREATE TABLE IF NOT EXISTS clinical_encounters (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    appointment_id BIGINT REFERENCES appointments(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    chief_complaint TEXT,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_encounters_patient ON clinical_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_encounters_doctor ON clinical_encounters(doctor_id);

CREATE TABLE IF NOT EXISTS soap_notes (
    id BIGSERIAL PRIMARY KEY,
    encounter_id BIGINT NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    version INT NOT NULL DEFAULT 1,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    amendment_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_soap_notes_encounter ON soap_notes(encounter_id);

CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    code_system VARCHAR(50) NOT NULL, -- e.g., ICD-10, SNOMED
    code VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Primary', -- Primary, Secondary
    onset_date DATE,
    severity VARCHAR(50),
    clinical_status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Resolved
    certainty VARCHAR(50) NOT NULL DEFAULT 'Provisional', -- Provisional, Confirmed
    notes TEXT,
    recorded_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient ON patient_diagnoses(patient_id);

CREATE TABLE IF NOT EXISTS patient_allergies (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    allergen VARCHAR(255) NOT NULL,
    allergy_type VARCHAR(50) NOT NULL, -- Drug, Food, Environmental
    reaction VARCHAR(255),
    severity VARCHAR(50), -- Mild, Moderate, Severe, Critical
    onset DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Inactive, Entered_in_Error
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Unverified', -- Unverified, Verified, Patient_Reported
    source VARCHAR(100),
    recorded_by BIGINT NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON patient_allergies(patient_id);



-- ==========================================
-- Source: V69__add_advanced_eprescribing.sql
-- ==========================================

-- V69__add_advanced_eprescribing.sql
-- Phase 9 Batch 2: Advanced E-Prescribing & Clinical Safety

-- Enhance prescriptions with encounter link and digital signature fields
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS encounter_id BIGINT REFERENCES clinical_encounters(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Draft'; -- Draft, Signed, Void, Cancelled
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Create a dedicated table for structured overrides if not fully covered by cds_alerts
CREATE TABLE IF NOT EXISTS cds_overrides (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES cds_alerts(id),
    prescription_id BIGINT REFERENCES prescriptions(id),
    overridden_by BIGINT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cds_overrides_alert ON cds_overrides(alert_id);
CREATE INDEX IF NOT EXISTS idx_cds_overrides_prescription ON cds_overrides(prescription_id);



-- ==========================================
-- Source: V70__add_referral_and_communication_tables.sql
-- ==========================================

-- V70__add_referral_and_communication_tables.sql

CREATE TABLE IF NOT EXISTS clinical_referrals (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    referring_doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    referred_to_specialty VARCHAR(100),
    referred_to_doctor_id BIGINT REFERENCES doctor_profiles(id),
    referred_to_facility VARCHAR(255),
    reason_for_referral TEXT NOT NULL,
    clinical_notes TEXT,
    priority VARCHAR(50) DEFAULT 'Routine',
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical_attachments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_path TEXT NOT NULL,
    document_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    patient_id BIGINT REFERENCES patient_profiles(id),
    encounter_id BIGINT REFERENCES clinical_encounters(id),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- ==========================================
-- Source: V71__add_clinical_billing_outbox.sql
-- ==========================================

-- V71__add_clinical_billing_outbox.sql

CREATE TABLE IF NOT EXISTS billing_outbox (
    id BIGSERIAL PRIMARY KEY,
    encounter_id BIGINT NOT NULL REFERENCES clinical_encounters(id),
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    doctor_id BIGINT NOT NULL REFERENCES users(id),
    service_type VARCHAR(100) NOT NULL, -- e.g., "Consultation", "Procedure"
    service_code VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processed, Failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);



-- ==========================================
-- Source: V72__add_teleconsultation.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS teleconsultation_sessions (
    id BIGSERIAL PRIMARY KEY,
    encounter_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    room_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, WAITING, IN_PROGRESS, COMPLETED, CANCELLED
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tele_encounter FOREIGN KEY (encounter_id) REFERENCES clinical_encounters(id)
);



-- ==========================================
-- Source: V73__add_nursing_ward_beds.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS wards (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50) NOT NULL, -- ICU, GENERAL, MATERNITY, PEDIATRIC, SURGICAL
    capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beds (
    id BIGSERIAL PRIMARY KEY,
    ward_id BIGINT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE, BLOCKED
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bed_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
    CONSTRAINT uk_ward_bed UNIQUE (ward_id, bed_number)
);

CREATE TABLE IF NOT EXISTS bed_assignments (
    id BIGSERIAL PRIMARY KEY,
    bed_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    encounter_id BIGINT NOT NULL,
    assigned_by BIGINT NOT NULL, -- User ID
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, TRANSFERRED, DISCHARGED
    notes TEXT,
    CONSTRAINT fk_assignment_bed FOREIGN KEY (bed_id) REFERENCES beds(id)
);

CREATE TABLE IF NOT EXISTS ward_transfers (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    encounter_id BIGINT NOT NULL,
    source_bed_id BIGINT,
    destination_bed_id BIGINT,
    requested_by BIGINT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, IN_TRANSIT, COMPLETED, CANCELLED
    priority VARCHAR(20) DEFAULT 'ROUTINE', -- ROUTINE, URGENT
    reason TEXT,
    transfer_notes TEXT,
    CONSTRAINT fk_transfer_src_bed FOREIGN KEY (source_bed_id) REFERENCES beds(id),
    CONSTRAINT fk_transfer_dest_bed FOREIGN KEY (destination_bed_id) REFERENCES beds(id)
);



-- ==========================================
-- Source: V74__add_nursing_documentation.sql
-- ==========================================

ALTER TABLE nursing_notes ADD COLUMN IF NOT EXISTS encounter_id BIGINT;
ALTER TABLE nursing_notes ADD COLUMN IF NOT EXISTS note_type VARCHAR(50) DEFAULT 'PROGRESS';
ALTER TABLE nursing_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE nursing_notes ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS nursing_care_plans (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    encounter_id BIGINT,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    diagnosis VARCHAR(255) NOT NULL,
    goals TEXT NOT NULL,
    interventions TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, DISCONTINUED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fall_risk_assessments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    encounter_id BIGINT,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- LOW, MODERATE, HIGH
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS pain_assessments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    encounter_id BIGINT,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pain_score INT NOT NULL, -- 0-10
    pain_location VARCHAR(100),
    pain_characteristics VARCHAR(255),
    interventions TEXT,
    reassessment_time TIMESTAMP WITH TIME ZONE,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- ==========================================
-- Source: V75__add_nursing_tasks_meds.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS nursing_tasks (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    encounter_id BIGINT,
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL, -- MEDICATION, OBSERVATION, PROCEDURE, OTHER
    description TEXT NOT NULL,
    due_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shift_handovers (
    id BIGSERIAL PRIMARY KEY,
    ward_id BIGINT REFERENCES wards(id) ON DELETE SET NULL,
    outgoing_nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incoming_nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handover_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    shift_summary TEXT NOT NULL,
    pending_tasks TEXT,
    critical_patients TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' -- DRAFT, COMPLETED
);

CREATE TABLE IF NOT EXISTS medication_incidents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- WRONG_DOSE, WRONG_TIME, WRONG_PATIENT, WRONG_MEDICATION, ADVERSE_REACTION, REFUSAL
    incident_time TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    action_taken TEXT,
    doctor_notified BOOLEAN DEFAULT FALSE,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'OPEN' -- OPEN, UNDER_REVIEW, CLOSED
);



-- ==========================================
-- Source: V76__add_nursing_escalation.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS nurse_escalations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    encounter_id BIGINT,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    clinical_context TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL, -- ROUTINE, URGENT, EMERGENCY
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED
    escalated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

CREATE TABLE IF NOT EXISTS nursing_checklists (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    encounter_id BIGINT,
    nurse_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checklist_type VARCHAR(50) NOT NULL, -- ADMISSION, TRANSFER, DISCHARGE, PRE_OP
    items_json TEXT NOT NULL, -- JSON array of items and their completion status
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' -- IN_PROGRESS, COMPLETED
);



-- ==========================================
-- Source: V77__add_reception_identity.sql
-- ==========================================

-- V77__add_reception_identity.sql

-- Add OP number and duplicate tracking to patient_profiles
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS op_number VARCHAR(50) UNIQUE;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS is_duplicate_of BIGINT REFERENCES patient_profiles(id);
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS merge_reason VARCHAR(255);
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(20) DEFAULT 'EMAIL';

-- Patient Identity Verification table
CREATE TABLE IF NOT EXISTS patient_identity_verifications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    verification_method VARCHAR(50) NOT NULL, -- e.g., OTP, GOVERNMENT_ID, STAFF_CONFIRMATION
    verified_by_user_id BIGINT NOT NULL REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- SUCCESS, FAILED, PENDING
    failure_reason VARCHAR(255),
    document_reference VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_patient_op_number ON patient_profiles(op_number);
CREATE INDEX IF NOT EXISTS idx_patient_identity_patient ON patient_identity_verifications(patient_id);



-- ==========================================
-- Source: V78__add_walkin_and_queue_mgmt.sql
-- ==========================================

ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS queue_transfers (
    id BIGSERIAL PRIMARY KEY,
    token_id BIGINT NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
    from_doctor_id BIGINT REFERENCES users(id),
    to_doctor_id BIGINT REFERENCES users(id),
    reason TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transferred_by_user_id BIGINT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS no_shows (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    appointment_id BIGINT REFERENCES appointments(id),
    walk_in_id BIGINT REFERENCES walk_in_registrations(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id BIGINT REFERENCES users(id),
    reason TEXT
);

ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 0;
ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS current_department VARCHAR(100) DEFAULT 'GENERAL';



-- ==========================================
-- Source: V79__add_reception_billing.sql
-- ==========================================

-- Migration: V79__add_reception_billing.sql
-- Description: Adds tables for reception billing, payments, and insurance verifications

CREATE TABLE IF NOT EXISTS clinic_bills (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT,
    appointment_id BIGINT,
    walk_in_id BIGINT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (walk_in_id) REFERENCES walk_in_registrations(id)
);

CREATE TABLE IF NOT EXISTS clinic_bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    department VARCHAR(100),
    FOREIGN KEY (bill_id) REFERENCES clinic_bills(id)
);

CREATE TABLE IF NOT EXISTS clinic_payments (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES clinic_bills(id)
);

CREATE TABLE IF NOT EXISTS insurance_verifications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    coverage_details TEXT,
    verified_at TIMESTAMP,
    verified_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);



-- ==========================================
-- Source: V80__add_kiosk_checkin.sql
-- ==========================================

-- V80__add_kiosk_checkin.sql
-- Description: Kiosk self-check-in records and reception document scanning audit

-- Kiosk self-check-in sessions
CREATE TABLE IF NOT EXISTS kiosk_checkins (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patient_profiles(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    appointment_id BIGINT REFERENCES appointments(id),
    checkin_method VARCHAR(50) NOT NULL DEFAULT 'KIOSK', -- KIOSK, RECEPTION, WALK_IN
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, CHECKED_IN, NO_SHOW
    kiosk_station VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_staff BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_checkin_branch ON kiosk_checkins(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_kiosk_checkin_patient ON kiosk_checkins(patient_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_checkin_appointment ON kiosk_checkins(appointment_id);

-- Reception document scanning audit — who uploaded a document on behalf of a patient
CREATE TABLE IF NOT EXISTS reception_document_uploads (
    id BIGSERIAL PRIMARY KEY,
    patient_document_id BIGINT NOT NULL REFERENCES patient_documents(id),
    uploaded_by_staff_id BIGINT REFERENCES users(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    scan_device VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reception_doc_upload_patient_doc ON reception_document_uploads(patient_document_id);
CREATE INDEX IF NOT EXISTS idx_reception_doc_upload_branch ON reception_document_uploads(branch_id);



-- ==========================================
-- Source: V81__add_lab_catalog_and_barcodes.sql
-- ==========================================

-- V81__add_lab_catalog_and_barcodes.sql
-- Enhance lab_test_catalog with more configuration
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS container_type VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS collection_instructions TEXT;
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS method VARCHAR(100);
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS insurance_eligible BOOLEAN DEFAULT true;
ALTER TABLE lab_test_catalog ADD COLUMN IF NOT EXISTS preparation_instructions TEXT;

-- Create lab_barcodes table to manage specimen barcodes properly
CREATE TABLE IF NOT EXISTS lab_barcodes (
    id BIGSERIAL PRIMARY KEY,
    barcode_value VARCHAR(50) UNIQUE NOT NULL,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    lab_request_number VARCHAR(50) NOT NULL, -- To group multiple requests
    specimen_type VARCHAR(100) NOT NULL,
    container_type VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by BIGINT REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PRINTED' -- PRINTED, SCANNED, REJECTED
);

CREATE INDEX IF NOT EXISTS idx_lab_barcode_value ON lab_barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_lab_barcode_req_num ON lab_barcodes(lab_request_number);



-- ==========================================
-- Source: V82__add_hr_phase15.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS salary_structures (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_components (
    id BIGSERIAL PRIMARY KEY,
    salary_structure_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payslips (
    id BIGSERIAL PRIMARY KEY,
    payroll_run_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    basic_pay DECIMAL(12,2) NOT NULL,
    total_allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);



-- ==========================================
-- Source: V83__marketing_phase16_core.sql
-- ==========================================

-- V83: Marketing/CRM Phase 16 - Complete Schema
-- Extends existing campaigns, coupons, patient_loyalty, referrals tables
-- and adds all new Marketing/CRM tables.

-- ─── Extend existing campaigns table ────────────────────────────────────────
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective       VARCHAR(100);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_segment_id BIGINT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS channels        JSONB        NOT NULL DEFAULT '["EMAIL"]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS content_template_id BIGINT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget          DECIMAL(12,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS owner_id        BIGINT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS branch_id       BIGINT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date      TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date        TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS frequency_cap_per_user INT NOT NULL DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS approved_by     BIGINT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS approved_at     TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS success_metrics JSONB;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS archived_at     TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_type   VARCHAR(50) NOT NULL DEFAULT 'GENERAL';

-- ─── Extend existing coupons table ──────────────────────────────────────────
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS campaign_id         BIGINT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS eligible_service_ids JSONB;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS branch_ids          JSONB;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS segment_id          BIGINT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_patient_limit   INT NOT NULL DEFAULT 1;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_stackable        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS approved_by         BIGINT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS approved_at         TIMESTAMP WITH TIME ZONE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS purpose             VARCHAR(100);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_by          BIGINT;

-- ─── Extend existing patient_loyalty table ───────────────────────────────────
ALTER TABLE patient_loyalty ADD COLUMN IF NOT EXISTS lifetime_earned    INT NOT NULL DEFAULT 0;
ALTER TABLE patient_loyalty ADD COLUMN IF NOT EXISTS lifetime_redeemed  INT NOT NULL DEFAULT 0;
ALTER TABLE patient_loyalty ADD COLUMN IF NOT EXISTS last_earned_at     TIMESTAMP WITH TIME ZONE;
ALTER TABLE patient_loyalty ADD COLUMN IF NOT EXISTS last_redeemed_at   TIMESTAMP WITH TIME ZONE;

-- ─── Extend existing referrals table ────────────────────────────────────────
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS program_id              BIGINT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_code           VARCHAR(30) UNIQUE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_link           VARCHAR(500);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS lead_id                 BIGINT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS converted_patient_id    BIGINT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS qualifying_reference_id BIGINT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS fraud_review_status     VARCHAR(30) NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_issued_at        TIMESTAMP WITH TIME ZONE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_type             VARCHAR(30);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_value            DECIMAL(10,2);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS expires_at              TIMESTAMP WITH TIME ZONE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- ─── Campaign Segments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_segments (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    criteria_json   JSONB        NOT NULL DEFAULT '{}',
    estimated_count INT          NOT NULL DEFAULT 0,
    version         INT          NOT NULL DEFAULT 1,
    created_by      BIGINT,
    branch_id       BIGINT,
    is_public       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Marketing Consents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_consents (
    id               BIGSERIAL PRIMARY KEY,
    patient_id       BIGINT,
    lead_id          BIGINT,
    channel          VARCHAR(30)  NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH, IN_APP
    consent_state    VARCHAR(20)  NOT NULL DEFAULT 'OPTED_IN', -- OPTED_IN, OPTED_OUT
    consent_source   VARCHAR(100), -- REGISTRATION, PORTAL, KIOSK, CAMPAIGN, MANUAL
    wording_version  VARCHAR(20),
    purpose          VARCHAR(100),
    captured_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMP WITH TIME ZONE,
    withdrawn_at     TIMESTAMP WITH TIME ZONE,
    ip_address       VARCHAR(50),
    branch_id        BIGINT,
    operator_id      BIGINT,
    CONSTRAINT chk_consent_owner CHECK (patient_id IS NOT NULL OR lead_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_mkt_consent_patient ON marketing_consents(patient_id, channel, consent_state);
CREATE INDEX IF NOT EXISTS idx_mkt_consent_lead ON marketing_consents(lead_id, channel, consent_state);

-- ─── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id                      BIGSERIAL PRIMARY KEY,
    source                  VARCHAR(50)  NOT NULL, -- WEBSITE, KIOSK, WALK_IN, REFERRAL, CAMPAIGN, EVENT, PHONE, PARTNER, MANUAL
    owner_id                BIGINT,
    branch_id               BIGINT,
    first_name              VARCHAR(100),
    last_name               VARCHAR(100),
    phone                   VARCHAR(30),
    email                   VARCHAR(255),
    interest                VARCHAR(200),
    status                  VARCHAR(30)  NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, QUALIFIED, APPOINTMENT_BOOKED, CONVERTED, NURTURING, LOST, ARCHIVED
    score                   INT          NOT NULL DEFAULT 0,
    deduplication_key       VARCHAR(64)  UNIQUE, -- SHA-256 of normalized phone+email
    campaign_id             BIGINT,
    referral_source         VARCHAR(200),
    communication_preference VARCHAR(30) DEFAULT 'ANY', -- ANY, EMAIL, SMS, PHONE, WHATSAPP
    converted_patient_id    BIGINT,
    lost_reason             TEXT,
    next_action_at          TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_branch ON leads(branch_id);
CREATE INDEX IF NOT EXISTS idx_leads_dedup ON leads(deduplication_key);

-- ─── Lead Activities ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_activities (
    id            BIGSERIAL PRIMARY KEY,
    lead_id       BIGINT       NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50)  NOT NULL, -- CALL, EMAIL, SMS, WHATSAPP, TASK, APPOINTMENT_BOOKED, NOTE, ESCALATION, REASSIGNMENT, LOST
    notes         TEXT,
    outcome       VARCHAR(100),
    next_step     TEXT,
    due_at        TIMESTAMP WITH TIME ZONE,
    completed_at  TIMESTAMP WITH TIME ZONE,
    performed_by  BIGINT,
    channel       VARCHAR(30),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);

-- ─── Loyalty Tiers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(50)   NOT NULL UNIQUE,
    min_points          INT           NOT NULL,
    max_points          INT,
    benefits            JSONB,
    earning_multiplier  DECIMAL(4,2)  NOT NULL DEFAULT 1.00,
    branch_scope        JSONB, -- NULL = all branches
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Loyalty Transactions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id                BIGSERIAL PRIMARY KEY,
    patient_id        BIGINT       NOT NULL,
    type              VARCHAR(30)  NOT NULL, -- EARNED, REDEEMED, ADJUSTED, EXPIRED, REVERSED, REFUNDED
    points            INT          NOT NULL,
    reference_type    VARCHAR(50), -- INVOICE, REDEMPTION, ADMIN, REFERRAL, EXPIRY
    reference_id      BIGINT,
    balance_before    INT          NOT NULL,
    balance_after     INT          NOT NULL,
    idempotency_key   VARCHAR(100) UNIQUE,
    notes             TEXT,
    approved_by       BIGINT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_patient ON loyalty_transactions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_idem ON loyalty_transactions(idempotency_key);

-- ─── Membership Plans ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_plans (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(200)  NOT NULL,
    description       TEXT,
    price             DECIMAL(10,2) NOT NULL,
    validity_days     INT           NOT NULL,
    benefits          JSONB,
    included_services JSONB,
    discount_percent  DECIMAL(5,2)  NOT NULL DEFAULT 0,
    max_dependents    INT           NOT NULL DEFAULT 0,
    branch_ids        JSONB, -- NULL = all branches
    renewal_policy    VARCHAR(50),
    status            VARCHAR(30)   NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, ARCHIVED
    terms_version     VARCHAR(20),
    created_by        BIGINT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Patient Memberships ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_memberships (
    id                BIGSERIAL PRIMARY KEY,
    patient_id        BIGINT        NOT NULL,
    plan_id           BIGINT        NOT NULL REFERENCES membership_plans(id),
    status            VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRING, RENEWED, PAUSED, CANCELLED, EXPIRED
    start_date        DATE          NOT NULL,
    end_date          DATE          NOT NULL,
    activated_by      BIGINT,
    cancelled_at      TIMESTAMP WITH TIME ZONE,
    cancel_reason     TEXT,
    usage_summary     JSONB,
    renewed_from_id   BIGINT,
    invoice_id        BIGINT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_active_membership UNIQUE (patient_id, plan_id, status)
);
CREATE INDEX IF NOT EXISTS idx_patient_memberships_patient ON patient_memberships(patient_id);

-- ─── Referral Programs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_programs (
    id                        BIGSERIAL PRIMARY KEY,
    name                      VARCHAR(200) NOT NULL,
    reward_type               VARCHAR(30)  NOT NULL, -- POINTS, COUPON, GIFT_CARD
    reward_value              DECIMAL(10,2) NOT NULL,
    qualifying_event          VARCHAR(50)  NOT NULL, -- APPOINTMENT_COMPLETED, PAID_INVOICE
    max_reward_per_referrer   INT          NOT NULL DEFAULT 10,
    max_reward_per_referee    INT          NOT NULL DEFAULT 1,
    expiry_days               INT          NOT NULL DEFAULT 90,
    fraud_review_required     BOOLEAN      NOT NULL DEFAULT FALSE,
    status                    VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    created_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Gift Cards ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
    id                    BIGSERIAL PRIMARY KEY,
    code_hash             VARCHAR(64)   NOT NULL UNIQUE, -- SHA-256 of plaintext code
    code_suffix           VARCHAR(4)    NOT NULL, -- last 4 chars for display
    initial_balance       DECIMAL(10,2) NOT NULL,
    current_balance       DECIMAL(10,2) NOT NULL,
    issued_to_patient_id  BIGINT,
    purchased_by_patient_id BIGINT,
    purchase_invoice_id   BIGINT,
    branch_id             BIGINT,
    status                VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, REDEEMED, EXPIRED, CANCELLED
    activated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at            TIMESTAMP WITH TIME ZONE,
    cancelled_at          TIMESTAMP WITH TIME ZONE,
    redemption_count      INT           NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_patient ON gift_cards(issued_to_patient_id);

-- ─── Coupon Usages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_usages (
    id              BIGSERIAL PRIMARY KEY,
    coupon_id       BIGINT        NOT NULL REFERENCES coupons(id),
    patient_id      BIGINT        NOT NULL,
    invoice_id      BIGINT,
    applied_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    discount_applied DECIMAL(10,2) NOT NULL,
    branch_id       BIGINT,
    CONSTRAINT uq_coupon_patient_invoice UNIQUE (coupon_id, patient_id, invoice_id)
);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_patient ON coupon_usages(patient_id);

-- ─── Campaign Deliveries ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_deliveries (
    id                  BIGSERIAL PRIMARY KEY,
    campaign_id         BIGINT       NOT NULL REFERENCES campaigns(id),
    patient_id          BIGINT,
    lead_id             BIGINT,
    channel             VARCHAR(30)  NOT NULL,
    status              VARCHAR(30)  NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENT, DELIVERED, OPENED, CLICKED, BOUNCED, UNSUBSCRIBED, FAILED
    provider_message_id VARCHAR(200),
    delivered_at        TIMESTAMP WITH TIME ZONE,
    opened_at           TIMESTAMP WITH TIME ZONE,
    clicked_at          TIMESTAMP WITH TIME ZONE,
    bounced_at          TIMESTAMP WITH TIME ZONE,
    unsubscribed_at     TIMESTAMP WITH TIME ZONE,
    failure_reason      VARCHAR(500),
    idempotency_key     VARCHAR(100) UNIQUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_delivery_recipient CHECK (patient_id IS NOT NULL OR lead_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_campaign ON campaign_deliveries(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_patient ON campaign_deliveries(patient_id);

-- ─── Communication History ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communication_history (
    id                  BIGSERIAL PRIMARY KEY,
    patient_id          BIGINT,
    lead_id             BIGINT,
    campaign_id         BIGINT,
    template_id         BIGINT,
    channel             VARCHAR(30)  NOT NULL,
    direction           VARCHAR(20)  NOT NULL DEFAULT 'OUTBOUND', -- OUTBOUND, INBOUND
    event_type          VARCHAR(50)  NOT NULL, -- SENT, DELIVERED, OPENED, CLICKED, REPLIED, OPT_OUT, COMPLAINT, CALL_NOTE
    content_summary     VARCHAR(500), -- template name/subject only, NO PHI
    operator_id         BIGINT,
    consent_state       VARCHAR(20),
    branch_id           BIGINT,
    provider_message_id VARCHAR(200),
    event_timestamp     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comm_history_patient ON communication_history(patient_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_comm_history_lead ON communication_history(lead_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_comm_history_campaign ON communication_history(campaign_id);

-- ─── Campaign Automations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_automations (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    trigger_type        VARCHAR(50)  NOT NULL, -- NEW_LEAD, INACTIVE_PATIENT, MISSED_APPOINTMENT, BIRTHDAY, PREVENTIVE_CARE, MEMBERSHIP_RENEWAL, REFERRAL_COMPLETION, FEEDBACK_REQUEST, ABANDONED_BOOKING, POST_VISIT
    eligibility_criteria JSONB       NOT NULL DEFAULT '{}',
    delay_minutes       INT          NOT NULL DEFAULT 0,
    channel             VARCHAR(30)  NOT NULL,
    template_id         BIGINT,
    stop_conditions     JSONB        NOT NULL DEFAULT '[]',
    frequency_cap       INT          NOT NULL DEFAULT 1,
    quiet_hours_start   TIME,
    quiet_hours_end     TIME,
    branch_id           BIGINT,
    status              VARCHAR(30)  NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, ACTIVE, PAUSED, ARCHIVED
    version             INT          NOT NULL DEFAULT 1,
    approved_by         BIGINT,
    approved_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Automation Enrollments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_enrollments (
    id              BIGSERIAL PRIMARY KEY,
    automation_id   BIGINT      NOT NULL REFERENCES campaign_automations(id),
    patient_id      BIGINT,
    lead_id         BIGINT,
    status          VARCHAR(30) NOT NULL DEFAULT 'ENROLLED', -- ENROLLED, SENT, COMPLETED, STOPPED, CANCELLED
    enrolled_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    send_after      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    stop_reason     VARCHAR(200),
    CONSTRAINT uq_automation_enrollment UNIQUE (automation_id, patient_id, lead_id)
);
CREATE INDEX IF NOT EXISTS idx_auto_enroll_automation ON automation_enrollments(automation_id, status);

-- ─── NPS Surveys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nps_surveys (
    id                BIGSERIAL PRIMARY KEY,
    appointment_id    BIGINT,
    order_id          BIGINT,
    patient_id        BIGINT       NOT NULL,
    branch_id         BIGINT,
    service_id        BIGINT,
    doctor_id         BIGINT,
    sent_at           TIMESTAMP WITH TIME ZONE,
    completed_at      TIMESTAMP WITH TIME ZONE,
    status            VARCHAR(30)  NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, COMPLETED, EXPIRED, SUPPRESSED
    idempotency_key   VARCHAR(100) NOT NULL UNIQUE, -- prevents duplicate surveys per event
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nps_patient ON nps_surveys(patient_id);

-- ─── NPS Responses ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nps_responses (
    id                  BIGSERIAL PRIMARY KEY,
    survey_id           BIGINT        NOT NULL REFERENCES nps_surveys(id),
    nps_score           INT           CHECK (nps_score BETWEEN 0 AND 10),
    rating              INT           CHECK (rating BETWEEN 1 AND 5),
    comments            TEXT,
    category            VARCHAR(100),
    escalation_status   VARCHAR(30)   NOT NULL DEFAULT 'NONE', -- NONE, ESCALATED, RESOLVED
    escalated_to        BIGINT,
    resolved_at         TIMESTAMP WITH TIME ZONE,
    resolution_notes    TEXT,
    submitted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_survey_response UNIQUE (survey_id)
);



-- ==========================================
-- Source: V84__ecommerce_phase17_core.sql
-- ==========================================

-- ============================================================
-- V84: Phase 17 — Healthcare eCommerce Complete Schema
-- Non-destructive: ALTER TABLE ADD COLUMN IF NOT EXISTS only (no data loss)
-- H2-compatible: TEXT used for JSON fields (not JSONB)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. CATEGORIES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_categories (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(200) NOT NULL,
    slug             VARCHAR(200) NOT NULL UNIQUE,
    description      TEXT,
    parent_id        BIGINT REFERENCES ec_categories(id) ON DELETE SET NULL,
    image_url        VARCHAR(500),
    display_order    INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    meta_title       VARCHAR(255),
    meta_description VARCHAR(500),
    branch_scope     TEXT,                        -- JSON: ["ALL"] or branch IDs
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_categories_parent ON ec_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_ec_categories_active ON ec_categories(is_active);

-- ──────────────────────────────────────────────────────────────
-- 2. BRANDS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_brands (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(200) NOT NULL UNIQUE,
    slug                VARCHAR(200) NOT NULL UNIQUE,
    manufacturer        VARCHAR(300),
    country_of_origin   VARCHAR(100),
    logo_url            VARCHAR(500),
    compliance_status   VARCHAR(30) NOT NULL DEFAULT 'COMPLIANT', -- COMPLIANT, UNDER_REVIEW, SUSPENDED
    is_active           BOOLEAN NOT NULL DEFAULT true,
    description         TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE
);

-- ──────────────────────────────────────────────────────────────
-- 3. EXTEND EXISTING ecommerce_products TABLE
-- ──────────────────────────────────────────────────────────────
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS barcode              VARCHAR(100) UNIQUE;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS generic_name         VARCHAR(300);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS brand_id             BIGINT REFERENCES ec_brands(id);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS category_id          BIGINT REFERENCES ec_categories(id);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS mrp                  DECIMAL(10,2);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS tax_class            VARCHAR(50) NOT NULL DEFAULT 'MEDICINE_12';
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS hsn_code             VARCHAR(20);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS pack_size            VARCHAR(100);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS dosage_strength      VARCHAR(100);
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS age_restriction      INT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS cold_chain_required  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS regulatory_status    VARCHAR(50) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS product_status       VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS return_eligible      BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS images               TEXT;          -- JSON array of image URLs
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS specifications       TEXT;          -- JSON key-value pairs
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS ingredients          TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS warnings             TEXT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS warranty_months      INT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS weight_grams         INT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS branch_id            BIGINT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS activated_at         TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS created_by           BIGINT;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS updated_by           BIGINT;

CREATE INDEX IF NOT EXISTS idx_ec_products_category  ON ecommerce_products(category_id);
CREATE INDEX IF NOT EXISTS idx_ec_products_brand     ON ecommerce_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_ec_products_status    ON ecommerce_products(product_status);
CREATE INDEX IF NOT EXISTS idx_ec_products_rx        ON ecommerce_products(prescription_required);

-- ──────────────────────────────────────────────────────────────
-- 4. STOCK BATCHES (FEFO)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_stock_batches (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES ecommerce_products(id) ON DELETE CASCADE,
    branch_id       BIGINT,
    batch_number    VARCHAR(100) NOT NULL,
    expiry_date     DATE,
    manufactured_date DATE,
    quantity_total  INT NOT NULL DEFAULT 0,
    quantity_available INT NOT NULL DEFAULT 0,
    quantity_reserved  INT NOT NULL DEFAULT 0,
    is_quarantined  BOOLEAN NOT NULL DEFAULT false,
    is_recalled     BOOLEAN NOT NULL DEFAULT false,
    quarantine_reason VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE,
    UNIQUE (product_id, branch_id, batch_number)
);
CREATE INDEX IF NOT EXISTS idx_ec_stock_batches_product   ON ec_stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_ec_stock_batches_expiry    ON ec_stock_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ec_stock_batches_branch    ON ec_stock_batches(branch_id);

-- ──────────────────────────────────────────────────────────────
-- 5. STOCK MOVEMENTS (AUDIT LOG)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_stock_movements (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES ecommerce_products(id),
    batch_id        BIGINT REFERENCES ec_stock_batches(id),
    branch_id       BIGINT,
    movement_type   VARCHAR(30) NOT NULL, -- RECEIVED, RESERVED, RELEASED, SOLD, RETURNED, DISPOSED, ADJUSTMENT
    quantity        INT NOT NULL,
    reference_type  VARCHAR(50),          -- ORDER, RETURN, CART, ADJUSTMENT
    reference_id    BIGINT,
    performed_by    BIGINT,
    notes           VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ec_stock_movements_product ON ec_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_ec_stock_movements_ref     ON ec_stock_movements(reference_type, reference_id);

-- ──────────────────────────────────────────────────────────────
-- 6. STOCK RESERVATIONS (CART HOLD)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_stock_reservations (
    id          BIGSERIAL PRIMARY KEY,
    cart_id     BIGINT NOT NULL,
    product_id  BIGINT NOT NULL REFERENCES ecommerce_products(id),
    batch_id    BIGINT REFERENCES ec_stock_batches(id),
    quantity    INT NOT NULL,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RELEASED, CONVERTED
    released_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ec_reservations_cart    ON ec_stock_reservations(cart_id);
CREATE INDEX IF NOT EXISTS idx_ec_reservations_expires ON ec_stock_reservations(expires_at, status);

-- ──────────────────────────────────────────────────────────────
-- 7. CARTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_carts (
    id                      BIGSERIAL PRIMARY KEY,
    patient_id              BIGINT REFERENCES users(id),
    session_key             VARCHAR(128) UNIQUE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MERGED, CHECKED_OUT, ABANDONED, EXPIRED
    coupon_code             VARCHAR(100),
    loyalty_points_applied  INT NOT NULL DEFAULT 0,
    branch_id               BIGINT,
    expires_at              TIMESTAMP WITH TIME ZONE,
    merged_into_cart_id     BIGINT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_carts_patient ON ec_carts(patient_id);
CREATE INDEX IF NOT EXISTS idx_ec_carts_session ON ec_carts(session_key);
CREATE INDEX IF NOT EXISTS idx_ec_carts_status  ON ec_carts(status);

-- ──────────────────────────────────────────────────────────────
-- 8. CART ITEMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_cart_items (
    id              BIGSERIAL PRIMARY KEY,
    cart_id         BIGINT NOT NULL REFERENCES ec_carts(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES ecommerce_products(id),
    quantity        INT NOT NULL,
    price_snapshot  DECIMAL(10,2) NOT NULL,
    mrp_snapshot    DECIMAL(10,2),
    prescription_id BIGINT,
    notes           VARCHAR(300),
    added_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_ec_cart_items_cart ON ec_cart_items(cart_id);

-- ──────────────────────────────────────────────────────────────
-- 9. WISHLISTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_wishlists (
    id                      BIGSERIAL PRIMARY KEY,
    patient_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id              BIGINT NOT NULL REFERENCES ecommerce_products(id) ON DELETE CASCADE,
    alert_price_drop        BOOLEAN NOT NULL DEFAULT false,
    alert_back_in_stock     BOOLEAN NOT NULL DEFAULT false,
    added_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (patient_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_ec_wishlists_patient ON ec_wishlists(patient_id);

-- ──────────────────────────────────────────────────────────────
-- 10. DELIVERY ADDRESSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_delivery_addresses (
    id                      BIGSERIAL PRIMARY KEY,
    patient_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label                   VARCHAR(50) NOT NULL DEFAULT 'HOME', -- HOME, WORK, OTHER
    recipient_name          VARCHAR(200) NOT NULL,
    recipient_phone         VARCHAR(20) NOT NULL,
    address_line1           VARCHAR(300) NOT NULL,
    address_line2           VARCHAR(300),
    landmark                VARCHAR(200),
    city                    VARCHAR(100) NOT NULL,
    state                   VARCHAR(100) NOT NULL,
    pincode                 VARCHAR(10) NOT NULL,
    country                 VARCHAR(50) NOT NULL DEFAULT 'IN',
    is_default              BOOLEAN NOT NULL DEFAULT false,
    is_serviceable          BOOLEAN NOT NULL DEFAULT true,
    delivery_instructions   VARCHAR(500),
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_addresses_patient ON ec_delivery_addresses(patient_id);

-- ──────────────────────────────────────────────────────────────
-- 11. DELIVERY ZONES (SERVICEABILITY)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_delivery_zones (
    id                  BIGSERIAL PRIMARY KEY,
    pincode             VARCHAR(10) NOT NULL,
    city                VARCHAR(100),
    state               VARCHAR(100),
    zone                VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    is_serviceable      BOOLEAN NOT NULL DEFAULT true,
    min_delivery_days   INT NOT NULL DEFAULT 1,
    max_delivery_days   INT NOT NULL DEFAULT 5,
    carrier             VARCHAR(100),
    free_shipping_above DECIMAL(10,2),
    base_shipping_fee   DECIMAL(10,2) NOT NULL DEFAULT 49.00,
    updated_at          TIMESTAMP WITH TIME ZONE,
    UNIQUE (pincode)
);
CREATE INDEX IF NOT EXISTS idx_ec_delivery_zones_pincode ON ec_delivery_zones(pincode);

-- ──────────────────────────────────────────────────────────────
-- 12. EXTEND ecommerce_orders TABLE
-- ──────────────────────────────────────────────────────────────
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS order_number        VARCHAR(30) UNIQUE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS patient_id          BIGINT REFERENCES users(id);
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS cart_id             BIGINT REFERENCES ec_carts(id);
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS address_id          BIGINT REFERENCES ec_delivery_addresses(id);
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS coupon_id           BIGINT;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS subtotal            DECIMAL(10,2);
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS tax_amount          DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS shipping_amount     DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS loyalty_points_used INT NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS idempotency_key     VARCHAR(128) UNIQUE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS prescription_review_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS branch_id           BIGINT;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS invoice_id          BIGINT;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_status      VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS fulfillment_status  VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500);
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS notes               VARCHAR(500);
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS packed_at           TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS dispatched_at       TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivered_at        TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS returned_at         TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_ec_orders_patient    ON ecommerce_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_ec_orders_number     ON ecommerce_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_ec_orders_pay_status ON ecommerce_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_ec_orders_ful_status ON ecommerce_orders(fulfillment_status);

-- ──────────────────────────────────────────────────────────────
-- 13. ORDER STATUS HISTORY (IMMUTABLE LOG)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_order_status_history (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
    status      VARCHAR(50) NOT NULL,
    actor_id    BIGINT,
    actor_role  VARCHAR(50),
    note        VARCHAR(500),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ec_order_history_order ON ec_order_status_history(order_id);

-- ──────────────────────────────────────────────────────────────
-- 14. PRESCRIPTION LINKS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_prescription_links (
    id              BIGSERIAL PRIMARY KEY,
    order_item_id   BIGINT NOT NULL REFERENCES ecommerce_order_items(id) ON DELETE CASCADE,
    prescription_id BIGINT NOT NULL,
    patient_id      BIGINT NOT NULL REFERENCES users(id),
    doctor_id       BIGINT,
    verified_by     BIGINT,
    qty_authorised  INT NOT NULL,
    qty_dispensed   INT NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED, DISPENSED
    rejection_reason VARCHAR(500),
    verified_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ec_rx_links_order_item    ON ec_prescription_links(order_item_id);
CREATE INDEX IF NOT EXISTS idx_ec_rx_links_prescription  ON ec_prescription_links(prescription_id);
CREATE INDEX IF NOT EXISTS idx_ec_rx_links_patient       ON ec_prescription_links(patient_id);

-- ──────────────────────────────────────────────────────────────
-- 15. PAYMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_payments (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES ecommerce_orders(id),
    provider            VARCHAR(50) NOT NULL DEFAULT 'MOCK',  -- RAZORPAY, STRIPE, MOCK
    provider_ref        VARCHAR(200),
    idempotency_key     VARCHAR(128) NOT NULL UNIQUE,
    amount              DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
    status              VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    pg_response         TEXT,                                  -- JSON blob from provider
    webhook_verified    BOOLEAN NOT NULL DEFAULT false,
    payment_method      VARCHAR(50),                           -- UPI, CARD, WALLET, COD, NETBANKING
    error_code          VARCHAR(100),
    error_description   VARCHAR(500),
    initiated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    authorized_at       TIMESTAMP WITH TIME ZONE,
    captured_at         TIMESTAMP WITH TIME ZONE,
    failed_at           TIMESTAMP WITH TIME ZONE,
    refund_ref          VARCHAR(200),
    refunded_at         TIMESTAMP WITH TIME ZONE,
    refunded_amount     DECIMAL(10,2)
);
CREATE INDEX IF NOT EXISTS idx_ec_payments_order         ON ec_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_ec_payments_provider_ref  ON ec_payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_ec_payments_status        ON ec_payments(status);

-- ──────────────────────────────────────────────────────────────
-- 16. SHIPMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_shipments (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL REFERENCES ecommerce_orders(id),
    carrier                 VARCHAR(100),
    tracking_number         VARCHAR(200),
    carrier_ref             VARCHAR(200),
    delivery_address_id     BIGINT REFERENCES ec_delivery_addresses(id),
    weight_grams            INT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'READY',
    assigned_to             BIGINT,
    assigned_at             TIMESTAMP WITH TIME ZONE,
    picked_up_at            TIMESTAMP WITH TIME ZONE,
    out_for_delivery_at     TIMESTAMP WITH TIME ZONE,
    delivered_at            TIMESTAMP WITH TIME ZONE,
    failed_delivery_at      TIMESTAMP WITH TIME ZONE,
    failure_reason          VARCHAR(300),
    proof_of_delivery_url   VARCHAR(500),
    otp_required            BOOLEAN NOT NULL DEFAULT false,
    otp_verified            BOOLEAN NOT NULL DEFAULT false,
    cold_chain_evidence     TEXT,                              -- JSON
    return_to_origin        BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_shipments_order    ON ec_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_ec_shipments_tracking ON ec_shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_ec_shipments_status   ON ec_shipments(status);

-- ──────────────────────────────────────────────────────────────
-- 17. SHIPMENT EVENTS (IMMUTABLE TRACKING LOG)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_shipment_events (
    id           BIGSERIAL PRIMARY KEY,
    shipment_id  BIGINT NOT NULL REFERENCES ec_shipments(id) ON DELETE CASCADE,
    event_type   VARCHAR(50) NOT NULL,
    location     VARCHAR(200),
    notes        VARCHAR(500),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ec_shipment_events ON ec_shipment_events(shipment_id);

-- ──────────────────────────────────────────────────────────────
-- 18. FULFILLMENT TASKS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_fulfillment_tasks (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL REFERENCES ecommerce_orders(id),
    assigned_to             BIGINT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    prescription_verified   BOOLEAN NOT NULL DEFAULT false,
    prescription_verified_by BIGINT,
    prescription_verified_at TIMESTAMP WITH TIME ZONE,
    items_picked            TEXT,                              -- JSON
    packing_evidence_url    VARCHAR(500),
    notes                   VARCHAR(500),
    started_at              TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id)
);
CREATE INDEX IF NOT EXISTS idx_ec_fulfillment_order  ON ec_fulfillment_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_ec_fulfillment_status ON ec_fulfillment_tasks(status);

-- ──────────────────────────────────────────────────────────────
-- 19. RETURNS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_returns (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES ecommerce_orders(id),
    requested_by        BIGINT NOT NULL REFERENCES users(id),
    reason              VARCHAR(100) NOT NULL,
    reason_detail       VARCHAR(500),
    evidence_urls       TEXT,                                  -- JSON array
    status              VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    approved_by         BIGINT,
    rejection_reason    VARCHAR(500),
    inspection_notes    VARCHAR(500),
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    received_at         TIMESTAMP WITH TIME ZONE,
    inspected_at        TIMESTAMP WITH TIME ZONE,
    restocked_at        TIMESTAMP WITH TIME ZONE,
    disposed_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_returns_order  ON ec_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_ec_returns_status ON ec_returns(status);

-- ──────────────────────────────────────────────────────────────
-- 20. RETURN ITEMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_return_items (
    id              BIGSERIAL PRIMARY KEY,
    return_id       BIGINT NOT NULL REFERENCES ec_returns(id) ON DELETE CASCADE,
    order_item_id   BIGINT NOT NULL REFERENCES ecommerce_order_items(id),
    qty_returned    INT NOT NULL,
    disposition     VARCHAR(20) NOT NULL DEFAULT 'QUARANTINE', -- RESTOCK, QUARANTINE, DISPOSE
    disposition_note VARCHAR(300),
    UNIQUE (return_id, order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_ec_return_items_return ON ec_return_items(return_id);

-- ──────────────────────────────────────────────────────────────
-- 21. REFUNDS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_refunds (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES ecommerce_orders(id),
    return_id           BIGINT REFERENCES ec_returns(id),
    payment_id          BIGINT REFERENCES ec_payments(id),
    idempotency_key     VARCHAR(128) NOT NULL UNIQUE,
    amount              DECIMAL(10,2) NOT NULL,
    method              VARCHAR(30) NOT NULL DEFAULT 'ORIGINAL', -- ORIGINAL, STORE_CREDIT, CREDIT_NOTE
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by         BIGINT,
    provider_ref        VARCHAR(200),
    failure_reason      VARCHAR(500),
    processed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_refunds_order   ON ec_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_ec_refunds_return  ON ec_refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_ec_refunds_status  ON ec_refunds(status);

-- ──────────────────────────────────────────────────────────────
-- 22. REVIEWS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_reviews (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES ecommerce_products(id),
    order_item_id       BIGINT REFERENCES ecommerce_order_items(id),
    patient_id          BIGINT NOT NULL REFERENCES users(id),
    rating              INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title               VARCHAR(200),
    body                TEXT,
    images              TEXT,                                  -- JSON array
    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, FLAGGED
    moderation_note     VARCHAR(500),
    moderated_by        BIGINT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    helpful_count       INT NOT NULL DEFAULT 0,
    reported_count      INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE,
    UNIQUE (product_id, patient_id, order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_ec_reviews_product    ON ec_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_ec_reviews_patient    ON ec_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_ec_reviews_moderation ON ec_reviews(moderation_status);

-- ──────────────────────────────────────────────────────────────
-- 23. REVIEW RESPONSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_review_responses (
    id           BIGSERIAL PRIMARY KEY,
    review_id    BIGINT NOT NULL REFERENCES ec_reviews(id) ON DELETE CASCADE,
    responder_id BIGINT NOT NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ec_review_responses ON ec_review_responses(review_id);

-- ──────────────────────────────────────────────────────────────
-- 24. TAX RULES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_tax_rules (
    id              BIGSERIAL PRIMARY KEY,
    tax_class       VARCHAR(50) NOT NULL,
    state           VARCHAR(100) NOT NULL DEFAULT 'ALL',
    rate_percent    DECIMAL(5,2) NOT NULL,
    cgst_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    sgst_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    igst_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (tax_class, state, effective_from)
);
-- Seed default GST rates

-- ──────────────────────────────────────────────────────────────
-- 25. COUPON APPLICATIONS (eCommerce order scope)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_coupon_applications (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES ecommerce_orders(id),
    coupon_id       BIGINT NOT NULL,
    coupon_code     VARCHAR(100) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    applied_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reversed_at     TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ec_coupon_apps_order ON ec_coupon_applications(order_id);

-- ──────────────────────────────────────────────────────────────
-- 26. PRODUCT RECOMMENDATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ec_product_recommendations (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES ecommerce_products(id) ON DELETE CASCADE,
    related_product_id  BIGINT NOT NULL REFERENCES ecommerce_products(id) ON DELETE CASCADE,
    relation_type       VARCHAR(30) NOT NULL DEFAULT 'RELATED', -- RELATED, FBT, REPLENISHMENT
    score               DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, related_product_id, relation_type)
);
CREATE INDEX IF NOT EXISTS idx_ec_recommendations_product ON ec_product_recommendations(product_id, is_active);

-- ──────────────────────────────────────────────────────────────
-- 27. EXTEND ecommerce_order_items TABLE
-- ──────────────────────────────────────────────────────────────
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS tax_class          VARCHAR(50);
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS tax_amount         DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS cgst_amount        DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS sgst_amount        DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS igst_amount        DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS discount_amount    DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS sku_snapshot       VARCHAR(100);
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(300);
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS batch_id           BIGINT REFERENCES ec_stock_batches(id);
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ecommerce_order_items ADD COLUMN IF NOT EXISTS prescription_id    BIGINT;

-- ──────────────────────────────────────────────────────────────
-- 28. SEED DEFAULT DELIVERY ZONES (sample)
-- ──────────────────────────────────────────────────────────────



-- ==========================================
-- Source: V87__support_phase18_core.sql
-- ==========================================

-- V87: Complete Support CRM and Knowledge Base Schema

-- 1. Agent Profiles and Workload
CREATE TABLE IF NOT EXISTS sp_agent_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branches(id),
    max_concurrent_tickets INT DEFAULT 5,
    current_active_tickets INT DEFAULT 0,
    primary_skills VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_agent_user ON sp_agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_agent_branch ON sp_agent_profiles(branch_id);

-- 2. SLA Policies
CREATE TABLE IF NOT EXISTS sp_sla_policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, URGENT, CRITICAL
    category VARCHAR(50),
    first_response_minutes INT NOT NULL,
    resolution_minutes INT NOT NULL,
    business_hours_only BOOLEAN DEFAULT true,
    branch_id BIGINT REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Knowledge Base
CREATE TABLE IF NOT EXISTS sp_kb_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id BIGINT REFERENCES sp_kb_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sp_kb_articles (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES sp_kb_categories(id),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    audience VARCHAR(50) DEFAULT 'PUBLIC', -- PUBLIC, PATIENTS_ONLY, STAFF_ONLY, CLINICAL_ONLY
    status VARCHAR(30) DEFAULT 'DRAFT', -- DRAFT, REVIEW, PUBLISHED, ARCHIVED
    author_id BIGINT REFERENCES users(id),
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    version INT DEFAULT 1,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Unified Support Tickets
CREATE TABLE IF NOT EXISTS sp_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    idempotency_key VARCHAR(100) UNIQUE,
    requester_id BIGINT REFERENCES users(id),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    channel VARCHAR(30) DEFAULT 'PORTAL', -- PORTAL, EMAIL, WHATSAPP, LIVE_CHAT, MANUAL
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    subcategory VARCHAR(50),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- NEW, OPEN, IN_PROGRESS, PENDING_CUSTOMER, PENDING_INTERNAL, ESCALATED, RESOLVED, CLOSED
    
    branch_id BIGINT REFERENCES branches(id),
    assigned_agent_id BIGINT REFERENCES users(id),
    assigned_team VARCHAR(50),
    
    sla_policy_id BIGINT REFERENCES sp_sla_policies(id),
    first_response_due_at TIMESTAMP WITH TIME ZONE,
    resolution_due_at TIMESTAMP WITH TIME ZONE,
    sla_status VARCHAR(30) DEFAULT 'ON_TRACK', -- ON_TRACK, AT_RISK, BREACHED, PAUSED
    
    -- References (without strict foreign keys to allow loose coupling)
    reference_appointment_id BIGINT,
    reference_order_id BIGINT,
    reference_invoice_id BIGINT,
    
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_ticket_requester ON sp_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_sp_ticket_status ON sp_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sp_ticket_agent ON sp_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_sp_ticket_branch ON sp_tickets(branch_id);

-- 5. Ticket Assignment Audit
CREATE TABLE IF NOT EXISTS sp_ticket_assignments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    previous_agent_id BIGINT REFERENCES users(id),
    new_agent_id BIGINT REFERENCES users(id),
    assigned_by_id BIGINT REFERENCES users(id),
    reason VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ticket Messages (Unified Chat & Notes)
CREATE TABLE IF NOT EXISTS sp_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id),
    sender_name VARCHAR(100), -- For guests/external
    content TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT false,
    channel VARCHAR(30) DEFAULT 'PORTAL',
    message_id_external VARCHAR(100), -- For tracking WhatsApp/Email IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_messages_ticket ON sp_messages(ticket_id);

-- 7. Attachments
CREATE TABLE IF NOT EXISTS sp_attachments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    message_id BIGINT REFERENCES sp_messages(id) ON DELETE CASCADE,
    uploaded_by_id BIGINT REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    s3_key VARCHAR(500) NOT NULL,
    is_internal_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Escalations & Complaints
CREATE TABLE IF NOT EXISTS sp_escalations (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    escalated_by_id BIGINT REFERENCES users(id),
    target_team VARCHAR(50) NOT NULL, -- CLINICAL, FINANCE, PHARMACY, ADMIN
    target_user_id BIGINT REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, ACKNOWLEDGED, RESOLVED, REJECTED
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sp_complaints (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    patient_id BIGINT,
    severity VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, HIGH, CRITICAL, LEGAL
    investigator_id BIGINT REFERENCES users(id),
    investigation_notes TEXT, -- Highly restricted visibility
    status VARCHAR(30) DEFAULT 'INVESTIGATING', -- RECEIVED, INVESTIGATING, PROPOSED, CLOSED
    resolution_offered TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CSAT Surveys
CREATE TABLE IF NOT EXISTS sp_csat_surveys (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    is_responded BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE
);



-- ==========================================
-- Source: V88__add_hr_payroll_tables.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS payroll_runs (
    id BIGSERIAL PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    run_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payslips (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    payroll_run_id BIGINT NOT NULL REFERENCES payroll_runs(id),
    basic_pay NUMERIC(12, 2) NOT NULL,
    total_allowances NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_pay NUMERIC(12, 2) NOT NULL,
    breakdown JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'GENERATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- ==========================================
-- Source: V89__ambulance_phase20_core.sql
-- ==========================================

-- V89: Ambulance Phase 20 Core Schema Updates

-- 1. Ambulance Drivers
CREATE TABLE IF NOT EXISTS ambulance_drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE (user_id)
);

-- 2. Ambulance Paramedics
CREATE TABLE IF NOT EXISTS ambulance_paramedics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_number VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    is_available BOOLEAN NOT NULL DEFAULT true,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE (user_id)
);

-- 3. Hospital Destinations
CREATE TABLE IF NOT EXISTS hospital_destinations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    emergency_capacity INT,
    is_internal_branch BOOLEAN NOT NULL DEFAULT false,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL
);

-- 4. Update Ambulances Table
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS driver_id BIGINT REFERENCES ambulance_drivers(id) ON DELETE SET NULL;
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BLS';
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS equipment_level VARCHAR(50);
ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);

-- 5. Update Emergency Requests Table
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_name VARCHAR(100);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_phone VARCHAR(30);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_relation VARCHAR(50);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS incident_description TEXT;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS clinical_red_flags TEXT;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS hospital_destination_id BIGINT REFERENCES hospital_destinations(id) ON DELETE SET NULL;

-- 6. Ambulance Assignments (Active Trips)
CREATE TABLE IF NOT EXISTS ambulance_assignments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    ambulance_id BIGINT NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
    paramedic_id BIGINT REFERENCES ambulance_paramedics(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED', -- ASSIGNED, EN_ROUTE, ON_SCENE, TRANSPORTING, ARRIVED_AT_HOSPITAL, COMPLETED, CANCELLED
    estimated_arrival_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (request_id)
);

-- 7. Trip Histories
CREATE TABLE IF NOT EXISTS ambulance_trip_histories (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES ambulance_assignments(id) ON DELETE CASCADE,
    total_distance_km DECIMAL(10, 2),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    fuel_used DECIMAL(10, 2),
    outcome VARCHAR(100),
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assignment_id)
);

-- 8. Emergency Patient Records (Pre-Hospital Care)
CREATE TABLE IF NOT EXISTS emergency_patient_records (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    vitals_summary TEXT,
    interventions TEXT,
    medication_administered TEXT,
    crew_notes TEXT,
    handover_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (request_id)
);

-- 9. Ambulance Trip Billings
CREATE TABLE IF NOT EXISTS ambulance_trip_billings (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES ambulance_trip_histories(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    dispatch_fee DECIMAL(10, 2),
    distance_fee DECIMAL(10, 2),
    equipment_fee DECIMAL(10, 2),
    oxygen_fee DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, INVOICED, PAID, WAIVED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (trip_id)
);

CREATE INDEX IF NOT EXISTS idx_ambulance_assignments_status ON ambulance_assignments(status);
CREATE INDEX IF NOT EXISTS idx_ambulance_trip_billings_status ON ambulance_trip_billings(status);



-- ==========================================
-- Source: V90__ambulance_phase20_indexes.sql
-- ==========================================

-- Indexes for Ambulance Proximity Search
CREATE INDEX IF NOT EXISTS idx_ambulance_location ON ambulances(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_ambulance_status ON ambulances(status, is_active);

-- Indexes for Assignment Lookups
CREATE INDEX IF NOT EXISTS idx_amb_assignment_amb_status ON ambulance_assignments(ambulance_id, status);
CREATE INDEX IF NOT EXISTS idx_amb_assignment_request ON ambulance_assignments(request_id);





-- ==========================================
-- Source: V91__add_registration_number_to_doctor_profiles.sql
-- ==========================================

-- ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);



-- ==========================================
-- Source: V93__emr_schema.sql
-- ==========================================

-- V56__emr_schema.sql

-- 1. Problems
CREATE TABLE IF NOT EXISTS problems (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    icd10_code VARCHAR(20),
    problem_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- ACTIVE, RESOLVED, CHRONIC
    onset_date DATE,
    resolved_date DATE,
    recorded_by_user_id BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source_encounter_id BIGINT
);

-- 2. Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    icd10_code VARCHAR(20),
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_date DATE NOT NULL,
    diagnosing_doctor_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL, -- PROVISIONAL, CONFIRMED, RULED_OUT
    encounter_type VARCHAR(50),
    encounter_id BIGINT
);

-- 3. Allergies
CREATE TABLE IF NOT EXISTS allergies (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    allergen VARCHAR(255) NOT NULL,
    allergy_type VARCHAR(50) NOT NULL, -- DRUG, FOOD, ENVIRONMENTAL
    reaction_severity VARCHAR(50) NOT NULL, -- MILD, MODERATE, SEVERE, LIFE_THREATENING
    reaction_description TEXT,
    status VARCHAR(50) NOT NULL, -- ACTIVE, INACTIVE
    recorded_by_user_id BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. Immunizations
CREATE TABLE IF NOT EXISTS immunizations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    vaccine_name VARCHAR(255) NOT NULL,
    dose_number INT NOT NULL,
    administered_date DATE NOT NULL,
    administered_by_user_id BIGINT NOT NULL,
    batch_number VARCHAR(100),
    next_due_date DATE
);

-- 5. Family History
CREATE TABLE IF NOT EXISTS family_history (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    relationship VARCHAR(50) NOT NULL,
    condition VARCHAR(255) NOT NULL,
    notes TEXT,
    recorded_by_user_id BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. Social History (One per patient generally, but tracking updates)
CREATE TABLE IF NOT EXISTS social_history (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL UNIQUE REFERENCES patient_profiles(id),
    smoking_status VARCHAR(100),
    alcohol_use VARCHAR(100),
    occupation VARCHAR(100),
    exercise_frequency VARCHAR(100),
    other_notes TEXT,
    updated_by_user_id BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. Surgical History
CREATE TABLE IF NOT EXISTS surgical_history (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    procedure_name VARCHAR(255) NOT NULL,
    surgery_date DATE,
    surgeon VARCHAR(255),
    notes TEXT,
    surgery_booking_id BIGINT, -- Links to OT
    recorded_by_user_id BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 8. External Medications
CREATE TABLE IF NOT EXISTS external_medications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    started_date DATE,
    still_taking BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by_user_id BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 9. Clinical Observations
CREATE TABLE IF NOT EXISTS clinical_observations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    observation_code VARCHAR(100),
    observation_name VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    observed_by_user_id BIGINT NOT NULL,
    encounter_id BIGINT
);

-- 10. Procedure Records
CREATE TABLE IF NOT EXISTS procedure_records (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    procedure_name VARCHAR(255) NOT NULL,
    procedure_code VARCHAR(100),
    performed_date DATE NOT NULL,
    performed_by_user_id BIGINT NOT NULL,
    encounter_id BIGINT,
    notes TEXT,
    surgery_booking_id BIGINT
);

-- 11. Clinical Referrals
DROP TABLE IF EXISTS clinical_referrals CASCADE;
CREATE TABLE IF NOT EXISTS clinical_referrals (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    referring_doctor_id BIGINT NOT NULL,
    referred_to_doctor_id BIGINT,
    referred_to_provider_name VARCHAR(255),
    referred_to_specialty VARCHAR(255),
    referral_reason TEXT NOT NULL,
    urgency VARCHAR(50) NOT NULL, -- ROUTINE, URGENT
    status VARCHAR(50) NOT NULL, -- PENDING, SCHEDULED, COMPLETED, DECLINED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Make CarePathwayTemplate nullable for custom plans
ALTER TABLE patient_care_pathways ALTER COLUMN template_id DROP NOT NULL;



-- ==========================================
-- Source: V94__engagement_schema.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    appointment_id BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_MODERATION',
    moderated_by_user_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    appointment_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_context VARCHAR(50) NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES survey_templates(id),
    patient_id BIGINT NOT NULL,
    answers JSONB NOT NULL,
    source_encounter_id BIGINT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preventive_care_rules (
    id BIGSERIAL PRIMARY KEY,
    min_age INT,
    max_age INT,
    gender VARCHAR(20),
    condition_criteria VARCHAR(255),
    reminder_title VARCHAR(255) NOT NULL,
    reminder_message TEXT NOT NULL,
    interval_days INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wellness_programs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INT NOT NULL,
    enrollment_criteria TEXT,
    branch_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_wellness_enrollments (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES wellness_programs(id),
    patient_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    progress_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    source_entity_type VARCHAR(100),
    source_entity_id BIGINT,
    channels_sent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- ==========================================
-- Source: V97__multi_tenant_phase21.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    legal_entity_name VARCHAR(150),
    tax_registration_number VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);



-- ==========================================
-- Source: V98__branch_settings.sql
-- ==========================================

ALTER TABLE branches ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- Set a default tenant for existing branches or they will violate NOT NULL later if enforced

CREATE TABLE IF NOT EXISTS tenant_settings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_tenant_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_tenant_setting UNIQUE (tenant_id, setting_key)
);

CREATE TABLE IF NOT EXISTS branch_settings (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_branch_settings_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT uk_branch_setting UNIQUE (branch_id, setting_key)
);



-- ==========================================
-- Source: V100__subscriptions.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS feature_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    monthly_price DECIMAL(10, 2),
    max_branches INT,
    max_users INT,
    max_storage_gb INT,
    features_json TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL UNIQUE,
    plan_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'TRIAL',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES feature_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);



-- ==========================================
-- Source: V101__operating_hours_enhancement.sql
-- ==========================================

ALTER TABLE operating_hours ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE operating_hours ADD COLUMN IF NOT EXISTS service_id BIGINT;
ALTER TABLE operating_hours ADD COLUMN IF NOT EXISTS doctor_id BIGINT;
ALTER TABLE operating_hours ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;

ALTER TABLE operating_hours ALTER COLUMN open_time DROP NOT NULL;
ALTER TABLE operating_hours ALTER COLUMN close_time DROP NOT NULL;



-- ==========================================
-- Source: V102__identity_roles_permissions.sql
-- ==========================================

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100);

ALTER TABLE staff_assignments ADD COLUMN IF NOT EXISTS role_id BIGINT;
-- We need to populate role_id for existing rows or allow null temporarily if there are existing rows,
-- assuming clean schema for simplicity or default value. 
-- In a real migration we'd map string role to role_id.
-- Let's drop the string role column after.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'staff_assignments'
          AND column_name = 'role'
    ) THEN
        ALTER TABLE staff_assignments DROP COLUMN role;
    END IF;
END $$;

ALTER TABLE staff_assignments ALTER COLUMN role_id SET NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_assignments_role') THEN
        ALTER TABLE staff_assignments ADD CONSTRAINT fk_staff_assignments_role FOREIGN KEY (role_id) REFERENCES roles(id) NOT VALID;
    END IF;
END $$;



-- ==========================================
-- Source: V103__core_tenant_branch.sql
-- ==========================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- branch_id already exists in appointments

ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- branch_id already exists in patient_profiles

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
-- branch_id already exists in invoices

ALTER TABLE emergency_patient_records ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
ALTER TABLE emergency_patient_records ADD COLUMN IF NOT EXISTS branch_id BIGINT;

-- Add foreign keys for tenant and branch
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_tenant') THEN
        ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) NOT VALID;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_branch') THEN
        ALTER TABLE appointments ADD CONSTRAINT fk_appointments_branch FOREIGN KEY (branch_id) REFERENCES branches(id) NOT VALID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_patient_profiles_tenant') THEN
        ALTER TABLE patient_profiles ADD CONSTRAINT fk_patient_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) NOT VALID;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_patient_profiles_branch') THEN
        ALTER TABLE patient_profiles ADD CONSTRAINT fk_patient_profiles_branch FOREIGN KEY (branch_id) REFERENCES branches(id) NOT VALID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_tenant') THEN
        ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) NOT VALID;
    END IF;
END $$;
-- fk for invoices to branch already exists from V15

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_emergency_records_tenant') THEN
        ALTER TABLE emergency_patient_records ADD CONSTRAINT fk_emergency_records_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) NOT VALID;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_emergency_records_branch') THEN
        ALTER TABLE emergency_patient_records ADD CONSTRAINT fk_emergency_records_branch FOREIGN KEY (branch_id) REFERENCES branches(id) NOT VALID;
    END IF;
END $$;



-- ==========================================
-- Source: V104__integration_api.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS api_credentials (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    client_id VARCHAR(100) NOT NULL UNIQUE,
    client_secret_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    scopes_json TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_api_credentials_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS integration_configs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT,
    provider_name VARCHAR(100) NOT NULL,
    integration_type VARCHAR(100) NOT NULL,
    config_json TEXT,
    secrets_vault_path VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    health_status VARCHAR(50) DEFAULT 'UNKNOWN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_integration_configs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_type ON integration_configs(integration_type);



-- ==========================================
-- Source: V105__feature_flags.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT FALSE,
    description VARCHAR(255),
    allowlist_tenants_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);



-- ==========================================
-- Source: V106__inventory_transfer.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory_transfers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    source_branch_id BIGINT NOT NULL,
    destination_branch_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    requester_id BIGINT NOT NULL,
    approver_id BIGINT,
    receiver_id BIGINT,
    reason VARCHAR(255),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_inv_transfer_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_inv_transfer_source FOREIGN KEY (source_branch_id) REFERENCES branches(id),
    CONSTRAINT fk_inv_transfer_dest FOREIGN KEY (destination_branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    id BIGSERIAL PRIMARY KEY,
    transfer_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    batch_number VARCHAR(100),
    requested_quantity INT NOT NULL,
    dispatched_quantity INT,
    received_quantity INT,
    condition_upon_receipt VARCHAR(255),
    CONSTRAINT fk_inv_transfer_items_transfer FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inv_transfer_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_inv_transfer_tenant ON inventory_transfers(tenant_id);



-- ==========================================
-- Source: V107__clinical_encounter_restructuring.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS waitlist_entries (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctor_profiles(id),
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id),
    desired_date_range_start TIMESTAMP WITH TIME ZONE,
    desired_date_range_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'WAITING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Update clinical_encounters
ALTER TABLE clinical_encounters ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clinical_encounters ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Backfill opened_at and closed_at
UPDATE clinical_encounters SET opened_at = created_at;
UPDATE clinical_encounters SET closed_at = finalized_at WHERE finalized_at IS NOT NULL;

-- Update lab_test_requests to reference clinical_encounters instead of medical_records
-- We must drop the old constraint. The constraint name varies by database, but often we can just rename the column and add a new one, or find it dynamically.
-- Since this is PostgreSQL, we can use an alter table with drop constraint if we know the name, or just alter column type.
-- Wait, we can just drop the foreign key constraint if we know its name. Usually it's `lab_test_requests_encounter_id_fkey`.
ALTER TABLE lab_test_requests DROP CONSTRAINT IF EXISTS lab_test_requests_encounter_id_fkey;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lab_test_requests_encounter_id_fkey') THEN
        ALTER TABLE lab_test_requests ADD CONSTRAINT lab_test_requests_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES clinical_encounters(id) ON DELETE SET NULL NOT VALID;
    END IF;
END $$;

ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS acknowledged_by BIGINT REFERENCES users(id);
ALTER TABLE lab_test_requests ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;

-- Update prescriptions
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis_id BIGINT REFERENCES patient_diagnoses(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS override_reason TEXT;



-- ==========================================
-- Source: V108__prescription_production_gaps.sql
-- ==========================================

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refills_allowed INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refills_remaining INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refill_interval_days INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_registration_number VARCHAR(255);

ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS substitution_allowed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS prescription_reconciliation_mismatches (
    id BIGSERIAL PRIMARY KEY,
    clinical_prescription_id BIGINT NOT NULL,
    clinic_status VARCHAR(50),
    pharmacy_status VARCHAR(50),
    mismatch_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255)
);

-- Note: The specific role name might depend on the environment setup. 
-- In PostgreSQL, REVOKE removes privileges. 
-- Assuming standard usage, we'll try to revoke from PUBLIC.
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;



-- ==========================================
-- Source: V109__add_user_optimistic_locking.sql
-- ==========================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;



-- ==========================================
-- Source: V110__add_queue_token_unique_constraint.sql
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_branch_date_token') THEN
        ALTER TABLE queue_tokens ADD CONSTRAINT unique_branch_date_token UNIQUE (branch_id, generated_date, token_number);
    END IF;
END $$;



-- ==========================================
-- Source: V111__add_appointment_concurrency_fixes.sql
-- ==========================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;

DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'appointments' 
      AND kcu.column_name = 'slot_id' 
      AND tc.constraint_type = 'UNIQUE';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE appointments DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot ON appointments(slot_id) WHERE status != 'CANCELLED';



-- ==========================================
-- Source: V113__add_payment_idempotency_key.sql
-- ==========================================

-- V113: Add Idempotency Key to Finance Payments

ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;


