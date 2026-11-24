import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  ArrowRight,
  BarChart3, 
  Calendar,
  CheckCircle2, 
  Clock, 
  CreditCard,
  DollarSign,
  History,
  IndianRupee, 
  LayoutGrid, 
  Lock, 
  Plus, 
  Receipt, 
  RefreshCw, 
  Search, 
  ShieldAlert,
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Unlock,
  Wallet,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceDailyCash = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('OPEN'); // 'OPEN' or 'CLOSE'
  const [amount, setAmount] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cashierId = user?.userId || 1;

  // Realtime Active Session Query
  const { data: currentSession, isLoading: sessionLoading, isRefetching: isRefetchingSession, refetch: refetchSession } = useQuery({
    queryKey: ['cashier-current-session', cashierId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/v1/finance/cashier/session/current?cashierId=${cashierId}`);
        return res.data || null;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 15000 // Realtime 15s auto-refresh
  });

  // Sessions History Query
  const { data: sessions = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['cashier-sessions'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/v1/finance/cashier/sessions');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 15000
  });

  // Open Session Mutation
  const openSessionMutation = useMutation({
    mutationFn: async (openingFloat) => {
      const payload = {
        branchId: 1,
        cashierId,
        openingFloat
      };
      const res = await axiosPrivate.post('/v1/finance/cashier/session/open', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Till session opened successfully');
      setIsModalOpen(false);
      setAmount('');
      queryClient.invalidateQueries(['cashier-current-session']);
      queryClient.invalidateQueries(['cashier-sessions']);
      queryClient.invalidateQueries(['finance-dashboard']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to open till session');
    }
  });

  // Close Session Mutation
  const closeSessionMutation = useMutation({
    mutationFn: async (closingFloat) => {
      const payload = { closingFloat };
      const res = await axiosPrivate.post(`/v1/finance/cashier/session/${currentSession.id}/close`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Till session closed and balanced');
      setIsModalOpen(false);
      setAmount('');
      queryClient.invalidateQueries(['cashier-current-session']);
      queryClient.invalidateQueries(['cashier-sessions']);
      queryClient.invalidateQueries(['finance-dashboard']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to close till session');
    }
  });

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (modalType === 'OPEN') {
      openSessionMutation.mutate(parsed);
    } else {
      closeSessionMutation.mutate(parsed);
    }
  };

  const handleSyncAll = () => {
    refetchSession();
    refetchHistory();
    toast.success('Daily cash data synchronized');
  };

  // Metrics
  const openingFloatValue = currentSession?.openingFloat || 0;
  const cashCollectionsValue = currentSession?.cashCollections || 0;
  const totalInDrawer = openingFloatValue + cashCollectionsValue;

  // Filtered session history
  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return sessions;
    const term = historySearch.toLowerCase();
    return sessions.filter(s => 
      (s.id && s.id.toString().includes(term)) ||
      (s.status && s.status.toLowerCase().includes(term)) ||
      (s.openedAt && new Date(s.openedAt).toLocaleDateString().includes(term))
    );
  }, [sessions, historySearch]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Header Banner & Quick Controls ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daily Cash & Till Management
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Manage your daily cash register float, reconcile drawer collections, and audit till sessions
            </p>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs font-black text-slate-900 font-mono tracking-wide leading-tight">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
          </div>

          <button 
            onClick={handleSyncAll}
            disabled={isRefetchingSession}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Refresh till data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetchingSession ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {currentSession ? (
            <button
              onClick={() => { setModalType('CLOSE'); setAmount(''); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-rose-500/20"
            >
              <Lock className="w-4 h-4" /> Close Till Session
            </button>
          ) : (
            <button
              onClick={() => { setModalType('OPEN'); setAmount(''); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-emerald-500/20"
            >
              <Unlock className="w-4 h-4" /> Open Till Session
            </button>
          )}
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Expenses', icon: LayoutGrid, link: '/finance/dashboard' },
          { id: 'payments', label: 'Payments', icon: CreditCard, link: '/finance/payments' },
          { id: 'daily-cash', label: 'Daily Cash Drawer', icon: Wallet, link: null },
          { id: 'claims', label: 'Insurance Claims', icon: ShieldCheck, link: '/finance/insurance-claims' },
          { id: 'pnl', label: 'P&L Statement', icon: TrendingUp, link: '/finance/pnl' },
          { id: 'refunds', label: 'Refunds', icon: TrendingDown, link: '/finance/refunds' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === 'daily-cash';
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.link) navigate(tab.link);
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
        
        {/* Total Cash in Drawer / Till Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{totalInDrawer.toLocaleString()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {currentSession ? 'ACTIVE' : 'CLOSED'}
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

        {/* Opening Float */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Total Expenses</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{openingFloatValue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> 0%
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

        {/* Cash Collections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2864FF]"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF0FF] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-[#2864FF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Net Income</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{cashCollectionsValue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-[#EBF0FF] text-[#2864FF] text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                − 0%
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

      {/* ─── 2. Active Session Banner Card (if session is open) ─── */}
      {currentSession && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Active Till Session #{currentSession.id}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Open
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Opened at {new Date(currentSession.openedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} • Cashier ID: #{cashierId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Float + Collections</span>
              <span className="text-base font-black text-slate-900">₹{totalInDrawer.toLocaleString()}</span>
            </div>
            <button
              onClick={() => { setModalType('CLOSE'); setAmount(''); setIsModalOpen(true); }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" /> Close Till
            </button>
          </div>
        </div>
      )}

      {/* ─── 3. Till Session History Table ─── */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">Till Session History</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {sessions.length} Recorded
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Reconciled register sessions, drawer float audits, and cashier logs</p>
            </div>
          </div>

          {/* Search within history */}
          {sessions.length > 0 && (
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search sessions..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          )}
        </div>

        {/* Responsive History Table */}
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-y border-slate-100">
                <th className="py-3 px-4 pl-6">Opened At</th>
                <th className="py-3 px-4">Closed At</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Cash Collections</th>
                <th className="py-3 px-4 text-right">Closing Float</th>
                <th className="py-3 px-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading session audit history...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                        <Wallet className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-1">
                        {historySearch ? 'No matching sessions found' : 'No till session history available'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        {historySearch ? 'Try adjusting your search query.' : 'Open a till session to start tracking cash register float.'}
                      </p>
                      {!currentSession && !historySearch && (
                        <button
                          onClick={() => { setModalType('OPEN'); setAmount(''); setIsModalOpen(true); }}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <Unlock className="w-4 h-4" /> Open First Till Session
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSessions.slice().reverse().map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-bold text-slate-900 text-xs sm:text-sm">
                      {new Date(session.openedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-xs">
                      {session.closedAt ? new Date(session.closedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-xs sm:text-sm">
                      ₹{Number(session.openingFloat || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-xs sm:text-sm">
                      +₹{Number(session.cashCollections || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-xs sm:text-sm">
                      {session.closingFloat != null ? `₹${Number(session.closingFloat).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        session.status === 'OPEN' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        session.status === 'CLOSED' 
                          ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        session.status === 'DISCREPANCY' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── Open / Close Till Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  modalType === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {modalType === 'OPEN' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {modalType === 'OPEN' ? 'Open Cash Register Till' : 'Close & Balance Till'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {modalType === 'OPEN' ? 'Starting Float Amount (₹) *' : 'Closing Cash Amount in Drawer (₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {modalType === 'OPEN' 
                    ? 'Enter physical cash float counted at the start of shift.' 
                    : 'Count all physical currency bills and coins present in the register.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={modalType === 'OPEN' ? openSessionMutation.isPending : closeSessionMutation.isPending}
                  className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 ${
                    modalType === 'OPEN' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  {modalType === 'OPEN' 
                    ? (openSessionMutation.isPending ? 'Opening Till...' : 'Confirm Open Till') 
                    : (closeSessionMutation.isPending ? 'Closing Till...' : 'Confirm Close Till')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceDailyCash;
