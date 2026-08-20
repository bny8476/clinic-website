// Role definitions and configurations

export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SENIOR_MEDICAL_STAFF: 'SENIOR_MEDICAL_STAFF',
  MEDICAL_STAFF: 'MEDICAL_STAFF',
  BILLING_STAFF: 'BILLING_STAFF',
  PHARMACY_STAFF: 'PHARMACY_STAFF',
  RECEPTIONIST: 'RECEPTIONIST',
  AUDIT_COMPLIANCE: 'AUDIT_COMPLIANCE',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  STOREKEEPER: 'STOREKEEPER'
};

export const ROLE_LABELS = {
  [ROLES.SYSTEM_ADMIN]: 'System Admin',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.SENIOR_MEDICAL_STAFF]: 'Senior Medical Staff',
  [ROLES.MEDICAL_STAFF]: 'Medical Staff',
  [ROLES.BILLING_STAFF]: 'Billing Staff',
  [ROLES.PHARMACY_STAFF]: 'Pharmacy Staff',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.AUDIT_COMPLIANCE]: 'Audit & Compliance',
  [ROLES.LAB_TECHNICIAN]: 'Lab Technician',
  [ROLES.STOREKEEPER]: 'Storekeeper'
};

export const ROLE_COLORS = {
  [ROLES.SYSTEM_ADMIN]: 'bg-slate-800 text-slate-100 border-slate-700', // Dark Navy
  [ROLES.SUPERVISOR]: 'bg-purple-100 text-purple-700 border-purple-200', // Purple
  [ROLES.SENIOR_MEDICAL_STAFF]: 'bg-teal-100 text-teal-700 border-teal-200', // Teal
  [ROLES.MEDICAL_STAFF]: 'bg-emerald-100 text-emerald-700 border-emerald-200', // Green
  [ROLES.BILLING_STAFF]: 'bg-amber-100 text-amber-700 border-amber-200', // Amber
  [ROLES.PHARMACY_STAFF]: 'bg-blue-100 text-blue-700 border-blue-200', // Blue
  [ROLES.RECEPTIONIST]: 'bg-rose-100 text-rose-700 border-rose-200', // Pink/Rose
  [ROLES.AUDIT_COMPLIANCE]: 'bg-orange-100 text-orange-700 border-orange-200', // Orange
  [ROLES.LAB_TECHNICIAN]: 'bg-cyan-100 text-cyan-700 border-cyan-200', // Cyan
  [ROLES.STOREKEEPER]: 'bg-stone-200 text-stone-700 border-stone-300' // Brown/Warm Gray
};

export const DASHBOARD_ROUTES = {
  [ROLES.SYSTEM_ADMIN]: '/pharmacy/admin-dashboard',
  [ROLES.SUPERVISOR]: '/pharmacy/supervisor-dashboard',
  [ROLES.SENIOR_MEDICAL_STAFF]: '/pharmacy/medical-dashboard',
  [ROLES.MEDICAL_STAFF]: '/pharmacy/medical-dashboard',
  [ROLES.BILLING_STAFF]: '/pharmacy/billing-dashboard',
  [ROLES.PHARMACY_STAFF]: '/pharmacy/dashboard',
  [ROLES.RECEPTIONIST]: '/pharmacy/role-dashboard',
  [ROLES.AUDIT_COMPLIANCE]: '/pharmacy/role-dashboard',
  [ROLES.LAB_TECHNICIAN]: '/pharmacy/role-dashboard',
  [ROLES.STOREKEEPER]: '/pharmacy/storekeeper-dashboard',
  // Legacy keys (safety net)
  'ADMIN':               '/pharmacy/admin-dashboard',
  'MEDICINE_USER':       '/pharmacy/dashboard',
  'BILLING_USER':        '/pharmacy/billing-dashboard',
};

