import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, Heart, 
  Wind, CircleDot, Bone
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import ConfirmDialog from '../../components/ui/ConfirmDialog';



const CATEGORIES = [
  { name: 'Respiratory', icon: Wind, color: 'blue', desc: 'Cough, Cold, Asthma, COPD' },
  { name: 'Cardiology', icon: Heart, color: 'rose', desc: 'Hypertension, CHF, Arrhythmia' },
  { name: 'Gastroenterology', icon: Activity, color: 'emerald', desc: 'Gastritis, GERD, Diarrhea' },
  { name: 'Endocrinology', icon: CircleDot, color: 'purple', desc: 'Diabetes, Thyroid, Obesity' },
  { name: 'Orthopedics', icon: Bone, color: 'amber', desc: 'Pain, Arthritis, Injury' },
];

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-500', pillBg: 'bg-blue-100', pillText: 'text-blue-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500', pillBg: 'bg-rose-100', pillText: 'text-rose-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', pillBg: 'bg-emerald-100', pillText: 'text-emerald-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', pillBg: 'bg-purple-100', pillText: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-500', pillBg: 'bg-amber-100', pillText: 'text-amber-600' },
};

const PrescriptionTemplates = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  
  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
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
    (t.diagnosis && t.diagnosis.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  return (
    
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">

      


      {/* Main Content Area */}
      <div className="p-8 max-w-[1400px] mx-auto w-full flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
          <div>
            <h1 className="text-[30px] font-extrabold text-slate-900 mb-2 tracking-tight">Prescription Templates</h1>
            <p className="text-slate-500 text-[15px] font-medium">Create and manage reusable prescription templates for quick prescribing.</p>
          </div>
          <div className="flex gap-3 mt-2 md:mt-0">
            <button 
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
            >
              <PlusSquare className="w-4 h-4" /> Create Template
            </button>
            <button 
              onClick={() => setIsPatientModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)]"
            >
              <FilePlus className="w-4 h-4" /> Create Prescription
            </button>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          {categoryCounts.map((cat, idx) => {
            const colors = colorMap[cat.color];
            return (
              <div 
                key={idx} 
                className={clsx(
                  "bg-white rounded-[24px] p-6 flex flex-col items-center text-center border transition-all cursor-pointer group",
                  activeCategory === cat.name ? "border-blue-400 shadow-md ring-4 ring-blue-50/50" : "border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-slate-300"
                )}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              >
                <div className={clsx("w-[76px] h-[76px] rounded-full flex items-center justify-center mb-5 transition-transform group-hover:-translate-y-1 group-hover:scale-105 duration-300", colors.bg, colors.text)}>
                  <cat.icon className="w-9 h-9 stroke-[1.5]" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-[17px] mb-2">{cat.name}</h3>
                <div className={clsx("px-3.5 py-1 rounded-full text-xs font-bold mb-4", colors.pillBg, colors.pillText)}>
                  {cat.count} Templates
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-5 font-medium min-h-[40px]">
                  {cat.desc}
                </p>
                <button className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:text-blue-700">
                  {activeCategory === cat.name ? "Clear Filter" : "View Templates"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* All Templates Section */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-7">
          <h2 className="text-[22px] font-extrabold text-slate-900 mb-6">
            {activeCategory ? `${activeCategory} Templates` : 'All Templates'}
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-10">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search templates..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium transition-colors shadow-sm"
                />
              </div>
              
              <div className="relative w-full sm:w-48">
                <select className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm cursor-pointer">
                  <option>All Categories</option>
                  {CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-48">
                <select className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm cursor-pointer">
                  <option>Recently Updated</option>
                  <option>Oldest First</option>
                  <option>A-Z</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={clsx("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white shadow-sm text-blue-600 ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={clsx("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white shadow-sm text-blue-600 ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty State vs Content */}
          {templatesLoading ? (
            <div className="py-24 text-center text-sm font-semibold text-slate-500">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute top-2 right-1 w-4 h-4 bg-blue-100 rounded-full"></div>
                <div className="absolute bottom-5 left-1 w-2.5 h-2.5 bg-blue-200 rounded-full"></div>
                <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                <div className="relative">
                    <FolderOpen className="w-14 h-14 text-blue-300 fill-blue-100/50 stroke-1" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 p-2 bg-white rounded-lg shadow-sm border border-slate-100 rotate-6">
                        <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                </div>
              </div>
              <h3 className="text-[22px] font-extrabold text-slate-900 mb-2">No templates found</h3>
              <p className="text-slate-500 text-[15px] font-medium max-w-sm mb-8">You haven't created any templates yet.<br/>Create your first template to get started.</p>
              <button 
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" /> Create Template
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div key={template.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 transition-all bg-white flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                      <FileText className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <TemplateActions 
                      template={template} 
                      onDelete={(id) => setConfirmDelete({ isOpen: true, templateId: id })}
                    />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">{template.name}</h4>
                  <div className="text-[11px] font-bold text-slate-500 bg-slate-100 uppercase tracking-wide inline-flex px-2.5 py-1 rounded-md w-max mb-4">{template.category}</div>
                  <p className="text-sm text-slate-600 mb-6 font-medium line-clamp-2">{template.diagnosis || 'No diagnosis specified'}</p>
                  
                  <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 text-slate-600">{template.items?.length || 0} Medicines</span>
                    <button className="text-blue-600 hover:text-blue-800 transition-opacity flex items-center gap-1 group-hover:underline">Use Template <ChevronRight className="w-3 h-3"/></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-5 sm:col-span-4">Template Name</div>
                    <div className="col-span-3 hidden sm:block">Category</div>
                    <div className="col-span-4 sm:col-span-4">Diagnosis</div>
                    <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
                </div>
                {filteredTemplates.map((template, idx) => (
                    <div key={template.id} className={clsx("grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors group", idx < filteredTemplates.length - 1 ? 'border-b border-slate-100' : '')}>
                        <div className="col-span-5 sm:col-span-4 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm shrink-0">
                                <FileText className="w-5 h-5 stroke-[1.5]" />
                            </div>
                            <div className="font-bold text-slate-900 text-[15px] truncate group-hover:text-blue-600 transition-colors">{template.name}</div>
                        </div>
                        <div className="col-span-3 hidden sm:block">
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 uppercase tracking-wide inline-flex px-2 py-0.5 rounded-md">{template.category}</span>
                        </div>
                        <div className="col-span-4 sm:col-span-4 text-sm font-medium text-slate-600 truncate">{template.diagnosis || '-'}</div>
                        <div className="col-span-3 sm:col-span-1 text-right">
                            <TemplateActions 
                            template={template} 
                            onDelete={(id) => setConfirmDelete({ isOpen: true, templateId: id })}
                            />
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Picker Modal */}
      <Transition show={isPatientModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsPatientModalOpen(false)}>
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
                    <Dialog.Title as="h3" className="text-xl font-extrabold leading-6 text-slate-900">
                      Select Patient
                    </Dialog.Title>
                    <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
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
                          <p className="text-sm font-semibold text-slate-500">No patients found matching "{debouncedPatientSearch}"</p>
                      </div>
                    ) : patients.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => navigate(`/doctor/patients/${p.patientId || p.id}/prescriptions/new`)}
                        className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors group"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
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

      {/* Create Template Modal */}
      <CreateTemplateModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
        onSuccess={() => queryClient.invalidateQueries(['prescription-templates'])}
      />

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
};

const TemplateActions = ({ template, onDelete }) => {
  return (
    <Menu as="div" className="relative inline-block text-left ml-2">
      <Menu.Button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
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
        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-slate-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 overflow-hidden">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onDelete(template.id)}
                  className={`${
                    active ? 'bg-red-50 text-red-600' : 'text-slate-700'
                  } group flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors`}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-400 group-hover:text-red-600" aria-hidden="true" />
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

const CreateTemplateModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    chiefComplaint: '',
    diagnosis: '',
    items: [{ medicationName: '', type: 'Tablet', strength: '', dosage: '', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }]
  });

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { medicationName: '', type: 'Tablet', strength: '', dosage: '', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }] });
  };

  const removeItem = (idx) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const mutation = useMutation({
    mutationFn: async (data) => axiosPrivate.post(`/prescriptions/templates`, data),
    onSuccess: () => {
      toast.success('Template created successfully');
      onSuccess();
      onClose();
      // reset form
      setFormData({
        name: '', category: 'General', chiefComplaint: '', diagnosis: '', items: [{ medicationName: '', type: 'Tablet', strength: '', dosage: '', frequency: '1-0-1', duration: '5 Days', timing: 'After Food', instructions: '' }]
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Template name is required');
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-[#F8FAFC] shadow-2xl transition-all flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                  <Dialog.Title as="h3" className="text-xl font-extrabold leading-6 text-slate-900">
                    Create Prescription Template
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8 overflow-y-auto flex-1">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                    <h4 className="font-bold text-slate-900 mb-5 text-sm uppercase tracking-wider">Template Details</h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-2">Template Name <span className="text-red-500">*</span></label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="e.g. Standard HTN Protocol" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-2">Category</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors">
                                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                <option value="General">General</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-2">Chief Complaint</label>
                            <input value={formData.chiefComplaint} onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="e.g. Cough and cold for 3 days" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-2">Diagnosis</label>
                            <input value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="e.g. Viral URI" />
                        </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                       <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Medications</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Medicine Name</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Strength</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-24">Dosage</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-32">Frequency</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-28">Duration</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-32">Timing</th>
                                    <th className="px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                        <td className="p-2"><input value={item.medicationName} onChange={e => updateItem(idx, 'medicationName', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="Medicine" /></td>
                                        <td className="p-2"><input value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" /></td>
                                        <td className="p-2"><input value={item.strength} onChange={e => updateItem(idx, 'strength', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="e.g. 500mg" /></td>
                                        <td className="p-2"><input value={item.dosage} onChange={e => updateItem(idx, 'dosage', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="e.g. 1" /></td>
                                        <td className="p-2"><input value={item.frequency} onChange={e => updateItem(idx, 'frequency', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="1-0-1" /></td>
                                        <td className="p-2"><input value={item.duration} onChange={e => updateItem(idx, 'duration', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" placeholder="5 Days" /></td>
                                        <td className="p-2"><select value={item.timing} onChange={e => updateItem(idx, 'timing', e.target.value)} className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"><option>After Food</option><option>Before Food</option></select></td>
                                        <td className="p-2 text-center"><button onClick={() => removeItem(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <button onClick={addItem} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 shadow-sm">
                            <Plus className="w-4 h-4" /> Add Medicine
                        </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.02)]">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                    <button onClick={handleSubmit} disabled={mutation.isPending} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                        {mutation.isPending ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PrescriptionTemplates;
