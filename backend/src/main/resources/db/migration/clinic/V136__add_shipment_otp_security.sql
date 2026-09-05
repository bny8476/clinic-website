-- Migration V136: Add OTP hash, expiration, and attempt tracking columns to ec_shipments
ALTER TABLE ec_shipments ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(128);
ALTER TABLE ec_shipments ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ec_shipments ADD COLUMN IF NOT EXISTS otp_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE ec_shipments ADD COLUMN IF NOT EXISTS max_otp_attempts INT NOT NULL DEFAULT 3;
