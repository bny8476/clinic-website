import React, { useState, useMemo, useEffect } from 'react';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import doctorService from '../../utils/pharmacy/doctorService';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Award,
  Building2, 
  Check, 
  Edit3, 
  Loader2, 
  MapPin, 
  Phone, 
  Plus, 
  Save, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  Trash2, 
  User, 
  UserCheck, 
  UserRound, 
  X 
} from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  specialization: '',
  contactNumber: '',
  registrationNumber: '',
  clinicAddress: ''
};

const COMMON_SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Pediatrician',
  'Orthopedic Surgeon',
  'Dermatologist',
  'Gynecologist',
  'Neurologist',
  'ENT Specialist',
  'Pulmonologist',
  'Ophthalmologist',
  'General Surgeon',
  'Diabetologist'
];

function DoctorFormModal({ isOpen, onClose, isEditMode, initialData, onSave, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setForm({
          name: initialData.name || '',
          specialization: initialData.specialization || '',
          contactNumber: initialData.contactNumber || '',
          registrationNumber: initialData.registrationNumber || '',
          clinicAddress: initialData.clinicAddress || ''
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [isEditMode, initialData, isOpen]);

  const f = (k) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [k]: val }));
    if (errors[k]) {
      setErrors(p => ({ ...p, [k]: '' }));
    }
  };

  const handleSelectSpecialization = (spec) => {
    setForm(p => ({ ...p, specialization: spec }));
    if (errors.specialization) {
      setErrors(p => ({ ...p, specialization: '' }));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const newErrors = {};
    if (!form.name?.trim()) {
      newErrors.name = 'Doctor name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Doctor name must be at least 2 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the highlighted errors');
      return;
    }

    onSave(form);
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 transition-all shadow-xs placeholder:text-slate-400";
  const labelCls = "text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5";

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditMode ? 'Edit Doctor Details' : 'Register New Doctor'}
      description="Register referring physicians, medical council credentials, and practice address for prescription management."
      size="lg"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Doctor' : 'Save Doctor'}
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Physician Identity */}
        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Physician Identity & Specialty
            </h4>
            <span className="text-[11px] text-slate-500">* Required field</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>
                Doctor Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                  Dr.
                </div>
                <input 
                  className={`${inputCls} pl-10 ${errors.name ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                  value={form.name} 
                  onChange={f('name')} 
                  placeholder="e.g. Ramesh Kumar, MD" 
                  autoFocus
                />
              </div>
              {errors.name ? (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Full legal or clinical name as displayed on prescriptions.</p>
              )}
            </div>

            <div>
              <label className={labelCls}>
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                Specialization / Clinical Department
              </label>
              <input 
                className={inputCls} 
                value={form.specialization} 
                onChange={f('specialization')} 
                placeholder="e.g. Cardiologist, Internal Medicine, Pediatrics" 
              />
              
              {/* Specialization Quick Suggestion Chips */}
              <div className="mt-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Quick Select:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SPECIALIZATIONS.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSelectSpecialization(spec)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer border ${
                        form.specialization === spec
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Medical Registration & Contact */}
        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Credentials & Contact
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Medical Reg / NMC Number
              </label>
              <div className="relative">
                <input 
                  className={`${inputCls} font-mono uppercase tracking-wider`} 
                  value={form.registrationNumber} 
                  onChange={f('registrationNumber')} 
                  placeholder="e.g. NMC/MCI-2024-89712" 
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">State Council or National Medical Commission ID</p>
            </div>

            <div>
              <label className={labelCls}>
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Contact Phone Number
              </label>
              <div className="relative">
                <input 
                  className={`${inputCls} font-mono`} 
                  type="tel"
                  value={form.contactNumber} 
                  onChange={f('contactNumber')} 
                  placeholder="e.g. +91 98765 43210" 
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Direct clinic or mobile number for dosage queries</p>
            </div>
          </div>
        </div>

        {/* Section 3: Clinic & Chamber Address */}
        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" /> Practice Location / Chamber Address
          </h4>

          <div>
            <label className={labelCls}>
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              Clinic or Hospital Address
            </label>
            <textarea 
              className={inputCls} 
              rows={3} 
              value={form.clinicAddress} 
              onChange={f('clinicAddress')} 
              placeholder="e.g. Suite 304, Medicare PolyClinic, 14th Main Road, Indiranagar, Bengaluru - 560038" 
            />
            <p className="text-[11px] text-slate-500 mt-1">Location printed on pharmacy referral records</p>
          </div>
        </div>

        {/* Live Doctor Badge Preview */}
        {form.name?.trim() && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-600 font-bold">Prescription Preview</div>
                <div className="text-sm font-bold text-slate-800">
                  {form.name.startsWith('Dr.') ? form.name : `Dr. ${form.name}`}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-medium text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px]">
                    {form.specialization || 'General Practitioner'}
                  </span>
                  {form.registrationNumber && (
                    <span className="font-mono text-slate-600 text-[11px]">
                      Reg: {form.registrationNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {form.contactNumber && (
              <div className="text-right sm:self-center font-mono text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-xs">
                📞 {form.contactNumber}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

export default function Doctors() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: doctorsPage, isLoading: loading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.getAllDoctors(0, 1000)
  });

  const doctors = doctorsPage?.content || [];

  const createDoctorMutation = useMutation({
    mutationFn: (data) => doctorService.createDoctor(data),
    onSuccess: () => {
      toast.success('Doctor registered successfully');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to register doctor');
    }
  });

  const updateDoctorMutation = useMutation({
    mutationFn: ({ id, data }) => doctorService.updateDoctor(id, data),
    onSuccess: () => {
      toast.success('Doctor updated successfully');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update doctor');
    }
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id) => doctorService.deleteDoctor(id),
    onSuccess: () => {
      toast.success('Doctor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: () => toast.error('Failed to delete doctor')
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleSave = async (form) => {
    if (!form.name?.trim()) { 
      toast.error('Doctor name is required'); 
      return; 
    }
    
    if (isEditMode) {
      updateDoctorMutation.mutate({ id: selectedDoctor.id, data: form });
    } else {
      createDoctorMutation.mutate(form);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const openAdd = () => { 
    setIsEditMode(false); 
    setSelectedDoctor(null); 
    setIsModalOpen(true); 
  };
  
  const openEdit = (d) => { 
    setIsEditMode(true); 
    setSelectedDoctor(d); 
    setIsModalOpen(true); 
  };

  const filtered = useMemo(() => {
    const list = doctorsPage?.content || [];
    return list.filter(d => {
      return !debouncedSearch || 
        (d.name?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (d.specialization?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (d.contactNumber?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (d.registrationNumber?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
    });
  }, [doctorsPage?.content, debouncedSearch]);

  const specializationsCount = useMemo(() => {
    const set = new Set();
    doctors.forEach(d => {
      if (d.specialization?.trim()) set.add(d.specialization.trim());
    });
    return set.size;
  }, [doctors]);

  const verifiedRegCount = useMemo(() => {
    return doctors.filter(d => !!d.registrationNumber?.trim()).length;
  }, [doctors]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Doctors Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage referring physicians, prescribers, and medical license records</p>
            </div>
          </div>
        </div>
        <button 
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> Register New Doctor
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registered</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{doctors.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active prescribers in system</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <UserRound className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialties</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">{specializationsCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Distinct clinical categories</div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Licensed / Reg Verified</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{verifiedRegCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">With NMC or Council number</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by physician name, specialty, contact number, or reg ID…"
            className="w-full pl-10 pr-3.5 py-2 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-slate-400 transition-all" 
          />
        </div>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear Filter
          </button>
        )}
        <span className="text-xs font-semibold text-slate-500 ml-auto px-2">
          Showing {filtered.length} of {doctors.length} doctors
        </span>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8">
            <Skeleton.Table rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-slate-400">
              <UserRound className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No doctors found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? `No doctors match your query "${searchTerm}". Try searching for another name or license.`
                : 'Get started by adding your clinic prescribers and referring doctors.'}
            </p>
            <button 
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer border-none shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Register Doctor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Physician</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Specialization</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Council Reg No.</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinic Location</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-4 text-xs font-mono text-slate-400 text-center">{i + 1}</td>
                    
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-100">
                          {d.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`}
                          </div>
                          <div className="text-[11px] text-slate-500 sm:hidden">
                            {d.specialization || 'General'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {d.specialization ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <Stethoscope className="w-3 h-3 text-blue-500" />
                          {d.specialization}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {d.contactNumber ? (
                        <div className="text-xs font-mono text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {d.contactNumber}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {d.registrationNumber ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          {d.registrationNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {d.clinicAddress ? (
                        <div className="text-xs text-slate-600 max-w-xs truncate flex items-center gap-1" title={d.clinicAddress}>
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{d.clinicAddress}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          title="Edit Doctor Details" 
                          onClick={() => openEdit(d)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          title="Delete Doctor" 
                          onClick={() => handleDelete(d.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <DoctorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditMode={isEditMode}
        initialData={selectedDoctor}
        onSave={handleSave}
        isSubmitting={createDoctorMutation.isPending || updateDoctorMutation.isPending}
      />

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmDelete.id) {
            deleteDoctorMutation.mutate(confirmDelete.id, {
              onSettled: () => setConfirmDelete({ isOpen: false, id: null })
            });
          }
        }}
        title="Delete Doctor"
        description="Are you sure you want to delete this doctor? Referring records will be detached but existing invoices remain intact."
        confirmText="Delete Doctor"
        isDestructive={true}
        isLoading={deleteDoctorMutation.isPending}
      />
    </div>
  );
}
