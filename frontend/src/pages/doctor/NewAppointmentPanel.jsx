import React, { useState, useMemo } from 'react';
import useAuthStore from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import {
  Calendar, CalendarDays, CalendarIcon, CheckCircle2, ChevronRight,
  Clock, Eye, FileText, Filter, LayoutGrid, Loader2, Plus, Search,
  Stethoscope, Users, X, XCircle, AlertCircle, Phone, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── helpers ──────────────────────────────────────────────────────────────────
const formatTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_META = {
  BOOKED:      { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' },
  CONFIRMED:   { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' },
  CHECKED_IN:  { label: 'In Progress', bg: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' },
  COMPLETED:   { label: 'Completed',   bg: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' },
  CANCELLED:   { label: 'Cancelled',   bg: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-500' },
  NO_SHOW:     { label: 'No Show',     bg: 'bg-orange-50 text-orange-600 border-orange-100', dot: 'bg-orange-500' },
  SCHEDULED:   { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' }
};

const TYPE_META = {
  'CONSULTATION': { label: 'Consultation', bg: 'bg-purple-50 text-purple-600 border-purple-100' },
  'FOLLOW_UP':    { label: 'Follow Up',    bg: 'bg-blue-50 text-blue-600 border-blue-100' },
  'PROCEDURE':    { label: 'Procedure',    bg: 'bg-amber-50 text-amber-600 border-amber-100' },
  'CHECKUP':      { label: 'Checkup',      bg: 'bg-teal-50 text-teal-600 border-teal-100' }
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-500' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${meta.bg}`}>
      {meta.label}
    </span>
  );
};

const NewAppointmentPanel = ({ onClose }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Appointments');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    patientFirstName: '',
    patientLastName: '',
    patientEmail: '',
    patientPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    reasonForVisit: '',
    type: 'CONSULTATION',
    priority: 'ROUTINE',
    notes: ''
  });

  // Patient live search state
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all appointments for doctor
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctorAllAppointments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get('/appointments/doctor/me');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Start Consultation Mutation
  const startConsultationMutation = useMutation({
    mutationFn: async (appointment) => {
      await axiosPrivate.patch(`/appointments/${appointment.id}/status?status=IN_PROGRESS`);
      const res = await axiosPrivate.post(`/v1/doctor/encounters`, {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
      }).catch(async () => {
        return axiosPrivate.get(`/v1/doctor/encounters/by-appointment/${appointment.id}`);
      });
      return res.data;
    },
    onSuccess: (encounter) => {
      queryClient.invalidateQueries(['doctorAllAppointments']);
      navigate(`/doctor/consultation/${encounter.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to start consultation.');
    }
  });

  // Patient search handler
  const handlePatientSearch = async (query) => {
    setPatientSearchInput(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingPatients(true);
    try {
      const res = await axiosPrivate.get(`/patients/search?name=${encodeURIComponent(query)}`);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.patientId || patient.id || '',
      patientFirstName: patient.firstName || '',
      patientLastName: patient.lastName || '',
      patientPhone: patient.phone || '',
      patientEmail: patient.email || ''
    }));
    setSearchResults([]);
    setPatientSearchInput(`${patient.firstName} ${patient.lastName}`);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientSearchInput('');
    setFormData(prev => ({
      ...prev,
      patientId: '',
      patientFirstName: '',
      patientLastName: '',
      patientPhone: '',
      patientEmail: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientFirstName || !formData.appointmentDate || !formData.startTime) {
      toast.error('Please fill required fields (Patient Name, Date, Time)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${formData.appointmentDate}T${formData.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

      const payload = {
        patientId: formData.patientId ? parseInt(formData.patientId) : null,
        patientFirstName: formData.patientFirstName,
        patientLastName: formData.patientLastName,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
        doctorId: user?.id,
        appointmentDate: formData.appointmentDate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        reasonForVisit: formData.reasonForVisit,
        type: formData.type,
        status: 'SCHEDULED',
        priority: formData.priority,
        notes: formData.notes
      };

      await axiosPrivate.post('/appointments', payload);
      toast.success('Appointment scheduled successfully!');
      queryClient.invalidateQueries(['doctorAllAppointments']);
      queryClient.invalidateQueries(['doctor-today-appointments']);
      setIsFormOpen(false);
      
      // Reset form
      setFormData({
        patientId: '',
        patientFirstName: '',
        patientLastName: '',
        patientEmail: '',
        patientPhone: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        reasonForVisit: '',
        type: 'CONSULTATION',
        priority: 'ROUTINE',
        notes: ''
      });
      setSelectedPatient(null);
      setPatientSearchInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Compute Statistics
  const now = new Date();
  const todayStr = now.toDateString();

  const stats = useMemo(() => {
    let total = appointments.length;
    let todayCount = 0;
    let completed = 0;
    let cancelled = 0;

    appointments.forEach(apt => {
      if (new Date(apt.startTime).toDateString() === todayStr) todayCount++;
      if (apt.status === 'COMPLETED') completed++;
      if (apt.status === 'CANCELLED') cancelled++;
    });

    return { total, todayCount, completed, cancelled };
  }, [appointments, todayStr]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    
    if (activeTab === 'Today') {
      filtered = filtered.filter(a => new Date(a.startTime).toDateString() === todayStr);
    } else if (activeTab === 'Upcoming') {
      filtered = filtered.filter(a => new Date(a.startTime) >= now && ['SCHEDULED', 'BOOKED', 'CONFIRMED'].includes(a.status));
    } else if (activeTab === 'Completed') {
      filtered = filtered.filter(a => a.status === 'COMPLETED');
    } else if (activeTab === 'Cancelled') {
      filtered = filtered.filter(a => a.status === 'CANCELLED');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        const name = `${a.patientFirstName} ${a.patientLastName}`.toLowerCase();
        return name.includes(q) || (a.reasonForVisit && a.reasonForVisit.toLowerCase().includes(q));
      });
    }

    return filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [appointments, activeTab, searchQuery, now, todayStr]);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50/50 overflow-y-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#2160FF]" />
            Doctor Appointments
          </h1>
          <p className="text-sm text-slate-500 font-medium">View your appointment list and schedule new consultations</p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2160FF] hover:bg-[#1a4acc] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none"
        >
          <Plus size={18} strokeWidth={2.5} />
          Schedule New Appointment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Appointments</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Appointments</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.todayCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.completed}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancelled</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.cancelled}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Appointments List Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All Appointments', 'Today', 'Upcoming', 'Completed', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === tab
                  ? 'bg-[#2160FF] text-white border-[#2160FF] shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2160FF] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin mb-3 text-[#2160FF]" />
            <p className="text-sm font-medium">Loading scheduled appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 text-center">
            <CalendarIcon size={48} className="mb-3 text-slate-200" />
            <h4 className="text-base font-bold text-slate-700">No appointments found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Click "+ Schedule New Appointment" above to book an appointment for a patient.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Time / Date</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Reason for Visit</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAppointments.map(apt => {
                  const typeMeta = TYPE_META[apt.type] || TYPE_META['CONSULTATION'];
                  const canStart = ['BOOKED', 'CONFIRMED', 'SCHEDULED', 'CHECKED_IN'].includes(apt.status);

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{formatTime(apt.startTime)}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{formatDate(apt.startTime || apt.appointmentDate)}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold text-xs">
                            {apt.patientFirstName ? apt.patientFirstName[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{apt.patientFirstName} {apt.patientLastName}</div>
                            <div className="text-[11px] text-slate-400">{apt.patientPhone || apt.patientEmail || 'No contact info'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${typeMeta.bg}`}>
                          {typeMeta.label}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-slate-700 font-medium text-xs max-w-[200px] truncate">
                          {apt.reasonForVisit || 'Regular Consultation'}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={apt.status} />
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {apt.patientId && (
                            <button
                              onClick={() => navigate(`/doctor/patients/${apt.patientId}`)}
                              title="View Patient Record"
                              className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-100 cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          {canStart && (
                            <button
                              onClick={() => startConsultationMutation.mutate(apt)}
                              disabled={startConsultationMutation.isPending}
                              title="Start Consultation"
                              className="px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
                            >
                              {startConsultationMutation.isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <Stethoscope size={14} />
                                  Start
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Appointment Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#2160FF]" />
                  <h3 className="font-bold text-base">Schedule New Appointment</h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                {/* Patient Search & Autocomplete */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Search Existing Patient or Enter Details
                  </label>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={patientSearchInput}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                      placeholder="Type patient name or phone number..."
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                    {selectedPatient && (
                      <button
                        type="button"
                        onClick={clearSelectedPatient}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 z-10 relative">
                      {searchResults.map(p => (
                        <div
                          key={p.id || p.patientId}
                          onClick={() => selectPatient(p)}
                          className="p-3 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-800">{p.firstName} {p.lastName}</div>
                            <div className="text-xs text-slate-500">{p.phone || p.email}</div>
                          </div>
                          <span className="text-xs font-bold text-[#2160FF]">Select</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="p-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Linked Patient: #{selectedPatient.patientId || selectedPatient.id} ({selectedPatient.firstName} {selectedPatient.lastName})
                    </div>
                  )}
                </div>

                {/* Patient Information Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">First Name *</label>
                    <input
                      required
                      name="patientFirstName"
                      value={formData.patientFirstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Last Name</label>
                    <input
                      name="patientLastName"
                      value={formData.patientLastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                    <input
                      name="patientPhone"
                      value={formData.patientPhone}
                      onChange={handleChange}
                      placeholder="Phone"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      name="patientEmail"
                      value={formData.patientEmail}
                      onChange={handleChange}
                      placeholder="Email"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                  </div>
                </div>

                {/* Appointment Schedule Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Time *</label>
                    <input
                      type="time"
                      required
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Reason for Visit</label>
                    <textarea
                      name="reasonForVisit"
                      value={formData.reasonForVisit}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Reason for visit or clinical notes..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Appointment Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    >
                      <option value="CONSULTATION">Consultation</option>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="PROCEDURE">Procedure</option>
                      <option value="CHECKUP">Checkup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#2160FF] hover:bg-[#1a4acc] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer border-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Confirm & Schedule
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewAppointmentPanel;

