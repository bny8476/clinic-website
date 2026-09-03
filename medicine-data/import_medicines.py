#!/usr/bin/env python3
"""
Jan Aushadhi Medicine CSV Importer to PostgreSQL Database
Idempotent script to import and normalize Jan Aushadhi CSV data into
medicine_category, medicine, and medicine_price PostgreSQL tables.
"""

import os
import sys
import argparse
import pandas as pd
import psycopg
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    dbname = os.getenv("PGDATABASE", "clinic")
    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD", "")

    conn_str = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    return psycopg.connect(conn_str)

def clean_str(val):
    if pd.isna(val) or val is None:
        return ""
    return str(val).strip()

def clean_mrp(val):
    if pd.isna(val) or val is None:
        return 0.0
    try:
        cleaned = str(val).replace("₹", "").replace(",", "").strip()
        return float(cleaned)
    except ValueError:
        return 0.0

def import_csv(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: File {csv_path} not found.")
        sys.exit(1)

    print(f"Reading: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"CSV rows: {len(df)}")
    print(f"CSV columns:\n{list(df.columns)}")

    required_cols = ['Drug Code', 'Generic Name', 'Unit Size', 'MRP', 'Group Name']
    for col in required_cols:
        if col not in df.columns:
            print(f"Error: Missing required column '{col}' in CSV.")
            sys.exit(1)

    df['drug_code_clean'] = df['Drug Code'].apply(clean_str)
    df = df[df['drug_code_clean'] != ""].drop_duplicates(subset=['drug_code_clean'], keep='first')
    print(f"Valid unique medicine rows: {len(df)}")

    conn = get_db_connection()
    inserted_count = 0
    updated_count = 0

    with conn.cursor() as cur:
        category_map = {}
        cur.execute("SELECT id, name FROM medicine_category;")
        for cid, cname in cur.fetchall():
            category_map[cname.upper()] = cid

        unique_categories = df['Group Name'].apply(clean_str).unique()
        for cat_name in unique_categories:
            if not cat_name:
                continue
            cat_upper = cat_name.upper()
            if cat_upper not in category_map:
                cur.execute(
                    "INSERT INTO medicine_category (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id;",
                    (cat_name,)
                )
                cat_id = cur.fetchone()[0]
                category_map[cat_upper] = cat_id

        for _, row in df.iterrows():
            drug_code = clean_str(row['Drug Code'])
            generic_name = clean_str(row['Generic Name'])
            unit_size = clean_str(row['Unit Size'])
            mrp = clean_mrp(row['MRP'])
            group_name = clean_str(row['Group Name']).upper()
            category_id = category_map.get(group_name)

            cur.execute("SELECT id FROM medicine WHERE drug_code = %s;", (drug_code,))
            existing = cur.fetchone()

            if existing:
                med_id = existing[0]
                cur.execute(
                    """
                    UPDATE medicine 
                    SET generic_name = %s, unit_size = %s, category_id = %s, updated_at = NOW()
                    WHERE id = %s;
                    """,
                    (generic_name, unit_size, category_id, med_id)
                )
                updated_count += 1
            else:
                cur.execute(
                    """
                    INSERT INTO medicine (drug_code, generic_name, unit_size, category_id, source, source_name)
                    VALUES (%s, %s, %s, %s, 'JAN_AUSHADHI', 'Jan Aushadhi Scheme')
                    RETURNING id;
                    """,
                    (drug_code, generic_name, unit_size, category_id)
                )
                med_id = cur.fetchone()[0]
                inserted_count += 1

            cur.execute(
                """
                INSERT INTO medicine_price (medicine_id, mrp, currency, source)
                VALUES (%s, %s, 'INR', 'JAN_AUSHADHI')
                ON CONFLICT (medicine_id, effective_from) 
                DO UPDATE SET mrp = EXCLUDED.mrp;
                """,
                (med_id, mrp)
            )

        conn.commit()

    conn.close()
    print("\nImport completed.")
    print(f"Inserted: {inserted_count}")
    print(f"Updated: {updated_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Jan Aushadhi CSV to PostgreSQL")
    parser.add_argument("csv_file", nargs="?", default="Product_List.csv", help="Path to Product_List.csv")
    args = parser.parse_args()
    import_csv(args.csv_file)
