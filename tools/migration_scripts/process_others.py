import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    # Replace BIGSERIAL
    sql = sql.replace('BIGSERIAL', 'BIGINT AUTO_INCREMENT')
    
    # Replace TIMESTAMP WITH TIME ZONE
    sql = sql.replace('TIMESTAMP WITH TIME ZONE', 'DATETIME(6)')
    sql = sql.replace('TIMESTAMP', 'DATETIME(6)')
    
    # Remove public.
    sql = sql.replace('public.', '')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"Processed {filepath}")

if __name__ == '__main__':
    files = [
        'V13__init_pharmacy_extensions_schema.sql',
        'V34__link_pharmacy_clinical_prescriptions.sql',
        'V45__create_pharmacy_clearance_schema.sql',
        'V51__add_pharmacy_outbox_events.sql'
    ]
    for f in files:
        process_file(f)
