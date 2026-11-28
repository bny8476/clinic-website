import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  ArrowRight,
  Building2,
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
  Shield, 
  ShieldAlert,
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InsuranceClaimsList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [newClaim, setNewClaim] = useState({
    patientId: '',
    invoiceId: '',
    providerName: '',
    claimNumber: '',
    claimedAmount: '',
    notes: ''
  });

  // Query claims with 15s auto-refresh
  const { data: claims = [], isLoading, isRefetching, refetch } = useQuery({ 
    queryKey: ['finance-claims'], 
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/claims');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 15000 // Realtime 15s auto-sync
  });

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await axiosPrivate.patch(`/finance/claims/${id}/status?status=${status}`);
    },
    onSuccess: (_, variables) => {
      toast.success(`Claim status updated to ${variables.status.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['finance-claims'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update claim status');
    }
  });

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (payload) => {
      const body = {
        patientId: parseInt(payload.patientId, 10),
        providerName: payload.providerName,
        claimNumber: payload.claimNumber,
        claimedAmount: parseFloat(payload.claimedAmount),
        notes: payload.notes
      };
      if (payload.invoiceId) {
        body.invoice = { id: parseInt(payload.invoiceId, 10) };
      }
      return await axiosPrivate.post('/finance/claims', body);
    },
    onSuccess: () => {
      toast.success('Insurance claim submitted successfully');
      setIsSubmitModalOpen(false);
      setNewClaim({ patientId: '', invoiceId: '', providerName: '', claimNumber: '', claimedAmount: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-claims'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    }
  });

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!newClaim.patientId || !newClaim.providerName || !newClaim.claimedAmount) {
      toast.error('Please fill required claim details');
      return;
    }
    submitClaimMutation.mutate(newClaim);
  };

  // Metrics
  const totalClaimed = useMemo(() => {
    return claims.reduce((acc, c) => acc + (parseFloat(c.claimedAmount) || 0), 0);
  }, [claims]);

  const pendingAmount = useMemo(() => {
    return claims
      .filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW')
      .reduce((acc, c) => acc + (parseFloat(c.claimedAmount) || 0), 0);
  }, [claims]);

  const settledAmount = useMemo(() => {
    return claims
      .filter(c => c.status === 'APPROVED' || c.status === 'SETTLED')
      .reduce((acc, c) => acc + (parseFloat(c.approvedAmount || c.claimedAmount) || 0), 0);
  }, [claims]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: claims.length,
      submitted: claims.filter(c => c.status === 'SUBMITTED').length,
      underReview: claims.filter(c => c.status === 'UNDER_REVIEW').length,
      approved: claims.filter(c => c.status === 'APPROVED').length,
      settled: claims.filter(c => c.status === 'SETTLED').length,
      rejected: claims.filter(c => c.status === 'REJECTED').length
    };
  }, [claims]);

  // Filtered claims list
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesSearch = 
        (c.claimNumber && c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.providerName && c.providerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.invoiceId && c.invoiceId.toString().includes(searchTerm)) ||
        (c.invoice?.invoiceNumber && c.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [claims, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Header Banner & Quick Controls ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Insurance Claims
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Track and process patient insurance claims, third-party approvals, and settlement reconciliation
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
            onClick={() => { refetch(); toast.success('Claims synchronized'); }}
            disabled={isRefetching}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Refresh claims"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Submit Claim
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Expenses', icon: LayoutGrid, link: '/finance/dashboard' },
          { id: 'payments', label: 'Payments', icon: CreditCard, link: '/finance/payments' },
          { id: 'daily-cash', label: 'Daily Cash Drawer', icon: Wallet, link: '/finance/daily-cash' },
          { id: 'claims', label: 'Insurance Claims', icon: ShieldCheck, link: null },
          { id: 'pnl', label: 'P&L Statement', icon: TrendingUp, link: '/finance/pnl' },
          { id: 'refunds', label: 'Refunds', icon: TrendingDown, link: '/finance/refunds' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === 'claims';
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

      {/* ─── 2. Insurance Claims Table Card ─── */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Patient Insurance Claims Log
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {claims.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Process claim adjudications, review third-party medical coverages, and record settlement credits
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
                placeholder="Search by claim #, provider, or invoice..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: `All (${counts.all})` },
                { id: 'SUBMITTED', label: `Submitted (${counts.submitted})` },
                { id: 'UNDER_REVIEW', label: `In Review (${counts.underReview})` },
                { id: 'APPROVED', label: `Approved (${counts.approved})` },
                { id: 'SETTLED', label: `Settled (${counts.settled})` }
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

        {/* Responsive Claims Table */}
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-y border-slate-100">
                <th className="py-3 px-4 pl-6">Claim #</th>
                <th className="py-3 px-4">Insurance Provider</th>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4 text-right">Claimed</th>
                <th className="py-3 px-4 text-right">Approved</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading insurance claims...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                        <Shield className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-1">
                        {searchTerm || statusFilter !== 'ALL' ? 'No matching claims found' : 'No insurance claims recorded yet'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'Try adjusting your search query or status filter.'
                          : 'Submit a patient insurance claim to begin adjudication.'}
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
                          onClick={() => setIsSubmitModalOpen(true)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <Plus className="w-4 h-4" /> Submit First Claim
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map(claim => (
                  <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono font-black text-slate-900 text-xs">
                      {claim.claimNumber || `CLM-${claim.id}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {claim.providerName || 'Provider'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {claim.invoice?.invoiceNumber ? claim.invoice.invoiceNumber : `INV-${claim.invoiceId || '—'}`}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-xs sm:text-sm">
                      ₹{parseFloat(claim.claimedAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-xs sm:text-sm">
                      {claim.approvedAmount ? `₹${parseFloat(claim.approvedAmount).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        claim.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        claim.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        claim.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        claim.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {claim.status ? claim.status.replace(/_/g, ' ') : 'DRAFT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {claim.status === 'SUBMITTED' && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'UNDER_REVIEW' })}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-lg border border-amber-200 transition"
                          >
                            Mark Review
                          </button>
                        )}
                        {claim.status === 'UNDER_REVIEW' && (
                          <>
                            <button 
                              onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'APPROVED' })}
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 transition"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'REJECTED' })}
                              disabled={updateStatusMutation.isPending}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {claim.status === 'APPROVED' && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'SETTLED' })}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settle & Credit
                          </button>
                        )}
                        {claim.status === 'SETTLED' && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                        {claim.status === 'REJECTED' && (
                          <span className="text-xs font-bold text-rose-500">
                            Rejected
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

      {/* ─── Submit Claim Modal ─── */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Submit Insurance Claim</h2>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Patient ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                    placeholder="e.g. 101"
                    value={newClaim.patientId}
                    onChange={e => setNewClaim({...newClaim, patientId: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Invoice ID Ref
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                    placeholder="e.g. 50"
                    value={newClaim.invoiceId}
                    onChange={e => setNewClaim({...newClaim, invoiceId: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Insurance Provider Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  placeholder="e.g. Star Health, HDFC ERGO, Care Insurance"
                  value={newClaim.providerName}
                  onChange={e => setNewClaim({...newClaim, providerName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Policy / Claim Number
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                    placeholder="e.g. CLM-889921"
                    value={newClaim.claimNumber}
                    onChange={e => setNewClaim({...newClaim, claimNumber: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Claimed Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                      placeholder="0.00"
                      value={newClaim.claimedAmount}
                      onChange={e => setNewClaim({...newClaim, claimedAmount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes / Diagnosis</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                  rows={2}
                  placeholder="Optional pre-authorization or clinical remarks..."
                  value={newClaim.notes}
                  onChange={e => setNewClaim({...newClaim, notes: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitClaimMutation.isPending}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm shadow-blue-500/20"
                >
                  {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
