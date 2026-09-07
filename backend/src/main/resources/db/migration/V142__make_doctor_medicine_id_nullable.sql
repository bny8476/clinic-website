-- V142__make_doctor_medicine_id_nullable.sql
-- Allow doctor_medicine_id in medicine_order_items to be nullable for modern ecommerce product integration

ALTER TABLE medicine_order_items DROP CONSTRAINT IF EXISTS fkamdf290lun3imdiyb4apxwl1;
ALTER TABLE medicine_order_items ALTER COLUMN doctor_medicine_id DROP NOT NULL;
