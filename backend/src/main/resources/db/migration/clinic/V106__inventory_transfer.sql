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
