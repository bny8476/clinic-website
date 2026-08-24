#!/usr/bin/env node
/**
 * Auto-fix missing imports across all frontend JSX files. (v2)
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src');

// All lucide icons that might be missing
const LUCIDE_ICONS_SET = new Set([
  'Activity','AlertCircle','AlertTriangle','AlignLeft','Ambulance','AmbulanceIcon','Archive','ArrowDown','ArrowDownToLine','ArrowLeft','ArrowLeftRight',
  'ArrowRight','ArrowRightLeft','ArrowUp','ArrowUpRight','ArrowDownRight','Banknote','BarChart2','BarChart3','BedDouble','Bell',
  'Bot','Box','Brain','Briefcase','Building','Building2','Calendar','CalendarDays','CalendarIcon','CalendarOff','CalendarX',
  'Camera','Check','CheckCheck','CheckCircle','CheckCircle2','CheckSquare','ChevronDown','ChevronLeft','ChevronRight','ChevronUp',
  'Circle','ClipboardCheck','ClipboardList','ClipboardPlus','Clock','CloudUpload','Contrast',
  'CreditCard','Download','Droplet','Edit','Edit2','Edit3','Eye','EyeOff',
  'File','FileCheck','FileCode','FileIcon','FileImage','FilePlus','FileOutput','FileSpreadsheet','FileText','FileType','FileUpload',
  'Filter','FlaskConical','FolderOpen','Headphones','HeadphonesIcon','Heart','HeartPulse','HelpCircle','Home','Hourglass','IdCard','Image','ImageIcon','IndianRupee','Info','Inbox',
  'KeyRound','Layers','LayoutGrid','LifeBuoy','List','ListTodo','Loader','Loader2','Lock','LogOut','Mail','MailOpen','Map','MapPin','Maximize','Menu',
  'MessageCircle','MessageSquare','Mic','MicOff','Minus','Monitor','MonitorUp','Moon','MoreHorizontal','MoreVertical','MousePointerClick',
  'Navigation','Package','PackageCheck','Pause','Pen','PenTool','Phone','PhoneOff','Pill','Plane','Play','PlayCircle','Plus','PlusCircle','PlusSquare','Power',
  'Printer','QrCode','Radio','Receipt','RefreshCcw','RefreshCw','Refrigerator','RotateCcw','RotateCw','Ruler','Save','Scan',
  'ScrollText','Search','Send','Settings','Settings2','Shield','ShieldAlert','ShieldCheck','ShoppingBag',
  'ShoppingBasket','ShoppingCart','Sliders','Smartphone','Snowflake','Sparkles','Square','Star','Stethoscope','Sun','Syringe','Tag','Target',
  'Thermometer','Ticket','ToggleLeft','ToggleRight','Trash','Trash2','TrendingDown','TrendingUp','Truck',
  'Unlock','Upload','UploadCloud','User','UserCheck','UserIcon','UserPlus','UserRound','Users','Video','VideoOff',
  'Wallet','Wind','Wrench','X','XCircle','Zap','ZoomIn','Barcode','Banknote','Minus','Building',
]);

// Custom component -> import path (relative to SRC)
const COMPONENT_MAP = {
  'RoleRoute': `import RoleRoute from '##/components/auth/RoleRoute';`,
  'RoleGuard': `import RoleGuard from '##/components/pharmacy/auth/RoleGuard';`,
  'ProtectedRoute': `import ProtectedRoute from '##/components/pharmacy/auth/ProtectedRoute';`,
  'DashboardLayout': `import DashboardLayout from '##/layouts/DashboardLayout';`,
  'DashboardShell': `import DashboardShell from '##/components/dashboard/shared/DashboardShell';`,
  'DashboardGrid': `import DashboardGrid from '##/components/dashboard/DashboardGrid';`,
  'ConfigDrivenDashboard': `import ConfigDrivenDashboard from '##/components/dashboard/ConfigDrivenDashboard';`,
  'MainLayout': `import MainLayout from '##/components/pharmacy/layout/MainLayout';`,
  'ErrorBanner': `import ErrorBanner from '##/components/pharmacy/ui/ErrorBanner';`,
  'ModuleFilterBar': `import ModuleFilterBar from '##/components/pharmacy/ui/ModuleFilterBar';`,
  'TableSkeleton': `import TableSkeleton from '##/components/pharmacy/ui/TableSkeleton';`,
  'FormInput': `import FormInput from '##/components/pharmacy/ui/FormInput';`,
  'Input': `import Input from '##/components/ui/Input';`,
  'KPICard': `import KPICard from '##/components/ui/KPICard';`,
  'PageLoadingSkeleton': `import PageLoadingSkeleton from '##/components/ui/PageLoadingSkeleton';`,
  'ChartContainer': `import ChartContainer from '##/components/analytics/ChartContainer';`,
  'AnalyticsFilterBar': `import AnalyticsFilterBar from '##/components/analytics/AnalyticsFilterBar';`,
  'ExportMenu': `import ExportMenu from '##/components/analytics/ExportMenu';`,
  'PharmacyInvoice': `import PharmacyInvoice from '##/components/pharmacy/pharmacy/PharmacyInvoice';`,
  'PatientProfileCard': `import PatientProfileCard from '##/components/PatientProfileCard';`,
  'HistorySection': `import HistorySection from '##/pages/doctor/emr/HistorySection';`,
  'CdsAlertBanner': `import CdsAlertBanner from '##/components/doctor/CdsAlertBanner';`,
  'ReportCard': `import ReportCard from '##/pages/pharmacy/reports/ReportCard';`,
  'LabWorklist': `import LabWorklist from '##/pages/lab/LabWorklist';`,
  'Button': `import Button from '##/components/ui/Button';`,
  'Card': `import Card from '##/components/ui/Card';`,
  'Badge': `import { Badge } from '##/components/ui/Badge';`,
  'FormField': `import FormField from '##/components/ui/FormField';`,
  'Modal': `import Modal from '##/components/ui/Modal';`,
  'EmptyState': `import EmptyState from '##/components/ui/EmptyState';`,
  'DataTable': `import DataTable from '##/components/ui/DataTable';`,
  'Pagination': `import Pagination from '##/components/ui/Pagination';`,
  'Skeleton': `import Skeleton from '##/components/ui/Skeleton';`,
  'ErrorBoundary': `import ErrorBoundary from '##/components/ErrorBoundary';`,
  'ConfirmDialog': `import ConfirmDialog from '##/components/ui/ConfirmDialog';`,
  'DispatcherConsole': `import DispatcherConsole from '##/pages/ambulance/DispatcherConsole';`,
  'FleetManagement': `import FleetManagement from '##/pages/ambulance/FleetManagement';`,
  'CrewView': `import CrewView from '##/pages/ambulance/CrewView';`,
  'TripHistory': `import TripHistory from '##/pages/ambulance/TripHistory';`,
  'PrescriptionDocument': `import PrescriptionDocument from '##/components/pharmacy/pharmacy/PrescriptionDocument';`,
  'RadiologyQuickActions': `import RadiologyQuickActions from '##/components/radiology/RadiologyQuickActions';`,
  'RadiologyRequestList': `import RadiologyRequestList from '##/components/radiology/RadiologyRequestList';`,
  'TechnicianWorklist': `import TechnicianWorklist from '##/components/radiology/TechnicianWorklist';`,
  'DocumentUploader': `import DocumentUploader from '##/components/common/DocumentUploader';`,
  'DocumentList': `import DocumentList from '##/components/common/DocumentList';`,
  'PageHeader': `import PageHeader from '##/pages/doctor/PageHeader';`,
  'RoleManagementPanel': `import RoleManagementPanel from '##/pages/pharmacy/RoleManagementPanel';`,
  'UserFormModal': `import UserFormModal from '##/components/pharmacy/ui/UserFormModal';`,
  'ReactBarcode': `import ReactBarcode from 'react-barcode';`,
  'QuickActionDropdown': `import QuickActionDropdown from '##/components/pharmacy/layout/QuickActionDropdown';`,
  'NotificationDropdown': `import NotificationDropdown from '##/components/pharmacy/layout/NotificationDropdown';`,
  'MessageDropdown': `import MessageDropdown from '##/components/pharmacy/layout/MessageDropdown';`,
  'ProfileDropdown': `import ProfileDropdown from '##/components/pharmacy/layout/ProfileDropdown';`,
  'CommandPalette': `import CommandPalette from '##/components/ui/CommandPalette';`,
  'OTPVerificationModal': `import OTPVerificationModal from '##/components/pharmacy/auth/OTPVerificationModal';`,
  'ReportPreviewPanel': `import ReportPreviewPanel from '##/pages/pharmacy/reports/ReportPreviewPanel';`,
  'SchedulesTab': `import SchedulesTab from '##/pages/pharmacy/reports/SchedulesTab';`,
  'ScheduleDrawer': `import ScheduleDrawer from '##/pages/pharmacy/reports/ScheduleDrawer';`,
  'CarePathwayTimeline': `import CarePathwayTimeline from '##/components/doctor/CarePathwayTimeline';`,
  'GRNEntry': `import GRNEntry from '##/pages/pharmacy/GRNEntry';`,
  'InvoiceMatching': `import InvoiceMatching from '##/pages/pharmacy/InvoiceMatching';`,
  'SupplierReturns': `import SupplierReturns from '##/pages/pharmacy/SupplierReturns';`,
  'CarePlansTab': `import CarePlansTab from '##/pages/doctor/emr/CarePlansTab';`,
  'TasksTab': `import TasksTab from '##/pages/doctor/emr/TasksTab';`,
  'AssessmentsTab': `import AssessmentsTab from '##/pages/doctor/emr/AssessmentsTab';`,
  'IncidentsTab': `import IncidentsTab from '##/pages/doctor/emr/IncidentsTab';`,
  'ChecklistsTab': `import ChecklistsTab from '##/pages/doctor/emr/ChecklistsTab';`,
  'AdminDashboard': `import AdminDashboard from '##/pages/pharmacy/AdminDashboard';`,
  'LabTopKpis': `import LabTopKpis from '##/components/lab/LabTopKpis';`,
  'LabStatusDonut': `import LabStatusDonut from '##/components/lab/LabStatusDonut';`,
  'LabPriorityDonut': `import LabPriorityDonut from '##/components/lab/LabPriorityDonut';`,
  'LabDailyTrend': `import LabDailyTrend from '##/components/lab/LabDailyTrend';`,
  'LabTurnaroundTime': `import LabTurnaroundTime from '##/components/lab/LabTurnaroundTime';`,
  'LabStatusSidebar': `import LabStatusSidebar from '##/components/lab/LabStatusSidebar';`,
  'LabAlerts': `import LabAlerts from '##/components/lab/LabAlerts';`,
  'LabRecentRequests': `import LabRecentRequests from '##/components/lab/LabRecentRequests';`,
  'LabRequestDetailsModal': `import LabRequestDetailsModal from '##/pages/lab/LabRequestDetailsModal';`,
  'BranchManagement': `import BranchManagement from '##/pages/admin/BranchManagement';`,
  'UserManagement': `import UserManagement from '##/pages/admin/UserManagement';`,
  'PatientManagement': `import PatientManagement from '##/pages/admin/PatientManagement';`,
  'DoctorManagement': `import DoctorManagement from '##/pages/admin/DoctorManagement';`,
  'DepartmentManagement': `import DepartmentManagement from '##/pages/admin/DepartmentManagement';`,
  'AuditDashboard': `import AuditDashboard from '##/pages/admin/AuditDashboard';`,
};

// Recharts components
const RECHARTS_SET = new Set([
  'BarChart','LineChart','PieChart','AreaChart','RadarChart','ComposedChart',
  'ResponsiveContainer','CartesianGrid','XAxis','YAxis','Tooltip','Legend',
  'Line','Bar','Pie','Cell','Area','Radar','RechartsTooltip',
]);

function getDepth(filePath) {
  const rel = path.relative(SRC, filePath);
  return rel.split(path.sep).length - 1;
}

function makeRelPrefix(depth) {
  return '../'.repeat(depth);
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const depth = getDepth(filePath);
  const prefix = makeRelPrefix(depth);

  // Replace AppModal -> Modal in JSX
  if (content.includes('<AppModal') || content.includes('</AppModal>')) {
    content = content.replace(/<AppModal(\s)/g, '<Modal$1');
    content = content.replace(/<\/AppModal>/g, '</Modal>');
  }

  // Remove "const location = useLocation();" if location is declared but never used
  // (only when useLocation is the ONLY usage referencing location)
  // We'll just rely on unused-var warnings remaining; skip for now.

  // Collect JSX component names used in this file
  const jsxRefs = new Set();
  const jsxRegex = /<([A-Z][A-Za-z0-9.]*)/g;
  let m;
  while ((m = jsxRegex.exec(content)) !== null) {
    const name = m[1].split('.')[0]; // e.g. "motion" from "motion.div"
    jsxRefs.add(name);
  }
  // Detect motion/AnimatePresence from text
  if (/motion\./.test(content)) jsxRefs.add('motion');
  if (/AnimatePresence/.test(content)) jsxRefs.add('AnimatePresence');
  if (/\bSuspense\b/.test(content)) jsxRefs.add('Suspense');
  if (/\bStrictMode\b/.test(content)) jsxRefs.add('StrictMode');
  if (/\bOutlet\b/.test(content)) jsxRefs.add('Outlet');
  if (/\bNavigate\b/.test(content)) jsxRefs.add('Navigate');
  if (/\bRoute\b/.test(content)) jsxRefs.add('Route');
  if (/\bRoutes\b/.test(content)) jsxRefs.add('Routes');
  if (/\bLink\b/.test(content)) jsxRefs.add('Link');

  // Find already-imported symbols
  const alreadyImported = new Set();
  const importLines = content.match(/^import .+$/mg) || [];
  for (const line of importLines) {
    const named = line.match(/\{([^}]+)\}/);
    if (named) {
      named[1].split(',').forEach(s => {
        const clean = s.trim().replace(/\s+as\s+\w+/, '').trim();
        if (clean) alreadyImported.add(clean);
      });
    }
    const def = line.match(/import\s+(\w+)\s+from/);
    if (def && def[1] !== 'type') alreadyImported.add(def[1]);
  }

  // -- Lucide icons --
  const missingLucide = [...jsxRefs].filter(r => LUCIDE_ICONS_SET.has(r) && !alreadyImported.has(r));
  // Also check text references (not just JSX)
  for (const icon of LUCIDE_ICONS_SET) {
    if (!alreadyImported.has(icon) && new RegExp(`\\b${icon}\\b`).test(content) && !missingLucide.includes(icon)) {
      missingLucide.push(icon);
    }
  }
  const uniqueMissingLucide = [...new Set(missingLucide)];
  
  if (uniqueMissingLucide.length > 0) {
    const lucideMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    if (lucideMatch) {
      const existing = lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const combined = [...new Set([...existing, ...uniqueMissingLucide])].sort();
      const newImport = `import { ${combined.join(', ')} } from 'lucide-react'`;
      content = content.replace(lucideMatch[0], newImport);
    } else {
      const newLine = `import { ${uniqueMissingLucide.sort().join(', ')} } from 'lucide-react';`;
      content = insertAfterLastImport(content, newLine);
    }
  }

  // -- Recharts --
  const missingRecharts = [];
  for (const r of RECHARTS_SET) {
    if (jsxRefs.has(r) && !alreadyImported.has(r)) {
      missingRecharts.push(r);
    }
    // text reference (Tooltip used as value)
    if (!alreadyImported.has(r) && new RegExp(`\\b${r}\\b`).test(content) && !missingRecharts.includes(r)) {
      if (['ResponsiveContainer','XAxis','YAxis','CartesianGrid','Legend','Tooltip'].includes(r) && 
          new RegExp(`<${r}[\\s/>]`).test(content)) {
        missingRecharts.push(r);
      }
    }
  }
  if (missingRecharts.length > 0) {
    const recharts = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]recharts['"]/);
    const toAdd = missingRecharts.map(c => c === 'RechartsTooltip' ? 'Tooltip as RechartsTooltip' : c);
    if (recharts) {
      const existing = recharts[1].split(',').map(s => s.trim()).filter(Boolean);
      const combined = [...new Set([...existing, ...toAdd])].sort();
      const newImport = `import { ${combined.join(', ')} } from 'recharts'`;
      content = content.replace(recharts[0], newImport);
    } else {
      const newLine = `import { ${[...new Set(toAdd)].sort().join(', ')} } from 'recharts';`;
      content = insertAfterLastImport(content, newLine);
    }
  }

  // -- framer-motion --
  const needsMotion = (jsxRefs.has('motion') || content.includes('motion.')) && !alreadyImported.has('motion');
  const needsAP = (jsxRefs.has('AnimatePresence') || content.includes('AnimatePresence')) && !alreadyImported.has('AnimatePresence');
  if (needsMotion || needsAP) {
    const framerMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]framer-motion['"]/);
    if (framerMatch) {
      const existing = framerMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const combined = [...new Set([...existing, ...(needsMotion ? ['motion'] : []), ...(needsAP ? ['AnimatePresence'] : [])])].sort();
      const newImport = `import { ${combined.join(', ')} } from 'framer-motion'`;
      content = content.replace(framerMatch[0], newImport);
    } else {
      const icons = [...new Set([needsMotion ? 'motion' : null, needsAP ? 'AnimatePresence' : null].filter(Boolean))];
      content = insertAfterLastImport(content, `import { ${icons.join(', ')} } from 'framer-motion';`);
    }
  }

  // -- react-router-dom symbols --
  const routerSymbols = ['Route','Routes','Navigate','Link','Outlet','useNavigate','useParams','useLocation','useSearchParams'];
  const missingRouter = routerSymbols.filter(s => {
    if (alreadyImported.has(s)) return false;
    // Only add if actually used
    return new RegExp(`\\b${s}\\b`).test(content);
  });
  if (missingRouter.length > 0) {
    const routerMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-router-dom['"]/);
    if (routerMatch) {
      const existing = routerMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const combined = [...new Set([...existing, ...missingRouter])].sort();
      const newImport = `import { ${combined.join(', ')} } from 'react-router-dom'`;
      content = content.replace(routerMatch[0], newImport);
    } else {
      content = insertAfterLastImport(content, `import { ${missingRouter.sort().join(', ')} } from 'react-router-dom';`);
    }
  }

  // -- react Suspense/StrictMode --
  const reactNamedSymbols = ['Suspense','StrictMode'];
  const missingReactNamed = reactNamedSymbols.filter(s => jsxRefs.has(s) && !alreadyImported.has(s));
  if (missingReactNamed.length > 0) {
    const reactMatch = content.match(/import React.*from\s*['"]react['"]/);
    const reactNamedMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react['"]/);
    if (reactNamedMatch) {
      const existing = reactNamedMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const combined = [...new Set([...existing, ...missingReactNamed])].sort();
      const newImport = `import { ${combined.join(', ')} } from 'react'`;
      content = content.replace(reactNamedMatch[0], newImport);
    } else if (reactMatch) {
      // already has React import, add named
      content = content.replace(reactMatch[0], reactMatch[0].replace(/import (React)/, `import React, { ${missingReactNamed.join(', ')} }`));
    } else {
      content = insertAfterLastImport(content, `import { ${missingReactNamed.join(', ')} } from 'react';`);
    }
  }

  // -- Custom UI components --
  const toAdd = [];
  for (const [sym, importTpl] of Object.entries(COMPONENT_MAP)) {
    if (!jsxRefs.has(sym) && !new RegExp(`\\b${sym}\\b`).test(content)) continue;
    if (alreadyImported.has(sym)) continue;
    // build relative import
    const importLine = importTpl.replace('##', prefix.replace(/\/$/, '') || '.');
    toAdd.push(importLine);
    // mark as added
    alreadyImported.add(sym);
  }
  // Also check if Modal is needed (due to AppModal replacement)
  if ((content.includes('<Modal') || content.includes('</Modal>')) && !alreadyImported.has('Modal')) {
    const importLine = COMPONENT_MAP['Modal'].replace('##', prefix.replace(/\/$/, '') || '.');
    if (!toAdd.includes(importLine)) toAdd.push(importLine);
  }

  for (const line of toAdd) {
    // Don't add duplicate imports
    const what = line.match(/from\s+['"]([^'"]+)['"]/)?.[1];
    if (what && content.includes(what)) continue;
    content = insertAfterLastImport(content, line);
  }

  fs.writeFileSync(filePath, content);
}

function insertAfterLastImport(content, newLine) {
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import /.test(lines[i])) lastImportIdx = i;
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, newLine);
  } else {
    lines.unshift(newLine);
  }
  return lines.join('\n');
}

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '__tests__'].includes(f.name)) walk(full);
    } else if (f.name.endsWith('.jsx') || f.name.endsWith('.tsx')) {
      try {
        processFile(full);
      } catch (e) {
        console.error(`Error processing ${full}:`, e.message);
      }
    }
  }
}

console.log('Starting auto-fix v2...');
walk(SRC);
console.log('Done!');
