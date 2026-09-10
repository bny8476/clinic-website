import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { axiosPrivate } from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import {
  Stethoscope, Search, Plus, Eye, Edit3,
  X, ChevronLeft, ChevronRight, Phone, Mail,
  Award, Building, Hash, User, CheckCircle2,
  XCircle, Download, RefreshCw, Calendar,
  Users, Star, Badge as BadgeIcon, ToggleLeft, ToggleRight
} from 'lucide-react';

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
  'Psychiatry', 'General Medicine', 'Gynecology', 'Oncology', 'Radiology',
  'Anesthesiology', 'Ophthalmology', 'ENT', 'Urology', 'Endocrinology',
  'Gastroenterology', 'Nephrology', 'Pulmonology', 'Rheumatology', 'Surgery'
];

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
    active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
  }`}>
    {active ? <><CheckCircle2 className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
  </span>
);

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  specialty: '', registrationNumber: '', qualification: '',
  consultationFee: '', departmentId: '', bio: '', yearsExperience: ''
};

export default function DoctorManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Fetch doctors
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-doctors-full', page, size, debouncedQuery, specialtyFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, size });
      if (debouncedQuery) params.set('search', debouncedQuery);
      if (specialtyFilter) params.set('specialty', specialtyFilter);
      try {
        const res = await axiosPrivate.get(`/doctors/admin/all?${params}`);
        return res.data;
      } catch {
        const res = await axiosPrivate.get(`/doctors?${params}`);
        return res.data;
      }
    }
  });

  // Fetch departments for dropdown
  const { data: depts = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/departments');
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch { return []; }
    }
  });

  const doctorList = Array.isArray(data) ? data : (data?.content || []);
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements ?? doctorList.length;

  const filtered = statusFilter
    ? doctorList.filter(d => statusFilter === 'active' ? d.isActive !== false : d.isActive === false)
    : doctorList;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body) => axiosPrivate.post('/doctors', body),
    onSuccess: () => {
      toast.success('Doctor added successfully!');
      queryClient.invalidateQueries(['admin-doctors-full']);
      setIsCreateOpen(false);
      setFormData(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add doctor')
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => axiosPrivate.put(`/doctors/${id}`, body),
    onSuccess: () => {
      toast.success('Doctor updated successfully!');
      queryClient.invalidateQueries(['admin-doctors-full']);
      setEditingDoctor(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update doctor')
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => axiosPrivate.patch(`/doctors/${id}/status`, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(`Doctor ${isActive ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries(['admin-doctors-full']);
    },
    onError: () => toast.error('Failed to update doctor status')
  });

  const openEdit = (doctor) => {
    setFormData({
      firstName: doctor.firstName || '',
      lastName: doctor.lastName || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialty: doctor.specialty || '',
      registrationNumber: doctor.registrationNumber || '',
      qualification: doctor.qualification || '',
      consultationFee: doctor.consultationFee || '',
      departmentId: doctor.departmentId || '',
      bio: doctor.bio || '',
      yearsExperience: doctor.yearsExperience || ''
    });
    setEditingDoctor(doctor);
  };

  const handleSubmit = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      return toast.error('First name, last name and email are required');
    }
    if (editingDoctor) {
      updateMutation.mutate({ id: editingDoctor.id, body: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Specialty', 'Email', 'Phone', 'Registration No', 'Status'],
      ...filtered.map(d => [
        d.id, `${d.firstName} ${d.lastName}`, d.specialty, d.email,
        d.phone, d.registrationNumber, d.isActive ? 'Active' : 'Inactive'
      ])
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'doctors_export.csv'; a.click();
    toast.success('Doctor roster exported as CSV');
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );

  const Input = ({ field, placeholder, type = 'text' }) => (
    <input
      type={type}
      value={formData[field]}
      onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
    />
  );

  const specialtyColors = {
    Cardiology: 'bg-red-50 text-red-700 border-red-200',
    Neurology: 'bg-purple-50 text-purple-700 border-purple-200',
    Orthopedics: 'bg-orange-50 text-orange-700 border-orange-200',
    Pediatrics: 'bg-pink-50 text-pink-700 border-pink-200',
    Dermatology: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    default: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  const getSpecialtyColor = (spec) => specialtyColors[spec] || specialtyColors.default;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5 m-0">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            </div>
            Doctor Management
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 ml-11">
            {totalElements.toLocaleString()} registered practitioners across all departments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => refetch()} className="p-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search by name, email, specialty..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
          />
        </div>
        <select value={specialtyFilter} onChange={e => { setSpecialtyFilter(e.target.value); setPage(0); }}
          className="px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]">
          <option value="">All Specialties</option>
          {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(searchQuery || specialtyFilter || statusFilter) && (
          <button onClick={() => { setSearchQuery(''); setSpecialtyFilter(''); setStatusFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Doctors', value: totalElements, color: 'text-[#2160FF]', bg: 'bg-blue-50' },
          { label: 'Active', value: doctorList.filter(d => d.isActive !== false).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: doctorList.filter(d => d.isActive === false).length, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Specialties', value: new Set(doctorList.map(d => d.specialty).filter(Boolean)).size, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Stethoscope className={`w-5 h-5 ${s.color}`} strokeWidth={2.5} />
            </div>
            <div>
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-500 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Stethoscope className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-[14px] font-bold">No doctors found</p>
            <p className="text-[12px] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Doctor', 'Specialty', 'Contact', 'Registration', 'Fee', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((doc, i) => (
                <motion.tr key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }} className="hover:bg-emerald-50/20 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                        {(doc.firstName?.[0] || 'D').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-[11px] text-slate-400">ID: {doc.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {doc.specialty ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getSpecialtyColor(doc.specialty)}`}>
                        {doc.specialty}
                      </span>
                    ) : <span className="text-slate-400 text-[12px]">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />{doc.email || '—'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />{doc.phone || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-mono text-slate-600">{doc.registrationNumber || '—'}</td>
                  <td className="px-5 py-4 text-[13px] font-bold text-slate-700">
                    {doc.consultationFee ? `₹${Number(doc.consultationFee).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-5 py-4"><StatusBadge active={doc.isActive !== false} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingDoctor(doc)}
                        className="p-2 bg-blue-50 text-[#2160FF] rounded-lg hover:bg-blue-100 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(doc)}
                        className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: doc.id, isActive: !doc.isActive })}
                        className={`p-2 rounded-lg transition-colors ${doc.isActive !== false ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        title={doc.isActive !== false ? 'Deactivate' : 'Activate'}>
                        {doc.isActive !== false ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[12px] text-slate-500">
              Page {page + 1} of {totalPages} ({totalElements.toLocaleString()} total)
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page < 3 ? i : page > totalPages - 4 ? totalPages - 5 + i : page - 2 + i;
                if (pg < 0 || pg >= totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 text-[12px] font-bold rounded-lg border transition-colors ${pg === page ? 'bg-[#2160FF] border-[#2160FF] text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {pg + 1}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Doctor Modal */}
      <AnimatePresence>
        {viewingDoctor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setViewingDoctor(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-extrabold">
                    {(viewingDoctor.firstName?.[0] || 'D').toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[17px] font-extrabold text-white">Dr. {viewingDoctor.firstName} {viewingDoctor.lastName}</h2>
                    <p className="text-[12px] text-emerald-100">{viewingDoctor.specialty || 'General Practitioner'}</p>
                    <StatusBadge active={viewingDoctor.isActive !== false} />
                  </div>
                </div>
                <button onClick={() => setViewingDoctor(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" strokeWidth={2.5} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: 'Email', val: viewingDoctor.email },
                  { icon: Phone, label: 'Phone', val: viewingDoctor.phone },
                  { icon: Award, label: 'Qualification', val: viewingDoctor.qualification },
                  { icon: Hash, label: 'Reg. Number', val: viewingDoctor.registrationNumber },
                  { icon: Calendar, label: 'Experience', val: viewingDoctor.yearsExperience ? `${viewingDoctor.yearsExperience} years` : null },
                  { icon: Building, label: 'Consultation Fee', val: viewingDoctor.consultationFee ? `₹${Number(viewingDoctor.consultationFee).toLocaleString('en-IN')}` : null },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700">{val || '—'}</p>
                  </div>
                ))}
                {viewingDoctor.bio && (
                  <div className="col-span-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-[12px] text-blue-800 leading-relaxed">{viewingDoctor.bio}</p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-2">
                <button onClick={() => { setViewingDoctor(null); openEdit(viewingDoctor); }}
                  className="flex-1 py-2.5 bg-emerald-600 text-white text-[13px] font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Doctor
                </button>
                <button onClick={() => setViewingDoctor(null)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(isCreateOpen || editingDoctor) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && (setIsCreateOpen(false), setEditingDoctor(null))}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-extrabold text-white">{editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor'}</h2>
                    <p className="text-[11px] text-emerald-100">{editingDoctor ? `Editing: Dr. ${editingDoctor.firstName} ${editingDoctor.lastName}` : 'Register a new practitioner'}</p>
                  </div>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setEditingDoctor(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" strokeWidth={2.5} />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'First Name *', field: 'firstName', placeholder: 'John' },
                    { label: 'Last Name *', field: 'lastName', placeholder: 'Smith' },
                    { label: 'Email Address *', field: 'email', placeholder: 'doctor@hospital.com', type: 'email' },
                    { label: 'Phone Number', field: 'phone', placeholder: '+91 98765 43210' },
                    { label: 'Registration Number', field: 'registrationNumber', placeholder: 'MCI-123456' },
                    { label: 'Qualification', field: 'qualification', placeholder: 'MBBS, MD' },
                    { label: 'Years of Experience', field: 'yearsExperience', placeholder: '10', type: 'number' },
                    { label: 'Consultation Fee (₹)', field: 'consultationFee', placeholder: '500', type: 'number' },
                  ].map(({ label, field, placeholder, type = 'text' }) => (
                    <div key={field}>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                      <input type={type} value={formData[field]} onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specialty</label>
                    <select value={formData.specialty} onChange={e => setFormData(p => ({ ...p, specialty: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white">
                      <option value="">— Select Specialty —</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                    <select value={formData.departmentId} onChange={e => setFormData(p => ({ ...p, departmentId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white">
                      <option value="">— Select Department —</option>
                      {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Professional Bio</label>
                    <textarea value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Brief professional bio..." rows={3}
                      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button onClick={() => { setIsCreateOpen(false); setEditingDoctor(null); }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-colors disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
