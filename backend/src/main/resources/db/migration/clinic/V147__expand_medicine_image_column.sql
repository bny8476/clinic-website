-- Expand medicine_image column to LONGTEXT to support Base64 and high-res data URLs
ALTER TABLE ecommerce_products MODIFY COLUMN medicine_image LONGTEXT;
