-- Add check constraints to ensure quantity_available never drops below zero
ALTER TABLE pharmacy_medicine_stocks ADD CONSTRAINT chk_medicine_stock_qty CHECK (quantity_available >= 0);
ALTER TABLE pharmacy_stock_batches ADD CONSTRAINT chk_stock_batch_qty CHECK (quantity_available >= 0);
ALTER TABLE ecommerce_stock_batches ADD CONSTRAINT chk_ecommerce_stock_qty CHECK (quantity_available >= 0);
