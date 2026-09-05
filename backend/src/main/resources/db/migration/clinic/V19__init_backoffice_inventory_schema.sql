-- V19: Back-Office Inventory Schema
-- medicine_batches (from V13) is the shared source of truth for medicine stock.
-- stock_items unifies medicines + general supplies in one table.

CREATE TABLE IF NOT EXISTS warehouses (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(200) NOT NULL,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    location  VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backoffice_suppliers (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    contact_person  VARCHAR(200),
    phone           VARCHAR(30),
    email           VARCHAR(255),
    address         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unified stock table: medicines AND general supplies
-- For medicines: medicine_batch_id links back to medicine_batches (V13)
CREATE TABLE IF NOT EXISTS stock_items (
    id                  BIGSERIAL PRIMARY KEY,
    warehouse_id        BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    item_type           VARCHAR(20) NOT NULL DEFAULT 'SUPPLY', -- 'MEDICINE' | 'SUPPLY'
    item_name           VARCHAR(255) NOT NULL,
    sku                 VARCHAR(100),
    unit                VARCHAR(30) NOT NULL DEFAULT 'PCS', -- PCS, BOX, BOTTLE, ML, MG, etc.
    quantity            INT NOT NULL DEFAULT 0,
    reorder_level       INT NOT NULL DEFAULT 10,
    medicine_batch_id   BIGINT,
    last_updated        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id                  BIGSERIAL PRIMARY KEY,
    from_warehouse_id   BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    to_warehouse_id     BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    stock_item_id       BIGINT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    quantity            INT NOT NULL,
    transferred_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    transferred_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes               TEXT
);

CREATE TABLE IF NOT EXISTS backoffice_purchase_orders (
    id                  BIGSERIAL PRIMARY KEY,
    supplier_id         BIGINT NOT NULL REFERENCES backoffice_suppliers(id) ON DELETE CASCADE,
    warehouse_id        BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    order_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery   DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
    total_amount        DECIMAL(12, 2),
    raised_by           BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backoffice_po_items (
    id                  BIGSERIAL PRIMARY KEY,
    po_id               BIGINT NOT NULL REFERENCES backoffice_purchase_orders(id) ON DELETE CASCADE,
    stock_item_id       BIGINT REFERENCES stock_items(id) ON DELETE SET NULL,
    item_description    VARCHAR(255) NOT NULL,
    quantity_ordered    INT NOT NULL,
    unit_price          DECIMAL(12, 2) NOT NULL,
    quantity_received   INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stock_items_warehouse     ON stock_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_type          ON stock_items(item_type);
CREATE INDEX IF NOT EXISTS idx_stock_items_batch         ON stock_items(medicine_batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_item      ON stock_transfers(stock_item_id);
