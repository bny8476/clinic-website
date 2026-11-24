import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { axiosPrivate } from '../../api/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Edit2, 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Pill, 
  X, 
  Filter, 
  RefreshCw,
  Boxes,
  FileCheck,
  TrendingUp,
  Tag,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';

export default function ManageMedicines() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  
  // Filter states
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [prescriptionFilter, setPrescriptionFilter] = useState('ALL'); // 'ALL' | 'RX' | 'OTC'
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK'

  // Image Upload & Drag-Drop State
  const fileInputRef = useRef(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url'

  const handleProcessImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, medicineImage: optimizedDataUrl }));
        toast.success('Medicine image uploaded & optimized successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    brandName: '',
    manufacturer: '',
    category: 'Pain Relief',
    composition: '',
    dosageForm: 'Tablet',
    strength: '500 mg',
    packSize: '10 Tablets per Strip',
    unit: 'Strip',
    description: '',
    detailedDescription: '',
    indications: '',
    usageInstructions: '',
    warnings: '',
    precautions: '',
    sideEffects: '',
    storageInstructions: '',
    prescriptionRequired: false,
    price: '',
    discountPrice: '',
    taxPercentage: 0,
    stockQuantity: '',
    minimumStockLevel: 10,
    medicineImage: '',
    status: 'ACTIVE'
  });

  const queryClient = useQueryClient();

  const { data: medicines = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['doctorMedicines'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/doctor/medicines');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const url = editingMedicine ? `/doctor/medicines/${editingMedicine.id}` : `/doctor/medicines`;
      const method = editingMedicine ? axiosPrivate.put : axiosPrivate.post;
      const res = await method(url, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Medicine ${editingMedicine ? 'updated' : 'added'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['doctorMedicines'] });
      queryClient.invalidateQueries({ queryKey: ['publicMedicines'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.delete(`/doctor/medicines/${id}`);
    },
    onSuccess: () => {
      toast.success('Medicine deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['doctorMedicines'] });
      setMedicineToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setMedicineToDelete(null);
    }
  });

  const openModal = (med = null) => {
    if (med) {
      setEditingMedicine(med);
      setFormData({
        medicineName: med.medicineName || med.name || '',
        genericName: med.genericName || '',
        brandName: med.brandName || '',
        manufacturer: med.manufacturer || '',
        category: med.category || 'Pain Relief',
        composition: med.composition || '',
        dosageForm: med.dosageForm || 'Tablet',
        strength: med.strength || '500 mg',
        packSize: med.packSize || '',
        unit: med.unit || 'Strip',
        description: med.description || '',
        detailedDescription: med.detailedDescription || '',
        indications: med.indications || '',
        usageInstructions: med.usageInstructions || '',
        warnings: med.warnings || '',
        precautions: med.precautions || '',
        sideEffects: med.sideEffects || '',
        storageInstructions: med.storageInstructions || '',
        prescriptionRequired: Boolean(med.prescriptionRequired),
        price: med.price || '',
        discountPrice: med.discountPrice || '',
        taxPercentage: med.taxPercentage || 0,
        stockQuantity: med.stockQuantity || '',
        minimumStockLevel: med.minimumStockLevel || 10,
        medicineImage: med.medicineImage || med.imageUrl || '',
        status: med.status || 'ACTIVE'
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        medicineName: '',
        genericName: '',
        brandName: '',
        manufacturer: '',
        category: 'Pain Relief',
        composition: '',
        dosageForm: 'Tablet',
        strength: '500 mg',
        packSize: '10 Tablets per Strip',
        unit: 'Strip',
        description: '',
        detailedDescription: '',
        indications: '',
        usageInstructions: '',
        warnings: '',
        precautions: '',
        sideEffects: '',
        storageInstructions: '',
        prescriptionRequired: false,
        price: '',
        discountPrice: '',
        taxPercentage: 0,
        stockQuantity: '',
        minimumStockLevel: 10,
        medicineImage: '',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const openModalWithTemplate = (name, generic, brand, cat, form, str, price, stock, rx = false) => {
    setEditingMedicine(null);
    setFormData({
      medicineName: name,
      genericName: generic,
      brandName: brand,
      manufacturer: 'Elixir Pharma Health Ltd',
      category: cat,
      composition: `${generic} ${str}`,
      dosageForm: form,
      strength: str,
      packSize: `10 ${form}s per Strip`,
      unit: 'Strip',
      description: `High quality ${generic} ${str} manufactured under strict GMP compliance.`,
      detailedDescription: `Indicated for routine clinical use as prescribed by registered medical practitioners.`,
      indications: 'As directed by physician',
      usageInstructions: 'Take with or without food as prescribed',
      warnings: 'Do not exceed recommended daily dose',
      precautions: 'Keep out of reach of children',
      sideEffects: 'Mild nausea or dizziness in rare cases',
      storageInstructions: 'Store in a cool dry place below 25°C',
      prescriptionRequired: rx,
      price: price,
      discountPrice: (price * 0.9).toFixed(2),
      taxPercentage: 12,
      stockQuantity: stock,
      minimumStockLevel: 10,
      medicineImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMedicine(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Filtered medicines list
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const q = searchFilter.toLowerCase().trim();
      const matchesSearch = !q || 
        (m.medicineName || m.name || '').toLowerCase().includes(q) ||
        (m.genericName || '').toLowerCase().includes(q) ||
        (m.brandName || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;

      const matchesRx = prescriptionFilter === 'ALL' || 
        (prescriptionFilter === 'RX' && m.prescriptionRequired) ||
        (prescriptionFilter === 'OTC' && !m.prescriptionRequired);

      const stockNum = Number(m.stockQuantity || 0);
      const matchesStock = stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && stockNum > 10) ||
        (stockFilter === 'LOW_STOCK' && stockNum <= 10);

      return matchesSearch && matchesCat && matchesRx && matchesStock;
    });
  }, [medicines, searchFilter, categoryFilter, prescriptionFilter, stockFilter]);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = medicines.length;
    const inStock = medicines.filter(m => Number(m.stockQuantity || 0) > 10).length;
    const lowStock = medicines.filter(m => Number(m.stockQuantity || 0) <= 10).length;
    const rxCount = medicines.filter(m => m.prescriptionRequired).length;
    return { total, inStock, lowStock, rxCount };
  }, [medicines]);

  const categories = [
    'Pain Relief',
    'Antibiotics',
    'Cardiology',
    'Dermatology',
    'Vitamins & Supplements',
    'Diabetes Care',
    'Cold & Cough',
    'Gastrointestinal',
    'Respiratory',
    'Neurology'
  ];

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-6 font-sans">
      
      {/* ── Top Header Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Medicine Master Management</h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                {medicines.length} Listed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Add, update, and manage doctor-verified medicines available in patient e-commerce and prescriptions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => refetch()}
            className={`p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer ${isFetching ? 'animate-spin text-blue-600' : ''}`}
            title="Refresh medicine catalog"
          >
            <RefreshCw size={18} />
          </button>

          <button
            type="button"
            onClick={() => openModal()}
            className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            <Plus size={18} /> Add Medicine
          </button>
        </div>
      </div>

      {/* ── Responsive KPI Metric Cards (4 Columns) ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Medicines */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Catalog</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Active Master SKUs</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Stock</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.inStock}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Sufficient inventory</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock / Reorder</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.lowStock}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">≤ 10 units remaining</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Prescription Required */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rx Required</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{stats.rxCount}</h3>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">Doctor prescription needed</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Wide Responsive Filter Bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search medicine name, generic name, brand, category..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
          />
          {searchFilter && (
            <button 
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Tag size={14} className="text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Rx Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <ShieldAlert size={14} className="text-slate-400 shrink-0" />
            <select
              value={prescriptionFilter}
              onChange={e => setPrescriptionFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Prescription Types</option>
              <option value="RX">Rx Required Only</option>
              <option value="OTC">OTC / Free Only</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Boxes size={14} className="text-slate-400 shrink-0" />
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (&gt; 10)</option>
              <option value="LOW_STOCK">Low Stock (≤ 10)</option>
            </select>
          </div>

          {(searchFilter || categoryFilter !== 'ALL' || prescriptionFilter !== 'ALL' || stockFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchFilter('');
                setCategoryFilter('ALL');
                setPrescriptionFilter('ALL');
                setStockFilter('ALL');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Main Medicine Table & Responsive Grid ───────────────────────────── */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-medium">Loading Medicine Master...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 sm:p-16 text-center text-slate-500 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-1">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">No medicines found</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {searchFilter || categoryFilter !== 'ALL' || prescriptionFilter !== 'ALL' || stockFilter !== 'ALL'
                  ? 'No medicines match your current filter selections. Try resetting the filters.'
                  : 'Your doctor medicine catalog is currently empty. Click "Add Medicine" to list your first medicine, or use one of the quick starter templates below.'}
              </p>
            </div>

            {!searchFilter && categoryFilter === 'ALL' && (
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => openModalWithTemplate('Paracetamol 500mg', 'Paracetamol', 'Dolo 650', 'Pain Relief', 'Tablet', '500 mg', 35, 100)}
                  className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Quick Template: Dolo 650
                </button>
                <button
                  type="button"
                  onClick={() => openModalWithTemplate('Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 'Antibiotics', 'Capsule', '500 mg', 85, 50, true)}
                  className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Quick Template: Amoxicillin (Rx)
                </button>
                <button
                  type="button"
                  onClick={() => openModalWithTemplate('Atorvastatin 20mg', 'Atorvastatin', 'Lipitor', 'Cardiology', 'Tablet', '20 mg', 120, 60, true)}
                  className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Quick Template: Atorvastatin (Rx)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-extrabold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 sm:p-5">Medicine Details</th>
                  <th className="p-4 sm:p-5">Category</th>
                  <th className="p-4 sm:p-5">Price</th>
                  <th className="p-4 sm:p-5">Inventory Stock</th>
                  <th className="p-4 sm:p-5">Prescription</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={med.medicineImage || med.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'} 
                          alt={med.medicineName || med.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shrink-0" 
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {med.medicineName || med.name}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {med.genericName} • {med.dosageForm || 'Tablet'} {med.strength} {med.brandName ? `(${med.brandName})` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {med.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5">
                      <div className="font-black text-slate-900 text-sm">₹{med.discountPrice || med.price}</div>
                      {med.discountPrice && med.price > med.discountPrice && (
                        <div className="text-xs text-slate-400 line-through">₹{med.price}</div>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${
                        Number(med.stockQuantity || 0) > 10 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {Number(med.stockQuantity || 0) > 10 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {med.stockQuantity} {med.unit || 'units'}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5">
                      {med.prescriptionRequired ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1 w-fit">
                          <ShieldAlert size={14} className="text-amber-600" /> Rx Required
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 w-fit block">
                          OTC / Free
                        </span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        med.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {med.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          type="button"
                          onClick={() => openModal(med)} 
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title="Edit Medicine"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMedicineToDelete(med)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Deactivate Medicine"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal (size="xl" for wide responsive layout) ───────── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" title={editingMedicine ? "Edit Medicine Master" : "Add New Medicine to E-Commerce"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name *</label>
              <input required type="text" placeholder="e.g. Paracetamol 500 mg" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.medicineName} onChange={e => setFormData({...formData, medicineName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Generic Name</label>
              <input type="text" placeholder="e.g. Paracetamol" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
              <input type="text" placeholder="e.g. Dolo 650" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer</label>
              <input type="text" placeholder="e.g. Micro Labs Ltd" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dosage Form</label>
              <input type="text" placeholder="e.g. Tablet / Syrup / Injection" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Strength</label>
              <input type="text" placeholder="e.g. 500 mg" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pack Size</label>
              <input type="text" placeholder="e.g. 10 Tablets per Strip" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
              <input required type="number" step="0.01" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Discount Price (₹)</label>
              <input type="number" step="0.01" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-blue-500" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity *</label>
              <input required type="number" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} />
            </div>
          </div>

          {/* Medicine Image: Drag, Drop, Browse & Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Medicine Image <span className="text-slate-400 font-normal">(Drag & drop, browse, or paste)</span>
              </label>
              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer border-none ${
                    imageInputMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer border-none ${
                    imageInputMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessImage(e.target.files[0]);
                    }
                  }} 
                />

                {formData.medicineImage ? (
                  /* Image Preview Card */
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                        <img 
                          src={formData.medicineImage} 
                          alt="Medicine preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'; }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span className="text-xs font-extrabold text-slate-900">Image Attached</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ready for patient e-commerce display
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-blue-600 font-bold hover:underline mt-1 inline-block cursor-pointer border-none bg-transparent p-0"
                        >
                          Browse different image...
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, medicineImage: '' })}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer border-none bg-transparent"
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Target Area */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingImage(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleProcessImage(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      isDraggingImage 
                        ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100' 
                        : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        Drop medicine image here, or <span className="text-blue-600 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports PNG, JPG, JPEG, WEBP · Auto-optimized for web
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback direct URL input */
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/... or CDN image URL" 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  value={formData.medicineImage} 
                  onChange={e => setFormData({...formData, medicineImage: e.target.value})} 
                />
                {formData.medicineImage && (
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, medicineImage: ''})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview for medicine card..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description & Indications</label>
            <textarea rows={3} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.detailedDescription} onChange={e => setFormData({...formData, detailedDescription: e.target.value})} placeholder="Detailed therapeutic uses, warnings, precautions..." />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-600 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-slate-900">Prescription Required</p>
                <p className="text-[11px] text-slate-500">Require patient to upload a valid doctor prescription at checkout</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={formData.prescriptionRequired} 
              onChange={e => setFormData({...formData, prescriptionRequired: e.target.checked})} 
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saveMutation.isPending}>
              {editingMedicine ? 'UPDATE MEDICINE' : 'SAVE MEDICINE'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!medicineToDelete}
        onClose={() => setMedicineToDelete(null)}
        onConfirm={() => {
          if (medicineToDelete) {
            deleteMutation.mutate(medicineToDelete.id);
          }
        }}
        title="Deactivate Medicine"
        description={`Are you sure you want to deactivate ${medicineToDelete?.medicineName || medicineToDelete?.name}?`}
        confirmText="Deactivate"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
