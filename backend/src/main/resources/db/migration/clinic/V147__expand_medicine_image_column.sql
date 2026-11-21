-- Expand medicine_image column to TEXT to support Base64 and high-res data URLs
ALTER TABLE ecommerce_products ALTER COLUMN medicine_image TYPE TEXT;
