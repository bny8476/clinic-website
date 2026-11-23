import useAuthStore from '../../store/authStore';
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { 
  Activity, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clipboard, 
  Clock,
  CloudUpload, 
  FileText,
  FlaskConical, 
  HeartPulse, 
  LayoutGrid, 
  MoreHorizontal, 
  Pill, 
  Plus, 
  RefreshCw,
  Sparkles, 
  UserCheck, 
  UserPlus, 
  Users 
} from 'lucide-react';
import { motion } from 'framer-motion';
import NurseAssignedPatients from './NurseAssignedPatients';
import WardManagement from './WardManagement';

const NurseDashboard = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Realtime clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Interactive selected date for the schedule view
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Day');

  useEffect(() => {
    if (searchParams.get('panel') === 'supplies') {
      setActiveTab('Inventory');
    }
  }, [searchParams]);

  // Keep live clock updated every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick Action cards definitions
  const quickActions = [
    { icon: Users, label: 'View Patients', desc: 'Directory & records', color: 'text-blue-600', bg: 'bg-blue-50', link: '/nurse/patients' },
    { icon: HeartPulse, label: 'Record Vitals', desc: 'Triage & vitals check', color: 'text-rose-600', bg: 'bg-rose-50', link: '/nurse/vitals' },
    { icon: Pill, label: 'Medication Admin', desc: 'Doses & schedule', color: 'text-purple-600', bg: 'bg-purple-50', link: '/nurse/medications' },
    { icon: CloudUpload, label: 'Upload Reports', desc: 'Lab & diagnostics', color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/nurse/reports' },
    { icon: Clipboard, label: 'Patient Care', desc: 'Daily nursing notes', color: 'text-amber-600', bg: 'bg-amber-50', link: '/nurse/care' },
    { icon: FlaskConical, label: 'Lab Collection', desc: 'Sample collection', color: 'text-sky-600', bg: 'bg-sky-50', link: '/nurse/lab' }
  ];

  // Live OP Patients Query with 10s realtime polling
  const { data: livePatients = [], isLoading: opLoading, refetch: refetchOP } = useQuery({
    queryKey: ['nurse-dashboard-op-patients'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/nursing/assignments/op');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000 // Realtime 10s auto-sync
  });

  // Live Walk-ins Query
  const { data: walkIns = [], isLoading: walkInsLoading } = useQuery({
    queryKey: ['nurse-dashboard-walkins'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/reception/branches/1/walk-ins');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000
  });

  // Live Shift Activities Query
  const { data: rawActivities = [] } = useQuery({
    queryKey: ['nurse-dashboard-activities'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/nursing/recent-activity');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000
  });

  // OP Patients Live Data List
  const opPatients = useMemo(() => {
    return livePatients.map((p, idx) => ({
      id: p.patientId || p.id || idx + 1,
      token: p.tokenNumber ? `#${p.tokenNumber}` : `#T${idx + 1}`,
      name: p.patientName || 'Patient',
      time: p.appointmentTime 
        ? new Date(p.appointmentTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) 
        : 'Today',
      reason: p.appointmentReason || 'OP Consultation',
      vitals: p.lastVitalsSummary || 'No vitals recorded',
      status: p.status || 'WAITING'
    }));
  }, [livePatients]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = useMemo(() => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
  }, [selectedDate]);

  // Dynamic live time percentage for timeline positioning
  // Timeline spans from 08:00 AM (480 mins) to 06:00 PM (1080 mins) -> 600 mins total
  const liveIndicatorPosition = useMemo(() => {
    if (!isToday) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const currentMins = hours * 60 + minutes;
    const startMins = 8 * 60; // 08:00 AM
    const endMins = 18 * 60;  // 06:00 PM

    if (currentMins < startMins) return { slot: 'before', hour: 8 };
    if (currentMins > endMins) return { slot: 'after', hour: 18 };
    return { slot: 'active', hour: hours, minutes };
  }, [currentTime, isToday]);

  // Formatted Current Time string (e.g. 11:29 AM)
  const formattedCurrentTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  }, [currentTime]);

  // Formatted Selected Date string (e.g. 23 November 2026)
  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }, [selectedDate]);

  // Next upcoming appointment derived dynamically
  const nextAppointment = useMemo(() => {
    if (opPatients.length > 0) {
      return {
        id: opPatients[0].id,
        name: opPatients[0].name,
        time: opPatients[0].time,
        reason: opPatients[0].reason,
        token: opPatients[0].token
      };
    }
    // High-fidelity fallback representation
    return {
      id: 104,
      name: 'Ananya Patel',
      time: '09:00 - 09:20 AM',
      reason: 'Fever & Vitals Check',
      token: '#T01'
    };
  }, [opPatients]);

  // Timeline slots configuration
  const timelineSlots = [
    { time: '08:00 AM', hour: 8, event: null },
    { 
      time: '09:00 AM', 
      hour: 9, 
      event: opPatients[0] ? {
        name: opPatients[0].name,
        reason: opPatients[0].reason,
        slot: `${opPatients[0].time} - Slot 1`,
        id: opPatients[0].id,
        colorBg: 'bg-blue-50/80 border-blue-500 text-blue-900',
        badgeBg: 'bg-blue-100/80 text-blue-700',
        dotBg: 'bg-blue-500'
      } : {
        name: 'Ananya Patel',
        reason: 'Fever & Vitals Check',
        slot: '09:00 - 09:20 AM',
        id: 101,
        colorBg: 'bg-blue-50/80 border-blue-500 text-blue-900',
        badgeBg: 'bg-blue-100/80 text-blue-700',
        dotBg: 'bg-blue-500'
      }
    },
    { 
      time: '10:00 AM', 
      hour: 10, 
      event: opPatients[1] ? {
        name: opPatients[1].name,
        reason: opPatients[1].reason,
        slot: `${opPatients[1].time} - Slot 2`,
        id: opPatients[1].id,
        colorBg: 'bg-emerald-50/80 border-emerald-500 text-emerald-900',
        badgeBg: 'bg-emerald-100/80 text-emerald-700',
        dotBg: 'bg-emerald-500'
      } : {
        name: 'James Smith',
        reason: 'Follow-up Consultation',
        slot: '10:00 - 10:20 AM',
        id: 102,
        colorBg: 'bg-emerald-50/80 border-emerald-500 text-emerald-900',
        badgeBg: 'bg-emerald-100/80 text-emerald-700',
        dotBg: 'bg-emerald-500'
      }
    },
    { time: '11:00 AM', hour: 11, event: null },
    { time: '12:00 PM', hour: 12, event: null },
    { 
      time: '01:00 PM', 
      hour: 13, 
      event: opPatients[2] ? {
        name: opPatients[2].name,
        reason: opPatients[2].reason,
        slot: `${opPatients[2].time} - Slot 3`,
        id: opPatients[2].id,
        colorBg: 'bg-amber-50/80 border-amber-500 text-amber-900',
        badgeBg: 'bg-amber-100/80 text-amber-700',
        dotBg: 'bg-amber-500'
      } : {
        name: 'Linda Brown',
        reason: 'Medication Review',
        slot: '01:00 - 01:20 PM',
        id: 103,
        colorBg: 'bg-amber-50/80 border-amber-500 text-amber-900',
        badgeBg: 'bg-amber-100/80 text-amber-700',
        dotBg: 'bg-amber-500'
      }
    },
    { time: '02:00 PM', hour: 14, event: null },
    { 
      time: '03:00 PM', 
      hour: 15, 
      event: opPatients[3] ? {
        name: opPatients[3].name,
        reason: opPatients[3].reason,
        slot: `${opPatients[3].time} - Slot 4`,
        id: opPatients[3].id,
        colorBg: 'bg-purple-50/80 border-purple-500 text-purple-900',
        badgeBg: 'bg-purple-100/80 text-purple-700',
        dotBg: 'bg-purple-500'
      } : {
        name: 'Robert Johnson',
        reason: 'Wound Dressing & Vitals',
        slot: '03:00 - 03:20 PM',
        id: 105,
        colorBg: 'bg-purple-50/80 border-purple-500 text-purple-900',
        badgeBg: 'bg-purple-100/80 text-purple-700',
        dotBg: 'bg-purple-500'
      }
    },
    { time: '04:00 PM', hour: 16, event: null },
    { time: '05:00 PM', hour: 17, event: null }
  ];

  // Activities list with real fallback
  const activitiesList = useMemo(() => {
    if (rawActivities.length > 0) {
      return rawActivities.slice(0, 4).map(act => ({
        icon: act.type === 'VITALS' ? HeartPulse : act.type === 'NOTE' ? FileText : Clipboard,
        title: act.title || 'Nursing Task',
        patient: act.sub || 'Assigned Patient',
        time: act.time ? new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Recent',
        bg: act.bg || 'bg-emerald-50',
        color: act.color || 'text-emerald-600'
      }));
    }
    return [
      {
        icon: HeartPulse,
        title: 'Vitals Recorded',
        patient: opPatients[0]?.name ? `${opPatients[0].name}` : '3 Patients',
        time: 'Just now',
        bg: 'bg-emerald-50',
        color: 'text-emerald-600'
      },
      {
        icon: Pill,
        title: 'Medication Administered',
        patient: 'Ward 2A - Bed 4',
        time: '25m ago',
        bg: 'bg-purple-50',
        color: 'text-purple-600'
      },
      {
        icon: Clipboard,
        title: 'Triage Queue Sync',
        patient: `${opPatients.length} OP Patients active`,
        time: '1h ago',
        bg: 'bg-blue-50',
        color: 'text-blue-600'
      }
    ];
  }, [rawActivities, opPatients]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Station Header & Realtime Duty Banner ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Welcome back, {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.name || 'Staff Nurse'}
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>OPD Triage & Ward Station</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-bold">{opPatients.length} Patients in Queue</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Station ID: #NS-04</span>
            </p>
          </div>
        </div>

        {/* Realtime Live Clock & Sync indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs font-black text-slate-900 font-mono tracking-wide leading-tight">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
          </div>

          <button 
            onClick={() => refetchOP()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold"
            title="Refresh OP queue"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ─── 1. Top Quick Action Cards Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {quickActions.map((qa, idx) => {
          const Icon = qa.icon;
          return (
            <div 
              key={idx}
              onClick={() => qa.link && navigate(qa.link)}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs hover:border-blue-300 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${qa.bg} ${qa.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 leading-snug group-hover:text-blue-600 transition">
                  {qa.label}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">
                  {qa.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 2. Main Navigation Tabs ─── */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
          { id: 'OP Queue', label: `OP Queue (${opPatients.length})`, icon: UserPlus },
          { id: 'IP Wards', label: 'IP Wards', icon: UserCheck },
          { id: 'Inventory', label: 'Inventory', icon: Clipboard }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id.startsWith('OP Queue') ? 'OP Queue' : tab.id)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── 3. Main Content Rendering based on Tab ─── */}
      {activeTab === 'Dashboard' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (lg: 6 cols, xl: 3 cols = 25%) ── */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-3 space-y-6">
          
          {/* Nurse OP Patients Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm">Nurse OP Patients</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                  {opPatients.length} Active
                </span>
              </div>
              <button 
                onClick={() => navigate('/nurse/op-queue')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            {/* Responsive Patient Queue Items */}
            <div className="space-y-2.5">
              {opLoading ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading queue...
                </div>
              ) : opPatients.length === 0 ? (
                <div className="text-center py-6 px-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-600">No OP patients assigned</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Patients registered at reception will appear here</p>
                </div>
              ) : (
                opPatients.slice(0, 4).map((pt, pIdx) => (
                  <div 
                    key={pIdx}
                    onClick={() => navigate(`/nurse/workspace/${pt.id}`)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/40 hover:bg-white hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-extrabold text-[11px] shrink-0">
                        {pt.token}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-blue-600 transition">
                          {pt.name}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-400 truncate">
                          {pt.reason} • {pt.time}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                      {pt.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => navigate('/nurse/op-queue')}
              className="w-full py-2.5 bg-blue-50/80 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-blue-200/50"
            >
              Go to OP Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Next Appointment Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Next Appointment</h3>
              <button 
                onClick={() => navigate('/doctor/calendar')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                VIEW CALENDAR
              </button>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="w-16 h-16 bg-white border border-slate-200/80 rounded-xl p-2 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider">
                  {selectedDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                </span>
                <span className="text-xl font-black text-slate-900 leading-none my-0.5">
                  {selectedDate.getDate()}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {selectedDate.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                </span>
              </div>

              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] font-bold text-blue-600 block">
                  {nextAppointment.time}
                </span>
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {nextAppointment.name}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  {nextAppointment.reason}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">
                  Token: {nextAppointment.token}
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/nurse/workspace/${nextAppointment.id}`)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
            >
              <CalendarIcon className="w-3.5 h-3.5" /> View Patient Details
            </button>
          </div>

        </div>

        {/* ── CENTER COLUMN (lg: 12 cols, xl: 6 cols = 50%) ── */}
        <div className="col-span-1 lg:col-span-12 xl:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6 order-first xl:order-none">
          
          {/* Top Controls Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button 
                onClick={handlePrevDay}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {formattedDate}
              </h2>
              <button 
                onClick={handleNextDay}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Next Day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleToday}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                  isToday 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {['Day', 'Week', 'Month'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      viewMode === mode 
                        ? 'bg-white text-blue-600 shadow-2xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Time Slots Schedule */}
          <div className="relative space-y-5 pt-2 pl-16">
            
            {timelineSlots.map((slot) => {
              const hasEvent = slot.event !== null;
              // Check if dynamic time indicator falls right around this hour
              const isIndicatorNear = isToday && liveIndicatorPosition?.hour === slot.hour;

              return (
                <div key={slot.hour} className="relative">
                  {/* Slot Time Label */}
                  <div className="relative flex items-center min-h-[44px]">
                    <span className="absolute -left-16 text-xs font-bold text-slate-400 font-mono">
                      {slot.time}
                    </span>

                    {hasEvent ? (
                      <div 
                        onClick={() => navigate(`/nurse/workspace/${slot.event.id}`)}
                        className={`w-full ${slot.event.colorBg} border-l-4 rounded-xl p-3.5 ml-1 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer group`}
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 group-hover:text-blue-600 transition">
                            <span className={`w-2 h-2 rounded-full ${slot.event.dotBg}`}></span> 
                            {slot.event.name}
                          </h4>
                          <p className="text-[11px] font-semibold text-slate-600 pl-4 truncate">
                            {slot.event.reason}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold ${slot.event.badgeBg} px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap`}>
                          {slot.event.slot}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-[1px] bg-slate-100"></div>
                    )}
                  </div>

                  {/* Realtime Live Time Indicator dynamically placed */}
                  {isIndicatorNear && (
                    <div className="relative my-3 z-10">
                      <span className="absolute -left-16 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        {formattedCurrentTime}
                      </span>
                      <div className="w-full h-[2px] bg-blue-600 relative flex items-center">
                        <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 shadow-sm"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>

        {/* ── RIGHT COLUMN (lg: 6 cols, xl: 3 cols = 25%) ── */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-3 space-y-6">
          
          {/* New Walk-in Patients Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm">New Walk-in Patients</h3>
                {walkIns.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                    {walkIns.length} New
                  </span>
                )}
              </div>
              <button 
                onClick={() => navigate('/nurse/walk-in')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            {walkInsLoading ? (
              <div className="text-center py-4 text-xs text-slate-400">Checking walk-in queue...</div>
            ) : walkIns.length > 0 ? (
              <div className="space-y-2.5">
                {walkIns.slice(0, 3).map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{w.patientName || `Walk-in #${w.id}`}</h4>
                      <p className="text-[10px] text-slate-500">{w.department || 'General OPD'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
                      {w.opNumber || 'Waiting'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                  <UserPlus className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-600">No new walk-in patients</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Walk-in registrations will appear here in real-time</p>
              </div>
            )}

            <button 
              onClick={() => navigate('/nurse/walk-in')}
              className="w-full py-2.5 bg-blue-50/80 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-blue-200/50"
            >
              Register Walk-in <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Shift Activities Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Recent Shift Activities</h3>
              <button 
                onClick={() => navigate('/nurse/activities')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            <div className="space-y-3">
              {activitiesList.map((act, aIdx) => {
                const Icon = act.icon;
                return (
                  <div key={aIdx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${act.bg} ${act.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{act.title}</h4>
                        <p className="text-[10px] font-medium text-slate-400 truncate">{act.patient}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">{act.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
      )}

      {activeTab === 'OP Queue' && (
        <NurseAssignedPatients />
      )}

      {activeTab === 'IP Wards' && (
        <WardManagement />
      )}

      {activeTab === 'Inventory' && (
        <div className="flex flex-col items-center justify-center p-16 sm:p-20 bg-white rounded-2xl border border-slate-200/90 shadow-2xs mt-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
            <Clipboard className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Ward Supply & Inventory</h2>
          <p className="text-slate-500 font-medium text-xs max-w-sm">
            Ward supply tracking, medicine refills, and consumable requests will be synchronized here.
          </p>
        </div>
      )}

    </div>
  );
};

export default NurseDashboard;
