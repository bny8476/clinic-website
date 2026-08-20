import os

replacements = {
    "com.healthcare.clinic.inpatient.entity.BedAssignment": "com.healthcare.clinic.nursing.entity.BedAssignment",
    "com.healthcare.clinic.inpatient.entity.WardTransfer": "com.healthcare.clinic.nursing.entity.WardTransfer",
    "com.healthcare.clinic.inpatient.entity.WardAssignment": "com.healthcare.clinic.nursing.entity.WardAssignment",
    "com.healthcare.clinic.inpatient.entity.WardShift": "com.healthcare.clinic.nursing.entity.WardShift"
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    modified = False
    for old, new in replacements.items():
        if old in content:
            content = content.replace(old, new)
            modified = True
            
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed imports in {filepath}")

for root, dirs, files in os.walk("backend/src/main/java/com/healthcare/clinic"):
    for file in files:
        if file.endswith(".java"):
            process_file(os.path.join(root, file))
