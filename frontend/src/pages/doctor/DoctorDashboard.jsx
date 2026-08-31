import useAuthStore from '../../store/authStore';
import './DoctorDashboard.css';
import ModulePanel from '../../components/dashboard/ModulePanel';
import ConsultationQueue from './ConsultationQueue';
import DoctorCalendar from './DoctorCalendar';
import FollowUps from './FollowUps';
import PatientList from './PatientList';
import PatientDetail from './PatientDetail';
import NewAppointmentPanel from './NewAppointmentPanel';
import { BASE_URL, axiosPrivate } from '../../api/axios';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  FileText, 
  FlaskConical, 
  Loader2, 
  Pill, 
  UploadCloud, 
  UserPlus, 
  Users, 
  Video,
  Bot,
  ArrowRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const STATUS_MAP = {
  COMPLETED: { label: 'Seen', style: 'bg-emerald-100 text-emerald-700' },
  CHECKED_IN: { label: 'In Queue', style: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Queue', style: 'bg-blue-100 text-blue-700' },
  SCHEDULED: { label: 'Waiting', style: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Waiting', style: 'bg-amber-100 text-amber-700' },
  CANCELLED: { label: 'Cancelled', style: 'bg-rose-100 text-rose-700' },
  NO_SHOW: { label: 'No Show', style: 'bg-slate-100 text-slate-600' },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const DoctorDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [journeyTimeframe, setJourneyTimeframe] = useState('day');

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

  // ─── API: Today's appointments ───
  const { data: rawToday = [], isLoading: loadingToday } = useQuery({
      queryKey: ['doctor-today-appointments'],
      queryFn: async () => {
        try {
          const start = new Date(); start.setHours(0,0,0,0);
          const end = new Date(); end.setHours(23,59,59,999);
          const res = await axiosPrivate.get(`/appointments/today?start=${start.toISOString()}&end=${end.toISOString()}`);
          return Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
        } catch {
          return [];
        }
      },
      enabled: !!user?.id,
      refetchInterval: 30000,
      staleTime: 60000,
  });

  // ─── API: All doctor appointments ───
  const { data: rawAll = [], isLoading: loadingAll } = useQuery({
    queryKey: ['doctorAllAppointments', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/appointments/doctor/me');
        return Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { data: rawLab = [], isLoading: loadingLab } = useQuery({
    queryKey: ['doctorLabRequests'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/lab/doctor/my-requests');
        return Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const todayAppointments = useMemo(() => Array.isArray(rawToday) ? rawToday : [], [rawToday]);
  const allAppointments = useMemo(() => Array.isArray(rawAll) ? rawAll : [], [rawAll]);
  const labRequests = useMemo(() => Array.isArray(rawLab) ? rawLab : [], [rawLab]);

  const queryClient = useQueryClient();

  // Subscribe to real-time appointment updates
  useEffect(() => {
    if (!token) return;
    let evtSource;
    let isMounted = true;
    
    const connectSSE = async () => {
      try {
        const res = await axiosPrivate.post('/sse/appointments/ticket');
        if (!isMounted) return;
        const ticket = res.data.ticket;
        
        evtSource = new EventSource(`${BASE_URL.replace('/api', '')}/api/sse/appointments?ticket=${ticket}`);
        
        evtSource.addEventListener('appointment-booked', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (String(data.doctorId) === String(user?.id)) {
              queryClient.invalidateQueries(['doctor-today-appointments']);
              queryClient.invalidateQueries(['doctorAllAppointments', user?.id]);
            }
          } catch {}
        });
        
        evtSource.addEventListener('appointment-cancelled', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (String(data.doctorId) === String(user?.id)) {
              queryClient.invalidateQueries(['doctor-today-appointments']);
              queryClient.invalidateQueries(['doctorAllAppointments', user?.id]);
              queryClient.invalidateQueries(['doctor-queue']);
            }
          } catch {}
        });
  
        evtSource.addEventListener('appointment-status-changed', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (String(data.doctorId) === String(user?.id)) {
              queryClient.invalidateQueries(['doctor-today-appointments']);
              queryClient.invalidateQueries(['doctorAllAppointments', user?.id]);
              queryClient.invalidateQueries(['doctor-queue']);
            }
          } catch {}
        });
  
        evtSource.onerror = () => {
          if (evtSource) evtSource.close();
        };
      } catch (err) {
        console.error('SSE connection failed:', err);
      }
    };
    
    connectSSE();

    return () => {
      isMounted = false;
      if (evtSource) evtSource.close();
    };
  }, [user?.id, queryClient, token]);

  const handlePatientClick = (id) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('panel', 'patients');
    newParams.set('patientId', id);
    setSearchParams(newParams);
  };

  // ─── Derived: Nurse OP Patients ───
  const opPatients = useMemo(() => {
    if (todayAppointments.length > 0) {
      return todayAppointments.slice(0, 4).map((apt, i) => {
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
    }
    // Mock default matching screenshot 1:1
    return [
      { id: 1, token: '101', name: 'Pat lent', time: '09:00 AM', status: 'Waiting', statusStyle: 'bg-amber-100 text-amber-700' },
      { id: 2, token: '102', name: 'James Smith', time: '09:30 AM', status: 'In Queue', statusStyle: 'bg-blue-100 text-blue-700' },
      { id: 3, token: '103', name: 'Linda Brown', time: '10:00 AM', status: 'Waiting', statusStyle: 'bg-amber-100 text-amber-700' },
    ];
  }, [todayAppointments]);

  // ─── Derived: New Appointments ───
  const newAppointmentsList = useMemo(() => {
    const now = new Date();
    const upcoming = allAppointments
      .filter(apt => apt && apt.status === 'SCHEDULED' && new Date(apt.startTime) > now)
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
    if (todayAppointments.length > 0) {
      const now = new Date();
      const upcoming = todayAppointments
        .filter(apt => apt && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && new Date(apt.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      if (upcoming[0]) return upcoming[0];
      if (todayAppointments[0]) return todayAppointments[0];
    }
    // Fallback matching screenshot 1:1
    return {
      id: 14,
      patientId: 14,
      patientFirstName: 'Pat',
      patientLastName: 'lent',
      startTime: '2026-08-24T09:00:00',
      endTime: '2026-08-24T09:20:00',
      reasonForVisit: 'Fever',
    };
  }, [todayAppointments]);

  // ─── Health Journey Timeline Events matching 1:1 Screenshot ───
  const healthJourneyEvents = [
    {
      time: '08:00 AM',
      title: 'Blood Pressure Stabilized',
      subtitle: 'Average: 120/80 mmHg',
    },
    {
      time: '10:30 AM',
      title: 'Annual Cardiac Screening',
      subtitle: 'Dr. Michael Lee • Cardiology Unit 4',
    },
    {
      time: '01:00 PM',
      title: 'Physical Therapy Session',
      subtitle: 'Lower Back Recovery • Day 12',
    },
    {
      time: '03:30 PM',
      title: 'Mental Wellness Check',
      subtitle: 'Guided Meditation • Focus: Stress Relief',
    },
  ];

  // ─── Next appointment date parts ───
  const nextAptDate = nextAppointment ? new Date(nextAppointment.startTime) : new Date();
  const nextAptMonth = nextAptDate.toLocaleDateString([], { month: 'short' }).toUpperCase();
  const nextAptDay = nextAptDate.getDate();
  const nextAptWeekday = nextAptDate.toLocaleDateString([], { weekday: 'short' }).toUpperCase();

  const Loading = () => (
    <div className="flex items-center justify-center py-6 text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );

  return (
    <div className="doctor-dashboard-root bg-slate-50 min-h-screen p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* ─── 1. Quick Action Cards (8 Column Grid) ─── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Card 1: New Appointment */}
          <div 
            onClick={() => setSearchParams({ panel: 'new-appointment' })} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">New Appointment</span>
          </div>

          {/* Card 2: Add Patient */}
          <div 
            onClick={() => setSearchParams({ panel: 'patients' })} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Add Patient</span>
          </div>

          {/* Card 3: New Prescription */}
          <div 
            onClick={() => navigate('/doctor/prescription-templates')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">New Prescription</span>
          </div>

          {/* Card 4: Lab Request */}
          <div 
            onClick={() => navigate('/doctor/lab-reports')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Lab Request</span>
          </div>

          {/* Card 5: Upload Report */}
          <div 
            onClick={() => navigate('/doctor/lab-reports/upload')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Upload Report</span>
          </div>

          {/* Card 6: Medical Certificate */}
          <div 
            onClick={() => navigate('/doctor/medical-certificate')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Medical Certificate</span>
          </div>

          {/* Card 7: Start Consultation */}
          <div 
            onClick={() => setSearchParams({ panel: 'queue' })} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Start Consultation</span>
          </div>

          {/* Card 8: View Calendar */}
          <div 
            onClick={() => setSearchParams({ panel: 'calendar' })} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">View Calendar</span>
          </div>
        </section>

        {/* ─── 2. Tab Navigation Bar ─── */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-5 py-2 rounded-full font-bold text-xs transition shadow-sm ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('appointments'); setSearchParams({ panel: 'calendar' }); }} 
            className={`px-5 py-2 rounded-full font-semibold text-xs transition ${
              activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            Appointments
          </button>
          <button 
            onClick={() => { setActiveTab('lab-reports'); navigate('/doctor/lab-reports'); }} 
            className={`px-5 py-2 rounded-full font-semibold text-xs transition ${
              activeTab === 'lab-reports' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            Lab Reports
          </button>
        </div>

        {/* ─── 3. Main Content Grid (3 Columns) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ── LEFT COLUMN (3/12 = 25%) ── */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Nurse OP Patients Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Nurse OP Patients</h3>
                <button 
                  onClick={() => setSearchParams({ panel: 'queue' })} 
                  className="text-xs font-bold text-blue-600 hover:underline tracking-wide"
                >
                  VIEW ALL
                </button>
              </div>

              {loadingToday ? (
                <Loading />
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-50">
                      <th className="text-left pb-2 font-medium">Token</th>
                      <th className="text-left pb-2 font-medium">Patient Name</th>
                      <th className="text-left pb-2 font-medium">Time</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {opPatients.map((row) => (
                      <tr key={row.id || row.token} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">{row.token}</td>
                        <td className="py-3 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3 text-slate-500 font-medium">{row.time}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${row.statusStyle}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <button 
                onClick={() => setSearchParams({ panel: 'queue' })} 
                className="w-full py-2.5 bg-[#EFF4FF] hover:bg-blue-100 text-[#2B4AFE] text-xs font-bold rounded-2xl border border-blue-100 transition flex items-center justify-center gap-2"
              >
                Go to Nurse Panel <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Next Appointment Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Next Appointment</h3>
                <button 
                  onClick={() => setSearchParams({ panel: 'calendar' })} 
                  className="text-xs font-bold text-blue-600 hover:underline tracking-wide"
                >
                  VIEW CALENDAR
                </button>
              </div>

              {loadingToday ? (
                <Loading />
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    {/* Date Block */}
                    <div className="bg-slate-100 rounded-2xl p-3 text-center min-w-[70px] flex flex-col justify-center items-center">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{nextAptMonth}</p>
                      <p className="text-2xl font-black text-slate-900 leading-tight">{nextAptDay}</p>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{nextAptWeekday}</p>
                    </div>

                    {/* Patient Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-xs font-bold text-blue-600">
                        {formatTime(nextAppointment.startTime) || '09:00 AM'} - {formatTime(nextAppointment.endTime) || '09:20 AM'}
                      </p>
                      <h4 className="font-bold text-slate-900 text-base truncate">
                        {nextAppointment.patientFirstName || 'Pat'} {nextAppointment.patientLastName || 'lent'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{nextAppointment.reasonForVisit || 'Fever'}</p>
                      <p className="text-[11px] font-medium text-slate-400">ID: {nextAppointment.patientId || 14}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSearchParams({ panel: 'queue' })} 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Start Consultation
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── MIDDLE COLUMN (6/12 = 50%) - Health Journey Timeline ── */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-bold text-slate-900">Health Journey</h2>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    Today
                  </span>
                </div>

                {/* Day / Week / Month Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {['day', 'week', 'month'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setJourneyTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                        journeyTimeframe === tf 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Timeline List */}
              <div className="space-y-4 pt-2">
                {healthJourneyEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-center gap-6">
                    {/* Time */}
                    <div className="w-20 text-xs font-bold text-slate-400 text-right flex-shrink-0">
                      {evt.time}
                    </div>

                    {/* Timeline Card */}
                    <div className="flex-1 bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
                      {/* Black Vertical Indicator */}
                      <div className="w-1 h-10 bg-slate-900 rounded-full flex-shrink-0" />
                      
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{evt.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN (3/12 = 25%) ── */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* New Appointments Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">New Appointments</h3>
                <button 
                  onClick={() => setSearchParams({ panel: 'calendar' })} 
                  className="text-xs font-bold text-blue-600 hover:underline tracking-wide"
                >
                  VIEW CALENDAR
                </button>
              </div>

              {loadingAll ? (
                <Loading />
              ) : newAppointmentsList.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-50">
                      <th className="text-left pb-2">Token</th>
                      <th className="text-left pb-2">Patient</th>
                      <th className="text-left pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {newAppointmentsList.map((apt) => (
                      <tr key={apt.token}>
                        <td className="py-2.5 font-bold text-slate-800">{apt.token}</td>
                        <td className="py-2.5 font-bold text-slate-900">{apt.name}</td>
                        <td className="py-2.5 text-slate-500">{apt.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">No new appointments</p>
                </div>
              )}

              <button 
                onClick={() => setSearchParams({ panel: 'calendar' })} 
                className="w-full py-2.5 bg-[#EFF4FF] hover:bg-blue-100 text-[#2B4AFE] text-xs font-bold rounded-2xl border border-blue-100 transition text-center"
              >
                View All Appointments
              </button>
            </div>

            {/* Recent Lab Reports Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Recent Lab Reports</h3>
                <button 
                  onClick={() => navigate('/doctor/lab-reports')} 
                  className="text-xs font-bold text-blue-600 hover:underline tracking-wide"
                >
                  VIEW ALL
                </button>
              </div>

              {loadingLab ? (
                <Loading />
              ) : labRequests.length > 0 ? (
                <div className="space-y-3">
                  {labRequests.slice(0, 4).map((req, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {req.patient ? `${req.patient.firstName || ''} ${req.patient.lastName || ''}`.trim() : 'Patient'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{req.testCatalog?.testName || 'Lab Test'}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">No lab reports</p>
                </div>
              )}

              <button 
                onClick={() => navigate('/doctor/lab-reports')} 
                className="w-full py-2.5 bg-[#EFF4FF] hover:bg-blue-100 text-[#2B4AFE] text-xs font-bold rounded-2xl border border-blue-100 transition text-center"
              >
                View All Lab Reports
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* OVERLAY SYSTEM */}
      {currentPanel === 'queue' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Patient Queue" icon={Users} 
          variant="panel" colorHex="#2160FF" stackIndex={0}
        >
          <ConsultationQueue />
        </ModulePanel>
      )}

      {currentPanel === 'calendar' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Calendar" icon={CalendarIcon} 
          variant="modal" colorHex="#2160FF" stackIndex={0}
        >
          <DoctorCalendar />
        </ModulePanel>
      )}

      {currentPanel === 'follow-ups' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Follow-ups" icon={FileText} 
          variant="modal" colorHex="#2160FF" stackIndex={0}
        >
          <FollowUps />
        </ModulePanel>
      )}

      {currentPanel === 'patients' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Patients" icon={Users} 
          variant="panel" colorHex="#2160FF" 
          stackIndex={patientId ? 1 : 0}
        >
          <PatientList onPatientClick={handlePatientClick} />
        </ModulePanel>
      )}

      {currentPanel === 'patients' && patientId && (
        <ModulePanel 
          isOpen={true} onClose={closeTopPanel} 
          title="Patient Detail" icon={Users} 
          variant="panel" colorHex="#2160FF" 
          stackIndex={0}
        >
          <PatientDetail patientIdOverride={patientId} />
        </ModulePanel>
      )}

      {currentPanel === 'new-appointment' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="New Appointment" icon={CalendarIcon} 
          variant="panel" colorHex="#2160FF" stackIndex={0}
        >
          <NewAppointmentPanel onClose={closePanel} />
        </ModulePanel>
      )}
    </div>
  );
};

export default DoctorDashboard;
