import os
import glob
import re

doctor_dir = '/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages/doctor'
files_to_process = [
    'DoctorDashboard.jsx',
    'PatientList.jsx',
    'DoctorCalendar.jsx',
    'ConsultationQueue.jsx',
    'ClinicalWorkspace.jsx'
]

imports_to_add = """
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, fadeUp, staggerChildren, listStagger } from '../../components/ui/motion';
"""

def add_imports(content):
    if "framer-motion" not in content and "ui/motion" not in content:
        # Find the last import statement
        last_import_index = 0
        for match in re.finditer(r'^import .*;?$', content, re.MULTILINE):
            last_import_index = match.end()
        
        return content[:last_import_index] + "\n" + imports_to_add + content[last_import_index:]
    return content

for filename in files_to_process:
    filepath = os.path.join(doctor_dir, filename)
    if not os.path.exists(filepath):
        print(f"Not found: {filename}")
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    content = add_imports(content)
    
    # We will just do a simple replacement for PageTransition where we can
    # Or just replace the outer most div if it matches exactly
    
    with open(filepath, 'w') as f:
        f.write(content)
        
    print(f"Added imports to {filename}")

print("Done")
