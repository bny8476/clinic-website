-- V153: Add delivery address, contact phone, payment method, razorpay IDs, and prescription URL to medicine_orders

ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(20);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS prescription_url TEXT;

-- Ensure doctor_id can be nullable for direct patient pharmacy orders
ALTER TABLE medicine_orders ALTER COLUMN doctor_id DROP NOT NULL;

-- Store snapshot of medicine name in order items
ALTER TABLE medicine_order_items ADD COLUMN IF NOT EXISTS medicine_name_snapshot VARCHAR(255);

