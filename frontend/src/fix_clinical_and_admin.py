import re
import os

files = [
    'NewPrescription.jsx',
    'PrescriptionTemplates.jsx',
    'DoctorPrescriptions.jsx',
    'ClinicalNotes.jsx',
    'LabRequest.jsx',
    'RadiologyRequest.jsx',
    'DoctorLabReports.jsx',
    'DoctorEarnings.jsx',
    'DoctorScheduleSettings.jsx',
    'ManageMedicines.jsx'
]
doctor_dir = '/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages/doctor/'

def process_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    if 'PageTransition' not in content:
        # Insert import
        imports = "import PageTransition from '../../components/ui/PageTransition';\n"
        # Find last import
        matches = list(re.finditer(r'^import .*$', content, re.MULTILINE))
        if matches:
            last_import = matches[-1]
            content = content[:last_import.end()] + '\n' + imports + content[last_import.end():]

    # Find the main return (usually the one right before the end of the file)
    # Most components end with:
    #   return (
    #     <div ...>
    #       ...
    #     </div>
    #   );
    # };
    # export default ...

    # Let's match the outermost div inside the main return
    # We look for a pattern that matches the end of the file
    content, count = re.subn(r'  return \(\n    <div', '  return (\n    <PageTransition>\n    <div', content, count=1)
    if count > 0:
        content, c2 = re.subn(r'    </div>\n  \);\n};\n?$', '    </div>\n    </PageTransition>\n  );\n};\n', content, flags=re.MULTILINE)
        if c2 == 0:
            content, c2 = re.subn(r'    </div>\n  \);\n}\n?$', '    </div>\n    </PageTransition>\n  );\n}\n', content, flags=re.MULTILINE)
            
    with open(filepath, 'w') as f:
        f.write(content)

for file in files:
    process_file(doctor_dir + file)
    print(f"Processed {file}")

