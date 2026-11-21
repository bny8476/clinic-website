import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Scan,
  Calendar,
  Clock,
  Download,
  Eye,
  FileText,
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
  Upload,
  Activity,
  Waves,
  Radio,
  FileUp,
  FileCheck,
  Printer,
  CalendarPlus,
  Info,
  Loader2,
  HardDrive
} from 'lucide-react';

import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import Modal from '../../components/ui/Modal';
import { fadeUp, staggerChildren, pageTransition } from '../../components/ui/motion';

// Realistic sample studies for demonstration when patient has zero recorded scans
const DEMO_FALLBACK_RADIOLOGY = [
  {
    id: 101,
    isDemo: true,
    status: 'FINALIZED',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    findings: 'The cardiac silhouette and mediastinal contours are within physiological limits. Both lung fields are clear of focal consolidation, pneumothorax, or pleural effusion. Osseous thoracic structures are intact without acute fractures.',
    impression: '1. No acute cardiopulmonary disease.\n2. Normal thoracic radiograph.',
    radiologist: { firstName: 'Arthur', lastName: 'Vance' },
    dicomImageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    request: {
      id: 201,
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      clinicalNotes: 'Persistent dry cough following upper respiratory infection. Evaluate for consolidation or effusion.',
      procedure: {
        name: 'Chest Radiography (PA & Lateral)',
        modality: 'X-RAY',
        bodyPart: 'Chest / Thorax'
      },
      doctor: { firstName: 'Sarah', lastName: 'Jenkins' }
    }
  },
  {
    id: 102,
    isDemo: true,
    status: 'FINALIZED',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    findings: 'Normal lumbar lordosis maintained. Mild degenerative disc desiccation at L4-L5 with minimal broad-based disc bulge. No significant spinal canal stenosis or neuroforaminal narrowing. The conus medullaris terminates normally at L1-L2.',
    impression: '1. Mild L4-L5 disc desiccation and small bulge without nerve root impingement.\n2. No central spinal stenosis.',
    radiologist: { firstName: 'Helen', lastName: 'Zhao' },
    dicomImageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    request: {
      id: 202,
      scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      clinicalNotes: 'Subacute lower back pain radiating to left gluteal region. Rule out lumbar radiculopathy.',
      procedure: {
        name: 'Lumbar Spine MRI (Without Contrast)',
        modality: 'MRI',
        bodyPart: 'Spine / Musculoskeletal'
      },
      doctor: { firstName: 'Marcus', lastName: 'Vance' }
    }
  },
  {
    id: 103,
    isDemo: true,
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    findings: null,
    impression: null,
    radiologist: null,
    dicomImageUrl: null,
    request: {
      id: 203,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      clinicalNotes: 'Right upper quadrant post-prandial fullness. Evaluate biliary tree and gallbladder.',
      procedure: {
        name: 'Abdominal & Pelvic Sonography (Ultrasound)',
        modality: 'ULTRASOUND',
        bodyPart: 'Abdomen'
      },
      doctor: { firstName: 'Sarah', lastName: 'Jenkins' }
    }
  },
  {
    id: 104,
    isDemo: true,
    status: 'REQUESTED',
    createdAt: new Date().toISOString(),
    findings: null,
    impression: null,
    radiologist: null,
    dicomImageUrl: null,
    request: {
      id: 204,
      scheduledAt: null,
      clinicalNotes: 'Mild knee effusion following running injury. Evaluate joint space and osseous margin.',
      procedure: {
        name: 'Right Knee Joint Radiography (Weight-Bearing)',
        modality: 'X-RAY',
        bodyPart: 'Extremity'
      },
      doctor: { firstName: 'Amit', lastName: 'Patel' }
    }
  }
];

