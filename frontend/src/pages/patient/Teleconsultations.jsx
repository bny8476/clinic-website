import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Video,
  Calendar,
  Clock,
  PlayCircle,
  Search,
  Filter,
  RotateCw,
  LayoutGrid,
  List,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Sparkles,
  User,
  Stethoscope,
  Globe,
  FileText,
  PhoneOff,
  Mic,
  Camera,
  Activity,
  ArrowRight,
  ExternalLink,
  Loader2,
  HelpCircle,
  SlidersHorizontal,
  Check
} from 'lucide-react';

import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import Modal from '../../components/ui/Modal';
import { fadeUp, staggerChildren, pageTransition } from '../../components/ui/motion';

// Sample fallback teleconsultations for demo when user has zero recorded calls
const DEMO_FALLBACK_TELECONSULTS = [
  {
    id: 101,
    isDemo: true,
    preferredDates: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimes: 'Morning (9AM - 12PM)',
    reason: 'Follow-up consultation for blood pressure stabilization and medication adjustment.',
    languagePreference: 'English',
    status: 'Booked',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology & Internal Medicine',
    joinLink: '/teleconsultation/room/101',
    createdAt: new Date().toISOString()
  },
  {
    id: 102,
    isDemo: true,
    preferredDates: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimes: 'Afternoon (12PM - 4PM)',
    reason: 'Review of comprehensive lipid profile and dietary lifestyle protocol.',
    languagePreference: 'English',
    status: 'Requested',
    doctorName: 'Assigned On-Call Specialist',
    department: 'Preventive Health',
    joinLink: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 103,
    isDemo: true,
    preferredDates: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimes: 'Evening (4PM - 7PM)',
    reason: 'Mild allergic rhinitis and seasonal asthma flare consultation.',
    languagePreference: 'English',
    status: 'Completed',
    doctorName: 'Dr. Marcus Vance',
    department: 'Pulmonology & Allergy',
    joinLink: null,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function Teleconsultations() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State management
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | Booked | Requested | Completed | Cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | date
  const [viewMode, setViewMode] = useState('grid'); // grid | table
  
  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isPreCheckModalOpen, setIsPreCheckModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionToCancel, setSessionToCancel] = useState(null);

  // Pre-Call hardware testing state
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [testingHardware, setTestingHardware] = useState(false);
  const videoPreviewRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Booking Form State
  const [formData, setFormData] = useState({
    preferredDates: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimes: 'Morning (9AM - 12PM)',
    department: 'General Internal Medicine',
    reason: '',
    languagePreference: 'English',
    agreeConsent: true
  });

  // Query patient teleconsultation requests from backend
  const { 
    data: rawTeleconsults = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['patient-teleconsults'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/v1/patient/teleconsultations');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Could not load teleconsultations from backend', err);
        return [];
      }
    },
    retry: 1
  });

  // Teleconsultation booking mutation
  const bookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post('/v1/patient/teleconsultations', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Teleconsultation request submitted successfully!');
      setIsBookModalOpen(false);
      setFormData({
        preferredDates: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferredTimes: 'Morning (9AM - 12PM)',
        department: 'General Internal Medicine',
        reason: '',
        languagePreference: 'English',
        agreeConsent: true
      });
      queryClient.invalidateQueries({ queryKey: ['patient-teleconsults'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit teleconsultation request');
    }
  });

  // Cancel teleconsultation request mutation
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.post(`/v1/patient/teleconsultations/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Teleconsultation request cancelled');
      setSessionToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['patient-teleconsults'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel teleconsultation');
    }
  });

  // Hardware Diagnostic test (Camera & Mic)
  const startHardwareCheck = async () => {
    setTestingHardware(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      setHasMicPermission(true);
    } catch (err) {
      console.warn('Media hardware check error', err);
      setHasCameraPermission(false);
      setHasMicPermission(false);
    } finally {
      setTestingHardware(false);
    }
  };

  const stopHardwareCheck = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setHasCameraPermission(null);
    setHasMicPermission(null);
  };

  useEffect(() => {
    if (!isPreCheckModalOpen) {
      stopHardwareCheck();
    }
  }, [isPreCheckModalOpen]);

  // Combined teleconsult list
  const teleconsults = useMemo(() => {
    if (Array.isArray(rawTeleconsults) && rawTeleconsults.length > 0) {
      return rawTeleconsults;
    }
    return DEMO_FALLBACK_TELECONSULTS;
  }, [rawTeleconsults]);

  // Key Performance Indicators (KPIs)
  const stats = useMemo(() => {
    const total = teleconsults.length;
    const booked = teleconsults.filter(t => (t.status || '').toLowerCase() === 'booked').length;
    const requested = teleconsults.filter(t => (t.status || '').toLowerCase() === 'requested').length;
    const completed = teleconsults.filter(t => (t.status || '').toLowerCase() === 'completed').length;
    const cancelled = teleconsults.filter(t => (t.status || '').toLowerCase() === 'cancelled').length;

    return { total, booked, requested, completed, cancelled };
  }, [teleconsults]);

  // Filter and sort teleconsultations
  const filteredTeleconsults = useMemo(() => {
    let list = [...teleconsults];

    // Filter by Tab
    if (activeFilter === 'Booked') {
      list = list.filter(t => (t.status || '').toLowerCase() === 'booked');
    } else if (activeFilter === 'Requested') {
      list = list.filter(t => (t.status || '').toLowerCase() === 'requested');
    } else if (activeFilter === 'Completed') {
      list = list.filter(t => (t.status || '').toLowerCase() === 'completed');
    } else if (activeFilter === 'Cancelled') {
      list = list.filter(t => (t.status || '').toLowerCase() === 'cancelled');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        (t.reason && t.reason.toLowerCase().includes(q)) ||
        (t.doctorName && t.doctorName.toLowerCase().includes(q)) ||
        (t.preferredTimes && t.preferredTimes.toLowerCase().includes(q)) ||
        (t.languagePreference && t.languagePreference.toLowerCase().includes(q)) ||
        String(t.id).includes(q)
      );
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || b.preferredDates || 0) - new Date(a.createdAt || a.preferredDates || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || a.preferredDates || 0) - new Date(b.createdAt || b.preferredDates || 0);
      }
      if (sortBy === 'date') {
        return new Date(a.preferredDates || 0) - new Date(b.preferredDates || 0);
      }
      return 0;
    });

    return list;
  }, [teleconsults, activeFilter, searchQuery, sortBy]);

  // Active confirmed visit for Quick-Join banner
  const activeConfirmedVisit = useMemo(() => {
    return teleconsults.find(t => (t.status || '').toLowerCase() === 'booked');
  }, [teleconsults]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'booked':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            CONFIRMED & READY
          </span>
        );
      case 'requested':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            AWAITING SPECIALIST
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={13} className="text-blue-600" />
            CONSULT COMPLETED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const handleJoinCall = (session) => {
    if (session.joinLink && session.joinLink.startsWith('http')) {
      window.open(session.joinLink, '_blank', 'noreferrer');
    } else {
      navigate(`/teleconsultation/room/${session.id}`);
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Video className="w-7 h-7 text-[#2864FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Virtual Teleconsultations
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  <ShieldCheck size={14} className="text-blue-600" />
                  Encrypted HD WebRTC
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Connect securely with certified medical specialists from anywhere. Manage bookings and join virtual consultation rooms.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 shrink-0 flex-nowrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => {
                refetch();
                toast.success('Teleconsultation list updated');
              }}
              title="Refresh Teleconsults"
              disabled={isFetching}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            >
              <RotateCw size={17} className={isFetching ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={() => {
                setIsPreCheckModalOpen(true);
                startHardwareCheck();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Sparkles size={15} className="text-[#2864FF]" />
              <span>Camera & Mic Check</span>
            </button>

            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer flex items-center gap-2 border-none whitespace-nowrap shrink-0"
            >
              <Video size={15} />
              <span>Book Virtual Teleconsult</span>
            </button>
          </div>
        </div>

        {/* ── Active Session Callout Banner ────────────────────────────── */}
        {activeConfirmedVisit && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  SESSION CONFIRMED
                </span>
                <span className="text-xs text-blue-200 font-bold font-mono">
                  REF #{activeConfirmedVisit.id}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Upcoming Consultation: {activeConfirmedVisit.reason || 'Medical Teleconsultation'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-300" />
                  {activeConfirmedVisit.preferredDates ? format(new Date(activeConfirmedVisit.preferredDates), 'EEEE, MMMM dd, yyyy') : 'Scheduled'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-300" />
                  {activeConfirmedVisit.preferredTimes}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={14} className="text-blue-300" />
                  {activeConfirmedVisit.doctorName || 'Attending Physician'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
              <button
                onClick={() => setSelectedSession(activeConfirmedVisit)}
                className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition cursor-pointer"
              >
                View Details
              </button>
              <button
                onClick={() => handleJoinCall(activeConfirmedVisit)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg cursor-pointer border-none"
              >
                <PlayCircle size={17} />
                <span>Join Video Room</span>
              </button>
            </div>
          </div>
        )}

        {/* ── KPI Strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teleconsults</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Lifetime virtual visits</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Video size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Confirmed & Ready</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.booked}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Ready for video admission</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Awaiting Specialist</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.requested}</h3>
              <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Pending doctor assignment</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Visits</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.completed}</h3>
              <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Archived clinical reviews</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={22} />
            </div>
          </div>
        </div>

        {/* ── Search, Filters & View Mode Controls ──────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Sessions', count: stats.total },
              { id: 'Booked', label: 'Confirmed', count: stats.booked },
              { id: 'Requested', label: 'Pending Review', count: stats.requested },
              { id: 'Completed', label: 'Completed', count: stats.completed },
              { id: 'Cancelled', label: 'Cancelled', count: stats.cancelled }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-none flex items-center gap-2 ${
                  activeFilter === tab.id
                    ? 'bg-[#2864FF] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeFilter === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Sort & View Mode */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reason, doctor, slot..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ backgroundImage: 'none' }}
                className="text-xs font-bold border border-slate-200 bg-white rounded-xl px-3 py-2 pr-7 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer shadow-2xs [background-image:none]"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="date">Scheduled Date</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#2864FF] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 bg-transparent'
                }`}
              >
                <LayoutGrid size={15} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table Ledger View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none flex items-center justify-center ${
                  viewMode === 'table'
                    ? 'bg-white text-[#2864FF] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 bg-transparent'
                }`}
              >
                <List size={15} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content View (Cards Grid / Table Ledger / Empty State) ───── */}
        {filteredTeleconsults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center mb-4 shadow-inner">
              <Video size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              {searchQuery ? 'No matching virtual consultations found' : 'No Teleconsultations Scheduled'}
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-md mb-6 leading-relaxed">
              {searchQuery
                ? `No sessions found matching "${searchQuery}". Clear your search or switch category filters.`
                : 'Connect with certified doctors virtually from home. Book appointments with zero commute and secure digital prescriptions.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Video size={18} className="text-[#2864FF] mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#2864FF]">Book Virtual Consult</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Schedule online video session</p>
              </button>

              <button
                onClick={() => navigate('/patient/appointments')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Calendar size={18} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">In-Clinic Visits</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">View physical OPD appointments</p>
              </button>

              <button
                onClick={() => navigate('/patient/prescriptions')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <FileText size={18} className="text-emerald-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Health Records</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Access prescriptions & reports</p>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── View 1: Responsive Grid Cards ────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeleconsults.map((session) => {
              const isBooked = (session.status || '').toLowerCase() === 'booked';
              const isRequested = (session.status || '').toLowerCase() === 'requested';
              const isCompleted = (session.status || '').toLowerCase() === 'completed';

              return (
                <motion.div
                  key={session.id}
                  variants={fadeUp}
                  className={`bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group ${
                    isBooked ? 'border-emerald-200 ring-1 ring-emerald-500/10' : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    {/* Top Row: Status & ID */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getStatusBadge(session.status)}
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #TC-{session.id}
                      </span>
                    </div>

                    {/* Preferred Date & Slot */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Calendar size={14} className="text-[#2864FF]" />
                        <span>{session.preferredDates ? format(new Date(session.preferredDates), 'EEE, MMM dd, yyyy') : 'Requested'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Clock size={13} />
                        <span>{session.preferredTimes}</span>
                      </div>
                    </div>

                    {/* Reason for Visit */}
                    <h3 
                      onClick={() => setSelectedSession(session)}
                      className="text-base font-extrabold text-slate-900 group-hover:text-[#2864FF] transition-colors cursor-pointer line-clamp-2 mb-2 tracking-tight"
                      title={session.reason}
                    >
                      {session.reason || 'Medical Teleconsultation Request'}
                    </h3>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-[#2864FF] flex items-center justify-center font-bold text-[10px]">
                        <User size={12} />
                      </div>
                      <span className="font-bold text-slate-800">
                        {session.doctorName || (isRequested ? 'Pending Doctor Assignment' : 'Assigned Specialist')}
                      </span>
                    </div>

                    {/* Language & Discipline Pill */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Globe size={11} className="text-slate-400" />
                        {session.languagePreference || 'English'}
                      </span>
                      {session.department && (
                        <>
                          <span>·</span>
                          <span className="truncate">{session.department}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none p-0"
                    >
                      <span>Session Details</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isRequested && (
                        <button
                          onClick={() => setSessionToCancel(session)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border-none cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {isBooked && (
                        <button
                          onClick={() => handleJoinCall(session)}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-2xs border-none cursor-pointer"
                        >
                          <PlayCircle size={14} />
                          <span>Join Room</span>
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => navigate('/patient/records')}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2864FF] bg-blue-50 hover:bg-blue-100 transition border-none cursor-pointer"
                        >
                          View Notes
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── View 2: High-Density Teleconsult Table ─────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Preferred Date & Slot</th>
                    <th className="px-5 py-3.5">Consultation Reason</th>
                    <th className="px-5 py-3.5">Assigned Clinician</th>
                    <th className="px-5 py-3.5">Language</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTeleconsults.map((session) => {
                    const isBooked = (session.status || '').toLowerCase() === 'booked';
                    const isRequested = (session.status || '').toLowerCase() === 'requested';

                    return (
                      <tr key={session.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-5 py-4 font-mono font-bold text-slate-400">
                          #{session.id}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                          <p>{session.preferredDates ? format(new Date(session.preferredDates), 'MMM dd, yyyy') : 'Requested'}</p>
                          <span className="text-[11px] text-slate-400 font-medium">{session.preferredTimes}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs truncate text-slate-700 font-medium">
                          {session.reason || 'Virtual Teleconsultation'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                          {session.doctorName || (isRequested ? 'Pending Assignment' : 'Specialist')}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                          {session.languagePreference || 'English'}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedSession(session)}
                              title="Session Details"
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer text-xs font-bold"
                            >
                              Details
                            </button>
                            {isBooked && (
                              <button
                                onClick={() => handleJoinCall(session)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer text-xs font-bold flex items-center gap-1 border-none shadow-2xs"
                              >
                                <PlayCircle size={13} />
                                <span>Join</span>
                              </button>
                            )}
                            {isRequested && (
                              <button
                                onClick={() => setSessionToCancel(session)}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer text-xs font-bold border-none"
                              >
                                Cancel
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
          </div>
        )}

        {/* ── Modal 1: Book Virtual Teleconsultation ───────────────────── */}
        {isBookModalOpen && (
          <Modal
            isOpen={isBookModalOpen}
            onClose={() => setIsBookModalOpen(false)}
            title="Book Virtual Teleconsultation"
            size="md"
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              bookMutation.mutate(formData);
            }} className="space-y-4 pt-1">
              <p className="text-xs font-medium text-slate-500">
                Submit your preferred consultation slot. Our clinic coordinator will assign the appropriate certified physician and notify you with room credentials.
              </p>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.preferredDates}
                  onChange={(e) => setFormData({ ...formData, preferredDates: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Preferred Time Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Time Window *
                </label>
                <div className="relative">
                  <select
                    value={formData.preferredTimes}
                    onChange={(e) => setFormData({ ...formData, preferredTimes: e.target.value })}
                    style={{ backgroundImage: 'none' }}
                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                  >
                    <option value="Morning (9AM - 12PM)">Morning Window (09:00 AM – 12:00 PM)</option>
                    <option value="Afternoon (12PM - 4PM)">Afternoon Window (12:00 PM – 04:00 PM)</option>
                    <option value="Evening (4PM - 7PM)">Evening Window (04:00 PM – 07:00 PM)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Department / Discipline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Specialty
                </label>
                <div className="relative">
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ backgroundImage: 'none' }}
                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                  >
                    <option value="General Internal Medicine">General Internal Medicine & Family Care</option>
                    <option value="Cardiology">Cardiology & Hypertension</option>
                    <option value="Dermatology">Dermatology & Skin Care</option>
                    <option value="Pediatrics">Pediatrics & Child Health</option>
                    <option value="Orthopedics">Orthopedics & Joint Pain</option>
                    <option value="Psychiatry & Behavioral">Psychiatry & Mental Health</option>
                    <option value="Pulmonology">Pulmonology & Respiratory</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Language *
                </label>
                <div className="relative">
                  <select
                    value={formData.languagePreference}
                    onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
                    style={{ backgroundImage: 'none' }}
                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Visit / Symptoms *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Describe your current symptoms, questions for the doctor, or prescription renewal needs..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Consent check */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.agreeConsent}
                  onChange={(e) => setFormData({ ...formData, agreeConsent: e.target.checked })}
                  className="mt-0.5 rounded text-[#2864FF] focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="consent" className="text-xs text-blue-900 cursor-pointer leading-relaxed">
                  I consent to virtual video teleconsultation and acknowledge that emergency medical conditions should be directed to the nearest urgent care facility.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  disabled={bookMutation.isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookMutation.isPending || !formData.agreeConsent || !formData.reason.trim()}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer border-none flex items-center gap-2 disabled:opacity-50"
                >
                  {bookMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Video size={14} />
                      <span>Confirm & Book Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal 2: Session Details Modal ───────────────────────────── */}
        {selectedSession && (
          <Modal
            isOpen={!!selectedSession}
            onClose={() => setSelectedSession(null)}
            title="Teleconsultation Details"
            size="md"
          >
            <div className="space-y-5 pt-1">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Identifier</span>
                  <span className="text-base font-black text-slate-900 font-mono">#TC-{selectedSession.id}</span>
                </div>
                <div>{getStatusBadge(selectedSession.status)}</div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Scheduled Date</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedSession.preferredDates ? format(new Date(selectedSession.preferredDates), 'MMMM dd, yyyy') : 'Pending confirmation'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Time Window</span>
                  <span className="font-extrabold text-slate-900">{selectedSession.preferredTimes}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Attending Clinician</span>
                  <span className="font-extrabold text-slate-900">{selectedSession.doctorName || 'Pending Assignment'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Language Preference</span>
                  <span className="font-extrabold text-slate-900">{selectedSession.languagePreference || 'English'}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason for Visit</p>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedSession.reason}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                {(selectedSession.status || '').toLowerCase() === 'booked' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      handleJoinCall(selectedSession);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-2xs"
                  >
                    <PlayCircle size={14} />
                    <span>Join Video Call</span>
                  </button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal 3: Camera & Mic Diagnostic Pre-Check ───────────────── */}
        {isPreCheckModalOpen && (
          <Modal
            isOpen={isPreCheckModalOpen}
            onClose={() => setIsPreCheckModalOpen(false)}
            title="Pre-Call Camera & Audio Diagnostic"
            size="md"
          >
            <div className="space-y-4 pt-1">
              <p className="text-xs font-medium text-slate-500">
                Verify your video and audio devices before entering the teleconsultation room with your doctor.
              </p>

              {/* Video Camera Preview Screen */}
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {!hasCameraPermission && !testingHardware && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-slate-300">
                    <Camera size={32} className="text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-slate-200">Camera preview inactive</p>
                    <p className="text-[11px] text-slate-400 mt-1">Please allow camera & microphone access in your browser.</p>
                  </div>
                )}

                {testingHardware && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
                    <Loader2 size={28} className="animate-spin text-[#2864FF] mb-2" />
                    <p className="text-xs font-bold">Requesting hardware access...</p>
                  </div>
                )}
              </div>

              {/* Hardware Status Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className={hasCameraPermission ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className="text-xs font-bold text-slate-700">Webcam</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    hasCameraPermission ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {hasCameraPermission ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic size={16} className={hasMicPermission ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className="text-xs font-bold text-slate-700">Microphone</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    hasMicPermission ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {hasMicPermission ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={startHardwareCheck}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw size={13} />
                  <span>Retest Devices</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreCheckModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer border-none shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal 4: Cancel Teleconsultation Confirmation ───────────── */}
        {sessionToCancel && (
          <Modal
            isOpen={!!sessionToCancel}
            onClose={() => setSessionToCancel(null)}
            title="Cancel Teleconsultation Request"
            size="sm"
          >
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-rose-900 leading-relaxed">
                  Are you sure you want to cancel teleconsultation request <strong>#TC-{sessionToCancel.id}</strong>? You can submit a new request at any time.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSessionToCancel(null)}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(sessionToCancel.id)}
                  disabled={cancelMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-2xs disabled:opacity-50"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Confirm Cancel</span>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </motion.div>
  );
}
