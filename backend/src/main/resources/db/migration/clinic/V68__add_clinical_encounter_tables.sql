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
