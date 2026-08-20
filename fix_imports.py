import os

replacements = {
    "com.healthcare.clinic.superadmin.entity.IntegrationConfig": "com.healthcare.clinic.integration.entity.IntegrationConfig",
    "com.healthcare.clinic.superadmin.entity.FeatureFlag": "com.healthcare.clinic.tenant.entity.FeatureFlag",
    "com.healthcare.clinic.nursing.entity.Ward": "com.healthcare.clinic.inpatient.entity.Ward",
    "com.healthcare.clinic.nursing.entity.Bed": "com.healthcare.clinic.inpatient.entity.Bed",
    "com.healthcare.clinic.doctor.entity.ClinicalReferral": "com.healthcare.clinic.emr.entity.ClinicalReferral",
    "com.healthcare.clinic.homevisit.entity.HomeVisitRequest": "com.healthcare.clinic.patient.entity.HomeVisitRequest",
    "com.healthcare.clinic.ai.entity.AiChatMessage": "com.healthcare.clinic.patient.entity.AiChatMessage",
    "com.healthcare.clinic.ai.entity.AiChatSession": "com.healthcare.clinic.patient.entity.AiChatSession"
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
