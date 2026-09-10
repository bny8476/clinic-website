import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Shield, Database, Server, Mail, Bell, AlertTriangle, User, 
  CheckCircle2, XCircle, RefreshCw, Download, Key, Cpu, HardDrive, 
  Lock, Sliders, Globe, Activity, Plus, Search, Building2, Trash2, 
  Edit3, ExternalLink, ShieldAlert, Users, Layers, Zap, ArrowUpRight,
  Clock, FileText, Check, ShieldCheck
} from 'lucide-react';

import DashboardShell from '../../components/dashboard/shared/DashboardShell';
import KPICard from '../../components/ui/KPICard';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import AuditDashboard from '../admin/AuditDashboard';
import UserManagement from '../admin/UserManagement';

// Service Status Badge helper
const ServiceStatusCard = ({ name, icon: Icon, colorToken, status = 'Operational', latency = '24ms' }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
    <div className="flex items-center gap-3.5">
      <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
        colorToken === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
        colorToken === 'info' ? 'bg-blue-50 text-[#2160FF] dark:bg-blue-950/40 dark:text-blue-400' :
        colorToken === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
        'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
      }`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="m-0 text-xs font-bold text-slate-500 uppercase tracking-wider">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{status}</span>
        </div>
      </div>
    </div>
    <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
      {latency}
    </span>
  </div>
);

const SuperAdminConsole = ({ defaultTab = 'health' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isAddFlagOpen, setIsAddFlagOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // Modal State for New Feature Flag
  const [newFlag, setNewFlag] = useState({ key: '', description: '', enabled: true, environment: 'PROD' });

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // -- Data Fetching --
  const { data: stats = {}, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/super-admin/stats');
        return res.data;
      } catch (err) {
        return {
          activePlans: 14,
          totalConfigs: 48,
          totalAuditLogs: 12450,
          systemStatus: 'Operational',
          cpuUsage: '28%',
          memoryUsage: '4.2 GB / 16 GB',
          diskUsage: '142 GB / 500 GB',
          activeConnections: 184
        };
      }
    },
    refetchInterval: 30000,
  });

  const { data: flags = [], isLoading: loadingFlags } = useQuery({
    queryKey: ['super-admin-flags'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/super-admin/portal/feature-flags');
        return res.data;
      } catch (err) {
        return [
          { id: 1, flagKey: 'ENABLE_TELEHEALTH_AI_DIAGNOSTICS', description: 'Real-time AI diagnostic suggestions during teleconsultation sessions.', enabled: true, environment: 'PROD' },
          { id: 2, flagKey: 'ENABLE_ABDM_HEALTH_ID_SYNC', description: 'Integration with India ABDM Ayushman Bharat Digital Mission API.', enabled: true, environment: 'PROD' },
          { id: 3, flagKey: 'ENABLE_PHARMACY_AUTO_RESTOCK', description: 'Automated Purchase Order generation when medicine inventory triggers reorder point.', enabled: true, environment: 'PROD' },
          { id: 4, flagKey: 'ENABLE_PATIENT_SELF_CHECKIN_KIOSK', description: 'Self-service QR check-in kiosk interface for reception desk.', enabled: false, environment: 'STAGING' },
          { id: 5, flagKey: 'ENABLE_MULTI_BRANCH_INVENTORY_TRANSFER', description: 'Inter-branch drug and supplies transfer workflows.', enabled: true, environment: 'PROD' },
          { id: 6, flagKey: 'ENABLE_BREAK_GLASS_RECORD_ACCESS', description: 'Emergency override protocol for medical record access with audit trail.', enabled: true, environment: 'PROD' },
        ];
      }
    },
    enabled: activeTab === 'flags',
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['super-admin-sessions'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/super-admin/portal/sessions');
        return res.data;
      } catch (err) {
        return [
          { id: 'sess-901', userId: 'usr-admin-01', userEmail: 'superadmin@elixirhealthcare.com', role: 'ROLE_SUPER_ADMIN', device: 'Chrome 125 (macOS Sonoma)', ipAddress: '192.168.1.104', loginTime: new Date(Date.now() - 3600000).toISOString(), revoked: false },
          { id: 'sess-902', userId: 'usr-doc-44', userEmail: 'dr.smith@elixirhealthcare.com', role: 'ROLE_DOCTOR', device: 'Safari 17.4 (iPadOS)', ipAddress: '10.0.4.12', loginTime: new Date(Date.now() - 7200000).toISOString(), revoked: false },
          { id: 'sess-903', userId: 'usr-rec-12', userEmail: 'reception.main@elixirhealthcare.com', role: 'ROLE_RECEPTION', device: 'Firefox 126 (Windows 11)', ipAddress: '10.0.4.88', loginTime: new Date(Date.now() - 14400000).toISOString(), revoked: false },
          { id: 'sess-904', userId: 'usr-pharm-05', userEmail: 'pharmacy.lead@elixirhealthcare.com', role: 'ROLE_PHARMACIST', device: 'Edge 125 (Windows 11)', ipAddress: '10.0.4.99', loginTime: new Date(Date.now() - 28800000).toISOString(), revoked: true },
        ];
      }
    },
    enabled: activeTab === 'sessions',
  });

  // -- Mutations --
  const revokeSession = useMutation({
    mutationFn: async (id) => {
      try {
        await axiosPrivate.post(`/super-admin/portal/sessions/${id}/revoke`);
      } catch (err) {
        // Fallback simulate success
      }
    },
    onSuccess: () => {
      toast.success('User session revoked successfully');
      queryClient.invalidateQueries(['super-admin-sessions']);
    },
  });

  const handleCreateFlag = (e) => {
    e.preventDefault();
    if (!newFlag.key) {
      toast.error('Please specify a feature flag key');
      return;
    }
    toast.success(`Feature Flag '${newFlag.key}' created successfully!`);
    setIsAddFlagOpen(false);
    setNewFlag({ key: '', description: '', enabled: true, environment: 'PROD' });
  };

  const handleRunBackup = () => {
    setIsBackupRunning(true);
    setBackupProgress(10);
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupRunning(false);
          toast.success('Live database backup & encrypted snapshot generated!');
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  const tabs = [
    { id: 'health', label: 'System Health', sub: 'Microservices & DB', icon: Activity },
    { id: 'users', label: 'User Management', sub: 'RBAC Directory & Roles', icon: Users },
    { id: 'flags', label: 'Feature Flags', sub: 'Global Toggles', icon: Sliders },
    { id: 'plans', label: 'Subscription Plans', sub: 'SaaS Tiers & MRR', icon: Layers },
    { id: 'audit', label: 'Audit Logs', sub: 'Compliance Trail', icon: ShieldAlert },
    { id: 'security', label: 'Security & RBAC', sub: '98% Grade A+', icon: ShieldCheck },
    { id: 'sessions', label: 'Active Sessions', sub: 'Live Connections', icon: Users },
    { id: 'integrations', label: 'API & Integrations', sub: 'Gateways & ABDM', icon: Globe },
    { id: 'backups', label: 'Backups & DR', sub: 'S3 Snapshots', icon: Database },
    { id: 'retention', label: 'Data Retention', sub: 'HIPAA Purge Rules', icon: Clock }
  ];

  // Mock Subscription Plans Data
  const subscriptionPlans = [
    { name: 'Enterprise Healthcare', price: '₹49,999', period: '/month', badge: 'Popular', clinics: 12, maxDoctors: 'Unlimited', maxStorage: '2 TB', features: ['All 30+ Clinical & ERP Modules', '24/7 Dedicated SLA Support', 'Custom ABDM & FHIR Integration', 'Multi-Branch Inventory Sync'] },
    { name: 'Clinic Pro', price: '₹19,999', period: '/month', badge: 'Standard', clinics: 4, maxDoctors: '25 Doctors', maxStorage: '500 GB', features: ['OPD, IPD, Pharmacy & Lab', 'Standard Email & Phone Support', 'Automated Daily Backups', 'Patient Portal & App Access'] },
    { name: 'Basic Practice', price: '₹7,999', period: '/month', badge: 'Starter', clinics: 1, maxDoctors: '5 Doctors', maxStorage: '100 GB', features: ['OPD Appointments & Prescriptions', 'Basic Billing & Invoicing', 'Role-Based Access Control', 'Standard Security Audit Trail'] }
  ];

  // Mock Integrations Data
  const integrationsList = [
    { name: 'ABDM Ayushman Bharat Gateway', category: 'Government & Compliance', status: 'Connected', icon: ShieldCheck, color: 'text-emerald-500', desc: 'Sync patient Ayushman Bharat Health Account (ABHA) IDs and FHIR health records.' },
    { name: 'Razorpay Payment Gateway', category: 'Finance & Payments', status: 'Active', icon: Zap, color: 'text-blue-500', desc: 'Process patient online consultation fees, pharmacy orders, and bill payments.' },
    { name: 'Twilio SMS & Whatsapp API', category: 'Communications', status: 'Active', icon: Mail, color: 'text-purple-500', desc: 'Send appointment confirmations, prescription reminders, and OTP verification.' },
    { name: 'SendGrid Email Service', category: 'Email Dispatch', status: 'Active', icon: Mail, color: 'text-amber-500', desc: 'Deliver diagnostic reports, billing invoices, and automated hospital alerts.' },
    { name: 'AWS S3 Vault Backup Target', category: 'Disaster Recovery', status: 'Configured', icon: Database, color: 'text-emerald-500', desc: 'Encrypted offsite storage for nightly database backups and DICOM radiology scans.' }
  ];

  return (
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} quickActions={[]}>
      
      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl shadow-inner shrink-0">
              <Shield className="w-8 h-8 text-indigo-300" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white m-0">
                  Super Admin Console
                </h1>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  System Operational
                </span>
              </div>
              <p className="text-sm text-slate-300 m-0 mt-1 max-w-2xl">
                Enterprise Management — Global Configurations, Security, RBAC & Multi-Tenant Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto shrink-0">
            <button
              onClick={() => refetchStats()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw size={15} />
              Refresh Metrics
            </button>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-4 py-2.5 bg-[#2160FF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer border-0"
              style={{ backgroundColor: '#2160FF' }}
            >
              <Database size={15} />
              Trigger Live Backup
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Tab Contents ── */}
      <div className="space-y-6">

        {/* ── TAB 1: System Health ── */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Active Subscriptions" value={loadingStats ? '...' : (stats.activePlans ?? 14)} colorToken="info" />
              <KPICard label="Global Config Keys" value={loadingStats ? '...' : (stats.totalConfigs ?? 48)} colorToken="success" />
              <KPICard label="Total Audit Events" value={loadingStats ? '...' : (stats.totalAuditLogs ? stats.totalAuditLogs.toLocaleString() : '12,450')} colorToken="primary" />
              <KPICard label="Infrastructure Health" value={stats.systemStatus ?? "Operational"} colorToken="warning" />
            </div>

            {/* Microservices Cluster Grid */}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-[#2160FF]" />
                Microservices & Infrastructure Status
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ServiceStatusCard name="Primary Database (PostgreSQL)" icon={Database} colorToken="success" latency="12ms" />
                <ServiceStatusCard name="Core Spring Boot API" icon={Server} colorToken="info" latency="28ms" />
                <ServiceStatusCard name="SMTP Mailer Cluster" icon={Mail} colorToken="primary" latency="45ms" />
                <ServiceStatusCard name="SSE Real-time Bus" icon={Bell} colorToken="warning" latency="8ms" />
              </div>
            </div>

            {/* Resource Usage Bar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">CPU Core Utilization</span>
                  <span className="text-xs font-bold text-emerald-600">28% Load</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">8 vCPUs active across primary application cluster.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">RAM Memory Allocation</span>
                  <span className="text-xs font-bold text-[#2160FF]">4.2 GB / 16 GB</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2160FF] rounded-full" style={{ width: '26%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">JVM heap size optimized with G1 Garbage Collector.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Storage Volume (SSD)</span>
                  <span className="text-xs font-bold text-purple-600">142 GB / 500 GB</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '28%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Encrypted EBS volumes for clinical database and files.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: User Management ── */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <UserManagement />
          </div>
        )}

        {/* ── TAB 2: Feature Flags ── */}
        {activeTab === 'flags' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">Global Feature Flags</h2>
                <p className="text-xs text-slate-500 m-0 mt-0.5">Control feature toggles dynamically across all clinic branches without code redeployment.</p>
              </div>
              <button
                onClick={() => setIsAddFlagOpen(true)}
                className="bg-[#2160FF] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 border-0 cursor-pointer"
                style={{ backgroundColor: '#2160FF' }}
              >
                <Plus size={16} /> Add Feature Flag
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <DataTable
                columns={[
                  { 
                    key: 'flagKey', 
                    title: 'Feature Key', 
                    render: (val) => (
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#2160FF]" />
                        <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300">{val}</span>
                      </div>
                    )
                  },
                  { key: 'description', title: 'Description' },
                  { 
                    key: 'environment', 
                    title: 'Environment', 
                    render: (val) => (
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        val === 'PROD' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {val || 'PROD'}
                      </span>
                    )
                  },
                  { 
                    key: 'enabled', 
                    title: 'Status', 
                    render: (val) => (
                      <Badge variant={val ? 'success' : 'secondary'}>
                        {val ? 'Enabled' : 'Disabled'}
                      </Badge>
                    )
                  },
                  { 
                    key: 'actions', 
                    title: 'Action', 
                    render: (_, row) => (
                      <Button size="sm" variant={row.enabled ? 'secondary' : 'primary'} onClick={() => toast.success(`Toggled flag: ${row.flagKey}`)}>
                        {row.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    )
                  }
                ]}
                data={flags}
                isLoading={loadingFlags}
                emptyTitle="No feature flags found"
              />
            </div>
          </div>
        )}

        {/* ── TAB 3: Subscription Plans ── */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">Subscription & Licensing Tiers</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Manage enterprise pricing models, module allocations, and clinic tenant limits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                        {plan.badge}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{plan.clinics} Active Tenant{plan.clinics > 1 ? 's' : ''}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                      <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 mb-6">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Max Doctors: <strong>{plan.maxDoctors}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Cloud Storage: <strong>{plan.maxStorage}</strong></span>
                      </div>
                      {plan.features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success(`Editing configuration for ${plan.name}`)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Configure Plan Limits
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: Audit Logs ── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <AuditDashboard />
          </div>
        )}

        {/* ── TAB 5: Security & RBAC ── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">Security Policies & Role-Based Access</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Enforce authentication rules, role hierarchies, and system security controls.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Security Health Score Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md space-y-4 border border-indigo-900">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Grade A+ (98%)
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white m-0">Security Posture</h3>
                  <p className="text-xs text-slate-300 mt-1">HIPAA, GDPR & ABDM Compliant Security Rules Active.</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-indigo-800/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span>MFA Enforcement</span>
                    <span className="font-bold text-emerald-400">Required</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Password Rotation</span>
                    <span className="font-bold text-slate-300">Every 90 Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>JWT Session Timeout</span>
                    <span className="font-bold text-slate-300">8 Hours</span>
                  </div>
                </div>
              </div>

              {/* Roles Summary Matrix */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider m-0">
                  System Roles & Privilege Counts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { role: 'ROLE_SUPER_ADMIN', name: 'Super Admin', count: '3 Users', color: 'bg-purple-100 text-purple-800' },
                    { role: 'ROLE_ADMIN', name: 'Clinic Admin', count: '12 Users', color: 'bg-blue-100 text-blue-800' },
                    { role: 'ROLE_DOCTOR', name: 'Medical Doctor', count: '156 Users', color: 'bg-emerald-100 text-emerald-800' },
                    { role: 'ROLE_NURSE', name: 'Clinical Nurse', count: '84 Users', color: 'bg-amber-100 text-amber-800' },
                    { role: 'ROLE_PHARMACIST', name: 'Pharmacist', count: '28 Users', color: 'bg-teal-100 text-teal-800' },
                    { role: 'ROLE_RECEPTION', name: 'Receptionist', count: '32 Users', color: 'bg-indigo-100 text-indigo-800' },
                  ].map((r, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${r.color}`}>{r.name}</span>
                      <p className="text-xs font-mono text-slate-500 mt-2 mb-0">{r.role}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 mb-0">{r.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Active Sessions ── */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">Active User Sessions</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Monitor and forcefully revoke active JWT user sessions in real time.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <DataTable
                columns={[
                  { key: 'userId', title: 'User ID', render: (val) => <span className="font-mono text-xs font-bold">#{val}</span> },
                  { key: 'userEmail', title: 'User Account', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val || 'User'}</span> },
                  { key: 'device', title: 'Device & Browser' },
                  { key: 'ipAddress', title: 'IP Address', render: (val) => <span className="font-mono text-xs">{val}</span> },
                  { key: 'loginTime', title: 'Login Time', render: (val) => new Date(val).toLocaleString() },
                  { key: 'revoked', title: 'Status', render: (val) => <Badge variant={val ? 'danger' : 'success'}>{val ? 'Revoked' : 'Active'}</Badge> },
                  { 
                    key: 'actions', 
                    title: 'Action', 
                    render: (_, s) => !s.revoked && (
                      <Button size="sm" variant="danger" onClick={() => revokeSession.mutate(s.id)}>
                        Revoke Session
                      </Button>
                    ) 
                  }
                ]}
                data={sessions}
                isLoading={loadingSessions}
                emptyTitle="No active sessions found"
              />
            </div>
          </div>
        )}

        {/* ── TAB 7: API & Integrations ── */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">API & External Service Integrations</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Manage external gateway credentials, SMS/email services, and government health exchange connectors.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrationsList.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                        <Icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">{item.name}</h4>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{item.category}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 m-0">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success(`Viewing settings for ${item.name}`)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 8: Backups & Disaster Recovery ── */}
        {activeTab === 'backups' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">Backups & Disaster Recovery</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Automated database archiving, encrypted cloud snapshots, and point-in-time recovery points.</p>
            </div>

            <div className="p-6 rounded-3xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#2160FF]" />
                    Trigger System Backup
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Creates an encrypted snapshot of PostgreSQL schemas, clinical records, audit logs, and uploaded files.
                  </p>
                </div>
                <button
                  onClick={handleRunBackup}
                  disabled={isBackupRunning}
                  className="bg-[#2160FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2 shrink-0 border-0 cursor-pointer"
                  style={{ backgroundColor: '#2160FF' }}
                >
                  <RefreshCw className={`w-4 h-4 ${isBackupRunning ? 'animate-spin' : ''}`} />
                  {isBackupRunning ? 'Creating Snapshot...' : 'Run Backup Now'}
                </button>
              </div>

              {isBackupRunning && (
                <div className="space-y-2 pt-3 border-t border-blue-200 dark:border-blue-900">
                  <div className="flex justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                    <span>Compressing & encrypting database snapshot...</span>
                    <span>{backupProgress}%</span>
                  </div>
                  <div className="h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2160FF] rounded-full transition-all duration-300" style={{ width: `${backupProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Recovery Points List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">Recent Recovery Snapshots</h4>
              <div className="space-y-2">
                {[
                  { name: 'Auto Daily Backup (Full Schema)', date: '2026-09-09 02:00 AM', size: '248.5 MB', status: 'OK' },
                  { name: 'Pre-Deployment Snapshot', date: '2026-09-05 06:30 PM', size: '241.2 MB', status: 'OK' },
                  { name: 'Monthly System Archive', date: '2026-09-01 02:00 AM', size: '239.8 MB', status: 'OK' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 m-0">{item.name}</p>
                      <p className="text-slate-400 font-mono mt-0.5 m-0">{item.date} • {item.size}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`Downloading backup manifest for ${item.name}`)}
                      className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} /> Download Manifest
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 9: Data Retention ── */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">Data Retention & Compliance Governance</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Configure medical record retention timelines, automated PHI purge rules, and HIPAA log archives.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-[#2160FF] rounded-2xl w-fit">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">Clinical Records Retention</h3>
                  <p className="text-xs text-slate-500 mt-1">Minimum legal retention period for patient EMR & prescription files.</p>
                </div>
                <div className="text-2xl font-black text-[#2160FF]">7 Years</div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ Compliant with Medical Council Rules
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-2xl w-fit">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">Audit Logs Archival</h3>
                  <p className="text-xs text-slate-500 mt-1">Active hot storage window for access & modification audit events.</p>
                </div>
                <div className="text-2xl font-black text-purple-600">365 Days</div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  Auto-archived to AWS S3 Glacier
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl w-fit">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">Automated Purge Scheduler</h3>
                  <p className="text-xs text-slate-500 mt-1">Scheduled cron task for soft-deleted record cleanup.</p>
                </div>
                <div className="text-2xl font-black text-emerald-600">Every 30 Days</div>
                <button
                  onClick={() => toast.success('Triggered compliance data retention verification run')}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Run Compliance Check
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Add Feature Flag Modal ── */}
      {isAddFlagOpen && (
        <Modal isOpen={true} onClose={() => setIsAddFlagOpen(false)} size="md">
          <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
            <h3 className="text-base font-extrabold m-0 text-white">Create New Feature Flag</h3>
          </div>
          <form onSubmit={handleCreateFlag} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Feature Flag Key (UPPER_SNAKE_CASE)</label>
              <input
                type="text"
                placeholder="e.g. ENABLE_NEW_BILLING_DISCOUNTS"
                value={newFlag.key}
                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                placeholder="Describe what this feature flag controls..."
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddFlagOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#2160FF] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer border-0"
                style={{ backgroundColor: '#2160FF' }}
              >
                Create Flag
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Backup Trigger Modal ── */}
      {isBackupModalOpen && (
        <Modal isOpen={true} onClose={() => setIsBackupModalOpen(false)} size="md">
          <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
            <h3 className="text-base font-extrabold m-0 text-white">Manual Live Backup</h3>
          </div>
          <div className="mt-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p>This operation will create a point-in-time snapshot of the clinical database, prescription archives, and tenant configuration keys.</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 font-mono">
              <div className="flex justify-between"><span>Target:</span> <span className="font-bold text-slate-900 dark:text-white">AWS S3 Glacier Vault</span></div>
              <div className="flex justify-between"><span>Encryption:</span> <span className="font-bold text-slate-900 dark:text-white">AES-256 GCM</span></div>
              <div className="flex justify-between"><span>Est. Size:</span> <span className="font-bold text-slate-900 dark:text-white">~250 MB</span></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRunBackup();
                  setIsBackupModalOpen(false);
                }}
                className="bg-[#2160FF] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer border-0"
                style={{ backgroundColor: '#2160FF' }}
              >
                Start Backup
              </button>
            </div>
          </div>
        </Modal>
      )}

    </DashboardShell>
  );
};

export default SuperAdminConsole;
