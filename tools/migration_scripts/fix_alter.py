import glob
import re
import os

def fix_sql_syntax(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find blocks of ALTER TABLE ... ;
    # Regex to match ALTER TABLE [table_name] [stuff];
    pattern = re.compile(r'(ALTER\s+TABLE\s+([A-Za-z0-9_]+)\s+)([^;]+);', re.IGNORECASE)
    
    def replacer(match):
        prefix = match.group(1)
        table_name = match.group(2)
        body = match.group(3)
        
        # If body has ADD COLUMN multiple times or just commas and ADD COLUMN
        if 'ADD COLUMN' in body.upper() and ',' in body:
            # Split the body by commas, but only if they are not inside parentheses (like DECIMAL(10,2))
            # Actually, the simplest way is to split by "ADD COLUMN" or ",\s*ADD COLUMN"
            # Let's just split by 'ADD COLUMN'
            parts = re.split(r',\s*ADD COLUMN\s+|,\s*ADD\s+COLUMN\s+|\s*ADD COLUMN\s+|\s*ADD\s+COLUMN\s+', body, flags=re.IGNORECASE)
            
            new_stmts = []
            for part in parts:
                part = part.strip()
                if part:
                    # Remove trailing commas
                    if part.endswith(','):
                        part = part[:-1].strip()
                    new_stmts.append(f"ALTER TABLE {table_name} ADD COLUMN {part};")
            
            return "\n".join(new_stmts)
        else:
            # Maybe it is just ADD COLUMN without comma? Then it's fine.
            return match.group(0)

    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for file in glob.glob(r"c:\Users\user\Documents\clinic-website\backend\src\main\resources\db\migration\**\*.sql", recursive=True):
    fix_sql_syntax(file)

print("Done syntax fixing.")
