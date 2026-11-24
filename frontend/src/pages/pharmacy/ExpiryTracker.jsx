import React, { useState, useMemo, useRef } from 'react';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  AlertOctagon, 
  AlertTriangle, 
  ArrowLeftRight, 
  Calendar, 
  CalendarX, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Info, 
  Layers, 
  Loader2, 
  PackageX, 
  RefreshCw, 
  RotateCcw, 
  Search, 
  ShieldAlert, 
  Truck, 
  X 
} from 'lucide-react';

const RETURN_REASONS = [
  'Expired Stock',
  'Short Expiry (≤ 30 Days)',
  'Near Expiry (≤ 90 Days)',
  'Damaged Packaging',
  'Manufacturer / Batch Recall',
  'Slow Moving / Overstocked',
  'Other'
];

export default function ExpiryTracker() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'SAFE'
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'returns'
  
  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('Expired Stock');
  const [remarks, setRemarks] = useState('');

  // 1. Fetch Batches
  const { data: batchesData, isLoading: batchesLoading, isRefetching: batchesRefetching } = useQuery({
    queryKey: ['expiry-batches'],
    queryFn: async () => {
      const res = await pharmacyService.getExpiryBatches();
      const raw = res?.data?.content || res?.content || res?.data || res || [];
      return Array.isArray(raw) ? raw : [];
    }
  });
  const batches = batchesData || [];

  // 2. Fetch Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['expiry-summary'],
    queryFn: async () => {
      const res = await pharmacyService.getExpirySummary();
      return res?.data || res || null;
    }
  });
  const summary = summaryData || null;

  // 3. Fetch Returns
  const { data: returnsData, isLoading: returnsLoading } = useQuery({
    queryKey: ['expiry-returns'],
    queryFn: async () => {
      const res = await pharmacyService.getExpiryReturns();
      const raw = res?.data?.content || res?.content || res?.data || res || [];
      return Array.isArray(raw) ? raw : [];
    }
  });
  const returns = returnsData || [];

  const loading = batchesLoading || summaryLoading || returnsLoading;

  // 4. Return Mutation
  const returnMutation = useMutation({
    mutationFn: (data) => pharmacyService.initiateExpiryReturn(data),
    onSuccess: () => {
      toast.success('Return workflow initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['expiry-batches'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-returns'] });
      closeReturnModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to initiate return');
    }
  });

  const openReturnModal = (batch) => {
    setSelectedBatch(batch);
    const avail = getAvailableQty(batch);
    setReturnQty(avail > 0 ? String(avail) : '1');
    setReturnReason(getDaysToExpiry(batch) < 0 ? 'Expired Stock' : 'Short Expiry (≤ 30 Days)');
    setRemarks('');
    setReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setSelectedBatch(null);
    setReturnQty('');
    setRemarks('');
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    const qty = parseInt(returnQty, 10);
    const maxQty = getAvailableQty(selectedBatch);
    
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid return quantity (minimum 1)');
      return;
    }
    if (qty > maxQty) {
      toast.error(`Return quantity cannot exceed available stock (${maxQty})`);
      return;
    }

    const batchId = selectedBatch.batchId || selectedBatch.id;
    returnMutation.mutate({
      batchId: batchId,
      returnedQuantity: qty,
      returnQuantity: qty,
      returnReason: returnReason,
      remarks: remarks
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['expiry-batches'] });
    queryClient.invalidateQueries({ queryKey: ['expiry-summary'] });
    queryClient.invalidateQueries({ queryKey: ['expiry-returns'] });
    toast.success('Refreshed inventory expiry data');
  };

  // Helper calculations
  function getDaysToExpiry(batch) {
    if (batch.daysToExpiry !== undefined && batch.daysToExpiry !== null) {
      return Number(batch.daysToExpiry);
    }
    if (!batch.expiryDate) return 999;
    const exp = new Date(batch.expiryDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getAvailableQty(batch) {
    if (batch.quantityAvailable !== undefined && batch.quantityAvailable !== null) {
      return Number(batch.quantityAvailable);
    }
    if (batch.quantity !== undefined && batch.quantity !== null) {
      return Number(batch.quantity);
    }
    return 0;
  }

  function getExpiryStatus(days) {
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'CRITICAL';
    if (days <= 90) return 'WARNING';
    return 'SAFE';
  }

  // Filtered batches list
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const days = getDaysToExpiry(batch);
      const status = getExpiryStatus(days);

      // Status filter
      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const medName = (batch.medicineName || '').toLowerCase();
        const genName = (batch.genericName || '').toLowerCase();
        const batchNum = (batch.batchNumber || '').toLowerCase();
        const suppName = (batch.supplierName || '').toLowerCase();
        const medCode = (batch.medicineCode || '').toLowerCase();

        return medName.includes(query) || 
               genName.includes(query) || 
               batchNum.includes(query) || 
               suppName.includes(query) ||
               medCode.includes(query);
      }

      return true;
    });
  }, [batches, statusFilter, searchTerm]);

  // Counts for tabs/filters
  const filterCounts = useMemo(() => {
    let expired = 0, critical = 0, warning = 0, safe = 0;
    batches.forEach(b => {
      const days = getDaysToExpiry(b);
      if (days < 0) expired++;
      else if (days <= 30) critical++;
      else if (days <= 90) warning++;
      else safe++;
    });
    return { all: batches.length, expired, critical, warning, safe };
  }, [batches]);

  // KPI Metrics Calculation
  const totalBatchesCount = summary?.totalActiveBatches ?? summary?.totalBatches ?? batches.length;
  const expiredCount = summary?.expiredBatches ?? filterCounts.expired;
  const nearExpiry30Count = summary?.expiringWithin30Days ?? summary?.nearExpiry30Days ?? filterCounts.critical;
  const nearExpiry90Count = summary?.nearExpiry90Days ?? filterCounts.warning;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold flex-shrink-0 border border-rose-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Expiry & Batch Tracker</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              FEFO inventory rotation, near-expiry alert ledger, and supplier return workflows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleRefresh} 
            disabled={loading || batchesRefetching}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/60 disabled:opacity-50"
            title="Refresh expiry records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || batchesRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Batches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Batches</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalBatchesCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active medicine batches</div>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Expired Batches */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" /> Expired Stock
            </div>
            <div className="text-2xl font-extrabold text-rose-700 mt-1">{expiredCount}</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">Immediate return / write-off</div>
          </div>
          <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <PackageX className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Near Expiry (<= 30 Days) */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Critical (≤ 30 Days)
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{nearExpiry30Count}</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Prioritize dispensing or return</div>
          </div>
          <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Warning Near Expiry (<= 90 Days) */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs bg-blue-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Warning (≤ 90 Days)
            </div>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">{nearExpiry90Count}</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">Monitor FEFO dispensing</div>
          </div>
          <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation: Batches vs Recent Returns ─────────────────── */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer border-b-2 transition-all ${
            activeTab === 'batches'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batch Expiry Ledger</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {batches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer border-b-2 transition-all ${
            activeTab === 'returns'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Supplier Returns History</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {returns.length}
          </span>
        </button>
      </div>

      {/* ── VIEW 1: BATCH EXPIRY LEDGER ─────────────────────────────────────── */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {/* Search Bar & Segmented Filter Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="flex-1 relative min-w-[260px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search medicine, generic name, batch number, or supplier…"
                  className="w-full pl-10 pr-9 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none placeholder:text-slate-400 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  All ({filterCounts.all})
                </button>

                <button
                  onClick={() => setStatusFilter('EXPIRED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'EXPIRED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Expired ({filterCounts.expired})
                </button>

                <button
                  onClick={() => setStatusFilter('CRITICAL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'CRITICAL'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ≤ 30d ({filterCounts.critical})
                </button>

                <button
                  onClick={() => setStatusFilter('WARNING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'WARNING'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                  }`}
                >
                  ≤ 90d ({filterCounts.warning})
                </button>

                <button
                  onClick={() => setStatusFilter('SAFE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'SAFE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  Safe ({filterCounts.safe})
                </button>
              </div>
            </div>

            {/* Results Counter and Active Filter Notice */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <div>
                Showing <span className="font-bold text-slate-700">{filteredBatches.length}</span> of {batches.length} batches
                {statusFilter !== 'ALL' && <span className="ml-1 text-slate-600">filtered by <span className="font-bold uppercase">{statusFilter}</span></span>}
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-rose-600 hover:underline font-semibold"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Batches Responsive Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {batchesLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" />
                <p className="text-sm font-semibold">Loading batch expiry records...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-slate-300">
                  <CalendarX className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No batches match your criteria</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchTerm 
                    ? `No batches matching "${searchTerm}" under filter "${statusFilter}".` 
                    : 'All stock batches are within healthy validity dates.'}
                </p>
                {(searchTerm || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                    className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Medicine & Formulation</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Batch No & Supplier</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Available Stock</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Expiry Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBatches.map((batch, index) => {
                      const days = getDaysToExpiry(batch);
                      const availQty = getAvailableQty(batch);
                      const isExpired = days < 0;
                      const isCritical = days >= 0 && days <= 30;
                      const isWarning = days > 30 && days <= 90;

                      return (
                        <tr 
                          key={batch.batchId || batch.id || index}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isExpired ? 'bg-rose-50/20' : isCritical ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Medicine Info */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-sm text-slate-800">
                              {batch.medicineName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {batch.genericName && (
                                <span className="text-[11px] text-slate-500">
                                  {batch.genericName}
                                </span>
                              )}
                              {batch.drugClass && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                  {batch.drugClass}
                                </span>
                              )}
                              {batch.medicineCode && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{batch.medicineCode}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Batch & Supplier */}
                          <td className="px-4 py-4">
                            <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md inline-block">
                              {batch.batchNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{batch.supplierName || 'Primary Supplier'}</span>
                            </div>
                          </td>

                          {/* Expiry Date */}
                          <td className="px-4 py-4">
                            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{batch.expiryDate || 'N/A'}</span>
                            </div>
                            <div className="text-[11px] mt-0.5 font-medium">
                              {isExpired ? (
                                <span className="text-rose-600 font-bold">
                                  Expired {Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} ago
                                </span>
                              ) : isCritical ? (
                                <span className="text-amber-700 font-bold">
                                  Expires in {days} day{days === 1 ? '' : 's'}
                                </span>
                              ) : isWarning ? (
                                <span className="text-blue-700 font-medium">
                                  Expires in {days} days
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium">
                                  {days} days remaining
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Available Stock */}
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm font-extrabold text-slate-800">
                              {availQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                            </div>
                            {batch.purchasePrice && (
                              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                ₹{(batch.purchasePrice * availQty).toLocaleString(undefined, { maximumFractionDigits: 2 })} val
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-4 text-center">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertOctagon className="w-3 h-3 text-rose-600" /> EXPIRED
                              </span>
                            ) : isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> CRITICAL ({days}d)
                              </span>
                            ) : isWarning ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Clock className="w-3 h-3 text-blue-600" /> WARNING ({days}d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SAFE ({days}d)
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => openReturnModal(batch)}
                              disabled={availQty <= 0}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                isExpired
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs'
                                  : isCritical
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: SUPPLIER RETURNS HISTORY ─────────────────────────────────── */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Supplier Return Records</h3>
              <p className="text-xs text-slate-500 mt-0.5">Dispatched or pending batch returns awaiting credit notes</p>
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total {returns.length} record{returns.length === 1 ? '' : 's'}
            </div>
          </div>

          {returnsLoading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" />
              <p className="text-sm font-semibold">Loading returns history...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">No returns recorded yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When you initiate a supplier return for expired or damaged stock, the status tracking will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Return Ref</th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Batch No</th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Qty Returned</th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date & Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {returns.map((ret) => (
                    <tr key={ret.returnId || ret.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-700">
                        {ret.returnId ? ret.returnId.substring(0, 8).toUpperCase() : 'RET-REF'}
                      </td>
                      <td className="px-4 py-4 font-mono font-semibold text-slate-800">
                        {ret.batchNumber || 'Batch ID: ' + (ret.batchId?.substring(0, 8) || 'N/A')}
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {ret.returnReason || 'Expiry return'}
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-slate-800">
                        {(ret.returnedQuantity || ret.returnQuantity || 0).toLocaleString()} units
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ret.returnStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ret.returnStatus === 'dispatched'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {ret.returnStatus || 'Initiated'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-700 font-semibold">
                          {ret.returnDate || (ret.createdAt ? new Date(ret.createdAt).toLocaleDateString() : 'Recent')}
                        </div>
                        {ret.remarks && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 max-w-xs truncate" title={ret.remarks}>
                            "{ret.remarks}"
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: INITIATE SUPPLIER RETURN ───────────────────────────────────── */}
      {selectedBatch && (
        <Modal
          isOpen={returnModalOpen}
          onClose={closeReturnModal}
          title="Initiate Supplier Return"
          description="Create a return consignment to claim credit or replacement for expired/damaged medicine."
          size="lg"
          maxWidth="max-w-xl"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <button
                type="button"
                onClick={closeReturnModal}
                disabled={returnMutation.isPending}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleReturnSubmit}
                disabled={returnMutation.isPending}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {returnMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Return...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4" />
                    Confirm Return Workflow
                  </>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            {/* Batch Info Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selected Batch</span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedBatch.batchNumber}
                </span>
              </div>
              <div className="text-base font-bold text-slate-800">{selectedBatch.medicineName}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Available</span>
                  <span className="font-bold text-slate-700">{getAvailableQty(selectedBatch)} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Expiry Date</span>
                  <span className="font-semibold text-rose-600">{selectedBatch.expiryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Supplier</span>
                  <span className="font-medium text-slate-700 truncate block">{selectedBatch.supplierName || 'Primary Supplier'}</span>
                </div>
              </div>
            </div>

            {/* Return Quantity */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Return Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={getAvailableQty(selectedBatch)}
                  value={returnQty}
                  onChange={e => setReturnQty(e.target.value)}
                  required
                  placeholder="Enter units to return"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setReturnQty(String(getAvailableQty(selectedBatch)))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Max All ({getAvailableQty(selectedBatch)})
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Stock will be immediately deducted from active inventory.
              </p>
            </div>

            {/* Return Reason */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Primary Reason for Return <span className="text-rose-500">*</span>
              </label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white cursor-pointer"
              >
                {RETURN_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Remarks / Notes */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Consignment Remarks / Note to Supplier
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Add courier tracking, credit note reference, or return instructions..."
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white resize-none"
              />
            </div>

            {/* Expected Credit Note Calculation */}
            {selectedBatch.purchasePrice && Number(returnQty) > 0 && (
              <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800">Expected Credit Amount:</span>
                <span className="font-mono font-extrabold text-sm text-rose-700">
                  ₹{(selectedBatch.purchasePrice * Number(returnQty)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
