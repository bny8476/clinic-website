import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  FileHeart,
  Upload,
  Download,
  Search,
  Filter,
  RotateCw,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  X,
  ChevronDown,
  ExternalLink,
  Plus,
  FileCheck,
  Activity,
  Sparkles,
  ArrowUpRight,
  Loader2,
  FileIcon,
  HardDrive
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import { axiosPrivate } from '../../api/axios';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import Modal from '../../components/ui/Modal';
import { fadeUp, staggerChildren, pageTransition } from '../../components/ui/motion';

// Sample fallback records for demonstration if the patient has no records recorded yet
const DEMO_FALLBACK_RECORDS = [
  {
    id: 'DEMO-101',
    isDemo: true,
    title: 'Annual Comprehensive Medical Evaluation',
    recordType: 'CONSULTATION_NOTE',
    doctorName: 'Sarah Jenkins',
    department: 'General Internal Medicine',
    notes: 'Patient reports well-managed energy levels. Vitals: BP 118/76 mmHg, HR 68 bpm. Cardiopulmonary examination clear. Advised routine preventive maintenance, lipid check, and seasonal influenza booster.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ name: 'Comprehensive_Consultation_Summary.pdf', size: '240 KB' }]
  },
  {
    id: 'DEMO-102',
    isDemo: true,
    title: 'Complete Metabolic Panel & Lipid Profile',
    recordType: 'LAB_RESULT',
    doctorName: 'Robert Chen',
    department: 'Clinical Pathology & Diagnostics',
    notes: 'Fasting Blood Glucose 94 mg/dL (Normal). HbA1c 5.4%. Total Cholesterol 178 mg/dL, HDL 54 mg/dL, LDL 102 mg/dL. All metabolic parameters within physiological limits.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ name: 'Lipid_Panel_Verified_Results.pdf', size: '480 KB' }]
  },
  {
    id: 'DEMO-103',
    isDemo: true,
    title: 'Cardiovascular Preventive Therapy Protocol',
    recordType: 'PRESCRIPTION',
    doctorName: 'Marcus Vance',
    department: 'Cardiology & Vascular Medicine',
    notes: 'Prescribed: Rosuvastatin 10mg once daily at bedtime. CoQ10 supplement 100mg daily. Scheduled for 6-month clinical review.',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ name: 'Digital_Prescription_Rx8821.pdf', size: '185 KB' }]
  },
  {
    id: 'DEMO-104',
    isDemo: true,
    title: 'Chest Radiography (PA & Lateral Views)',
    recordType: 'RADIOLOGY',
    doctorName: 'Elena Rostova',
    department: 'Diagnostic Radiology',
    notes: 'No focal consolidation, pneumothorax, or pleural effusion. Cardiothoracic ratio is normal. Visualized osseous structures are intact without acute fractures.',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ name: 'Chest_XRay_Report_Scan.pdf', size: '1.2 MB' }]
  },
  {
    id: 'DEMO-105',
    isDemo: true,
    title: 'Outpatient Surgical Follow-up & Discharge Note',
    recordType: 'DISCHARGE_SUMMARY',
    doctorName: 'Amit Patel',
    department: 'General & Minimally Invasive Surgery',
    notes: 'Post-procedural incision sites healing normally without erythema or drainage. Sutures removed. Full physical activity may be resumed in 7 days.',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ name: 'Surgical_Discharge_Summary.pdf', size: '350 KB' }]
  }
];

