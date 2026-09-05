-- Add check constraints to ensure quantity_available never drops below zero
ALTER TABLE IF EXISTS pharmacy_medicine_stocks DROP CONSTRAINT IF EXISTS chk_medicine_stock_qty;
ALTER TABLE IF EXISTS pharmacy_medicine_stocks ADD CONSTRAINT chk_medicine_stock_qty CHECK (quantity_available >= 0);

ALTER TABLE IF EXISTS pharmacy_stock_batches DROP CONSTRAINT IF EXISTS chk_stock_batch_qty;
ALTER TABLE IF EXISTS pharmacy_stock_batches ADD CONSTRAINT chk_stock_batch_qty CHECK (quantity_available >= 0);

ALTER TABLE IF EXISTS ecommerce_stock_batches DROP CONSTRAINT IF EXISTS chk_ecommerce_stock_qty;
ALTER TABLE IF EXISTS ecommerce_stock_batches ADD CONSTRAINT chk_ecommerce_stock_qty CHECK (quantity_available >= 0);