export const MODULE_PERMISSIONS = {
  CLINICAL: [
    { id: 'PRESCRIPTIONS', label: 'Manage Prescriptions' },
    { id: 'CLINICAL_RECORDS', label: 'View Clinical Records' },
    { id: 'BASIC_PRESCRIPTIONS', label: 'Basic Prescriptions' }
  ],
  BILLING: [
    { id: 'BILLING', label: 'Process Billing' },
    { id: 'INVOICES', label: 'Manage Invoices' },
    { id: 'ADVANCES', label: 'Process Advances' },
    { id: 'CLEARANCE', label: 'Clearance Processing' }
  ],
  INVENTORY: [
    { id: 'INVENTORY', label: 'Manage Inventory' },
    { id: 'INDENT', label: 'Process Indents' },
    { id: 'RETURNS', label: 'Process Returns' },
    { id: 'STOCK_MANAGEMENT', label: 'Stock Management' },
    { id: 'PURCHASE_ORDERS', label: 'Purchase Orders' }
  ],
  REPORTS: [
    { id: 'VIEW_REPORTS', label: 'View Reports' },
    { id: 'VIEW_LOGS', label: 'View Logs' },
    { id: 'REPORTS', label: 'Manage Reports' }
  ],
  ADMINISTRATION: [
    { id: 'ALL', label: 'Full System Access' },
    { id: 'APPROVALS', label: 'Manage Approvals' },
    { id: 'PATIENT_REGISTRATION', label: 'Patient Registration' },
    { id: 'UHID', label: 'UHID Creation' }
  ]
};

