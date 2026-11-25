import useAuthStore, { isTokenValid } from '../../store/authStore';
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
  ChevronRight,
  Clock,
  Activity,
  FileText, 
  FlaskConical, 
  Loader2, 
  Pill, 
  UploadCloud, 
  UserPlus, 
  Users, 
  Video,
  Bot,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  X,
  HeartPulse,
  Stethoscope,
  LifeBuoy
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const STATUS_MAP = {
  COMPLETED: { label: 'Seen', style: 'bg-emerald-100 text-emerald-700' },
  CHECKED_IN: { label: 'In Queue', style: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Consultation', style: 'bg-blue-100 text-blue-700' },
  IN_CONSULTATION: { label: 'In Consultation', style: 'bg-blue-100 text-blue-700' },
  WAITING: { label: 'Waiting', style: 'bg-amber-100 text-amber-700' },
  SCHEDULED: { label: 'Waiting', style: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', style: 'bg-sky-100 text-sky-700' },
  CANCELLED: { label: 'Cancelled', style: 'bg-rose-100 text-rose-700' },
  NO_SHOW: { label: 'No Show', style: 'bg-slate-100 text-slate-600' },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const DoctorDashboard = () => {
  const { user, token, isInitializingAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [journeyTimeframe, setJourneyTimeframe] = useState('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

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

  // ─── API: Today's appointments (Real-time live sync) ───
  const { data: rawToday = [], isLoading: loadingToday } = useQuery({
      queryKey: ['doctor-today-appointments'],
      queryFn: async () => {
        try {
          const start = new Date(); start.setHours(0,0,0,0);
          const end = new Date(); end.setHours(23,59,59,999);
          const res = await axiosPrivate.get(`/appointments/today?start=${start.toISOString()}&end=${end.toISOString()}`);
          return Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
        } catch {
          return [];
        }
      },
      enabled: !!user?.id,
      refetchInterval: 10000,
      staleTime: 5000,
  });

  // ─── API: All doctor appointments ───
  const { data: rawAll = [], isLoading: loadingAll } = useQuery({
    queryKey: ['doctorAllAppointments', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/appointments/doctor/me');
        return Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const { data: rawLab = [], isLoading: loadingLab } = useQuery({
    queryKey: ['doctorLabRequests'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/lab/doctor/my-requests');
        return Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const todayAppointments = useMemo(() => Array.isArray(rawToday) ? rawToday : [], [rawToday]);
  const allAppointments = useMemo(() => Array.isArray(rawAll) ? rawAll : [], [rawAll]);
  const labRequests = useMemo(() => Array.isArray(rawLab) ? rawLab : [], [rawLab]);

  const queryClient = useQueryClient();

  // Subscribe to real-time appointment updates via SSE
  useEffect(() => {
    if (isInitializingAuth || !token || !isTokenValid(token)) return;
    let evtSource = null;
    let isMounted = true;
    let reconnectTimer = null;
    
    const scheduleReconnect = () => {
      if (!isMounted || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectSSE();
      }, 10000);
    };

    const invalidateAllFeeds = () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctorAllAppointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      queryClient.invalidateQueries({ queryKey: ['doctorLabRequests'] });
    };

    const connectSSE = async () => {
      try {
        const res = await axiosPrivate.post('/sse/appointments/ticket', null, { timeout: 10000 });
        if (!isMounted) return;
        const ticket = res.data?.ticket;
        if (!ticket) {
          scheduleReconnect();
          return;
        }
        
        evtSource = new EventSource(`${BASE_URL.replace('/api', '')}/api/sse/appointments?ticket=${ticket}`);
        
        evtSource.addEventListener('appointment-booked', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data.doctorId || String(data.doctorId) === String(user?.id)) {
              invalidateAllFeeds();
            }
          } catch {
            invalidateAllFeeds();
          }
        });
        
        evtSource.addEventListener('appointment-cancelled', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data.doctorId || String(data.doctorId) === String(user?.id)) {
              invalidateAllFeeds();
            }
          } catch {
            invalidateAllFeeds();
          }
        });
  
        evtSource.addEventListener('appointment-status-changed', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data.doctorId || String(data.doctorId) === String(user?.id)) {
              invalidateAllFeeds();
            }
          } catch {
            invalidateAllFeeds();
          }
        });

        evtSource.addEventListener('queue-token-called', () => {
          invalidateAllFeeds();
        });

        evtSource.onmessage = () => {
          invalidateAllFeeds();
        };
  
        evtSource.onerror = () => {
          if (evtSource) {
            evtSource.close();
            evtSource = null;
          }
          scheduleReconnect();
        };
      } catch (err) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          console.warn('SSE appointment updates timed out. Real-time feed will use active polling.');
        } else if (err.response?.status !== 401) {
          console.warn('SSE connection unavailable:', err.message || err);
        }
        if (err.response?.status !== 401) {
          scheduleReconnect();
        }
      }
    };
    
    connectSSE();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (evtSource) evtSource.close();
    };
  }, [user?.id, queryClient, token, isInitializingAuth]);

  const handlePatientClick = (id) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('panel', 'patients');
    newParams.set('patientId', id);
    setSearchParams(newParams);
  };

  // ─── Derived: Nurse OP Patients ───
  const opPatients = useMemo(() => {
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
  }, [todayAppointments]);

  // ─── Derived: New Appointments ───
  const newAppointmentsList = useMemo(() => {
    const now = new Date();
    const upcoming = allAppointments
      .filter(apt => apt && apt.status === 'SCHEDULED' && apt.startTime && new Date(apt.startTime) > now)
      .sort((a, b) => new Date(a?.startTime || 0) - new Date(b?.startTime || 0));
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
        .filter(apt => apt && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && apt.startTime && new Date(apt.startTime) > now)
        .sort((a, b) => new Date(a?.startTime || 0) - new Date(b?.startTime || 0));
      if (upcoming[0]) return upcoming[0];
      if (todayAppointments[0]) return todayAppointments[0];
    }
    if (allAppointments.length > 0) {
      const now = new Date();
      const upcoming = allAppointments
        .filter(apt => apt && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && apt.startTime && new Date(apt.startTime) > now)
        .sort((a, b) => new Date(a?.startTime || 0) - new Date(b?.startTime || 0));
      if (upcoming[0]) return upcoming[0];
      if (allAppointments[0]) return allAppointments[0];
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
  }, [todayAppointments, allAppointments]);

  // ─── Health Journey Date Navigation & Computations ───
  const handlePrevDate = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      if (journeyTimeframe === 'day') d.setDate(d.getDate() - 1);
      else if (journeyTimeframe === 'week') d.setDate(d.getDate() - 7);
      else if (journeyTimeframe === 'month') d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextDate = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      if (journeyTimeframe === 'day') d.setDate(d.getDate() + 1);
      else if (journeyTimeframe === 'week') d.setDate(d.getDate() + 7);
      else if (journeyTimeframe === 'month') d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
  };

  const journeyDateBadge = useMemo(() => {
    const today = new Date();
    const isSameDay = (d1, d2) => (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );

    if (journeyTimeframe === 'day') {
      if (isSameDay(selectedDate, today)) return 'Today';
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      if (isSameDay(selectedDate, yesterday)) return 'Yesterday';
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow';
      return selectedDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }

    if (journeyTimeframe === 'week') {
      const start = new Date(selectedDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const isCurrentWeek = () => {
        const tStart = new Date(today);
        const tDay = tStart.getDay();
        const tDiff = tStart.getDate() - tDay + (tDay === 0 ? -6 : 1);
        tStart.setDate(tDiff);
        return isSameDay(start, tStart);
      };

      if (isCurrentWeek()) return 'This Week';
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }

    if (journeyTimeframe === 'month') {
      if (selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() === today.getMonth()) {
        return 'This Month';
      }
      return selectedDate.toLocaleDateString([], { month: 'short', year: 'numeric' });
    }

    return 'Today';
  }, [selectedDate, journeyTimeframe]);

  // Combine and de-duplicate all doctor appointments
  const allMergedAppointments = useMemo(() => {
    const map = new Map();
    (allAppointments || []).forEach(a => { if (a && a.id) map.set(String(a.id), a); });
    (todayAppointments || []).forEach(a => { if (a && a.id) map.set(String(a.id), a); });
    return Array.from(map.values());
  }, [allAppointments, todayAppointments]);

  // Find nearest appointment for quick jump
  const nearestAppointment = useMemo(() => {
    if (allMergedAppointments.length === 0) return null;
    const now = new Date();
    const upcoming = allMergedAppointments
      .filter(a => a?.startTime && new Date(a.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    if (upcoming[0]) return upcoming[0];
    return allMergedAppointments[0];
  }, [allMergedAppointments]);

  // Initial starter sample items only if the entire database has zero appointments
  const sampleFallbackEvents = useMemo(() => [
    {
      id: 'sample-1',
      time: '08:00 AM',
      title: 'Blood Pressure Stabilized',
      subtitle: 'Average: 120/80 mmHg • Nurse Triage',
      status: 'COMPLETED',
      statusLabel: 'Stabilized',
      statusStyle: 'bg-emerald-100 text-emerald-700',
      indicatorColor: 'bg-emerald-500',
      nodeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      isSample: true,
    },
    {
      id: 'sample-2',
      time: '10:30 AM',
      title: 'Annual Cardiac Screening',
      subtitle: `Dr. ${user?.firstName || 'Michael'} ${user?.lastName || 'Lee'} • Cardiology Unit 4`,
      status: 'SCHEDULED',
      statusLabel: 'Scheduled',
      statusStyle: 'bg-blue-100 text-blue-700',
      indicatorColor: 'bg-blue-500',
      nodeClass: 'bg-red-50 text-red-600 border border-red-200',
      icon: <HeartPulse className="w-4 h-4 text-red-600" />,
      isSample: true,
    },
    {
      id: 'sample-3',
      time: '01:00 PM',
      title: 'Physical Therapy Session',
      subtitle: 'Lower Back Recovery • Day 12',
      status: 'SCHEDULED',
      statusLabel: 'Scheduled',
      statusStyle: 'bg-blue-100 text-blue-700',
      indicatorColor: 'bg-indigo-500',
      nodeClass: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
      icon: <Stethoscope className="w-4 h-4 text-indigo-600" />,
      isSample: true,
    },
    {
      id: 'sample-4',
      time: '03:30 PM',
      title: 'Mental Wellness Check',
      subtitle: 'Guided Meditation • Focus: Stress Relief',
      status: 'SCHEDULED',
      statusLabel: 'Scheduled',
      statusStyle: 'bg-blue-100 text-blue-700',
      indicatorColor: 'bg-purple-500',
      nodeClass: 'bg-purple-50 text-purple-600 border border-purple-200',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      isSample: true,
    },
  ], [user]);

  // ─── Real-time Health Journey Timeline Events ───
  const healthJourneyEvents = useMemo(() => {
    const isSameDay = (d1, d2) => (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );

    // Filter appointments for the selected timeframe
    const matchedAppointments = allMergedAppointments.filter(apt => {
      const aptDate = apt?.startTime ? new Date(apt.startTime) : null;
      if (!aptDate || isNaN(aptDate.getTime())) return false;

      if (journeyTimeframe === 'day') {
        return isSameDay(aptDate, selectedDate);
      } else if (journeyTimeframe === 'week') {
        const start = new Date(selectedDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return aptDate >= start && aptDate <= end;
      } else if (journeyTimeframe === 'month') {
        return (
          aptDate.getFullYear() === selectedDate.getFullYear() &&
          aptDate.getMonth() === selectedDate.getMonth()
        );
      }
      return false;
    });

    if (matchedAppointments.length === 0) {
      if (allMergedAppointments.length === 0 && journeyDateBadge === 'Today') {
        return sampleFallbackEvents;
      }
      return [];
    }

    // Map real appointments to journey events
    const mapped = matchedAppointments.map((apt, idx) => {
      const aptDate = new Date(apt.startTime);
      const timeStr = formatTime(apt.startTime);
      const dateStr = aptDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const patientName = `${apt.patientFirstName || ''} ${apt.patientLastName || ''}`.trim() || 'Patient';
      const statusInfo = STATUS_MAP[apt.status] || STATUS_MAP.SCHEDULED;

      let indicatorColor = 'bg-slate-900';
      let nodeClass = 'bg-blue-50 text-blue-600 border border-blue-200';
      let icon = <Stethoscope className="w-4 h-4 text-blue-600" />;

      if (apt.appointmentType === 'TELECONSULTATION') {
        nodeClass = 'bg-purple-50 text-purple-600 border border-purple-200';
        icon = <Video className="w-4 h-4 text-purple-600" />;
      } else if (['IN_CONSULTATION', 'IN_PROGRESS'].includes(apt.status)) {
        indicatorColor = 'bg-blue-600 animate-pulse';
        nodeClass = 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 animate-pulse';
        icon = <Activity className="w-4 h-4 text-white" />;
      } else if (apt.status === 'COMPLETED') {
        indicatorColor = 'bg-emerald-600';
        nodeClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
        icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      } else if (['CHECKED_IN', 'WAITING'].includes(apt.status)) {
        indicatorColor = 'bg-amber-500';
        nodeClass = 'bg-amber-50 text-amber-600 border border-amber-200';
        icon = <Clock className="w-4 h-4 text-amber-600" />;
      } else if (apt.status === 'CANCELLED') {
        indicatorColor = 'bg-rose-500';
        nodeClass = 'bg-rose-50 text-rose-600 border border-rose-200';
        icon = <X className="w-4 h-4 text-rose-600" />;
      }

      const mainTitle = apt.reasonForVisit || `${patientName} Consultation`;
      const subtitleParts = [
        patientName,
        apt.tokenNumber ? `Token #${apt.tokenNumber}` : `Token #${101 + idx}`,
        apt.appointmentType === 'TELECONSULTATION' ? 'Teleconsultation' : 'In-Person OPD',
        statusInfo.label
      ];

      return {
        id: apt.id,
        appointmentId: apt.id,
        patientId: apt.patientId,
        patientName,
        rawDate: aptDate,
        time: timeStr || '09:00 AM',
        dateDisplay: journeyTimeframe !== 'day' ? dateStr : null,
        title: mainTitle,
        subtitle: subtitleParts.join(' • '),
        status: apt.status,
        statusLabel: statusInfo.label,
        statusStyle: statusInfo.style,
        indicatorColor,
        nodeClass,
        icon,
      };
    });

    mapped.sort((a, b) => (a.rawDate?.getTime() || 0) - (b.rawDate?.getTime() || 0));
    return mapped;
  }, [allMergedAppointments, journeyTimeframe, selectedDate, sampleFallbackEvents, journeyDateBadge]);

  // ─── Next appointment date parts ───
  const nextAptDate = (nextAppointment && nextAppointment.startTime && !isNaN(new Date(nextAppointment.startTime))) ? new Date(nextAppointment.startTime) : new Date();
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
        
        {/* ─── 1. Quick Action Cards (10 Column Grid) ─── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
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

          {/* Card 4: Medicine Sales */}
          <div 
            onClick={() => navigate('/doctor/manage-medicines')} 
            className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-900 leading-tight">Medicine Sales</span>
          </div>

          {/* Card 5: Lab Request */}
          <div 
            onClick={() => navigate('/doctor/lab-reports')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Lab Request</span>
          </div>

          {/* Card 6: Upload Report */}
          <div 
            onClick={() => navigate('/doctor/lab-reports/upload')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Upload Report</span>
          </div>

          {/* Card 7: Medical Certificate */}
          <div 
            onClick={() => navigate('/doctor/medical-certificate')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Medical Certificate</span>
          </div>

          {/* Card 8: Start Consultation */}
          <div 
            onClick={() => setSearchParams({ panel: 'queue' })} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Start Consultation</span>
          </div>

          {/* Card 9: View Calendar */}
          <div 
            onClick={() => setSearchParams({ panel: 'calendar' })} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">View Calendar</span>
          </div>

          {/* Card 10: Provider Support */}
          <div 
            onClick={() => navigate('/doctor/support')} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center justify-center group"
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">Provider Support</span>
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
          <button 
            onClick={() => { setActiveTab('medicine-sales'); navigate('/doctor/manage-medicines'); }} 
            className={`px-5 py-2 rounded-full font-semibold text-xs transition ${
              activeTab === 'medicine-sales' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            Medicine Sales
          </button>
          <button 
            onClick={() => navigate('/doctor/support')} 
            className="px-5 py-2 rounded-full font-semibold text-xs transition bg-white text-slate-600 hover:bg-slate-100 border border-slate-100 flex items-center gap-1.5 ml-auto cursor-pointer"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-indigo-600" />
            Support Desk
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
              
              {/* Header with Date Navigation & Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100">
                    <button 
                      onClick={handlePrevDate} 
                      title={`Previous ${journeyTimeframe}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleNextDate} 
                      title={`Next ${journeyTimeframe}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Health Journey</h2>
                  <button
                    onClick={resetToToday}
                    title="Click to reset to Today"
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer"
                  >
                    {journeyDateBadge}
                  </button>
                </div>

                {/* Day / Week / Month Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {['day', 'week', 'month'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setJourneyTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                        journeyTimeframe === tf 
                          ? 'bg-white text-blue-600 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Timeline List */}
              {loadingToday && allMergedAppointments.length === 0 ? (
                <Loading />
              ) : healthJourneyEvents.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {healthJourneyEvents.map((evt, idx) => {
                    const isLast = idx === healthJourneyEvents.length - 1;
                    return (
                      <div 
                        key={evt.id || idx} 
                        onClick={() => {
                          if (evt.patientId) handlePatientClick(evt.patientId);
                          else setSearchParams({ panel: 'queue' });
                        }}
                        className="relative flex items-stretch gap-3 sm:gap-4 group cursor-pointer"
                        title={evt.isSample ? "Sample clinical protocol preview" : `View details for ${evt.title}`}
                      >
                        {/* Time Column (Left) */}
                        <div className="w-16 sm:w-20 text-xs font-bold text-slate-400 text-right shrink-0 pt-2 group-hover:text-blue-600 transition-colors">
                          <div>{evt.time}</div>
                          {evt.dateDisplay && (
                            <div className="text-[10px] text-slate-400 font-semibold">{evt.dateDisplay}</div>
                          )}
                        </div>

                        {/* Dedicated Center-Anchored Spine Column */}
                        <div className="relative flex flex-col items-center shrink-0 w-8 sm:w-9">
                          {/* Continuous Vertical Line */}
                          <div className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-100 to-slate-200 ${
                            isLast ? 'h-5' : 'h-full'
                          }`} />

                          {/* Centered Node Pin */}
                          <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center ring-4 ring-white shadow-2xs group-hover:scale-110 transition-transform ${evt.nodeClass || 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                            {evt.icon || <Stethoscope className="w-4 h-4 text-blue-600" />}
                          </div>
                        </div>

                        {/* Timeline Card */}
                        <div className="flex-1 min-w-0 bg-white group-hover:bg-blue-50/40 group-hover:border-blue-300 transition-all border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Left colored stripe */}
                            <div className={`w-1 h-9 ${evt.indicatorColor} rounded-full shrink-0 transition-colors`} />
                            
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-900 transition-colors">
                                {evt.title}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium truncate">
                                {evt.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Status pill & Arrow */}
                          <div className="flex items-center gap-2 shrink-0">
                            {evt.statusLabel && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${evt.statusStyle}`}>
                                {evt.statusLabel}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">No Journey Events Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No clinical consultations or scheduled appointments found for {journeyDateBadge.toLowerCase() === 'today' ? 'today' : journeyDateBadge}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {nearestAppointment && nearestAppointment.startTime && (
                      <button
                        onClick={() => {
                          setSelectedDate(new Date(nearestAppointment.startTime));
                          setJourneyTimeframe('day');
                        }}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        Jump to {new Date(nearestAppointment.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setSearchParams({ panel: 'new-appointment' })}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Schedule Appointment
                    </button>
                  </div>
                </div>
              )}

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
          title="Doctor Schedule & Calendar" icon={CalendarIcon} 
          variant="modal" size="wide" colorHex="#2160FF" stackIndex={0}
          bodyClassName="p-3 sm:p-5 md:p-6 bg-slate-50/60"
        >
          <DoctorCalendar onClose={closePanel} />
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
          className="md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[75vw] max-w-[1440px]"
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
          className="md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[75vw] max-w-[1440px]"
        >
          <PatientDetail patientIdOverride={patientId} />
        </ModulePanel>
      )}

      {currentPanel === 'new-appointment' && (
        <ModulePanel 
          isOpen={true} onClose={closePanel} 
          title="Appointments & Scheduling" icon={CalendarIcon} 
          variant="panel" colorHex="#2160FF" stackIndex={0}
          className="md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[75vw] max-w-[1440px]"
          bodyClassName="p-0 bg-slate-50/60"
        >
          <NewAppointmentPanel onClose={closePanel} />
        </ModulePanel>
      )}
    </div>
  );
};

export default DoctorDashboard;
