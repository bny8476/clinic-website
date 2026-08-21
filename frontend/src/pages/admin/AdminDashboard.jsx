import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { motion } from 'framer-motion';
import { staggerContainer, fadeIn } from '../../components/ui/motion';
import toast from 'react-hot-toast';
import { Settings, Building2, BarChart3, Users, UserPlus, Users2, ShieldCheck, Building, Download, ClipboardList, Database, CheckSquare, CheckCircle2, DollarSign, CalendarCheck, X, RefreshCw, FileDown, FileSpreadsheet, FileType, CheckCircle } from 'lucide-react';

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



const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('branches');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/branches');
      return res.data;
    },
    enabled: activeTab === 'branches'
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/admin/analytics/dashboard');
      return res.data;
    },
    enabled: activeTab === 'analytics',
    refetchInterval: 5000 // Real-time simulated updates
  });

  const tabs = [
    { id: 'branches', label: 'Manage Branches', icon: Building2 },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'patients', label: 'Manage Patients', icon: Users2 },
    { id: 'doctors', label: 'Manage Doctors', icon: Users },
    { id: 'departments', label: 'Manage Departments', icon: Building },
    { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck },
  ];

  const quickActions = [
    { label: 'Create User', icon: UserPlus, action: () => setActiveTab('users') },
    { label: 'Manage Users', icon: Users, action: () => setActiveTab('users') },
    { label: 'Roles &\nPermissions', icon: ShieldCheck, action: () => setActiveTab('users') },
    { label: 'Manage\nDepartments', icon: Building, action: () => setActiveTab('departments') },
    { label: 'Manage\nDoctors', icon: Users, action: () => setActiveTab('doctors') },
    { label: 'Manage\nPatients', icon: Users2, action: () => setActiveTab('patients') },
    { label: 'Manage\nBranches', icon: Building2, action: () => setActiveTab('branches') },
    { label: 'Audit Logs', icon: ClipboardList, action: () => setActiveTab('audit') },
    { label: 'Analytics\nDashboard', icon: BarChart3, action: () => setActiveTab('analytics') },
    { label: 'System\nSettings', icon: Settings, action: () => setActiveTab('analytics') },
    { label: 'Backup &\nRestore', icon: Database, action: () => setBackupModalOpen(true) },
    { label: 'Export Data', icon: Download, action: () => setExportModalOpen(true) },
  ];

  const columns = [
    { key: 'date', title: 'Date' },
    { key: 'totalRevenue', title: 'Revenue', render: (val) => `$${val}` },
    { key: 'totalAppointments', title: 'Total Appts' },
    { key: 'completedAppointments', title: 'Completed' },
    { key: 'cancelledAppointments', title: 'Cancelled' },
  ];

  return (
    <>
    <DashboardShell
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="p-6 sm:p-8 bg-[var(--color-bg-app)] min-h-full overflow-y-auto w-full">
        <div className="mb-8 relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 overflow-hidden shadow-sm">
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--color-text)] m-0">
              System Administration
            </h1>
            <p className="text-[14px] font-medium text-[var(--color-text-muted)] m-0 mt-2">
              Manage system configurations, branches, users, and view platform analytics.
            </p>
          </div>
          {/* Decorative Graphic */}
          <div className="hidden sm:flex items-center justify-end pr-4 pointer-events-none">
            <div className="relative w-48 h-24 flex items-center justify-center">
              <div className="absolute right-8 top-0 flex items-center justify-center w-16 h-20 bg-[var(--color-navy-800)] rounded-xl transform -rotate-6 shadow-lg z-10 text-white">
                  <ShieldCheck size={32} strokeWidth={1.5} />
              </div>
              <div className="absolute right-0 bottom-2 flex items-center justify-center w-12 h-12 bg-[var(--color-info-bg)] rounded-full shadow-inner text-[var(--color-navy-800)]">
                  <Settings size={24} strokeWidth={2} />
              </div>
              <div className="absolute left-8 bg-[var(--color-surface)] rounded-xl shadow-sm w-24 h-24 border border-[var(--color-border)] rotate-3 z-0 flex flex-col p-3 gap-2 opacity-80">
                <div className="w-full h-2 bg-[var(--color-surface-alt)] rounded-full"></div>
                <div className="w-2/3 h-2 bg-[var(--color-surface-alt)] rounded-full"></div>
                <div className="w-full h-2 bg-[var(--color-surface-alt)] rounded-full mt-2"></div>
              </div>
              <div className="absolute inset-0 bg-[var(--color-info-bg)] rounded-full blur-2xl mix-blend-multiply opacity-50 z-[-1]"></div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 relative z-10"
        >
          {quickActions.map((btn, i) => {
            const Icon = btn.icon;
            return (
              <motion.button
                key={i}
                onClick={btn.action}
                variants={fadeIn}
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-[var(--color-surface)] p-2.5 rounded-xl border border-[var(--color-border)] shadow-sm flex items-center gap-2.5 cursor-pointer hover:bg-[var(--color-surface-alt)] hover:border-blue-100 transition-all text-left w-full group"
              >
                <div className="p-1.5 bg-[var(--color-info-bg)] text-[var(--color-navy-800)] rounded-lg shrink-0 group-hover:bg-[var(--color-navy-800)] group-hover:text-white transition-colors">
                  <Icon size={16} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold text-[var(--color-text)] leading-tight whitespace-pre-line group-hover:text-[var(--color-navy-800)]">
                  {btn.label.replace('\n', ' ')}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div>
        {activeTab === 'branches' && <BranchManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'patients' && <PatientManagement />}
        {activeTab === 'doctors' && <DoctorManagement />}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'audit' && <AuditDashboard />}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <Button variant="secondary" icon={Download}>Export PDF</Button>
            </div>
            
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={fadeIn}><KPICard icon={DollarSign} label="Today's Revenue" value={`$${metrics?.todaysRevenue || '0.00'}`} colorToken="success" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={DollarSign} label="Outstanding Payments" value={`$${metrics?.outstandingPayments || '0.00'}`} colorToken="danger" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={CalendarCheck} label="Today's Appointments" value={metrics?.todaysAppointments || 0} colorToken="navy" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={CheckSquare} label="Pending Appointments" value={metrics?.pendingAppointments || 0} colorToken="warning" /></motion.div>
              
              <motion.div variants={fadeIn}><KPICard icon={CheckCircle2} label="Completed Consultations" value={metrics?.completedConsultations || 0} colorToken="info" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={BarChart3} label="Pending Lab Requests" value={metrics?.pendingLabRequests || 0} colorToken="indigo" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={BarChart3} label="Pending Prescriptions" value={metrics?.pendingPharmacyPrescriptions || 0} colorToken="indigo" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={CheckCircle2} label="Expiring Medicines" value={metrics?.expiringMedicines || 0} colorToken="warning" /></motion.div>
              
              <motion.div variants={fadeIn}><KPICard icon={CheckCircle2} label="Total Patients" value={metrics?.totalPatients || 0} colorToken="navy" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={CheckCircle2} label="Total Doctors" value={metrics?.totalDoctors || 0} colorToken="navy" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={CheckCircle2} label="Total Staff" value={metrics?.totalStaff || 0} colorToken="navy" /></motion.div>
              <motion.div variants={fadeIn}><KPICard icon={CheckCircle2} label="Active Users" value={metrics?.activeUsers || 0} colorToken="success" /></motion.div>
            </motion.div>
          </div>
        )}
      </div>
      </div>
    </DashboardShell>

    {backupModalOpen && <BackupRestoreModal onClose={() => setBackupModalOpen(false)} />}
    {exportModalOpen && <ExportDataModal onClose={() => setExportModalOpen(false)} />}
  </>
  );
};

export default AdminDashboard;
