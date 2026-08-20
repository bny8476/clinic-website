import re

files = [
    'DoctorDashboard.jsx',
    'DoctorCalendar.jsx',
    'ConsultationQueue.jsx',
    'ClinicalWorkspace.jsx'
]
doctor_dir = '/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages/doctor/'

for file in files:
    filepath = doctor_dir + file
    with open(filepath, 'r') as f:
        content = f.read()

    # Add PageTransition import if not there
    if 'PageTransition' not in content:
        content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport PageTransition from '../../components/ui/PageTransition';")

    # Replace the main return
    if file == 'DoctorDashboard.jsx':
        content = content.replace('  return (\n    <div className="doctor-dashboard-root">', '  return (\n    <PageTransition>\n    <div className="doctor-dashboard-root">')
        content = re.sub(r'    </div>\n  \);\n};\n?$', '    </div>\n    </PageTransition>\n  );\n};\n', content, flags=re.MULTILINE)
    
    elif file == 'DoctorCalendar.jsx':
        content = content.replace('  return (\n    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">', '  return (\n    <PageTransition>\n    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">')
        content = re.sub(r'    </div>\n  \);\n};\n?$', '    </div>\n    </PageTransition>\n  );\n};\n', content, flags=re.MULTILINE)

    elif file == 'ConsultationQueue.jsx':
        content = content.replace('  return (\n    <div className="h-full flex flex-col font-sans overflow-y-auto bg-[var(--color-bg-app)] p-6">', '  return (\n    <PageTransition>\n    <div className="h-full flex flex-col font-sans overflow-y-auto bg-[var(--color-bg-app)] p-6">')
        content = re.sub(r'    </div>\n  \);\n};\n?$', '    </div>\n    </PageTransition>\n  );\n};\n', content, flags=re.MULTILINE)

    elif file == 'ClinicalWorkspace.jsx':
        content = content.replace('  return (\n    <div className="clinical-workspace-root">', '  return (\n    <PageTransition>\n    <div className="clinical-workspace-root">')
        content = re.sub(r'    </div>\n  \);\n};\n?$', '    </div>\n    </PageTransition>\n  );\n};\n', content, flags=re.MULTILINE)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {file}")

