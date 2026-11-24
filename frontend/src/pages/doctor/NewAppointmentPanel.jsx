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
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : (payload?.content || []);
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
      queryClient.invalidateQueries({ queryKey: ['doctorAllAppointments'] });
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
      queryClient.invalidateQueries({ queryKey: ['doctorAllAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-today-appointments'] });
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
      if (apt && apt.startTime && new Date(apt.startTime).toDateString() === todayStr) todayCount++;
      if (apt && apt.status === 'COMPLETED') completed++;
      if (apt && apt.status === 'CANCELLED') cancelled++;
    });

    return { total, todayCount, completed, cancelled };
  }, [appointments, todayStr]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    
    if (activeTab === 'Today') {
      filtered = filtered.filter(a => a && a.startTime && new Date(a.startTime).toDateString() === todayStr);
    } else if (activeTab === 'Upcoming') {
      filtered = filtered.filter(a => a && a.startTime && new Date(a.startTime) >= now && ['SCHEDULED', 'BOOKED', 'CONFIRMED'].includes(a.status));
    } else if (activeTab === 'Completed') {
      filtered = filtered.filter(a => a && a.status === 'COMPLETED');
    } else if (activeTab === 'Cancelled') {
      filtered = filtered.filter(a => a && a.status === 'CANCELLED');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        if (!a) return false;
        const name = `${a.patientFirstName || ''} ${a.patientLastName || ''}`.toLowerCase();
        return name.includes(q) || (a.reasonForVisit && a.reasonForVisit.toLowerCase().includes(q));
      });
    }

    return filtered.sort((a, b) => new Date(b?.startTime || 0) - new Date(a?.startTime || 0));
  }, [appointments, activeTab, searchQuery, now, todayStr]);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5 bg-transparent min-h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight m-0">
            <Calendar className="w-6 h-6 text-[#2160FF]" />
            Doctor Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5">
            View your consultation calendar, patient bookings, and clinic queue
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2160FF] hover:bg-[#1a4acc] text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer border-none shrink-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          Schedule New Appointment
        </button>
      </div>

      {/* Stats Cards — Balanced 4-card KPI row with exact vertical alignment */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[108px] hover:shadow-sm transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Appointments</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.total}</span>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">All Time</span>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[108px] hover:shadow-sm transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Today's Appointments</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.todayCount}</span>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Today</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[108px] hover:shadow-sm transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.completed}</span>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Attended</span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[108px] hover:shadow-sm transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cancelled</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.cancelled}</span>
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">Void</span>
          </div>
        </div>

      </div>

      {/* Appointments List Toolbar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Tabs Pills */}
        <div 
          className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-0.5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {['All Appointments', 'Today', 'Upcoming', 'Completed', 'Cancelled'].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-none cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#2160FF] text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, phone, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2160FF] focus:bg-white focus:ring-2 focus:ring-[#2160FF]/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table / Empty State Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 flex-1">
            <Loader2 size={32} className="animate-spin mb-3 text-[#2160FF]" />
            <p className="text-sm font-semibold text-slate-600">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center flex-1">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2160FF] flex items-center justify-center mb-3.5 shadow-2xs">
              <CalendarIcon size={26} />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 m-0">No appointments found</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm m-0">
              {searchQuery || activeTab !== 'All Appointments'
                ? 'No appointments match your current filter or search criteria.'
                : 'No consultations scheduled on your calendar. Click below to book an appointment for a patient.'}
            </p>
            {!searchQuery && activeTab === 'All Appointments' && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-4 px-4 py-2 bg-[#2160FF] hover:bg-[#1a4acc] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Plus size={15} strokeWidth={2.5} /> Schedule Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Time / Date</th>
                  <th className="py-3 px-5">Patient</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Reason for Visit</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAppointments.map(apt => {
                  const typeMeta = TYPE_META[apt.type] || TYPE_META[apt.appointmentType] || TYPE_META['CONSULTATION'];
                  const canStart = ['BOOKED', 'CONFIRMED', 'SCHEDULED', 'CHECKED_IN'].includes(apt.status);
                  const pFirst = apt.patientFirstName || apt.patient?.firstName || '';
                  const pLast = apt.patientLastName || apt.patient?.lastName || '';
                  const pName = `${pFirst} ${pLast}`.trim() || 'Patient';
                  const pContact = apt.patientPhone || apt.patientEmail || apt.patient?.phoneNumber || apt.patient?.email || 'No contact info';

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-slate-900 text-xs">{formatTime(apt.startTime)}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{formatDate(apt.startTime || apt.appointmentDate)}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold text-xs shrink-0">
                            {pName[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">{pName}</div>
                            <div className="text-[11px] text-slate-400 truncate">{pContact}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${typeMeta.bg}`}>
                          {typeMeta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <p className="text-slate-700 font-medium text-xs max-w-[220px] truncate m-0">
                          {apt.reasonForVisit || 'Regular Consultation'}
                        </p>
                      </td>

                      <td className="py-3.5 px-5">
                        <StatusBadge status={apt.status} />
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-2">
                          {apt.patientId && (
                            <button
                              type="button"
                              onClick={() => navigate(`/doctor/patients/${apt.patientId}`)}
                              title="View Patient Record"
                              className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-100 cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          {canStart && (
                            <button
                              type="button"
                              onClick={() => startConsultationMutation.mutate(apt)}
                              disabled={startConsultationMutation.isPending}
                              title="Start Consultation"
                              className="px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer border-none"
                            >
                              {startConsultationMutation.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <>
                                  <Stethoscope size={13} />
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
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 sm:py-5 bg-[#0F172A] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white m-0 tracking-tight">Schedule New Appointment</h3>
                    <p className="text-xs text-slate-400 m-0 mt-0.5">Enter patient particulars and consultation details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white cursor-pointer border-none bg-transparent"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
                <div className="p-5 sm:p-6 bg-slate-50/60 flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Column 1: Patient Information */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <User size={15} className="text-[#2160FF]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">Patient Information</h4>
                        </div>
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Step 1
                        </span>
                      </div>

                      {/* Patient Search & Autocomplete */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Search Existing Patient or Enter Details
                        </label>
                        
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={patientSearchInput}
                            onChange={(e) => handlePatientSearch(e.target.value)}
                            placeholder="Type patient name or phone number..."
                            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                          {selectedPatient && (
                            <button
                              type="button"
                              onClick={clearSelectedPatient}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                            >
                              <X size={15} />
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
                                  <div className="font-bold text-xs text-slate-800">{p.firstName} {p.lastName}</div>
                                  <div className="text-[11px] text-slate-400">{p.phone || p.email}</div>
                                </div>
                                <span className="text-xs font-bold text-[#2160FF]">Select</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedPatient && (
                          <div className="p-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-between border border-blue-100">
                            <span className="flex items-center gap-2 truncate">
                              <CheckCircle2 size={15} className="shrink-0" />
                              Linked: #{selectedPatient.patientId || selectedPatient.id} ({selectedPatient.firstName} {selectedPatient.lastName})
                            </span>
                            <button
                              type="button"
                              onClick={clearSelectedPatient}
                              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 underline border-none bg-transparent cursor-pointer shrink-0"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Patient Name Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">First Name *</label>
                          <input
                            required
                            name="patientFirstName"
                            value={formData.patientFirstName}
                            onChange={handleChange}
                            placeholder="e.g. John"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                          <input
                            name="patientLastName"
                            value={formData.patientLastName}
                            onChange={handleChange}
                            placeholder="e.g. Smith"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Contact Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                          <input
                            name="patientPhone"
                            value={formData.patientPhone}
                            onChange={handleChange}
                            placeholder="e.g. +1-555-0198"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                          <input
                            type="email"
                            name="patientEmail"
                            value={formData.patientEmail}
                            onChange={handleChange}
                            placeholder="e.g. patient@clinic.com"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Appointment Details & Schedule */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock size={15} className="text-indigo-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">Schedule & Details</h4>
                        </div>
                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          Step 2
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Date *</label>
                          <input
                            type="date"
                            required
                            name="appointmentDate"
                            value={formData.appointmentDate}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Time *</label>
                          <input
                            type="time"
                            required
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Type & Priority */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Appointment Type</label>
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          >
                            <option value="CONSULTATION">Consultation</option>
                            <option value="FOLLOW_UP">Follow Up</option>
                            <option value="PROCEDURE">Procedure</option>
                            <option value="CHECKUP">Checkup</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                          <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none transition-all"
                          >
                            <option value="ROUTINE">Routine</option>
                            <option value="URGENT">Urgent</option>
                            <option value="EMERGENCY">Emergency</option>
                          </select>
                        </div>
                      </div>

                      {/* Reason for Visit */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Reason for Visit</label>
                        <textarea
                          name="reasonForVisit"
                          value={formData.reasonForVisit}
                          onChange={handleChange}
                          rows="3"
                          placeholder="Chief complaints, symptoms, or clinical referral notes..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none resize-none transition-all"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Submit Actions Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    * Required fields must be completed to schedule
                  </span>
                  <div className="flex items-center gap-2.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#2160FF] hover:bg-[#1a4acc] text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 cursor-pointer border-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          Confirm & Schedule
                        </>
                      )}
                    </button>
                  </div>
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

