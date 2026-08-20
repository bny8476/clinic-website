import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/pharmacy/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeIn } from '../../components/ui/motion';

const TABS = ['Basic Info', 'Pricing & Tax', 'Stock Settings', 'Clinical Details', 'Storage & Handling', 'Barcode'];

const DRUG_CLASSES = ['Analgesic', 'Antibiotic', 'Antidiabetic', 'Antihypertensive', 'Antihistamine', 'Antifungal', 'Antiviral', 'Cardiac', 'Hormonal', 'Lipid-Lowering', 'Nutritional Supplement', 'Psychotropic', 'Vaccine', 'Others'];
const SCHEDULES = ['OTC', 'Schedule H', 'Schedule H1', 'Schedule X', 'Narcotic'];
const STORAGES = ['Room Temperature (15–25°C)', 'Refrigerated (2–8°C)', 'Frozen (below 0°C)', 'Cool and Dry', 'Protect from Light', 'Flammable / Special Handling'];
const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Vial', 'Cream', 'Inhaler'];
const NON_MEDICINE_CATEGORIES = ['Biscuit', 'Chocolate', 'Juice', 'Beverage', 'Snacks', 'Personal Care', 'Other'];
const MEDICINE_UNITS = ['Strip', 'Bottle', 'Vial', 'Ampoule', 'Tube'];
const NON_MEDICINE_UNITS = ['Piece', 'Pack', 'Box', 'Kg', 'Litre', 'Set', 'Unit'];
import { 
  Package, Search, Plus, Loader2, Pill, Activity, Barcode, 
  Settings2, Heart, CheckCircle2, TrendingUp, Filter, Trash2, Edit2, Hexagon, Factory, X, Calendar, AlertTriangle
} from 'lucide-react';
import AppModal from '../../components/pharmacy/ui/AppModal';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { usePageData } from '../../hooks/pharmacy/usePageData';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import useDebounce from '../../hooks/pharmacy/useDebounce';



