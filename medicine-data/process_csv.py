import csv
import json
import os
import re

csv_path = "/Users/eakhalaivan/Downloads/clinic-website main/medicine-data/Product List_3_9_2026 @ 14_29_1.csv"
target_csv = "/Users/eakhalaivan/Downloads/clinic-website main/medicine-data/Product_List.csv"
js_out_path = "/Users/eakhalaivan/Downloads/clinic-website main/frontend/src/data/janAushadhiCatalog.js"
sql_out_path = "/Users/eakhalaivan/Downloads/clinic-website main/backend/src/main/resources/db/migration/pharmacy/V132_132_114__seed_jan_aushadhi_2439_medicines.sql"

# 1. Copy to Product_List.csv
with open(csv_path, 'r', encoding='utf-8') as f_in, open(target_csv, 'w', encoding='utf-8') as f_out:
    f_out.write(f_in.read())

print("Copied CSV to Product_List.csv")

# 2. Parse CSV rows
medicines = []
categories_set = set()

def clean_val(val):
    if not val:
        return ""
    return str(val).strip().strip('"')

def clean_price(val):
    if not val:
        return 0.0
    try:
        return float(str(val).replace("₹", "").replace(",", "").strip())
    except:
        return 0.0

def escape_sql(val):
    if not val:
        return ""
    return str(val).replace("'", "''")

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for idx, row in enumerate(reader, start=1):
        drug_code = clean_val(row.get("Drug Code"))
        generic_name = clean_val(row.get("Generic Name"))
        unit_size = clean_val(row.get("Unit Size"))
        mrp = clean_price(row.get("MRP"))
        group_name = clean_val(row.get("Group Name")) or "General"

        if not drug_code or not generic_name:
            continue

        categories_set.add(group_name)

        # Infer category / schedule
        schedule = "OTC"
        if any(w in generic_name.lower() for w in ["injection", "cefixime", "amoxicillin", "azithromycin", "ciprofloxacin", "ofloxacin", "levofloxacin", "ceftriaxone", "cefuroxime", "meropenem"]):
            schedule = "Schedule H1"
        elif any(w in generic_name.lower() for w in ["pregabalin", "gabapentin", "alprazolam", "clonazepam", "tramadol", "codeine", "zolpidem"]):
            schedule = "Schedule H"
        elif any(w in generic_name.lower() for w in ["tablet", "capsule", "syrup", "ointment", "cream"]):
            schedule = "Schedule H"

        cat_type = "Tablet"
        if "capsule" in generic_name.lower():
            cat_type = "Capsule"
        elif "syrup" in generic_name.lower() or "suspension" in generic_name.lower() or "elixir" in generic_name.lower():
            cat_type = "Syrup"
        elif "injection" in generic_name.lower() or "infusion" in generic_name.lower():
            cat_type = "Injection"
        elif "gel" in generic_name.lower() or "ointment" in generic_name.lower() or "cream" in generic_name.lower():
            cat_type = "Ointment"
        elif "drop" in generic_name.lower():
            cat_type = "Drops"

        stock = 100 if (idx % 7 != 0) else (5 if idx % 14 == 0 else 12)

        medicines.append({
            "id": idx,
            "drugCode": drug_code,
            "name": generic_name,
            "genericName": generic_name,
            "unitSize": unit_size,
            "mrp": mrp,
            "purchasePrice": round(mrp * 0.75, 2),
            "salePrice": mrp,
            "category": group_name,
            "drugClass": group_name,
            "manufacturer": "Jan Aushadhi (BPPI / PMBI)",
            "hsnCode": "3004",
            "taxPercentage": 12.0,
            "schedule": schedule,
            "unit": cat_type,
            "reorderLevel": 15,
            "currentStock": stock,
            "barcode": f"8909000{idx:06d}",
            "medicineCode": f"JA-{drug_code}",
            "storageConditions": "Store in a cool & dry place below 25°C"
        })

print(f"Parsed {len(medicines)} medicines and {len(categories_set)} categories.")

# 3. Output JavaScript dataset
js_content = f"""/**
 * Jan Aushadhi Official Product Catalog ({len(medicines)} Products)
 * Imported directly from Jan Aushadhi (PMBI) official medicine database
 */

export const JAN_AUSHADHI_MEDICINES = {json.dumps(medicines, indent=2)};
"""

with open(js_out_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Wrote JS dataset to {js_out_path}")

# 4. Output SQL migration
sql_lines = []
sql_lines.append("-- V132_132_114__seed_jan_aushadhi_2439_medicines.sql")
sql_lines.append("-- Seed 2,439 Jan Aushadhi Official Medicines and Categories\n")

for cat in sorted(categories_set):
    sql_lines.append(f"INSERT INTO medicine_category (name) VALUES ('{escape_sql(cat)}') ON CONFLICT (name) DO NOTHING;")

sql_lines.append("\n")

for m in medicines:
    d_code = escape_sql(m['drugCode'])
    g_name = escape_sql(m['genericName'])
    u_size = escape_sql(m['unitSize'])
    mrp = m['mrp']
    p_price = m['purchasePrice']
    group = escape_sql(m['category'])
    schedule = escape_sql(m['schedule'])

    sql_lines.append(
        f"INSERT INTO pharmacy_medicines (name, generic_name, category, unit, hsn_code, tax_percentage, mrp, purchase_price, sale_price, drug_class, schedule, medicine_code, barcode, reorder_level, is_deleted) "
        f"VALUES ('{g_name}', '{g_name}', '{group}', '{m['unit']}', '3004', 12.00, {mrp}, {p_price}, {mrp}, '{group}', '{schedule}', 'JA-{d_code}', '8909000{m['id']:06d}', 15, false) "
        f"ON CONFLICT (medicine_code) DO UPDATE SET mrp = EXCLUDED.mrp, generic_name = EXCLUDED.generic_name;"
    )

with open(sql_out_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print(f"Wrote SQL migration to {sql_out_path}")
