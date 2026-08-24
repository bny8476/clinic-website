-- Add check constraints to ensure quantity_available never drops below zero (with safe table existence checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_medicine_stocks') THEN
        ALTER TABLE pharmacy_medicine_stocks DROP CONSTRAINT IF EXISTS chk_medicine_stock_qty;
        ALTER TABLE pharmacy_medicine_stocks ADD CONSTRAINT chk_medicine_stock_qty CHECK (quantity_available >= 0);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_stock_batches') THEN
        ALTER TABLE pharmacy_stock_batches DROP CONSTRAINT IF EXISTS chk_stock_batch_qty;
        ALTER TABLE pharmacy_stock_batches ADD CONSTRAINT chk_stock_batch_qty CHECK (quantity_available >= 0);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ecommerce_stock_batches') THEN
        ALTER TABLE ecommerce_stock_batches DROP CONSTRAINT IF EXISTS chk_ecommerce_stock_qty;
        ALTER TABLE ecommerce_stock_batches ADD CONSTRAINT chk_ecommerce_stock_qty CHECK (quantity_available >= 0);
    END IF;
END $$;

