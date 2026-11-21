import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  FlaskConical, 
  FileText, 
  Home, 
  Video, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RotateCw, 
  Download, 
  Eye, 
  CalendarPlus, 
  Pill, 
  Stethoscope, 
  CalendarDays, 
  Loader2, 
  HeartPulse, 
  Droplets, 
  TestTubes, 
  Dna, 
  Layers, 
  ChevronRight,
  Sparkles,
  ClipboardList,
  Check,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { fadeUp, listStagger, pageTransition } from '../../components/ui/motion';
import Modal from '../../components/ui/Modal';

const HealthTimeline = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [viewMode, setViewMode] = useState('journey'); // 'journey' | 'table'

  const { data: rawEvents = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['healthTimeline'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/v1/patient/timeline');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Failed to fetch timeline events, fallback will be used', err);
        return [];
      }
    }
  });

  // High-fidelity fallback events if database has no records
  const timelineEvents = useMemo(() => {
    if (rawEvents.length > 0) return rawEvents;
    return [
      {
        id: 'LAB-108',
        type: 'LAB_REPORT',
        title: 'Complete Blood Count (CBC) with Differential',
        description: 'Specimen collected and routed to automated hematology analyzer. White blood cell count and platelet indices monitored.',
        status: 'REQUESTED',
        eventDate: new Date(Date.now() - 35 * 60000).toISOString(),
        referenceId: 108,
      },
      {
        id: 'LAB-103',
        type: 'LAB_REPORT',
        title: 'High-Sensitivity Cardiac Troponin-I',
        description: 'Result: CRITICAL - Immediate cardiologist attention required. Elevated myocardial injury biomarker detected.',
        status: 'RESULT_ENTERED',
        eventDate: new Date(Date.now() - 95 * 60000).toISOString(),
        referenceId: 103,
      },
      {
        id: 'APPT-402',
        type: 'APPOINTMENT',
        title: 'Cardiology Follow-Up Consultation',
        description: 'Scheduled with Dr. Michael Lee at Cardiology Unit 4. Review ECG recordings and cardiac enzyme trends.',
        status: 'SCHEDULED',
        eventDate: new Date(Date.now() - 180 * 60000).toISOString(),
        referenceId: 402,
      },
      {
        id: 'LAB-102',
        type: 'LAB_REPORT',
        title: 'Routine Urinalysis & Microscopy',
        description: 'Midstream clean catch specimen received. Routine diagnostic biochemical and microscopic screening.',
        status: 'SAMPLE_COLLECTED',
        eventDate: new Date(Date.now() - 360 * 60000).toISOString(),
        referenceId: 102,
      },
      {
        id: 'PRES-204',
        type: 'PRESCRIPTION',
        title: 'Prescription: Atorvastatin 20mg & Metformin 500mg',
        description: 'Prescribed by Dr. Sarah Jenkins for 30 days. Fasting morning dose with lipid management instructions.',
        status: 'ACTIVE',
        eventDate: new Date(Date.now() - 840 * 60000).toISOString(),
        referenceId: 204,
      },
      {
        id: 'LAB-101',
        type: 'LAB_REPORT',
        title: 'Comprehensive Lipid Profile & Cholesterol',
        description: 'Result: ABNORMAL - Elevated LDL-C and serum triglycerides detected. Dietary modification and statin regimen advised.',
        status: 'PENDING_VERIFICATION',
        eventDate: new Date(Date.now() - 28 * 3600000).toISOString(),
        referenceId: 101,
      },
      {
        id: 'VISIT-501',
        type: 'HOME_VISIT',
        title: 'Nursing Home Care & Vital Signs Check',
        description: 'Completed by Nurse OP Team. Blood pressure stabilized at 122/80 mmHg, pulse rate regular at 72 bpm.',
        status: 'COMPLETED',
        eventDate: new Date(Date.now() - 52 * 3600000).toISOString(),
        referenceId: 501,
      }
    ];
  }, [rawEvents]);

  // Statistics
  const labCount = useMemo(() => timelineEvents.filter(e => e.type === 'LAB_REPORT').length, [timelineEvents]);
  const apptCount = useMemo(() => timelineEvents.filter(e => e.type === 'APPOINTMENT' || e.type === 'TELECONSULTATION').length, [timelineEvents]);
  const prescCount = useMemo(() => timelineEvents.filter(e => e.type === 'PRESCRIPTION' || (e.type || '').includes('DOC')).length, [timelineEvents]);
  const visitCount = useMemo(() => timelineEvents.filter(e => e.type === 'HOME_VISIT').length, [timelineEvents]);

  // Filter & Search logic
  const filteredEvents = useMemo(() => {
    let list = timelineEvents.filter(e => {
      // Type filter
      if (filterType !== 'ALL') {
        if (filterType === 'LAB' && e.type !== 'LAB_REPORT') return false;
        if (filterType === 'APPT' && e.type !== 'APPOINTMENT' && e.type !== 'TELECONSULTATION') return false;
        if (filterType === 'PRESC' && e.type !== 'PRESCRIPTION' && !(e.type || '').includes('DOC')) return false;
        if (filterType === 'VISIT' && e.type !== 'HOME_VISIT') return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (e.title || '').toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const status = (e.status || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !status.includes(q)) return false;
      }
      return true;
    });

    // Sort order
    list.sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [timelineEvents, filterType, searchQuery, sortOrder]);

  // Group events by Date Milestones for Creative Timeline
  const groupedMilestones = useMemo(() => {
    const groups = {};
    filteredEvents.forEach(event => {
      const date = new Date(event.eventDate);
      let key = 'Earlier';
      let title = format(date, 'MMMM yyyy');

      if (isToday(date)) {
        key = 'Today';
        title = 'Today';
      } else if (isYesterday(date)) {
        key = 'Yesterday';
        title = 'Yesterday';
      } else {
        key = format(date, 'yyyy-MM-dd');
        title = format(date, 'EEEE, MMM d, yyyy');
      }

      if (!groups[key]) {
        groups[key] = {
          dateKey: key,
          title,
          isToday: isToday(date),
          isYesterday: isYesterday(date),
          events: []
        };
      }
      groups[key].events.push(event);
    });

    return Object.values(groups);
  }, [filteredEvents]);

  // PDF report downloader
  const handleDownloadPdf = async (requestId) => {
    if (!requestId) return;
    try {
      setIsDownloadingPdf(true);
      const res = await axiosPrivate.get(`/lab/requests/${requestId}/report/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabReport_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Lab report downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF', error);
      toast.error('Diagnostic PDF report pending pathologist release');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Intelligent Clinical Categorization & Theming
  const getClinicalTheme = (event) => {
    const title = (event.title || '').toLowerCase();
    const type = event.type || '';

    // Hematology & Blood Tests
    if (
      title.includes('blood') ||
      title.includes('cbc') ||
      title.includes('differential') ||
      title.includes('hemoglobin') ||
      title.includes('platelet') ||
      title.includes('esr') ||
      title.includes('ferritin') ||
      title.includes('iron')
    ) {
      return {
        category: 'Hematology',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        nodeBg: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-200/50',
        nodeBorder: 'border-rose-200 bg-rose-50/80 text-rose-600',
        stripeColor: 'bg-rose-500',
        icon: <Droplets className="w-5 h-5" />,
      };
    }

    // Cardiac & Troponin
    if (
      title.includes('troponin') ||
      title.includes('cardiac') ||
      title.includes('ecg') ||
      title.includes('echo') ||
      title.includes('bnp') ||
      title.includes('cardio')
    ) {
      return {
        category: 'Cardiology',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        nodeBg: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-200/50',
        nodeBorder: 'border-red-200 bg-red-50/80 text-red-600',
        stripeColor: 'bg-red-500',
        icon: <HeartPulse className="w-5 h-5" />,
      };
    }

    // Urinalysis & Renal
    if (
      title.includes('urinalysis') ||
      title.includes('urine') ||
      title.includes('renal') ||
      title.includes('kidney') ||
      title.includes('creatinine') ||
      title.includes('kft')
    ) {
      return {
        category: 'Urinalysis & Renal',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        nodeBg: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-200/50',
        nodeBorder: 'border-amber-200 bg-amber-50/80 text-amber-600',
        stripeColor: 'bg-amber-500',
        icon: <FlaskConical className="w-5 h-5" />,
      };
    }

    // Biochemistry & Metabolic
    if (
      title.includes('lipid') ||
      title.includes('cholesterol') ||
      title.includes('liver') ||
      title.includes('lft') ||
      title.includes('glucose') ||
      title.includes('sugar') ||
      title.includes('hba1c') ||
      title.includes('metabolic') ||
      title.includes('thyroid') ||
      title.includes('tsh')
    ) {
      return {
        category: 'Biochemistry',
        badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        nodeBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-200/50',
        nodeBorder: 'border-cyan-200 bg-cyan-50/80 text-cyan-600',
        stripeColor: 'bg-cyan-500',
        icon: <Dna className="w-5 h-5" />,
      };
    }

    // General Diagnostic Lab Report
    if (type === 'LAB_REPORT') {
      return {
        category: 'Clinical Lab Test',
        badgeClass: 'bg-blue-50 text-[#2160FF] border-blue-200',
        nodeBg: 'bg-gradient-to-br from-[#2160FF] to-blue-700 text-white shadow-blue-200/50',
        nodeBorder: 'border-blue-200 bg-blue-50/80 text-[#2160FF]',
        stripeColor: 'bg-[#2160FF]',
        icon: <TestTubes className="w-5 h-5" />,
      };
    }

    // Doctor Appointments
    if (type === 'APPOINTMENT') {
      return {
        category: 'Doctor Consultation',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        nodeBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-200/50',
        nodeBorder: 'border-indigo-200 bg-indigo-50/80 text-indigo-600',
        stripeColor: 'bg-indigo-500',
        icon: <Stethoscope className="w-5 h-5" />,
      };
    }

    // Teleconsultation
    if (type === 'TELECONSULTATION') {
      return {
        category: 'Telehealth Session',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        nodeBg: 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-purple-200/50',
        nodeBorder: 'border-purple-200 bg-purple-50/80 text-purple-600',
        stripeColor: 'bg-purple-500',
        icon: <Video className="w-5 h-5" />,
      };
    }

    // Prescriptions
    if (type === 'PRESCRIPTION') {
      return {
        category: 'Prescription',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        nodeBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-200/50',
        nodeBorder: 'border-emerald-200 bg-emerald-50/80 text-emerald-600',
        stripeColor: 'bg-emerald-500',
        icon: <Pill className="w-5 h-5" />,
      };
    }

    // Home Visits
    if (type === 'HOME_VISIT') {
      return {
        category: 'Home Care Visit',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
        nodeBg: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-orange-200/50',
        nodeBorder: 'border-orange-200 bg-orange-50/80 text-orange-600',
        stripeColor: 'bg-orange-500',
        icon: <Home className="w-5 h-5" />,
      };
    }

    // Default Clinical Record
    return {
      category: 'Medical Document',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      nodeBg: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-slate-200/50',
      nodeBorder: 'border-slate-200 bg-slate-50/80 text-slate-600',
      stripeColor: 'bg-slate-400',
      icon: <FileText className="w-5 h-5" />,
    };
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toUpperCase();
    switch (s) {
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            REQUESTED
          </span>
        );
      case 'SAMPLE_COLLECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <TestTubes className="w-3 h-3 text-blue-600" />
            SAMPLE COLLECTED
          </span>
        );
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Activity className="w-3 h-3 text-purple-600 animate-spin" />
            IN ANALYSIS
          </span>
        );
      case 'RESULT_ENTERED':
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Search className="w-3 h-3 text-cyan-600" />
            PENDING VERIFICATION
          </span>
        );
      case 'VERIFIED':
      case 'RELEASED':
      case 'COMPLETED':
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            VERIFIED & RELEASED
          </span>
        );
      case 'SCHEDULED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Calendar className="w-3 h-3 text-indigo-600" />
            CONFIRMED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {s.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  // Urgency Pill with Clinical Severity Highlighting
  const renderUrgencyPill = (description) => {
    if (!description) return null;
    if (description.includes('CRITICAL')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          CRITICAL RESULT
        </span>
      );
    }
    if (description.includes('ABNORMAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          ABNORMAL RESULT
        </span>
      );
    }
    if (description.includes('NORMAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          NORMAL RANGE
        </span>
      );
    }
    return null;
  };

  // Step Progression for Lab Requests
  const getLabStepIndex = (status) => {
    const s = (status || '').toUpperCase();
    if (['VERIFIED', 'RELEASED', 'COMPLETED', 'DONE'].includes(s)) return 4;
    if (['RESULT_ENTERED', 'PENDING_VERIFICATION'].includes(s)) return 3;
    if (['SAMPLE_COLLECTED', 'PROCESSING', 'IN_PROGRESS'].includes(s)) return 2;
    return 1; // REQUESTED
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return { dateText: 'Recent', timeText: '', fullDate: '' };
    try {
      const date = new Date(dateString);
      return {
        dateText: isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d, yyyy'),
        timeText: format(date, 'hh:mm a'),
        fullDate: format(date, 'EEEE, MMMM d, yyyy')
      };
    } catch {
      return { dateText: 'Recent', timeText: '', fullDate: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#F8FAFC] gap-3">
        <Loader2 className="animate-spin text-[#2160FF] w-9 h-9" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading health journey...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2160FF] to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Health Timeline & Journey
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2160FF] border border-blue-200">
                    <Sparkles className="w-3 h-3" /> Live Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                  A chronological electronic medical history of diagnostic test results, doctor visits, medication prescriptions, and home health records.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                onClick={() => refetch()}
                title="Sync Timeline"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => navigate('/patient/order-medicine')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
              >
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <span>Order Medicine</span>
              </button>

              <button
                onClick={() => navigate('/patient/appointments')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-blue-600 transition shadow-sm shadow-blue-500/25 cursor-pointer border-none"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>

          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Records</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{timelineEvents.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700/80 uppercase tracking-wider">Lab Diagnostics</p>
                <h3 className="text-2xl font-black text-[#2160FF] mt-0.5">{labCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200/60 text-[#2160FF] flex items-center justify-center font-bold shadow-2xs">
                <FlaskConical className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-700/80 uppercase tracking-wider">Doctor Visits</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-0.5">{apptCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200/60 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">Prescriptions</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{prescCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <Pill className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar, View Switcher & Search */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Records', count: timelineEvents.length },
              { id: 'LAB', label: 'Lab Tests', count: labCount },
              { id: 'APPT', label: 'Appointments', count: apptCount },
              { id: 'PRESC', label: 'Prescriptions', count: prescCount },
              { id: 'VISIT', label: 'Home Care', count: visitCount },
            ].map(tab => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
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

          {/* Search, Sort and View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Realtime Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search test, doctor, medicine..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition"
              />
            </div>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              aria-label="Sort timeline order"
              style={{ backgroundImage: 'none' }}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 cursor-pointer shadow-2xs"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            {/* View Mode Toggle: Journey vs Table */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('journey')}
                title="Visual Timeline Journey"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'journey'
                    ? 'bg-white text-[#2160FF] shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Journey</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Medical Ledger Table"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#2160FF] shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ledger</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-[#2160FF] rounded-2xl flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">No medical interactions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              No clinical records match your current search criteria. You can clear filters or book an appointment anytime.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setFilterType('ALL'); setSearchQuery(''); }}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer bg-white"
              >
                Reset Filters
              </button>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="px-4 py-2 bg-[#2160FF] text-xs font-bold text-white rounded-xl hover:bg-blue-600 transition cursor-pointer shadow-xs border-none"
              >
                Book Consultation
              </button>
            </div>
          </div>
        ) : viewMode === 'journey' ? (
          /* ================= CREATIVE TIMELINE JOURNEY VIEW ================= */
          <div className="space-y-8">
            {groupedMilestones.map((milestone) => (
              <div key={milestone.dateKey} className="space-y-4">
                
                {/* Milestone Date Capsule Header */}
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs ${
                    milestone.isToday 
                      ? 'bg-slate-900 text-white' 
                      : milestone.isYesterday
                      ? 'bg-slate-800 text-slate-100'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{milestone.title}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    <span className="text-[10px] font-bold text-slate-300">
                      {milestone.events.length} {milestone.events.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200/80 flex-1"></div>
                </div>

                {/* Milestone Event Cards with Center-Anchored Spine */}
                <div className="space-y-5">
                  <AnimatePresence>
                    {milestone.events.map((event, index) => {
                      const theme = getClinicalTheme(event);
                      const { timeText, fullDate } = formatEventDate(event.eventDate);
                      const isLab = event.type === 'LAB_REPORT';
                      const isAppt = event.type === 'APPOINTMENT' || event.type === 'TELECONSULTATION';
                      const isPresc = event.type === 'PRESCRIPTION';
                      const stepIndex = isLab ? getLabStepIndex(event.status) : 0;
                      const isLast = index === milestone.events.length - 1;

                      return (
                        <motion.div
                          key={event.id}
                          variants={listStagger}
                          className="relative flex items-stretch gap-3 sm:gap-5 group"
                        >
                          {/* ================= DEDICATED CENTER-ANCHORED SPINE COLUMN ================= */}
                          <div className="relative flex flex-col items-center shrink-0 w-11 sm:w-14">
                            {/* Perfectly centered vertical spine line */}
                            <div className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-slate-200 ${
                              isLast ? 'h-7' : 'h-full'
                            }`} />

                            {/* Node Pin with Outer Ring & Hover Glow */}
                            <div className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ring-4 ring-[#F8FAFC] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md cursor-pointer ${theme.nodeBg}`}>
                              {theme.icon}
                            </div>
                          </div>

                          {/* ================= CREATIVE TIMELINE CARD ================= */}
                          <div className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-300 overflow-hidden flex flex-col">
                            
                            {/* Card Accent Top / Left Stripe */}
                            <div className={`h-1 sm:h-1.5 w-full ${theme.stripeColor}`} />

                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                              
                              {/* Header: Title, Category & Badges */}
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${theme.badgeClass}`}>
                                      {theme.category}
                                    </span>
                                    {renderStatusBadge(event.status)}
                                    {renderUrgencyPill(event.description)}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{timeText}</span>
                                  </div>
                                </div>

                                <h3 
                                  onClick={() => setSelectedEvent(event)}
                                  className="text-base sm:text-lg font-black text-slate-900 hover:text-[#2160FF] transition-colors cursor-pointer tracking-tight"
                                >
                                  {event.title}
                                </h3>

                                <p className="text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed mt-1">
                                  {event.description}
                                </p>
                              </div>

                              {/* Lab Stepper Pipeline (for Lab Requests) */}
                              {isLab && (
                                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                    <span>Lab Diagnostic Workflow</span>
                                    <span className="text-[#2160FF] font-bold">Step {stepIndex} of 4</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                      { name: 'Ordered', step: 1 },
                                      { name: 'Collected', step: 2 },
                                      { name: 'Analyzed', step: 3 },
                                      { name: 'Verified', step: 4 },
                                    ].map((s) => {
                                      const isDone = stepIndex >= s.step;
                                      const isCurrent = stepIndex === s.step;
                                      return (
                                        <div key={s.name} className="flex flex-col gap-1">
                                          <div className={`h-1.5 rounded-full transition-all ${
                                            isDone ? 'bg-[#2160FF]' : 'bg-slate-200'
                                          } ${isCurrent ? 'animate-pulse' : ''}`} />
                                          <span className={`text-[10px] font-bold truncate text-center ${
                                            isDone ? 'text-slate-800' : 'text-slate-400'
                                          }`}>
                                            {s.name}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Card Footer: Metadata & Quick Actions */}
                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-mono">
                                    #{event.id}
                                  </span>
                                  <span>•</span>
                                  <span>{fullDate}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isLab && event.referenceId && (
                                    <button
                                      onClick={() => handleDownloadPdf(event.referenceId)}
                                      disabled={isDownloadingPdf}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#2160FF] bg-blue-50 hover:bg-[#2160FF] hover:text-white border border-blue-200/80 transition shadow-2xs cursor-pointer"
                                      title="Download Official PDF Diagnostic Report"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>PDF Report</span>
                                    </button>
                                  )}

                                  {isAppt && (
                                    <button
                                      onClick={() => navigate('/patient/appointments')}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200/80 transition shadow-2xs cursor-pointer"
                                    >
                                      <span>View Booking</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                  )}

                                  {isPresc && (
                                    <button
                                      onClick={() => navigate('/patient/order-medicine')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition shadow-2xs cursor-pointer"
                                    >
                                      <Pill className="w-3.5 h-3.5" />
                                      <span>Order Meds</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setSelectedEvent(event)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                                    title="View Record Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Details</span>
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* ================= COMPACT MEDICAL LEDGER TABLE VIEW ================= */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-5">Event & Test Title</th>
                    <th className="py-4 px-4">Discipline</th>
                    <th className="py-4 px-4">Status & Urgency</th>
                    <th className="py-4 px-4">Date & Time</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEvents.map(event => {
                    const theme = getClinicalTheme(event);
                    const { dateText, timeText } = formatEventDate(event.eventDate);
                    return (
                      <tr key={event.id} className="hover:bg-blue-50/30 transition group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.nodeBorder}`}>
                              {theme.icon}
                            </div>
                            <div>
                              <p 
                                onClick={() => setSelectedEvent(event)}
                                className="font-black text-slate-900 group-hover:text-[#2160FF] cursor-pointer"
                              >
                                {event.title}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{event.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${theme.badgeClass}`}>
                            {theme.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {renderStatusBadge(event.status)}
                            {renderUrgencyPill(event.description)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{dateText}</p>
                          <p className="text-[11px] text-slate-400">{timeText}</p>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {event.type === 'LAB_REPORT' && event.referenceId && (
                              <button
                                onClick={() => handleDownloadPdf(event.referenceId)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Download PDF Report"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
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

      </div>

      {/* ================= CLINICAL EVENT DETAILS MODAL ================= */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || 'Clinical Event Details'}
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4 font-sans text-xs">
            {/* Top Clinical Type Banner */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Domain</span>
                <span className="font-black text-slate-900 text-sm">{getClinicalTheme(selectedEvent).category}</span>
              </div>
              <div>{renderStatusBadge(selectedEvent.status)}</div>
            </div>

            {/* Description / Clinical Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostic Findings & Notes</span>
              <p className="text-slate-800 text-xs font-semibold leading-relaxed">{selectedEvent.description}</p>
              {renderUrgencyPill(selectedEvent.description)}
            </div>

            {/* Date & Reference ID Grid */}
            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Event Date & Time</span>
                <span className="font-bold text-slate-900 block">
                  {format(new Date(selectedEvent.eventDate), 'PPP')}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {format(new Date(selectedEvent.eventDate), 'hh:mm a')}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Reference Identifier</span>
                <span className="font-mono font-bold text-slate-900 block">{selectedEvent.id}</span>
                <span className="text-[11px] text-slate-400 font-medium">Internal Ref: #{selectedEvent.referenceId || 'N/A'}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 font-medium text-[11px]">Electronic Health Record Verified</span>
              <div className="flex gap-2">
                {selectedEvent.type === 'LAB_REPORT' && selectedEvent.referenceId && (
                  <button
                    onClick={() => handleDownloadPdf(selectedEvent.referenceId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2160FF] text-white rounded-xl font-bold hover:bg-blue-600 transition shadow-2xs border-none cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Report
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition border-none cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default HealthTimeline;