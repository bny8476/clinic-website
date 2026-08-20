/**
 * portalConfig.js — Single source of truth for all 25 role portals.
 *
 * Each entry defines:
 *   slug         — URL prefix and login route key
 *   displayName  — Human-readable portal name
 *   role         — Spring Security role string
 *   themeColor   — Sidebar accent hex color
 *   dashboardRoute — Default redirect after login
 *   sidebarNav   — Ordered nav items for DashboardLayout sidebar
 *   authConfig   — Role-tailored login & registration hero text/badges
 */

export const PORTAL_CONFIGS = [
  // ── 3. Doctor ─────────────────────────────────────────────────────────────
  {
    slug: 'doctor',
    displayName: 'Doctor',
    role: 'ROLE_DOCTOR',
    themeColor: '#2B4AFE',
    dashboardRoute: '/doctor/dashboard',
    authConfig: {
      heroTitle: 'Provider Intelligence Access.',
      heroSubtitle: 'Empowering clinical precision, CDS safety checks, e-prescriptions, and patient care management.',
      sideBadge: 'CLINICAL PRECISION',
      sideQuoteTitle: 'Empowering physician excellence.',
      sideQuoteText: 'Real-time clinical decision support, instant EMR access, and seamless multidisciplinary care team collaboration.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/doctor/dashboard', icon: 'LayoutGrid', description: 'View dashboard metrics' },
      { label: 'Appointments', path: '/doctor/appointments/today', icon: 'Clock', description: 'Manage appointments' },
      { label: 'Patients', path: '/doctor/patients', icon: 'Users', description: 'View and manage patients' },
      { label: 'Calendar', path: '/doctor/calendar', icon: 'Calendar', description: 'View calendar' },
      { label: 'Prescriptions', path: '/doctor/prescriptions', icon: 'FileText', description: 'Manage prescriptions' },
      { label: 'Follow-ups', path: '/doctor/follow-ups', icon: 'Heart', description: 'Manage follow-ups' },
      { label: 'Lab Reports', path: '/doctor/lab-reports', icon: 'FlaskConical', description: 'View lab reports' },
      { label: 'Certificates', path: '/doctor/medical-certificate', icon: 'FileText', description: 'Medical certificates' },
      { label: 'Settings', path: '/doctor/schedule-settings', icon: 'Settings', description: 'Schedule settings' }
    ],
  },

  // ── 4. Patient ────────────────────────────────────────────────────────────
  {
    slug: 'patient',
    displayName: 'Patient',
    role: 'ROLE_PATIENT',
    themeColor: '#2B4AFE',
    dashboardRoute: '/patient/dashboard',
    authConfig: {
      heroTitle: 'Welcome back to excellence.',
      heroSubtitle: 'Access your premium health concierge, appointment booking, and encrypted medical records.',
      sideBadge: 'SYSTEM SECURE',
      sideQuoteTitle: 'Privacy at the heart of care.',
      sideQuoteText: 'Your health data is encrypted with military-grade security, ensuring that your wellness journey remains private and exclusive.',
      allowRegister: true,
      registerTitle: 'Begin your journey towards precision medical care.',
      registerQuote: 'The art of medicine consists of amusing the patient while nature cures the disease. We provide the clarity nature requires.',
      registerQuoteAuthor: 'THE AURELIAN STANDARD',
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/patient/dashboard',      icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Profile', path: '/patient/profile',        icon: 'UserCircle', description: 'Manage and view profile' },
      { label: 'Book Appointment', path: '/doctors',                icon: 'CalendarPlus', description: 'Manage and view book appointment' },
      { label: 'Appointments', path: '/patient/appointments',   icon: 'CalendarDays', description: 'Manage and view appointments' },
      { label: 'Medical Records', path: '/patient/records',        icon: 'FileHeart', description: 'Manage and view medical records' },
      { label: 'Prescriptions', path: '/patient/prescriptions',  icon: 'Pill', description: 'Manage and view prescriptions' },
      { label: 'Lab Reports', path: '/patient/lab-reports',    icon: 'FlaskConical', description: 'Manage and view lab reports' },
      { label: 'Radiology', path: '/patient/radiology-reports', icon: 'Scan', description: 'Manage and view radiology' },
      { label: 'Payments', path: '/patient/payments',       icon: 'CreditCard', description: 'Manage and view payments' },
      { label: 'Insurance', path: '/patient/insurance',      icon: 'ShieldCheck', description: 'Manage and view insurance' },
      { label: 'Health Timeline', path: '/patient/timeline',       icon: 'Activity', description: 'Manage and view health timeline' },
      { label: 'Orders', path: '/patient/orders',         icon: 'ShoppingCart', description: 'Manage and view orders' },
      { label: 'AI Assistant', path: '/patient/ai-assistant',   icon: 'Bot', description: 'Manage and view ai assistant' },
    ],
  },

  // ── 5. Reception ──────────────────────────────────────────────────────────
  {
    slug: 'reception',
    displayName: 'Reception',
    role: 'ROLE_RECEPTION',
    themeColor: '#b45309',
    dashboardRoute: '/reception/dashboard',
    authConfig: {
      heroTitle: 'Clinical Operations Gateway.',
      heroSubtitle: 'Streamlined patient triage, walk-in tokens, appointment scheduling, and front-desk billing.',
      sideBadge: 'FRONT DESK ACTIVE',
      sideQuoteTitle: 'Seamless patient intake.',
      sideQuoteText: 'Optimized patient check-ins, queue token generation, and real-time scheduling for maximum operational flow.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/reception/dashboard', icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Register Patient', path: '/reception/register',  icon: 'UserPlus', description: 'Manage and view register patient' },
      { label: 'Walk-In', path: '/reception/walk-in',   icon: 'Footprints', description: 'Manage and view walk-in' },
      { label: 'Queue Management', path: '/reception/queue',     icon: 'ListOrdered', description: 'Manage and view queue management' },
      { label: 'Book Appointment', path: '/reception/book',      icon: 'CalendarPlus', description: 'Manage and view book appointment' },
      { label: 'Tokens', path: '/reception/tokens',    icon: 'Ticket', description: 'Manage and view tokens' },
      { label: 'Billing', path: '/reception/billing',   icon: 'Receipt', description: 'Manage and view billing' },
      { label: 'Check-in / Out', path: '/reception/checkin',   icon: 'CheckSquare', description: 'Manage and view check-in / out' },
      { label: 'Patient Search', path: '/reception/search',    icon: 'Search', description: 'Manage and view patient search' },
    ],
  },

  // ── 6. Nurse ──────────────────────────────────────────────────────────────
  {
    slug: 'nurse',
    displayName: 'Nurse',
    role: 'ROLE_NURSE',
    themeColor: '#0f766e',
    dashboardRoute: '/nurse/dashboard',
    authConfig: {
      heroTitle: 'Nursing Care Station.',
      heroSubtitle: 'Bedside vital signs tracking, medication administration logs, and ward monitoring.',
      sideBadge: 'TRIAGE READY',
      sideQuoteTitle: 'Dedicated to patient vitals & comfort.',
      sideQuoteText: 'Continuous vital sign tracking, medication verification, and direct physician alert escalation.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/nurse/dashboard',   icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Assigned Patients', path: '/nurse/patients',    icon: 'Users', description: 'Manage and view assigned patients' },
      { label: 'Vital Signs', path: '/nurse/vitals',      icon: 'HeartPulse', description: 'Manage and view vital signs' },
      { label: 'Medication Admin', path: '/nurse/medication',  icon: 'Pill', description: 'Manage and view medication admin' },
      { label: 'Nursing Notes', path: '/nurse/notes',       icon: 'ClipboardList', description: 'Manage and view nursing notes' },
      { label: 'Patient Monitoring', path: '/nurse/monitoring',  icon: 'Activity', description: 'Manage and view patient monitoring' },
      { label: 'Ward Management', path: '/nurse/wards',       icon: 'BedDouble', description: 'Manage and view ward management' },
      { label: 'Task Management', path: '/nurse/tasks',       icon: 'CheckSquare', description: 'Manage and view task management' },
    ],
  },

  // ── 7b. Pharmacy (Full Module) ──────────────────────────────────────────────
  {
    slug: 'pharmacy',
    displayName: 'Pharmacy System',
    role: 'ROLE_PHARMACIST',
    themeColor: '#065f46', // Dark emerald
    dashboardRoute: '/pharmacy/dashboard',
    authConfig: {
      heroTitle: 'Comprehensive Pharmacy Management.',
      heroSubtitle: 'Inventory control, billing, prescription verification, and complete medical stock administration.',
      sideBadge: 'PHARMACY CORE',
      sideQuoteTitle: 'Precision in inventory and dispensing.',
      sideQuoteText: 'Manage stock alerts, multi-branch transfers, expiration trackers, and retail billing from a unified command center.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/pharmacy/dashboard', icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Billing', path: '/pharmacy/billing-dashboard', icon: 'Receipt', description: 'Manage billing' },
      { label: 'Inventory', path: '/pharmacy/medicine-stock', icon: 'Package', description: 'Manage stock' },
      { label: 'Prescriptions', path: '/pharmacy/pending-prescriptions', icon: 'ClipboardList', description: 'Verify prescriptions' },
      { label: 'Purchase Orders', path: '/pharmacy/purchase-orders', icon: 'FileText', description: 'Manage procurement' },
      { label: 'Reports', path: '/pharmacy/analytics/analytics-dashboard', icon: 'BarChart2', description: 'View analytics' },
    ],
  },

  // ── 8. Lab Tech ───────────────────────────────────────────────────────────
  {
    slug: 'lab',
    displayName: 'Laboratory',
    role: 'ROLE_LAB_TECH',
    themeColor: '#0e7490',
    dashboardRoute: '/lab/dashboard',
    authConfig: {
      heroTitle: 'Diagnostic Pathology Lab.',
      heroSubtitle: 'Specimen sample collection, automated analyzer intake, and diagnostic report verification.',
      sideBadge: 'PATHOLOGY ONLINE',
      sideQuoteTitle: 'Precision diagnostic testing.',
      sideQuoteText: 'High-precision pathology testing with automated HL7 analyzer integration and rapid verification.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/lab/dashboard',      icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Worklist', path: '/lab/worklist',       icon: 'List', description: 'Manage lab requests and enter results' },
      { label: 'Catalog', path: '/lab/catalog',        icon: 'Settings', description: 'Manage test catalog' },
      { label: 'Report Verify', path: '/lab/verification',         icon: 'BadgeCheck', description: 'Manage and view report verify' },
      { label: 'Notifications', path: '/lab/notifications',  icon: 'Bell', description: 'Manage and view notifications' },
    ],
  },

  // ── 9. Radiologist ────────────────────────────────────────────────────────
  {
    slug: 'radiologist',
    displayName: 'Radiologist',
    role: 'ROLE_RADIOLOGIST',
    themeColor: '#374151',
    dashboardRoute: '/radiologist/dashboard',
    authConfig: {
      heroTitle: 'Radiology & Imaging Suite.',
      heroSubtitle: 'Sub-second DICOM viewing, PACS image archiving, and structured radiological reporting.',
      sideBadge: 'PACS CONNECTED',
      sideQuoteTitle: 'Clarity in diagnostic imaging.',
      sideQuoteText: 'Sub-second DICOM rendering, multi-planar reconstruction, and AI-assisted lesion detection.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/radiologist/dashboard', icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Imaging Requests', path: '/radiologist/requests',  icon: 'Scan', description: 'Manage and view imaging requests' },
      { label: 'DICOM Viewer', path: '/radiologist/viewer',    icon: 'MonitorPlay', description: 'Manage and view dicom viewer' },
      { label: 'Image Upload', path: '/radiologist/upload',    icon: 'Upload', description: 'Manage and view image upload' },
      { label: 'Reporting', path: '/radiologist/reporting', icon: 'FileText', description: 'Manage and view reporting' },
      { label: 'Archive', path: '/radiologist/archive',   icon: 'Archive', description: 'Manage and view archive' },
    ],
  },

  // ── 10. Inventory Manager ─────────────────────────────────────────────────
  {
    slug: 'inventory',
    displayName: 'Inventory',
    role: 'ROLE_INVENTORY_MANAGER',
    themeColor: '#c2410c',
    dashboardRoute: '/inventory/dashboard',
    authConfig: {
      heroTitle: 'Supply Chain & Logistics.',
      heroSubtitle: 'Warehouse management, purchase requisitions, supplier scoring, and inter-branch stock transfers.',
      sideBadge: 'INVENTORY ONLINE',
      sideQuoteTitle: 'Uninterrupted clinical supply chain.',
      sideQuoteText: 'Real-time stock auditing, supplier lead-time analysis, and automated minimum reorder thresholds.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/inventory/dashboard',       icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Warehouses', path: '/inventory/warehouses',      icon: 'Warehouse', description: 'Manage and view warehouses' },
      { label: 'Purchase Orders', path: '/inventory/purchase-orders', icon: 'FileText', description: 'Manage and view purchase orders' },
      { label: 'Suppliers', path: '/inventory/suppliers',       icon: 'Truck', description: 'Manage and view suppliers' },
      { label: 'Stock Transfers', path: '/inventory/transfers',       icon: 'ArrowLeftRight', description: 'Manage and view stock transfers' },
      { label: 'Batch Tracking', path: '/inventory/batches',         icon: 'Layers', description: 'Manage and view batch tracking' },
      { label: 'Expiry Tracking', path: '/inventory/expiry',          icon: 'AlertTriangle', description: 'Manage and view expiry tracking' },
      { label: 'Branches', path: '/inventory/branches',        icon: 'Building2', description: 'Manage and view branches' },
      { label: 'Reports', path: '/inventory/reports',         icon: 'BarChart3', description: 'Manage and view reports' },
    ],
  },

  // ── Accountant (mapped to finance) ────────────────────────────────────────
  {
    slug: 'accountant',
    displayName: 'Accountant',
    role: 'ROLE_ACCOUNTANT',
    themeColor: '#166534',
    dashboardRoute: '/finance/dashboard',
    authConfig: {
      heroTitle: 'Financial Governance Hub.',
      heroSubtitle: 'Clinical invoices, insurance claims reconciliation, GST compliance, and revenue analytics.',
      sideBadge: 'AUDIT READY',
      sideQuoteTitle: 'Financial integrity & transparency.',
      sideQuoteText: 'Real-time ledger accounting, automated GST returns, and insurance claim settlement tracking.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/finance/dashboard',        icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Invoices', path: '/finance/invoices',         icon: 'FileText', description: 'Manage and view invoices' },
      { label: 'Payments', path: '/finance/payments',         icon: 'CreditCard', description: 'Manage and view payments' },
      { label: 'Insurance Claims', path: '/finance/insurance-claims', icon: 'ShieldCheck', description: 'Manage and view insurance claims' },
      { label: 'Revenue', path: '/finance/revenue',          icon: 'TrendingUp', description: 'Manage and view revenue' },
      { label: 'Reports', path: '/finance/reports',          icon: 'FileBarChart', description: 'Manage and view reports' },
    ],
  },

  // ── 12. Inpatient ─────────────────────────────────────────────────────────
  {
    slug: 'inpatient',
    displayName: 'Inpatient',
    role: 'ROLE_NURSE',
    themeColor: '#0369a1',
    dashboardRoute: '/inpatient/dashboard',
    authConfig: {
      heroTitle: 'Inpatient Management.',
      heroSubtitle: 'Manage wards, beds, and patient admissions.',
      sideBadge: 'WARDS ACTIVE',
      sideQuoteTitle: 'Continuous patient care.',
      sideQuoteText: 'Manage inpatient admissions, real-time bed availability, and nursing stations.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/inpatient/dashboard', icon: 'LayoutDashboard', description: 'View dashboard metrics' },
      { label: 'Beds', path: '/inpatient/beds', icon: 'Bed', description: 'Manage bed status' },
      { label: 'Nursing Station', path: '/inpatient/nursing-station', icon: 'Clipboard', description: 'Manage nursing station' },
      { label: 'Admissions', path: '/inpatient/admission', icon: 'UserPlus', description: 'Manage admissions workflow' },
    ],
  },

  // ── 13. Emergency ─────────────────────────────────────────────────────────
  {
    slug: 'emergency',
    displayName: 'Emergency',
    role: 'ROLE_DOCTOR',
    themeColor: '#dc2626',
    dashboardRoute: '/emergency/queue',
    authConfig: {
      heroTitle: 'Emergency Response.',
      heroSubtitle: 'Manage ER triage and patient stabilization.',
      sideBadge: 'ER ACTIVE',
      sideQuoteTitle: 'Rapid triage & care.',
      sideQuoteText: 'Streamlined emergency queue management and rapid response protocols.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Emergency Queue', path: '/emergency/queue', icon: 'AlertTriangle', description: 'Manage ER queue' },
    ],
  },

  // ── 14. Surgery ─────────────────────────────────────────────────────────
  {
    slug: 'surgery',
    displayName: 'Surgery',
    role: 'ROLE_DOCTOR',
    themeColor: '#4f46e5',
    dashboardRoute: '/surgery/schedule',
    authConfig: {
      heroTitle: 'Surgical Management.',
      heroSubtitle: 'Schedule operating theaters and manage surgical workflows.',
      sideBadge: 'OT ACTIVE',
      sideQuoteTitle: 'Precision surgical care.',
      sideQuoteText: 'Centralized operating theater scheduling and surgical team coordination.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'OT Schedule', path: '/surgery/schedule', icon: 'Calendar', description: 'Manage OT schedule' },
    ],
  },

  // ── 15. Branch Admin ─────────────────────────────────────────────────────────
  {
    slug: 'branch-admin',
    displayName: 'Branch Admin',
    role: 'ROLE_BRANCH_ADMIN',
    themeColor: '#ca8a04',
    dashboardRoute: '/branch-admin/analytics',
    authConfig: {
      heroTitle: 'Branch Administration.',
      heroSubtitle: 'Manage branch facilities, local HR, and analytics.',
      sideBadge: 'ADMIN ACTIVE',
      sideQuoteTitle: 'Local facility oversight.',
      sideQuoteText: 'Comprehensive branch administration and local performance tracking.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Analytics', path: '/branch-admin/analytics', icon: 'BarChart', description: 'View branch analytics' },
      { label: 'Staff', path: '/branch-admin/staff', icon: 'Users', description: 'Manage local staff' },
      { label: 'Facilities', path: '/branch-admin/facilities', icon: 'Building', description: 'Manage branch facilities' },
    ],
  },

  // ── 16. Back Office ─────────────────────────────────────────────────────────
  {
    slug: 'backoffice',
    displayName: 'Back Office',
    role: 'ROLE_ADMIN',
    themeColor: '#475569',
    dashboardRoute: '/backoffice/support',
    authConfig: {
      heroTitle: 'Back Office Operations.',
      heroSubtitle: 'Manage support ticketing, ecommerce, and vendors.',
      sideBadge: 'OPS ACTIVE',
      sideQuoteTitle: 'Centralized operations.',
      sideQuoteText: 'Streamlined internal ticketing and core business administration.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Support Ticketing', path: '/backoffice/support', icon: 'LifeBuoy', description: 'Manage support tickets' },
      { label: 'Ecommerce', path: '/backoffice/ecommerce', icon: 'ShoppingCart', description: 'Manage ecommerce catalog' },
      { label: 'Vendors', path: '/backoffice/vendors', icon: 'Truck', description: 'Manage external vendors' },
    ],
  },

  // ── 17. Support ─────────────────────────────────────────────────────────
  {
    slug: 'support',
    displayName: 'Support',
    role: 'ROLE_SUPPORT',
    themeColor: '#059669',
    dashboardRoute: '/support/dashboard',
    authConfig: {
      heroTitle: 'Customer Support.',
      heroSubtitle: 'Manage patient and internal support interactions.',
      sideBadge: 'SUPPORT ACTIVE',
      sideQuoteTitle: 'Dedicated assistance.',
      sideQuoteText: 'Comprehensive support dashboard and agent ticketing interface.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/support/dashboard', icon: 'LayoutDashboard', description: 'View support metrics' },
      { label: 'Agent Tools', path: '/support/agent', icon: 'Headset', description: 'Agent interface' },
      { label: 'Ticket Desk', path: '/support/tickets', icon: 'Ticket', description: 'Manage active tickets' },
    ],
  },
  
  // ── 18. Admin ─────────────────────────────────────────────────────────
  {
    slug: 'admin',
    displayName: 'Administration',
    role: 'ROLE_SUPER_ADMIN',
    themeColor: '#1E3A8A',
    dashboardRoute: '/admin/dashboard',
    authConfig: {
      heroTitle: 'System Administration.',
      heroSubtitle: 'Master control panel for users, branches, and system settings.',
      sideBadge: 'SUPER_ADMIN ACTIVE',
      sideQuoteTitle: 'Global system oversight.',
      sideQuoteText: 'Manage all clinics, users, and global configurations.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Admin Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard', description: 'System overview' },
      { label: 'Branch Management', path: '/admin/branches', icon: 'Building', description: 'Manage clinic branches' },
      { label: 'User Management', path: '/admin/users', icon: 'Users', description: 'Manage system users' },
    ],
  },
  {
    slug: 'hr',
    displayName: 'Human Resources',
    role: 'ROLE_HR',
    themeColor: '#8B5CF6',
    dashboardRoute: '/hr/dashboard',
    authConfig: {
      heroTitle: 'HR Portal.',
      heroSubtitle: 'Manage personnel, payroll, and recruitment.',
      sideBadge: 'HR SECURE',
      sideQuoteTitle: 'Empowering your workforce.',
      sideQuoteText: 'Efficient management of staff operations.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/hr/dashboard', icon: 'LayoutDashboard', description: 'HR Overview' },
      { label: 'Employees', path: '/hr/employees', icon: 'Users', description: 'Staff Directory' },
      { label: 'Attendance', path: '/hr/attendance', icon: 'Clock', description: 'Time & Attendance' },
      { label: 'Leave', path: '/hr/leave', icon: 'Calendar', description: 'Leave Management' },
      { label: 'Payroll', path: '/hr/payroll', icon: 'DollarSign', description: 'Payroll Processing' },
      { label: 'Recruitment', path: '/hr/recruitment', icon: 'UserPlus', description: 'Hiring Pipeline' },
    ],
  },
  {
    slug: 'marketing',
    displayName: 'Marketing',
    role: 'ROLE_MARKETING',
    themeColor: '#F59E0B',
    dashboardRoute: '/marketing/dashboard',
    authConfig: {
      heroTitle: 'Marketing Portal.',
      heroSubtitle: 'Drive patient engagement and loyalty.',
      sideBadge: 'MARKETING ACTIVE',
      sideQuoteTitle: 'Growth and Outreach.',
      sideQuoteText: 'Tools to expand clinic visibility and care quality.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/marketing/dashboard', icon: 'LayoutDashboard', description: 'Marketing Overview' },
      { label: 'Campaigns', path: '/marketing/campaigns', icon: 'Megaphone', description: 'Manage Campaigns' },
      { label: 'Leads', path: '/marketing/leads', icon: 'Target', description: 'Lead Tracking' },
      { label: 'Loyalty', path: '/marketing/loyalty', icon: 'Award', description: 'Loyalty Programs' },
      { label: 'NPS', path: '/marketing/nps', icon: 'Smile', description: 'Patient Satisfaction' },
      { label: 'Consent', path: '/marketing/consent', icon: 'CheckSquare', description: 'Marketing Consent' },
    ],
  },
  {
    slug: 'finance',
    displayName: 'Finance',
    role: 'ROLE_FINANCE',
    themeColor: '#10B981',
    dashboardRoute: '/finance/dashboard',
    authConfig: {
      heroTitle: 'Finance Portal.',
      heroSubtitle: 'Manage clinic revenue, claims, and expenses.',
      sideBadge: 'FINANCE SECURE',
      sideQuoteTitle: 'Financial Health.',
      sideQuoteText: 'Secure tools for comprehensive accounting.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/finance/dashboard', icon: 'LayoutDashboard', description: 'Finance Overview' },
      { label: 'Invoices', path: '/finance/invoices', icon: 'FileText', description: 'Invoice Management' },
      { label: 'P&L', path: '/finance/pnl', icon: 'TrendingUp', description: 'Profit & Loss' },
      { label: 'Payments', path: '/finance/payments', icon: 'CreditCard', description: 'Payment Processing' },
      { label: 'Insurance Claims', path: '/finance/insurance-claims', icon: 'Shield', description: 'Claims Management' },
    ],
  },
  {
    slug: 'analytics',
    displayName: 'Analytics',
    role: 'ROLE_ADMIN',
    themeColor: '#3B82F6',
    dashboardRoute: '/analytics/dashboard',
    authConfig: {
      heroTitle: 'Analytics Portal.',
      heroSubtitle: 'Data-driven insights for clinic management.',
      sideBadge: 'ANALYTICS ACTIVE',
      sideQuoteTitle: 'Intelligence at a glance.',
      sideQuoteText: 'Visualize performance and trends clearly.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/analytics/dashboard', icon: 'LayoutDashboard', description: 'Analytics Overview' },
      { label: 'Financial', path: '/analytics/financial', icon: 'BarChart2', description: 'Financial Reports' },
      { label: 'Clinical', path: '/analytics/clinical', icon: 'Activity', description: 'Clinical Reports' },
      { label: 'IPD', path: '/analytics/ipd', icon: 'Bed', description: 'IPD Reports' },
      { label: 'Lab', path: '/analytics/lab', icon: 'FlaskConical', description: 'Lab Reports' },
      { label: 'OPD', path: '/analytics/opd', icon: 'Users', description: 'OPD Reports' },
    ],
  },
  {
    slug: 'pharmacist',
    displayName: 'Pharmacist',
    role: 'ROLE_PHARMACIST',
    themeColor: '#14B8A6',
    dashboardRoute: '/pharmacist/dashboard',
    authConfig: {
      heroTitle: 'Pharmacy Portal.',
      heroSubtitle: 'Manage prescriptions and inventory.',
      sideBadge: 'PHARMACY SECURE',
      sideQuoteTitle: 'Reliable dispensing.',
      sideQuoteText: 'Streamlined tools for pharmacy operations.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/pharmacist/dashboard', icon: 'LayoutDashboard', description: 'Pharmacy Overview' },
    ],
  },
  {
    slug: 'super-admin',
    displayName: 'Super Admin',
    role: 'ROLE_SUPER_ADMIN',
    themeColor: '#DC2626',
    dashboardRoute: '/super-admin/dashboard',
    authConfig: {
      heroTitle: 'Super Admin Console.',
      heroSubtitle: 'Absolute control over the healthcare system.',
      sideBadge: 'ROOT SECURE',
      sideQuoteTitle: 'Total System Authority.',
      sideQuoteText: 'Unrestricted access to all configuration layers.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/super-admin/dashboard', icon: 'LayoutDashboard', description: 'System Root' },
    ],
  },
  {
    slug: 'ambulance',
    displayName: 'Ambulance',
    role: 'ROLE_AMBULANCE',
    themeColor: '#EF4444',
    dashboardRoute: '/ambulance/dashboard',
    authConfig: {
      heroTitle: 'Ambulance Portal.',
      heroSubtitle: 'Fleet and dispatch management.',
      sideBadge: 'EMERGENCY SECURE',
      sideQuoteTitle: 'Rapid Response.',
      sideQuoteText: 'Coordinate emergency services efficiently.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/ambulance/dashboard', icon: 'LayoutDashboard', description: 'Dispatch Overview' },
    ],
  },
  {
    slug: 'vendor',
    displayName: 'Vendor',
    role: 'ROLE_VENDOR',
    themeColor: '#6366F1',
    dashboardRoute: '/vendor/dashboard',
    authConfig: {
      heroTitle: 'Vendor Portal.',
      heroSubtitle: 'Supply chain and purchase orders.',
      sideBadge: 'VENDOR SECURE',
      sideQuoteTitle: 'Streamlined Procurement.',
      sideQuoteText: 'Manage inventory fulfillment and catalogs.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/vendor/dashboard', icon: 'LayoutDashboard', description: 'Vendor Overview' },
    ],
  },
  {
    slug: 'insurance',
    displayName: 'Insurance Staff',
    role: 'ROLE_INSURANCE',
    themeColor: '#0EA5E9',
    dashboardRoute: '/insurance/dashboard',
    authConfig: {
      heroTitle: 'Insurance Portal.',
      heroSubtitle: 'Process claims and pre-authorizations.',
      sideBadge: 'INSURANCE SECURE',
      sideQuoteTitle: 'Efficient Claims.',
      sideQuoteText: 'Manage patient coverage and approvals.',
      allowRegister: false,
    },
    dashboardTiles: [
      { label: 'Dashboard', path: '/insurance/dashboard', icon: 'LayoutDashboard', description: 'Insurance Overview' },
    ],
  }
];

/** Look up a portal config by URL slug */
export const getPortalConfig = (slug) => {
  const config = PORTAL_CONFIGS.find((p) => p.slug === slug);
  if (config) return config;

  return {
    slug,
    displayName: 'Portal',
    themeColor: '#0F2A4A',
    dashboardRoute: '/unauthorized',
    dashboardTiles: [],
    authConfig: {
      heroTitle: 'Secure Portal Access.',
      heroSubtitle: 'Sign in to access your role-specific healthcare portal.',
      sideBadge: 'SYSTEM SECURE',
      sideQuoteTitle: 'Privacy at the heart of care.',
      sideQuoteText: 'Your health data is protected with enterprise security.',
      allowRegister: false,
    },
  };
};

/** Legacy object-keyed map for backward compatibility */
export const portals = Object.fromEntries(
  PORTAL_CONFIGS.map((p) => [
    p.slug,
    { title: `${p.displayName} Portal`, dashboard: p.dashboardRoute, color: p.themeColor },
  ])
);
