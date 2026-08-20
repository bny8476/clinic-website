import { 
  Calendar as CalendarIcon, Activity, FileText, Pill, Users,
  UploadCloud, Video, Plus, HeartPulse, UserPlus, CreditCard, UserCheck, Ticket, Shield
} from 'lucide-react';

export const WIDGETS = {
  PATIENT_QUEUE: 'PATIENT_QUEUE',
  NEXT_APPOINTMENT: 'NEXT_APPOINTMENT',
  CALENDAR_TIMELINE: 'CALENDAR_TIMELINE',
  NEW_APPOINTMENTS: 'NEW_APPOINTMENTS',
  RECENT_LAB_REPORTS: 'RECENT_LAB_REPORTS',
  RECENT_ACTIVITIES: 'RECENT_ACTIVITIES',
  AI_ASSISTANT: 'AI_ASSISTANT',
  QUICK_SEARCH: 'QUICK_SEARCH',
  // Nurse specific widgets
  NURSE_ASSIGNED_PATIENTS: 'NURSE_ASSIGNED_PATIENTS',
  VITAL_SIGNS_FORM: 'VITAL_SIGNS_FORM',
  NURSE_RECENT_ACTIVITY: 'NURSE_RECENT_ACTIVITY',
  // Placeholders for other roles
  REVENUE_SUMMARY: 'REVENUE_SUMMARY',
  INVENTORY_ALERTS: 'INVENTORY_ALERTS',
  STAFF_ATTENDANCE: 'STAFF_ATTENDANCE',
};

