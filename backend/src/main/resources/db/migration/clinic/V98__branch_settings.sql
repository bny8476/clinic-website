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
