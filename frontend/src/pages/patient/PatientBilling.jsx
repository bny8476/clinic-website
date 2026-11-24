import React, { useState, useMemo } from 'react';
import useAuthStore from '../../store/authStore';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Receipt,
  XCircle,
  Sparkles,
  Search,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Layers,
  Loader2,
  AlertCircle,
  Building2,
  Check,
  ChevronRight,
  Printer
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeUp, listStagger, pageTransition } from '../../components/ui/motion';

const PatientBilling = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID' | 'HISTORY'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, invoice: null });
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch Invoices
  const { data: rawInvoices = [], isLoading: isLoadingInvoices, isFetching, refetch } = useQuery({
    queryKey: ['patientInvoices', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/billing/patient/${user.id}`);
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch (err) {
        console.warn('Failed to fetch patient invoices', err);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const invoices = useMemo(() => Array.isArray(rawInvoices) ? rawInvoices : [], [rawInvoices]);

  // Payment History (Paid Invoices)
  const paymentHistory = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'PAID' || inv.status === 'COMPLETED')
      .map(inv => ({
        id: inv.id,
        paymentDate: inv.paidAt || inv.updatedAt || inv.createdAt,
        paymentMethod: inv.paymentMethod || 'Online (Razorpay / UPI)',
        transactionId: inv.invoiceNumber || `TXN-${inv.id}`,
        amount: inv.totalAmount || inv.amount || 0,
        status: inv.status,
        description: inv.description || 'Clinical Services & Consultation'
      }));
  }, [invoices]);

  // Pay Mutation
  const payMutation = useMutation({
    mutationFn: async ({ invoiceId }) => {
      const res = await axiosPrivate.put(`/billing/${invoiceId}/pay`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment settled successfully');
      queryClient.invalidateQueries({ queryKey: ['patientInvoices', user?.id] });
      setConfirmDialog({ isOpen: false, invoice: null });
    },
    onError: () => {
      toast.error('Payment processing failed. Please try again.');
      setConfirmDialog({ isOpen: false, invoice: null });
    }
  });

  const handlePay = (invoice) => {
    setConfirmDialog({ isOpen: true, invoice });
  };

  const handleConfirmPay = () => {
    if (confirmDialog.invoice) {
      payMutation.mutate({ 
        invoiceId: confirmDialog.invoice.id 
      });
    }
  };

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      setDownloadingId(id);
      const res = await axiosPrivate.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Invoice receipt downloaded');
    } catch {
      toast.error('Tax receipt is being generated or unavailable');
    } finally {
      setDownloadingId(null);
    }
  };

  // Financial Computations
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0);
  }, [invoices]);

  const totalSettled = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'PAID' || inv.status === 'COMPLETED')
      .reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0);
  }, [invoices]);

  const pendingCount = useMemo(() => invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').length, [invoices]);
  const paidCount = useMemo(() => invoices.filter(i => i.status === 'PAID' || i.status === 'COMPLETED').length, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    let list = invoices.filter(inv => {
      // Tab filter
      if (activeTab === 'PENDING' && inv.status !== 'PENDING' && inv.status !== 'OVERDUE') return false;
      if (activeTab === 'PAID' && inv.status !== 'PAID' && inv.status !== 'COMPLETED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (inv.invoiceNumber || `inv-${inv.id}`).toLowerCase();
        const desc = (inv.description || '').toLowerCase();
        const stat = (inv.status || '').toLowerCase();
        const itemsMatch = (inv.items || []).some(item => (item.description || '').toLowerCase().includes(q));

        if (!num.includes(q) && !desc.includes(q) && !stat.includes(q) && !itemsMatch) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [invoices, activeTab, searchQuery, sortOrder]);

  const formatCurrency = (amt) => {
    const num = Number(amt) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          PAID & SETTLED
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          PENDING PAYMENT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        {s || 'OVERDUE'}
      </span>
    );
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top Header Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2160FF] to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Receipt className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Billing, Invoices & Payment History
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Secure Gateway
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                  Manage hospital outpatient bills, diagnostic laboratory payments, pharmacy orders, and download certified tax receipts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                onClick={() => refetch()}
                title="Sync Invoices"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => navigate('/patient/insurance')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#2160FF]" />
                <span>Insurance & Claims</span>
              </button>

              <button
                onClick={() => navigate('/patient/appointments')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-blue-600 transition shadow-sm shadow-blue-500/25 cursor-pointer border-none"
              >
                <span>Book Service</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Top Financial KPI Metrics Strip ────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(totalInvoiced)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold shadow-2xs">
                <Receipt className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700/80 uppercase tracking-wider">Outstanding Balance</p>
                <h3 className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">{formatCurrency(totalOutstanding)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200/60 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">Total Paid & Settled</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{formatCurrency(totalSettled)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700/80 uppercase tracking-wider">Invoices on Record</p>
                <h3 className="text-xl sm:text-2xl font-black text-[#2160FF] mt-0.5">{invoices.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200/60 text-[#2160FF] flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs, Search & Sort Bar ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Invoices', count: invoices.length },
              { id: 'PENDING', label: 'Pending Payment', count: pendingCount },
              { id: 'PAID', label: 'Paid & Settled', count: paidCount },
              { id: 'HISTORY', label: 'Payment Ledger', count: paymentHistory.length },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-[#2160FF] text-white border-[#2160FF] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          {activeTab !== 'HISTORY' && (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice #, service..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition w-56 sm:w-64"
                />
              </div>

              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                aria-label="Sort invoices"
                style={{ backgroundImage: 'none' }}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 cursor-pointer shadow-2xs"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Content: Invoices vs History Table ───────────────────────────── */}
        {activeTab !== 'HISTORY' ? (
          isLoadingInvoices ? (
            <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xs border border-slate-200/80">
              <Loader2 className="w-9 h-9 animate-spin text-[#2160FF]" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            /* High-Grade Empty State */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-12 sm:p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#2160FF] flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
                <Receipt className="w-9 h-9" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">
                {invoices.length === 0 ? 'No invoices on file' : 'No matching invoices found'}
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                {invoices.length === 0
                  ? "You have no outstanding or settled clinical bills. Invoices generated for consultations, tests, and prescriptions will appear here."
                  : `No invoices match your filter "${activeTab}" or search term. Try resetting your search filters.`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {invoices.length > 0 && (
                  <button
                    onClick={() => { setActiveTab('ALL'); setSearchQuery(''); }}
                    className="px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer bg-white"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2160FF] text-xs font-black text-white rounded-xl hover:bg-blue-600 transition cursor-pointer shadow-sm shadow-blue-500/20 border-none"
                >
                  <Clock className="w-4 h-4" />
                  <span>View Payment History</span>
                </button>
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <span>Return to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Invoice Cards */
            <div className="space-y-4">
              <AnimatePresence>
                {filteredInvoices.map((invoice) => {
                  const isPaid = invoice.status === 'PAID' || invoice.status === 'COMPLETED';
                  const isPending = invoice.status === 'PENDING';
                  const amountVal = invoice.totalAmount || invoice.amount || 0;
                  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id}`;

                  return (
                    <motion.div
                      key={invoice.id}
                      variants={listStagger}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all p-5 sm:p-6 space-y-4 relative overflow-hidden group"
                    >
                      {/* Left Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${
                        isPaid ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />

                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${
                            isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-[#2160FF] border border-blue-100'
                          }`}>
                            <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                {invoiceNum}
                              </h3>
                              {renderStatusBadge(invoice.status)}
                              {invoice.paymentMethod && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {invoice.paymentMethod}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 font-medium line-clamp-1">
                              {invoice.description || 'Clinical Outpatient Consultation & Diagnostics'}
                            </p>

                            <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-2">
                              <span>Issued: {formatDate(invoice.createdAt)}</span>
                              <span>•</span>
                              <span>Due: {formatDate(invoice.dueDate)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 gap-2.5 pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Total Amount
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 block">
                              {formatCurrency(amountVal)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending && (
                              <button
                                onClick={() => handlePay(invoice)}
                                disabled={payMutation.isPending}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs border-none cursor-pointer disabled:opacity-50"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Online</span>
                              </button>
                            )}

                            {isPaid && (
                              <button
                                onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                                disabled={downloadingId === invoice.id}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#2160FF] bg-blue-50 hover:bg-[#2160FF] hover:text-white border border-blue-200/60 transition shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                {downloadingId === invoice.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                <span>Tax Receipt</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Line Items Table Breakdown (if available) */}
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60">
                                <th className="pb-2">Clinical Service Description</th>
                                <th className="pb-2 text-center">Qty</th>
                                <th className="pb-2 text-right">Total Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {invoice.items.map(item => (
                                <tr key={item.id} className="text-slate-700">
                                  <td className="py-2 font-medium">{item.description}</td>
                                  <td className="py-2 text-center text-slate-500 font-bold">{item.quantity}</td>
                                  <td className="py-2 text-right font-black text-slate-900">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )
        ) : (
          /* Payment Ledger Table */
          paymentHistory.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-12 sm:p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#2160FF] flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
                <Clock className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1.5">No payment history yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                You haven't made any transactions yet. When an invoice is settled, the audit ledger will record your payment method and transaction ID.
              </p>
              <button
                onClick={() => setActiveTab('ALL')}
                className="px-5 py-2.5 bg-[#2160FF] text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition shadow-xs border-none cursor-pointer"
              >
                View Outstanding Invoices
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-5">Payment Date</th>
                      <th className="py-4 px-4">Method</th>
                      <th className="py-4 px-4">Transaction / Invoice #</th>
                      <th className="py-4 px-4">Description</th>
                      <th className="py-4 px-4 text-right">Amount Settled</th>
                      <th className="py-4 px-5 text-right">Status & Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paymentHistory.map(payment => (
                      <tr key={payment.id} className="hover:bg-blue-50/30 transition group">
                        <td className="py-3.5 px-5 font-bold text-slate-800 whitespace-nowrap">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                          {payment.transactionId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {payment.description}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-right whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              SETTLED
                            </span>
                            <button
                              onClick={() => handleDownloadPdf(payment.id, payment.transactionId)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Download Tax Receipt"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

      </div>

      {/* ── Secure Payment Confirmation Modal ────────────────────────────── */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, invoice: null })}
        onConfirm={handleConfirmPay}
        title="Confirm Online Payment"
        description={`Authorizing payment of ${formatCurrency(confirmDialog.invoice?.totalAmount || confirmDialog.invoice?.amount || 0)} for invoice #${confirmDialog.invoice?.invoiceNumber || confirmDialog.invoice?.id}.`}
        confirmText="Confirm & Pay"
        isDestructive={false}
        isLoading={payMutation.isPending}
      />

    </motion.div>
  );
};

export default PatientBilling;
