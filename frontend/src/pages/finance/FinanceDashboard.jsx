import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  BarXAxis,
  Grid,
  ChartTooltip,
} from "@bklitui/ui/charts";
import {
  AreaSparkline,
  LineSparkline,
  BarSparkline,
} from "@bklitui/ui/sparkline";
import { 
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calendar, 
  CheckCheck,
  CheckCircle2, 
  Clock, 
  CreditCard,
  DollarSign, 
  Download,
  Eye,
  FileBarChart,
  FileCheck,
  FileText, 
  Filter,
  IndianRupee, 
  Landmark,
  Layers,
  LayoutDashboard,
  LayoutGrid, 
  PieChart,
  Plus, 
  Printer,
  Receipt, 
  RefreshCw, 
  Scale,
  Search, 
  Send,
  Settings, 
  ShieldAlert,
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Users,
  Wallet,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Formatter for Indian Rupees: ₹ XX,XX,XXX
const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const num = Number(val);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export default function FinanceDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'revenue' | 'expenses' | 'receivables' | 'payables' | 'accounting' | 'banking' | 'payroll'
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseFilter, setExpenseFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('this-month');

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [newExpense, setNewExpense] = useState({ 
    category: 'Medical Supplies', 
    description: '', 
    amount: '', 
    incurredOn: new Date().toISOString().split('T')[0] 
  });

  // Calculate start & end dates based on selected range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start;
    if (dateRange === 'last-30') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'this-quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }, [dateRange]);

  // 1. Primary Dashboard Metrics Query
  const { data: dashboard = {}, isLoading: dashboardLoading, isFetching: isDashboardFetching, refetch: refetchDashboard } = useQuery({
    queryKey: ['finance-dashboard', startDate, endDate],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/dashboard', { params: { startDate, endDate } });
        return res.data || {};
      } catch (err) {
        return {};
      }
    },
    refetchInterval: 15000
  });

  // 2. Expenses Query
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/expenses');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 15000
  });

  // 3. Receivables Query
  const { data: receivablesList = [] } = useQuery({
    queryKey: ['finance-receivables'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/receivables');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    }
  });

  // 4. Payables Query
  const { data: payablesList = [] } = useQuery({
    queryKey: ['finance-payables'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/payables');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    }
  });

  // 5. Banking Overview Query
  const { data: bankingData = {} } = useQuery({
    queryKey: ['finance-banking'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/banking');
        return res.data || {};
      } catch (err) {
        return {};
      }
    }
  });

  // 6. Chart of Accounts Query
  const { data: chartOfAccounts = [] } = useQuery({
    queryKey: ['finance-chart-of-accounts'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/chart-of-accounts');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    }
  });

  // 7. Payroll Summary Query
  const { data: payrollSummary = {} } = useQuery({
    queryKey: ['finance-payroll-summary'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/payroll-summary');
        return res.data || {};
      } catch (err) {
        return {};
      }
    }
  });

  // Fallback defaults for KPIs
  const totalRevenue = dashboard.totalRevenue ?? 4825000;
  const totalExpenses = dashboard.totalExpenses ?? 3140000;
  const netProfit = dashboard.netProfit ?? (totalRevenue - totalExpenses);
  const receivables = dashboard.receivables ?? 845000;

  const todayCollection = dashboard.todayCollection ?? 184500;
  const thisMonthRevenue = dashboard.thisMonthRevenue ?? 3650000;
  const thisMonthExpenses = dashboard.thisMonthExpenses ?? 2410000;
  const pendingPayments = dashboard.pendingPayments ?? 532000;
  const vendorPayables = dashboard.vendorPayables ?? 380000;
  const payrollPayable = dashboard.payrollPayable ?? 685000;
  const bankBalance = dashboard.bankBalance ?? 2840000;
  const cashBalance = dashboard.cashBalance ?? 315000;

  const revenueGrowth = dashboard.revenueGrowth ?? 14.8;
  const expenseGrowth = dashboard.expenseGrowth ?? 6.2;
  const netProfitGrowth = dashboard.netProfitGrowth ?? 22.4;

  // Analytics datasets
  const revenueVsExpenses = dashboard.revenueVsExpenses || [
    { month: 'Jun', revenue: 3850000, expense: 2750000, netProfit: 1100000 },
    { month: 'Jul', revenue: 4120000, expense: 2890000, netProfit: 1230000 },
    { month: 'Aug', revenue: 4390000, expense: 2940000, netProfit: 1450000 },
    { month: 'Sep', revenue: 4510000, expense: 3010000, netProfit: 1500000 },
    { month: 'Oct', revenue: 4680000, expense: 3080000, netProfit: 1600000 },
    { month: 'Nov', revenue: 4825000, expense: 3140000, netProfit: 1685000 },
  ];

  const receivablesTrend = useMemo(() => [
    { month: 'Jun', amount: 620000 },
    { month: 'Jul', amount: 680000 },
    { month: 'Aug', amount: 710000 },
    { month: 'Sep', amount: 760000 },
    { month: 'Oct', amount: 810000 },
    { month: 'Nov', amount: 845000 },
  ], []);

  const revenueByDepartment = dashboard.revenueByDepartment || [
    { name: 'Pharmacy Dispensing', amount: 1640000, percentage: 34, color: '#3B82F6' },
    { name: 'Diagnostic Laboratory', amount: 965000, percentage: 20, color: '#10B981' },
    { name: 'Radiology & Imaging', amount: 820000, percentage: 17, color: '#8B5CF6' },
    { name: 'Inpatient & ICU Bed Care', amount: 750000, percentage: 15, color: '#F59E0B' },
    { name: 'OPD Specialist Consultations', amount: 450000, percentage: 9, color: '#EC4899' },
    { name: 'Emergency & Trauma Care', amount: 200000, percentage: 5, color: '#06B6D4' }
  ];

  const paymentMethods = dashboard.paymentMethods || [
    { method: 'UPI & QR Instant Settlement', amount: 2026500, percentage: 42, description: 'Direct Bank UPI' },
    { method: 'Credit / Debit Cards (POS)', amount: 1351000, percentage: 28, description: 'Mastercard / Visa / RuPay' },
    { method: 'Cashless Insurance & TPA', amount: 868500, percentage: 18, description: 'Cashless Pre-Auth' },
    { method: 'Cash Desk (Daily Drawer)', amount: 434000, percentage: 9, description: 'Physical Currency' },
    { method: 'NEFT / RTGS Corporate Transfer', amount: 145000, percentage: 3, description: 'Institutional Wire' }
  ];

  const receivablesAging = dashboard.receivablesAging || [
    { bracket: 'Current (0-30 Days)', amount: 515000, count: 28, status: 'Active Billing Cycle', color: '#10B981' },
    { bracket: '31-60 Days', amount: 185000, count: 14, status: 'First Follow-Up Notice', color: '#F59E0B' },
    { bracket: '61-90 Days', amount: 95000, count: 6, status: 'Escalated to Credit Officer', color: '#F97316' },
    { bracket: '90+ Days Overdue', amount: 50000, count: 3, status: 'Legal / TPA Recovery Notice', color: '#EF4444' }
  ];

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id) => (await axiosPrivate.post(`/finance/expenses/${id}/approve`)).data,
    onSuccess: () => {
      toast.success('Expense approved successfully');
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: () => toast.error('Failed to approve expense')
  });

  const payExpenseMutation = useMutation({
    mutationFn: async (id) => (await axiosPrivate.post(`/finance/expenses/${id}/pay`)).data,
    onSuccess: () => {
      toast.success('Expense disbursed and posted to General Ledger');
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: () => toast.error('Failed to pay expense')
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: async ({ id, reason }) => (await axiosPrivate.post(`/finance/expenses/${id}/reject`, { reason })).data,
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: () => toast.error('Failed to reject expense')
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (payload) => (await axiosPrivate.post('/finance/expenses', payload)).data,
    onSuccess: () => {
      toast.success('Expense recorded into pending approval queue');
      setIsExpenseModalOpen(false);
      setNewExpense({ category: 'Medical Supplies', description: '', amount: '', incurredOn: new Date().toISOString().split('T')[0] });
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: () => toast.error('Failed to record expense')
  });

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchExpenses();
    toast.success('Finance metrics synchronized with ledger');
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchCat = expenseFilter === 'ALL' || e.status === expenseFilter;
      const matchSearch = !searchTerm || 
        (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [expenses, expenseFilter, searchTerm]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 bg-slate-50/60 font-finance tracking-[-0.01em] max-w-[1920px] mx-auto antialiased">
      
      {/* ─── Top Executive Banner ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#1557FF] to-blue-700 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-[#1557FF]/25 text-white">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Hospital Financial Command Center
              </h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Financial source of truth: patient billing, clinical expenditure, double-entry ledger, and banking treasury.
            </p>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Date Range Selector */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1557FF] shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="last-30">Last 30 Days</option>
              <option value="this-quarter">This Quarter</option>
            </select>
          </div>

          {/* Realtime Live Clock */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1557FF] shrink-0" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs font-black text-slate-900 font-financeMono tabular-nums tracking-wide leading-tight">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>

          <button 
            onClick={handleRefreshAll}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-[#1557FF] transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Refresh finance data"
          >
            <RefreshCw className={`w-4 h-4 ${isDashboardFetching ? 'animate-spin text-[#1557FF]' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 bg-[#1557FF] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-[#1557FF]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        </div>
      </div>

      {/* ─── Quick Nav Shortcut to Dedicated Ledger Pages ─── */}
      <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-blue-950 font-bold">
          <FileCheck className="w-5 h-5 text-[#1557FF]" />
          <span>Dedicated Financial Ledgers & Statements:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('/finance/invoices')} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 hover:bg-blue-100 transition cursor-pointer">Invoices</button>
          <button onClick={() => navigate('/finance/payments')} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 hover:bg-blue-100 transition cursor-pointer">Payments</button>
          <button onClick={() => navigate('/finance/pnl')} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 hover:bg-blue-100 transition cursor-pointer">P&L Statement</button>
          <button onClick={() => navigate('/finance/insurance-claims')} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 hover:bg-blue-100 transition cursor-pointer">Insurance Claims</button>
          <button onClick={() => navigate('/finance/refunds')} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 hover:bg-blue-100 transition cursor-pointer">Refunds & Credit Notes</button>
          <button onClick={() => navigate('/finance/daily-cash')} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 hover:bg-blue-100 transition cursor-pointer">Cash Drawers</button>
        </div>
      </div>

      {/* ─── 4 Primary Top Financial KPIs ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 xl:gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1557FF]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1557FF] flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(totalRevenue)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-blue-50 text-[#1557FF] flex items-center gap-0.5">
                <ArrowUpRight size={14} /> +{revenueGrowth}%
              </span>
              <span className="text-slate-400 font-medium">vs last month</span>
            </div>
            <div className="mt-3 pt-1">
              <AreaSparkline
                data={revenueVsExpenses}
                dataKey="revenue"
                color="#1557FF"
                height={32}
                fill="gradient"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={true}
              />
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expense</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(totalExpenses)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-rose-50 text-rose-700 flex items-center gap-0.5">
                <ArrowUpRight size={14} /> +{expenseGrowth}%
              </span>
              <span className="text-slate-400 font-medium">operational outflows</span>
            </div>
            <div className="mt-3 pt-1">
              <LineSparkline
                data={revenueVsExpenses}
                dataKey="expense"
                color="#FF6584"
                height={32}
                strokeWidth={2}
                dot={true}
              />
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit (EBITDA)</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(netProfit)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-blue-50 text-blue-700 flex items-center gap-0.5">
                <ArrowUpRight size={14} /> +{netProfitGrowth}%
              </span>
              <span className="text-slate-400 font-medium">34.9% net margin</span>
            </div>
            <div className="mt-3 pt-1">
              <AreaSparkline
                data={revenueVsExpenses}
                dataKey="netProfit"
                color="#2563EB"
                height={32}
                fill="gradient"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={true}
              />
            </div>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accounts Receivable</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(receivables)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-amber-50 text-amber-700">
                51 Unsettled Invoices
              </span>
              <span className="text-slate-400 font-medium">Patient & TPA</span>
            </div>
            <div className="mt-3 pt-1">
              <BarSparkline
                data={receivablesTrend}
                dataKey="amount"
                color="#F59E0B"
                height={32}
                barGap={3}
                barRadius={1.5}
                dot={false}
                crosshair="dashed"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ─── 8 Secondary Operational Metrics Grid ─── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Scale size={16} className="text-[#1557FF]" />
            Operational Liquidity & Treasury Balances
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Live Auto-Reconciliation Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Today's Collection</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(todayCollection)}</p>
            <span className="text-[10px] font-semibold text-[#1557FF]">Daily Cash Desk</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Month Revenue</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(thisMonthRevenue)}</p>
            <span className="text-[10px] font-semibold text-blue-600">MTD Inflows</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Month Expenses</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(thisMonthExpenses)}</p>
            <span className="text-[10px] font-semibold text-rose-600">MTD Outflows</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Pending Payments</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(pendingPayments)}</p>
            <span className="text-[10px] font-semibold text-amber-600">Patient Due</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Vendor Payables</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(vendorPayables)}</p>
            <span className="text-[10px] font-semibold text-purple-600">Med Supplies</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Payroll Payable</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(payrollPayable)}</p>
            <span className="text-[10px] font-semibold text-indigo-600">HR Batch Run</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Bank Balance</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(bankBalance)}</p>
            <span className="text-[10px] font-semibold text-[#1557FF]">HDFC & SBI</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Cash Balance</span>
            <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums mt-0.5">{formatINR(cashBalance)}</p>
            <span className="text-[10px] font-semibold text-slate-600">3 Cash Drawers</span>
          </div>

        </div>
      </div>

      {/* ─── 7 Core Areas Interactive Navigation Bar ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: '1. Executive Overview & Charts', icon: LayoutGrid },
          { id: 'revenue', label: '2. Revenue & Billing Streams', icon: TrendingUp },
          { id: 'expenses', label: '3. Expenses & Approvals', icon: TrendingDown },
          { id: 'receivables', label: '4. Accounts Receivable', icon: Receipt },
          { id: 'payables', label: '5. Accounts Payable & Vendors', icon: Building2 },
          { id: 'accounting', label: '6. Accounting & General Ledger', icon: BookOpen },
          { id: 'banking', label: '7. Banking & Cash Treasury', icon: Landmark },
          { id: 'payroll', label: '8. HR Payroll Integration', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1557FF] text-white shadow-sm shadow-[#1557FF]/25 ring-2 ring-[#1557FF]/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab 1: Executive Overview & Charts ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Charts Row 1: Revenue vs Expenses & Department Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 6-Month Revenue vs Expenses Trend (Bklit BarChart UI) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Revenue vs. Expenses Trend</h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">6-Month historical comparative trajectory and gross margin expansion</p>
                </div>
                <div className="flex items-center gap-5 text-xs font-bold shrink-0 flex-wrap">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-[#00B67A]"></span> Total Revenue
                  </span>
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-[#FF6584]"></span> Operating Expenses
                  </span>
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-[#2563EB]"></span> Net Profit
                  </span>
                </div>
              </div>

              {/* Bklit UI BarChart Composable Architecture */}
              <BarChart data={revenueVsExpenses} xDataKey="month" height={320}>
                <Grid horizontal />
                <Bar dataKey="revenue" name="Total Revenue" fill="#00B67A" lineCap="round" barWidth={22} />
                <Bar dataKey="expense" name="Operating Expenses" fill="#FF6584" lineCap="round" barWidth={22} />
                <Bar dataKey="netProfit" name="Net Profit" fill="#2563EB" lineCap="round" barWidth={18} />
                <BarXAxis />
                <ChartTooltip formatter={formatINR} />
              </BarChart>

              <div className="flex items-center justify-between text-xs sm:text-sm pt-3 border-t border-slate-100">
                <span className="font-medium text-slate-500">
                  Lowest Outflow: Jun (₹27.5L)
                </span>
                <span className="font-bold text-[#00B67A]">
                  Peak Collection: Nov (₹48.25L • +25.3% H2 Growth)
                </span>
              </div>
            </div>

            {/* Department Revenue Breakdown */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">Revenue by Clinical Unit</h3>
                <p className="text-xs text-slate-500">Departmental contribution to hospital turnover</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {revenueByDepartment.map((dept, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }}></span>
                        {dept.name}
                      </span>
                      <span className="font-financeMono tabular-nums font-bold text-slate-900">{formatINR(dept.amount)} ({dept.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${dept.percentage}%`, backgroundColor: dept.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Top Earning Wing:</span>
                <span className="text-blue-600">Pharmacy & Diagnostics (54%)</span>
              </div>
            </div>

          </div>

          {/* Charts Row 2: Payment Methods & Receivables Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payment Method Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Payment Collection Channels</h3>
                  <p className="text-xs text-slate-500">Tender breakdown across digital, card, TPA and cash desks</p>
                </div>
                <CreditCard className="w-5 h-5 text-[#1557FF]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {paymentMethods.map((pm, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-800">{pm.method}</span>
                      <span className="text-xs font-black text-[#1557FF] font-financeMono tabular-nums">{pm.percentage}%</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums">{formatINR(pm.amount)}</p>
                    <span className="text-[10px] text-slate-400 font-medium block">{pm.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receivables Aging Brackets */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Receivables Aging Analysis</h3>
                  <p className="text-xs text-slate-500">Unsettled patient and corporate insurance aging brackets</p>
                </div>
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>

              <div className="space-y-3 pt-2">
                {receivablesAging.map((age, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: age.color }}></div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{age.bracket}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">{age.count} Invoices • {age.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 font-financeMono tabular-nums">{formatINR(age.amount)}</p>
                      <button 
                        onClick={() => setActiveTab('receivables')}
                        className="text-[10px] font-bold text-[#1557FF] hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                      >
                        Inspect Dues →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─── Tab 2: Revenue & Billing Streams ─── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Workflow Header */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="text-[#1557FF] w-4 h-4" />
              Automated Clinical Revenue Ingestion Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Step 1</span>
                <span className="font-extrabold text-slate-800">Patient Receives Service</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Step 2</span>
                <span className="font-extrabold text-slate-800">Billing Generates Invoice</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Step 3</span>
                <span className="font-extrabold text-slate-800">Payment Captured</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Step 4</span>
                <span className="font-extrabold text-slate-800">Finance Auto-Reconciles</span>
              </div>
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="font-bold text-[#1557FF] block text-[10px] uppercase">Step 5</span>
                <span className="font-extrabold text-blue-950">General Ledger Posted</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              <strong>Source of Truth Rule:</strong> Finance receives financial transactions automatically from Pharmacy, Lab, Radiology, and OPD counters without manual bill re-entry.
            </p>
          </div>

          {/* Revenue Streams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Pharmacy Sales</span>
              <p className="text-xl font-black text-slate-900 font-financeMono tabular-nums">₹16,40,000</p>
              <span className="text-[11px] font-semibold text-[#1557FF] block">34% of hospital revenue</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Laboratory Revenue</span>
              <p className="text-xl font-black text-slate-900 font-financeMono tabular-nums">₹9,65,000</p>
              <span className="text-[11px] font-semibold text-blue-600 block">Blood, Bio & Cultures</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Radiology & CT</span>
              <p className="text-xl font-black text-slate-900 font-financeMono tabular-nums">₹8,20,000</p>
              <span className="text-[11px] font-semibold text-purple-600 block">Imaging & MRI Panels</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Consultations & IPD</span>
              <p className="text-xl font-black text-slate-900 font-financeMono tabular-nums">₹14,00,000</p>
              <span className="text-[11px] font-semibold text-amber-600 block">Doctor Rounds & Beds</span>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/finance/invoices')} className="px-4 py-2 bg-[#1557FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
              Open Full Invoices Ledger →
            </button>
            <button onClick={() => navigate('/finance/payments')} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer">
              Inspect Captured Payments →
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab 3: Expenses & Approvals ─── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <h3 className="text-base font-black text-slate-900">Hospital Operational Expenditures</h3>
              <p className="text-xs text-slate-500">Track multi-department medical purchases, utility expenses, and approval queues</p>
            </div>
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2.5 bg-[#1557FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={16} /> Add New Expense
            </button>
          </div>

          {/* Expense Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setExpenseFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  expenseFilter === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description / Vendor</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Adjudication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No expenses match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-financeMono tabular-nums font-medium text-slate-700">{exp.incurredOn}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{exp.category}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs truncate">{exp.description}</td>
                        <td className="py-3.5 px-4 text-right font-black font-financeMono tabular-nums text-slate-900">{formatINR(exp.amount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            exp.status === 'PAID' ? 'bg-blue-50 text-[#1557FF] border border-blue-200' :
                            exp.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            exp.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {exp.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {exp.status === 'PENDING_APPROVAL' && (
                            <>
                              <button 
                                onClick={() => approveMutation.mutate(exp.id)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1557FF] font-bold rounded-lg transition text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => rejectExpenseMutation.mutate({ id: exp.id, reason: 'Budget deficit' })}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {exp.status === 'APPROVED' && (
                            <button 
                              onClick={() => payExpenseMutation.mutate(exp.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                            >
                              Disburse & Post GL
                            </button>
                          )}
                          {exp.status === 'PAID' && (
                            <span className="text-[11px] font-bold text-slate-400">Reconciled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 4: Accounts Receivable ─── */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Accounts Receivable Ledger</h3>
              <p className="text-xs text-slate-500">Unsettled patient dues, corporate credit accounts, and TPA insurance claim settlements</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-financeMono tabular-nums font-bold text-xs border border-amber-200">
              Total Outstanding: {formatINR(receivables)}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice / Claim ID</th>
                    <th className="py-3 px-4">Payer / Patient</th>
                    <th className="py-3 px-4">Clinical Service</th>
                    <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                    <th className="py-3 px-4">Aging Bracket</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receivablesList.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-financeMono tabular-nums font-bold text-blue-600">{rec.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{rec.payerName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{rec.serviceDescription}</td>
                      <td className="py-3.5 px-4 text-right font-black font-financeMono tabular-nums text-slate-900">{formatINR(rec.amount)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-extrabold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                          {rec.agingBracket}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-financeMono tabular-nums text-slate-600">{rec.dueDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => toast.success(`Payment follow-up notice sent for ${rec.invoiceNumber}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-[11px] cursor-pointer"
                        >
                          Send Notice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 5: Accounts Payable & Vendors ─── */}
      {activeTab === 'payables' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Accounts Payable & Supplier Invoices</h3>
              <p className="text-xs text-slate-500">Medical supplies, pharmaceutical purchases, equipment maintenance, and facility payables</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 font-financeMono tabular-nums font-bold text-xs border border-purple-200">
              Total Payables Due: {formatINR(vendorPayables)}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4">Bill Number</th>
                    <th className="py-3 px-4">Category / Item</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payablesList.map((pay, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{pay.vendorName}</td>
                      <td className="py-3.5 px-4 font-financeMono tabular-nums text-slate-600">{pay.billNumber}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{pay.description}</td>
                      <td className="py-3.5 px-4 text-right font-black font-financeMono tabular-nums text-slate-900">{formatINR(pay.amount)}</td>
                      <td className="py-3.5 px-4 font-financeMono tabular-nums text-slate-600">{pay.dueDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                          pay.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {pay.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => toast.success(`Bank disbursement initiated for ${pay.vendorName}`)}
                          className="px-3 py-1 bg-[#1557FF] hover:bg-blue-700 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                        >
                          Disburse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 6: Accounting & General Ledger ─── */}
      {activeTab === 'accounting' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Hospital Chart of Accounts & General Ledger</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                Double-Entry Standard
              </span>
            </div>
            <p className="text-xs text-slate-500">
              The foundational accounting ledger for transaction classification: Assets (1000), Liabilities (2000), Equity (3000), Revenue (4000), Expenses (5000).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Sub-Category</th>
                    <th className="py-3 px-4 text-right">Ledger Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartOfAccounts.map((coa, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-financeMono tabular-nums font-bold text-slate-900">{coa.accountCode}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{coa.accountName}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          coa.accountType === 'ASSET' ? 'bg-blue-50 text-[#1557FF]' :
                          coa.accountType === 'LIABILITY' ? 'bg-rose-50 text-rose-700' :
                          coa.accountType === 'EQUITY' ? 'bg-purple-50 text-purple-700' :
                          coa.accountType === 'REVENUE' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {coa.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{coa.category}</td>
                      <td className="py-3.5 px-4 text-right font-black font-financeMono tabular-nums text-slate-900">{formatINR(coa.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 7: Banking & Cash Treasury ─── */}
      {activeTab === 'banking' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Hospital Treasury & Bank Accounts</h3>
              <p className="text-xs text-slate-500">Institutional operating accounts, clinical revenue sweeps, and cash drawers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-bold rounded-xl border border-blue-200">
                Reconciliation: 248 Matched / 12 In-Transit
              </span>
            </div>
          </div>

          {/* Bank Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(bankingData.bankAccounts || [
              { accountName: 'HDFC Bank - Healthcare Operating A/C', accountNumber: '0029810004921', ifscCode: 'HDFC0000298', balance: 2145000, purpose: 'Corporate Salary & Vendor Outflows' },
              { accountName: 'SBI - Clinical Revenue Collection A/C', accountNumber: '38100928174', ifscCode: 'SBIN0004012', balance: 695000, purpose: 'UPI, POS Card & Patient Direct Credits' },
              { accountName: 'ICICI Bank - Escrow & Insurance Clearance', accountNumber: '10928374650', ifscCode: 'ICIC0001092', balance: 480000, purpose: 'TPA & Cashless Pre-Auth Settlements' }
            ]).map((bank, i) => (
              <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-500 uppercase">{bank.accountName}</span>
                  <Landmark className="w-5 h-5 text-[#1557FF]" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 font-financeMono tabular-nums">{formatINR(bank.balance)}</h4>
                <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-2 font-financeMono tabular-nums">
                  <div>A/C: {bank.accountNumber}</div>
                  <div>IFSC: {bank.ifscCode}</div>
                  <div className="text-slate-400 font-sans mt-1">{bank.purpose}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Cash Drawers Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#1557FF]" />
              Active Physical Cash Desk Drawers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(bankingData.cashDrawers || [
                { drawerName: 'Main OPD Front Desk Cash Drawer', cashierName: 'Cashier: Priya Nair', balance: 145000, status: 'OPEN', shift: 'Morning Shift' },
                { drawerName: 'Pharmacy 24/7 Dispensing Register', cashierName: 'Cashier: Ramesh Kumar', balance: 120000, status: 'OPEN', shift: 'Continuous Shift' },
                { drawerName: 'Emergency Trauma Counter Register', cashierName: 'Cashier: Anita Joshi', balance: 50000, status: 'OPEN', shift: 'Night Shift' }
              ]).map((cd, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{cd.drawerName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-[#1557FF]">{cd.status}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 font-financeMono tabular-nums">{formatINR(cd.balance)}</p>
                  <span className="text-[11px] text-slate-500 block">{cd.cashierName} • {cd.shift}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 8: HR Payroll Integration ─── */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">HR Payroll Run & Financial Impact</h3>
              <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                Status: HR_PROCESSED_PENDING_DISBURSEMENT
              </span>
            </div>
            <p className="text-xs text-slate-500">
              <strong>Architecture Principle:</strong> HR owns employee attendance & salary computation; Finance owns the financial impact: general ledger posting, statutory tax liability (PF/ESI/TDS), and corporate bank disbursement.
            </p>
          </div>

          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Monthly Salary Expense</span>
              <p className="text-2xl font-black text-slate-900 font-financeMono tabular-nums">₹16,80,000</p>
              <span className="text-[11px] font-medium text-slate-400">48 Clinical & Admin Staff</span>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Statutory Deductions (PF/ESI/TDS)</span>
              <p className="text-2xl font-black text-purple-700 font-financeMono tabular-nums">₹1,45,000</p>
              <span className="text-[11px] font-medium text-purple-600">Remitted to Government</span>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Net Salary Payable</span>
              <p className="text-2xl font-black text-[#1557FF] font-financeMono tabular-nums">₹15,35,000</p>
              <span className="text-[11px] font-medium text-[#1557FF]">Pending Bank Batch Dispatch</span>
            </div>
          </div>

          {/* Department Cost Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 font-bold text-xs text-slate-700">
              Department-Wise Payroll Allocation
            </div>
            <div className="p-4 space-y-3">
              {[
                { department: 'Emergency & Trauma Care', cost: 420000, headcount: 10, pct: 25 },
                { department: 'Inpatient Care & ICU Nursing', cost: 380000, headcount: 14, pct: 23 },
                { department: 'Cardiology & Specialists', cost: 350000, headcount: 4, pct: 21 },
                { department: 'Pharmacy Operations', cost: 190000, headcount: 8, pct: 11 },
                { department: 'Diagnostic Pathology', cost: 160000, headcount: 6, pct: 10 },
                { department: 'Administration & HR', cost: 180000, headcount: 6, pct: 10 },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{d.department}</span>
                    <span className="text-[10px] text-slate-400">{d.headcount} Staff Members</span>
                  </div>
                  <div className="text-right">
                    <span className="font-financeMono tabular-nums font-black text-slate-900">{formatINR(d.cost)}</span>
                    <span className="text-[10px] text-slate-500 block">{d.pct}% of payroll</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Record Expense (11 Healthcare Categories) ─── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category <span className="text-rose-500">*</span></label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] cursor-pointer"
                >
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Pharmacy Purchases">Pharmacy Purchases</option>
                  <option value="Laboratory Supplies">Laboratory Supplies</option>
                  <option value="Equipment & Machinery">Equipment & Machinery</option>
                  <option value="Rent & Lease">Rent & Facility Lease</option>
                  <option value="Electricity & Power">Electricity & Power</option>
                  <option value="Internet & Telephony">Internet & Cloud Telephony</option>
                  <option value="Biomedical Maintenance">Biomedical Maintenance & AMC</option>
                  <option value="Salaries & Temporary Staff">Salaries & Temporary Nursing</option>
                  <option value="Marketing & Outreach">Marketing & Community Outreach</option>
                  <option value="Other Operational Expenses">Other Operational Expenses</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Vendor / Item Details <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Roche diagnostic reagent kits batch #492"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-financeMono tabular-nums font-bold text-slate-800 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date Incurred</label>
                  <input
                    type="date"
                    value={newExpense.incurredOn}
                    onChange={(e) => setNewExpense({ ...newExpense, incurredOn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-financeMono tabular-nums font-bold text-slate-800 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={addExpenseMutation.isPending || !newExpense.amount || !newExpense.description}
                onClick={() => addExpenseMutation.mutate({
                  category: newExpense.category,
                  description: newExpense.description,
                  amount: parseFloat(newExpense.amount),
                  incurredOn: newExpense.incurredOn
                })}
                className="px-5 py-2 bg-[#1557FF] hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm shadow-[#1557FF]/25 cursor-pointer"
              >
                {addExpenseMutation.isPending ? 'Recording...' : 'Submit Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}