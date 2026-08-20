import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { motion } from 'framer-motion';
import { staggerContainer, fadeIn } from '../../components/ui/motion';
import toast from 'react-hot-toast';
import { Settings, Building2, BarChart3, Users, UserPlus, Users2, ShieldCheck, Building, Download, ClipboardList, Database, CheckSquare, CheckCircle2, DollarSign, CalendarCheck } from 'lucide-react';



const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('branches');

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
    { label: 'Backup &\nRestore', icon: Database, action: () => toast.info('Backup functionality coming soon') },
    { label: 'Export Data', icon: Download, action: () => toast.info('Export functionality coming soon') },
  ];

  const columns = [
    { key: 'date', title: 'Date' },
    { key: 'totalRevenue', title: 'Revenue', render: (val) => `$${val}` },
    { key: 'totalAppointments', title: 'Total Appts' },
    { key: 'completedAppointments', title: 'Completed' },
    { key: 'cancelledAppointments', title: 'Cancelled' },
  ];

  return (
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
  );
};

export default AdminDashboard;
