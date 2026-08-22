import os
import re

ENTITY_ROOT = "/Users/eakhalaivan/Downloads/clinic-website/backend/src/main/java/com/healthcare/clinic"

missing = []

for dirpath, _, filenames in os.walk(ENTITY_ROOT):
    if "/pharmacy/" in dirpath:
        continue
    for fname in filenames:
        if not fname.endswith(".java"):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath) as f:
            content = f.read()
        
        if "@Entity" not in content:
            continue
            
        m = re.search(r'@Table\s*\(\s*name\s*=\s*"([^"]+)"', content)
        if not m:
            continue
        table_name = m.group(1)
        
        # Match all @Column and @JoinColumn even if multiline
        # @Column(name = "...", nullable = ...)
        # @JoinColumn(name = "...")
        for match in re.finditer(r'@(?:Join)?Column\s*\([^)]*\)', content):
            ann = match.group(0)
            nm = re.search(r'name\s*=\s*"([^"]+)"', ann)
            if nm:
                col = nm.group(1)
                missing.append(f"{table_name}.{col}")

print("\n".join(sorted(set(missing))))
