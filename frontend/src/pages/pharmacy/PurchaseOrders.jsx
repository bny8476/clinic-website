import logger from '../../utils/logger';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import ErrorBanner from '../../components/pharmacy/ui/ErrorBanner';
import ModuleFilterBar from '../../components/pharmacy/ui/ModuleFilterBar';
import TableSkeleton from '../../components/pharmacy/ui/TableSkeleton';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useAuth } from '../../context/pharmacy/AuthContext';
import { Check, Eye, FileText, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export default function PurchaseOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
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
    poDateRange: dateRange,
    setPoSearch: setSearchTerm,
    setPoStatusFilter: setStatusFilter,
    setPoDateRange: setDateRange,
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
    poDateRange: state.poDateRange,
    setPoSearch: state.setPoSearch,
    setPoStatusFilter: state.setPoStatusFilter,
    setPoDateRange: state.setPoDateRange,
    setPoPage: state.setPoPage,
    fetchPurchaseOrders: state.fetchPurchaseOrders
  })));

  useEffect(() => {
    refetch();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  // Form State
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

  // Pagination, filtering, search and syncing URL are handled by Zustand

  useEffect(() => {
    // Load suppliers for dropdown
    pharmacyService.getSuppliers().then(res => setSuppliers(res.data?.content || res.data || []));
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
      setSearchResults(response?.data || response || []);
    } catch (error) {
      logger.error(error);
    }
  };

  const selectMedicine = (stock, idx) => {
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      medicineId: stock.medicine?.id || stock.id,
      medicineName: stock.medicine?.name || stock.name || '',
      unitPrice: stock.purchaseRate || 0
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
    if (validItems.length === 0) return toast.error('Add at least one valid item');

    setIsSubmitting(true);
    const selectedSupplier = suppliers.find(s => s.id === parseInt(supplierId) || s.id === supplierId);

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
      // Assuming a POST endpoint exists
      const response = await pharmacyService.api.post('/pharmacy/purchase-orders', payload);
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

  const columns = [
    { header: 'PO No', accessor: 'poNumber' },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'Order Date', render: (row) => new Date(row.orderDate || Date.now()).toLocaleDateString('en-IN') },
    { header: 'Expected Delivery', render: (row) => row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString('en-IN') : '-' },
    { header: 'Total Amount', render: (row) => <span className="font-bold">₹{Number(row.totalValue || row.totalAmount || 0).toFixed(2)}</span> },
    {
      header: 'Status', render: (row) => {
        const variants = { draft: 'default', submitted: 'warning', approved: 'primary', completed: 'success', cancelled: 'danger' };
        return <Badge variant={variants[row.status?.toLowerCase()] || 'default'}>{row.status || 'DRAFT'}</Badge>;
      }
    },
    {
      header: 'Action', render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            title="View Details"
            onClick={() => navigate(`/pharmacy/purchase-orders/${row.poId || row.id}`)} 
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            title="Delete PO"
            onClick={() => handleDeletePO(row.poId || row.id)} 
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Orders</h2>
        <p className="text-sm text-gray-500 font-medium">Manage and track supplier purchase orders</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <ModuleFilterBar searchPlaceholder="Search..."
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            dateRange={dateRange}
            onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
            hideDateRange={false}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-700"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-200/50 transition-all"
        >
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isError ? (
          <div className="p-6">
            <ErrorBanner onRetry={refetch} message="Failed to load purchase orders. Check connection." />
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : !isLoading && !isError && poList.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-semibold text-lg">No Purchase Orders Found</p>
            <p className="text-sm text-gray-400">Click '+ New PO' to create one.</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={poList} hover striped />
            {totalElements > 0 && (
              <Pagination
                totalRecords={totalElements}
                currentPage={page + 1}
                pageSize={20}
                onPageChange={(p) => goToPage(p - 1)}
              />
            )}
          </>
        )}
      </div>

      {/* New PO Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetModal(); }}
        title="Create Purchase Order"
        size="2xl"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button 
              type="button"
              onClick={() => { setIsModalOpen(false); resetModal(); }} 
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSavePO} 
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating PO...' : 'Create Purchase Order'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select 
                value={supplierId} 
                onChange={e => setSupplierId(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Expected Delivery <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={expectedDeliveryDate} 
                onChange={e => setExpectedDeliveryDate(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Notes</label>
              <input 
                type="text" 
                placeholder="Internal notes or remarks..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200/80 rounded-2xl overflow-visible shadow-sm bg-white">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase Items</h4>
              <span className="text-xs text-slate-400 font-medium">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>

            {/* Desktop Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Medicine Name</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price (₹)</div>
              <div className="col-span-2 text-right">Total (₹)</div>
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
                        placeholder="Search medicine name..."
                        value={item.medicineName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newItems = [...items];
                          newItems[idx].medicineName = val;
                          setItems(newItems);
                          handleStockSearch(val, idx);
                        }}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
                              {(stock.purchaseRate || stock.mrp) && (
                                <span className="text-xs font-semibold text-blue-600">₹{stock.purchaseRate || stock.mrp}</span>
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
                      className="w-full text-center px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" 
                    />
                  </div>

                  {/* Unit Price Input */}
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-xs font-semibold text-slate-500 mb-1 block">Unit Price (₹)</label>
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
                      className="w-full text-right px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" 
                    />
                  </div>

                  {/* Calculated Line Total */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between text-right">
                    <span className="sm:hidden text-xs font-semibold text-slate-500">Total:</span>
                    <span className="font-bold text-sm text-slate-800">
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
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
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
              className="w-full py-3 bg-blue-50/50 hover:bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          {/* Pricing Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400">
              * GST and grand total are calculated automatically based on subtotal.
            </div>
            <div className="w-full sm:w-80 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 ml-auto shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">₹{calculateSubtotal().toFixed(2)}</span>
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
                    className="w-16 px-2.5 py-1 text-right text-sm font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Tax Amount</span>
                <span className="font-bold text-amber-600">₹{calculateTaxAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-slate-200 font-bold">
                <span className="text-slate-800">Grand Total</span>
                <span className="text-blue-600 text-lg">₹{calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

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
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
    
  );
}
