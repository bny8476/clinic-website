-- V125__fix_order_set_templates_jsonb.sql
-- Safely convert diagnosis_codes and items from VARCHAR to JSONB to match Hibernate expectations
-- and PostgreSQL best practices. Includes a fallback to '[]'::jsonb if parsing fails.

CREATE OR REPLACE FUNCTION safe_cast_to_jsonb(t text) RETURNS jsonb AS $$
BEGIN
    IF t IS NULL OR trim(t) = '' THEN
        RETURN '[]'::jsonb;
    END IF;
    RETURN t::jsonb;
EXCEPTION WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
    -- Check if diagnosis_codes is character varying or text and alter to jsonb
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='order_set_templates' 
        AND column_name='diagnosis_codes' 
        AND data_type IN ('character varying', 'text')
    ) THEN
        ALTER TABLE order_set_templates 
        ALTER COLUMN diagnosis_codes TYPE jsonb 
        USING safe_cast_to_jsonb(diagnosis_codes);
    END IF;

    -- Check if items is character varying or text and alter to jsonb
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='order_set_templates' 
        AND column_name='items' 
        AND data_type IN ('character varying', 'text')
    ) THEN
        ALTER TABLE order_set_templates 
        ALTER COLUMN items TYPE jsonb 
        USING safe_cast_to_jsonb(items);
    END IF;
END $$;

DROP FUNCTION safe_cast_to_jsonb(text);
