-- V125__fix_order_set_templates_jsonb.sql
-- Ensure diagnosis_codes and items are JSONB type on order_set_templates table if created in older schema
ALTER TABLE order_set_templates ALTER COLUMN diagnosis_codes SET DATA TYPE JSONB USING diagnosis_codes::jsonb;
ALTER TABLE order_set_templates ALTER COLUMN items SET DATA TYPE JSONB USING items::jsonb;

