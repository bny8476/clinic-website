-- V29: Clinical Decision Support (CDS), Care Pathways, and Order Sets Schema

-- Additive migration for patient_profiles: add allergies and chronic_conditions JSONB columns
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS chronic_conditions JSONB DEFAULT '[]'::jsonb;

-- CDS Rules Table
CREATE TABLE IF NOT EXISTS cds_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(50) NOT NULL, -- ON_PRESCRIPTION, ON_LAB_ORDER, ON_DIAGNOSIS
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- INFO, WARNING, CRITICAL
    action_type VARCHAR(30) NOT NULL DEFAULT 'SHOW_ALERT', -- SHOW_ALERT, BLOCK_ACTION, SUGGEST_ORDER_SET
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CDS Alerts Table
CREATE TABLE IF NOT EXISTS cds_alerts (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_id BIGINT REFERENCES cds_rules(id) ON DELETE SET NULL,
    triggered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, ACKNOWLEDGED, OVERRIDDEN
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cds_alerts_patient ON cds_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_cds_alerts_status ON cds_alerts(status);

-- Care Pathway Templates Table
CREATE TABLE IF NOT EXISTS care_pathway_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    indication VARCHAR(255) NOT NULL,
    estimated_duration_days INT NOT NULL DEFAULT 7,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient Care Pathways Table
CREATE TABLE IF NOT EXISTS patient_care_pathways (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id BIGINT NOT NULL REFERENCES care_pathway_templates(id) ON DELETE CASCADE,
    assigned_by_doctor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_end_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_care_pathways_patient ON patient_care_pathways(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_pathways_doctor ON patient_care_pathways(assigned_by_doctor_id);

-- Care Pathway Steps Table
CREATE TABLE IF NOT EXISTS care_pathway_steps (
    id BIGSERIAL PRIMARY KEY,
    pathway_id BIGINT NOT NULL REFERENCES patient_care_pathways(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    step_type VARCHAR(30) NOT NULL, -- TASK, APPOINTMENT, LAB_ORDER, MEDICATION, NURSING_ACTION
    due_offset_days INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_care_pathway_steps_pathway ON care_pathway_steps(pathway_id);
CREATE INDEX IF NOT EXISTS idx_care_pathway_steps_status ON care_pathway_steps(status);

-- Order Set Templates Table
CREATE TABLE IF NOT EXISTS order_set_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    diagnosis_codes JSONB NOT NULL DEFAULT '[]'::jsonb, -- ICD-10 codes array
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
