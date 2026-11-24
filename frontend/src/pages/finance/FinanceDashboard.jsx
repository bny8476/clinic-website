import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowRight,
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  DollarSign, 
  FileText, 
  Filter,
  IndianRupee, 
  LayoutGrid, 
  Plus, 
  Receipt, 
  RefreshCw, 
  Search, 
  Settings, 
  ShieldAlert,
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FinanceDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('this-month');

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [newExpense, setNewExpense] = useState({ 
    category: '', 
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
      // this-month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }, [dateRange]);

  // Realtime Dashboard Metrics Query
  const { data: dashboard = {}, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['finance-dashboard', startDate, endDate],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/dashboard', { params: { startDate, endDate } });
        return res.data || {};
      } catch (err) {
        return {};
      }
    },
    refetchInterval: 15000 // Realtime 15s auto-refresh
  });

  // Expenses Query
  const { data: expenses = [], isLoading: expensesLoading, isRefetching: expensesRefetching, refetch: refetchExpenses } = useQuery({
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

  const totalRevenue = dashboard.totalRevenue || 0;
  const totalExpenses = dashboard.totalExpenses || 0;
  const netIncome = dashboard.netProfit !== undefined ? dashboard.netProfit : (totalRevenue - totalExpenses);

  // Growth percentages (dynamic or fallback to 0)
  const revenueGrowth = dashboard.revenueGrowth || 0;
  const expenseGrowth = dashboard.expenseGrowth || 0;
  const netGrowth = dashboard.netProfitGrowth || 0;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).id : 1;
      return await axiosPrivate.post(`/finance/expenses/${id}/approve?approverId=${userId}`);
    },
    onSuccess: () => {
      toast.success('Expense approved successfully');
      queryClient.invalidateQueries(['finance-expenses']);
      queryClient.invalidateQueries(['finance-dashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve expense');
    }
  });

  const payMutation = useMutation({
    mutationFn: async (id) => {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).id : 1;
      return await axiosPrivate.post(`/finance/expenses/${id}/pay?payerId=${userId}`);
    },
    onSuccess: () => {
      toast.success('Expense marked as Paid & posted to General Ledger');
      queryClient.invalidateQueries(['finance-expenses']);
      queryClient.invalidateQueries(['finance-dashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).id : 1;
      return await axiosPrivate.post(`/finance/expenses/${id}/reject?approverId=${userId}`, { reason: reason || 'Not approved' });
    },
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries(['finance-expenses']);
      queryClient.invalidateQueries(['finance-dashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject expense');
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      return await axiosPrivate.post('/finance/expenses', expenseData);
    },
    onSuccess: () => {
      toast.success('Expense recorded successfully');
      queryClient.invalidateQueries(['finance-expenses']);
      queryClient.invalidateQueries(['finance-dashboard']);
      setIsExpenseModalOpen(false);
      setNewExpense({ category: '', description: '', amount: '', incurredOn: new Date().toISOString().split('T')[0] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    }
  });

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchExpenses();
    toast.success('Finance metrics refreshed');
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = 
        (expense.category && expense.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (expense.amount && expense.amount.toString().includes(searchTerm));
      
      const matchesStatus = statusFilter === 'ALL' || expense.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchTerm, statusFilter]);

  // Status counts
  const expenseCounts = useMemo(() => {
    return {
      all: expenses.length,
      pending: expenses.filter(e => e.status === 'PENDING_APPROVAL').length,
      approved: expenses.filter(e => e.status === 'APPROVED').length,
      paid: expenses.filter(e => e.status === 'PAID').length
    };
  }, [expenses]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Header Banner & Quick Controls ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Finance Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Manage Revenue, Expenses, and Accounting
            </p>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          
          {/* Date range filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
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

          {/* Clock */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs font-black text-slate-900 font-mono tracking-wide leading-tight">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>

          <button 
            onClick={handleRefreshAll}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold"
            title="Refresh finance data"
          >
            <RefreshCw className={`w-4 h-4 ${expensesRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Expenses', icon: LayoutGrid, link: null },
          { id: 'payments', label: 'Payments', icon: CreditCard, link: '/finance/payments' },
          { id: 'daily-cash', label: 'Daily Cash Drawer', icon: Wallet, link: '/finance/daily-cash' },
          { id: 'claims', label: 'Insurance Claims', icon: ShieldCheck, link: '/finance/insurance-claims' },
          { id: 'pnl', label: 'P&L Statement', icon: TrendingUp, link: '/finance/pnl' },
          { id: 'refunds', label: 'Refunds', icon: TrendingDown, link: '/finance/refunds' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.link) {
                  navigate(tab.link);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── 1. Top Stats Cards (PRESERVED EXACTLY AS IN SCREENSHOT) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {revenueGrowth}%
              </span>
              <span className="text-sm text-gray-400">vs last 30 days</span>
            </div>
          </div>
          {/* Wavy background right */}
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-32 h-24">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 100 C 20 80, 40 100, 60 70 S 80 40, 100 60 L 100 100 Z" fill="#22c55e" />
              <path d="M0 100 C 30 90, 50 110, 70 80 S 90 50, 100 70 L 100 100 Z" fill="#16a34a" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Total Expenses</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{totalExpenses.toLocaleString()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> {expenseGrowth}%
              </span>
              <span className="text-sm text-gray-400">vs last 30 days</span>
            </div>
          </div>
          {/* Wavy background right */}
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-32 h-24">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 100 C 20 80, 40 100, 60 70 S 80 40, 100 60 L 100 100 Z" fill="#ef4444" />
              <path d="M0 100 C 30 90, 50 110, 70 80 S 90 50, 100 70 L 100 100 Z" fill="#dc2626" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2864FF]"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF0FF] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-[#2864FF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Net Income</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{netIncome.toLocaleString()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-[#EBF0FF] text-[#2864FF] text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                − {netGrowth}%
              </span>
              <span className="text-sm text-gray-400">vs last 30 days</span>
            </div>
          </div>
          {/* Wavy background right */}
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-32 h-24">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 100 C 20 80, 40 100, 60 70 S 80 40, 100 60 L 100 100 Z" fill="#2864FF" />
              <path d="M0 100 C 30 90, 50 110, 70 80 S 90 50, 100 70 L 100 100 Z" fill="#1e40af" opacity="0.5" />
            </svg>
          </div>
        </div>

      </div>

      {/* ─── 2. Expenses Workflow & Management ─── */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Expense Management & Approvals
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {expenses.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review hospital departmental expenditures, authorize approvals, and post to GL
              </p>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: 'ALL', label: `All (${expenseCounts.all})` },
                { id: 'PENDING_APPROVAL', label: `Pending (${expenseCounts.pending})` },
                { id: 'APPROVED', label: `Approved (${expenseCounts.approved})` },
                { id: 'PAID', label: `Paid (${expenseCounts.paid})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                    statusFilter === f.id
                      ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-y border-slate-100">
                <th className="py-3 px-4 pl-6">
                  <div className="flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> Category</div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> Description</div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Amount</div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Date</div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Status</div>
                </th>
                <th className="py-3 px-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1.5"><Settings className="w-3.5 h-3.5 text-slate-400" /> Action</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expensesLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading expense records...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                        <Receipt className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-1">
                        {searchTerm || statusFilter !== 'ALL' ? 'No matching expenses found' : 'No expenses recorded yet'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        {searchTerm || statusFilter !== 'ALL' 
                          ? 'Try clearing the search query or changing the status filter.' 
                          : 'Record your first operational or clinic expense to get started.'}
                      </p>
                      {searchTerm || statusFilter !== 'ALL' ? (
                        <button
                          onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsExpenseModalOpen(true)} 
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <Plus className="w-4 h-4" /> Add First Expense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.slice(0, 15).map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 pl-6">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        {expense.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium text-xs sm:text-sm max-w-xs truncate">
                      {expense.description || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-xs sm:text-sm">
                      ₹{parseFloat(expense.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-xs">
                      {expense.incurredOn ? new Date(expense.incurredOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        expense.status === 'PENDING_APPROVAL' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        expense.status === 'APPROVED' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        expense.status === 'PAID' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {expense.status === 'PENDING_APPROVAL' ? 'Pending Approval' : expense.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {expense.status === 'PENDING_APPROVAL' && (
                          <>
                            <button 
                              onClick={() => approveMutation.mutate(expense.id)}
                              disabled={approveMutation.isPending}
                              className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition border border-blue-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason !== null) {
                                  rejectMutation.mutate({ id: expense.id, reason });
                                }
                              }}
                              className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg transition border border-rose-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {expense.status === 'APPROVED' && (
                          <button 
                            onClick={() => payMutation.mutate(expense.id)}
                            disabled={payMutation.isPending}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid & Post GL
                          </button>
                        )}
                        {expense.status === 'PAID' && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Posted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── Add Expense Modal ─── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Record New Expense</h2>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="">Select Expense Category...</option>
                  <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
                  <option value="Medical Supplies">Medical Supplies & Consumables</option>
                  <option value="Pharmacy Stock">Pharmacy Stock Replenishment</option>
                  <option value="Equipment Maintenance">Equipment Maintenance & AMC</option>
                  <option value="Facility & Rent">Facility Rent & Lease</option>
                  <option value="Staff Salaries & Stipends">Staff Salaries & Stipends</option>
                  <option value="Housekeeping & Sanitation">Housekeeping & Sanitation</option>
                  <option value="Miscellaneous">Miscellaneous Operational</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description / Vendor / Item Details
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  placeholder="e.g. Monthly electricity bill for OPD block"
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date Incurred</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  value={newExpense.incurredOn}
                  onChange={e => setNewExpense({...newExpense, incurredOn: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => addExpenseMutation.mutate({
                  category: newExpense.category,
                  description: newExpense.description,
                  amount: parseFloat(newExpense.amount),
                  incurredOn: newExpense.incurredOn
                })}
                disabled={addExpenseMutation.isPending || !newExpense.category || !newExpense.amount}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm shadow-blue-500/20"
              >
                {addExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