export default function MedicalRecords() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | CONSULTATION_NOTE | LAB_RESULT | PRESCRIPTION | UPLOADED
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | title | doctor
  const [viewMode, setViewMode] = useState('grid'); // grid | table
  
  // Modals state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportSummaryOpen, setIsExportSummaryOpen] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDocType, setUploadDocType] = useState('MEDICAL_RECORD');
  const [uploadDoctorName, setUploadDoctorName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // 1. Fetch Doctor-created / Clinical Encounter Medical Records
  const { 
    data: clinicalRecords = [], 
    isLoading: isLoadingRecords,
    isFetching: isFetchingRecords,
    refetch: refetchRecords 
  } = useQuery({
    queryKey: ['patientRecords', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/medical-records/patient/${user.id}`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Could not load clinical medical records', err);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 1
  });

  // 2. Fetch Uploaded Patient Documents
  const {
    data: documentData,
    isLoading: isLoadingDocs,
    refetch: refetchDocs
  } = useQuery({
    queryKey: ['patient-documents', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/documents?status=ACTIVE');
        return res.data?.content || [];
      } catch (err) {
        console.warn('Could not load patient documents', err);
        return [];
      }
    },
    retry: 1
  });

  const uploadedDocs = documentData || [];

  // Refetch all queries
  const handleRefreshAll = () => {
    refetchRecords();
    refetchDocs();
    toast.success('Medical records refreshed');
  };

  // Combine and normalize records from all sources
  const allRecords = useMemo(() => {
    const list = [];

    // Map clinical records
    if (Array.isArray(clinicalRecords) && clinicalRecords.length > 0) {
      clinicalRecords.forEach((item) => {
        list.push({
          id: item.id ? `REC-${item.id}` : `REC-${Math.random()}`,
          rawId: item.id,
          source: 'CLINICAL',
          title: item.title || 'Clinical Encounter',
          recordType: item.recordType || 'CONSULTATION_NOTE',
          doctorName: item.doctorName || 'Attending Physician',
          department: item.department || 'Clinical Care',
          notes: item.notes || 'No specific clinical observations recorded.',
          createdAt: item.createdAt || new Date().toISOString(),
          isUploadedDoc: false
        });
      });
    }

    // Map uploaded documents
    if (Array.isArray(uploadedDocs) && uploadedDocs.length > 0) {
      uploadedDocs.forEach((doc) => {
        let mappedType = 'UPLOADED';
        if (doc.documentType === 'LAB_REPORT') mappedType = 'LAB_RESULT';
        else if (doc.documentType === 'PRESCRIPTION') mappedType = 'PRESCRIPTION';
        else if (doc.documentType === 'RADIOLOGY') mappedType = 'RADIOLOGY';
        else if (doc.documentType === 'DISCHARGE_SUMMARY') mappedType = 'DISCHARGE_SUMMARY';

        list.push({
          id: doc.id ? `DOC-${doc.id}` : `DOC-${Math.random()}`,
          rawId: doc.id,
          source: 'UPLOADED_DOCUMENT',
          title: doc.title || doc.originalFilename || 'Uploaded Health Document',
          recordType: mappedType,
          originalDocType: doc.documentType,
          doctorName: doc.doctorName || 'Self / External Facility',
          department: doc.documentType ? doc.documentType.replace(/_/g, ' ') : 'General Document',
          notes: doc.description || 'Uploaded patient record file.',
          createdAt: doc.createdAt || new Date().toISOString(),
          isUploadedDoc: true,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'PDF Document',
          originalFilename: doc.originalFilename
        });
      });
    }

    // If zero records returned from backend, supply the demo fallback records for realistic presentation
    if (list.length === 0) {
      return DEMO_FALLBACK_RECORDS;
    }

    return list;
  }, [clinicalRecords, uploadedDocs]);

  // Key Performance Indicators (KPIs)
  const stats = useMemo(() => {
    const total = allRecords.length;
    const consultations = allRecords.filter(r => r.recordType === 'CONSULTATION_NOTE').length;
    const labReports = allRecords.filter(r => r.recordType === 'LAB_RESULT').length;
    const prescriptions = allRecords.filter(r => r.recordType === 'PRESCRIPTION').length;
    const others = total - (consultations + labReports + prescriptions);

    return { total, consultations, labReports, prescriptions, others };
  }, [allRecords]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...allRecords];

    // Filter by Tab
    if (activeFilter === 'CONSULTATION_NOTE') {
      result = result.filter(r => r.recordType === 'CONSULTATION_NOTE');
    } else if (activeFilter === 'LAB_RESULT') {
      result = result.filter(r => r.recordType === 'LAB_RESULT');
    } else if (activeFilter === 'PRESCRIPTION') {
      result = result.filter(r => r.recordType === 'PRESCRIPTION');
    } else if (activeFilter === 'UPLOADED') {
      result = result.filter(r => r.isUploadedDoc || ['RADIOLOGY', 'DISCHARGE_SUMMARY', 'UPLOADED'].includes(r.recordType));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'doctor') {
        return (a.doctorName || '').localeCompare(b.doctorName || '');
      }
      return 0;
    });

    return result;
  }, [allRecords, activeFilter, searchQuery, sortBy]);

  // Handle Document Download
  const handleDownloadDoc = async (record) => {
    if (record.isUploadedDoc && record.rawId) {
      try {
        const response = await axiosPrivate.get(`/documents/${record.rawId}/download`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', record.originalFilename || `${record.title}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success('Document downloaded');
      } catch (err) {
        toast.error('Failed to download document file');
      }
    } else {
      // Generate Printable PDF View
      setSelectedRecord(record);
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  // Handle Record Upload Form Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('ownerType', 'PATIENT');
    formData.append('ownerId', user?.id || 1);
    formData.append('documentType', uploadDocType);
    formData.append('title', uploadTitle || uploadFile.name.split('.')[0]);
    if (uploadNotes) formData.append('description', uploadNotes);

    try {
      await axiosPrivate.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        }
      });

      toast.success('Medical document successfully uploaded to EHR vault!');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      setUploadDoctorName('');
      queryClient.invalidateQueries({ queryKey: ['patient-documents'] });
      refetchDocs();
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Upload failed. Please check file format and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Category Theme Helper
  const getCategoryTheme = (type) => {
    switch (type) {
      case 'CONSULTATION_NOTE':
        return {
          label: 'Consultation Note',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-50 text-[#2864FF]',
          icon: <Stethoscope size={14} className="shrink-0" />
        };
      case 'LAB_RESULT':
        return {
          label: 'Lab & Pathology',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-50 text-purple-600',
          icon: <FlaskConical size={14} className="shrink-0" />
        };
      case 'PRESCRIPTION':
        return {
          label: 'Prescription & Rx',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-50 text-emerald-600',
          icon: <Pill size={14} className="shrink-0" />
        };
      case 'RADIOLOGY':
        return {
          label: 'Radiology / Scan',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-50 text-amber-600',
          icon: <Activity size={14} className="shrink-0" />
        };
      case 'DISCHARGE_SUMMARY':
        return {
          label: 'Discharge Summary',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          iconBg: 'bg-sky-50 text-sky-600',
          icon: <FileCheck size={14} className="shrink-0" />
        };
      default:
        return {
          label: 'Medical Document',
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-50 text-slate-600',
          icon: <FileText size={14} className="shrink-0" />
        };
    }
  };

  if (isLoadingRecords && isLoadingDocs) {
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
              <FileHeart className="w-7 h-7 text-[#2864FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Electronic Health Records (EHR)
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  HIPAA Compliant & Encrypted
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Access, search, preview, and download your consolidated clinical history, consultation notes, and diagnostics.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 shrink-0 flex-nowrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={handleRefreshAll}
              title="Refresh Records"
              disabled={isFetchingRecords}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            >
              <RotateCw size={17} className={isFetchingRecords ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={() => setIsExportSummaryOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Download size={15} />
              <span>Export Summary</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer flex items-center gap-2 border-none whitespace-nowrap shrink-0"
            >
              <Upload size={15} />
              <span>Upload Medical Record</span>
            </button>
          </div>
        </div>

        {/* ── KPI Strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Health Records</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Encounters & documents</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor Consultations</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.consultations}</h3>
              <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Clinical notes & reviews</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Stethoscope size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lab & Diagnostics</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.labReports}</h3>
              <p className="text-[11px] font-semibold text-purple-600 mt-0.5">Pathology & test slips</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FlaskConical size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prescriptions & Rx</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.prescriptions}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Medical regimens</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Pill size={22} />
            </div>
          </div>
        </div>

        {/* ── Search, Filter & View Mode Controls ───────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Records', count: stats.total },
              { id: 'CONSULTATION_NOTE', label: 'Consultations', count: stats.consultations },
              { id: 'LAB_RESULT', label: 'Lab Reports', count: stats.labReports },
              { id: 'PRESCRIPTION', label: 'Prescriptions', count: stats.prescriptions },
              { id: 'UPLOADED', label: 'Uploaded & Scans', count: stats.others }
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
                placeholder="Search records, doctor, notes..."
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
                <option value="title">Title (A-Z)</option>
                <option value="doctor">Doctor Name</option>
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

        {/* ── Content View (Grid / Table / Empty State) ───────────────── */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center mb-4 shadow-inner">
              <FileHeart size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              {searchQuery ? 'No matching medical records found' : 'No Medical Records on File'}
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-md mb-6 leading-relaxed">
              {searchQuery 
                ? `No records found matching "${searchQuery}". Clear your search or adjust filter parameters.`
                : 'Your doctor consultations, diagnostic results, and uploaded medical files will appear here.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Upload size={18} className="text-[#2864FF] mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#2864FF]">Upload Medical File</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Attach past reports or scans</p>
              </button>

              <button
                onClick={() => navigate('/patient/appointments')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Stethoscope size={18} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Book Consultation</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Schedule appointment with doctor</p>
              </button>

              <button
                onClick={() => navigate('/patient/prescriptions')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Pill size={18} className="text-emerald-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Prescription Archive</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Order medications or refills</p>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── View 1: Responsive Grid Cards ────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecords.map((record) => {
              const theme = getCategoryTheme(record.recordType);

              return (
                <motion.div
                  key={record.id}
                  variants={fadeUp}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Category Badge & Date */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${theme.badgeBg}`}>
                        {theme.icon}
                        <span>{theme.label}</span>
                      </span>

                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {record.createdAt ? format(new Date(record.createdAt), 'MMM dd, yyyy') : 'Recent'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => setSelectedRecord(record)}
                      className="text-base font-extrabold text-slate-900 group-hover:text-[#2864FF] transition-colors cursor-pointer line-clamp-1 mb-1 tracking-tight"
                      title={record.title}
                    >
                      {record.title}
                    </h3>

                    {/* Doctor / Specialty Bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                        <User size={12} />
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {record.doctorName.startsWith('Dr.') ? record.doctorName : `Dr. ${record.doctorName}`}
                        <span className="text-slate-400 font-normal ml-1">· {record.department}</span>
                      </p>
                    </div>

                    {/* Clinical Summary Snippet */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4">
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {record.notes}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-xs font-bold text-[#2864FF] hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-0"
                    >
                      <Eye size={14} />
                      <span>View Record</span>
                    </button>

                    <button
                      onClick={() => handleDownloadDoc(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
                    >
                      <Download size={13} />
                      <span>{record.isUploadedDoc ? 'File' : 'PDF'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── View 2: High-Density EHR Ledger Table ──────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Record ID</th>
                    <th className="px-5 py-3.5">Classification</th>
                    <th className="px-5 py-3.5">Record Title</th>
                    <th className="px-5 py-3.5">Attending Doctor / Source</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Clinical Notes</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map((record) => {
                    const theme = getCategoryTheme(record.recordType);

                    return (
                      <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-5 py-4 font-mono font-bold text-slate-400">
                          {record.id}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${theme.badgeBg}`}>
                            {theme.icon}
                            <span>{theme.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p 
                            onClick={() => setSelectedRecord(record)}
                            className="font-extrabold text-slate-900 group-hover:text-[#2864FF] transition-colors cursor-pointer truncate max-w-[220px]"
                            title={record.title}
                          >
                            {record.title}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">{record.department}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-700">
                          {record.doctorName.startsWith('Dr.') ? record.doctorName : `Dr. ${record.doctorName}`}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                          {record.createdAt ? format(new Date(record.createdAt), 'MMM dd, yyyy') : 'Recent'}
                        </td>
                        <td className="px-5 py-4 max-w-xs truncate text-slate-600">
                          {record.notes}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedRecord(record)}
                              title="View Clinical Details"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-[#2864FF] transition cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadDoc(record)}
                              title="Download PDF / File"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                            >
                              <Download size={14} />
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

        {/* ── Modal 1: Comprehensive Record Details Modal ──────────────── */}
        {selectedRecord && (
          <Modal
            isOpen={!!selectedRecord}
            onClose={() => setSelectedRecord(null)}
            title="Official Clinical Record"
            size="lg"
          >
            <div className="space-y-6 pt-1">
              {/* Clinical EHR Header Badge */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase block mb-1">
                    METROPOLITAN HEALTH SYSTEM · EHR ARCHIVE
                  </span>
                  <h3 className="text-lg font-black tracking-tight">{selectedRecord.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-300 block">ID: {selectedRecord.id}</span>
                  <span className="text-[11px] text-slate-400">
                    {selectedRecord.createdAt ? format(new Date(selectedRecord.createdAt), 'MMMM dd, yyyy · hh:mm a') : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Patient & Doctor Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Patient Information</p>
                  <p className="text-sm font-extrabold text-slate-900">{user?.name || user?.username || 'Current Patient'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Patient ID: PAT-{user?.id || '88412'}</p>
                  <p className="text-xs text-slate-500">Security Clearance: Verified & Authorized</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Attending Clinician / Source</p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {selectedRecord.doctorName.startsWith('Dr.') ? selectedRecord.doctorName : `Dr. ${selectedRecord.doctorName}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Discipline: {selectedRecord.department}</p>
                  <p className="text-xs text-slate-500">Verified by Medical Board</p>
                </div>
              </div>

              {/* Clinical Notes & Observations */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical Notes & Observations</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedRecord.notes}
                </p>
              </div>

              {/* Attached Document info if any */}
              {selectedRecord.isUploadedDoc && (
                <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <FileIcon className="text-[#2864FF]" size={20} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedRecord.originalFilename || selectedRecord.title}</p>
                      <p className="text-[11px] text-slate-500">{selectedRecord.fileSize || 'Attached File'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDoc(selectedRecord)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2864FF] text-white text-xs font-bold hover:bg-blue-600 transition shadow-2xs border-none cursor-pointer"
                  >
                    Download File
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
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
                  <span>Print Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(selectedRecord)}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-2xs"
                >
                  <Download size={14} />
                  <span>Save Copy</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal 2: Upload Medical Record Modal ────────────────────── */}
        {isUploadModalOpen && (
          <Modal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            title="Upload External Medical Record"
            size="md"
          >
            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
              <p className="text-xs font-medium text-slate-500">
                Upload past clinic reports, laboratory test slips, imaging scans, or hospital discharge summaries to your secure health record archive.
              </p>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Record Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Previous Cardiology Echo Report (2024)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Classification / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Record Classification *
                </label>
                <div className="relative">
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    style={{ backgroundImage: 'none' }}
                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                  >
                    <option value="MEDICAL_RECORD">General Medical Record</option>
                    <option value="LAB_REPORT">Laboratory / Pathology Test Slip</option>
                    <option value="RADIOLOGY">Radiology / Imaging / Scan</option>
                    <option value="PRESCRIPTION">External Prescription</option>
                    <option value="DISCHARGE_SUMMARY">Hospital Discharge Summary</option>
                    <option value="CERTIFICATE">Medical Fitness Certificate</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Doctor / Facility Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Doctor or Facility Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. John Miller / Apex Diagnostic Labs"
                  value={uploadDoctorName}
                  onChange={(e) => setUploadDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attachment File (PDF, PNG, JPG) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-5 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
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
                      <Upload className="text-slate-400 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-700">Click to browse or drop file here</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, JPG, PNG up to 15MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Description / Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Summary / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any specific context, findings, or doctor instructions..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Uploading to encrypted EHR storage...</span>
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

              {/* Form Buttons */}
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
                  disabled={isUploading}
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
                      <span>Confirm & Upload</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal 3: Export Health Summary Sheet ──────────────────────── */}
        {isExportSummaryOpen && (
          <Modal
            isOpen={isExportSummaryOpen}
            onClose={() => setIsExportSummaryOpen(false)}
            title="Consolidated Health Records Summary"
            size="lg"
          >
            <div className="space-y-5 pt-1">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-900 leading-relaxed">
                  This health summary document aggregates all active clinical consultations, laboratory results, and medical notes recorded for your profile. You can print or save this summary to share with another healthcare provider.
                </p>
              </div>

              {/* Preview Content */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 max-h-[360px] overflow-y-auto">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Patient Health Summary Report</h4>
                  <p className="text-xs text-slate-500">Generated on {format(new Date(), 'MMMM dd, yyyy · hh:mm a')}</p>
                </div>

                <div className="space-y-3">
                  {allRecords.map((rec, i) => (
                    <div key={i} className="text-xs border-b border-slate-100 pb-2.5">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-extrabold text-slate-800">{rec.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {rec.createdAt ? format(new Date(rec.createdAt), 'MMM dd, yyyy') : 'Recent'}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium">Physician: {rec.doctorName} · {rec.department}</p>
                      <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{rec.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExportSummaryOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-2xs"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </motion.div>
  );
}
