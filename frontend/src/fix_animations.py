import os
import glob
import re

patient_dir = '/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages/patient'

for filepath in glob.glob(os.path.join(patient_dir, '*.jsx')):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Imports
    content = content.replace("staggerContainer", "staggerChildren")
    content = content.replace("fadeIn", "fadeUp")
    
    # Animate states
    content = content.replace('animate="show"', 'animate="visible"')
    content = content.replace("animate='show'", 'animate="visible"')
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

print("Done")
