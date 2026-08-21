import re

file_path = 'backend/src/main/resources/db/migration/clinic/V115_1__reconcile_all_remaining_skipped_schemas.sql'
with open(file_path, 'r') as f:
    sql = f.read()

def replace_drop_column(match):
    table = match.group(1)
    column = match.group(2)
    return f"""
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = '{table}'
          AND column_name = '{column}'
    ) THEN
        ALTER TABLE {table} DROP COLUMN {column};
    END IF;
END $$;
"""

sql = re.sub(r'ALTER TABLE\s+(\w+)\s+DROP COLUMN\s+(\w+)\s*;', replace_drop_column, sql)

with open(file_path, 'w') as f:
    f.write(sql)
