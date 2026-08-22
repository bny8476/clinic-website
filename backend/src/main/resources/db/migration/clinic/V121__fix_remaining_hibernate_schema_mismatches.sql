-- V121__fix_remaining_hibernate_schema_mismatches.sql
-- Fix all remaining Hibernate entity vs DB schema mismatches discovered during validation.

-- ============================================================
-- appointments: add version column for optimistic locking
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='version')
    THEN
        ALTER TABLE appointments ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- wards: add is_active column
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wards' AND column_name='is_active')
    THEN
        ALTER TABLE wards ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- ============================================================
-- NEW TABLE: bed_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS bed_assignments (
    id           BIGSERIAL PRIMARY KEY,
    bed_id       BIGINT NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
    patient_id   BIGINT NOT NULL,
    encounter_id BIGINT NOT NULL,
    assigned_by  BIGINT NOT NULL,
    assigned_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMP WITH TIME ZONE,
    status       VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_encounter ON bed_assignments(encounter_id);

-- ============================================================
-- NEW TABLE: ward_transfers
-- ============================================================
CREATE TABLE IF NOT EXISTS ward_transfers (
    id                  BIGSERIAL PRIMARY KEY,
    patient_id          BIGINT NOT NULL,
    encounter_id        BIGINT NOT NULL,
    source_bed_id       BIGINT,
    destination_bed_id  BIGINT,
    requested_by        BIGINT NOT NULL,
    requested_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by         BIGINT,
    approved_at         TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    priority            VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    reason              TEXT,
    transfer_notes      TEXT
);

CREATE INDEX IF NOT EXISTS idx_ward_transfers_patient ON ward_transfers(patient_id);
CREATE INDEX IF NOT EXISTS idx_ward_transfers_encounter ON ward_transfers(encounter_id);
