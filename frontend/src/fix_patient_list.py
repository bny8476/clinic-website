import re

with open('/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages/doctor/PatientList.jsx', 'r') as f:
    content = f.read()

# Add import
if 'PageTransition' not in content:
    content = content.replace("import toast from 'react-hot-toast';", "import toast from 'react-hot-toast';\nimport PageTransition from '../../components/ui/PageTransition';")

# Find the main return (usually the last `return (` that isn't inside a small function)
# Actually, the main return in PatientList is at the bottom, but there might be other returns in between.
# Let's just find the `  return (` that has 2 spaces indentation.
content = re.sub(r'^  return \(\n', '  return (\n    <PageTransition>\n', content, flags=re.MULTILINE)
# The last `  );`
content = re.sub(r'^  \);\n}\n?$', '    </PageTransition>\n  );\n}\n', content, flags=re.MULTILINE)
# If it's `  );\n};`
content = re.sub(r'^  \);\n};\n?$', '    </PageTransition>\n  );\n};\n', content, flags=re.MULTILINE)

with open('/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages/doctor/PatientList.jsx', 'w') as f:
    f.write(content)
