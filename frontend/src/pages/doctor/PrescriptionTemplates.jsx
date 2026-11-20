import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { 
  Activity, 
  Bone, 
  ChevronDown, 
  ChevronRight, 
  CircleDot, 
  FilePlus, 
  FileText, 
  Filter, 
  FolderOpen, 
  Heart, 
  LayoutGrid, 
  List, 
  Menu, 
  MoreVertical, 
  Plus, 
  PlusSquare, 
  Save, 
  Search, 
  Trash2, 
  Wind, 
  X,
  Edit3,
  Eye,
  Sparkles,
  CheckCircle2,
  Clock,
  Pill,
  Stethoscope,
  Info,
  Calendar,
  Layers,
  Baby,
  Smile
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

const CATEGORIES = [
  { name: 'Respiratory', icon: Wind, color: 'blue', desc: 'Cough, Cold, Asthma, Bronchitis, COPD' },
  { name: 'Cardiology', icon: Heart, color: 'rose', desc: 'Hypertension, Dyslipidemia, Angina, CHF' },
  { name: 'Gastroenterology', icon: Activity, color: 'emerald', desc: 'Gastritis, GERD, APD, Diarrhea, IBS' },
  { name: 'Endocrinology', icon: CircleDot, color: 'purple', desc: 'Type 2 Diabetes, Hypothyroid, Obesity' },
  { name: 'Orthopedics', icon: Bone, color: 'amber', desc: 'Osteoarthritis, Back Pain, Sprains, Gout' },
  { name: 'General', icon: Stethoscope, color: 'indigo', desc: 'Routine Fever, Viral Infections, Health Check' }
];

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-500', pillBg: 'bg-blue-100', pillText: 'text-blue-700' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500', pillBg: 'bg-rose-100', pillText: 'text-rose-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', pillBg: 'bg-emerald-100', pillText: 'text-emerald-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', pillBg: 'bg-purple-100', pillText: 'text-purple-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-500', pillBg: 'bg-amber-100', pillText: 'text-amber-700' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', pillBg: 'bg-indigo-100', pillText: 'text-indigo-700' },
};

const COMMON_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Inhaler', 'Drops', 'Ointment', 'Spray'];
const COMMON_FREQUENCIES = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', '0-1-0', '1-1-1-1', 'SOS (As Needed)', 'Once Weekly'];
const COMMON_TIMINGS = ['After Food', 'Before Food', 'With Food', 'Empty Stomach', 'At Bedtime', 'As Needed'];
const COMMON_DURATIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '1 Month', 'Ongoing / Chronic'];

