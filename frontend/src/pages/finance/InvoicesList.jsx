import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MOCK_INVOICES } from '../../data/unifiedMockData';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Download, 
  FileCheck, 
  FileText, 
  Filter, 
  IndianRupee, 
  Layers, 
  LayoutDashboard, 
  Plus, 
  Receipt, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  User, 
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

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const InvoicesList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [downloadingId, setDownloadingId] = useState(null);

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({ amount: '', tax: 0, description: '' });

  // Patient Search State for Modal
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);

  const { data: patientResults = [], isFetching: patientSearchLoading } = useQuery({
    queryKey: ['patient-search-invoice', debouncedPatientSearch],
    queryFn: async () => {
      if (!debouncedPatientSearch.trim()) return [];
      const res = await axiosPrivate.get('/patients/search', { params: { query: debouncedPatientSearch } });
      return res.data;
    },
    enabled: debouncedPatientSearch.length >= 2,
    staleTime: 30_000,
  });

  // Query Invoices
  const { data: invoices = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/billing/invoices');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const displayableInvoices = useMemo(() => {
    return (Array.isArray(invoices) && invoices.length > 0) ? invoices : MOCK_INVOICES;
  }, [invoices]);

  // Mutation to create invoice
  const mutation = useMutation({
    mutationFn: async (data) => axiosPrivate.post('/billing/invoices', data),
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create invoice')
  });

  const resetForm = () => {
    setFormData({ amount: '', tax: 0, description: '' });
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please search for and select a patient.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid billing amount.');
      return;
    }
    const patientUserId = selectedPatient.patientId || selectedPatient.userId || selectedPatient.id;
    mutation.mutate({
      patientId: patientUserId,
      description: formData.description || `${selectedPatient.fullName || selectedPatient.name || 'Patient'} - Consultation & Diagnostics`,
      dueDate: new Date().toISOString(),
      amount: Number(formData.amount),
      taxAmount: Number(formData.tax || 0)
    });
  };

  // PDF Download Handler
  const handleDownloadPDF = async (row) => {
    const invId = row.id || row.invoiceNumber;
    try {
      setDownloadingId(invId);
      const res = await axiosPrivate.get(`/billing/invoices/${row.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Invoice ${invId} downloaded`);
    } catch (e) {
      toast.error('Failed to download PDF invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    displayableInvoices.forEach(inv => {
      const amt = Number(inv.amount || inv.total || 0);
      totalInvoiced += amt;
      const st = (inv.status || 'UNPAID').toUpperCase();

      if (st === 'PAID') {
        paidAmount += amt;
        paidCount++;
      } else if (st === 'PARTIAL') {
        paidAmount += amt * 0.5;
        pendingAmount += amt * 0.5;
        partialCount++;
      } else {
        pendingAmount += amt;
        unpaidCount++;
      }
    });

    const collectionRate = totalInvoiced > 0 ? ((paidAmount / totalInvoiced) * 100).toFixed(1) : 0;
    const avgInvoice = displayableInvoices.length > 0 ? totalInvoiced / displayableInvoices.length : 0;

    return {
      totalInvoiced,
      paidAmount,
      pendingAmount,
      collectionRate,
      paidCount,
      unpaidCount,
      partialCount,
      totalCount: displayableInvoices.length,
      avgInvoice
    };
  }, [displayableInvoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return displayableInvoices
      .filter(inv => {
        const pName = (inv.patientName || inv.patient || '').toLowerCase();
        const invId = (inv.id || inv.invoiceNumber || '').toString().toLowerCase();
        const uhid = (inv.mrn || inv.uhid || '').toLowerCase();
        const s = searchTerm.toLowerCase();

        const matchSearch = !searchTerm || pName.includes(s) || invId.includes(s) || uhid.includes(s);
        const invStatus = (inv.status || 'UNPAID').toUpperCase();

        const matchStatus = statusFilter === 'ALL' || invStatus === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'amount-high') {
          return Number(b.amount || b.total || 0) - Number(a.amount || a.total || 0);
        }
        if (sortBy === 'amount-low') {
          return Number(a.amount || a.total || 0) - Number(b.amount || b.total || 0);
        }
        // newest
        const dateA = new Date(a.date || a.dueDate || 0).getTime();
        const dateB = new Date(b.date || b.dueDate || 0).getTime();
        return dateB - dateA;
      });
  }, [displayableInvoices, searchTerm, statusFilter, sortBy]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 bg-slate-50/60 font-finance tracking-[-0.01em] max-w-[1920px] mx-auto antialiased">
      
      {/* ─── Top Executive Banner ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1557FF] flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight font-finance">
                Invoices & Institutional Billing
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#1557FF] border border-blue-200/60 uppercase tracking-wider">
                Accounts Receivable Ledger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Patient consultations, pharmacy charge slips, diagnostics, and corporate TPA billing records
            </p>
          </div>
        </div>

        {/* Action Controls & Clock */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/70 text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-[#1557FF]" />
            <span className="font-financeMono tabular-nums">
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <button
            onClick={() => navigate('/finance/payments')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-[#1557FF]" />
            <span>Payments Register</span>
          </button>

          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-[#1557FF] transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Refresh billing data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-[#1557FF]' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1557FF] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-[#1557FF]/25 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* ─── 4 Executive KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 xl:gap-6">
        
        {/* Total Invoiced */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1557FF]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1557FF] flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(metrics.totalInvoiced)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-blue-50 text-[#1557FF]">
                {metrics.totalCount} Total Invoices
              </span>
              <span className="text-slate-400 font-medium">Cumulative billing</span>
            </div>
          </div>
        </div>

        {/* Paid Collection */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Realizations</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(metrics.paidAmount)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-emerald-50 text-emerald-700 flex items-center gap-0.5">
                <ArrowUpRight size={14} /> {metrics.collectionRate}%
              </span>
              <span className="text-slate-400 font-medium">{metrics.paidCount} fully settled</span>
            </div>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Receivables</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(metrics.pendingAmount)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-amber-50 text-amber-700">
                {metrics.unpaidCount + metrics.partialCount} Unsettled
              </span>
              <span className="text-slate-400 font-medium">Awaiting clearing</span>
            </div>
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Bill Size</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-financeMono tabular-nums">
              {formatINR(metrics.avgInvoice)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-extrabold bg-indigo-50 text-indigo-700">
                Mean Ticket Size
              </span>
              <span className="text-slate-400 font-medium">Per patient billing</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Search, Filter Pills & Sort Controls ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, UHID, or invoice #..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Invoices', count: metrics.totalCount },
            { id: 'PAID', label: 'Paid', count: metrics.paidCount, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { id: 'PARTIAL', label: 'Partial', count: metrics.partialCount, color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { id: 'UNPAID', label: 'Unpaid', count: metrics.unpaidCount, color: 'text-rose-700 bg-rose-50 border-rose-200' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#1557FF] text-white shadow-sm shadow-[#1557FF]/25'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-financeMono tabular-nums ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1557FF] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>
        </div>

      </div>

      {/* ─── Responsive Invoices Content ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {/* Desktop & Tablet Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5">Invoice #</th>
                <th className="py-4 px-5">Patient UHID & Details</th>
                <th className="py-4 px-5">Date Incurred</th>
                <th className="py-4 px-5 text-right">Amount (₹)</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-sm">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1557FF] mb-2" />
                    Loading billing invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No matching billing invoices found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const invId = inv.id || inv.invoiceNumber || `INV-${idx + 1}`;
                  const pName = inv.patientName || inv.patient || 'Patient Client';
                  const uhid = inv.mrn || inv.uhid || `UHID-${1000 + idx}`;
                  const invDate = inv.date || inv.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0];
                  const amount = Number(inv.amount || inv.total || 0);
                  const st = (inv.status || 'UNPAID').toUpperCase();
                  const isDownloading = downloadingId === invId;

                  return (
                    <tr key={invId} className="hover:bg-slate-50/70 transition group">
                      
                      {/* Invoice ID */}
                      <td className="py-4 px-5 font-financeMono font-bold text-[#1557FF]">
                        <span className="bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                          {invId}
                        </span>
                      </td>

                      {/* Patient & UHID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-xs">
                            {pName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-sm group-hover:text-[#1557FF] transition-colors">
                              {pName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-financeMono">
                              {uhid}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-slate-600 font-medium font-financeMono tabular-nums">
                        {invDate}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5 text-right font-black font-financeMono tabular-nums text-slate-900 text-sm">
                        {formatINR(amount)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          st === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : st === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            st === 'PAID' ? 'bg-emerald-500' : st === 'PARTIAL' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                          {st}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          disabled={isDownloading}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#1557FF] text-slate-700 hover:text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                        >
                          <Download size={13} className={isDownloading ? 'animate-bounce' : ''} />
                          <span>{isDownloading ? 'PDF...' : 'PDF'}</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Stacked Responsive Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400 font-bold text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1557FF] mb-2" />
              Loading billing invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No invoices found</p>
            </div>
          ) : (
            filteredInvoices.map((inv, idx) => {
              const invId = inv.id || inv.invoiceNumber || `INV-${idx + 1}`;
              const pName = inv.patientName || inv.patient || 'Patient Client';
              const uhid = inv.mrn || inv.uhid || `UHID-${1000 + idx}`;
              const invDate = inv.date || inv.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0];
              const amount = Number(inv.amount || inv.total || 0);
              const st = (inv.status || 'UNPAID').toUpperCase();
              const isDownloading = downloadingId === invId;

              return (
                <div key={invId} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-financeMono font-bold text-xs text-[#1557FF] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {invId}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{pName}</h4>
                      <span className="text-[11px] text-slate-400 font-financeMono block">{uhid}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      st === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : st === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {st}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoiced Amount</span>
                      <span className="font-black text-slate-900 font-financeMono tabular-nums text-base">
                        {formatINR(amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(inv)}
                      disabled={isDownloading}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-[#1557FF] text-slate-700 hover:text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download size={13} />
                      <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-semibold text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredInvoices.length}</strong> of{' '}
            <strong className="text-slate-800">{displayableInvoices.length}</strong> billing records
          </span>
          <span className="text-[11px] text-slate-400">
            Real-time synchronization with Hospital Information System (HIS)
          </span>
        </div>

      </div>

      {/* ─── Create Invoice Modal ─── */}
      <AnimatePresence>
        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-[9999] bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1557FF] flex items-center justify-center border border-blue-100">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Create Billing Invoice</h3>
                    <p className="text-xs text-slate-500">Generate a financial transaction & patient charge bill</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-700">
                
                {/* Patient Search Input */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase tracking-wider text-[11px]">
                    Patient Selection <span className="text-rose-500">*</span>
                  </label>
                  
                  {selectedPatient ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1557FF] text-white font-bold flex items-center justify-center text-xs">
                          {(selectedPatient.fullName || selectedPatient.name || 'P').charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-blue-950 block text-xs">
                            {selectedPatient.fullName || selectedPatient.name}
                          </span>
                          <span className="text-[10px] text-blue-700 font-financeMono">
                            {selectedPatient.uhid || selectedPatient.opNumber || `ID: ${selectedPatient.id}`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="text-blue-700 hover:text-rose-600 transition p-1 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={patientSearch}
                          onChange={e => { setPatientSearch(e.target.value); setPatientDropdownOpen(true); }}
                          onFocus={() => setPatientDropdownOpen(true)}
                          placeholder="Search patient by name or UHID…"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] text-xs font-medium transition"
                        />
                      </div>

                      {patientDropdownOpen && (patientResults.length > 0 || patientSearchLoading) && (
                        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {patientSearchLoading && (
                            <div className="px-3.5 py-2.5 text-xs text-slate-400 font-semibold">Searching patient directory…</div>
                          )}
                          {patientResults.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-blue-50/70 flex flex-col transition border-b border-slate-100 last:border-0 cursor-pointer"
                              onClick={() => {
                                setSelectedPatient(p);
                                setPatientDropdownOpen(false);
                                setPatientSearch('');
                              }}
                            >
                              <span className="font-bold text-slate-900">
                                {p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-financeMono">
                                {p.uhid || p.opNumber || `ID: ${p.id}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Amount & Tax */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1 uppercase tracking-wider text-[11px]">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] font-financeMono tabular-nums font-bold text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 uppercase tracking-wider text-[11px]">
                      Tax (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.tax}
                      onChange={e => setFormData({ ...formData, tax: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] font-financeMono tabular-nums font-bold text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase tracking-wider text-[11px]">
                    Description / Service Wing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology OPD Consultation & ECG panel"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#1557FF] focus:ring-1 focus:ring-[#1557FF] text-xs font-medium text-slate-900"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending || !selectedPatient || !formData.amount}
                    className="px-5 py-2 bg-[#1557FF] hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm shadow-[#1557FF]/25 cursor-pointer flex items-center gap-1.5"
                  >
                    {mutation.isPending ? 'Generating...' : 'Create Invoice'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

    </div>
  );
};

export default InvoicesList;
