import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
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
  RefreshCw, 
  Search, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FinancePayments = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Form State
  const [searchInvoiceId, setSearchInvoiceId] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: ''
  });

  // Query Recent Payments with 15s auto-refresh
  const { data: payments = [], isLoading: isLoadingPayments, isRefetching: isRefetchingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['finance-payments'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/finance/payments');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 15000 // Realtime 15s
  });

  // Invoice Search Query
  const { data: invoiceToPay, isLoading: isSearching, refetch: searchInvoice } = useQuery({
    queryKey: ['invoice-search', searchInvoiceId],
    queryFn: async () => {
      if (!searchInvoiceId) return null;
      try {
        const res = await axiosPrivate.get(`/billing/invoices/${searchInvoiceId}`);
        return res.data;
      } catch (err) {
        toast.error('Invoice not found');
        return null;
      }
    },
    enabled: false
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInvoiceId.trim()) searchInvoice();
  };

  // Payment Processing Mutation
  const processPayment = useMutation({
    mutationFn: async () => {
      const idempotencyKey = `inv_${invoiceToPay.id}_${Date.now()}`;
      const initRes = await axiosPrivate.post('/v1/finance/payments/initiate', {
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        idempotencyKey: idempotencyKey
      });
      const paymentId = initRes.data.id;
      
      await axiosPrivate.post(`/v1/finance/payments/${paymentId}/capture`, {
        transactionRef: paymentForm.referenceNumber || 'CASH_TX'
      });
      
      await axiosPrivate.post(`/v1/finance/payments/${paymentId}/allocate`, {
        invoiceId: invoiceToPay.id,
        amount: Number(paymentForm.amount)
      });
      
      // Also mark invoice as paid
      await axiosPrivate.patch(`/billing/invoices/${invoiceToPay.id}/mark-paid?paymentMethod=${paymentForm.paymentMethod}`);
      
      return initRes.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded and allocated successfully');
      setSearchInvoiceId('');
      setPaymentForm({ amount: '', paymentMethod: 'CASH', referenceNumber: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      queryClient.setQueryData(['invoice-search', searchInvoiceId], null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  });

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (Number(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    processPayment.mutate();
  };

  // Metrics calculation
  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const cashTotal = useMemo(() => {
    return payments
      .filter(p => p.paymentMethod === 'CASH')
      .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const digitalTotal = useMemo(() => {
    return payments
      .filter(p => p.paymentMethod !== 'CASH')
      .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        (p.invoiceId && p.invoiceId.toString().includes(paymentSearch)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        (p.amount && p.amount.toString().includes(paymentSearch));
      
      const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [payments, paymentSearch, methodFilter]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Header Banner & Quick Controls ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Payment Processing
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Record payments for outstanding patient invoices and capture financial transaction receipts
            </p>
          </div>
        </div>

        {/* Live Clock & Sync indicator */}
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
            onClick={() => { refetchPayments(); toast.success('Payments synced'); }}
            disabled={isRefetchingPayments}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Refresh payments"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetchingPayments ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Expenses', icon: LayoutGrid, link: '/finance/dashboard' },
          { id: 'payments', label: 'Payments', icon: CreditCard, link: null },
          { id: 'daily-cash', label: 'Daily Cash Drawer', icon: Wallet, link: '/finance/daily-cash' },
          { id: 'claims', label: 'Insurance Claims', icon: ShieldCheck, link: '/finance/insurance-claims' },
          { id: 'pnl', label: 'P&L Statement', icon: TrendingUp, link: '/finance/pnl' },
          { id: 'refunds', label: 'Refunds', icon: TrendingDown, link: '/finance/refunds' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === 'payments';
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

      {/* ─── 2. Main Two-Column Stage ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Process New Payment (lg: 5 cols) ── */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
          
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Process New Payment</h2>
              <p className="text-xs text-slate-500 font-medium">Lookup patient invoice and record settlement</p>
            </div>
          </div>

          {/* Invoice Search Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Invoice Number or ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  placeholder="Enter Invoice ID (e.g. 101)..."
                  value={searchInvoiceId}
                  onChange={(e) => setSearchInvoiceId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                {isSearching ? 'Finding...' : 'Find'}
              </button>
            </div>
          </form>

          {/* Searched Invoice Card */}
          <AnimatePresence>
            {invoiceToPay && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      Invoice #{invoiceToPay.invoiceNumber || invoiceToPay.id}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Patient: <span className="font-bold text-slate-800">{invoiceToPay.patientName || 'Patient'}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    invoiceToPay.status === 'PAID' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {invoiceToPay.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-y border-slate-200/80">
                  <span className="text-xs font-bold text-slate-500">Total Amount Due</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{Number(invoiceToPay.totalAmount || 0).toLocaleString()}
                  </span>
                </div>

                {invoiceToPay.status === 'PAID' ? (
                  <div className="text-center py-4 text-emerald-700 font-bold text-xs bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> This invoice is fully settled.
                  </div>
                ) : (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Pay (₹) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                          <input 
                            type="number" 
                            step="any"
                            value={paymentForm.amount} 
                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method *</label>
                        <select 
                          value={paymentForm.paymentMethod} 
                          onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
                        >
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="CREDIT_CARD">Credit / Debit Card</option>
                          <option value="INSURANCE">Insurance Claim</option>
                          <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                        </select>
                      </div>
                    </div>
                    
                    {['CREDIT_CARD', 'BANK_TRANSFER', 'UPI'].includes(paymentForm.paymentMethod) && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Reference / UTR / Auth ID *</label>
                        <input 
                          type="text"
                          value={paymentForm.referenceNumber} 
                          onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} 
                          placeholder="e.g. UPI-984729103 or CARD-AUTH-77"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
                          required
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={processPayment.isPending}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {processPayment.isPending ? 'Processing Payment...' : 'Confirm & Record Payment'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ── RIGHT COLUMN: Recent Payment Log (lg: 7 cols) ── */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">Recent Payment Log</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    {payments.length} Recorded
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Real-time settlement records & transaction receipts</p>
              </div>
            </div>

            {/* Method filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CASH', label: 'Cash' },
                { id: 'CREDIT_CARD', label: 'Card' },
                { id: 'UPI', label: 'UPI' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMethodFilter(f.id)}
                  className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                    methodFilter === f.id
                      ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search within log */}
          {payments.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search by invoice ID, ref #, or amount..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          )}

          {/* Payments List */}
          <div className="max-h-[580px] overflow-y-auto space-y-2.5 pr-1">
            {isLoadingPayments ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading payment transactions...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">
                  {paymentSearch || methodFilter !== 'ALL' ? 'No matching transactions' : 'No payments recorded yet'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {paymentSearch || methodFilter !== 'ALL'
                    ? 'No payments matched your search or payment method filter.'
                    : 'Process an invoice payment using the form on the left to see receipts here.'}
                </p>
              </div>
            ) : (
              filteredPayments.map(payment => (
                <div 
                  key={payment.id} 
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/40 hover:bg-white hover:shadow-2xs transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        Invoice #{payment.invoiceId || 'N/A'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {payment.status || 'SETTLED'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Method: <span className="font-bold text-slate-800">{payment.paymentMethod}</span></span>
                      {payment.referenceNumber && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-mono text-[11px]">Ref: {payment.referenceNumber}</span>
                        </>
                      )}
                    </p>

                    <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-black text-emerald-600 block">
                      +₹{Number(payment.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Captured</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default FinancePayments;
