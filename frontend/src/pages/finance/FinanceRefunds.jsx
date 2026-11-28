import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2, 
  Clock, 
  CreditCard,
  DollarSign, 
  FileText, 
  IndianRupee, 
  LayoutGrid, 
  Plus, 
  Receipt, 
  RefreshCcw, 
  RefreshCw, 
  RotateCcw,
  Search, 
  ShieldAlert,
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceRefunds = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    paymentId: '',
    amount: '',
    reason: ''
  });

  // Query refunds with 15s auto-refresh
  const { data: refunds = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['finance-refunds'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/v1/finance/refunds');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 15000 // Realtime 15s
  });

  const initiateMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        requestedBy: user?.userId || 1,
        idempotencyKey: crypto.randomUUID()
      };
      const res = await axiosPrivate.post('/v1/finance/refunds/initiate', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund request initiated successfully');
      setIsModalOpen(false);
      setFormData({ paymentId: '', amount: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to initiate refund');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (refundId) => {
      const payload = { approvedBy: user?.userId || 1 };
      const res = await axiosPrivate.post(`/v1/finance/refunds/${refundId}/approve`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund approved successfully');
      queryClient.invalidateQueries({ queryKey: ['finance-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: () => toast.error('Failed to approve refund')
  });

  const processMutation = useMutation({
    mutationFn: async (refundId) => {
      const res = await axiosPrivate.post(`/v1/finance/refunds/${refundId}/process`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund processed & credited');
      queryClient.invalidateQueries({ queryKey: ['finance-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: () => toast.error('Failed to process refund')
  });

  const handleInitiate = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.paymentId || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid Payment ID and refund amount');
      return;
    }
    initiateMutation.mutate(formData);
  };

  // Metrics
  const totalRefundsAmount = useMemo(() => {
    return refunds.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  }, [refunds]);

  const processedAmount = useMemo(() => {
    return refunds
      .filter(r => r.status === 'PROCESSED')
      .reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  }, [refunds]);

  const pendingAmount = useMemo(() => {
    return refunds
      .filter(r => r.status === 'INITIATED' || r.status === 'PENDING_APPROVAL')
      .reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  }, [refunds]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: refunds.length,
      pending: refunds.filter(r => r.status === 'INITIATED' || r.status === 'PENDING_APPROVAL').length,
      approved: refunds.filter(r => r.status === 'APPROVED').length,
      processed: refunds.filter(r => r.status === 'PROCESSED').length
    };
  }, [refunds]);

  // Filtered list
  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => {
      const matchesSearch = 
        (r.refundReference && r.refundReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.paymentId && r.paymentId.toString().includes(searchTerm)) ||
        (r.refundReason && r.refundReason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.amount && r.amount.toString().includes(searchTerm));

      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING_APPROVAL' && (r.status === 'INITIATED' || r.status === 'PENDING_APPROVAL')) ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Header Banner & Quick Controls ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Refunds & Reversals Management
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Process patient fee refunds, reconcile overpayments, and manage transaction reversal approvals
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
            onClick={() => { refetch(); toast.success('Refunds synchronized'); }}
            disabled={isRefetching}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Refresh refunds"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Initiate Refund
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Expenses', icon: LayoutGrid, link: '/finance/dashboard' },
          { id: 'payments', label: 'Payments', icon: CreditCard, link: '/finance/payments' },
          { id: 'daily-cash', label: 'Daily Cash Drawer', icon: Wallet, link: '/finance/daily-cash' },
          { id: 'claims', label: 'Insurance Claims', icon: ShieldCheck, link: '/finance/insurance-claims' },
          { id: 'pnl', label: 'P&L Statement', icon: TrendingUp, link: '/finance/pnl' },
          { id: 'refunds', label: 'Refunds', icon: TrendingDown, link: null }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === 'refunds';
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

      {/* ─── 2. Refunds History Table Card ─── */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Refund & Reversal History
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {refunds.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Audit trail for patient reimbursements, fee adjustments, and payment reversal records
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
                placeholder="Search by ref #, payment ID, or reason..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: `All (${counts.all})` },
                { id: 'PENDING_APPROVAL', label: `Pending (${counts.pending})` },
                { id: 'APPROVED', label: `Approved (${counts.approved})` },
                { id: 'PROCESSED', label: `Processed (${counts.processed})` }
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
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-y border-slate-100">
                <th className="py-3 px-4 pl-6">Refund Reference</th>
                <th className="py-3 px-4">Payment ID Ref</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Reason / Remarks</th>
                <th className="py-3 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading refund logs...
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                        <RotateCcw className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-1">
                        {searchTerm || statusFilter !== 'ALL' ? 'No matching refunds found' : 'No refunds recorded yet'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'Try clearing the search query or status filter.'
                          : 'Initiate a fee reversal to record a refund.'}
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
                          onClick={() => setIsModalOpen(true)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <Plus className="w-4 h-4" /> Initiate First Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map(refund => (
                  <tr key={refund.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono font-black text-slate-900 text-xs">
                      {refund.refundReference || `REF-${refund.id}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 text-xs">
                      TX-PAY-{refund.paymentId}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 text-xs sm:text-sm">
                      -₹{parseFloat(refund.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        refund.status === 'INITIATED' || refund.status === 'PENDING_APPROVAL' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        refund.status === 'APPROVED' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        refund.status === 'PROCESSED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {refund.status ? refund.status.replace(/_/g, ' ') : 'INITIATED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium text-xs max-w-xs truncate">
                      {refund.refundReason || '—'}
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {(refund.status === 'INITIATED' || refund.status === 'PENDING_APPROVAL') && (
                          <button
                            onClick={() => approveMutation.mutate(refund.id)}
                            disabled={approveMutation.isPending}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition"
                          >
                            Approve
                          </button>
                        )}
                        {refund.status === 'APPROVED' && (
                          <button
                            onClick={() => processMutation.mutate(refund.id)}
                            disabled={processMutation.isPending}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Process & Credit
                          </button>
                        )}
                        {refund.status === 'PROCESSED' && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
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

      {/* ─── Initiate Refund Modal ─── */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative z-[9999] bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Initiate Patient Refund</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Original Payment ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  value={formData.paymentId}
                  onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
                  placeholder="Enter original transaction ID (e.g. 101)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Refund Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Refund Reason / Medical Cancellation Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for refund (e.g. Cancelled consultation, excess billing adjustment)..."
                />
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
                  disabled={initiateMutation.isPending}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm shadow-blue-500/20"
                >
                  {initiateMutation.isPending ? 'Initiating...' : 'Initiate Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default FinanceRefunds;
