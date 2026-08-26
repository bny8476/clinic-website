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
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { BarChart3, Building, Building2, CalendarCheck, CalendarDays, CheckCircle, CheckCircle2, CheckSquare, ChevronDown, ChevronRight, ClipboardList, Database, DollarSign, Download, FileDown, FileSpreadsheet, FileType, RefreshCw, Settings, ShieldCheck, User, UserPlus, Users, Users2, X, HardDrive, Network, Link as LinkIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

/* ── Backup & Restore Modal ──────────────────────────────────── */
function BackupRestoreModal({ onClose }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const mockBackups = [
    { id: 1, label: 'Auto Backup', timestamp: '2026-08-21 02:00 AM', size: '248 MB', status: 'OK' },
    { id: 2, label: 'Manual Backup', timestamp: '2026-08-20 06:30 PM', size: '241 MB', status: 'OK' },
    { id: 3, label: 'Auto Backup', timestamp: '2026-08-20 02:00 AM', size: '239 MB', status: 'OK' },
  ];

  const runBackup = () => {
    setRunning(true);
    setProgress(0);
    setDone(false);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          toast.success('Backup completed successfully!');
          return 100;
        }
        return p + 8;
      });
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Backup & Restore</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Run Backup */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-sm text-slate-800">Run New Backup</p>
                <p className="text-xs text-slate-500 mt-0.5">Creates a full snapshot of all databases.</p>
              </div>
              <button
                onClick={runBackup}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Running…' : 'Run Backup'}
              </button>
            </div>
            {(running || done) && (
              <div className="space-y-1">
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-blue-600 font-semibold">{done ? '✓ Backup complete' : `${progress}% — Archiving…`}</p>
              </div>
            )}
          </div>

          {/* Recent Backups */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Backups</p>
            <div className="space-y-2">
              {mockBackups.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{b.label}</p>
                    <p className="text-[11px] text-slate-400">{b.timestamp} · {b.size}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✓ {b.status}</span>
                    <button
                      onClick={() => toast.success(`Restore initiated from ${b.timestamp}`)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 px-2 py-1 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                    >Restore</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Export Data Modal ───────────────────────────────────────── */
function ExportDataModal({ onClose }) {
  const [selectedEntities, setSelectedEntities] = useState(['patients']);
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const entities = [
    { id: 'patients', label: 'Patients', count: '2,418 records' },
    { id: 'appointments', label: 'Appointments', count: '8,903 records' },
    { id: 'billing', label: 'Billing & Payments', count: '5,221 records' },
    { id: 'staff', label: 'Staff & HR', count: '142 records' },
    { id: 'prescriptions', label: 'Prescriptions', count: '14,670 records' },
    { id: 'lab_reports', label: 'Lab Reports', count: '6,042 records' },
  ];

  const toggleEntity = (id) => setSelectedEntities(prev =>
    prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
  );

  const handleExport = () => {
    if (!selectedEntities.length) { toast.error('Select at least one entity.'); return; }
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast.success(`${format.toUpperCase()} export queued! You'll receive an email when ready.`);
      onClose();
    }, 1800);
  };

  const formatIcons = { csv: FileDown, pdf: FileType, excel: FileSpreadsheet };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-800">Export Data</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Format selector */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Export Format</p>
            <div className="flex gap-2">
              {(['csv', 'pdf', 'excel']).map(f => {
                const Icon = formatIcons[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      format === f ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {f.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entity selector */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Data ({selectedEntities.length} selected)</p>
            <div className="grid grid-cols-2 gap-2">
              {entities.map(e => (
                <button
                  key={e.id}
                  onClick={() => toggleEntity(e.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    selectedEntities.includes(e.id)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                    selectedEntities.includes(e.id) ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {selectedEntities.includes(e.id) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{e.label}</p>
                    <p className="text-[10px] text-slate-400">{e.count}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Preparing…' : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const tabs = [
    { id: 'branches', label: 'Manage Branches', sub: '12 Branches', icon: Building2 },
    { id: 'analytics', label: 'Analytics & Reports', sub: 'Real-time Insights', icon: BarChart3 },
    { id: 'users', label: 'Manage Users', sub: '156 Users', icon: Users },
    { id: 'patients', label: 'Manage Patients', sub: '12,568 Patients', icon: Users2 },
    { id: 'doctors', label: 'Manage Doctors', sub: '156 Doctors', icon: Users },
    { id: 'departments', label: 'Manage Departments', sub: '26 Departments', icon: Building },
    { id: 'audit', label: 'Audit & Compliance', sub: '98% Compliant', icon: ShieldCheck },
  ];

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC] font-sans">
        
        {/* Top Pill Navigation */}
        <div className="px-6 py-4 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-200/60 bg-white">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 min-w-max px-4 py-2.5 rounded-xl border transition-all ${
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
              
              {/* Banner Area */}
              <div className="relative bg-[#1E3A8A] rounded-2xl p-8 pt-10 pb-20 shadow-xl overflow-hidden text-white flex flex-col md:flex-row justify-between items-start">
                <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
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

                <div className="relative z-10 flex flex-col items-end gap-4 mt-6 md:mt-0">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-[13px] font-medium backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors">
                    <CalendarDays className="w-4 h-4 text-blue-200" />
                    May 18 - May 24, 2026
                    <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setBackupModalOpen(true)}
                      className="px-5 py-2.5 bg-transparent border border-white/30 hover:bg-white/10 text-white text-[13px] font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" /> Backup & Restore
                    </button>
                    <button 
                      onClick={() => setExportModalOpen(true)}
                      className="px-5 py-2.5 bg-[#2160FF] hover:bg-blue-600 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Export System Data
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Cards (Overlapping) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 -mt-16 relative z-20 px-4">
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
