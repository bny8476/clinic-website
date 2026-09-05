-- V21: Marketing & CRM Schema

CREATE TABLE IF NOT EXISTS campaigns (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    channel         VARCHAR(30) NOT NULL DEFAULT 'EMAIL', -- EMAIL, SMS, IN_APP
    target_audience VARCHAR(100) NOT NULL DEFAULT 'ALL_PATIENTS',
    content         TEXT NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, SENT, CANCELLED
    sent_count      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at         TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS coupons (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(50) NOT NULL UNIQUE,
    discount_type    VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', -- PERCENTAGE, FIXED_AMOUNT
    discount_value   DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount     DECIMAL(10, 2),
    valid_from       DATE NOT NULL,
    valid_to         DATE NOT NULL,
    usage_limit      INT DEFAULT 100,
    times_used       INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS patient_loyalty (
    id             BIGSERIAL PRIMARY KEY,
    patient_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points_balance INT NOT NULL DEFAULT 0,
    tier           VARCHAR(20) NOT NULL DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, PLATINUM
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referrals (
    id             BIGSERIAL PRIMARY KEY,
    referrer_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_email  VARCHAR(255) NOT NULL,
    status         VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, REGISTERED, REWARDED
    reward_coupon  VARCHAR(50),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
