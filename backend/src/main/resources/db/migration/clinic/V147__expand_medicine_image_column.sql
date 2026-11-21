-- Expand medicine_image column to TEXT to support Base64 and high-res data URLs in PostgreSQL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'ecommerce_products'
    ) THEN
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'ecommerce_products' 
              AND column_name = 'medicine_image'
        ) THEN
            ALTER TABLE ecommerce_products ALTER COLUMN medicine_image TYPE TEXT;
        ELSE
            ALTER TABLE ecommerce_products ADD COLUMN medicine_image TEXT;
        END IF;
    END IF;
END $$;
