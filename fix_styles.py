import os

files_to_fix = [
    'frontend/src/pages/doctor/DoctorDashboard.jsx',
    'frontend/src/pages/patient/PatientDashboard.jsx',
    'frontend/src/pages/admin/AdminDashboard.jsx'
]

replacements = {
    'bg-[#f8fafe]': 'bg-[var(--color-bg-app)]',
    'bg-[#F5F8FF]': 'bg-[var(--color-bg-app)]',
    'border-slate-100': 'border-[var(--color-border)]',
    'border-slate-200': 'border-[var(--color-border)]',
    'text-slate-800': 'text-[var(--color-text)]',
    'text-slate-500': 'text-[var(--color-text-muted)]',
    'text-slate-400': 'text-[var(--color-text-muted)]',
    'bg-blue-600': 'bg-[var(--color-navy-800)]',
    'border-blue-600': 'border-[var(--color-navy-800)]',
    'text-blue-600': 'text-[var(--color-navy-800)]',
    'text-blue-500': 'text-[var(--color-navy-600)]',
    'bg-blue-50': 'bg-[var(--color-info-bg)]',
    'border-blue-200': 'border-[var(--color-navy-600)]/20',
    'shadow-[0_2px_12px_rgba(0,0,0,0.02)]': 'shadow-card',
    'bg-slate-50': 'bg-[var(--color-surface-alt)]'
}

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
