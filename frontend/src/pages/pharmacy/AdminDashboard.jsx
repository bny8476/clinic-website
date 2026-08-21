
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/pharmacy/AuthContext';
import api from '../../utils/pharmacy/api';
import {


  Package, IndianRupee, FileText, AlertTriangle, Calendar, Users,
  Plus, ScanLine, PackagePlus, ShoppingCart, ClipboardList, Printer, TrendingUp, Activity, ShieldAlert,
  Truck, RotateCcw, CheckSquare, Receipt, X, RefreshCw, Banknote, CreditCard, Lock
} from 'lucide-react';

/* ── Day Close Modal ─────────────────────────────────────── */
function DayCloseModal({ onClose }) {
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);

  const summary = {
    date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    totalBills: 87,
    totalRevenue: 142350,
    cashCollections: 58200,
    cardCollections: 68150,
    onlineCollections: 16000,
    refunds: 1800,
    netRevenue: 140550,
    pendingBills: 3,
  };

  const handleDayClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setClosed(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          closed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <Lock className={`w-5 h-5 ${closed ? 'text-emerald-600' : 'text-amber-600'}`} />
            <h2 className="font-bold text-slate-800">{closed ? 'Day Closed' : 'Day Close Summary'}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {closed ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-800 text-lg">Day Successfully Closed</p>
              <p className="text-sm text-slate-500 mt-1">{summary.date}</p>
              <p className="text-xs text-slate-400 mt-3">All transactions have been locked. EOD report has been generated.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">{summary.date}</p>

              {/* Revenue Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Summary</p>
                {[
                  { label: 'Total Bills', value: summary.totalBills, prefix: '' },
                  { label: 'Gross Revenue', value: `₹${summary.totalRevenue.toLocaleString('en-IN')}`, prefix: '' },
                  { label: 'Refunds', value: `-₹${summary.refunds.toLocaleString('en-IN')}`, prefix: '', red: true },
                  { label: 'Net Revenue', value: `₹${summary.netRevenue.toLocaleString('en-IN')}`, prefix: '', bold: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-bold ${
                      row.red ? 'text-red-600' : row.bold ? 'text-emerald-700' : 'text-slate-700'
                    }`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Collections Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collections Breakdown</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Banknote, label: 'Cash', value: summary.cashCollections, color: 'text-emerald-600 bg-emerald-50' },
                    { icon: CreditCard, label: 'Card', value: summary.cardCollections, color: 'text-blue-600 bg-blue-50' },
                    { icon: IndianRupee, label: 'Online', value: summary.onlineCollections, color: 'text-violet-600 bg-violet-50' },
                  ].map(col => (
                    <div key={col.label} className={`p-3 rounded-xl ${col.color} border border-current/10 text-center`}>
                      <col.icon className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-[10px] font-bold">{col.label}</p>
                      <p className="text-xs font-bold mt-0.5">₹{(col.value / 1000).toFixed(0)}k</p>
                    </div>
                  ))}
                </div>
              </div>

              {summary.pendingBills > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-semibold">{summary.pendingBills} bills still pending. Closing will lock them as open items.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            {closed ? 'Close' : 'Cancel'}
          </button>
          {!closed && (
            <button
              onClick={handleDayClose}
              disabled={closing}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {closing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {closing ? 'Closing Day…' : 'Confirm Day Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const ROLE_CONFIG = {
  SYSTEM_ADMIN: {
    greeting: 'System Admin',
    subtitle: 'Operational dashboard and real-time pharmacy metrics overview.',
    kpiKeys: ['totalSkus', 'todayRevenue', 'lowStockAlerts', 'expiringIn30Days', 'activePatientsToday'],
    chartType: 'area',
    chartLabel: '7-Day Sales Revenue',
    quickActions: [
      { label: 'New Sale', icon: Plus, path: '/pharmacy/direct-pharmacy-sales' },
      { label: 'Scan Barcode', icon: ScanLine, path: '/pharmacy/barcode-scanner' },
      { label: 'Add Stock', icon: PackagePlus, path: '/pharmacy/medicine-stock' },
      { label: 'Create PO', icon: ShoppingCart, path: '/pharmacy/purchase-orders' },
      { label: 'Print Day Report', icon: Printer, action: 'printDayReport' },
    ],
  },
  PHARMACY_STAFF: {
    greeting: 'Pharmacy Staff',
    subtitle: 'Your dispensing queue and daily sales overview.',
    kpiKeys: ['billsRaisedToday', 'todayCollections', 'pendingDispensals',
      'lowStockItems', 'myReturnsToday', 'creditBillsPending'],
    chartType: 'line',
    chartLabel: "Today's Hourly Sales",
    quickActions: [
      { label: 'New Sale', icon: Plus, path: '/pharmacy/direct-pharmacy-sales' },
      { label: 'Scan Barcode', icon: ScanLine, path: '/pharmacy/barcode-scanner' },
      { label: 'Process Return', icon: RotateCcw, path: '/pharmacy/medicine-returns' },
      { label: 'Print Receipt', icon: Printer, action: 'printReceipt' },
    ],
  },
  BILLING_STAFF: {
    greeting: 'Billing Staff',
    subtitle: 'Billing queue, collections, and clearance overview.',
    kpiKeys: ['billsRaisedToday', 'totalCollected', 'pendingClearances',
      'advanceRequests', 'creditBills', 'consolidatedBillsPending'],
    chartType: 'bar',
    chartLabel: 'Payment Mode Breakdown',
    quickActions: [
      { label: 'New Bill', icon: Plus, path: '/pharmacy/direct-pharmacy-sales' },
      { label: 'View Advances', icon: IndianRupee, path: '/pharmacy/pharmacy-advances' },
      { label: 'Process Clearance', icon: CheckSquare, path: '/pharmacy/pharmacy-clearance' },
      { label: 'Print Bill', icon: Printer, action: 'printBill' },
      { label: 'View Consolidated', icon: FileText, path: '/pharmacy/consolidated-bills' },
      { label: 'Day Close', icon: Calendar, action: 'dayClose' },
    ],
  },
  STOREKEEPER: {
    greeting: 'Storekeeper',
    subtitle: 'Purchase orders, GRN, and stock movement overview.',
    kpiKeys: ['posPendingApproval', 'grnsAwaitingVerification', 'lowStockSkus',
      'expiringIn30Days', 'supplierReturnsPending', 'stockValue'],
    chartType: 'dualBar',
    chartLabel: 'Stock Inflow vs Outflow (7 Days)',
    quickActions: [
      { label: 'Create PO', icon: ShoppingCart, path: '/pharmacy/purchase-orders' },
      { label: 'Record GRN', icon: Truck, path: '/pharmacy/grnentry' },
      { label: 'Adjust Stock', icon: PackagePlus, path: '/pharmacy/medicine-stock' },
      { label: 'Supplier Return', icon: RotateCcw, path: '/pharmacy/medicine-returns' },
      { label: 'View Low Stock', icon: AlertTriangle, path: '/pharmacy/low-stock-alerts' },
      { label: 'View Expiry', icon: Calendar, path: '/pharmacy/expiry-tracker' },
    ],
  },
  SUPERVISOR: {
    greeting: 'Supervisor',
    subtitle: 'Team activity, approvals, and operational metrics.',
    kpiKeys: ['totalSalesToday', 'staffActive', 'pendingApprovals',
      'returnsAwaitingApproval', 'lowStockAlerts', 'systemHealthPct'],
    chartType: 'bar',
    chartLabel: 'Department Sales Breakdown',
    quickActions: [
      { label: 'Approve Returns', icon: CheckSquare, path: '/pharmacy/medicine-returns' },
      { label: 'View Staff Activity', icon: Users, path: '/pharmacy/user-management' },
      { label: 'Run Report', icon: FileText, path: '/pharmacy/reports' },
      { label: 'View Alerts', icon: AlertTriangle, action: 'scrollToAlerts' },
      { label: 'Manage Users', icon: Users, path: '/pharmacy/user-management' },
      { label: 'Analytics', icon: TrendingUp, path: '/pharmacy/analytics/analytics-dashboard' },
    ],
  },
  RECEPTIONIST: {
    greeting: 'Receptionist',
    subtitle: 'Patient registration and appointments overview.',
    kpiKeys: ['activePatientsToday'],
    chartType: 'line',
    chartLabel: 'Patient Flow',
    quickActions: [
      { label: 'Patients', icon: Users, path: '/pharmacy/patients' }
    ]
  },
  MEDICAL_STAFF: {
    greeting: 'Medical Staff',
    subtitle: 'Prescriptions and dispensals overview.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Prescriptions Volume',
    quickActions: [
    ]
  },
  SENIOR_MEDICAL_STAFF: {
    greeting: 'Senior Medical Staff',
    subtitle: 'Prescriptions and dispensals overview.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Prescriptions Volume',
    quickActions: []
  },
  AUDIT_COMPLIANCE: {
    greeting: 'Audit & Compliance',
    subtitle: 'Read-only access to reports, logs, and audit trails.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Activity Overview',
    quickActions: [
      { label: 'View Reports', icon: FileText, path: '/pharmacy/reports' },
    ]
  },
  LAB_TECHNICIAN: {
    greeting: 'Lab Technician',
    subtitle: 'Lab requests and results overview.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Lab Activity',
    quickActions: []
  }
};

const KPI_META = {
  totalSkus: { label: 'Total SKUs in Stock', icon: Package, color: 'blue' },
  todayRevenue: { label: "Today's Sales Revenue", icon: IndianRupee, color: 'green', prefix: '₹' },
  pendingPrescriptions: { label: 'Pending Prescriptions', icon: FileText, color: 'amber' },
  lowStockAlerts: { label: 'Low Stock Alerts', icon: AlertTriangle, color: 'orange' },
  expiringIn30Days: { label: 'Expiring in 30 Days', icon: Calendar, color: 'red' },
  activePatientsToday: { label: 'Active Patients Today', icon: Users, color: 'purple' },
  billsRaisedToday: { label: 'Bills Raised Today', icon: Receipt, color: 'blue' },
  todayCollections: { label: "Today's Collections", icon: IndianRupee, color: 'green', prefix: '₹' },
  pendingDispensals: { label: 'Pending Dispensals', icon: ClipboardList, color: 'amber' },
  lowStockItems: { label: 'Low Stock Items', icon: AlertTriangle, color: 'orange' },
  myReturnsToday: { label: 'My Returns Today', icon: RotateCcw, color: 'slate' },
  creditBillsPending: { label: 'Credit Bills Pending', icon: FileText, color: 'red' },
  totalCollected: { label: 'Total Collected', icon: IndianRupee, color: 'green', prefix: '₹' },
  pendingClearances: { label: 'Pending Clearances', icon: CheckSquare, color: 'amber' },
  advanceRequests: { label: 'Advance Requests', icon: IndianRupee, color: 'blue' },
  creditBills: { label: 'Credit Bills', icon: Receipt, color: 'red' },
  consolidatedBillsPending: { label: 'Consolidated Bills Pending', icon: FileText, color: 'slate' },
  posPendingApproval: { label: 'POs Pending Approval', icon: ShoppingCart, color: 'amber' },
  grnsAwaitingVerification: { label: 'GRNs Awaiting Verification', icon: Truck, color: 'blue' },
  lowStockSkus: { label: 'Low Stock SKUs', icon: AlertTriangle, color: 'orange' },
  supplierReturnsPending: { label: 'Supplier Returns Pending', icon: RotateCcw, color: 'slate' },
  stockValue: { label: 'Stock Value', icon: IndianRupee, color: 'green', prefix: '₹' },
  totalSalesToday: { label: 'Total Sales Today', icon: IndianRupee, color: 'green', prefix: '₹' },
  staffActive: { label: 'Staff Active', icon: Users, color: 'blue' },
  pendingApprovals: { label: 'Pending Approvals', icon: CheckSquare, color: 'amber' },
  returnsAwaitingApproval: { label: 'Returns Awaiting Approval', icon: RotateCcw, color: 'red' },
  systemHealthPct: { label: 'System Health', icon: Activity, color: 'green', suffix: '%' },
};

function AdminKpiWrapper({ kpiKey, value, delta, deltaType }) {
  const meta = KPI_META[kpiKey] || { label: kpiKey, icon: Activity, color: 'slate' };
  const isLoading = value === undefined || value === null;

  const displayValue = isLoading ? '—' :
    meta.prefix ? `${meta.prefix}${Number(value).toLocaleString('en-IN')}` :
      meta.suffix ? `${Number(value).toLocaleString('en-IN')}${meta.suffix}` :
        Number(value).toLocaleString('en-IN');

  const subtext = delta !== undefined ? `${deltaType === 'up' ? '↑' : '↓'} ${delta} vs yesterday` : undefined;

  return (
    <KPICard
      title={meta.label}
      value={displayValue}
      icon={meta.icon}
      iconColor={meta.color}
      subtext={subtext}
      trend={deltaType === 'up' ? 'up' : deltaType === 'down' ? 'down' : 'neutral'}
    />
  );
}

const SEVERITY_STYLES = {
  INFO: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: Activity },
  WARNING: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
  CRITICAL: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: ShieldAlert },
};

const getRelativeTime = (isoStr) => {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

function AlertRow({ alert }) {
  const relTime = getRelativeTime(alert.createdAt);
  
  let bgClass = 'bg-blue-50/70 border-blue-100';
  let iconClass = 'text-blue-600';
  let Icon = Activity;
  
  if (alert.severity === 'CRITICAL') {
    bgClass = 'bg-rose-50/70 border-rose-100';
    iconClass = 'text-rose-600';
    Icon = ShieldAlert;
  } else if (alert.severity === 'WARNING') {
    bgClass = 'bg-amber-50/70 border-amber-100';
    iconClass = 'text-amber-600';
    Icon = AlertTriangle;
  }

  return (
    <div className={`flex gap-3.5 p-4 rounded-xl border mb-3 last:mb-0 ${bgClass}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[13px] font-bold text-gray-900">{alert.title}</span>
          <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap ml-2">{relTime}</span>
        </div>
        <p className="text-[12px] font-medium text-gray-600 leading-relaxed line-clamp-2">{alert.description}</p>
      </div>
    </div>
  );
}

function DashboardChart({ chartType, data, label }) {
  const CHART_COLOR = '#3B82F6';
  const CHART_COLOR_2 = '#10B981';

  const CustomTooltip = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{lbl}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.name?.includes('Revenue') || p.name?.includes('₹')
              ? `₹${Number(p.value).toLocaleString('en-IN')}`
              : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      {chartType === 'bar' ? (
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Sales Revenue" fill={CHART_COLOR} radius={[6, 6, 0, 0]}
            activeBar={{ fill: '#1D4ED8' }} />
        </BarChart>
      ) : chartType === 'area' ? (
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" name="Sales Revenue" stroke={CHART_COLOR} strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: '#fff', stroke: CHART_COLOR, strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </AreaChart>
      ) : chartType === 'line' ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Line dataKey="value" name="Sales (₹)" stroke={CHART_COLOR} strokeWidth={2.5}
            dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} />
        </LineChart>
      ) : chartType === 'dualBar' ? (
        <BarChart data={data} barSize={20} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Inflow" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="secondary" name="Outflow" fill={CHART_COLOR_2} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : null}
    </ResponsiveContainer>
  );
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getFormattedDate = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


export default function AdminDashboard() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const [dayCloseOpen, setDayCloseOpen] = useState(false);

  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.SYSTEM_ADMIN;

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard').then(r => r.data?.data ?? {}),
    staleTime: 2000,
    refetchInterval: 60000,
    enabled: !!activeRole
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard/chart-data?days=7').then(r => r.data?.data ?? []),
    staleTime: 5000,
    refetchInterval: 60000,
    enabled: !!activeRole
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard/alerts').then(r => r.data?.data ?? []),
    staleTime: 2000,
    refetchInterval: 60000,
    enabled: !!activeRole
  });

  const { data: revenueStrip, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard/revenue-strip').then(r => r.data?.data ?? {}),
    staleTime: 5000,
    refetchInterval: 60000,
    enabled: !!activeRole
  });

  const handleAction = (actionName) => {
    if (actionName === 'printDayReport' || actionName === 'printReceipt' || actionName === 'printBill') {
      window.print();
    } else if (actionName === 'scrollToAlerts') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (actionName === 'dayClose') {
      setDayCloseOpen(true);
    }
  };

  const mappedQuickActions = config.quickActions.map(action => ({
    label: action.label,
    icon: action.icon,
    color: 'text-[#2563eb]',
    bg: 'bg-[#2563eb]/10',
    action: () => action.path ? navigate(action.path) : handleAction(action.action)
  }));

  return (
    <>
    <DashboardShell
      quickActions={mappedQuickActions}
    >
      <div className="flex-1 overflow-y-auto pr-2 pb-6 min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 m-0 tracking-tight">
            {getGreeting()}, {config.greeting}.
          </h1>
          <p className="text-[14px] font-medium text-slate-500 m-0 mt-1.5">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-700">
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 
                          rounded-full px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{getFormattedDate()}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2 
                          shadow-sm">
            <svg className="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
            <span className="truncate">{user?.branch || 'Main Branch'}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        {config.kpiKeys.map(key => (
          <AdminKpiWrapper
            key={key}
            kpiKey={key}
            value={kpiData?.[key]}
            delta={kpiData?.deltas?.[key]}
            deltaType={kpiData?.deltaTypes?.[key]}
          />
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart (3/5 width) */}
        <div className="xl:col-span-3 bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-bold text-gray-900">{config.chartLabel}</h3>
            <div className="flex items-center gap-3">
              <button className="text-[13px] text-blue-600 font-semibold hover:text-blue-700">
                Operational breakdown
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
              </button>
            </div>
          </div>
          {chartData?.length ? (
            <DashboardChart chartType={config.chartType} data={chartData} label={config.chartLabel} />
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent 
                              rounded-full animate-spin" />
            </div>
          )}
          {config.chartType === 'area' && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-[12px] font-semibold text-slate-700">Sales Revenue (₹)</span>
            </div>
          )}
        </div>

        {/* Alerts panel (2/5 width) */}
        <div className="xl:col-span-2 bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-bold text-gray-900">Active System Alerts</h3>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-gray-500 font-medium">
                {alerts?.length ?? 0} sources monitored
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
              </button>
            </div>
          </div>
          <div className="space-y-0 overflow-y-auto flex-1 pr-1 min-h-[220px]">
            {alerts?.length ? (
              alerts.slice(0, 6).map(alert => <AlertRow key={alert.id} alert={alert} />)
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No active alerts</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <button className="text-[13px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
              View all alerts
            </button>
            <button className="text-blue-700 hover:text-blue-800">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Strip */}
      {activeRole !== 'SYSTEM_ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { label: "TODAY'S REVENUE", key: 'todayRevenue' },
            { label: "THIS WEEK'S REVENUE", key: 'weekRevenue' },
            { label: "THIS MONTH'S REVENUE", key: 'monthRevenue' },
          ].map(({ label, key }) => (
            <div key={key} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                {label}
              </p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {revenueStrip?.[key] != null
                  ? `₹${Number(revenueStrip[key]).toLocaleString('en-IN')}`
                  : <span className="inline-block h-8 w-28 bg-gray-100 rounded animate-pulse" />}
              </p>
            </div>
          ))}
        </div>
      )}
      </div>
    </DashboardShell>

    {dayCloseOpen && <DayCloseModal onClose={() => setDayCloseOpen(false)} />}
    </>
  );
}
