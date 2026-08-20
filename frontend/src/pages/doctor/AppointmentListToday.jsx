import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';



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
  BOOKED:      { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  CONFIRMED:   { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  CHECKED_IN:  { label: 'In Progress', bg: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  COMPLETED:   { label: 'Completed',   bg: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  CANCELLED:   { label: 'Cancelled',   bg: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  NO_SHOW:     { label: 'No Show',     bg: 'bg-orange-50 text-orange-600', dot: 'bg-orange-500' },
  SCHEDULED:   { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' }
};

const TYPE_META = {
  'Consultation': { bg: 'bg-purple-50 text-purple-600' },
  'Follow-up':    { bg: 'bg-blue-50 text-blue-600' },
  'Lab Review':   { bg: 'bg-amber-50 text-amber-600' }
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-500' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${meta.bg} ${meta.bg.replace('bg-', 'border-').split(' ')[0]}`}>
      {meta.label}
    </span>
  );
};

// ── main component ────────────────────────────────────────────────────────────
const DoctorAppointments = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Appointments');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all appointments for the doctor
  const { data: allAppointments = [], isLoading, error } = useQuery({
    queryKey: ['doctorAllAppointments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get('/appointments/doctor/me');
      return res.data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Mutation: update status + navigate to clinical workspace encounter
  const startConsultationMutation = useMutation({
    mutationFn: async (appointment) => {
      // 1. Update status to IN_PROGRESS (check-in)
      await axiosPrivate.patch(`/appointments/${appointment.id}/status?status=IN_PROGRESS`);
      // 2. Create or fetch the encounter for this appointment
      const res = await axiosPrivate.post(`/v1/doctor/encounters`, {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
      }).catch(async () => {
        // If encounter already exists, fetch it
        return axiosPrivate.get(`/v1/doctor/encounters/by-appointment/${appointment.id}`);
      });
      return res.data;
    },
    onSuccess: (encounter) => {
      queryClient.invalidateQueries(['doctorAllAppointments']);
      navigate(`/doctor/consultation/${encounter.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to start consultation. Please try again.');
    }
  });

  const canStartConsultation = (status) => ['BOOKED', 'CONFIRMED', 'SCHEDULED', 'CHECKED_IN'].includes(status);

  // Calculate Stats
  const now = new Date();
  const todayStr = now.toDateString();
  
  const stats = useMemo(() => {
    let total = allAppointments.length;
    let todayCount = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;

    allAppointments.forEach(apt => {
      if (new Date(apt.startTime).toDateString() === todayStr) todayCount++;
      if (apt.status === 'COMPLETED') completed++;
      if (apt.status === 'CANCELLED') cancelled++;
      if (apt.status === 'NO_SHOW') noShow++;
    });

    return { total, todayCount, completed, cancelled, noShow };
  }, [allAppointments, todayStr]);

  // Filter appointments for the table
  const filteredAppointments = useMemo(() => {
    let filtered = [...allAppointments];
    
    if (activeTab === 'Upcoming') {
      filtered = filtered.filter(a => new Date(a.startTime) >= now && (a.status === 'SCHEDULED' || a.status === 'BOOKED' || a.status === 'CONFIRMED'));
    } else if (activeTab === 'Completed') {
      filtered = filtered.filter(a => a.status === 'COMPLETED');
    } else if (activeTab === 'Cancelled') {
      filtered = filtered.filter(a => a.status === 'CANCELLED');
    } else if (activeTab === 'No Show') {
      filtered = filtered.filter(a => a.status === 'NO_SHOW');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        const name = `${a.patientFirstName} ${a.patientLastName}`.toLowerCase();
        return name.includes(q) || (a.reasonForVisit && a.reasonForVisit.toLowerCase().includes(q));
      });
    }

    return filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [allAppointments, activeTab, searchQuery, now]);

  // Today's schedule for sidebar
  const todaysSchedule = useMemo(() => {
    return allAppointments
      .filter(a => new Date(a.startTime).toDateString() === todayStr)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 5);
  }, [allAppointments, todayStr]);

  const todayFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Appointments</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and schedule patient appointments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <CalendarIcon size={16} className="text-indigo-600" />
            {todayFormatted}
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Filter size={16} className="text-indigo-600" />
            Filter
            <ChevronRight size={16} className="text-slate-400 rotate-90" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {/* Total Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Total Appointments</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.total}</h3>
            <p className="text-[11px] font-semibold text-slate-400">All time</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CalendarDays size={24} />
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Today's Appointments</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.todayCount}</h3>
            <p className="text-[11px] font-semibold text-slate-400">Today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Completed</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.completed}</h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% completion` : 'No data'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Cancelled</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.cancelled}</h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {stats.total > 0 ? `${Math.round((stats.cancelled / stats.total) * 100)}% of total` : 'No data'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle size={24} />
          </div>
        </div>

        {/* No Show */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">No Show</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.noShow}</h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {stats.total > 0 ? `${Math.round((stats.noShow / stats.total) * 100)}% of total` : 'No data'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left content 75%, Right sidebar 25% */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-6 overflow-x-auto">
              {['All Appointments', 'Upcoming', 'Completed', 'Cancelled', 'No Show'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-semibold pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                />
              </div>
              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition shadow-sm">
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4 text-indigo-600" />
                <p>Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <CalendarIcon size={48} className="mb-4 text-slate-200" />
                <p className="text-slate-600 font-medium">No appointments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Time</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Patient</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Age / Gender</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Appointment Type</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Reason</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 text-center">Actions</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    className="divide-y divide-slate-50"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                    }}
                  >
                    {filteredAppointments.map((a) => {
                      const statusInfo = STATUS_META[a.status] || { label: a.status, dot: 'bg-slate-400' };
                      const type = a.appointmentType || 'Consultation';
                      const typeMeta = TYPE_META[type] || { bg: 'bg-purple-50 text-purple-600' };
                      
                      return (
                        <motion.tr 
                          key={a.id} 
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 }
                          }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${statusInfo.dot} shadow-sm`}></div>
                              <span className="text-sm font-bold text-slate-900">{formatTime(a.startTime)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                                {a.patientProfilePictureUrl ? (
                                  <img loading="lazy" src={a.patientProfilePictureUrl} alt="Patient" className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {a.patientFirstName} {a.patientLastName}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">#{a.patientId ? `PID${a.patientId.toString().substring(0,6)}` : 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm font-semibold text-slate-700">{a.patientAge || '—'} Years</p>
                            <p className="text-[11px] text-slate-500 font-medium">{a.patientGender || '—'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-sm ${typeMeta.bg} ${typeMeta.bg.replace('bg-', 'border-').split(' ')[0]}`}>
                              {type}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm font-semibold text-slate-700 max-w-[150px] truncate">
                              {a.reasonForVisit || 'Regular Checkup'}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/doctor/patients/${a.patientId}`)}
                                title="View Patient"
                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm rounded-lg transition-all border border-indigo-100"
                              >
                                <Eye size={16} />
                              </button>
                              {canStartConsultation(a.status) && (
                                <button
                                  onClick={() => startConsultationMutation.mutate(a)}
                                  disabled={startConsultationMutation.isPending}
                                  title="Start Consultation"
                                  className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-md rounded-lg transition-all disabled:opacity-50"
                                >
                                  {startConsultationMutation.isPending
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Stethoscope size={16} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Calendar Widget - real current month */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Calendar</h3>
              <span className="text-xs font-bold text-slate-600">
                {now.toLocaleString('en', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {(() => {
                const year = now.getFullYear();
                const month = now.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells = [];
                // Leading blanks
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`b-${i}`} />);
                }
                // Days
                for (let d = 1; d <= daysInMonth; d++) {
                  const isToday = d === now.getDate();
                  const hasAppt = allAppointments.some(a => {
                    const ad = new Date(a.startTime);
                    return ad.getFullYear() === year && ad.getMonth() === month && ad.getDate() === d;
                  });
                  cells.push(
                    <button key={d} className={`h-8 w-8 rounded-full text-xs font-semibold mx-auto flex items-center justify-center transition-colors relative
                      ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-700 hover:bg-slate-100'}`}>
                      {d}
                      {hasAppt && !isToday && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                      )}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900">Today's Schedule</h3>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
            </div>

            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {todaysSchedule.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-4">No appointments today</div>
              ) : (
                todaysSchedule.map((a, i) => {
                  const statusInfo = STATUS_META[a.status] || { dot: 'bg-slate-400', bg: 'bg-slate-50 text-slate-600' };
                  return (
                    <div key={i} className="relative flex items-start gap-4 mb-5 group">
                      <div className="flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-white shadow-sm mt-1 z-10">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`}></div>
                      </div>
                      
                      <div className="w-full flex justify-between items-start pt-0.5">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{formatTime(a.startTime)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{a.patientFirstName} {a.patientLastName}</p>
                          <p className="text-[11px] text-slate-500 font-medium mb-1">{a.appointmentType || 'Consultation'}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Appointment Statistics — computed from real data */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900">Appointment Statistics</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                <CalendarDays size={18} className="text-purple-600 mb-2" />
                <p className="text-[10px] font-bold text-purple-900/60 mb-0.5">Total</p>
                <h4 className="text-xl font-bold text-purple-900">{stats.total}</h4>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <CheckCircle2 size={18} className="text-emerald-600 mb-2" />
                <p className="text-[10px] font-bold text-emerald-900/60 mb-0.5">Completed</p>
                <h4 className="text-xl font-bold text-emerald-900">{stats.completed}</h4>
              </div>

              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <XCircle size={18} className="text-red-600 mb-2" />
                <p className="text-[10px] font-bold text-red-900/60 mb-0.5">Cancelled</p>
                <h4 className="text-xl font-bold text-red-900">{stats.cancelled}</h4>
              </div>

              <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                <FileText size={18} className="text-orange-600 mb-2" />
                <p className="text-[10px] font-bold text-orange-900/60 mb-0.5">No Show</p>
                <h4 className="text-xl font-bold text-orange-900">{stats.noShow}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
