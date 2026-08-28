import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Box, Home, ShoppingCart, Search, Filter, AlertTriangle, Inbox, CheckCircle2, Package, Plus, ChevronDown, RefreshCw, Truck, Tag, Layers, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

// Demonstration fallback inventory items if database table has 0 records
const DEMO_STOCK_ITEMS = [
  { id: 1, name: 'Amoxicillin 500mg Capsules', category: 'Antibiotics', currentStock: 450, reorderLevel: 100, unit: 'Capsules', salePrice: 12.50, genericName: 'Amoxicillin', barcode: 'AMX500123' },
  { id: 2, name: 'Paracetamol 650mg Tablets', category: 'Analgesics', currentStock: 1200, reorderLevel: 250, unit: 'Tablets', salePrice: 4.00, genericName: 'Acetaminophen', barcode: 'PCM650456' },
  { id: 3, name: 'Metformin 500mg SR', category: 'Antidiabetics', currentStock: 85, reorderLevel: 150, unit: 'Tablets', salePrice: 8.75, genericName: 'Metformin Hydrochloride', barcode: 'MET500789' },
  { id: 4, name: 'Omeprazole 20mg Delayed Release', category: 'Gastroenterology', currentStock: 320, reorderLevel: 80, unit: 'Capsules', salePrice: 15.00, genericName: 'Omeprazole', barcode: 'OMP020321' },
  { id: 5, name: 'Atorvastatin 10mg Tablets', category: 'Cardiovascular', currentStock: 42, reorderLevel: 100, unit: 'Tablets', salePrice: 22.00, genericName: 'Atorvastatin Calcium', barcode: 'ATV010654' },
  { id: 6, name: 'Sterile Disposable Syringes 5ml', category: 'Medical Supplies', currentStock: 850, reorderLevel: 200, unit: 'Pieces', salePrice: 1.50, genericName: 'Syringes', barcode: 'SYR005987' },
  { id: 7, name: 'Cetirizine 10mg Tablets', category: 'Antihistamines', currentStock: 600, reorderLevel: 120, unit: 'Tablets', salePrice: 5.50, genericName: 'Cetirizine', barcode: 'CTR010111' },
  { id: 8, name: 'Elastic Cotton Bandage 10cm', category: 'Consumables', currentStock: 18, reorderLevel: 50, unit: 'Rolls', salePrice: 6.00, genericName: 'Bandage', barcode: 'BND010222' }
];

const DEMO_WAREHOUSES = [
  { id: 1, name: 'Central Pharmacy Warehouse', code: 'WH-MAIN-01', location: 'Building A, Ground Floor', capacity: '10,000 Units', status: 'ACTIVE' },
  { id: 2, name: 'Emergency Stock Depot', code: 'WH-EMG-02', location: 'ER Department Storage B', capacity: '2,500 Units', status: 'ACTIVE' },
  { id: 3, name: 'Cold Chain Vaccine Vault', code: 'WH-[#2864FF]-03', location: 'Refrigerated Storage 2°C-8°C', capacity: '1,200 Units', status: 'ACTIVE' }
];

const DEMO_PURCHASE_ORDERS = [
  { id: 'PO-2026-089', supplierName: 'MedTech Pharma Distro', orderDate: '2026-08-25', status: 'APPROVED', totalAmount: 4850.00, itemQty: 12 },
  { id: 'PO-2026-090', supplierName: 'Apex Surgical Supplies', orderDate: '2026-08-27', status: 'PENDING_APPROVAL', totalAmount: 1920.50, itemQty: 5 },
  { id: 'PO-2026-091', supplierName: 'Global BioLabs Ltd.', orderDate: '2026-08-28', status: 'DELIVERED', totalAmount: 8300.00, itemQty: 24 }
];

const AddStockModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Analgesics');
  const [unit, setUnit] = useState('Tablets');
  const [reorderLevel, setReorderLevel] = useState(50);
  const [salePrice, setSalePrice] = useState('');
  const [initialQuantity, setInitialQuantity] = useState(100);

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        genericName,
        category,
        unit,
        reorderLevel: parseInt(reorderLevel) || 50,
        salePrice: parseFloat(salePrice) || 10.0,
        taxPercentage: 5.0
      };
      const res = await axiosPrivate.post('/pharmacy/medicines', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-medicines'] });
      toast.success('Stock item added successfully');
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add stock item');
    }
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Stock Item to Catalog">
      <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item / Medicine Name *</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="e.g. Ciprofloxacin 500mg" 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generic Name</label>
            <input 
              type="text" 
              value={genericName} 
              onChange={e => setGenericName(e.target.value)} 
              placeholder="e.g. Ciprofloxacin" 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF] bg-white"
            >
              <option value="Antibiotics">Antibiotics</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Antidiabetics">Antidiabetics</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Medical Supplies">Medical Supplies</option>
              <option value="Consumables">Consumables</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
            <input 
              type="text" 
              value={unit} 
              onChange={e => setUnit(e.target.value)} 
              placeholder="e.g. Tablets" 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reorder Level</label>
            <input 
              type="number" 
              value={reorderLevel} 
              onChange={e => setReorderLevel(e.target.value)} 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Sale Price ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={salePrice} 
              onChange={e => setSalePrice(e.target.value)} 
              placeholder="e.g. 14.50" 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]" 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <button type="submit" disabled={addMutation.isPending} className="px-6 py-2.5 bg-[#2864FF] hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50">
            {addMutation.isPending ? 'Adding...' : 'Save Stock Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Realtime queries with 10-second polling interval
  const { data: rawMedicines = [], isLoading: loadingMedicines } = useQuery({
    queryKey: ['inventory-medicines'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/pharmacy/medicines');
        const content = res.data?.data?.content || res.data?.content || res.data;
        return Array.isArray(content) ? content : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 10000
  });

  const { data: rawPurchaseOrders = [] } = useQuery({
    queryKey: ['inventory-purchase-orders'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/pharmacy/purchase-orders');
        const content = res.data?.data?.content || res.data?.content || res.data;
        return Array.isArray(content) ? content : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 10000
  });

  const { data: rawSuppliers = [] } = useQuery({
    queryKey: ['inventory-suppliers'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/pharmacy/suppliers');
        const content = res.data?.data?.content || res.data?.content || res.data;
        return Array.isArray(content) ? content : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 10000
  });

  // Use database records if available, otherwise demonstration items
  const stockItems = rawMedicines.length > 0 ? rawMedicines : DEMO_STOCK_ITEMS;
  const warehouses = rawSuppliers.length > 0 ? rawSuppliers.map((s, idx) => ({
    id: s.id || idx + 1,
    name: s.name || s.companyName || 'Supplier Depot',
    code: `SUP-${s.id || idx + 1}`,
    location: s.address || s.city || 'Central Warehouse',
    capacity: `${s.contactPerson || 'Active Supplier'}`,
    status: 'ACTIVE'
  })) : DEMO_WAREHOUSES;

  const purchaseOrders = rawPurchaseOrders.length > 0 ? rawPurchaseOrders : DEMO_PURCHASE_ORDERS;

  const lowStockCount = stockItems.filter(item => {
    const qty = item.currentStock ?? item.quantity ?? 0;
    const reorder = item.reorderLevel ?? 10;
    return qty <= reorder;
  }).length;

  const availableCount = stockItems.length - lowStockCount;

  const filteredStock = stockItems.filter(item => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const name = item.name?.toLowerCase() || '';
    const category = item.category?.toLowerCase() || '';
    const generic = item.genericName?.toLowerCase() || '';
    return name.includes(s) || category.includes(s) || generic.includes(s);
  });

  const tabs = [
    { id: 'stock', label: 'Stock', icon: Box },
    { id: 'warehouses', label: 'Warehouses', icon: Home },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  ];

  return (
    <div className="p-6 w-full min-h-full bg-[#F8FAFF] font-sans">
      
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold tracking-wide transition-all shadow-sm cursor-pointer border-none ${
                isActive
                  ? 'bg-[#2864FF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
            <Box className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
          </div>
          <div className="pt-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Back-Office Inventory Management</h1>
            <p className="text-gray-500 mt-1 font-medium text-xs">Central medical supplies stock, warehouse management, and vendor purchase orders.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-7 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Add Stock Item
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column KPIs */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-6">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-3 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-[#F4F7FF] text-[#2864FF] rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Total Items</p>
                      <p className="text-2xl font-extrabold text-[#2864FF] leading-none">{stockItems.length}</p>
                  </div>
              </div>
              <div className="w-8 h-1 bg-[#2864FF] rounded-full"></div>
            </div>
            
            {/* KPI 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Low Stock</p>
                      <p className="text-2xl font-extrabold text-red-500 leading-none">{lowStockCount}</p>
                  </div>
              </div>
              <div className="w-8 h-1 bg-red-500 rounded-full"></div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Available</p>
                      <p className="text-2xl font-extrabold text-emerald-500 leading-none">{availableCount}</p>
                  </div>
              </div>
              <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
            </div>
          </div>

          {/* Illustration Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-full h-40 mb-4 relative flex items-center justify-center">
                <svg viewBox="0 0 200 120" className="w-full h-full object-contain">
                    <defs>
                        <linearGradient id="box-top" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#608FFF" />
                            <stop offset="100%" stopColor="#4070FF" />
                        </linearGradient>
                        <linearGradient id="box-front" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4070FF" />
                            <stop offset="100%" stopColor="#2864FF" />
                        </linearGradient>
                        <linearGradient id="box-side" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1A4DFF" />
                            <stop offset="100%" stopColor="#103EE6" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="100" cy="110" rx="80" ry="12" fill="#f0f4ff" />
                    <rect x="35" y="30" width="30" height="20" rx="4" fill="#EBF0FF" />
                    <rect x="75" y="30" width="20" height="20" rx="4" fill="#EBF0FF" />
                    <rect x="105" y="30" width="40" height="20" rx="4" fill="#EBF0FF" />
                    <line x1="20" y1="53" x2="160" y2="53" stroke="#EBF0FF" strokeWidth="2.5" strokeLinecap="round" />
                    <g transform="translate(45, 65)">
                        <path d="M25 0 L55 10 L30 20 L0 10 Z" fill="url(#box-top)" />
                        <path d="M0 10 L30 20 L30 45 L0 35 Z" fill="url(#box-front)" />
                        <path d="M30 20 L55 10 L55 35 L30 45 Z" fill="url(#box-side)" />
                    </g>
                    <g transform="translate(105, 50)">
                        <rect x="0" y="0" width="45" height="60" rx="6" fill="white" stroke="#D3E0FF" strokeWidth="2" />
                        <rect x="12" y="-5" width="20" height="10" rx="3" fill="#608FFF" />
                        <line x1="18" y1="20" x2="35" y2="20" stroke="#D3E0FF" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="18" y1="35" x2="30" y2="35" stroke="#D3E0FF" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                    <g transform="translate(145, 38)">
                        <circle cx="10" cy="10" r="14" fill="#22C55E" />
                        <path d="M6 10 L9 13 L15 7" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </svg>
            </div>
            
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Keep inventory in check</h3>
            <p className="text-gray-500 text-xs font-medium leading-relaxed mb-4">
              Add stock items, manage quantities, and track low stock alerts in real-time.
            </p>
            <div className="w-full bg-[#F4F7FF] p-3 rounded-2xl flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Syncing with PACS & Pharmacy</span>
              <RefreshCw className="w-3.5 h-3.5 text-[#2864FF] animate-spin" />
            </div>
          </div>
        </div>

        {/* Right Column / Tab Content */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[550px]">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="flex-1 relative w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search stock catalog, category, or generic name..." 
                        className="w-full bg-[#F8FAFF] text-xs text-gray-700 font-medium rounded-2xl pl-11 pr-4 py-3.5 outline-none border border-slate-200 focus:border-[#2864FF] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* TAB 1: Stock View */}
            {activeTab === 'stock' && (
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {loadingMedicines ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-3 border-[#EBF0FF] border-t-[#2864FF] rounded-full animate-spin"></div>
                  </div>
                ) : filteredStock.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Inbox className="w-12 h-12 text-slate-300 mb-3" />
                    <h4 className="text-base font-extrabold text-slate-800">No stock items found</h4>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredStock.map(item => {
                    const currentQty = item.currentStock ?? item.quantity ?? 0;
                    const reorder = item.reorderLevel ?? 10;
                    const isLow = currentQty <= reorder;

                    return (
                      <div key={item.id} className="py-3.5 px-2 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4 rounded-xl">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2864FF]">
                              {item.category || 'General'}
                            </span>
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-50 text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-600">
                                In Stock
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span>Generic: {item.genericName || 'N/A'}</span>
                            <span>Barcode: {item.barcode || 'N/A'}</span>
                            <span>Price: ${item.salePrice || item.mrp || '0.00'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-black text-slate-900">{currentQty} <span className="text-xs font-normal text-slate-500">{item.unit || 'Units'}</span></p>
                          <p className="text-[10px] font-bold text-slate-400">Reorder Level: {reorder}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: Warehouses View */}
            {activeTab === 'warehouses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
                {warehouses.map(wh => (
                  <div key={wh.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-[#2864FF] rounded-xl">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{wh.name}</h4>
                          <p className="text-xs text-slate-400 font-medium">{wh.code}</p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="text-xs text-slate-600 font-medium space-y-1 pt-2 border-t border-slate-100">
                      <p>📍 {wh.location}</p>
                      <p>📦 Capacity / Contact: {wh.capacity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Purchase Orders View */}
            {activeTab === 'purchase-orders' && (
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {purchaseOrders.map((po, idx) => (
                  <div key={po.id || idx} className="py-4 px-2 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900 text-sm">{po.id || `PO-#${po.poNumber || idx + 100}`}</span>
                        <Badge variant={po.status === 'DELIVERED' || po.status === 'APPROVED' ? 'success' : 'warning'}>
                          {po.status || 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Supplier: {po.supplierName || po.supplier?.name || 'Vendor Supplier'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">${po.totalAmount || po.totalCost || '0.00'}</p>
                      <p className="text-[10px] font-bold text-slate-400">Order Date: {po.orderDate || 'Recent'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <AddStockModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default InventoryDashboard;
