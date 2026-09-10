import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { axiosPrivate } from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import {
  UserCheck, Search, Plus, Eye, Edit3, Filter,
  X, ChevronLeft, ChevronRight, Phone, Mail,
  User, Calendar, MapPin, Heart, Droplet,
  CheckCircle2, XCircle, Download, RefreshCw,
  FileText, Cake, Users
} from 'lucide-react';

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
    active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
  }`}>
    {active !== false
      ? <><CheckCircle2 className="w-3 h-3" />Active</>
      : <><XCircle className="w-3 h-3" />Inactive</>}
  </span>
);

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: 'MALE', bloodGroup: '',
  address: '', city: '', emergencyContactName: '',
  emergencyContactPhone: '', allergies: '', notes: ''
};

export default function PatientManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [viewingPatient, setViewingPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Fetch patients
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-patients', page, size, debouncedQuery, genderFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, size });
      if (debouncedQuery) params.set('search', debouncedQuery);
      if (genderFilter) params.set('gender', genderFilter);
      const res = await axiosPrivate.get(`/patients?${params}`);
      return res.data;
    }
  });

  const patientList = Array.isArray(data) ? data : (data?.content || []);
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements ?? patientList.length;

  const filtered = statusFilter
    ? patientList.filter(p => statusFilter === 'active' ? p.active !== false : p.active === false)
    : patientList;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body) => axiosPrivate.post('/patients/register', body),
    onSuccess: () => {
      toast.success('Patient registered successfully!');
      queryClient.invalidateQueries(['admin-patients']);
      setIsCreateOpen(false);
      setFormData(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to register patient')
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => axiosPrivate.put(`/patients/${id}`, body),
    onSuccess: () => {
      toast.success('Patient updated successfully!');
      queryClient.invalidateQueries(['admin-patients']);
      setEditingPatient(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update patient')
  });

  const openEdit = (patient) => {
    setFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      email: patient.email || '',
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || 'MALE',
      bloodGroup: patient.bloodGroup || '',
      address: patient.address || '',
      city: patient.city || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      allergies: patient.allergies || '',
      notes: patient.notes || ''
    });
    setEditingPatient(patient);
  };

  const handleSubmit = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      return toast.error('First name, last name and email are required');
    }
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, body: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Phone', 'Gender', 'DOB', 'Blood Group', 'City'],
      ...filtered.map(p => [
        p.id, `${p.firstName} ${p.lastName}`, p.email, p.phone,
        p.gender, p.dateOfBirth, p.bloodGroup, p.city
      ])
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'patients_export.csv'; a.click();
    toast.success('Patient list exported as CSV');
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );

  const Input = ({ field, placeholder, type = 'text', ...rest }) => (
    <input
      type={type}
      value={formData[field]}
      onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
      {...rest}
    />
  );

  const Select = ({ field, options }) => (
    <select
      value={formData[field]}
      onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all bg-white"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5 m-0">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#2160FF]" strokeWidth={2.5} />
            </div>
            Patient Management
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 ml-11">
            {totalElements.toLocaleString()} registered patients across all branches
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
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2160FF] text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Add Patient
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
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
          />
        </div>
        <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(0); }}
          className="px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]">
          <option value="">All Genders</option>
          {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(searchQuery || genderFilter || statusFilter) && (
          <button onClick={() => { setSearchQuery(''); setGenderFilter(''); setStatusFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2160FF] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-[14px] font-bold">No patients found</p>
            <p className="text-[12px] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Patient', 'Contact', 'Gender', 'Date of Birth', 'Blood Group', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                        {(p.firstName?.[0] || '?').toUpperCase()}{(p.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                        <p className="text-[11px] text-slate-400">ID: {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />{p.email || '—'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />{p.phone || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-700">{p.gender || '—'}</td>
                  <td className="px-5 py-4 text-[13px] text-slate-600">{p.dateOfBirth || '—'}</td>
                  <td className="px-5 py-4">
                    {p.bloodGroup ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-[11px] font-bold rounded-full border border-red-200">
                        <Droplet className="w-3 h-3" />{p.bloodGroup}
                      </span>
                    ) : <span className="text-slate-400 text-[13px]">—</span>}
                  </td>
                  <td className="px-5 py-4"><StatusBadge active={p.active} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingPatient(p)}
                        className="p-2 bg-blue-50 text-[#2160FF] rounded-lg hover:bg-blue-100 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
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
              Showing page {page + 1} of {totalPages} ({totalElements.toLocaleString()} total)
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

      {/* View Patient Modal */}
      <AnimatePresence>
        {viewingPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setViewingPatient(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {(viewingPatient.firstName?.[0] || '?').toUpperCase()}{(viewingPatient.lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-slate-800">{viewingPatient.firstName} {viewingPatient.lastName}</h2>
                    <p className="text-[12px] text-slate-500">Patient ID: {viewingPatient.id}</p>
                  </div>
                </div>
                <button onClick={() => setViewingPatient(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: 'Email', val: viewingPatient.email },
                  { icon: Phone, label: 'Phone', val: viewingPatient.phone },
                  { icon: User, label: 'Gender', val: viewingPatient.gender },
                  { icon: Cake, label: 'Date of Birth', val: viewingPatient.dateOfBirth },
                  { icon: Droplet, label: 'Blood Group', val: viewingPatient.bloodGroup },
                  { icon: MapPin, label: 'City', val: viewingPatient.city },
                  { icon: Heart, label: 'Emergency Contact', val: viewingPatient.emergencyContactName },
                  { icon: Phone, label: 'Emergency Phone', val: viewingPatient.emergencyContactPhone },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-[#2160FF]" strokeWidth={2.5} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700">{val || '—'}</p>
                  </div>
                ))}
                {viewingPatient.allergies && (
                  <div className="col-span-2 bg-red-50 rounded-xl p-3 border border-red-100">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">⚠ Allergies</p>
                    <p className="text-[13px] font-semibold text-red-700">{viewingPatient.allergies}</p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-2">
                <button onClick={() => { setViewingPatient(null); openEdit(viewingPatient); }}
                  className="flex-1 py-2.5 bg-[#2160FF] text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Patient
                </button>
                <button onClick={() => setViewingPatient(null)}
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
        {(isCreateOpen || editingPatient) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && (setIsCreateOpen(false), setEditingPatient(null))}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#1E3A8A] to-[#2160FF]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-extrabold text-white">{editingPatient ? 'Edit Patient' : 'Register New Patient'}</h2>
                    <p className="text-[11px] text-blue-200">{editingPatient ? `Editing: ${editingPatient.firstName} ${editingPatient.lastName}` : 'Add patient to the system'}</p>
                  </div>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setEditingPatient(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" strokeWidth={2.5} />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name *"><Input field="firstName" placeholder="John" /></Field>
                  <Field label="Last Name *"><Input field="lastName" placeholder="Doe" /></Field>
                  <Field label="Email Address *"><Input field="email" placeholder="patient@email.com" type="email" /></Field>
                  <Field label="Phone Number"><Input field="phone" placeholder="+91 98765 43210" /></Field>
                  <Field label="Date of Birth"><Input field="dateOfBirth" type="date" /></Field>
                  <Field label="Gender"><Select field="gender" options={GENDER_OPTIONS} /></Field>
                  <Field label="Blood Group"><Select field="bloodGroup" options={BLOOD_GROUPS} /></Field>
                  <Field label="City"><Input field="city" placeholder="Mumbai" /></Field>
                  <div className="col-span-2">
                    <Field label="Address">
                      <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                        placeholder="Full address" className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all" />
                    </Field>
                  </div>
                  <Field label="Emergency Contact Name"><Input field="emergencyContactName" placeholder="Jane Doe" /></Field>
                  <Field label="Emergency Contact Phone"><Input field="emergencyContactPhone" placeholder="+91 98765 43210" /></Field>
                  <div className="col-span-2">
                    <Field label="Known Allergies">
                      <textarea value={formData.allergies} onChange={e => setFormData(p => ({ ...p, allergies: e.target.value }))}
                        placeholder="List any known allergies..." rows={2}
                        className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all resize-none" />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button onClick={() => { setIsCreateOpen(false); setEditingPatient(null); }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-[#2160FF] hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
