import { useState } from 'react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';



const REJECTION_REASONS = ['Damaged', 'Wrong Item', 'Short Expiry', 'Quality Fail'];
const EMPTY_ITEM = {
  medicine: null, poItemId: null, orderedQuantity: 0,
  receivedQuantity: '', rejectedQuantity: '', rejectionReason: '',
  batchNumber: '', manufacturingDate: '', expiryDate: '', mrp: '', purchaseRate: ''
};

export default function GRNEntry({ onBack }) {
  const queryClient = useQueryClient();

  const { data: rawSuppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await pharmacyService.getSuppliers();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const suppliers = rawSuppliers;
  
  const [poSearch, setPoSearch] = useState('');
  const [po, setPo] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState([EMPTY_ITEM]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const poMutation = useMutation({
    mutationFn: async () => {
      const res = await pharmacyService.api.get(`/pharmacy/purchase-orders?searchTerm=${poSearch}`);
      const page = res.data?.data;
      const found = page?.content?.[0] || null;
      if (!found) throw new Error('No PO found with that number');
      return found;
    },
    onSuccess: (found) => {
      setPo(found);
      setSelectedSupplierId(found.supplier?.id || '');
      setItems(found.items?.map(i => ({
        ...EMPTY_ITEM,
        medicine: i.medicine,
        poItemId: i.id,
        orderedQuantity: i.quantity || 0,
        purchaseRate: i.negotiatedPrice || i.estimatedUnitPrice || ''
      })) || [EMPTY_ITEM]);
      toast.success(`PO loaded: ${found.poNumber}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to load PO');
    }
  });

  const loadPo = () => {
    if (!poSearch.trim()) return;
    poMutation.mutate();
  };

  const setItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const saveMutation = useMutation({
    mutationFn: async ({ payload, confirm }) => {
      const created = await pharmacyService.createGrn(payload);
      if (!created.success) throw new Error('GRN creation failed');

      if (confirm) {
        const confirmed = await pharmacyService.confirmGrn(created.data.id);
        if (!confirmed.success) throw new Error('GRN created but stock update failed');
      }
      return confirm;
    },
    onSuccess: (confirm) => {
      if (confirm) {
        toast.success('GRN confirmed! Stock updated.');
      } else {
        toast.success('GRN saved as draft');
      }
      queryClient.invalidateQueries(['goods-receipts']);
      onBack();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save GRN');
    }
  });

  const handleSave = (confirm = false) => {
    if (!selectedSupplierId) { toast.error('Select a supplier'); return; }
    if (items.some(it => !it.medicine && !it.medicineName)) { toast.error('Each item must have a medicine'); return; }

    const payload = {
      supplier: { id: parseInt(selectedSupplierId) },
      purchaseOrder: po ? { id: po.id } : null,
      supplierInvoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate || null,
      deliveryChallanNumber: challanNumber,
      vehicleNumber,
      status: 'DRAFT',
      items: items.map(it => ({
        medicine: it.medicine ? { id: it.medicine.id } : null,
        poItemId: it.poItemId || null,
        orderedQuantity: parseInt(it.orderedQuantity) || 0,
        receivedQuantity: parseInt(it.receivedQuantity) || 0,
        rejectedQuantity: parseInt(it.rejectedQuantity) || 0,
        rejectionReason: it.rejectionReason || null,
        batchNumber: it.batchNumber || null,
        manufacturingDate: it.manufacturingDate || null,
        expiryDate: it.expiryDate || null,
        mrp: parseFloat(it.mrp) || null,
        purchaseRate: parseFloat(it.purchaseRate) || null,
      }))
    };

    saveMutation.mutate({ payload, confirm });
  };

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] bg-white transition-colors placeholder:text-slate-400";
  const tableInputCls = "w-full px-3 py-1.5 text-sm border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] bg-white transition-colors text-center placeholder:text-slate-400";
  const tableSelectCls = "w-full px-3 py-1.5 text-sm border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] bg-white transition-colors placeholder:text-slate-400";
  const tableDateCls = "w-full px-3 py-1.5 text-sm border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] bg-white transition-colors placeholder:text-slate-400 text-slate-600";

  return (
    
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-200 bg-slate-100 rounded-xl text-slate-600 transition-colors mr-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Goods Receipt Note (GRN)</h2>
          <p className="text-sm text-slate-500 font-medium">Record delivery against a Purchase Order</p>
        </div>
      </div>

      {/* PO Loader */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Link to Purchase Order (Optional)</div>
        <div className="flex gap-4 items-center">
          <input value={poSearch} onChange={e => setPoSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadPo()}
            placeholder="Enter PO number (e.g. PO-2024-0622-1234)" className={`flex-1 ${inputCls}`} />
          <button onClick={loadPo} disabled={poMutation.isPending}
            className="px-6 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
            <FileText className="w-4 h-4" /> {poMutation.isPending ? 'Loading…' : 'Load PO'}
          </button>
        </div>
        {po && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-blue-800">{po.poNumber}</span>
              <span className="text-blue-600 ml-2 font-medium">· {po.supplier?.name} · {po.items?.length} item(s) · ₹{Number(po.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Header Details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">GRN Header Details</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Supplier *</label>
            <select className={inputCls} value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Supplier Invoice No.</label>
            <input className={inputCls} placeholder="INV-2024-001" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Invoice Date</label>
            <input type="date" className={inputCls} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Delivery Challan No.</label>
            <input className={inputCls} placeholder="DC-2024-001" value={challanNumber} onChange={e => setChallanNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vehicle Number</label>
            <input className={inputCls} placeholder="TN 01 AB 1234" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items</div>
          <button onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto pb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Medicine','Ordered Qty','Received Qty','Rejected Qty','Rejection Reason','Batch No.','Mfg Date','Expiry Date','MRP (₹)','Purchase Rate',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-50/50 hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-4 min-w-[220px]">
                    {po ? (
                      <div>
                        <div className="text-sm font-semibold text-slate-700">{item.medicine?.name || <span className="text-slate-300 italic">No medicine</span>}</div>
                        {item.medicine?.code && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.medicine.code}</div>}
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search medicine" className={`${tableInputCls} pl-9 text-left`} 
                          value={item.medicineName || ''} onChange={e => setItem(idx, 'medicineName', e.target.value)} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-center text-slate-700 font-semibold">{item.orderedQuantity}</td>
                  <td className="px-4 py-4">
                    <input type="number" min="0" className={tableInputCls} style={{width: 80}}
                      value={item.receivedQuantity} onChange={e => setItem(idx, 'receivedQuantity', e.target.value)} placeholder="0" />
                  </td>
                  <td className="px-4 py-4">
                    <input type="number" min="0" className={tableInputCls} style={{width: 80}}
                      value={item.rejectedQuantity} onChange={e => setItem(idx, 'rejectedQuantity', e.target.value)} placeholder="0" />
                  </td>
                  <td className="px-4 py-4 min-w-[140px]">
                    <select className={tableSelectCls} value={item.rejectionReason}
                      onChange={e => setItem(idx, 'rejectionReason', e.target.value)}>
                      <option value="">None</option>
                      {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input type="text" className={tableInputCls} style={{width: 110, textAlign: 'left'}} value={item.batchNumber}
                      onChange={e => setItem(idx, 'batchNumber', e.target.value)} placeholder="BTH001" />
                  </td>
                  <td className="px-4 py-4">
                    <input type="date" className={tableDateCls} style={{width: 140}} value={item.manufacturingDate}
                      onChange={e => setItem(idx, 'manufacturingDate', e.target.value)} />
                  </td>
                  <td className="px-4 py-4">
                    <input type="date" className={tableDateCls} style={{width: 140}} value={item.expiryDate}
                      onChange={e => setItem(idx, 'expiryDate', e.target.value)} />
                  </td>
                  <td className="px-4 py-4">
                    <input type="number" className={tableInputCls} style={{width: 90}} value={item.mrp}
                      onChange={e => setItem(idx, 'mrp', e.target.value)} placeholder="0.00" />
                  </td>
                  <td className="px-4 py-4">
                    <input type="number" className={tableInputCls} style={{width: 90}} value={item.purchaseRate}
                      onChange={e => setItem(idx, 'purchaseRate', e.target.value)} placeholder="0.00" />
                  </td>
                  <td className="px-4 py-4">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-2">
        <button onClick={onBack} className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
          Cancel
        </button>
        <button onClick={() => handleSave(false)} disabled={saveMutation.isPending}
          className="px-6 py-2.5 border border-[#2563eb]/30 text-[#2563eb] text-sm font-semibold rounded-xl hover:bg-[#2563eb]/5 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm">
          <Save className="w-4 h-4" /> Save as Draft
        </button>
        <button onClick={() => handleSave(true)} disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-[#10b981] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm">
          <CheckCircle2 className="w-4 h-4" /> Confirm GRN & Update Stock
        </button>
      </div>
    </div>
    
  );
}
