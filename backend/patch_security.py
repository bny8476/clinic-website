import os
import re

package_roles = {
    'tenant': "hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')",
    'admin': "hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')",
    'hr': "hasAuthority('ROLE_HR') or hasAuthority('ROLE_SUPER_ADMIN')",
    'finance': "hasAuthority('ROLE_FINANCE') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN')",
    'ecommerce': "", # Keep these public or rely on standard auth
    'pharmacy': "hasAuthority('ROLE_PHARMACIST') or hasAuthority('ROLE_INVENTORY_MANAGER') or hasAuthority('ROLE_SUPER_ADMIN')",
    'inventory': "hasAuthority('ROLE_INVENTORY_MANAGER') or hasAuthority('ROLE_STORE_MANAGER') or hasAuthority('ROLE_SUPER_ADMIN')",
    'nursing': "hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')",
    'doctor': "hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')",
    'emr': "hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')",
    'patient': "hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')",
    'telemedicine': "hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')",
    'ambulance': "hasAuthority('ROLE_AMBULANCE') or hasAuthority('ROLE_SUPER_ADMIN')",
    'support': "hasAuthority('ROLE_SUPPORT') or hasAuthority('ROLE_CUSTOMER_SUPPORT') or hasAuthority('ROLE_SUPER_ADMIN')",
    'marketing': "hasAuthority('ROLE_MARKETING') or hasAuthority('ROLE_SUPER_ADMIN')",
    'appointment': "hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')",
    'document': "hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')",
    'ai': "hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')",
    'subscription': "hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')",
    'engagement': "hasAuthority('ROLE_MARKETING') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')",
    'identity': "" # Auth and identity handles its own security
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if '@PreAuthorize' in content:
        return # Already has authorization logic
        
    # Extract package
    pkg_match = re.search(r'package com\.healthcare\.clinic\.([a-z]+)', content)
    if not pkg_match:
        return
    pkg = pkg_match.group(1)
    
    role = package_roles.get(pkg, None)
    if not role:
        return # No specific role defined or left empty intentionally
        
    # Inject import if missing
    if 'import org.springframework.security.access.prepost.PreAuthorize;' not in content:
        content = re.sub(
            r'(import org\.springframework\.web\.bind\.annotation\..*?;)',
            r'\1\nimport org.springframework.security.access.prepost.PreAuthorize;',
            content,
            count=1
        )
        
    # Add @PreAuthorize to class level
    annotation = f'@PreAuthorize("{role}")'
    
    # Replace @RestController with @RestController\n@PreAuthorize
    content = re.sub(
        r'(@RestController\s*\n\s*@RequestMapping[^\n]+)',
        rf'\1\n{annotation}',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath} for package {pkg}")

if __name__ == '__main__':
    root_dir = './src/main/java/com/healthcare/clinic'
    for dirpath, dirs, files in os.walk(root_dir):
        for f in files:
            if f.endswith('Controller.java'):
                process_file(os.path.join(dirpath, f))
