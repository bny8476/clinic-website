import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Eye, 
  MoreVertical, 
  Phone, 
  Plus, 
  Search, 
  X,
  Calendar,
  FileText,
  Trash2,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Save,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { axiosPrivate } from '../../api/axios';
import { MOCK_PATIENTS } from '../../data/unifiedMockData';

const PatientList = ({ onPatientClick }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('name'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [editPatient, setEditPatient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const itemsPerPage = 8;

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: async () => (await axiosPrivate.get('/doctor/patients/my')).data,
    refetchInterval: 10000,
  });

  const activePatientsList = (Array.isArray(patients) && patients.length > 0) ? patients : MOCK_PATIENTS;

  const filteredAndSorted = useMemo(() => {
    return activePatientsList
      .filter(p => {
        const pKey = p.patientId || p.id;
        const matchesQuery = !query || 
          p.name?.toLowerCase().includes(query.toLowerCase()) ||
          p.phone?.includes(query) || 
          pKey?.toString().includes(query) || 
          p.mrn?.toLowerCase().includes(query.toLowerCase()) ||
          p.email?.toLowerCase().includes(query.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || 
          (statusFilter === 'Active' ? (p.status === 'Active' || !p.status) : p.status === statusFilter);
        
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortField === 'lastVisit') return new Date(b.lastVisitDate || 0) - new Date(a.lastVisitDate || 0);
        return 0;
      });
  }, [activePatientsList, query, statusFilter, sortField]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
  const displayedPatients = useMemo(() => {
    return filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '-';
    }
  };

  const generateEmail = (patient) => {
    if (patient.email) return patient.email;
    if (!patient.name) return '-';
    return `${patient.name.replace(/\s+/g, '.').toLowerCase()}@example.com`;
  };

  const generateDisplayId = (id) => {
    if (!id && id !== 0) return 'PAT-00001';
    return `PAT-${String(id).padStart(5, '0')}`;
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const openEdit = (p) => {
    setEditPatient(p);
    setEditForm({
      gender: p.gender || '',
      bloodGroup: p.bloodGroup || '',
      address: p.address || '',
      emergencyContactName: p.emergencyContactName || p.emergencyContact || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
      medicalHistorySummary: p.medicalHistorySummary || '',
      allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || ''),
    });
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      const targetId = editPatient.patientId || editPatient.id;
      return (await axiosPrivate.put(`/patients/${targetId}`, editForm)).data;
    },
    onSuccess: () => {
      toast.success('Patient profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });
      setEditPatient(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return (await axiosPrivate.delete(`/patients/${id}`)).data;
    },
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Delete failed'),
  });

  const handleRowOrEyeClick = (p) => {
    const pKey = p.patientId || p.id;
    if (onPatientClick) {
      onPatientClick(pKey);
    } else {
      navigate(`/doctor/patients/${pKey}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50/40 min-h-full font-sans">
      <div className="max-w-[1580px] mx-auto space-y-4">
        
        {/* Controls Bar: Search, Status, Sort & Add Patient */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">Patients Registry</h2>
              <span className="px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-extrabold flex items-center gap-1">
                <User size={12} className="text-blue-600" />
                {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'Patient' : 'Patients'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 m-0">
              Manage clinical charts, view medical records, and coordinate patient consultations
            </p>
          </div>
          
          <div className="flex flex-col gap-2.5 w-full lg:w-auto">
            {/* Row 1: WIDER Search Input */}
            <div className="relative w-full lg:w-[480px] xl:w-[520px]">
              <Search size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search patient by name, phone, MRN, ID..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Row 2: All Status, Sort By Name, Add Patient in ONE Row */}
            <div className="flex items-center gap-2.5 w-full flex-nowrap">
              {/* Status Filter (Moved Down) */}
              <div className="relative flex-1 min-w-[130px]">
                <select 
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort by Name Dropdown */}
              <div className="relative flex-1 min-w-[145px]">
                <select 
                  value={sortField}
                  onChange={e => {
                    setSortField(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="name">Sort by Name</option>
                  <option value="lastVisit">Sort by Last Visit</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Add Patient Button */}
              <button 
                type="button"
                onClick={() => navigate('/doctor/register')}
                className="flex items-center justify-center gap-1.5 bg-[#2160FF] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer border-none shrink-0 whitespace-nowrap"
              >
                <Plus size={16} strokeWidth={2.5} /> Add Patient
              </button>

              {/* Reset Filters if Applied */}
              {(query || statusFilter !== 'ALL' || sortField !== 'name') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('ALL');
                    setSortField('name');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer border-none shrink-0"
                  title="Reset filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-h-[380px]">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3.5 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Patient</th>
                  <th className="py-3.5 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Contact Details</th>
                  <th className="py-3.5 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Last Visit</th>
                  <th className="py-3.5 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Upcoming Appointment</th>
                  <th className="py-3.5 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-sm font-medium text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading patient registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedPatients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-base font-bold text-slate-700">No patients match your criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  displayedPatients.map((p, idx) => {
                    const patientKey = p.patientId || p.id;
                    const patientEmail = generateEmail(p);
                    const patientIdStr = generateDisplayId(patientKey);
                    const initials = getInitials(p.name);

                    return (
                      <tr 
                        key={patientKey || idx} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer bg-white"
                        onClick={() => handleRowOrEyeClick(p)}
                      >
                        {/* 1. Patient Particulars (Avatar, Name, ID badge, Demographics) */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0 select-none">
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight whitespace-nowrap">
                                  {p.name}
                                </span>
                                <span className="text-[10px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0 whitespace-nowrap inline-flex items-center">
                                  {patientIdStr}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
                                {p.age ? `${p.age} Yrs` : 'Adult'} · {p.gender || 'Male'} {p.bloodGroup ? `· ${p.bloodGroup}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact Details (Phone + Email) */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{p.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[220px]">{patientEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Last Visit Date */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>{formatDate(p.lastVisitDate)}</span>
                          </div>
                        </td>

                        {/* 4. Upcoming Appointment */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          {p.upcomingAppointmentDate ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2160FF]">
                              <Clock size={13} className="shrink-0 text-blue-500" />
                              <span>{formatDateTime(p.upcomingAppointmentDate)}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* 5. Status Badge */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-emerald-200">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            {p.status || 'Active'}
                          </span>
                        </td>

                        {/* 6. Actions (Eye = View Detail, Edit = Edit Info, 3-Dot = Distinct Clinical Menu) */}
                        <td className="py-3.5 px-5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                            {/* Eye Button: Primary action to view patient details */}
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowOrEyeClick(p);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer border-none" 
                              title="View Patient Details"
                            >
                              <Eye size={15} strokeWidth={2.5} />
                            </button>

                            {/* Edit Button: Primary action to edit patient demographic info */}
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(p);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer border-none" 
                              title="Edit Patient Info"
                            >
                              <Edit2 size={15} strokeWidth={2.5} />
                            </button>

                            {/* 3-Dot Options Menu: Distinct clinical workflow actions */}
                            <Menu as="div" className="relative inline-block text-left">
                              {({ open }) => (
                                <>
                                  <Menu.Button 
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer border-none ${
                                      open 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-transparent'
                                    }`}
                                    title="More Options"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <MoreVertical size={16} />
                                  </Menu.Button>

                                  <Transition
                                    enter="transition duration-100 ease-out"
                                    enterFrom="transform scale-95 opacity-0"
                                    enterTo="transform scale-100 opacity-100"
                                    leave="transition duration-75 ease-out"
                                    leaveFrom="transform scale-100 opacity-100"
                                    leaveTo="transform scale-95 opacity-0"
                                  >
                                    <Menu.Items 
                                      anchor={{
                                        to: idx >= Math.max(1, displayedPatients.length - 2) ? 'top end' : 'bottom end',
                                        gap: 6
                                      }}
                                      className="w-56 bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 p-1.5 z-50 focus:outline-none"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      {/* Header */}
                                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Patient Actions</span>
                                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60">
                                          {patientIdStr}
                                        </span>
                                      </div>

                                      <div className="space-y-0.5">
                                        {/* 1. Book Appointment */}
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button 
                                              type="button"
                                              onClick={() => navigate('/doctor/dashboard?panel=new-appointment')}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 bg-transparent'
                                              }`}
                                            >
                                              <Calendar size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                                              <span>Book Appointment</span>
                                            </button>
                                          )}
                                        </Menu.Item>

                                        {/* 2. Issue Medical Certificate */}
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button 
                                              type="button"
                                              onClick={() => navigate('/doctor/medical-certificate')}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 bg-transparent'
                                              }`}
                                            >
                                              <FileText size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                                              <span>Issue Medical Certificate</span>
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>

                                      <div className="h-px bg-slate-100 my-1" />

                                      {/* 3. Delete Patient */}
                                      <div className="space-y-0.5">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete patient ${p.name}?`)) {
                                                  deleteMutation.mutate(patientKey);
                                                }
                                              }}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-rose-50 text-rose-700' : 'text-rose-600 bg-transparent'
                                              }`}
                                            >
                                              <Trash2 size={15} className="text-rose-500" />
                                              <span>Delete Patient</span>
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </>
                              )}
                            </Menu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {!isLoading && filteredAndSorted.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50/70 border-t border-slate-200 gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} patients
              </span>
              
              <div className="flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition font-bold text-xs cursor-pointer bg-white"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition cursor-pointer border-none ${
                      currentPage === page 
                        ? 'bg-[#2160FF] text-white shadow-sm' 
                        : 'border border-slate-200 text-slate-600 hover:bg-white bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition font-bold text-xs cursor-pointer bg-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 font-sans overflow-y-auto">
          {/* WIDER RESPONSIVE MODAL CONTAINER */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
                  <User size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 m-0">Edit Patient Particulars</h3>
                    <span className="text-[11px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {generateDisplayId(editPatient.patientId || editPatient.id)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                    Update demographic details, emergency contacts, and clinical health profile
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditPatient(null)} 
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors border-none bg-transparent cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={e => { e.preventDefault(); editMutation.mutate(); }} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 bg-white">
              
              {/* Patient Identity Header Card */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 rounded-2xl p-4 border border-blue-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0">
                    {getInitials(editPatient.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-slate-900 m-0">{editPatient.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {editPatient.status || 'Active Patient'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">
                      MRN: {editPatient.mrn || 'MRN-2026-001'} · Age: {editPatient.age ? `${editPatient.age} Yrs` : 'Adult'} · Gender: {editPatient.gender || 'Male'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-xl border border-blue-100">
                    <Phone size={13} className="text-blue-600" />
                    <span>{editPatient.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-xl border border-blue-100">
                    <Mail size={13} className="text-blue-600" />
                    <span className="truncate max-w-[200px]">{generateEmail(editPatient)}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: CORE DEMOGRAPHICS & RESIDENTIAL ADDRESS */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <User size={15} />
                  </div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider m-0">Core Demographics & Address</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={editForm.gender} 
                        onChange={e => setEditForm({...editForm, gender: e.target.value})} 
                        className="w-full appearance-none border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white cursor-pointer shadow-2xs"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown size={15} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Blood Group
                    </label>
                    <div className="relative">
                      <select 
                        value={editForm.bloodGroup} 
                        onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} 
                        className="w-full appearance-none border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white cursor-pointer shadow-2xs"
                      >
                        <option value="">Select Blood Group</option>
                        {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Registered Demographic Note */}
                  <div className="hidden lg:block">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Patient Classification
                    </label>
                    <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-between">
                      <span>General Outpatient</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">OPD</span>
                    </div>
                  </div>

                  {/* Residential Address (Full Width on md/lg) */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      Residential Address
                    </label>
                    <input 
                      type="text" 
                      value={editForm.address} 
                      onChange={e => setEditForm({...editForm, address: e.target.value})} 
                      placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white transition-all shadow-2xs" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: EMERGENCY CONTACT INFORMATION */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone size={15} />
                  </div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider m-0">Emergency Contact & Next of Kin</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      Emergency Contact Name
                    </label>
                    <input 
                      type="text" 
                      value={editForm.emergencyContactName} 
                      onChange={e => setEditForm({...editForm, emergencyContactName: e.target.value})} 
                      placeholder="e.g. Mary Smith (Spouse)"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white transition-all shadow-2xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" />
                      Emergency Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={editForm.emergencyContactPhone} 
                      onChange={e => setEditForm({...editForm, emergencyContactPhone: e.target.value})} 
                      placeholder="+1-555-0198"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white transition-all shadow-2xs" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CLINICAL HEALTH BACKGROUND & ALLERGIES */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <HeartPulse size={15} />
                  </div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider m-0">Clinical Background & Medical Profile</h5>
                </div>

                <div className="space-y-4">
                  {/* Known Allergies */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <AlertCircle size={13} className="text-rose-500" />
                      Known Allergies & Drug Adverse Reactions
                    </label>
                    <input 
                      type="text" 
                      value={editForm.allergies} 
                      onChange={e => setEditForm({...editForm, allergies: e.target.value})} 
                      placeholder="e.g. Penicillin, Aspirin, Pollen, Peanuts (comma separated)" 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white transition-all shadow-2xs" 
                    />
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Enter substances or medications that trigger allergic or adverse reactions in this patient.
                    </p>
                  </div>

                  {/* Medical History Summary */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <FileText size={13} className="text-slate-400" />
                      Medical History & Chronic Conditions Summary
                    </label>
                    <textarea 
                      rows={3} 
                      value={editForm.medicalHistorySummary} 
                      onChange={e => setEditForm({...editForm, medicalHistorySummary: e.target.value})} 
                      placeholder="e.g. Primary Hypertension - Well Controlled, Routine Health Assessment, Type 2 Diabetes..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] bg-white transition-all shadow-2xs resize-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span>EMR Profile Updates are audited and saved to clinical registry</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button 
                    type="button" 
                    onClick={() => setEditPatient(null)} 
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={editMutation.isPending} 
                    className="px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-[#2160FF] hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer border-none disabled:opacity-60 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