// Map backend role to dashboard layout config
export const dashboardConfig = {
  ROLE_DOCTOR: {
    quickActions: [
      { label: 'New Appointment', icon: CalendarIcon, color: 'text-[#5244F2]', bg: 'bg-[#5244F2]/10', actionPath: '?panel=new-appointment' },
      { label: 'Add Patient', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', actionPath: '/doctor/patients' },
      { label: 'New Prescription', icon: Pill, color: 'text-orange-500', bg: 'bg-orange-500/10', actionPath: '/doctor/prescription-templates' },
      { label: 'Lab Request', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', actionPath: '/doctor/patients' },
      { label: 'Upload Report', icon: UploadCloud, color: 'text-purple-500', bg: 'bg-purple-500/10', actionPath: '/doctor/patients' },
      { label: 'Start Consultation', icon: Video, color: 'text-emerald-500', bg: 'bg-emerald-500/10', actionPath: '?panel=queue' },
      { label: 'View Calendar', icon: CalendarIcon, color: 'text-[#5244F2]', bg: 'bg-[#5244F2]/10', actionPath: '?panel=calendar' }
    ],
    tabs: ['Dashboard', 'Appointments', 'Patients', 'Calendar', 'Prescriptions', 'Lab Reports', 'Follow-ups', 'Medical Certificate', 'Settings'],
    layout: {
      left: [WIDGETS.PATIENT_QUEUE, WIDGETS.NEXT_APPOINTMENT],
      center: [WIDGETS.CALENDAR_TIMELINE],
      right: [WIDGETS.NEW_APPOINTMENTS, WIDGETS.RECENT_LAB_REPORTS],
      bottom: {
        recentActivities: false,
        aiAssistant: false,
        quickSearch: false
      }
    }
  },
  ROLE_NURSE: {
    quickActions: [
      { label: 'Register Walk-in', icon: HeartPulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10', actionPath: '?panel=walkin' },
      { label: 'View Schedule', icon: CalendarIcon, color: 'text-[#5244F2]', bg: 'bg-[#5244F2]/10', actionPath: '?panel=schedule' },
      { label: 'Request Supplies', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10', actionPath: '?panel=supplies' },
    ],
    tabs: ['Dashboard', 'OP Queue', 'IP Wards', 'Shift Log', 'Inventory'],
    layout: {
      left: [WIDGETS.NURSE_ASSIGNED_PATIENTS],
      center: [WIDGETS.VITAL_SIGNS_FORM],
      right: [WIDGETS.NURSE_RECENT_ACTIVITY],
      bottom: {
        recentActivities: false,
        aiAssistant: false,
        quickSearch: false
      }
    }
  },
};

export const getDashboardConfig = (user) => {
  if (!user || !user.roles || user.roles.length === 0) return dashboardConfig.ROLE_DOCTOR; // fallback
  for (const role of user.roles) {
    if (dashboardConfig[role]) {
      return dashboardConfig[role];
    }
  }
  return dashboardConfig.ROLE_DOCTOR;
};

// Add Reception widgets to WIDGETS
WIDGETS.RECEPTION_HEADER = 'RECEPTION_HEADER';
WIDGETS.RECEPTION_KPI = 'RECEPTION_KPI';
WIDGETS.RECEPTION_WAITING_LIST = 'RECEPTION_WAITING_LIST';

// Add Reception to config
dashboardConfig.ROLE_RECEPTION = {
  quickActions: [
    { label: 'Register Patient', icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-500/10', actionPath: '/reception/register' },
    { label: 'Walk-In Check-In', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', actionPath: '/reception/walk-in' },
    { label: 'Queue Management', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', actionPath: '/reception/queue' },
    { label: 'Token Generation', icon: Ticket, color: 'text-orange-500', bg: 'bg-orange-500/10', actionPath: '/reception/tokens' },
    { label: 'Billing & Payments', icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/10', actionPath: '/reception/billing' },
    { label: 'Insurance Verify', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10', actionPath: '/reception/insurance' }
  ],
  tabs: ['Dashboard', 'Registrations', 'Queue', 'Billing'],
  layout: {
    // Reception uses a slightly different grid layout but still defined in config
    top: [WIDGETS.RECEPTION_HEADER],
    left: [WIDGETS.RECEPTION_KPI],
    center: [WIDGETS.RECEPTION_WAITING_LIST],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Pharmacy widgets to WIDGETS
WIDGETS.PHARMACY_KPI = 'PHARMACY_KPI';
WIDGETS.PHARMACY_SALES_TREND = 'PHARMACY_SALES_TREND';
WIDGETS.PHARMACY_REVENUE_SUMMARY = 'PHARMACY_REVENUE_SUMMARY';
WIDGETS.PHARMACY_RECENT_BILLS = 'PHARMACY_RECENT_BILLS';
WIDGETS.PHARMACY_LOW_STOCK = 'PHARMACY_LOW_STOCK';

// Add Pharmacy to config
dashboardConfig.ROLE_PHARMACIST = {
  quickActions: [
    { label: 'New Sale', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-500/10', actionPath: '/pharmacy/pos' },
    { label: 'Add Stock', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', actionPath: '/pharmacy/inventory/new' }
  ],
  tabs: ['Overview', 'Sales', 'Inventory', 'Reports'],
  layout: {
    top: [WIDGETS.PHARMACY_KPI],
    left: [WIDGETS.PHARMACY_SALES_TREND],
    right: [WIDGETS.PHARMACY_REVENUE_SUMMARY],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false,
      pharmacyRecentBills: [WIDGETS.PHARMACY_RECENT_BILLS],
      pharmacyLowStock: [WIDGETS.PHARMACY_LOW_STOCK]
    }
  }
};

// Add Patient widgets to WIDGETS
WIDGETS.PATIENT_HEADER = 'PATIENT_HEADER';
WIDGETS.PATIENT_KPI = 'PATIENT_KPI';
WIDGETS.PATIENT_PROFILE = 'PATIENT_PROFILE';
WIDGETS.PATIENT_APPOINTMENTS = 'PATIENT_APPOINTMENTS';

// Add Patient to config
dashboardConfig.ROLE_PATIENT = {
  quickActions: [
    { label: 'Book Appointment', icon: UserPlus, color: 'text-[#5244F2]', bg: 'bg-[#5244F2]/10', actionPath: '/doctors' },
    { label: 'My Prescriptions', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-500/10', actionPath: '/patient/prescriptions' },
    { label: 'Pay Bills', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10', actionPath: '/patient/billing' },
    { label: 'Medical Records', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', actionPath: '/patient/records' }
  ],
  tabs: ['Dashboard', 'Appointments', 'Prescriptions', 'Billing', 'Records'],
  layout: {
    top: [WIDGETS.PATIENT_HEADER],
    left: [WIDGETS.PATIENT_PROFILE],
    center: [WIDGETS.PATIENT_APPOINTMENTS],
    right: [WIDGETS.PATIENT_KPI],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Admin widgets to WIDGETS
WIDGETS.ADMIN_HEADER = 'ADMIN_HEADER';
WIDGETS.ADMIN_KPI_GRID = 'ADMIN_KPI_GRID';
WIDGETS.ADMIN_CHART_AND_ALERTS = 'ADMIN_CHART_AND_ALERTS';
WIDGETS.ADMIN_REVENUE_STRIP = 'ADMIN_REVENUE_STRIP';

// Add Admin to config
// Admin roles might be dynamically chosen based on sub-role, but we can set a fallback here.
dashboardConfig.ROLE_ADMIN = {
  quickActions: [], // Dynamically populated in AdminDashboard
  tabs: ['Overview', 'Reports', 'Settings'],
  layout: {
    top: [WIDGETS.ADMIN_HEADER],
    left: [WIDGETS.ADMIN_KPI_GRID],
    center: [WIDGETS.ADMIN_CHART_AND_ALERTS],
    right: [WIDGETS.ADMIN_REVENUE_STRIP],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Insurance widgets to WIDGETS
WIDGETS.INSURANCE_HEADER = 'INSURANCE_HEADER';
WIDGETS.INSURANCE_KPI = 'INSURANCE_KPI';
WIDGETS.INSURANCE_ADJUDICATION = 'INSURANCE_ADJUDICATION';

// Add Insurance to config
dashboardConfig.ROLE_INSURANCE = {
  quickActions: [],
  tabs: ['claims', 'pre-auths'],
  layout: {
    top: [WIDGETS.INSURANCE_HEADER],
    left: [WIDGETS.INSURANCE_KPI],
    center: [WIDGETS.INSURANCE_ADJUDICATION],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Lab widgets to WIDGETS
WIDGETS.LAB_HEADER = 'LAB_HEADER';
WIDGETS.LAB_KPI = 'LAB_KPI';
WIDGETS.LAB_REQUESTS = 'LAB_REQUESTS';

// Add Radiologist widgets to WIDGETS
WIDGETS.RAD_HEADER = 'RAD_HEADER';
WIDGETS.RAD_KPI = 'RAD_KPI';
WIDGETS.RAD_WORKSTATION = 'RAD_WORKSTATION';

// Add Finance widgets to WIDGETS
WIDGETS.FINANCE_HEADER = 'FINANCE_HEADER';
WIDGETS.FINANCE_KPI = 'FINANCE_KPI';
WIDGETS.FINANCE_TABLES = 'FINANCE_TABLES';

// Add Lab to config
dashboardConfig.ROLE_LAB_TECH = {
  quickActions: [],
  tabs: ['REQUESTED', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULT_ENTERED', 'VERIFIED', 'RELEASED'],
  layout: {
    top: [WIDGETS.LAB_HEADER],
    left: [WIDGETS.LAB_KPI],
    center: [WIDGETS.LAB_REQUESTS],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Radiologist to config
dashboardConfig.ROLE_RADIOLOGIST = {
  quickActions: [],
  tabs: ['ALL', 'REQUESTED', 'SCHEDULED', 'COMPLETED'],
  layout: {
    top: [WIDGETS.RAD_HEADER],
    left: [WIDGETS.RAD_KPI],
    center: [WIDGETS.RAD_WORKSTATION],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Finance to config
dashboardConfig.ROLE_FINANCE = {
  quickActions: [{ label: 'Record Expense', icon: Plus, color: 'text-rose-600', bg: 'bg-rose-50' }],
  tabs: ['payments', 'expenses', 'claims'],
  layout: {
    top: [WIDGETS.FINANCE_HEADER],
    left: [WIDGETS.FINANCE_KPI],
    center: [WIDGETS.FINANCE_TABLES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Accountant widgets to WIDGETS
WIDGETS.ACCOUNTANT_HEADER = 'ACCOUNTANT_HEADER';
WIDGETS.ACCOUNTANT_KPI = 'ACCOUNTANT_KPI';
WIDGETS.ACCOUNTANT_INVOICES = 'ACCOUNTANT_INVOICES';

// Add Accountant to config
dashboardConfig.ROLE_ACCOUNTANT = {
  quickActions: [],
  tabs: ['ALL', 'PENDING', 'PAID', 'OVERDUE'],
  layout: {
    top: [WIDGETS.ACCOUNTANT_HEADER],
    left: [WIDGETS.ACCOUNTANT_KPI],
    center: [WIDGETS.ACCOUNTANT_INVOICES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add HR widgets to WIDGETS
WIDGETS.HR_HEADER = 'HR_HEADER';
WIDGETS.HR_KPI = 'HR_KPI';
WIDGETS.HR_TABLES = 'HR_TABLES';

// Add Inventory widgets to WIDGETS
WIDGETS.INVENTORY_HEADER = 'INVENTORY_HEADER';
WIDGETS.INVENTORY_KPI = 'INVENTORY_KPI';
WIDGETS.INVENTORY_TABLES = 'INVENTORY_TABLES';

// Add HR to config
dashboardConfig.ROLE_HR = {
  quickActions: [],
  tabs: ['employees', 'attendance', 'leaves'],
  layout: {
    top: [WIDGETS.HR_HEADER],
    left: [WIDGETS.HR_KPI],
    center: [WIDGETS.HR_TABLES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Inventory to config
dashboardConfig.ROLE_INVENTORY = {
  quickActions: [],
  tabs: ['stock', 'warehouses', 'purchase-orders'],
  layout: {
    top: [WIDGETS.INVENTORY_HEADER],
    left: [WIDGETS.INVENTORY_KPI],
    center: [WIDGETS.INVENTORY_TABLES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Ambulance widgets to WIDGETS
WIDGETS.AMBULANCE_HEADER = 'AMBULANCE_HEADER';
WIDGETS.AMBULANCE_KPI = 'AMBULANCE_KPI';
WIDGETS.AMBULANCE_TABLES = 'AMBULANCE_TABLES';

// Add Support widgets to WIDGETS
WIDGETS.SUPPORT_HEADER = 'SUPPORT_HEADER';
WIDGETS.SUPPORT_KPI = 'SUPPORT_KPI';
WIDGETS.SUPPORT_TICKETS = 'SUPPORT_TICKETS';

// Add Ambulance to config
dashboardConfig.ROLE_AMBULANCE = {
  quickActions: [
    { label: 'New Emergency', icon: 'AlertTriangle', action: 'showNewRequest', color: 'text-rose-600', bg: 'bg-rose-50' }
  ],
  tabs: ['requests', 'fleet'],
  layout: {
    top: [WIDGETS.AMBULANCE_HEADER],
    left: [WIDGETS.AMBULANCE_KPI],
    center: [WIDGETS.AMBULANCE_TABLES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Support to config
dashboardConfig.ROLE_SUPPORT = {
  quickActions: [],
  tabs: ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'],
  layout: {
    top: [WIDGETS.SUPPORT_HEADER],
    left: [WIDGETS.SUPPORT_KPI],
    center: [WIDGETS.SUPPORT_TICKETS],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Vendor widgets to WIDGETS
WIDGETS.VENDOR_HEADER = 'VENDOR_HEADER';
WIDGETS.VENDOR_KPI = 'VENDOR_KPI';
WIDGETS.VENDOR_TABLES = 'VENDOR_TABLES';

// Add Marketing widgets to WIDGETS
WIDGETS.MARKETING_HEADER = 'MARKETING_HEADER';
WIDGETS.MARKETING_KPI = 'MARKETING_KPI';
WIDGETS.MARKETING_TABLES = 'MARKETING_TABLES';

// Add Vendor to config
dashboardConfig.ROLE_VENDOR = {
  quickActions: [],
  tabs: ['orders', 'deliveries'],
  layout: {
    top: [WIDGETS.VENDOR_HEADER],
    left: [WIDGETS.VENDOR_KPI],
    center: [WIDGETS.VENDOR_TABLES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};

// Add Marketing to config
dashboardConfig.ROLE_MARKETING = {
  quickActions: [],
  tabs: ['campaigns', 'coupons', 'referrals'],
  layout: {
    top: [WIDGETS.MARKETING_HEADER],
    left: [WIDGETS.MARKETING_KPI],
    center: [WIDGETS.MARKETING_TABLES],
    right: [],
    bottom: {
      recentActivities: false,
      aiAssistant: false,
      quickSearch: false
    }
  }
};
