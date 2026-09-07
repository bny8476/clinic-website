import os
import re
import json

WORKSPACE = "/Users/eakhalaivan/Downloads/clinic main"
FRONTEND_DIR = os.path.join(WORKSPACE, "frontend", "src")
BACKEND_DIR = os.path.join(WORKSPACE, "backend", "src")

# Patterns to flag
PATTERNS = [
    (r"const\s+\w*mock\w*\s*=", "Mock Data Variable"),
    (r"const\s+\w*dummy\w*\s*=", "Dummy Data Variable"),
    (r"const\s+\w*sample\w*\s*=", "Sample Data Variable"),
    (r"const\s+\w*fake\w*\s*=", "Fake Data Variable"),
    (r"const\s+patients\s*=\s*\[", "Hardcoded Patient Array"),
    (r"const\s+doctors\s*=\s*\[", "Hardcoded Doctor Array"),
    (r"const\s+appointments\s*=\s*\[", "Hardcoded Appointment Array"),
    (r"const\s+notifications\s*=\s*\[", "Hardcoded Notification Array"),
    (r"const\s+stats\s*=\s*\{", "Hardcoded Stats Object"),
    (r"const\s+revenueData\s*=\s*\[", "Hardcoded Revenue/Finance Data"),
    (r"const\s+chartData\s*=\s*\[", "Hardcoded Chart Data"),
    (r"\|\|\s*\{\s*name:\s*[\"']", "Fake Business Fallback Object"),
    (r"catch\s*\{?\s*return\s*\[\s*\{\s*id:", "API Catch Fallback to Mock Object"),
    (r"return\s+List\.of\(\s*new\s+\w*Dto", "Backend Hardcoded DTO List Return"),
    (r"Showing\s+1\s+to\s+\d+\s+of\s+\d+", "Hardcoded Pagination String"),
    (r"navigate\(.*patients/14", "Hardcoded Operational Patient ID in Navigation")
]

EXCLUDE_MEDICINE_FILES = [
    "medicine", "Medicine", "drug", "Drug", "catalog", "Catalog", "inventory", "Inventory"
]

def is_medicine_exempt(filepath):
    filename = os.path.basename(filepath)
    # Check if file is primarily medicine catalogue / dataset / import
    if "Medicine" in filename or "medicine" in filename or "Drug" in filename:
        # Check if it's strictly medicine catalog/import/master
        if any(x in filename for x in ["Master", "Catalog", "Dataset", "Import", "Seed"]):
            return True
    return False

def scan_files():
    findings = []
    
    for root, dirs, files in os.walk(FRONTEND_DIR):
        for file in files:
            if not (file.endswith(".js") or file.endswith(".jsx") or file.endswith(".ts") or file.endswith(".tsx")):
                continue
            filepath = os.path.join(root, file)
            if is_medicine_exempt(filepath):
                continue
            
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.readlines()
                for line_idx, line in enumerate(content, 1):
                    for pattern, cat in PATTERNS:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Exclude legitimate UI labels or comment lines if not actual code
                            if line.strip().startswith("//") or line.strip().startswith("/*") or line.strip().startswith("*"):
                                continue
                            findings.append({
                                "file": os.path.relpath(filepath, WORKSPACE),
                                "line": line_idx,
                                "match": line.strip()[:100],
                                "category": cat
                            })
                            
    for root, dirs, files in os.walk(BACKEND_DIR):
        for file in files:
            if not (file.endswith(".java") or file.endswith(".yml") or file.endswith(".properties")):
                continue
            filepath = os.path.join(root, file)
            if is_medicine_exempt(filepath):
                continue
                
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.readlines()
                for line_idx, line in enumerate(content, 1):
                    for pattern, cat in PATTERNS:
                        if re.search(pattern, line, re.IGNORECASE):
                            if line.strip().startswith("//") or line.strip().startswith("/*") or line.strip().startswith("*"):
                                continue
                            findings.append({
                                "file": os.path.relpath(filepath, WORKSPACE),
                                "line": line_idx,
                                "match": line.strip()[:100],
                                "category": cat
                            })

    print(f"TOTAL MOCK / HARDCODED INSTANCES FOUND: {len(findings)}\n")
    for f in findings:
        print(f"[{f['category']}] {f['file']}:{f['line']} -> {f['match']}")
        
    with open(os.path.join(WORKSPACE, "scratch", "audit_report.json"), "w") as out:
        json.dump(findings, out, indent=2)

if __name__ == "__main__":
    scan_files()
