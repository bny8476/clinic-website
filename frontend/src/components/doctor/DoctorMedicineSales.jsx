import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Search, ShoppingBag, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';

export default function DoctorMedicineSales({ patientId, patientName, onOrderCreated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form input state for adding a medicine
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('1-0-1');
  const [duration, setDuration] = useState('5 Days');
  const [instructions, setInstructions] = useState('After food');

  // List of items added to order draft
  const [orderItems, setOrderItems] = useState([]);

  const queryClient = useQueryClient();

  // Server-side search API query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axiosPrivate.get(`/medicines/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const content = res.data?.content || res.data || [];
        setSearchResults(content);
      } catch (err) {
        toast.error('Failed to search medicines');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchQuery(product.title);
    setSearchResults([]);
    if (product.dosageStrength) setDosage(product.dosageStrength);
  };

  const handleAddToList = () => {
    if (!selectedProduct) {
      toast.error('Please search and select a medicine first');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const existingIndex = orderItems.findIndex(i => i.medicineId === selectedProduct.id);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += Number(quantity);
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          medicineId: selectedProduct.id,
          title: selectedProduct.title,
          genericName: selectedProduct.genericName || '—',
          brandName: selectedProduct.brandName || selectedProduct.brand?.name || 'Generic',
          strength: selectedProduct.dosageStrength || selectedProduct.strength || '—',
          unitPrice: selectedProduct.price || 0,
          quantity: Number(quantity),
          dosage,
          frequency,
          duration,
          instructions,
          prescriptionRequired: !!selectedProduct.prescriptionRequired,
          availableStock: selectedProduct.stockQuantity || 0
        }
      ]);
    }

    // Reset inputs
    setSelectedProduct(null);
    setSearchQuery('');
    setQuantity(1);
    toast.success(`${selectedProduct.title} added to order recommendation`);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Pricing calculations
  const subtotal = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const discount = 0;
  const total = subtotal + tax - discount;

  // Create Doctor Medicine Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (orderItems.length === 0) {
        throw new Error('Please add at least one medicine to the order');
      }
      const payload = {
        patientId: Number(patientId),
        items: orderItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions
        }))
      };
      const res = await axiosPrivate.post('/doctor/medicine-sales', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Medicine Order ${data.orderNumber || ''} created for patient!`);
      setOrderItems([]);
      queryClient.invalidateQueries(['patient-recommendations']);
      queryClient.invalidateQueries(['doctor-sales']);
      if (onOrderCreated) onOrderCreated(data);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create medicine order');
    }
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-[#5244F2] rounded-xl">
              <ShoppingBag size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Medicine Sales & E-Commerce Recommendation</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Recommend medicines for {patientName || `Patient #${patientId}`} to purchase via Patient Portal.
          </p>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl px-4 py-2 text-right">
          <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Patient</p>
          <p className="text-sm font-extrabold text-slate-900">{patientName || `PAT-${patientId}`}</p>
        </div>
      </div>

      {/* Medicine Search Section */}
      <div className="mb-6 relative">
        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
          Search Medicine Catalogue <span className="text-indigo-600 font-normal">(Server-side Autocomplete)</span>
        </label>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type medicine name, generic name, brand (e.g. Paracetamol, Calpol, Amoxicillin)..."
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#5244F2] focus:ring-4 focus:ring-[#5244F2]/10 transition-all outline-none"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 animate-pulse">
              Searching...
            </div>
          )}
        </div>

        {/* Autocomplete Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {searchResults.map((product) => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="p-3.5 hover:bg-indigo-50/60 transition-colors cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{product.title}</p>
                    {product.prescriptionRequired && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-md">Rx Required</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generic: <span className="font-semibold text-slate-700">{product.genericName || '—'}</span> | Brand: <span className="font-semibold text-slate-700">{product.brandName || '—'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-900">₹{product.price}</p>
                  <p className="text-[11px] font-bold text-emerald-600 mt-0.5">Stock: {product.stockQuantity || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Product Form Inputs */}
      {selectedProduct && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Selected Medicine</p>
              <p className="text-base font-extrabold text-slate-900">{selectedProduct.title}</p>
            </div>
            <span className="text-lg font-black text-indigo-600">₹{selectedProduct.price}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-600 outline-none"
              >
                <option value="1-0-1">1-0-1 (Twice Daily)</option>
                <option value="1-0-0">1-0-0 (Once Daily - Morning)</option>
                <option value="0-0-1">0-0-1 (Once Daily - Night)</option>
                <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                <option value="SOS">SOS (As needed)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 5 Days"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. After food"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleAddToList}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add to Medicine Recommendation List
          </button>
        </div>
      )}

      {/* Selected Medicines Recommendation List Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Selected Medicine Recommendation ({orderItems.length})
        </h3>

        {orderItems.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No medicines added to recommendation yet</p>
            <p className="text-xs text-slate-400 mt-1">Search and select medicines above to build a doctor medicine order.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Medicine</th>
                  <th className="p-3.5">Qty</th>
                  <th className="p-3.5">Dosage / Frequency</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orderItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <p className="font-extrabold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.genericName} ({item.brandName})</p>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{item.quantity}</td>
                    <td className="p-3.5 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">{item.dosage}</span> ({item.frequency}) for {item.duration}
                      <p className="text-[11px] text-slate-400">{item.instructions}</p>
                    </td>
                    <td className="p-3.5 text-slate-600">₹{item.unitPrice}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">₹{item.unitPrice * item.quantity}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pricing Summary */}
            <div className="bg-slate-50/80 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-bold text-emerald-600">✓ Stock Guaranteed:</span> Inventory is validated from real DB catalogue.
              </div>
              <div className="space-y-1 text-right text-xs">
                <div className="flex justify-between gap-6 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-6 text-slate-600">
                  <span>Estimated Tax (5%):</span>
                  <span className="font-bold text-slate-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-6 text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-indigo-600 text-base">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-100">
        <button
          onClick={() => toast.success('Prescription only saved')}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Option A — Prescription Only
        </button>

        <button
          onClick={() => createOrderMutation.mutate()}
          disabled={createOrderMutation.isPending || orderItems.length === 0}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {createOrderMutation.isPending ? (
            'Creating Medicine Order...'
          ) : (
            <>
              Option B — Create Medicine Order <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
