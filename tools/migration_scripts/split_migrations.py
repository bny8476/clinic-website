import os
import re
import glob

def fix_sql_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern for matching ALTER TABLE ... ADD COLUMN ... , ADD COLUMN ...
    # It's tricky to write a perfect regex for this, but we can do string manipulation
    
    # First, replace 'ADD COLUMN IF NOT EXISTS' with 'ADD COLUMN'
    content = content.replace('ADD COLUMN IF NOT EXISTS', 'ADD COLUMN')
    content = content.replace('ADD IF NOT EXISTS', 'ADD')

    # Split into statements
    statements = content.split(';')
    new_statements = []
    
    for stmt in statements:
        if not stmt.strip():
            new_statements.append(stmt)
            continue
            
        # Check if it's an ALTER TABLE with multiple ADD COLUMNs
        # Naive approach: if 'ALTER TABLE' is in stmt and 'ADD COLUMN' appears multiple times separated by commas
        if 'ALTER TABLE' in stmt.upper():
            # Find the table name
            match = re.search(r'ALTER\s+TABLE\s+([A-Za-z0-9_]+)\s+(.+)', stmt, re.IGNORECASE | re.DOTALL)
            if match:
                table_name = match.group(1)
                rest = match.group(2)
                
                # Check if it has commas separating ADD COLUMNs (or just columns)
                # If it's something like "ADD COLUMN a TYPE, ADD COLUMN b TYPE"
                if ',' in rest and 'ADD COLUMN' in rest.upper():
                    # We will just manually fix files if this automated approach is too risky, but let's try a simple split.
                    # It's safer to just do simple replacements.
                    pass
                
    # Since regex is risky for SQL, let's just do targeted replacements for the files we know.
    
    with open(filepath, 'w') as f:
        f.write(content)

# We know the specific files that need splitting of ALTER TABLE
files_to_split = [
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V34__link_pharmacy_clinical_prescriptions.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\pharmacy\V34__link_pharmacy_clinical_prescriptions.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V36__add_prescription_void_and_patient_profile_fields.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V53__add_retry_fields_to_clinic_outbox_events.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\pharmacy\V35__add_prescription_item_type.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V35__add_prescription_item_type.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V48__add_appointment_to_vitals.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V29__init_clinical_decision_schema.sql",
    r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\clinic\V50__add_assigned_pharmacy_user_to_prescriptions.sql"
]

for file in glob.glob(r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\**\*.sql", recursive=True):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('ADD COLUMN IF NOT EXISTS', 'ADD COLUMN')
    if content != new_content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Removed IF NOT EXISTS from {file}")

print("Done stripping IF NOT EXISTS.")
