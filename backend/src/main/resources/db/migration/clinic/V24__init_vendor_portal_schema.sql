-- V24: Vendor Portal Schema

CREATE TABLE IF NOT EXISTS vendor_deliveries (
    id                 BIGSERIAL PRIMARY KEY,
    po_id              BIGINT NOT NULL REFERENCES backoffice_purchase_orders(id) ON DELETE CASCADE,
    vendor_user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracking_number    VARCHAR(100) NOT NULL,
    carrier            VARCHAR(100),
    dispatch_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    estimated_delivery DATE,
    status             VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED', -- DISPATCHED, IN_TRANSIT, DELIVERED
    notes              TEXT,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_deliveries_po ON vendor_deliveries(po_id);
CREATE INDEX IF NOT EXISTS idx_vendor_deliveries_vendor ON vendor_deliveries(vendor_user_id);
