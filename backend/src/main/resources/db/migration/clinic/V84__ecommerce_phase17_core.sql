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
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS images               JSON;          -- JSON array of image URLs
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS specifications       JSON;          -- JSON key-value pairs
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
    pg_response         JSON,                                  -- JSON blob from provider
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
    cold_chain_evidence     JSON,                              -- JSON
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
    items_picked            JSON,                              -- JSON
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
    evidence_urls       JSON,                                  -- JSON array
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
    images              JSON,                                  -- JSON array
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
INSERT INTO ec_tax_rules (tax_class, state, rate_percent, cgst_percent, sgst_percent, igst_percent, effective_from, is_active)
    VALUES ('MEDICINE_12', 'ALL', 12.00, 6.00, 6.00, 12.00, '2024-01-01', true);
INSERT INTO ec_tax_rules (tax_class, state, rate_percent, cgst_percent, sgst_percent, igst_percent, effective_from, is_active)
    VALUES ('DEVICE_18', 'ALL', 18.00, 9.00, 9.00, 18.00, '2024-01-01', true);
INSERT INTO ec_tax_rules (tax_class, state, rate_percent, cgst_percent, sgst_percent, igst_percent, effective_from, is_active)
    VALUES ('WELLNESS_18', 'ALL', 18.00, 9.00, 9.00, 18.00, '2024-01-01', true);
INSERT INTO ec_tax_rules (tax_class, state, rate_percent, cgst_percent, sgst_percent, igst_percent, effective_from, is_active)
    VALUES ('SUPPLEMENT_5', 'ALL', 5.00, 2.50, 2.50, 5.00, '2024-01-01', true);
INSERT INTO ec_tax_rules (tax_class, state, rate_percent, cgst_percent, sgst_percent, igst_percent, effective_from, is_active)
    VALUES ('EXEMPT_0', 'ALL', 0.00, 0.00, 0.00, 0.00, '2024-01-01', true);

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
INSERT INTO ec_delivery_zones (pincode, city, state, zone, is_serviceable, min_delivery_days, max_delivery_days, base_shipping_fee, free_shipping_above)
    VALUES ('110001', 'New Delhi', 'Delhi', 'METRO', true, 1, 2, 0.00, 499.00);
INSERT INTO ec_delivery_zones (pincode, city, state, zone, is_serviceable, min_delivery_days, max_delivery_days, base_shipping_fee, free_shipping_above)
    VALUES ('400001', 'Mumbai', 'Maharashtra', 'METRO', true, 1, 2, 0.00, 499.00);
INSERT INTO ec_delivery_zones (pincode, city, state, zone, is_serviceable, min_delivery_days, max_delivery_days, base_shipping_fee, free_shipping_above)
    VALUES ('560001', 'Bangalore', 'Karnataka', 'METRO', true, 1, 3, 0.00, 499.00);
INSERT INTO ec_delivery_zones (pincode, city, state, zone, is_serviceable, min_delivery_days, max_delivery_days, base_shipping_fee, free_shipping_above)
    VALUES ('600001', 'Chennai', 'Tamil Nadu', 'METRO', true, 1, 3, 49.00, 499.00);
INSERT INTO ec_delivery_zones (pincode, city, state, zone, is_serviceable, min_delivery_days, max_delivery_days, base_shipping_fee, free_shipping_above)
    VALUES ('700001', 'Kolkata', 'West Bengal', 'METRO', true, 1, 3, 49.00, 499.00);
INSERT INTO ec_delivery_zones (pincode, city, state, zone, is_serviceable, min_delivery_days, max_delivery_days, base_shipping_fee, free_shipping_above)
    VALUES ('999999', 'REMOTE', 'REMOTE', 'NON_SERVICEABLE', false, 0, 0, 0.00, 0.00);