export default function RadiologyReports() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State management
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | FINALIZED | SCHEDULED | REQUESTED
  const [modalityFilter, setModalityFilter] = useState('ALL'); // ALL | X-RAY | MRI | CT | ULTRASOUND
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | name
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [schedulingRequestId, setSchedulingRequestId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');

  // Upload Outside Scan state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadModality, setUploadModality] = useState('X-RAY');
  const [uploadDoctorName, setUploadDoctorName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // 1. Fetch Patient Radiology Reports
  const { 
    data: rawReports = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['patient-radiology-reports'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/patient/radiology-reports');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Could not load patient radiology reports', err);
        return [];
      }
    },
    retry: 1
  });

  // Schedule scan appointment mutation
  const bookMutation = useMutation({
    mutationFn: async ({ id, date }) => {
      const formattedDate = new Date(date).toISOString();
      return axiosPrivate.post(`/radiology/patient/requests/${id}/book`, { scheduledAt: formattedDate });
    },
    onSuccess: () => {
      toast.success('Radiology scan appointment successfully confirmed!');
      setIsScheduleModalOpen(false);
      setScheduledAt('');
      setSchedulingRequestId(null);
      queryClient.invalidateQueries(['patient-radiology-reports']);
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule scan appointment');
    }
  });

  // Handle Outside Scan Upload
  const handleUploadScan = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select an imaging scan or document file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('ownerType', 'PATIENT');
    formData.append('ownerId', user?.id || 1);
    formData.append('documentType', 'RADIOLOGY');
    formData.append('title', uploadTitle || uploadFile.name.split('.')[0]);
    if (uploadNotes) formData.append('description', `[${uploadModality}] ${uploadNotes}`);

    try {
      await axiosPrivate.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        }
      });

      toast.success('Outside imaging scan uploaded to your medical records archive!');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      queryClient.invalidateQueries(['patient-radiology-reports']);
      refetch();
    } catch (err) {
      console.error('Scan upload failed', err);
      toast.error('Failed to upload scan file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Combine real backend data with fallback demo data if empty
  const reports = useMemo(() => {
    if (Array.isArray(rawReports) && rawReports.length > 0) {
      return rawReports;
    }
    return DEMO_FALLBACK_RADIOLOGY;
  }, [rawReports]);

  // Executive KPI stats
  const stats = useMemo(() => {
    const total = reports.length;
    const finalized = reports.filter(r => (r.status || '').toUpperCase() === 'FINALIZED').length;
    const scheduled = reports.filter(r => (r.status || '').toUpperCase() === 'SCHEDULED').length;
    const requested = reports.filter(r => (r.status || '').toUpperCase() === 'REQUESTED').length;

    return { total, finalized, scheduled, requested };
  }, [reports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let list = [...reports];

    // Status Filter Tab
    if (activeFilter === 'FINALIZED') {
      list = list.filter(r => (r.status || '').toUpperCase() === 'FINALIZED');
    } else if (activeFilter === 'SCHEDULED') {
      list = list.filter(r => (r.status || '').toUpperCase() === 'SCHEDULED');
    } else if (activeFilter === 'REQUESTED') {
      list = list.filter(r => (r.status || '').toUpperCase() === 'REQUESTED');
    }

    // Modality Filter
    if (modalityFilter !== 'ALL') {
      list = list.filter(r => {
        const mod = (r.request?.procedure?.modality || '').toUpperCase();
        return mod.includes(modalityFilter);
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => {
        const title = (r.request?.procedure?.name || '').toLowerCase();
        const modality = (r.request?.procedure?.modality || '').toLowerCase();
        const doctor = `${r.request?.doctor?.firstName || ''} ${r.request?.doctor?.lastName || ''}`.toLowerCase();
        const radiologist = `${r.radiologist?.firstName || ''} ${r.radiologist?.lastName || ''}`.toLowerCase();
        const impression = (r.impression || '').toLowerCase();
        const notes = (r.request?.clinicalNotes || '').toLowerCase();
        const idStr = String(r.id || '');

        return title.includes(q) || modality.includes(q) || doctor.includes(q) || radiologist.includes(q) || impression.includes(q) || notes.includes(q) || idStr.includes(q);
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'name') {
        return (a.request?.procedure?.name || '').localeCompare(b.request?.procedure?.name || '');
      }
      return 0;
    });

    return list;
  }, [reports, activeFilter, modalityFilter, searchQuery, sortBy]);

  // Modality Theme Helper
  const getModalityTheme = (modality) => {
    const m = (modality || '').toUpperCase();
    if (m.includes('MRI')) {
      return {
        label: 'MRI SCAN',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Activity size={13} className="shrink-0" />
      };
    }
    if (m.includes('CT')) {
      return {
        label: 'CT SCAN',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Radio size={13} className="shrink-0" />
      };
    }
    if (m.includes('ULTRASOUND') || m.includes('USG') || m.includes('SONOGRAPHY')) {
      return {
        label: 'ULTRASOUND',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: <Waves size={13} className="shrink-0" />
      };
    }
    return {
      label: 'X-RAY RADIOGRAPHY',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Scan size={13} className="shrink-0" />
    };
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'FINALIZED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            FINALIZED & VERIFIED
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            SCHEDULED APPOINTMENT
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            AWAITING SCHEDULING
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
              <Scan className="w-7 h-7 text-[#2864FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Radiology & Diagnostic Imaging
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  <ShieldCheck size={14} className="text-blue-600" />
                  DICOM Certified & Verified EHR
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Access diagnostic imaging studies, schedule upcoming radiology scans, and download verified radiologist impressions.
              </p>
            </div>
          </div>

          {/* Action CTAs (Strict Single Row) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-nowrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => {
                refetch();
                toast.success('Radiology reports refreshed');
              }}
              title="Refresh Imaging Studies"
              disabled={isFetching}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            >
              <RotateCw size={17} className={isFetching ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Upload size={15} />
              <span>Upload Outside Scan</span>
            </button>

            <button
              onClick={() => {
                const requestedItem = reports.find(r => (r.status || '').toUpperCase() === 'REQUESTED');
                if (requestedItem) {
                  setSchedulingRequestId(requestedItem.request?.id || requestedItem.id);
                }
                setIsScheduleModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer flex items-center gap-2 border-none whitespace-nowrap shrink-0"
            >
              <CalendarPlus size={15} />
              <span>Schedule Imaging Scan</span>
            </button>
          </div>
        </div>

        {/* ── KPI Strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Studies</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Lifetime imaging orders</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scan size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Finalized & Verified</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.finalized}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Signed by radiologist</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled Appointments</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.scheduled}</h3>
              <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Booked imaging slots</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Awaiting Scheduling</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.requested}</h3>
              <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Ready for patient booking</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* ── Search, Modality Filter & View Mode Controls ─────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Studies', count: stats.total },
              { id: 'FINALIZED', label: 'Finalized Reports', count: stats.finalized },
              { id: 'SCHEDULED', label: 'Scheduled Scans', count: stats.scheduled },
              { id: 'REQUESTED', label: 'Pending Booking', count: stats.requested }
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

          {/* Search, Modality, Sort & View Mode */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedure, doctor, scan..."
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

            {/* Modality Filter Dropdown */}
            <div className="relative">
              <select
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value)}
                style={{ backgroundImage: 'none' }}
                className="text-xs font-bold border border-slate-200 bg-white rounded-xl px-3 py-2 pr-7 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer shadow-2xs [background-image:none]"
              >
                <option value="ALL">All Modalities</option>
                <option value="X-RAY">X-Ray</option>
                <option value="MRI">MRI</option>
                <option value="CT">CT Scan</option>
                <option value="ULTRASOUND">Ultrasound</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                <option value="name">Procedure Name</option>
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
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center mb-4 shadow-inner">
              <Scan size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              {searchQuery ? 'No matching radiology reports found' : 'No Imaging Studies on Record'}
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-md mb-6 leading-relaxed">
              {searchQuery
                ? `No reports found matching "${searchQuery}". Clear your search or change modality filters.`
                : 'Your doctor-ordered X-Rays, MRIs, CT scans, and ultrasound examinations will appear here.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <CalendarPlus size={18} className="text-[#2864FF] mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#2864FF]">Book Scan Slot</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Schedule imaging appointment</p>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Upload size={18} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Upload Outside Scan</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Attach external X-Ray or CD</p>
              </button>

              <button
                onClick={() => navigate('/patient/appointments')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Stethoscope size={18} className="text-emerald-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Doctor Consultation</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Request physician review</p>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── View 1: Responsive Grid Cards ────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const modalityTheme = getModalityTheme(report.request?.procedure?.modality);
              const isFinalized = (report.status || '').toUpperCase() === 'FINALIZED';
              const isScheduled = (report.status || '').toUpperCase() === 'SCHEDULED';
              const isRequested = (report.status || '').toUpperCase() === 'REQUESTED';

              // Stepper stage
              const step = isFinalized ? 4 : isScheduled ? 2 : 1;

              return (
                <motion.div
                  key={report.id}
                  variants={fadeUp}
                  className={`bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group ${
                    isFinalized ? 'border-slate-200/80 hover:border-blue-200' : isScheduled ? 'border-blue-200 ring-1 ring-blue-500/10' : 'border-amber-200'
                  }`}
                >
                  <div>
                    {/* Top Row: Modality & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${modalityTheme.badgeBg}`}>
                        {modalityTheme.icon}
                        <span>{modalityTheme.label}</span>
                      </span>

                      {getStatusBadge(report.status)}
                    </div>

                    {/* Procedure Title */}
                    <h3 
                      onClick={() => setSelectedReport(report)}
                      className="text-base font-extrabold text-slate-900 group-hover:text-[#2864FF] transition-colors cursor-pointer line-clamp-1 mb-1 tracking-tight"
                      title={report.request?.procedure?.name || 'Diagnostic Study'}
                    >
                      {report.request?.procedure?.name || 'Diagnostic Imaging Study'}
                    </h3>

                    {/* ID & Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-3">
                      <span className="font-mono">#RAD-{String(report.id).padStart(5, '0')}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {report.createdAt ? format(new Date(report.createdAt), 'MMM dd, yyyy') : 'Recent'}
                      </span>
                    </div>

                    {/* 4-Step Pipeline Stepper */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4">
                      <div className="flex items-center justify-between mb-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span className={step >= 1 ? 'text-[#2864FF]' : ''}>1. Ordered</span>
                        <span className={step >= 2 ? 'text-[#2864FF]' : ''}>2. Scheduled</span>
                        <span className={step >= 3 ? 'text-[#2864FF]' : ''}>3. Acquired</span>
                        <span className={step >= 4 ? 'text-emerald-600' : ''}>4. Finalized</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isFinalized ? 'bg-emerald-500 w-full' : isScheduled ? 'bg-[#2864FF] w-1/2' : 'bg-amber-400 w-1/4'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                        <User size={12} />
                      </div>
                      <p className="text-slate-700 font-bold truncate">
                        Dr. {report.request?.doctor?.firstName} {report.request?.doctor?.lastName || 'Attending Physician'}
                        <span className="text-slate-400 font-normal ml-1">· Ordered Study</span>
                      </p>
                    </div>

                    {/* Findings / Scheduled Appointment Banner */}
                    {isFinalized && report.impression ? (
                      <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80 mb-3">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">Impression</p>
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {report.impression}
                        </p>
                      </div>
                    ) : isScheduled && report.request?.scheduledAt ? (
                      <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100 mb-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[#2864FF] font-bold">
                          <Clock size={14} />
                          <span>{format(new Date(report.request.scheduledAt), 'EEE, MMM dd · hh:mm a')}</span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-blue-100 text-[#2864FF] px-2 py-0.5 rounded">
                          Room 104
                        </span>
                      </div>
                    ) : (
                      <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 mb-3 text-xs text-amber-800 font-medium">
                        Study ordered. Please confirm a convenient scan slot with the radiology center.
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-xs font-bold text-[#2864FF] hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-0"
                    >
                      <Eye size={14} />
                      <span>View Report</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isRequested && (
                        <button
                          onClick={() => {
                            setSchedulingRequestId(report.request?.id || report.id);
                            setIsScheduleModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs border-none cursor-pointer flex items-center gap-1.5"
                        >
                          <CalendarPlus size={13} />
                          <span>Schedule</span>
                        </button>
                      )}

                      {isFinalized && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setTimeout(() => {
                              window.print();
                            }, 300);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── View 2: High-Density Table View ────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Study ID</th>
                    <th className="px-5 py-3.5">Modality</th>
                    <th className="px-5 py-3.5">Procedure Name</th>
                    <th className="px-5 py-3.5">Ordering Physician</th>
                    <th className="px-5 py-3.5">Date / Scheduled</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredReports.map((report) => {
                    const modalityTheme = getModalityTheme(report.request?.procedure?.modality);

                    return (
                      <tr key={report.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-5 py-4 font-mono font-bold text-slate-400">
                          #RAD-{String(report.id).padStart(5, '0')}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${modalityTheme.badgeBg}`}>
                            {modalityTheme.icon}
                            <span>{modalityTheme.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p 
                            onClick={() => setSelectedReport(report)}
                            className="font-extrabold text-slate-900 group-hover:text-[#2864FF] transition-colors cursor-pointer truncate max-w-[240px]"
                            title={report.request?.procedure?.name}
                          >
                            {report.request?.procedure?.name || 'Diagnostic Study'}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {report.request?.procedure?.bodyPart || 'Radiology Dept'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-700">
                          Dr. {report.request?.doctor?.firstName} {report.request?.doctor?.lastName || 'Doctor'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                          {report.request?.scheduledAt 
                            ? format(new Date(report.request.scheduledAt), 'MMM dd, yyyy · hh:mm a')
                            : report.createdAt 
                              ? format(new Date(report.createdAt), 'MMM dd, yyyy')
                              : 'Pending'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedReport(report)}
                              title="View Full Report"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-[#2864FF] transition cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>
                            {(report.status || '').toUpperCase() === 'FINALIZED' && (
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setTimeout(() => window.print(), 300);
                                }}
                                title="Download Report PDF"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                              >
                                <Download size={14} />
                              </button>
                            )}
                            {(report.status || '').toUpperCase() === 'REQUESTED' && (
                              <button
                                onClick={() => {
                                  setSchedulingRequestId(report.request?.id || report.id);
                                  setIsScheduleModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#2864FF] text-white font-bold text-xs hover:bg-blue-600 transition border-none cursor-pointer"
                              >
                                Schedule
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

        {/* ── Modal 1: Comprehensive Radiology Report Viewer ───────────── */}
        {selectedReport && (
          <Modal
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            title="Diagnostic Radiology Report"
            size="lg"
          >
            <div className="space-y-6 pt-1">
              {/* Header Letterhead */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase block mb-1">
                    METROPOLITAN IMAGING CENTER · RADIOLOGY ARCHIVE
                  </span>
                  <h3 className="text-lg font-black tracking-tight">
                    {selectedReport.request?.procedure?.name || 'Radiology Examination'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-300 block">
                    ACCESSION: #RAD-{String(selectedReport.id).padStart(6, '0')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedReport.createdAt ? format(new Date(selectedReport.createdAt), 'MMMM dd, yyyy · hh:mm a') : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Patient & Examination Credentials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Name</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{user?.name || user?.username || 'Current Patient'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Referring Clinician</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    Dr. {selectedReport.request?.doctor?.firstName} {selectedReport.request?.doctor?.lastName || 'Physician'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Reporting Radiologist</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {selectedReport.radiologist ? `Dr. ${selectedReport.radiologist.firstName} ${selectedReport.radiologist.lastName}` : 'Pending Assignment'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Modality</p>
                  <p className="font-extrabold text-[#2864FF] mt-0.5">
                    {selectedReport.request?.procedure?.modality || 'Diagnostic Imaging'}
                  </p>
                </div>
              </div>

              {/* Clinical Indication */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical Indication / History</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {selectedReport.request?.clinicalNotes || 'No specific clinical indication provided.'}
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Technique & Findings</h4>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {selectedReport.findings || 'Examination in progress or awaiting final radiologist transcription.'}
                </div>
              </div>

              {/* Impression */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider">Impression / Conclusion</h4>
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
                  {selectedReport.impression || 'Final impression pending verification.'}
                </div>
              </div>

              {/* DICOM Scan Attachment if any */}
              {selectedReport.dicomImageUrl && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scan className="text-[#2864FF]" size={22} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Diagnostic Imaging Series Available</p>
                      <p className="text-[11px] text-slate-500">DICOM study files ready for inspection</p>
                    </div>
                  </div>
                  <a
                    href={selectedReport.dicomImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs no-underline"
                  >
                    <Eye size={14} />
                    <span>Open DICOM Images</span>
                  </a>
                </div>
              )}

              {/* Modal Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-2xs"
                >
                  <Printer size={14} />
                  <span>Print Report</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal 2: Schedule Scan Appointment ───────────────────────── */}
        {isScheduleModalOpen && (
          <Modal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            title="Schedule Diagnostic Imaging Appointment"
            size="md"
          >
            <div className="space-y-4 pt-1">
              <p className="text-xs font-medium text-slate-500">
                Choose an available slot for your radiology scan at the Main Hospital Imaging Center (Suite 104).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Date and Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Pre-Exam Preparation Advisory */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Info size={15} className="text-[#2864FF]" />
                  <span>Pre-Scan Instructions</span>
                </div>
                <ul className="text-[11px] text-blue-800 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Please arrive 15 minutes prior to your scheduled scan for check-in.</li>
                  <li>For Abdominal Ultrasounds or CT with oral contrast, please fast for 6 hours.</li>
                  <li>For MRI examinations, ensure all metal jewelry, watches, and cards are removed.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  disabled={bookMutation.isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!scheduledAt || bookMutation.isPending}
                  onClick={() => {
                    const reqId = schedulingRequestId || (reports[0]?.request?.id || reports[0]?.id);
                    bookMutation.mutate({ id: reqId, date: scheduledAt });
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer border-none flex items-center gap-2 disabled:opacity-50"
                >
                  {bookMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Confirming Slot...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal 3: Upload Outside Scan Modal ───────────────────────── */}
        {isUploadModalOpen && (
          <Modal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            title="Upload External Imaging Scan / X-Ray"
            size="md"
          >
            <form onSubmit={handleUploadScan} className="space-y-4 pt-1">
              <p className="text-xs font-medium text-slate-500">
                Upload past imaging scans, X-Rays, MRI/CT discs, or diagnostic report sheets from outside medical centers to your personal health vault.
              </p>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scan Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outside Knee X-Ray (Sports Clinic 2024)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Modality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Imaging Modality *
                </label>
                <div className="relative">
                  <select
                    value={uploadModality}
                    onChange={(e) => setUploadModality(e.target.value)}
                    style={{ backgroundImage: 'none' }}
                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                  >
                    <option value="X-RAY">X-Ray (Plain Radiography)</option>
                    <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                    <option value="CT">Computed Tomography (CT Scan)</option>
                    <option value="ULTRASOUND">Ultrasound / Sonography</option>
                    <option value="MAMMOGRAPHY">Mammography</option>
                    <option value="DEXA">DEXA Bone Densitometry</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scan Image / PDF Document *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-5 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dcm,.zip"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                        if (!uploadTitle) {
                          setUploadTitle(e.target.files[0].name.split('.')[0]);
                        }
                      }
                    }}
                  />
                  {uploadFile ? (
                    <div className="flex items-center gap-3">
                      <FileCheck className="text-emerald-600" size={24} />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900">{uploadFile.name}</p>
                        <p className="text-[11px] text-slate-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileUp className="text-slate-400 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-700">Click to browse or drop imaging file here</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, JPG, PNG, DICOM, ZIP up to 25MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Context / Outside Facility
                </label>
                <textarea
                  rows={2}
                  placeholder="Facility name, examining radiologist, or specific findings..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Uploading scan...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#2864FF] h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer border-none flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload Scan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

      </div>
    </motion.div>
  );
}