export const getRoleColor = (roleName) => {
  if (!roleName) return 'bg-gray-100 text-gray-700 border-gray-200';
  const normalized = roleName.replace(/ /g, '_').toUpperCase();
  return ROLE_COLORS[normalized] || ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const getBaseRoleForUI = (role) => {
  if (!role) return ROLES.PHARMACY_STAFF;
  if (Object.values(ROLES).includes(role)) return role;
  
  const upper = role.toUpperCase();
  if (upper.includes('ADMIN')) return ROLES.SYSTEM_ADMIN;
  if (upper.includes('PHARMAC')) return ROLES.PHARMACY_STAFF;
  if (upper.includes('BILL') || upper.includes('ACCOUNT') || upper.includes('CASH')) return ROLES.BILLING_STAFF;
  if (upper.includes('STORE') || upper.includes('INVENT') || upper.includes('PURCHASE')) return ROLES.STOREKEEPER;
  if (upper.includes('LAB') || upper.includes('PATHOLOG')) return ROLES.LAB_TECHNICIAN;
  if (upper.includes('SUPERVISOR') || upper.includes('MANAGER')) return ROLES.SUPERVISOR;
  if (upper.includes('RECEPTION') || upper.includes('FRONT')) return ROLES.RECEPTIONIST;
  if (upper.includes('AUDIT') || upper.includes('COMPLIANCE')) return ROLES.AUDIT_COMPLIANCE;
  if (upper.includes('SENIOR') && upper.includes('MEDIC')) return ROLES.SENIOR_MEDICAL_STAFF;
  if (upper.includes('MEDIC') || upper.includes('DOCTOR') || upper.includes('PHYSICIAN') || upper.includes('NURS')) return ROLES.MEDICAL_STAFF;
  
  return ROLES.PHARMACY_STAFF;
};



import { 
  Building2, ShoppingCart, RotateCcw, LayoutDashboard, ClipboardList,
  Banknote, Receipt, FileCheck, RefreshCw,
  BarChart3, Pill, Truck, Users, AlertTriangle, Thermometer,
  ShieldCheck, ScanBarcode, Shield, Calendar,
  TrendingUp, FilePlus, ShoppingBag, BarChart2, UserCog, Zap, Package,
  UserCircle, KeyRound, UserRound
} from 'lucide-react';

export const NAV_BY_ROLE = {
  SYSTEM_ADMIN: [
    { label: 'Admin Dashboard', path: '/pharmacy/admin-dashboard', icon: LayoutDashboard, description: 'View Admin Dashboard' },
    { label: 'Billing Dashboard', path: '/pharmacy/billing-dashboard', icon: LayoutDashboard, description: 'View Billing Dashboard' },
    { label: 'Dashboard', path: '/pharmacy/dashboard', icon: LayoutDashboard, description: 'View Dashboard' },
    { label: 'Medicine Master', path: '/pharmacy/medicine-master', icon: Pill, description: 'Manage medicine master' },
    { label: 'Medicine Stock', path: '/pharmacy/medicine-stock', icon: Package, description: 'View Medicine Stock' },
    { label: 'Pharmacy Sales', path: '/pharmacy/pharmacy-sales', icon: ShoppingCart, description: 'View Pharmacy Sales' },
    { label: 'Direct Pharmacy Sales', path: '/pharmacy/direct-pharmacy-sales', icon: ShoppingCart, description: 'View Direct Pharmacy Sales' },
    { label: 'Medicine Returns', path: '/pharmacy/medicine-returns', icon: RotateCcw, description: 'View Medicine Returns' },
    { label: 'Direct Medicine Returns', path: '/pharmacy/direct-medicine-returns', icon: RotateCcw, description: 'View Direct Medicine Returns' },
    { label: 'Medicine Credit Bills', path: '/pharmacy/medicine-credit-bills', icon: Receipt, description: 'View Medicine Credit Bills' },
    { label: 'Return Worklists', path: '/pharmacy/return-worklists', icon: ClipboardList, description: 'Manage return worklists' },
    { label: 'Dispense Worklists', path: '/pharmacy/dispense-worklists', icon: ClipboardList, description: 'View Dispense Worklists' },
    { label: 'Pending Prescriptions', path: '/pharmacy/pending-prescriptions', icon: ClipboardList, description: 'View Pending Prescriptions' },
    { label: 'Pending Indent Pres.', path: '/pharmacy/pending-indent-prescriptions', icon: FilePlus, description: 'View Pending Indent Prescriptions' },
    { label: 'Pending Pharmacy Rep.', path: '/pharmacy/pending-pharmacy-replacement', icon: RefreshCw, description: 'View Pending Pharmacy Replacement' },
    { label: 'Pending Replacement Ret.', path: '/pharmacy/pending-replacement-returns', icon: RefreshCw, description: 'View Pending Replacement Returns' },
    { label: 'Consolidated Bills', path: '/pharmacy/consolidated-bills', icon: Receipt, description: 'Manage consolidated bills' },
    { label: 'Purchase Orders', path: '/pharmacy/purchase-orders', icon: ShoppingBag, description: 'Manage purchase orders' },
    { label: 'GRN Entry', path: '/pharmacy/grnentry', icon: Truck, description: 'View Grnentry' },
    { label: 'Invoice Matching', path: '/pharmacy/invoice-matching', icon: FileCheck, description: 'View Invoice Matching' },
    { label: 'Suppliers', path: '/pharmacy/suppliers', icon: Building2, description: 'Manage suppliers' },
    { label: 'Supplier Returns', path: '/pharmacy/supplier-returns', icon: RotateCcw, description: 'View Supplier Returns' },
    { label: 'Doctors', path: '/pharmacy/doctors', icon: UserRound, description: 'Manage doctors' },
    { label: 'Patients', path: '/pharmacy/patients', icon: Users, description: 'Manage patients' },
    { label: 'Low Stock Alerts', path: '/pharmacy/low-stock-alerts', icon: AlertTriangle, description: 'Manage low stock alerts' },
    { label: 'Expiry Tracker', path: '/pharmacy/expiry-tracker', icon: Calendar, description: 'Manage expiry tracker' },
    { label: 'Drug Interactions', path: '/pharmacy/drug-interactions', icon: Zap, description: 'Manage drug interactions' },
    { label: 'Temperature Logs', path: '/pharmacy/temperature-logs', icon: Thermometer, description: 'Manage temperature logs' },
    { label: 'Narcotics Register', path: '/pharmacy/narcotics', icon: Shield, description: 'Manage narcotics register' },
    { label: 'Barcode Scanner', path: '/pharmacy/barcode-scanner', icon: ScanBarcode, description: 'Manage barcode scanner' },
    { label: 'Insurance Claims', path: '/pharmacy/insurance-claims', icon: FileCheck, description: 'Manage insurance claims' },
    { label: 'Pharmacy Advances', path: '/pharmacy/pharmacy-advances', icon: Banknote, description: 'View Pharmacy Advances' },
    { label: 'Pharmacy Clearance', path: '/pharmacy/pharmacy-clearance', icon: FileCheck, description: 'View Pharmacy Clearance' },
    { label: 'Product Performance', path: '/pharmacy/product-sales-performance', icon: TrendingUp, description: 'View Product Sales Performance' },
    { label: 'Analytics Dashboard', path: '/pharmacy/analytics/analytics-dashboard', icon: TrendingUp, description: 'View Analytics Dashboard' },
    { label: 'ABC Analysis', path: '/pharmacy/analytics/abcanalysis', icon: BarChart3, description: 'View Analytics Abcanalysis' },
    { label: 'Month Over Month', path: '/pharmacy/analytics/month-over-month', icon: BarChart3, description: 'View Analytics Month Over Month' },
    { label: 'Supplier Analytics', path: '/pharmacy/analytics/supplier-analytics', icon: BarChart3, description: 'View Analytics Supplier Analytics' },
    { label: 'Reports', path: '/pharmacy/reports', icon: BarChart2, description: 'Manage reports' },
    { label: 'User Management', path: '/pharmacy/user-management', icon: UserCog, description: 'View User Management' },
    { label: 'Role Management', path: '/pharmacy/role-management-panel', icon: ShieldCheck, description: 'View Role Management Panel' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'View Profile Settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' }
  ],
  PHARMACY_STAFF: [
    { label: 'Pharmacy Dashboard', path: '/pharmacy/dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Pharmacy Sales', path: '/pharmacy/pharmacy-sales', icon: ShoppingCart, description: 'Manage pharmacy sales' },
    { label: 'Medicine Returns', path: '/pharmacy/medicine-returns', icon: RotateCcw, description: 'Manage medicine returns' },
    { label: 'Medicine Master', path: '/pharmacy/medicine-master', icon: Pill, description: 'Manage medicine master' },
    { label: 'Pending Prescriptions', path: '/pharmacy/pending-prescriptions', icon: ClipboardList, description: 'View Pending Prescriptions' },
    { label: 'Barcode Scanner', path: '/pharmacy/barcode-scanner', icon: ScanBarcode, description: 'Manage barcode scanner' },
    { label: 'Low Stock Alerts', path: '/pharmacy/low-stock-alerts', icon: AlertTriangle, description: 'Manage low stock alerts' },
    { label: 'Expiry Tracker', path: '/pharmacy/expiry-tracker', icon: Calendar, description: 'Manage expiry tracker' },
    { label: 'Drug Interactions', path: '/pharmacy/drug-interactions', icon: Zap, description: 'Manage drug interactions' },
    { label: 'Temperature Logs', path: '/pharmacy/temperature-logs', icon: Thermometer, description: 'Manage temperature logs' },
    { label: 'Narcotics Register', path: '/pharmacy/narcotics', icon: Shield, description: 'Manage narcotics register' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  BILLING_STAFF: [
    { label: 'Billing Dashboard', path: '/pharmacy/billing-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Pharmacy Sales', path: '/pharmacy/pharmacy-sales', icon: ShoppingCart, description: 'Manage pharmacy sales' },
    { label: 'Medicine Returns', path: '/pharmacy/medicine-returns', icon: RotateCcw, description: 'Manage medicine returns' },
    { label: 'Consolidated Bills', path: '/pharmacy/consolidated-bills', icon: Receipt, description: 'Manage consolidated bills' },
    { label: 'Patients', path: '/pharmacy/patients', icon: Users, description: 'Manage patients' },
    { label: 'Insurance Claims', path: '/pharmacy/insurance-claims', icon: FileCheck, description: 'Manage insurance claims' },
    { label: 'Pharmacy Advances', path: '/pharmacy/pharmacy-advances', icon: Banknote, description: 'Manage pharmacy advances' },
    { label: 'Pharmacy Clearance', path: '/pharmacy/pharmacy-clearance', icon: FileCheck, description: 'Manage pharmacy clearance' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  STOREKEEPER: [
    { label: 'Store Dashboard', path: '/pharmacy/storekeeper-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Medicine Stock', path: '/pharmacy/medicine-stock', icon: Package, description: 'Manage stock management' },
    { label: 'Purchase Orders', path: '/pharmacy/purchase-orders', icon: ShoppingBag, description: 'Manage purchase orders' },
    { label: 'GRN Entry', path: '/pharmacy/grnentry', icon: Truck, description: 'Manage grn entry' },
    { label: 'Suppliers', path: '/pharmacy/suppliers', icon: Building2, description: 'Manage suppliers' },
    { label: 'Doctors', path: '/pharmacy/doctors', icon: UserRound, description: 'Manage doctors' },
    { label: 'Low Stock Alerts', path: '/pharmacy/low-stock-alerts', icon: AlertTriangle, description: 'Manage low stock alerts' },
    { label: 'Expiry Tracker', path: '/pharmacy/expiry-tracker', icon: Calendar, description: 'Manage expiry tracker' },
    { label: 'Temperature Logs', path: '/pharmacy/temperature-logs', icon: Thermometer, description: 'Manage temperature logs' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  SUPERVISOR: [
    { label: 'Supervisor Dashboard', path: '/pharmacy/supervisor-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Return Worklists', path: '/pharmacy/return-worklists', icon: ClipboardList, description: 'Manage return worklists' },
    { label: 'Analytics Dashboard', path: '/pharmacy/analytics/analytics-dashboard', icon: TrendingUp, description: 'Manage analytics' },
    { label: 'Reports', path: '/pharmacy/reports', icon: BarChart2, description: 'Manage reports' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  RECEPTIONIST: [
    { label: 'Reception Dashboard', path: '/pharmacy/role-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Patients', path: '/pharmacy/patients', icon: Users, description: 'Manage patients' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  MEDICAL_STAFF: [
    { label: 'Medical Dashboard', path: '/pharmacy/medical-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Drug Interactions', path: '/pharmacy/drug-interactions', icon: Zap, description: 'Manage drug interactions' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  SENIOR_MEDICAL_STAFF: [
    { label: 'Senior Medical Dashboard', path: '/pharmacy/medical-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Drug Interactions', path: '/pharmacy/drug-interactions', icon: Zap, description: 'Manage drug interactions' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  AUDIT_COMPLIANCE: [
    { label: 'Audit Dashboard', path: '/pharmacy/role-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Reports', path: '/pharmacy/reports', icon: BarChart2, description: 'Manage reports' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ],
  LAB_TECHNICIAN: [
    { label: 'Lab Dashboard', path: '/pharmacy/role-dashboard', icon: LayoutDashboard, description: 'View pharmacy metrics' },
    { label: 'Medicine Master', path: '/pharmacy/medicine-master', icon: Pill, description: 'Manage medicine master' },
    { label: 'Drug Interactions', path: '/pharmacy/drug-interactions', icon: Zap, description: 'Manage drug interactions' },
    { label: 'Profile Settings', path: '/pharmacy/profile-settings', icon: UserCircle, description: 'Manage profile settings' },
    { label: 'Reset Password', path: '/pharmacy/reset-password', icon: KeyRound, description: 'Manage reset password' },
  ]
};
