import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { 
  Calendar as CalendarIcon, Clock, Activity, FileText, Pill, Users,
  UploadCloud, Plus, CheckCircle2, Bot, Search, ChevronRight, Video, ChevronLeft,
  Stethoscope, AlertCircle, ArrowUpRight, UserPlus, FileCheck, FlaskConical,
  LayoutGrid, RefreshCw, Heart, Settings as SettingsIcon, Zap, Loader2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModulePanel from '../../components/dashboard/ModulePanel';
import './DoctorDashboard.css';

// Import panels
import ConsultationQueue from './ConsultationQueue';
import DoctorCalendar from './DoctorCalendar';
import FollowUps from './FollowUps';
import PatientList from './PatientList';
import PatientDetail from './PatientDetail';
import NewAppointmentPanel from './NewAppointmentPanel';

// Color palette for calendar events
const EVENT_COLORS = [
  { bg: 'bg-green-50', border: 'border-green-500', name: 'text-green-900', type: 'text-green-700', time: 'text-green-600' },
  { bg: 'bg-orange-50', border: 'border-orange-500', name: 'text-orange-900', type: 'text-orange-700', time: 'text-orange-600' },
  { bg: 'bg-blue-50', border: 'border-blue-500', name: 'text-blue-900', type: 'text-blue-700', time: 'text-blue-600' },
  { bg: 'bg-purple-50', border: 'border-purple-500', name: 'text-purple-900', type: 'text-purple-700', time: 'text-purple-600' },
  { bg: 'bg-pink-50', border: 'border-pink-500', name: 'text-pink-900', type: 'text-pink-700', time: 'text-pink-600' },
  { bg: 'bg-[#EFF4FF]', border: 'border-indigo-500', name: 'text-indigo-900', type: 'text-[#2B4AFE]', time: 'text-[#2B4AFE]' },
  { bg: 'bg-teal-50', border: 'border-teal-500', name: 'text-teal-900', type: 'text-teal-700', time: 'text-teal-600' },
  { bg: 'bg-amber-50', border: 'border-amber-500', name: 'text-amber-900', type: 'text-amber-700', time: 'text-amber-600' },
];

const LAB_ICON_COLORS = [
  { bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { bgColor: 'bg-red-50', textColor: 'text-red-600' },
  { bgColor: 'bg-green-50', textColor: 'text-green-600' },
  { bgColor: 'bg-[#EFF4FF]', textColor: 'text-[#2B4AFE]' },
];

const STATUS_MAP = {
  COMPLETED: { label: 'Seen', style: 'bg-green-50 text-green-600' },
  CHECKED_IN: { label: 'In OPD', style: 'bg-blue-50 text-blue-600' },
  IN_PROGRESS: { label: 'In OPD', style: 'bg-blue-50 text-blue-600' },
  SCHEDULED: { label: 'Waiting', style: 'bg-orange-50 text-orange-600' },
  CONFIRMED: { label: 'Waiting', style: 'bg-orange-50 text-orange-600' },
  CANCELLED: { label: 'Cancelled', style: 'bg-red-50 text-red-600' },
  NO_SHOW: { label: 'No Show', style: 'bg-slate-50 text-slate-600' },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
};

const DoctorDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentPanel = searchParams.get('panel');
  const patientId = searchParams.get('patientId');

  const closePanel = () => setSearchParams(new URLSearchParams());
  const closeTopPanel = () => {
    if (patientId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('patientId');
      setSearchParams(newParams);
    } else {
      closePanel();
    }
  };

  // ─── API: Today's appointments (used for OP Patients, Calendar, Next Appointment) ───
  const { data: todayAppointments = [], isLoading: loadingToday } = useQuery({
      queryKey: ['doctor-today-appointments'],
      queryFn: async () => {
          const start = new Date(); start.setHours(0,0,0,0);
          const end = new Date(); end.setHours(23,59,59,999);
          const res = await axiosPrivate.get(`/appointments/today?start=${start.toISOString()}&end=${end.toISOString()}`);
          return res.data;
      },
      enabled: !!user?.id,
      refetchInterval: 30000,
      staleTime: 60000,
  });

  // ─── API: All doctor appointments (used for New Appointments - future ones) ───
  const { data: allAppointments = [], isLoading: loadingAll } = useQuery({
    queryKey: ['doctorAllAppointments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get('/appointments/doctor/me');
      return res.data;
    },
    enabled: !!user?.id,
  });

  const { data: labRequests = [], isLoading: loadingLab } = useQuery({
    queryKey: ['doctorLabRequests'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/doctor/my-requests');
      return res.data;
    },
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();

  // Subscribe to real-time appointment updates
  useEffect(() => {
      if (!token) return;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const evtSource = new EventSource(`${baseUrl.replace('/api', '')}/api/sse/appointments?token=${token}`);
      
      evtSource.addEventListener('appointment-booked', (event) => {
          try {
              const data = JSON.parse(event.data);
              // If the booked appointment is for this doctor, invalidate their queries
              if (String(data.doctorId) === String(user?.id)) {
                  queryClient.invalidateQueries(['doctor-today-appointments']);
                  queryClient.invalidateQueries(['doctorAllAppointments', user?.id]);
              }
          } catch (err) {
              console.error("Failed to parse SSE message", err);
          }
      });
      
      evtSource.addEventListener('appointment-cancelled', (event) => {
          try {
              const data = JSON.parse(event.data);
              if (String(data.doctorId) === String(user?.id)) {
                  queryClient.invalidateQueries(['doctor-today-appointments']);
                  queryClient.invalidateQueries(['doctorAllAppointments', user?.id]);
                  queryClient.invalidateQueries(['doctor-queue']);
              }
          } catch (err) {
              console.error("Failed to parse SSE message", err);
          }
      });

      evtSource.addEventListener('appointment-status-changed', (event) => {
          try {
              const data = JSON.parse(event.data);
              if (String(data.doctorId) === String(user?.id)) {
                  queryClient.invalidateQueries(['doctor-today-appointments']);
                  queryClient.invalidateQueries(['doctorAllAppointments', user?.id]);
                  queryClient.invalidateQueries(['doctor-queue']);
              }
          } catch (err) {
              console.error("Failed to parse SSE message", err);
          }
      });

      return () => evtSource.close();
  }, [user?.id, queryClient, token]);

  const handlePatientClick = (id) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('panel', 'patients');
    newParams.set('patientId', id);
    setSearchParams(newParams);
  };

  // ─── Derived: Nurse OP Patients (today's appointments) ───
  const opPatients = useMemo(() => {
    return todayAppointments.slice(0, 5).map((apt, i) => {
      const statusInfo = STATUS_MAP[apt.status] || STATUS_MAP.SCHEDULED;
      return {
        id: apt.id,
        token: `${101 + i}`,
        name: `${apt.patientFirstName || ''} ${apt.patientLastName || ''}`.trim() || 'Unknown',
        time: formatTime(apt.startTime),
        status: statusInfo.label,
        statusStyle: statusInfo.style,
      };
    });
  }, [todayAppointments]);

  // ─── Derived: New Appointments (upcoming SCHEDULED ones) ───
  const newAppointmentsList = useMemo(() => {
    const now = new Date();
    const upcoming = allAppointments
      .filter(apt => apt.status === 'SCHEDULED' && new Date(apt.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return upcoming.slice(0, 5).map((apt, i) => ({
      opNo: `${101 + i}`,
      token: `A-${String(i + 1).padStart(3, '0')}`,
      name: `${apt.patientFirstName || ''} ${apt.patientLastName || ''}`.trim() || 'Unknown',
      time: formatTime(apt.startTime),
      status: apt.status === 'SCHEDULED' ? 'New' : apt.status,
    }));
  }, [allAppointments]);

  // ─── Derived: Next Appointment ───
  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = todayAppointments
      .filter(apt => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && new Date(apt.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return upcoming[0] || todayAppointments.find(apt => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED') || null;
  }, [todayAppointments]);

  // ─── Derived: Calendar events from today's appointments ───
  const calendarEvents = useMemo(() => {
    return todayAppointments.map((apt, i) => {
      const start = new Date(apt.startTime);
      const end = new Date(apt.endTime);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const topOffset = (startHour - 8) * 56; // 56px per hour slot (h-14)
      const height = (endHour - startHour) * 56;
      const color = EVENT_COLORS[i % EVENT_COLORS.length];
      return {
        id: apt.id,
        name: `${apt.patientFirstName || ''} ${apt.patientLastName || ''}`.trim() || 'Unknown',
        type: apt.reasonForVisit || 'Consultation',
        startTime: formatTime(apt.startTime),
        endTime: formatTime(apt.endTime),
        top: Math.max(0, topOffset),
        height: Math.max(40, height),
        color,
      };
    });
  }, [todayAppointments]);

  // ─── Derived: Lab reports for display ───
  const labReports = useMemo(() => {
    return labRequests.slice(0, 5).map((req, i) => {
      const colors = LAB_ICON_COLORS[i % LAB_ICON_COLORS.length];
      const patientName = req.patient
        ? `${req.patient.firstName || ''} ${req.patient.lastName || ''}`.trim()
        : 'Unknown';
      const testName = req.testCatalog?.testName || 'Lab Test';
      return {
        name: patientName,
        test: testName,
        time: formatRelativeTime(req.requestedAt),
        status: req.status,
        ...colors,
      };
    });
  }, [labRequests]);

  // ─── Derived: Current time indicator position ───
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentTimeTop = (currentHour - 8) * 56;
  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ─── Derived: Today's date for calendar header ───
  const todayDate = now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  // ─── Next appointment date parts ───
  const nextAptDate = nextAppointment ? new Date(nextAppointment.startTime) : null;
  const nextAptMonth = nextAptDate?.toLocaleDateString([], { month: 'short' }) || '';
  const nextAptDay = nextAptDate?.getDate() || '';
  const nextAptWeekday = nextAptDate?.toLocaleDateString([], { weekday: 'short' }) || '';

  const EmptyState = ({ text }) => (
    <div className="flex items-center justify-center py-6 text-slate-400 text-[11px]">{text}</div>
  );

  const Loading = () => (
    <div className="flex items-center justify-center py-6 text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );

  return (
    
    <div className="doctor-dashboard-root">
      <main className="doctor-dashboard-main">
        {/* BEGIN: QuickActionsBar */}
        <section className="quick-actions-bar">
          <div onClick={() => setSearchParams({ panel: 'calendar' })} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-[#EFF4FF] text-[#2B4AFE] rounded-lg">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-[#2B4AFE]">New Appointment</span>
          </div>

          <div onClick={() => setSearchParams({ panel: 'patients' })} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-green-700">Add Patient</span>
          </div>

          <div onClick={() => navigate('/doctor/prescription-templates')} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Pill className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-orange-700">New Prescription</span>
          </div>

          <div onClick={() => navigate('/doctor/lab-reports')} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-blue-700">Lab Request</span>
          </div>

          <div onClick={() => navigate('/doctor/lab-reports/upload')} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <UploadCloud className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-purple-700">Upload Report</span>
          </div>

          <div onClick={() => navigate('/doctor/medical-certificate')} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-amber-700">Medical Certificate</span>
          </div>

          <div onClick={() => setSearchParams({ panel: 'queue' })} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">Start Consultation</span>
          </div>

          <div onClick={() => setSearchParams({ panel: 'calendar' })} className="bg-white p-2.5 rounded-xl border border-slate-100 custom-shadow flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition">
            <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-violet-700">View Calendar</span>
          </div>
        </section>
        {/* END: QuickActionsBar */}

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* BEGIN: LeftColumn */}
          <div className="col-left">
            {/* Nurse OP Patients */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">Nurse OP Patients</h3>
                <button onClick={() => setSearchParams({ panel: 'queue' })} className="text-[10px] font-bold text-[#2B4AFE] uppercase">View All</button>
              </div>
              {loadingToday ? <Loading /> : opPatients.length === 0 ? <EmptyState text="No patients today" /> : (
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-400 font-medium">
                      <th className="text-left pb-2">Token</th>
                      <th className="text-left pb-2">Patient Name</th>
                      <th className="text-left pb-2">Time</th>
                      <th className="text-left pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 font-medium">
                    {opPatients.map((row) => (
                      <tr key={row.id || row.token} className="border-t border-slate-50">
                        <td className="py-2 font-semibold">{row.token}</td>
                        <td className="py-2 font-semibold">{row.name}</td>
                        <td className="py-2 text-slate-500">{row.time}</td>
                        <td className="py-2"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${row.statusStyle}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={() => setSearchParams({ panel: 'queue' })} className="w-full mt-3 py-1.5 bg-slate-50 text-[#2B4AFE] text-[11px] font-bold rounded-lg border border-slate-100 hover:bg-[#EFF4FF] transition">Go to Nurse Panel</button>
            </div>

            {/* Next Appointment */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">Next Appointment</h3>
                <button onClick={() => setSearchParams({ panel: 'calendar' })} className="text-[10px] font-bold text-[#2B4AFE] uppercase">View Calendar</button>
              </div>
              {loadingToday ? <Loading /> : !nextAppointment ? <EmptyState text="No upcoming appointments" /> : (
                <>
                  <div className="flex gap-3 items-start mb-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center min-w-[60px]">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{nextAptMonth}</p>
                      <p className="text-xl font-black text-slate-800">{nextAptDay}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{nextAptWeekday}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#2B4AFE] mb-0.5">
                        {formatTime(nextAppointment.startTime)} - {formatTime(nextAppointment.endTime)}
                      </p>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {nextAppointment.patientFirstName} {nextAppointment.patientLastName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-0.5">{nextAppointment.reasonForVisit || 'Consultation'}</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">ID: {nextAppointment.patientId}</p>
                    </div>
                  </div>
                  <button onClick={() => setSearchParams({ panel: 'queue' })} className="w-full py-2.5 bg-[#2B4AFE] hover:opacity-90 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition">
                    <Video className="w-4 h-4" />
                    Start Consultation
                  </button>
                </>
              )}
            </div>
          </div>
          {/* END: LeftColumn */}

          {/* BEGIN: MiddleColumn - Calendar */}
          <div className="col-center">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              {/* Calendar Header */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <button className="p-1 rounded-md border border-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <h2 className="text-sm font-bold text-slate-800">{todayDate}</h2>
                    <button className="p-1 rounded-md border border-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                  <button className="text-[10px] font-bold text-[#2B4AFE] px-2.5 py-1 bg-[#EFF4FF] rounded-md">Today</button>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button className="px-3 py-1 text-[10px] font-bold bg-white text-[#2B4AFE] rounded-md shadow-sm">Day</button>
                  <button className="px-3 py-1 text-[10px] font-bold text-slate-500">Week</button>
                  <button className="px-3 py-1 text-[10px] font-bold text-slate-500">Month</button>
                </div>
                <button className="p-1.5 text-slate-400">•••</button>
              </div>
              
              {/* Calendar Body */}
              <div className="calendar-body">
                <div className="grid grid-cols-[70px_1fr]" style={{ height: '560px' }}>
                  {/* Time Labels */}
                  <div className="border-r border-slate-100 flex flex-col">
                    {['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map((t) => (
                      <div key={t} className="h-14 flex items-start justify-center pt-1.5 text-[9px] font-bold text-slate-400">{t}</div>
                    ))}
                  </div>

                  {/* Appointments Layer */}
                  <div className="relative bg-[repeating-linear-gradient(to_bottom,transparent,transparent_55px,#f1f5f9_55px,#f1f5f9_56px)]">
                    {/* Current Time Indicator */}
                    {currentHour >= 8 && currentHour <= 18 && (
                      <div className="absolute left-0 w-full flex items-center z-10" style={{ top: `${currentTimeTop}px` }}>
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-r-md -ml-[70px] w-[70px] text-center">{currentTimeStr}</span>
                        <div className="flex-1 h-px bg-red-500"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                      </div>
                    )}
                    
                    {/* Dynamic events from API */}
                    {calendarEvents.map((evt, i) => (
                      <div
                        key={evt.id}
                        className={`absolute left-3 right-4 ${evt.color.bg} border-l-4 ${evt.color.border} rounded-r-md p-1.5 shadow-xs cursor-pointer`}
                        style={{ top: `${evt.top}px`, height: `${evt.height}px` }}
                      >
                        <p className={`text-[11px] font-bold ${evt.color.name} truncate`}>{evt.name}</p>
                        <p className={`text-[9px] ${evt.color.type} truncate`}>{evt.type}</p>
                        <p className={`text-[9px] font-semibold ${evt.color.time} mt-0.5`}>{evt.startTime} - {evt.endTime}</p>
                      </div>
                    ))}

                    {loadingToday && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                      </div>
                    )}

                    {!loadingToday && calendarEvents.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                        No appointments today
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END: MiddleColumn */}

          {/* BEGIN: RightColumn */}
          <div className="col-right">
            {/* New Appointments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">New Appointments</h3>
                <button onClick={() => setSearchParams({ panel: 'calendar' })} className="text-[10px] font-bold text-[#2B4AFE] uppercase">View Calendar</button>
              </div>
              {loadingAll ? <Loading /> : newAppointmentsList.length === 0 ? <EmptyState text="No new appointments" /> : (
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-400 font-medium border-b border-slate-50">
                      <th className="text-left pb-2">OP No.</th>
                      <th className="text-left pb-2">Token</th>
                      <th className="text-left pb-2">Patient Name</th>
                      <th className="text-left pb-2">Time</th>
                      <th className="text-left pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 font-medium">
                    {newAppointmentsList.map((apt) => (
                      <tr key={apt.token}>
                        <td className="py-2">{apt.opNo}</td>
                        <td className="py-2">{apt.token}</td>
                        <td className="py-2 font-bold">{apt.name}</td>
                        <td className="py-2 text-slate-500">{apt.time}</td>
                        <td className="py-2"><span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-600">{apt.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={() => setSearchParams({ panel: 'queue' })} className="w-full mt-3 py-1.5 bg-slate-50 text-[#2B4AFE] text-[11px] font-bold rounded-lg border border-slate-100 hover:bg-[#EFF4FF] transition">View All Appointments</button>
            </div>

            {/* Recent Lab Reports */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">Recent Lab Reports</h3>
                <button onClick={() => setSearchParams({ panel: 'patients' })} className="text-[10px] font-bold text-[#2B4AFE] uppercase">View All</button>
              </div>
              {loadingLab ? <Loading /> : labReports.length === 0 ? <EmptyState text="No lab reports" /> : (
                <div className="space-y-3">
                  {labReports.map((report, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 ${report.bgColor} ${report.textColor} rounded-lg flex items-center justify-center`}><FileText className="w-3.5 h-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{report.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{report.test}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[9px] font-medium text-slate-400">{report.time}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          report.status === 'RELEASED' ? 'bg-green-50 text-green-600' : 
                          report.status === 'RESULT_ENTERED' ? 'bg-blue-50 text-blue-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>{report.status === 'RELEASED' ? 'Ready' : report.status === 'RESULT_ENTERED' ? 'Result' : 'Pending'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setSearchParams({ panel: 'patients' })} className="w-full mt-3 py-1.5 bg-slate-50 text-[#2B4AFE] text-[11px] font-bold rounded-lg border border-slate-100 hover:bg-[#EFF4FF] transition">View All Lab Reports</button>
            </div>
          </div>
          {/* END: RightColumn */}
        </div>

      </main>

      {/* OVERLAY SYSTEM */}
      {currentPanel === 'queue' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Patient Queue" icon={Users} 
          variant="panel" colorHex="#4F46E5" stackIndex={0}
        >
          <ConsultationQueue />
        </ModulePanel>
      )}

      {currentPanel === 'calendar' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Calendar" icon={CalendarIcon} 
          variant="modal" colorHex="#4F46E5" stackIndex={0}
        >
          <DoctorCalendar />
        </ModulePanel>
      )}

      {currentPanel === 'follow-ups' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Follow-ups" icon={FileText} 
          variant="modal" colorHex="#4F46E5" stackIndex={0}
        >
          <FollowUps />
        </ModulePanel>
      )}

      {currentPanel === 'patients' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Patients" icon={Users} 
          variant="panel" colorHex="#4F46E5" 
          stackIndex={patientId ? 1 : 0}
        >
          <PatientList onPatientClick={handlePatientClick} />
        </ModulePanel>
      )}

      {currentPanel === 'patients' && patientId && (
        <ModulePanel 
          isOpen={true} onClose={closeTopPanel} 
          title="Patient Detail" icon={Users} 
          variant="panel" colorHex="#4F46E5" 
          stackIndex={0}
        >
          <PatientDetail patientIdOverride={patientId} />
        </ModulePanel>
      )}

      {currentPanel === 'new-appointment' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="New Appointment" icon={CalendarIcon} 
          variant="panel" colorHex="#4F46E5" stackIndex={0}
        >
          <NewAppointmentPanel onClose={closePanel} />
        </ModulePanel>
      )}
    </div>
    
  );
};

export default DoctorDashboard;
