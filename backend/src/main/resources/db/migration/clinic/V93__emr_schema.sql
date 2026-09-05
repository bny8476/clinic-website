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