export default function MedicineMaster() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [drugClassFilter, setDrugClassFilter] = useState('ALL');
  const [scheduleFilter, setScheduleFilter] = useState('ALL');
  const [productTypeFilter, setProductTypeFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const { items: allMedicines = [], isLoading: loading, page, goToPage, size, totalPages, totalElements } = usePageData(
    'medicines',
    '/pharmacy/medicines',
    {
      search: debouncedSearch,
      drugClass: drugClassFilter,
      schedule: scheduleFilter,
      productType: productTypeFilter
    }
  );

  const handleDateChange = (type, date) => {
    setDateRange(prev => {
      const next = { ...prev, [type]: date };
      // Validation: To Date cannot precede From Date
      if (next.from && next.to && next.to < next.from) {
        if (type === 'from') {
          next.to = null; // Reset 'to' if 'from' is moved past it
        } else {
          toast.error("To Date cannot be earlier than From Date");
          return prev; // Reject change
        }
      }
      return next;
    });
  };

  const medicines = allMedicines;

  useEffect(() => {
    goToPage(0);
  }, [debouncedSearch, drugClassFilter, scheduleFilter, productTypeFilter]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => pharmacyService.getSuppliers().then(res => res.data)
  });

  const createMedicineMutation = useMutation({
    mutationFn: (formData) => pharmacyService.createMedicine(formData),
    onSuccess: () => {
      toast.success('Medicine created successfully!');
      queryClient.invalidateQueries(['medicines']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error creating medicine')
  });

  const updateMedicineMutation = useMutation({
    mutationFn: ({ id, formData }) => pharmacyService.updateMedicine(id, formData),
    onSuccess: () => {
      toast.success('Medicine updated successfully!');
      queryClient.invalidateQueries(['medicines']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error updating medicine')
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: (id) => pharmacyService.deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['medicines']);
      toast.success('Medicine deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete medicine');
    }
  });

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('Basic Info');
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));

  const [visibleColumns, setVisibleColumns] = useState({
    code: true, hsn: false, mrp: true, stock: true, generic: true, manufacturer: true, barcode: false
  });

  const [formData, setFormData] = useState({
    name: '', genericName: '', medicineCode: '', manufacturer: '', supplierVendor: '', supplier: null, productType: 'MEDICINE',
    packSize: '', unitsPerPack: 1, unit: 'Strip', category: 'Tablet', mrp: '', purchasePrice: '', salePrice: '',
    hsnCode: '', taxPercentage: 12.0, reorderLevel: 10, drugClass: 'Analgesic', storageConditions: 'Room Temperature (15–25°C)',
    schedule: 'OTC', substitutes: '', barcode: ''
  });



  const openModal = (medicine = null) => {
    if (medicine) {
      setIsEditMode(true);
      setSelectedMedicineId(medicine.id);
      setFormData({
        name: medicine.name || '',
        genericName: medicine.genericName || '',
        medicineCode: medicine.medicineCode || '',
        manufacturer: medicine.manufacturer || '',
        supplierVendor: medicine.supplierVendor || '',
        supplier: medicine.supplierId ? { id: medicine.supplierId, name: medicine.supplierName, address: medicine.supplierAddress, gstin: medicine.supplierGstin, contact: medicine.supplierContact } : null,
        productType: medicine.productType || 'MEDICINE',
        packSize: medicine.packSize || '',
        unitsPerPack: medicine.unitsPerPack || 1,
        unit: medicine.unit || (medicine.productType === 'NON_MEDICINE' ? 'Piece' : 'Strip'),
        category: medicine.category || (medicine.productType === 'NON_MEDICINE' ? 'Biscuit' : 'Tablet'),
        mrp: medicine.mrp || '',
        purchasePrice: medicine.purchasePrice || '',
        salePrice: medicine.salePrice || '',
        hsnCode: medicine.hsnCode || '',
        taxPercentage: medicine.taxPercentage || 0,
        reorderLevel: medicine.reorderLevel || 10,
        drugClass: medicine.drugClass || 'Analgesic',
        storageConditions: medicine.storageConditions || 'Room Temperature (15–25°C)',
        schedule: medicine.schedule || 'OTC',
        substitutes: medicine.substitutes || '',
        barcode: medicine.barcode || ''
      });
      setSupplierSearch(medicine.supplierName || medicine.supplierVendor || '');
    } else {
      setIsEditMode(false);
      setSelectedMedicineId(null);
      setFormData({
        name: '', genericName: '', medicineCode: '', manufacturer: '', supplierVendor: '', supplier: null, productType: 'MEDICINE',
        packSize: '', unitsPerPack: 1, unit: 'Strip', category: 'Tablet', mrp: '', purchasePrice: '', salePrice: '',
        hsnCode: '', taxPercentage: 12.0, reorderLevel: 10, drugClass: 'Analgesic', storageConditions: 'Room Temperature (15–25°C)',
        schedule: 'OTC', substitutes: '', barcode: ''
      });
      setSupplierSearch('');
    }
    setErrors({});
    setActiveModalTab('Basic Info');
    setIsModalOpen(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Brand Name is required';
    if (!formData.genericName.trim()) newErrors.genericName = formData.productType === 'NON_MEDICINE' ? 'Description is required' : 'Generic Name is required';
    if (!formData.hsnCode.trim()) newErrors.hsnCode = 'HSN Code is required';
    else if (formData.hsnCode.length < 4) newErrors.hsnCode = 'HSN Code must be at least 4 digits';
    
    const pp = Number(formData.purchasePrice);
    const sp = Number(formData.salePrice);
    const mrp = Number(formData.mrp);

    if (formData.purchasePrice !== '' && pp < 0) newErrors.purchasePrice = 'Must be ≥ 0';
    if (formData.salePrice !== '' && sp < 0) newErrors.salePrice = 'Must be ≥ 0';
    if (formData.mrp !== '' && mrp < 0) newErrors.mrp = 'Must be ≥ 0';
    
    if (formData.purchasePrice !== '' && formData.salePrice !== '' && pp > sp) newErrors.salePrice = 'Sale Price cannot be less than Purchase Price';
    if (formData.salePrice !== '' && formData.mrp !== '' && sp > mrp) newErrors.mrp = 'MRP cannot be less than Sale Price';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error('Please fix the validation errors before saving');
      
      // Auto-switch to the tab with errors
      if (errors.name || errors.genericName) {
        setActiveModalTab('Basic Info');
      } else if (errors.hsnCode || errors.purchasePrice || errors.salePrice || errors.mrp) {
        setActiveModalTab('Pricing & Tax');
      }
      return;
    }
    
    const payload = {
      ...formData,
      mrp: formData.mrp === '' ? null : Number(formData.mrp),
      purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
      salePrice: formData.salePrice === '' ? null : Number(formData.salePrice),
      taxPercentage: formData.taxPercentage === '' ? 0 : Number(formData.taxPercentage),
      reorderLevel: formData.reorderLevel === '' ? null : Number(formData.reorderLevel),
      unitsPerPack: formData.unitsPerPack === '' ? 1 : Number(formData.unitsPerPack),
      barcode: formData.barcode === '' ? null : formData.barcode,
      medicineCode: formData.medicineCode === '' ? null : formData.medicineCode,
    };

    if (isEditMode) {
      updateMedicineMutation.mutate({ id: selectedMedicineId, formData: payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMedicineMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  // Derived styling for preview
  const isHighAlert = ['Schedule H1', 'Schedule X', 'Narcotic'].includes(formData.schedule);
  const isColdChain = ['Refrigerated (2–8°C)', 'Frozen (below 0°C)'].includes(formData.storageConditions);

  const columns = React.useMemo(() => [
    { header: 'S.NO', render: (r, i) => <span className="text-slate-500 font-medium text-xs">{i + 1}</span> },
    { header: 'CODE', accessor: 'medicineCode', render: (r) => <span className="font-mono text-xs">{r.medicineCode || '-'}</span> },
    { header: 'MEDICINE NAME', render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center shrink-0">
          <Pill className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 whitespace-nowrap text-sm">{r.name}</span>
          <span className="text-[11px] text-slate-500">{r.unit === 'Strip' ? 'Tablet' : r.unit === 'Bottle' ? 'Syrup' : r.category || 'Medicine'}</span>
        </div>
      </div>
    )},
    { header: 'GENERIC NAME', render: (r) => <span className="text-slate-600 whitespace-nowrap text-xs">{r.genericName}</span> },
    { header: 'MANUFACTURER', accessor: 'manufacturer', render: (r) => <span className="text-slate-600 whitespace-nowrap text-xs">{r.manufacturer || '-'}</span> },
    { header: 'CATEGORY', accessor: 'category', render: (r) => (
      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", r.drugClass === 'Analgesic' ? "bg-indigo-50 text-indigo-600" : r.drugClass === 'Antibiotic' ? "bg-blue-50 text-blue-600" : r.drugClass === 'Antihistamine' ? "bg-blue-50 text-blue-600" : r.drugClass === 'Respiratory' ? "bg-purple-50 text-purple-600" : r.drugClass === 'Gastric' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600")}>
        {r.drugClass || r.category || '-'}
      </span>
    )},
    { header: 'UNIT', accessor: 'unit', render: (r) => <span className="text-slate-600 text-xs">{r.unit || '-'}</span> },
    { header: 'STOCK', render: (r) => (
      <div className="flex flex-col">
        <span className="font-medium text-slate-800 text-sm">{r.currentStock || 0}</span>
        {r.currentStock > 0 && <span className="text-[10px] text-blue-600">({(Math.random() * 5 + 1).toFixed(1)}%)</span>}
      </div>
    )},
    { header: 'MRP', render: (r) => <span className="text-sm font-medium">₹{r.mrp || 0}</span> },
    { header: 'GST %', render: (r) => <span className="text-sm text-slate-600">{r.taxPercentage || 0}%</span> },
    { header: 'STATUS', render: (r) => {
      const stock = r.currentStock || 0;
      const reorder = r.reorderLevel || 10;
      if (stock === 0) return <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100">Out of Stock</span>;
      if (stock <= reorder) return <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">Low Stock</span>;
      return <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">In Stock</span>;
    }},
    { header: 'ACTIONS', render: (row) => (
      <div className="flex gap-1 justify-center">
        <button onClick={() => openModal(row)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors" title="Options">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>
    )}
  ], []);

  return (
    
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Medicine Master</h2>
          <p className="text-sm text-slate-500 font-normal">Manage medicines, manufacturers, pricing and inventory.</p>
        </div>
        <button onClick={() => openModal()} className="px-5 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Medicines</p>
              <h3 className="text-2xl font-bold text-slate-800">1,248</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
            <ArrowUp className="w-3 h-3" /> <span>8.5%</span> <span className="text-slate-400 font-normal ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Active Medicines</p>
              <h3 className="text-2xl font-bold text-slate-800">1,126</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
            <ArrowUp className="w-3 h-3" /> <span>12.3%</span> <span className="text-slate-400 font-normal ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-slate-800">32</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-600">
            <ArrowDown className="w-3 h-3" /> <span>5</span> <span className="text-slate-400 font-normal ml-1">from yesterday</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Out of Stock</p>
              <h3 className="text-2xl font-bold text-slate-800">24</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-600">
            <ArrowDown className="w-3 h-3" /> <span>3</span> <span className="text-slate-400 font-normal ml-1">from yesterday</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Expiring Soon</p>
              <h3 className="text-2xl font-bold text-slate-800">18</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-600">
            <ArrowDown className="w-3 h-3" /> <span>2</span> <span className="text-slate-400 font-normal ml-1">from yesterday</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative col-span-1 lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search medicines..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          
          <select value={drugClassFilter} onChange={(e) => setDrugClassFilter(e.target.value)}           className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            <option value="ALL">All Drug Classes</option>
            {DRUG_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)}           className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            <option value="ALL">All Schedules</option>
            {SCHEDULES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)} className="w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow">
              <option value="ALL">All Product Types</option>
              <option value="MEDICINE">Medicine (Rx/OTC)</option>
              <option value="NON_MEDICINE">Non-Medicine (FMCG)</option>
            </select>
            <select className="w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow">
              <option value="ALL">All Manufacturers</option>
            </select>
            <select className="w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow">
              <option value="ALL">All Categories</option>
            </select>
            <button 
              onClick={() => {
                setSearchTerm('');
                setDrugClassFilter('ALL');
                setScheduleFilter('ALL');
                setProductTypeFilter('ALL');
                setDateRange({ from: null, to: null });
              }} 
              className="flex items-center gap-2 text-indigo-600 text-sm font-semibold hover:text-indigo-800 px-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset Filters
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4 text-slate-400" /> Export
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" /> Import
            </button>
            <button className="px-5 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] flex items-center gap-2 shadow-sm transition-colors">
              <Filter className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="text-lg font-bold text-slate-800">Medicine List</h3>
            <span className="text-sm text-slate-500 font-medium">Total {totalElements.toLocaleString()} Medicines</span>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <TableSkeleton rows={10} columns={10} />
            ) : (
              <>
                <DataTable columns={columns} data={medicines} striped className="border-0 shadow-none [&>div>table>thead>tr>th]:bg-slate-50 [&>div>table>thead>tr>th]:text-slate-500 [&>div>table>thead>tr>th]:font-semibold [&>div>table>thead>tr>th]:uppercase [&>div>table>thead>tr>th]:tracking-wider [&>div>table>thead>tr>th]:text-[10px] [&>div>table>thead>tr>th]:py-4 [&>div>table>tbody>tr>td]:py-3" />
                {totalElements > 0 && (
                  <div className="p-4 border-t border-slate-200">
                    <Pagination totalRecords={totalElements} currentPage={page + 1} pageSize={size} onPageChange={(p) => goToPage(p - 1)} onPageSizeChange={() => {}} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[280px] shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-white">
            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <button onClick={() => openModal()} className="w-full flex items-center gap-4 p-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-semibold text-sm transition-colors text-left group">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              Add Medicine
            </button>
            <button className="w-full flex items-center gap-4 p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-blue-700 font-semibold text-sm transition-colors text-left group">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              Import Medicines
            </button>
            <button className="w-full flex items-center gap-4 p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-blue-700 font-semibold text-sm transition-colors text-left group">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Download className="w-4 h-4" />
              </div>
              Export Medicines
            </button>
            <button className="w-full flex items-center gap-4 p-3.5 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded-xl text-orange-700 font-semibold text-sm transition-colors text-left group">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-200 transition-colors">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              Stock Transfer
            </button>
            <button className="w-full flex items-center gap-4 p-3.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-semibold text-sm transition-colors text-left group">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:bg-rose-200 transition-colors">
                <Printer className="w-4 h-4" />
              </div>
              Print List
            </button>
            <button className="w-full flex items-center gap-4 p-3.5 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-xl text-purple-700 font-semibold text-sm transition-colors text-left group">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Settings className="w-4 h-4" />
              </div>
              Bulk Update
            </button>
          </div>
        </div>
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Medicine Record" : "Register New Medicine"}
        maxWidth="sm:max-w-6xl"
        footer={
          <div className="flex justify-end gap-3 w-full border-t border-slate-100 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={createMedicineMutation.isPending || updateMedicineMutation.isPending} className="px-8 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium hover:bg-[#122b50] flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {createMedicineMutation.isPending || updateMedicineMutation.isPending ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Register Medicine')}
            </button>
          </div>
        }
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col h-[600px]">
            {/* TABS */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
              {TABS.filter(t => formData.productType === 'NON_MEDICINE' ? t !== 'Clinical Details' : true).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveModalTab(tab)}
                  className={cn("px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors outline-none", 
                    activeModalTab === tab ? "border-[#1a3c6e] text-[#1a3c6e] bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {activeModalTab === 'Basic Info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2 mb-2 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Product Type</h4>
                      <p className="text-xs text-slate-500">Is this a clinical drug or a general retail item?</p>
                    </div>
                    <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                      <button 
                        onClick={() => { setFormData({...formData, productType: 'MEDICINE', category: 'Tablet', schedule: 'OTC', drugClass: 'Analgesic', unit: 'Strip'}); setActiveModalTab('Basic Info'); }}
                        className={cn("px-4 py-2 text-sm font-medium transition-colors", formData.productType === 'MEDICINE' ? "bg-[#1a3c6e] text-white" : "text-slate-600 hover:bg-slate-50")}
                      >
                        Medicine (Rx/OTC)
                      </button>
                      <button 
                        onClick={() => { setFormData({...formData, productType: 'NON_MEDICINE', category: 'Biscuit', schedule: 'N/A', drugClass: 'N/A', unit: 'Piece'}); setActiveModalTab('Basic Info'); }}
                        className={cn("px-4 py-2 text-sm font-medium transition-colors", formData.productType === 'NON_MEDICINE' ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50")}
                      >
                        Non-Medicine (FMCG)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Brand Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); if(errors.name) setErrors({...errors, name: null}); }} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none", errors.name ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 bg-slate-50 focus:border-blue-500")} />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">{formData.productType === 'NON_MEDICINE' ? 'Description' : 'Generic Name'} <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.genericName} onChange={e => { setFormData({...formData, genericName: e.target.value}); if(errors.genericName) setErrors({...errors, genericName: null}); }} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none", errors.genericName ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 bg-slate-50 focus:border-blue-500")} />
                    {errors.genericName && <p className="text-xs text-red-500">{errors.genericName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Item Code</label>
                    <input type="text" value={formData.medicineCode} placeholder="Auto-generated if empty" disabled={isEditMode && formData.medicineCode} onChange={e => setFormData({...formData, medicineCode: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Manufacturer / Brand</label>
                    <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-medium text-slate-700">Primary Vendor</label>
                    <input 
                      type="text" 
                      placeholder="Search and select supplier..." 
                      value={supplierSearch} 
                      onChange={e => setSupplierSearch(e.target.value)} 
                      onFocus={() => { setSupplierSearch(''); setShowSupplierDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" 
                    />
                    {showSupplierDropdown && (
                      <div className="absolute z-[100] left-0 top-full mt-1 w-full bg-white shadow-xl border border-slate-200 rounded-md max-h-48 overflow-y-auto">
                        {filteredSuppliers.map(s => (
                          <div 
                            key={s.id} 
                            onMouseDown={(e) => { e.preventDefault(); setFormData({...formData, supplier: s, supplierVendor: s.name}); setSupplierSearch(s.name); setShowSupplierDropdown(false); }} 
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="font-medium text-sm text-slate-800">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.city} | GST: {s.gstin}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                      {(formData.productType === 'NON_MEDICINE' ? NON_MEDICINE_CATEGORIES : CATEGORIES).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Unit of Measure</label>
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                      {(formData.productType === 'NON_MEDICINE' ? NON_MEDICINE_UNITS : MEDICINE_UNITS).map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Pack Size Label</label>
                    <input type="text" placeholder={formData.productType === 'NON_MEDICINE' ? "e.g. 10 pcs/box" : "e.g. 10 tablets/strip"} value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Units per Pack</label>
                    <input type="number" min="1" placeholder="1" value={formData.unitsPerPack} onChange={e => setFormData({...formData, unitsPerPack: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                  </div>
                </div>
              )}

              {activeModalTab === 'Pricing & Tax' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Purchase Price (per unit)</label>
                    <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => { setFormData({...formData, purchasePrice: e.target.value}); if(errors.purchasePrice) setErrors({...errors, purchasePrice: null, salePrice: null, mrp: null}); }} className={cn("w-full px-3 py-2 border rounded-md outline-none", errors.purchasePrice ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-[#1a3c6e]")} />
                    {errors.purchasePrice && <p className="text-xs text-red-500">{errors.purchasePrice}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Sale Price (per unit)</label>
                    <input type="number" step="0.01" value={formData.salePrice} onChange={e => { setFormData({...formData, salePrice: e.target.value}); if(errors.salePrice) setErrors({...errors, salePrice: null, mrp: null}); }} className={cn("w-full px-3 py-2 border rounded-md outline-none", errors.salePrice ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-[#1a3c6e]")} />
                    {errors.salePrice && <p className="text-xs text-red-500">{errors.salePrice}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">MRP (per unit)</label>
                    <input type="number" step="0.01" value={formData.mrp} onChange={e => { setFormData({...formData, mrp: e.target.value}); if(errors.mrp) setErrors({...errors, mrp: null}); }} className={cn("w-full px-3 py-2 border rounded-md outline-none", errors.mrp ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-[#1a3c6e]")} />
                    {errors.mrp && <p className="text-xs text-red-500">{errors.mrp}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">HSN Code <span className="text-red-500">*</span></label>
                    <input type="text" maxLength={6} placeholder="6-digit compliance code" value={formData.hsnCode} onChange={e => { setFormData({...formData, hsnCode: e.target.value}); if(errors.hsnCode) setErrors({...errors, hsnCode: null}); }} className={cn("w-full px-3 py-2 border rounded-md font-mono outline-none", errors.hsnCode ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 bg-slate-50 focus:border-blue-500")} />
                    {errors.hsnCode && <p className="text-xs text-red-500">{errors.hsnCode}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">GST Percentage</label>
                    <select value={formData.taxPercentage} onChange={e => setFormData({...formData, taxPercentage: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModalTab === 'Stock Settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Reorder Level Alert Threshold</label>
                    <input type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                    <p className="text-xs text-slate-500">System alerts when stock falls below this quantity.</p>
                  </div>
                </div>
              )}

              {activeModalTab === 'Clinical Details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Drug Class</label>
                      <select value={formData.drugClass} onChange={e => setFormData({...formData, drugClass: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                        {DRUG_CLASSES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Schedule / Regulatory Class</label>
                      <select value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className={cn("w-full px-3 py-2 rounded-md outline-none border", isHighAlert ? "border-red-300 bg-red-50 text-red-900" : "border-slate-200")}>
                        {SCHEDULES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      {isHighAlert && <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/> Mandatory compliance logging required at dispensing.</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-4 border-t border-slate-100">
                    <label className="text-sm font-medium text-blue-600 flex items-center gap-2">Substitute Links</label>
                    <p className="text-xs text-slate-500 mb-2">Enter comma-separated Medicine Codes or IDs of direct substitutes.</p>
                    <input type="text" placeholder="e.g. MED-1045, MED-2091" value={formData.substitutes} onChange={e => setFormData({...formData, substitutes: e.target.value})} className="w-full px-3 py-2 border border-blue-200 rounded-md outline-none focus:border-blue-500 font-mono" />
                  </div>
                </div>
              )}

              {activeModalTab === 'Storage & Handling' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Storage Conditions</label>
                    <select value={formData.storageConditions} onChange={e => setFormData({...formData, storageConditions: e.target.value})} className={cn("w-full px-3 py-2 rounded-md outline-none border", isColdChain ? "border-blue-300 bg-blue-50" : "border-slate-200")}>
                      {STORAGES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {isColdChain && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Cold Chain Monitoring Enabled</h4>
                        <p className="text-xs text-blue-700 mt-1">This item will be flagged for temperature log tracking in the inventory module.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === 'Barcode' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Barcode / UPC Number</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Scan or type barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-1 px-3 py-2 border border-slate-200 rounded-md outline-none font-mono" />
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          if (!formData.barcode) { 
                            setFormData({...formData, barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() }); 
                          } 
                        }} 
                        className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-100"
                      >
                        Simulate Scan
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50 mt-6">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Live Scannable Barcode</span>
                      {formData.barcode ? (
                        <div className="bg-white p-4 rounded shadow-sm">
                          <ReactBarcode value={formData.barcode} height={60} width={2} fontSize={14} background="#ffffff" />
                        </div>
                      ) : (
                        <div className="h-[100px] flex items-center justify-center text-slate-400 text-sm">
                          Enter or scan a barcode to preview
                        </div>
                      )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW CARD */}
          <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-lg p-5 flex flex-col h-[600px] overflow-y-auto">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Registry Preview</h3>
            
            <div className={cn("rounded-lg border p-4 mb-4", isHighAlert && formData.productType === 'MEDICINE' ? "border-red-200 bg-red-50/30" : "border-slate-200")}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono font-medium text-slate-500 bg-white border border-slate-200 px-1.5 rounded">{formData.medicineCode || 'MED-XXXX'}</span>
                {formData.productType === 'NON_MEDICINE' ? <Badge variant="warning">General</Badge> : (isHighAlert ? <Badge variant="danger">{formData.schedule}</Badge> : <Badge variant="default">Rx/OTC</Badge>)}
              </div>
              <h2 className="text-xl font-medium text-slate-900 leading-tight mb-1">{formData.name || 'Item Name'}</h2>
              <p className="text-sm text-[#1a3c6e] font-medium">{formData.genericName || 'Description / Salt Name'}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-sm">
                {formData.productType === 'MEDICINE' && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Class</span>
                    <span className="font-medium text-slate-700">{formData.drugClass}</span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Category</span>
                  <span className="font-medium text-slate-700">{formData.category} ({formData.unit})</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-slate-400 uppercase">Storage</span>
                  <span className="font-medium text-slate-700">{formData.storageConditions}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">MRP</span>
                <span className="text-sm font-medium text-slate-900">₹{formData.mrp || '0.00'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">GST</span>
                <span className="text-sm font-medium text-slate-900">{formData.taxPercentage}% (HSN: {formData.hsnCode || '---'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Pack</span>
                <span className="text-sm font-medium text-slate-900">{formData.packSize || '-'} ({formData.unitsPerPack || 1} units)</span>
              </div>
              {formData.barcode && (
                <div className="pt-4 flex flex-col items-center border-t border-slate-100">
                  <ReactBarcode value={formData.barcode} height={40} width={1.5} fontSize={12} displayValue={true} />
                </div>
              )}
              {formData.supplier && (
                <div className="pt-4 flex flex-col border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Primary Vendor</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.supplier.name}</span>
                  <span className="text-xs text-slate-500 mt-1">{formData.supplier.address}</span>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-slate-600">GST: <span className="font-medium text-slate-800">{formData.supplier.gstin || 'N/A'}</span></span>
                    <span className="text-slate-600">Ph: <span className="font-medium text-slate-800">{formData.supplier.contact || 'N/A'}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmDelete.id) {
            deleteMedicineMutation.mutate(confirmDelete.id, {
              onSettled: () => setConfirmDelete({ isOpen: false, id: null })
            });
          }
        }}
        title="Delete Medicine"
        description="Are you sure you want to delete this medicine? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMedicineMutation.isPending}
      />
    </div>
    
  );
}
