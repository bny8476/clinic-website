-- PostgreSQL Schema for Jan Aushadhi & Clinic Medicine Master

CREATE TABLE IF NOT EXISTS medicine_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine (
    id BIGSERIAL PRIMARY KEY,
    drug_code VARCHAR(50) NOT NULL UNIQUE,
    generic_name TEXT NOT NULL,
    unit_size VARCHAR(100),
    category_id BIGINT REFERENCES medicine_category(id),
    source VARCHAR(50) NOT NULL DEFAULT 'JAN_AUSHADHI',
    source_name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_price (
    id BIGSERIAL PRIMARY KEY,
    medicine_id BIGINT NOT NULL REFERENCES medicine(id) ON DELETE CASCADE,
    mrp NUMERIC(12,2) NOT NULL CHECK (mrp >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(50) NOT NULL DEFAULT 'JAN_AUSHADHI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_medicine_price_effective UNIQUE (medicine_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_medicine_drug_code ON medicine(drug_code);
CREATE INDEX IF NOT EXISTS idx_medicine_category ON medicine(category_id);
CREATE INDEX IF NOT EXISTS idx_medicine_generic_name ON medicine USING GIN (to_tsvector('simple', generic_name));
CREATE INDEX IF NOT EXISTS idx_medicine_price_medicine ON medicine_price(medicine_id);
