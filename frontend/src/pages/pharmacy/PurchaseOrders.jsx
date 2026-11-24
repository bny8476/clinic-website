import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import ErrorBanner from '../../components/pharmacy/ui/ErrorBanner';
import TableSkeleton from '../../components/pharmacy/ui/TableSkeleton';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'react-hot-toast';
import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useAuth } from '../../context/pharmacy/AuthContext';
import { 
  Building2, 
  Calendar, 
  Check, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Eye, 
  FileCheck, 
  FileText, 
  Filter, 
  Layers, 
  Loader2, 
  Package, 
  PackageCheck, 
  Plus, 
  RefreshCw, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Truck, 
  X 
} from 'lucide-react';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    poList,
    poLoading: isLoading,
    poError: isError,
    poPage: page,
    poTotalElements: totalElements,
    poSearchTerm: searchTerm,
    poStatusFilter: statusFilter,
    setPoSearch: setSearchTerm,
    setPoStatusFilter: setStatusFilter,
    setPoPage: goToPage,
    fetchPurchaseOrders: refetch
  } = usePurchaseStore(useShallow(state => ({
    poList: state.poList,
    poLoading: state.poLoading,
    poError: state.poError,
    poPage: state.poPage,
    poTotalElements: state.poTotalElements,
    poSearchTerm: state.poSearchTerm,
    poStatusFilter: state.poStatusFilter,
    setPoSearch: state.setPoSearch,
    setPoStatusFilter: state.setPoStatusFilter,
    setPoPage: state.setPoPage,
    fetchPurchaseOrders: state.fetchPurchaseOrders
  })));

  useEffect(() => {
    refetch();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  // Modal Form State
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [taxPercent, setTaxPercent] = useState(18);
  const [items, setItems] = useState([
    { id: 1, medicineId: null, medicineName: '', qty: 1, unitPrice: 0 }
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);

  useEffect(() => {
    pharmacyService.getSuppliers().then(res => {
      const raw = res?.data?.content || res?.content || res?.data || res || [];
      setSuppliers(Array.isArray(raw) ? raw : []);
    }).catch(err => logger.error('Failed to load suppliers', err));
  }, []);

  const handleStockSearch = async (val, idx) => {
    if (val.length < 2) {
      setSearchResults([]);
      setActiveSearchIdx(null);
      return;
    }
    setActiveSearchIdx(idx);
    try {
      const response = await pharmacyService.searchStocks(val);
      const list = response?.data?.content || response?.content || response?.data || response || [];
      setSearchResults(Array.isArray(list) ? list : []);
    } catch (error) {
      logger.error('Stock search failed', error);
    }
  };

  const selectMedicine = (stock, idx) => {
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      medicineId: stock.medicine?.id || stock.medicineId || stock.id,
      medicineName: stock.medicine?.name || stock.name || '',
      unitPrice: stock.purchaseRate || stock.purchasePrice || stock.mrp || 0
    };
    setItems(newItems);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const resetModal = () => {
    setSupplierId('');
    const d = new Date(); d.setDate(d.getDate() + 3);
    setExpectedDeliveryDate(d.toISOString().split('T')[0]);
    setNotes('');
    setTaxPercent(18);
    setItems([{ id: 1, medicineId: null, medicineName: '', qty: 1, unitPrice: 0 }]);
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.qty)), 0);
  const calculateTaxAmount = () => (calculateSubtotal() * taxPercent) / 100;
  const calculateGrandTotal = () => calculateSubtotal() + calculateTaxAmount();

  const handleSavePO = async () => {
    if (!supplierId) return toast.error('Please select a supplier');
    if (!expectedDeliveryDate) return toast.error('Please set expected delivery date');
    const validItems = items.filter(i => i.medicineId && i.qty > 0 && i.unitPrice > 0);
    if (validItems.length === 0) return toast.error('Add at least one valid item with name, quantity, and unit price');

    setIsSubmitting(true);
    const selectedSupplier = suppliers.find(s => String(s.id) === String(supplierId));

    const payload = {
      supplier: { id: supplierId },
      supplierName: selectedSupplier?.name || 'Unknown Supplier',
      expectedDeliveryDate,
      createdBy: user?.id || 1,
      notes,
      gstAmount: calculateTaxAmount(),
      subtotal: calculateSubtotal(),
      totalValue: calculateGrandTotal(),
      lineItems: validItems.map(i => {
        const itemSubtotal = Number(i.qty) * Number(i.unitPrice);
        const itemGst = (itemSubtotal * taxPercent) / 100;
        return {
          medicine: { id: i.medicineId }, 
          medicineName: i.medicineName,
          orderedQuantity: Number(i.qty), 
          unitPrice: Number(i.unitPrice),
          gstPercentage: taxPercent,
          lineSubtotal: itemSubtotal,
          lineGst: itemGst,
          lineTotal: itemSubtotal + itemGst
        };
      })
    };

    try {
      await pharmacyService.api.post('/pharmacy/purchase-orders', payload);
      toast.success('Purchase Order created successfully');
      setIsModalOpen(false);
      resetModal();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePO = (poId) => {
    setConfirmDelete({ isOpen: true, id: poId });
  };

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    let pendingCount = 0;
    let approvedCount = 0;
    let completedCount = 0;
    let totalProcurementValue = 0;

    poList.forEach(po => {
      const st = (po.status || 'draft').toLowerCase();
      const val = Number(po.totalValue || po.totalAmount || 0);
      totalProcurementValue += val;

      if (st === 'submitted' || st === 'pending') pendingCount++;
      else if (st === 'approved' || st === 'sent') approvedCount++;
      else if (st === 'completed' || st === 'received') completedCount++;
    });

    return {
      total: totalElements || poList.length,
      pendingCount,
      approvedCount,
      completedCount,
      totalProcurementValue
    };
  }, [poList, totalElements]);

  const getStatusBadge = (status) => {
    const st = (status || 'draft').toLowerCase();
    switch (st) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
            <Check className="w-3 h-3 text-blue-600" /> Approved
          </span>
        );
      case 'submitted':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
            <Clock className="w-3 h-3 text-amber-600" /> Submitted
          </span>
        );
      case 'completed':
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
            <X className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 border border-blue-100">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Purchase Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Procurement orders, replenishment indent verification, and supplier fulfillment tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/60 disabled:opacity-50"
            title="Refresh purchase orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total POs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{kpiMetrics.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Procurement orders created</div>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approval / Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending Verification
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{kpiMetrics.pendingCount}</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Awaiting storekeeper approval</div>
          </div>
          <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Approved Orders */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs bg-blue-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Approved / In Transit
            </div>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">{kpiMetrics.approvedCount}</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">Dispatched by suppliers</div>
          </div>
          <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Completed / Received */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled & Inwarded
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{kpiMetrics.completedCount}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">Stock GRN accepted</div>
          </div>
          <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Segmented Filter Toolbar ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="flex-1 relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by PO number, supplier name, or remarks…"
              className="w-full pl-10 pr-9 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-slate-400 transition-all"
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

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'DRAFT', label: 'Draft' },
              { id: 'PENDING', label: 'Submitted' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'RECEIVED', label: 'Received' },
              { id: 'CANCELLED', label: 'Cancelled' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Results Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-700">{poList.length}</span> of {totalElements || poList.length} purchase orders
            {statusFilter !== 'ALL' && <span className="ml-1 text-slate-600">filtered by <strong className="uppercase">{statusFilter}</strong></span>}
          </div>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} 
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Purchase Orders Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isError ? (
          <div className="p-6">
            <ErrorBanner onRetry={refetch} message="Failed to load purchase orders. Check connection." />
          </div>
        ) : isLoading ? (
          <div className="p-8">
            <TableSkeleton rows={6} columns={7} />
          </div>
        ) : poList.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Purchase Orders Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'No orders match your active search and filter criteria.' 
                : 'Get started by creating your first purchase order for supplier restocking.'}
            </p>
            <button
              onClick={() => {
                if (searchTerm || statusFilter !== 'ALL') {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-xs border-none"
            >
              {searchTerm || statusFilter !== 'ALL' ? 'Reset Filters' : '+ New Purchase Order'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PO Reference</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Delivery</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Order Value</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {poList.map((row) => {
                  const poId = row.poId || row.id;
                  const poNum = row.poNumber || `PO-${poId?.substring(0, 8) || 'REF'}`;
                  const orderDate = row.poDate || row.orderDate || row.createdAt;
                  const total = Number(row.totalValue || row.totalAmount || 0);

                  return (
                    <tr 
                      key={poId}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/pharmacy/purchase-orders/${poId}`)}
                    >
                      {/* PO Number */}
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-bold text-blue-600 group-hover:underline">
                          {poNum}
                        </div>
                        {row.priority && row.priority !== 'routine' && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                            {row.priority}
                          </span>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{row.supplierName || 'Primary Supplier'}</span>
                        </div>
                        {row.supplierGstin && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            GSTIN: {row.supplierGstin}
                          </div>
                        )}
                      </td>

                      {/* Order Date */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{orderDate ? new Date(orderDate).toLocaleDateString('en-IN') : '—'}</span>
                        </div>
                      </td>

                      {/* Expected Delivery */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Not specified'}</span>
                        </div>
                      </td>

                      {/* Order Value */}
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-extrabold text-slate-800 font-mono">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {row.lineItems?.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.lineItems.length} line item{row.lineItems.length === 1 ? '' : 's'}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            title="View PO Details"
                            onClick={() => navigate(`/pharmacy/purchase-orders/${poId}`)} 
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border-none"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {row.status?.toLowerCase() === 'approved' && (
                            <button
                              title="Inward Goods Received Note"
                              onClick={() => navigate('/pharmacy/grn-entry')}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                            >
                              GRN
                            </button>
                          )}

                          <button 
                            title="Delete Purchase Order"
                            onClick={() => handleDeletePO(poId)} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalElements > 20 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              totalRecords={totalElements}
              currentPage={page + 1}
              pageSize={20}
              onPageChange={(p) => goToPage(p - 1)}
            />
          </div>
        )}
      </div>

      {/* ── CREATE PURCHASE ORDER MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetModal(); }}
        title="Create Purchase Order"
        description="Select vendor, items, and pricing to issue a formal purchase order to suppliers."
        size="2xl"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <button 
              type="button"
              onClick={() => { setIsModalOpen(false); resetModal(); }} 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button 
              type="button"
              onClick={handleSavePO} 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer border-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PO...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Supplier Vendor <span className="text-rose-500">*</span>
              </label>
              <select 
                value={supplierId} 
                onChange={e => setSupplierId(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-xs cursor-pointer"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Expected Delivery Date <span className="text-rose-500">*</span>
              </label>
              <input 
                type="date" 
                value={expectedDeliveryDate} 
                onChange={e => setExpectedDeliveryDate(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-xs" 
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Internal Remarks / Notes</label>
              <input 
                type="text" 
                placeholder="Shipment terms or notes..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-xs placeholder:text-slate-400" 
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200/80 rounded-2xl overflow-visible shadow-xs bg-white">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" /> Order Items ({items.length})
              </h4>
              <span className="text-xs text-slate-400 font-medium">Search stock medicines or enter details</span>
            </div>

            {/* Desktop Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Medicine Item</div>
              <div className="col-span-2 text-center">Ordered Qty</div>
              <div className="col-span-2 text-right">Unit Rate (₹)</div>
              <div className="col-span-2 text-right">Line Total (₹)</div>
              <div className="col-span-1 text-center"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 sm:px-4 sm:py-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:bg-slate-50/50 transition-colors">
                  {/* Medicine Autocomplete Input */}
                  <div className="sm:col-span-5 relative">
                    <label className="sm:hidden text-xs font-semibold text-slate-500 mb-1 block">Medicine Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search stock medicine..."
                        value={item.medicineName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newItems = [...items];
                          newItems[idx].medicineName = val;
                          setItems(newItems);
                          handleStockSearch(val, idx);
                        }}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                      />
                      {searchResults.length > 0 && activeSearchIdx === idx && item.medicineName.length > 1 && (
                        <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[280px] bg-white shadow-xl border border-blue-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                          {searchResults.map((stock) => (
                            <div 
                              key={stock.id} 
                              onClick={() => selectMedicine(stock, idx)} 
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between transition-colors"
                            >
                              <div className="font-bold text-sm text-slate-800">{stock.medicine?.name || stock.name}</div>
                              {(stock.purchaseRate || stock.purchasePrice || stock.mrp) && (
                                <span className="text-xs font-semibold text-blue-600 font-mono">
                                  ₹{stock.purchaseRate || stock.purchasePrice || stock.mrp}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-xs font-semibold text-slate-500 mb-1 block">Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.qty} 
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                        setItems(newItems);
                      }} 
                      className="w-full text-center px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono" 
                    />
                  </div>

                  {/* Unit Price Input */}
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-xs font-semibold text-slate-500 mb-1 block">Unit Rate (₹)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={item.unitPrice} 
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setItems(newItems);
                      }} 
                      className="w-full text-right px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono" 
                    />
                  </div>

                  {/* Calculated Line Total */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between text-right">
                    <span className="sm:hidden text-xs font-semibold text-slate-500">Total:</span>
                    <span className="font-bold text-sm text-slate-800 font-mono">
                      ₹{(Number(item.qty) * Number(item.unitPrice)).toFixed(2)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <div className="sm:col-span-1 flex justify-end sm:justify-center">
                    <button 
                      type="button"
                      title="Remove row"
                      disabled={items.length === 1}
                      onClick={() => {
                        if (items.length > 1) {
                          setItems(items.filter(s => s.id !== item.id));
                        }
                      }} 
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <button 
              type="button"
              onClick={() => setItems([...items, { id: Date.now(), medicineId: null, medicineName: '', qty: 1, unitPrice: 0 }])} 
              className="w-full py-3 bg-blue-50/50 hover:bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Item
            </button>
          </div>

          {/* Pricing Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400">
              * Tax (GST) and grand total are calculated automatically based on items subtotal.
            </div>
            <div className="w-full sm:w-80 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 ml-auto shadow-xs">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-800 font-mono">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500 font-medium">Tax (%)</span>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={taxPercent} 
                    onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)} 
                    className="w-16 px-2.5 py-1 text-right text-sm font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 font-mono" 
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Tax Amount</span>
                <span className="font-bold text-amber-600 font-mono">₹{calculateTaxAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-slate-200 font-bold">
                <span className="text-slate-800">Grand Total</span>
                <span className="text-blue-600 text-lg font-mono">₹{calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete Dialog ────────────────────────────────────────────── */}
      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={async () => {
          if (!confirmDelete.id) return;
          try {
            await pharmacyService.api.delete(`/pharmacy/purchase-orders/${confirmDelete.id}`);
            toast.success('Purchase Order deleted successfully');
            refetch();
          } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete PO');
          } finally {
            setConfirmDelete({ isOpen: false, id: null });
          }
        }}
        title="Delete Purchase Order"
        description="Are you sure you want to delete this Purchase Order? This action cannot be undone."
        confirmText="Delete Order"
        isDestructive={true}
      />
    </div>
  );
}
