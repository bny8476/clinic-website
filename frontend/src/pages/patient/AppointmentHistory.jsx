import React, { useState, useMemo } from 'react';
import useAuthStore from '../../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CalendarDays,
  Calendar,
  CalendarPlus,
  Clock,
  User,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Video,
  Building2,
  ChevronRight,
  RotateCw,
  Eye,
  Loader2,
  Sparkles,
  MapPin,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeUp, listStagger, pageTransition } from '../../components/ui/motion';
import Modal from '../../components/ui/Modal';

const AppointmentHistory = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [cancelModalAppointment, setCancelModalAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Fetch real appointments for patient
  const { data: rawAppointments = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['patientAppointments', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/appointments/patient/${user?.id}`);
        return res.data?.data || res.data || [];
      } catch (err) {
        console.warn('Failed to fetch patient appointments', err);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const appointments = useMemo(() => (Array.isArray(rawAppointments) ? rawAppointments : []), [rawAppointments]);

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.patch(`/appointments/${id}/cancel?reason=Patient requested cancellation`);
    },
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['patientAppointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['patientDashboardTimeline', user?.id] });
      setCancelModalAppointment(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
      setCancelModalAppointment(null);
    }
  });

  const isActiveStatus = (status) => ['SCHEDULED', 'BOOKED', 'CONFIRMED', 'WAITING', 'CHECKED_IN', 'IN_PROGRESS', 'IN_CONSULTATION'].includes((status || '').toUpperCase());
  const isCompletedStatus = (status) => ['COMPLETED', 'SEEN'].includes((status || '').toUpperCase());
  const isCancelledStatus = (status) => ['CANCELLED', 'NO_SHOW', 'REJECTED'].includes((status || '').toUpperCase());

  // Statistics
  const upcomingCount = useMemo(() => appointments.filter(a => isActiveStatus(a.status)).length, [appointments]);
  const completedCount = useMemo(() => appointments.filter(a => isCompletedStatus(a.status)).length, [appointments]);
  const cancelledCount = useMemo(() => appointments.filter(a => isCancelledStatus(a.status)).length, [appointments]);

  // Filtered & Sorted Appointments
  const filteredAppointments = useMemo(() => {
    let list = appointments.filter(a => {
      // Tab filter
      if (activeTab === 'UPCOMING' && !isActiveStatus(a.status)) return false;
      if (activeTab === 'COMPLETED' && !isCompletedStatus(a.status)) return false;
      if (activeTab === 'CANCELLED' && !isCancelledStatus(a.status)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const docName = `${a.doctorFirstName || ''} ${a.doctorLastName || ''} ${a.doctorName || ''}`.toLowerCase();
        const reason = (a.reasonForVisit || '').toLowerCase();
        const apptNum = (a.appointmentNumber || '').toLowerCase();
        const tokenNum = String(a.tokenNumber || '');
        if (!docName.includes(q) && !reason.includes(q) && !apptNum.includes(q) && !tokenNum.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    list.sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.startTime ? new Date(b.startTime).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [appointments, activeTab, searchQuery, sortOrder]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (isCompletedStatus(s)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          COMPLETED
        </span>
      );
    }
    if (['IN_PROGRESS', 'IN_CONSULTATION'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          IN CONSULTATION
        </span>
      );
    }
    if (isActiveStatus(s)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          CONFIRMED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        {s.replace(/_/g, ' ') || 'CANCELLED'}
      </span>
    );
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top Header Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2160FF] to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    My Appointments & Consultations
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2160FF] border border-blue-200">
                    <Sparkles className="w-3 h-3" /> Live Booking
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                  View, schedule, reschedule, and manage your upcoming and historical doctor visits and virtual teleconsultations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                onClick={() => refetch()}
                title="Refresh Appointments"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => navigate('/patient/teleconsultations')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-purple-600" />
                <span>Telehealth</span>
              </button>

              <button
                onClick={() => navigate('/patient/book')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-blue-600 transition shadow-sm shadow-blue-500/25 cursor-pointer border-none"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>

          {/* ── Top KPI Metrics Strip ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Consultations</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{appointments.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold shadow-2xs">
                <CalendarDays className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700/80 uppercase tracking-wider">Upcoming & Active</p>
                <h3 className="text-2xl font-black text-[#2160FF] mt-0.5">{upcomingCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200/60 text-[#2160FF] flex items-center justify-center font-bold shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">Completed Visits</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{completedCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-700/80 uppercase tracking-wider">Cancelled / No-Show</p>
                <h3 className="text-2xl font-black text-rose-600 mt-0.5">{cancelledCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-rose-200/60 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Appointments', count: appointments.length },
              { id: 'UPCOMING', label: 'Upcoming', count: upcomingCount },
              { id: 'COMPLETED', label: 'Completed', count: completedCount },
              { id: 'CANCELLED', label: 'Cancelled', count: cancelledCount },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-[#2160FF] text-white border-[#2160FF] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctor, token, specialty..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition w-56 sm:w-64"
              />
            </div>

            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              aria-label="Sort appointments"
              style={{ backgroundImage: 'none' }}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 cursor-pointer shadow-2xs"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* ── Appointments List Content ────────────────────────────────────── */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xs border border-slate-200/80">
            <Loader2 className="w-9 h-9 animate-spin text-[#2160FF]" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          /* Professional Empty State */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-12 sm:p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#2160FF] flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
              <CalendarDays className="w-9 h-9" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">
              {appointments.length === 0 ? 'No appointments found' : 'No matching consultations found'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              {appointments.length === 0
                ? "You don't have any upcoming or past appointments. Our specialist doctors and OPD clinics are available for booking."
                : `No appointments match your filter "${activeTab}" or search term. Try resetting your search filters.`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {appointments.length > 0 && (
                <button
                  onClick={() => { setActiveTab('ALL'); setSearchQuery(''); }}
                  className="px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer bg-white"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => navigate('/patient/book')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2160FF] text-xs font-black text-white rounded-xl hover:bg-blue-600 transition cursor-pointer shadow-sm shadow-blue-500/20 border-none"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Book an Appointment</span>
              </button>
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAppointments.map((appt) => {
                const isUpcoming = isActiveStatus(appt.status);
                const isCompleted = isCompletedStatus(appt.status);
                const isTeleconsult = appt.appointmentType === 'TELECONSULTATION';

                const doctorFullName = appt.doctorName || (`Dr. ${appt.doctorFirstName || ''} ${appt.doctorLastName || ''}`.trim() || 'Attending Physician');

                const apptDateStr = appt.startTime 
                  ? format(new Date(appt.startTime), 'EEEE, MMMM d, yyyy')
                  : (appt.createdAt ? format(new Date(appt.createdAt), 'EEEE, MMMM d, yyyy') : 'Date scheduled');

                const apptTimeStr = appt.startTime
                  ? format(new Date(appt.startTime), 'hh:mm a')
                  : (appt.createdAt ? format(new Date(appt.createdAt), 'hh:mm a') : '09:00 AM');

                return (
                  <motion.div
                    key={appt.id}
                    variants={listStagger}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all p-5 sm:p-6 group flex flex-col lg:flex-row lg:items-center justify-between gap-5 overflow-hidden relative"
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${
                      isCompleted ? 'bg-emerald-500' : isUpcoming ? 'bg-[#2160FF]' : 'bg-rose-500'
                    }`} />

                    {/* Left: Doctor & Consultation Metadata */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#2160FF] border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 
                            onClick={() => setSelectedAppointment(appt)}
                            className="text-base sm:text-lg font-black text-slate-900 hover:text-[#2160FF] transition-colors cursor-pointer tracking-tight truncate"
                          >
                            {doctorFullName}
                          </h3>

                          {appt.appointmentNumber && (
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              #{appt.appointmentNumber}
                            </span>
                          )}

                          {appt.tokenNumber && (
                            <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              Token #{appt.tokenNumber}
                            </span>
                          )}

                          {getStatusBadge(appt.status)}
                        </div>

                        <p className="text-xs sm:text-[13px] text-slate-600 font-medium line-clamp-1">
                          {appt.reasonForVisit || appt.notes || 'General Clinical Consultation & Health Check'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-[#2160FF]" />
                            {apptDateStr}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {apptTimeStr} {appt.duration ? `(${appt.duration} mins)` : ''}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            {isTeleconsult ? (
                              <>
                                <Video className="w-3.5 h-3.5 text-purple-600" />
                                <span className="text-purple-700 font-bold">Virtual Telehealth</span>
                              </>
                            ) : (
                              <>
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>In-Clinic OPD</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                      {/* Teleconsult Join Video Call */}
                      {isTeleconsult && isUpcoming && (
                        <button
                          onClick={() => navigate('/patient/teleconsultations')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 transition shadow-2xs border-none cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video</span>
                        </button>
                      )}

                      {/* Reschedule Button */}
                      {isUpcoming && (
                        <button
                          onClick={() => navigate(`/patient/book/${appt.doctorId || ''}?rescheduleId=${appt.id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Reschedule</span>
                        </button>
                      )}

                      {/* Cancel Button */}
                      {isUpcoming && (
                        <button
                          onClick={() => setCancelModalAppointment(appt)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* Completed Options */}
                      {isCompleted && (
                        <>
                          <button
                            onClick={() => navigate('/patient/prescriptions')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Prescription</span>
                          </button>
                          <button
                            onClick={() => navigate(`/patient/book/${appt.doctorId || ''}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#2160FF] bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition cursor-pointer"
                          >
                            <span>Follow-Up</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedAppointment(appt)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                        title="View Full Appointment Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* ── Appointment Details Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Information"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Doctor</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedAppointment.doctorName || `Dr. ${selectedAppointment.doctorFirstName || ''} ${selectedAppointment.doctorLastName || ''}`.trim() || 'Doctor'}
                </span>
              </div>
              <div>{getStatusBadge(selectedAppointment.status)}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Visit</span>
              <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                {selectedAppointment.reasonForVisit || selectedAppointment.notes || 'Routine consultation and health assessment.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Date & Time</span>
                <span className="font-bold text-slate-900 block">
                  {selectedAppointment.startTime ? format(new Date(selectedAppointment.startTime), 'MMM d, yyyy') : 'Scheduled'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedAppointment.startTime ? format(new Date(selectedAppointment.startTime), 'hh:mm a') : '09:00 AM'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Identifiers</span>
                <span className="font-mono font-bold text-slate-900 block">
                  #{selectedAppointment.appointmentNumber || selectedAppointment.id}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Token: {selectedAppointment.tokenNumber ? `#${selectedAppointment.tokenNumber}` : 'Standard Queue'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Type</span>
                <span className="font-bold text-slate-900">
                  {selectedAppointment.appointmentType === 'TELECONSULTATION' ? 'Virtual Video Telehealth' : 'In-Person Hospital OPD'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-right">Payment</span>
                <span className="font-bold text-emerald-600 capitalize">
                  {selectedAppointment.paymentStatus || 'Covered / In-Clinic'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 font-medium text-[11px]">Appointment ID: {selectedAppointment.id}</span>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition border-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancellation Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={!!cancelModalAppointment}
        onClose={() => setCancelModalAppointment(null)}
        title="Cancel Appointment"
        size="sm"
      >
        {cancelModalAppointment && (
          <div className="space-y-4 font-sans text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-black text-slate-900">Are you sure you want to cancel?</h4>
              <p className="text-slate-500">
                You are cancelling your appointment with{' '}
                <span className="font-bold text-slate-800">
                  {cancelModalAppointment.doctorName || `Dr. ${cancelModalAppointment.doctorFirstName || ''} ${cancelModalAppointment.doctorLastName || ''}`.trim() || 'the doctor'}
                </span>
                . You can reschedule to another available slot anytime.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelModalAppointment(null)}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition border-none cursor-pointer disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelModalAppointment.id)}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-black hover:bg-rose-700 transition shadow-sm shadow-rose-200 border-none cursor-pointer disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  );
};

export default AppointmentHistory;
