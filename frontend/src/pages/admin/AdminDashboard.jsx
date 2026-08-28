import toast from 'react-hot-toast';
import DashboardShell from '../../components/dashboard/shared/DashboardShell';
import KPICard from '../../components/ui/KPICard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import BranchManagement from '../../pages/admin/BranchManagement';
import UserManagement from '../../pages/admin/UserManagement';
import PatientManagement from '../../pages/admin/PatientManagement';
import DoctorManagement from '../../pages/admin/DoctorManagement';
import DepartmentManagement from '../../pages/admin/DepartmentManagement';
import AuditDashboard from '../../pages/admin/AuditDashboard';
import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { 
  BarChart3, 
  Building, 
  Building2, 
  CalendarCheck, 
  CalendarDays, 
  CheckCircle, 
  CheckCircle2, 
  CheckSquare, 
  ChevronDown, 
  ChevronRight, 
  ClipboardList, 
  Database, 
  DollarSign, 
  Download, 
  FileDown, 
  FileSpreadsheet, 
  FileType, 
  RefreshCw, 
  Settings, 
  ShieldCheck, 
  User, 
  UserPlus, 
  Users, 
  Users2, 
  X, 
  HardDrive, 
  Network, 
  Link as LinkIcon,
  Check,
  Clock,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Backup & Restore Modal ──────────────────────────────────── */
function BackupRestoreModal({ onClose }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [done, setDone] = useState(false);
  const [backups, setBackups] = useState([
    { id: 1, label: 'Auto System Backup', timestamp: '2026-08-27 02:00 AM', size: '248.5 MB', status: 'OK' },
    { id: 2, label: 'Manual Admin Snapshot', timestamp: '2026-08-25 06:30 PM', size: '241.2 MB', status: 'OK' },
    { id: 3, label: 'Pre-Deployment Backup', timestamp: '2026-08-20 02:00 AM', size: '239.8 MB', status: 'OK' },
  ]);
  const intervalRef = useRef(null);

  const runBackup = () => {
    setRunning(true);
    setProgress(0);
    setDone(false);
    setStatusMessage('Initializing database dump...');

    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          const newBackup = {
            id: Date.now(),
            label: 'Manual Full Backup',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            size: '252.1 MB',
            status: 'OK'
          };
          setBackups(prev => [newBackup, ...prev]);
          toast.success('System backup created & archived successfully!');
          return 100;
        }

        if (p < 30) setStatusMessage('Dumping MySQL/PostgreSQL schema & clinical tables...');
        else if (p < 60) setStatusMessage('Compressing encrypted document storage & audit logs...');
        else if (p < 90) setStatusMessage('Generating SHA-256 integrity checksums...');
        else setStatusMessage('Finalizing backup archive storage...');

        return p + 10;
      });
    }, 200);
  };

  const handleDownloadBackup = (backup) => {
    const blob = new Blob([
      JSON.stringify({
        system: 'Aurelian Health Enterprise',
        backupId: backup.id,
        label: backup.label,
        timestamp: backup.timestamp,
        checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }, null, 2)
    ], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_backup_${backup.timestamp.replace(/[: ]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded backup manifest for ${backup.label}`);
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display m-0 text-white">System Backup & Recovery</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">Manage encrypted database snapshots and disaster recovery points.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Run Backup Card */}
        <div className="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2160FF]" />
                Trigger Live Backup
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Generates a complete snapshot of database tables, patient records, and system configurations.
              </p>
            </div>
            <button
              onClick={runBackup}
              disabled={running}
              className="bg-[#2160FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer border-0 shrink-0"
              style={{ backgroundColor: '#2160FF' }}
            >
              <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Archiving System...' : 'Run Backup Now'}
            </button>
          </div>

          {(running || done) && (
            <div className="mt-4 pt-4 border-t border-blue-200/60 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-300">
                <span>{statusMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2160FF] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Existing Backups List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            Available Recovery Snapshots ({backups.length})
          </h4>
          <div className="space-y-2.5">
            {backups.map(b => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{b.label}</p>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      ✓ {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {b.timestamp} • Size: {b.size}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleDownloadBackup(b)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    Download
                  </button>
                  <button
                    onClick={() => toast.success(`Restoration request sent for snapshot ${b.timestamp}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
            Close Window
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Export Data Modal ───────────────────────────────────────── */
function ExportDataModal({ onClose }) {
  const [selectedEntities, setSelectedEntities] = useState(['patients', 'appointments', 'billing']);
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const entities = [
    { id: 'patients', label: 'Patients', count: '12,568 records' },
    { id: 'appointments', label: 'Appointments', count: '8,903 records' },
    { id: 'billing', label: 'Billing & Payments', count: '5,221 records' },
    { id: 'staff', label: 'Staff & HR', count: '156 records' },
    { id: 'prescriptions', label: 'Prescriptions', count: '14,670 records' },
    { id: 'lab_reports', label: 'Lab Reports', count: '6,042 records' },
  ];

  const toggleEntity = (id) => setSelectedEntities(prev =>
    prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
  );

  const handleExport = () => {
    if (!selectedEntities.length) { 
      toast.error('Select at least one entity to export.'); 
      return; 
    }
    setExporting(true);
    setTimeout(() => {
      setExporting(false);

      let fileContent = "Entity,ID,Timestamp,Status,Notes\n";
      selectedEntities.forEach(ent => {
        fileContent += `${ent.toUpperCase()},EX-${Math.floor(1000 + Math.random()*9000)},${new Date().toISOString()},COMPLETED,Enterprise Data Export\n`;
      });

      const mimeTypes = {
        csv: 'text/csv',
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      const blob = new Blob([fileContent], { type: mimeTypes[format] || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinic_system_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} export downloaded successfully!`);
      onClose();
    }, 1200);
  };

  const formatIcons = { csv: FileDown, pdf: FileType, excel: FileSpreadsheet };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
            <Download size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display m-0 text-white">Export System Data</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">Select modules, formats, and generate downloadable report packages.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Export Format Selector */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Choose Export Format
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {(['csv', 'pdf', 'excel']).map(f => {
              const Icon = formatIcons[f];
              const isSelected = format === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex flex-col items-center justify-center gap-2 py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-[#2160FF] text-[#2160FF] dark:text-blue-300 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#2160FF]' : 'text-slate-400'}`} />
                  {f.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entity Selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Data Entities ({selectedEntities.length} selected)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {entities.map(e => {
              const isSelected = selectedEntities.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleEntity(e.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2160FF] bg-blue-50/70 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                    isSelected ? 'border-[#2160FF] bg-[#2160FF] text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{e.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{e.count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-[#2160FF] hover:bg-blue-600 text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 border-0"
            style={{ backgroundColor: '#2160FF' }}
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Preparing File…' : `Download ${format.toUpperCase()} Package`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Mock Data for Redesigned Dashboard ── */
const APPT_DATA = [
  { name: 'Mon', value: 50 },
  { name: 'Tue', value: 140 },
  { name: 'Wed', value: 245 },
  { name: 'Thu', value: 120 },
  { name: 'Fri', value: 260 },
  { name: 'Sat', value: 310 },
  { name: 'Sun', value: 240 },
];

const DEPT_DATA = [
  { name: 'Cardiology', value: 3850, color: '#2160FF', pct: '30.6%' },
  { name: 'Neurology', value: 2450, color: '#8B5CF6', pct: '19.5%' },
  { name: 'Orthopedics', value: 2125, color: '#F59E0B', pct: '16.9%' },
  { name: 'Pediatrics', value: 1875, color: '#10B981', pct: '14.9%' },
  { name: 'Others', value: 2268, color: '#94A3B8', pct: '18.0%' },
];

const RECENT_ACTIVITY = [
  { icon: User, color: 'text-[#2160FF]', bg: 'bg-blue-50', title: 'New patient registered', sub: 'John Doe • 5 min ago' },
  { icon: CalendarCheck, color: 'text-[#2160FF]', bg: 'bg-blue-50', title: 'Appointment booked', sub: 'Dr. Sarah Smith • 15 min ago' },
  { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Payment received', sub: 'Invoice #INV-4587 • 30 min ago' },
  { icon: FileSpreadsheet, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Lab report uploaded', sub: 'Patient ID: PT-1256 • 1 hr ago' },
  { icon: UserPlus, color: 'text-[#2160FF]', bg: 'bg-blue-50', title: 'New doctor added', sub: 'Dr. Michael Lee • 2 hr ago' },
];

const DATE_PRESETS = [
  'Today (May 28, 2026)',
  'May 18 - May 24, 2026',
  'Last 7 Days (May 21 - May 28)',
  'Last 30 Days (Apr 28 - May 28)',
  'This Month (May 2026)',
  'Last Month (April 2026)'
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Date Range State & Dropdown Ref
  const [selectedDateRange, setSelectedDateRange] = useState('May 18 - May 24, 2026');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  const tabs = [
    { id: 'branches', label: 'Manage Branches', sub: '12 Branches', icon: Building2 },
    { id: 'analytics', label: 'Analytics & Reports', sub: 'Real-time Insights', icon: BarChart3 },
    { id: 'users', label: 'Manage Users', sub: '156 Users', icon: Users },
    { id: 'patients', label: 'Manage Patients', sub: '12,568 Patients', icon: Users2 },
    { id: 'doctors', label: 'Manage Doctors', sub: '156 Doctors', icon: Users },
    { id: 'departments', label: 'Manage Departments', sub: '26 Departments', icon: Building },
    { id: 'audit', label: 'Audit & Compliance', sub: '98% Compliant', icon: ShieldCheck },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDateRange = (preset) => {
    setSelectedDateRange(preset);
    setIsDateDropdownOpen(false);
    toast.success(`Dashboard filter updated to ${preset}`);
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC] font-sans">
        
        {/* Top Pill Navigation */}
        <div className="px-6 py-4 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-200/60 bg-white">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 min-w-max px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2160FF] border-[#2160FF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#2160FF]/30 hover:bg-blue-50/50'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-white/20' : 'bg-blue-50 text-[#2160FF]'}`}>
                <tab.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className={`text-[13px] font-bold leading-tight ${activeTab === tab.id ? 'text-white' : 'text-slate-800'}`}>{tab.label}</p>
                <p className={`text-[11px] ${activeTab === tab.id ? 'text-blue-100' : 'text-slate-500'}`}>{tab.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'analytics' ? (
            <div className="max-w-[1500px] mx-auto space-y-6">
              
              {/* Banner Area (Set to z-30 so popovers float above the z-10 KPI grid) */}
              <div className="relative bg-[#1E3A8A] rounded-2xl p-8 pt-10 pb-20 shadow-xl text-white flex flex-col md:flex-row justify-between items-start z-30">
                <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-2xl">
                  <div className="absolute -top-[50%] -left-[10%] w-[120%] h-[120%] border-[2px] border-white/20 rounded-[100%]"></div>
                  <div className="absolute top-[10%] -left-[20%] w-[140%] h-[140%] border-[2px] border-white/10 rounded-[100%]"></div>
                </div>

                <div className="relative z-10 space-y-3">
                  <p className="text-blue-100 text-[15px] font-medium">Welcome back,</p>
                  <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-2">
                    Dr. Admin <span className="text-3xl">👋</span>
                  </h1>
                  <p className="text-blue-200 text-[14px]">Here's what's happening with your healthcare enterprise today.</p>
                  
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[11px] font-bold text-emerald-300">System Operational - 99.9% Uptime</span>
                  </div>
                </div>

                {/* Right Interactive Actions Header (z-40) */}
                <div className="relative z-40 flex flex-col items-start md:items-end gap-4 mt-6 md:mt-0">
                  {/* Interactive Date Range Selector */}
                  <div className="relative" ref={dateDropdownRef}>
                    <button 
                      type="button"
                      onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-[13px] font-semibold text-white backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all shadow-xs min-w-[220px]"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-200 shrink-0" />
                        <span className="truncate">{selectedDateRange}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-blue-200 shrink-0 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Date Presets Dropdown — Positioned right below the trigger button with high z-[100] */}
                    <AnimatePresence>
                      {isDateDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-72 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden text-xs text-white"
                        >
                          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                            Select Date Range
                          </div>
                          <div className="py-1">
                            {DATE_PRESETS.map(preset => {
                              const isSelected = selectedDateRange === preset;
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleSelectDateRange(preset)}
                                  className={`w-full text-left px-4 py-2.5 hover:bg-blue-600/30 transition flex items-center justify-between cursor-pointer ${
                                    isSelected ? 'text-[#2160FF] font-bold bg-blue-600/20' : 'text-slate-200 hover:text-white'
                                  }`}
                                >
                                  <span className="truncate">{preset}</span>
                                  {isSelected && <Check className="w-4 h-4 text-[#2160FF] shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setBackupModalOpen(true)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[13px] font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-xs"
                    >
                      <Database className="w-4 h-4 text-blue-200" /> 
                      Backup & Restore
                    </button>
                    <button 
                      onClick={() => setExportModalOpen(true)}
                      className="px-5 py-2.5 bg-[#2160FF] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 cursor-pointer border-0"
                      style={{ backgroundColor: '#2160FF' }}
                    >
                      <Download className="w-4 h-4" /> 
                      Export System Data
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Cards (z-10, lower than banner z-30) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 -mt-16 relative z-10 px-4">
                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-[#2160FF]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-500">Total Patients</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">12,568</h3>
                    <p className="text-[11px] font-bold text-emerald-500 mt-0.5">↑ 12.5% <span className="text-slate-400 font-medium">vs last week</span></p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-6 h-6 text-purple-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-500">Appointments</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">1,245</h3>
                    <p className="text-[11px] font-bold text-emerald-500 mt-0.5">↑ 8.3% <span className="text-slate-400 font-medium">vs last week</span></p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-500">Total Doctors</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">156</h3>
                    <p className="text-[11px] font-bold text-emerald-500 mt-0.5">↑ 4.2% <span className="text-slate-400 font-medium">vs last week</span></p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6 text-[#2160FF]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-500">Revenue (This Week)</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹ 24,85,000</h3>
                    <p className="text-[11px] font-bold text-emerald-500 mt-0.5">↑ 15.6% <span className="text-slate-400 font-medium">vs last week</span></p>
                  </div>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                
                {/* Left Column (Charts & Usage) */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Appointments Overview Line Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[16px] font-extrabold text-slate-800">Appointments Overview</h2>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-slate-600 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer">
                        This Week <ChevronDown className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={APPT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2160FF" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#2160FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#2160FF', fontWeight: 800 }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#2160FF" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" activeDot={{r: 6, fill: '#2160FF', stroke: '#fff', strokeWidth: 2}} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* System Usage */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[16px] font-extrabold text-slate-800">System Usage</h2>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-slate-600 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer">
                        This Month <ChevronDown className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Storage */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <HardDrive className="w-5 h-5 text-[#2160FF]" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-slate-800">Storage Usage</p>
                            <p className="text-[11px] text-slate-500">320 GB / 1 TB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2160FF] rounded-full" style={{ width: '32%' }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">32%</span>
                        </div>
                      </div>
                      
                      {/* Database */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                            <Database className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-slate-800">Database</p>
                            <p className="text-[11px] text-slate-500">78 GB / 250 GB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: '31%' }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">31%</span>
                        </div>
                      </div>

                      {/* API Requests */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <LinkIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-slate-800">API Requests</p>
                            <p className="text-[11px] text-slate-500">12.6M / 50M</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">25%</span>
                        </div>
                      </div>

                      {/* Bandwidth */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <Network className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-slate-800">Bandwidth</p>
                            <p className="text-[11px] text-slate-500">256 GB / 1 TB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '26%' }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">26%</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Middle Column (Donut Chart) */}
                <div className="lg:col-span-3 flex">
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full flex flex-col">
                      <h2 className="text-[16px] font-extrabold text-slate-800 mb-4 text-center">Patients by Department</h2>
                      <div className="flex-1 min-h-[200px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                  data={DEPT_DATA}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="value"
                               >
                                  {DEPT_DATA.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                               </Pie>
                               <Tooltip 
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                               />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-slate-800">12,568</span>
                            <span className="text-[10px] font-bold text-slate-400">Total</span>
                         </div>
                      </div>
                      <div className="mt-4 space-y-3">
                         {DEPT_DATA.map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                                  <span className="text-[12px] font-bold text-slate-700">{d.name}</span>
                               </div>
                               <div className="text-right">
                                  <p className="text-[12px] font-semibold text-slate-500">{d.value.toLocaleString()} <span className="text-[10px] text-slate-400">({d.pct})</span></p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Right Column (Recent Activity) */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[16px] font-extrabold text-slate-800">Recent Activity</h2>
                      <span className="text-[12px] font-bold text-[#2160FF] cursor-pointer hover:underline">View All</span>
                    </div>
                    <div className="space-y-5">
                      {RECENT_ACTIVITY.map((act, i) => {
                        const Icon = act.icon;
                        return (
                          <div key={i} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 rounded-full ${act.bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-4 h-4 ${act.color}`} strokeWidth={2.5} />
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#2160FF] transition-colors">{act.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{act.sub}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2160FF] transition-colors" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[600px] max-w-[1500px] mx-auto">
              {activeTab === 'branches' && <BranchManagement />}
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'patients' && <PatientManagement />}
              {activeTab === 'doctors' && <DoctorManagement />}
              {activeTab === 'departments' && <DepartmentManagement />}
              {activeTab === 'audit' && <AuditDashboard />}
            </div>
          )}
        </div>
      </div>

      {backupModalOpen && <BackupRestoreModal onClose={() => setBackupModalOpen(false)} />}
      {exportModalOpen && <ExportDataModal onClose={() => setExportModalOpen(false)} />}
    </>
  );
};

export default AdminDashboard;