// Starter Clinical Presets for Quick Seeding
const STARTER_PRESETS = [
  {
    name: 'Upper Respiratory Infection / Flu Protocol',
    category: 'Respiratory',
    chiefComplaint: 'Fever, sore throat, dry cough, body aches for 3 days',
    diagnosis: 'Acute Viral Upper Respiratory Infection (URI)',
    notes: 'Hydration: drink 2-3 liters warm water daily. Steam inhalation twice daily with saline. Gargle with warm salt water. Review in 5 days if fever persists.',
    items: [
      { medicationName: 'Paracetamol', type: 'Tablet', strength: '650 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: 'Take SOS for fever > 100°F' },
      { medicationName: 'Levocetirizine', type: 'Tablet', strength: '5 mg', dosage: '1 Tab', frequency: '0-0-1', duration: '5 Days', timing: 'At Bedtime', instructions: 'May cause mild drowsiness' },
      { medicationName: 'Dextromethorphan Syrup', type: 'Syrup', strength: '10 mg/5ml', dosage: '10 ml', frequency: '1-1-1', duration: '5 Days', timing: 'After Food', instructions: 'Shake well before use' }
    ]
  },
  {
    name: 'Essential Hypertension Starter Protocol',
    category: 'Cardiology',
    chiefComplaint: 'Routine blood pressure review, occasional morning headache',
    diagnosis: 'Primary / Essential Hypertension (Stage 1)',
    notes: 'Dietary sodium restriction (< 2g salt/day). 30 minutes daily aerobic walking. Maintain home BP log (morning & evening). Review in 2 weeks with BP diary.',
    items: [
      { medicationName: 'Telmisartan', type: 'Tablet', strength: '40 mg', dosage: '1 Tab', frequency: '1-0-0', duration: '1 Month', timing: 'Before Food', instructions: 'Take in the morning regularly' },
      { medicationName: 'Amlodipine', type: 'Tablet', strength: '5 mg', dosage: '1 Tab', frequency: '0-0-1', duration: '1 Month', timing: 'At Bedtime', instructions: 'Report any ankle swelling' }
    ]
  },
  {
    name: 'Acute Acid Peptic Disease / GERD Protocol',
    category: 'Gastroenterology',
    chiefComplaint: 'Epigastric burning, retrosternal chest burn, water brash after meals',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD) & Gastritis',
    notes: 'Avoid spicy, oily, deep-fried food and caffeinated drinks. Eat small frequent meals. Avoid lying down within 2 hours after meals. Elevate head while sleeping.',
    items: [
      { medicationName: 'Pantoprazole + Domperidone', type: 'Capsule', strength: '40mg/30mg', dosage: '1 Cap', frequency: '1-0-0', duration: '14 Days', timing: 'Empty Stomach', instructions: 'Take 30 minutes before breakfast' },
      { medicationName: 'Magaldrate + Simethicone Gel', type: 'Syrup', strength: '400mg/20mg', dosage: '10 ml', frequency: '1-1-1', duration: '7 Days', timing: 'After Food', instructions: 'Take 1 hour after meals and at bedtime' }
    ]
  },
  {
    name: 'Type 2 Diabetes Maintenance Protocol',
    category: 'Endocrinology',
    chiefComplaint: 'Follow-up for glycemic control, polyuria and fatigue',
    diagnosis: 'Type 2 Diabetes Mellitus',
    notes: 'Strict diabetic diet. Avoid refined sugar and sweetened drinks. Foot care inspection daily. Check Fasting & Post-prandial blood sugars weekly. Review in 1 month with HbA1c.',
    items: [
      { medicationName: 'Metformin Sustained Release', type: 'Tablet', strength: '500 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '1 Month', timing: 'After Food', instructions: 'Take with or immediately after food' },
      { medicationName: 'Glimepiride', type: 'Tablet', strength: '1 mg', dosage: '1 Tab', frequency: '1-0-0', duration: '1 Month', timing: 'Before Food', instructions: 'Take 15 mins before breakfast. Carry glucose candy for hypoglycemia.' }
    ]
  },
  {
    name: 'Osteoarthritis & Joint Pain Protocol',
    category: 'Orthopedics',
    chiefComplaint: 'Bilateral knee joint pain, stiffness in morning for past 6 months',
    diagnosis: 'Bilateral Primary Osteoarthritis of Knees',
    notes: 'Quadriceps strengthening exercises daily. Avoid squatting and sitting cross-legged. Hot fermentation for 15 mins twice daily. Calcium and Vitamin D rich diet.',
    items: [
      { medicationName: 'Aceclofenac + Paracetamol', type: 'Tablet', strength: '100mg/325mg', dosage: '1 Tab', frequency: '1-0-1', duration: '7 Days', timing: 'After Food', instructions: 'Take only when pain is severe' },
      { medicationName: 'Calcium Carbonate + Vit D3', type: 'Tablet', strength: '500mg/250IU', dosage: '1 Tab', frequency: '0-0-1', duration: '1 Month', timing: 'After Food', instructions: 'Take with milk or water at bedtime' },
      { medicationName: 'Diclofenac Sodium Gel', type: 'Ointment', strength: '1% w/w', dosage: 'Local', frequency: '1-0-1', duration: '14 Days', timing: 'As Needed', instructions: 'Gently apply over knee joint without vigorous rubbing' }
    ]
  }
];

export default function PrescriptionTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('Recently Updated');
  
  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedTemplateForUse, setSelectedTemplateForUse] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, templateId: null });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearchQuery, 300);

  // Queries
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['prescription-templates', activeCategory],
    queryFn: async () => {
      const url = activeCategory 
        ? `/prescriptions/templates?category=${encodeURIComponent(activeCategory)}`
        : `/prescriptions/templates`;
      return (await axiosPrivate.get(url)).data;
    }
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', debouncedPatientSearch],
    queryFn: async () => {
      if (!debouncedPatientSearch) return [];
      return (await axiosPrivate.get(`/patients/search?query=${encodeURIComponent(debouncedPatientSearch)}`)).data;
    },
    enabled: isPatientModalOpen && debouncedPatientSearch.length > 0
  });

  const { data: allTemplates = [] } = useQuery({
    queryKey: ['prescription-templates', null],
    queryFn: async () => (await axiosPrivate.get(`/prescriptions/templates`)).data
  });

  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: allTemplates.filter(t => t.category === cat.name).length
  }));

  const filteredTemplates = templates.filter(t => 
    !debouncedSearch || t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    (t.diagnosis && t.diagnosis.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
    (t.chiefComplaint && t.chiefComplaint.toLowerCase().includes(debouncedSearch.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
    if (sortBy === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Seed preset template mutation
  const seedPresetMutation = useMutation({
    mutationFn: async (preset) => {
      return (await axiosPrivate.post('/prescriptions/templates', preset)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prescription-templates']);
      toast.success('Clinical protocol imported successfully!');
    },
    onError: () => {
      toast.error('Failed to import protocol');
    }
  });

  const openCreateModal = () => {
    setTemplateToEdit(null);
    setIsTemplateModalOpen(true);
  };

  const openEditModal = (template) => {
    setTemplateToEdit(template);
    setIsTemplateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Expansive Main Container */}
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Prescription Protocols & Templates</h1>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  {allTemplates.length} Active Protocols
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
                Create, customize, and manage clinical prescription templates with standardized dosages, frequencies, and patient lifestyle advice.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <button 
              onClick={openCreateModal}
              className="w-full sm:w-[220px] h-[46px] flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 hover:border-blue-300 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
            >
              <PlusSquare className="w-4 h-4 shrink-0" /> 
              <span>Create Custom Template</span>
            </button>
            <button 
              onClick={() => setIsPatientModalOpen(true)}
              className="w-full sm:w-[220px] h-[46px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <FilePlus className="w-4 h-4 shrink-0" /> 
              <span>Prescribe to Patient</span>
            </button>
          </div>
        </div>

        {/* Category Cards Carousel / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {categoryCounts.map((cat, idx) => {
            const colors = colorMap[cat.color] || colorMap.indigo;
            const isSelected = activeCategory === cat.name;
            return (
              <div 
                key={idx} 
                className={clsx(
                  "bg-white rounded-2xl p-5 flex flex-col items-center text-center border transition-all cursor-pointer group select-none",
                  isSelected 
                    ? "border-blue-500 shadow-md ring-4 ring-blue-100" 
                    : "border-slate-200/80 shadow-sm hover:shadow hover:border-slate-300"
                )}
                onClick={() => setActiveCategory(isSelected ? null : cat.name)}
              >
                <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-200", colors.bg, colors.text)}>
                  <cat.icon className="w-7 h-7 stroke-[1.75]" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">{cat.name}</h3>
                <div className={clsx("px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2", colors.pillBg, colors.pillText)}>
                  {cat.count} Protocols
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[32px] font-medium leading-tight">
                  {cat.desc}
                </p>
                <span className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-0.5 group-hover:underline">
                  {isSelected ? "Clear Filter" : "Filter"} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            );
          })}
        </div>

        {/* All Templates Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Section Header & Search Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {activeCategory ? `${activeCategory} Protocols` : 'All Prescription Protocols'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Showing {filteredTemplates.length} prescription templates ready for instant clinical use
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search template name, diagnosis..." 
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              
              {/* Category dropdown */}
              <div className="relative w-full sm:w-48">
                <select 
                  value={activeCategory || 'All Categories'}
                  onChange={e => setActiveCategory(e.target.value === 'All Categories' ? null : e.target.value)}
                  className="appearance-none w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="All Categories">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative w-full sm:w-44">
                <select 
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Recently Updated">Recently Updated</option>
                  <option value="Oldest First">Oldest First</option>
                  <option value="A-Z">A-Z Name</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              
              {/* View switch */}
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button 
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={clsx("p-2 rounded-lg transition-all border-none cursor-pointer", viewMode === 'grid' ? "bg-white shadow text-blue-600" : "text-slate-400 hover:text-slate-600 bg-transparent")}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={clsx("p-2 rounded-lg transition-all border-none cursor-pointer", viewMode === 'list' ? "bg-white shadow text-blue-600" : "text-slate-400 hover:text-slate-600 bg-transparent")}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty State vs Content */}
          {templatesLoading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Loading prescription templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                <FolderOpen className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">No templates found</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {activeCategory 
                    ? `No templates currently match "${activeCategory}".` 
                    : `You haven't created any custom templates yet.`}
                  <br />Create your first protocol or import standard clinical starter sets below.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
                <button 
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" /> Create Custom Template
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div 
                  key={template.id} 
                  className="border border-slate-200/90 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition-all bg-white flex flex-col h-full group relative"
                >
                  {/* Top card header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          {template.category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Actions menu */}
                    <TemplateActions 
                      template={template} 
                      onEdit={() => openEditModal(template)}
                      onPreview={() => setPreviewTemplate(template)}
                      onDelete={(id) => setConfirmDelete({ isOpen: true, templateId: id })}
                    />
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base mb-1.5 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h4>
                  
                  {template.diagnosis && (
                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <span className="text-slate-400 font-normal">Dx:</span> {template.diagnosis}
                    </p>
                  )}

                  {template.chiefComplaint && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-600">Complaint:</span> {template.chiefComplaint}
                    </p>
                  )}

                  {template.notes && (
                    <p className="text-xs text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50 mb-4 line-clamp-2">
                      <span className="font-bold text-amber-900">Advice:</span> {template.notes}
                    </p>
                  )}

                  {/* Medicines summary preview */}
                  <div className="space-y-1.5 mb-5 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Prescribed Medicines ({template.items?.length || 0})
                    </p>
                    <div className="space-y-1">
                      {template.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs font-medium text-slate-700 flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-900 truncate max-w-[160px]">
                            {item.medicationName || item.medicineName}
                          </span>
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {item.strength} · {item.frequency}
                          </span>
                        </div>
                      ))}
                      {(template.items?.length || 0) > 3 && (
                        <p className="text-[11px] font-semibold text-blue-600 text-right cursor-pointer" onClick={() => setPreviewTemplate(template)}>
                          +{template.items.length - 3} more medications
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Card bottom actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold gap-2">
                    <button 
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border-none"
                    >
                      <Eye size={13} /> View Details
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedTemplateForUse(template.id);
                        setIsPatientModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer border-none"
                    >
                      Use Protocol <ChevronRight className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Template Protocol</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-3">Diagnosis & Complaint</div>
                <div className="col-span-1 text-center">Medicines</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50/70 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </span>
                        <span className="text-xs text-slate-400">{template.items?.length || 0} drugs prescribed</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        {template.category}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800 truncate">{template.diagnosis || '-'}</p>
                      <p className="text-slate-400 truncate">{template.chiefComplaint || ''}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-100">
                        {template.items?.length || 0}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedTemplateForUse(template.id);
                          setIsPatientModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer border-none shadow-sm"
                      >
                        Use Protocol
                      </button>
                      <TemplateActions 
                        template={template} 
                        onEdit={() => openEditModal(template)}
                        onPreview={() => setPreviewTemplate(template)}
                        onDelete={(id) => setConfirmDelete({ isOpen: true, templateId: id })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Starter Templates Seeder Panel */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 m-0">Standard Clinical Starter Protocols</h3>
              </div>
              <p className="text-xs text-slate-400">Click &ldquo;Import Protocol&rdquo; to instantly add pre-configured protocols into your practice</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STARTER_PRESETS.map((preset, idx) => {
                const isAlreadyPresent = allTemplates.some(t => t.name.toLowerCase() === preset.name.toLowerCase());
                return (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {preset.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{preset.items.length} meds</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">{preset.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{preset.diagnosis}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      {isAlreadyPresent ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Already in library
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => seedPresetMutation.mutate(preset)}
                          disabled={seedPresetMutation.isPending}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                        >
                          + Import Protocol
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400">{preset.items[0]?.medicationName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Patient Picker Modal */}
      <Transition show={isPatientModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
          setIsPatientModalOpen(false);
          setSelectedTemplateForUse(null);
        }}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-7 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-xl font-extrabold leading-6 text-slate-900 m-0">
                      Select Patient for Prescription
                    </Dialog.Title>
                    <button onClick={() => {
                      setIsPatientModalOpen(false);
                      setSelectedTemplateForUse(null);
                    }} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer border-none">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="relative mb-6">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      autoFocus
                      value={patientSearchQuery}
                      onChange={e => setPatientSearchQuery(e.target.value)}
                      placeholder="Search patient by name or phone..." 
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium shadow-sm transition-shadow"
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {patients.length === 0 && debouncedPatientSearch ? (
                      <div className="text-center py-10 flex flex-col items-center">
                        <Search className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm font-semibold text-slate-500">No patients found matching &ldquo;{debouncedPatientSearch}&rdquo;</p>
                      </div>
                    ) : patients.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          const url = `/doctor/patients/${p.patientId || p.id}/prescriptions/new` + (selectedTemplateForUse ? `?templateId=${selectedTemplateForUse}` : '');
                          navigate(url);
                        }}
                        className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-blue-50/60 cursor-pointer border border-transparent hover:border-blue-200 transition-colors group"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-200 transition-all">
                          <img loading="lazy" src={`https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=cbd5e1&color=334155`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-[15px] font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{p.firstName} {p.lastName}</div>
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">{p.phone} • {p.gender}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Preview Template Modal */}
      <Transition show={!!previewTemplate} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPreviewTemplate(null)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FileText size={20} />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-lg font-extrabold text-slate-900 m-0">
                          {previewTemplate?.name}
                        </Dialog.Title>
                        <p className="text-xs text-slate-400 m-0">Category: {previewTemplate?.category}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPreviewTemplate(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer border-none bg-transparent"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {previewTemplate?.diagnosis && (
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                        <span className="font-bold text-blue-900 block mb-0.5">Clinical Diagnosis:</span>
                        <p className="text-blue-800 m-0">{previewTemplate.diagnosis}</p>
                      </div>
                    )}

                    {previewTemplate?.chiefComplaint && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">Chief Complaints:</span>
                        <p className="text-slate-600 m-0">{previewTemplate.chiefComplaint}</p>
                      </div>
                    )}

                    {previewTemplate?.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs">
                        <span className="font-bold text-amber-900 block mb-0.5">Dietary & Lifestyle Advice:</span>
                        <p className="text-amber-800 m-0">{previewTemplate.notes}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prescribed Medications</h4>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {previewTemplate?.items?.map((item, idx) => (
                          <div key={idx} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <Pill size={14} className="text-blue-600" />
                                {item.medicationName || item.medicineName}
                                <span className="font-normal text-slate-500">({item.type || 'Tablet'})</span>
                              </div>
                              <p className="text-slate-500 mt-0.5">
                                Dosage: <strong>{item.dosage || '1'}</strong> · Strength: <strong>{item.strength}</strong> · Timing: <strong>{item.timing}</strong>
                              </p>
                              {item.instructions && (
                                <p className="text-blue-700 italic mt-0.5">Note: {item.instructions}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-md block">
                                {item.frequency}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">{item.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(null)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tempId = previewTemplate.id;
                        setPreviewTemplate(null);
                        setSelectedTemplateForUse(tempId);
                        setIsPatientModalOpen(true);
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer border-none"
                    >
                      Prescribe with Protocol
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Create / Edit Template Modal */}
      <TemplateFormModal 
        isOpen={isTemplateModalOpen} 
        templateToEdit={templateToEdit}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setTemplateToEdit(null);
        }} 
        onSuccess={() => queryClient.invalidateQueries(['prescription-templates'])}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, templateId: null })}
        onConfirm={async () => {
          if (!confirmDelete.templateId) return;
          try {
            await axiosPrivate.delete(`/prescriptions/templates/${confirmDelete.templateId}`);
            toast.success('Template deleted');
            queryClient.invalidateQueries(['prescription-templates']);
          } catch (e) {
            toast.error('Failed to delete template');
          } finally {
            setConfirmDelete({ isOpen: false, templateId: null });
          }
        }}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}

const TemplateActions = ({ template, onEdit, onPreview, onDelete }) => {
  return (
    <Menu as="div" className="relative inline-block text-left ml-2">
      <Menu.Button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer bg-transparent">
        <MoreVertical className="w-4 h-4" />
      </Menu.Button>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right divide-y divide-slate-100 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-20 overflow-hidden">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onPreview}
                  className={clsx(
                    "flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none bg-transparent",
                    active ? "bg-slate-50 text-slate-900" : "text-slate-700"
                  )}
                >
                  <Eye className="mr-2 h-4 w-4 text-slate-400" />
                  View Details
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onEdit}
                  className={clsx(
                    "flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none bg-transparent",
                    active ? "bg-blue-50 text-blue-600" : "text-slate-700"
                  )}
                >
                  <Edit3 className="mr-2 h-4 w-4 text-blue-500" />
                  Edit Template
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onDelete(template.id)}
                  className={clsx(
                    "flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none bg-transparent",
                    active ? "bg-red-50 text-red-600" : "text-slate-700"
                  )}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// Rich, Responsive Wide Template Form Modal supporting Create and Edit
const TemplateFormModal = ({ isOpen, templateToEdit, onClose, onSuccess }) => {
  const isEditing = Boolean(templateToEdit?.id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    chiefComplaint: '',
    diagnosis: '',
    notes: '',
    items: [
      { medicationName: '', type: 'Tablet', strength: '500 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }
    ]
  });

  // Fetch catalog medicines for autocomplete suggestions
  const { data: catalogMedicines = [] } = useQuery({
    queryKey: ['doctorMedicinesCatalog'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/doctor/medicines');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    staleTime: 5 * 60 * 1000
  });

  // Populate form if editing
  React.useEffect(() => {
    if (templateToEdit) {
      setFormData({
        name: templateToEdit.name || '',
        category: templateToEdit.category || 'General',
        chiefComplaint: templateToEdit.chiefComplaint || '',
        diagnosis: templateToEdit.diagnosis || '',
        notes: templateToEdit.notes || '',
        items: templateToEdit.items && templateToEdit.items.length > 0 
          ? templateToEdit.items.map(item => ({
              medicationName: item.medicationName || item.medicineName || '',
              type: item.type || 'Tablet',
              strength: item.strength || '',
              dosage: item.dosage || '1 Tab',
              frequency: item.frequency || '1-0-1',
              duration: item.duration || '5 Days',
              timing: item.timing || 'After Food',
              instructions: item.instructions || ''
            }))
          : [{ medicationName: '', type: 'Tablet', strength: '500 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }]
      });
    } else {
      setFormData({
        name: '',
        category: 'General',
        chiefComplaint: '',
        diagnosis: '',
        notes: '',
        items: [
          { medicationName: '', type: 'Tablet', strength: '500 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }
        ]
      });
    }
  }, [templateToEdit, isOpen]);

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleMedicineSelect = (idx, medicineName) => {
    const matched = catalogMedicines.find(m => 
      (m.medicineName && m.medicineName.toLowerCase() === medicineName.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase() === medicineName.toLowerCase())
    );
    const newItems = [...formData.items];
    newItems[idx].medicationName = medicineName;
    if (matched) {
      if (matched.dosageForm) newItems[idx].type = matched.dosageForm;
      if (matched.strength) newItems[idx].strength = matched.strength;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { medicationName: '', type: 'Tablet', strength: '500 mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }
      ]
    });
  };

  const removeItem = (idx) => {
    if (formData.items.length <= 1) {
      toast.error('Template must have at least one medication');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return axiosPrivate.put(`/prescriptions/templates/${templateToEdit.id}`, data);
      }
      return axiosPrivate.post(`/prescriptions/templates`, data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Template updated successfully' : 'Template created successfully');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save template');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Template name is required');
    if (!formData.items.some(i => i.medicationName.trim())) {
      return toast.error('Please specify at least one valid medication name');
    }
    mutation.mutate(formData);
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Wide Modal Panel */}
              <Dialog.Panel className="w-full max-w-5xl xl:max-w-6xl transform overflow-hidden rounded-3xl bg-[#F8FAFC] shadow-2xl transition-all flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                      <FileText size={20} />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-extrabold text-slate-900 m-0">
                        {isEditing ? 'Edit Prescription Protocol' : 'Create Prescription Protocol'}
                      </Dialog.Title>
                      <p className="text-xs text-slate-400 m-0">
                        Standardize clinical diagnoses, medication regimens, and patient advice.
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer border-none">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Modal Body Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                  
                  {/* Section 1: Protocol Details */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Stethoscope size={16} className="text-blue-600" />
                        Protocol Details
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">* Required fields</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                          Template / Protocol Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" 
                          placeholder="e.g. Standard HTN Protocol / Acute Bronchitis" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category</label>
                        <select 
                          value={formData.category} 
                          onChange={e => setFormData({...formData, category: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Clinical Diagnosis</label>
                        <input 
                          value={formData.diagnosis} 
                          onChange={e => setFormData({...formData, diagnosis: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" 
                          placeholder="e.g. Acute Viral URI / Essential Hypertension" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Chief Complaints</label>
                        <input 
                          value={formData.chiefComplaint} 
                          onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" 
                          placeholder="e.g. Fever, cough, nasal congestion for 3 days" 
                        />
                      </div>

                      {/* General Patient Advice & Lifestyle Recommendations */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                          <span>Dietary & Lifestyle Advice / Special Instructions</span>
                          <span className="text-[11px] text-slate-400 font-normal">Populates into patient's prescription notes</span>
                        </label>
                        <textarea 
                          rows={2}
                          value={formData.notes} 
                          onChange={e => setFormData({...formData, notes: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none" 
                          placeholder="e.g. Low sodium diet, hydration, avoid cold drinks, steam inhalation twice daily..." 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Medications Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                          <Pill size={16} className="text-blue-600" />
                          Prescribed Medications ({formData.items.length})
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Specify dosage, frequency, duration, and food timing</p>
                      </div>
                    </div>

                    {/* Responsive Table with generous column widths */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider min-w-[200px]">Medicine Name *</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-28">Type</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-28">Strength</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-24">Dosage</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-36">Frequency</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-32">Duration</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-36">Timing</th>
                            <th className="px-3 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider min-w-[150px]">Instructions</th>
                            <th className="px-2 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/60 transition-colors">
                              {/* Medicine Name with Suggestions Datalist */}
                              <td className="p-2.5">
                                <input 
                                  required
                                  list={`medicine-list-${idx}`}
                                  value={item.medicationName} 
                                  onChange={e => handleMedicineSelect(idx, e.target.value)} 
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-slate-50/50" 
                                  placeholder="e.g. Paracetamol" 
                                />
                                <datalist id={`medicine-list-${idx}`}>
                                  {catalogMedicines.map((m, mi) => (
                                    <option key={mi} value={m.medicineName}>{m.genericName ? `(${m.genericName})` : ''}</option>
                                  ))}
                                </datalist>
                              </td>

                              {/* Type / Dosage Form */}
                              <td className="p-2.5">
                                <select 
                                  value={item.type} 
                                  onChange={e => updateItem(idx, 'type', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                                >
                                  {COMMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </td>

                              {/* Strength */}
                              <td className="p-2.5">
                                <input 
                                  value={item.strength} 
                                  onChange={e => updateItem(idx, 'strength', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white" 
                                  placeholder="500 mg" 
                                />
                              </td>

                              {/* Dosage */}
                              <td className="p-2.5">
                                <input 
                                  value={item.dosage} 
                                  onChange={e => updateItem(idx, 'dosage', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white" 
                                  placeholder="1 Tab" 
                                />
                              </td>

                              {/* Frequency Dropdown */}
                              <td className="p-2.5">
                                <select 
                                  value={item.frequency} 
                                  onChange={e => updateItem(idx, 'frequency', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                                >
                                  {COMMON_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </td>

                              {/* Duration Dropdown */}
                              <td className="p-2.5">
                                <select 
                                  value={item.duration} 
                                  onChange={e => updateItem(idx, 'duration', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                                >
                                  {COMMON_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </td>

                              {/* Food Timing Dropdown */}
                              <td className="p-2.5">
                                <select 
                                  value={item.timing} 
                                  onChange={e => updateItem(idx, 'timing', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                                >
                                  {COMMON_TIMINGS.map(tm => <option key={tm} value={tm}>{tm}</option>)}
                                </select>
                              </td>

                              {/* Specific Instructions */}
                              <td className="p-2.5">
                                <input 
                                  value={item.instructions} 
                                  onChange={e => updateItem(idx, 'instructions', e.target.value)} 
                                  className="w-full px-2.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white" 
                                  placeholder="e.g. SOS / Take with warm milk" 
                                />
                              </td>

                              {/* Remove row */}
                              <td className="p-2.5 text-center">
                                <button 
                                  type="button" 
                                  onClick={() => removeItem(idx)} 
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                  title="Delete medication"
                                >
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                      <button 
                        type="button" 
                        onClick={addItem} 
                        className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-xl transition-colors border border-blue-200 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Medication Row
                      </button>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="pt-4 flex items-center justify-end gap-3 sticky bottom-0 bg-[#F8FAFC] py-2 border-t border-slate-200">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={mutation.isPending} 
                      className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20 cursor-pointer border-none flex items-center gap-2"
                    >
                      <Save size={16} />
                      {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Template' : 'Save Template')}
                    </button>
                  </div>
                </form>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
