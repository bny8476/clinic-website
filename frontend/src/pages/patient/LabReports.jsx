import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FlaskConical,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  Search,
  Filter,
  RotateCw,
  Eye,
  ArrowRight,
  Sparkles,
  Droplets,
  HeartPulse,
  Dna,
  TestTubes,
  CalendarDays,
  Layers,
  Loader2,
  Stethoscope,
  X,
  Activity,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fadeUp, listStagger, pageTransition } from '../../components/ui/motion';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '../../components/ui/Modal';

const LabReports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'REQUESTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  // Fetch patient lab reports
  const { data: rawReports = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['patient-lab-reports'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/lab/patient/lab-reports');
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch (err) {
        console.warn('Failed to fetch patient lab reports', err);
        return [];
      }
    },
    retry: 1,
  });

  const reports = useMemo(() => Array.isArray(rawReports) ? rawReports : [], [rawReports]);

  // Book sample collection appointment mutation
  const bookMutation = useMutation({
    mutationFn: async (id) => {
      const formattedDate = new Date(scheduledAt).toISOString();
      return axiosPrivate.post(`/lab/patient/requests/${id}/book`, { scheduledAt: formattedDate });
    },
    onSuccess: () => {
      toast.success('Sample collection appointment scheduled successfully');
      queryClient.invalidateQueries(['patient-lab-reports']);
      setIsScheduleModalOpen(false);
      setScheduledAt('');
    },
    onError: () => {
      toast.error('Failed to schedule sample collection appointment');
    }
  });

  const openBookModal = (id) => {
    setSelectedReportId(id);
    setIsScheduleModalOpen(true);
  };

  const handleDownloadPdf = async (id) => {
    try {
      setDownloadingPdfId(id);
      const response = await axiosPrivate.get(`/lab/requests/${id}/report/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lab_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Diagnostic PDF report downloaded');
    } catch {
      toast.error('Diagnostic PDF report pending pathologist release');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Intelligent Clinical Categorizer & Theming
  const getClinicalTheme = (report) => {
    const testName = (report.testCatalog?.testName || report.testName || '').toLowerCase();

    // 1. Hematology
    if (
      testName.includes('blood') ||
      testName.includes('cbc') ||
      testName.includes('differential') ||
      testName.includes('hemoglobin') ||
      testName.includes('platelet') ||
      testName.includes('esr') ||
      testName.includes('ferritin')
    ) {
      return {
        category: 'Hematology',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        iconBg: 'bg-gradient-to-tr from-rose-500 to-rose-600 text-white',
        stripeColor: 'bg-rose-500',
        icon: <Droplets className="w-5 h-5" />,
      };
    }

    // 2. Cardiology
    if (
      testName.includes('troponin') ||
      testName.includes('cardiac') ||
      testName.includes('ecg') ||
      testName.includes('bnp') ||
      testName.includes('cardio')
    ) {
      return {
        category: 'Cardiology',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        iconBg: 'bg-gradient-to-tr from-red-500 to-red-600 text-white',
        stripeColor: 'bg-red-500',
        icon: <HeartPulse className="w-5 h-5" />,
      };
    }

    // 3. Urinalysis & Renal
    if (
      testName.includes('urinalysis') ||
      testName.includes('urine') ||
      testName.includes('renal') ||
      testName.includes('kidney') ||
      testName.includes('creatinine')
    ) {
      return {
        category: 'Urinalysis & Renal',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white',
        stripeColor: 'bg-amber-500',
        icon: <FlaskConical className="w-5 h-5" />,
      };
    }

    // 4. Biochemistry & Lipid / Metabolic
    if (
      testName.includes('lipid') ||
      testName.includes('cholesterol') ||
      testName.includes('liver') ||
      testName.includes('lft') ||
      testName.includes('glucose') ||
      testName.includes('sugar') ||
      testName.includes('hba1c') ||
      testName.includes('thyroid') ||
      testName.includes('tsh')
    ) {
      return {
        category: 'Biochemistry',
        badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white',
        stripeColor: 'bg-cyan-500',
        icon: <Dna className="w-5 h-5" />,
      };
    }

    // Default Clinical Pathology
    return {
      category: 'Clinical Pathology',
      badgeClass: 'bg-blue-50 text-[#2160FF] border-blue-200',
      iconBg: 'bg-gradient-to-tr from-[#2160FF] to-blue-600 text-white',
      stripeColor: 'bg-[#2160FF]',
      icon: <TestTubes className="w-5 h-5" />,
    };
  };

  // Status mapping
  const isCompleted = (status) => ['RELEASED', 'VERIFIED', 'COMPLETED', 'DONE'].includes((status || '').toUpperCase());
  const isInProgress = (status) => ['RESULT_ENTERED', 'PROCESSING', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes((status || '').toUpperCase());
  const isRequested = (status) => ['REQUESTED', 'SCHEDULED', 'ORDERED'].includes((status || '').toUpperCase());

  // Statistics
  const completedCount = useMemo(() => reports.filter(r => isCompleted(r.status)).length, [reports]);
  const inProgressCount = useMemo(() => reports.filter(r => isInProgress(r.status)).length, [reports]);
  const requestedCount = useMemo(() => reports.filter(r => isRequested(r.status)).length, [reports]);

  // Filter & Search
  const filteredReports = useMemo(() => {
    let list = reports.filter(r => {
      // Tab filter
      if (activeFilter === 'COMPLETED' && !isCompleted(r.status)) return false;
      if (activeFilter === 'IN_PROGRESS' && !isInProgress(r.status)) return false;
      if (activeFilter === 'REQUESTED' && !isRequested(r.status)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const test = (r.testCatalog?.testName || r.testName || '').toLowerCase();
        const doc = (r.doctor?.user ? `${r.doctor.user.firstName || ''} ${r.doctor.user.lastName || ''}` : '').toLowerCase();
        const refId = String(r.id || '').toLowerCase();
        const stat = (r.status || '').toLowerCase();

        if (!test.includes(q) && !doc.includes(q) && !refId.includes(q) && !stat.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    list.sort((a, b) => {
      const dateA = new Date(a.requestedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.requestedAt || b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [reports, activeFilter, searchQuery, sortOrder]);

  const getStepProgress = (status) => {
    const s = (status || '').toUpperCase();
    if (isCompleted(s)) return 4;
    if (['RESULT_ENTERED', 'PENDING_VERIFICATION'].includes(s)) return 3;
    if (['PROCESSING', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(s)) return 2;
    return 1; // REQUESTED
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (isCompleted(s)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          VERIFIED & RELEASED
        </span>
      );
    }
    if (['RESULT_ENTERED', 'PENDING_VERIFICATION'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Clock className="w-3.5 h-3.5 text-cyan-600" />
          PENDING VERIFICATION
        </span>
      );
    }
    if (['PROCESSING', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          IN ANALYSIS
        </span>
      );
    }
    if (s === 'SCHEDULED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          SAMPLE SCHEDULED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        REQUESTED
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
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2160FF] to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <FlaskConical className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Diagnostic Lab Reports & Tests
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2160FF] border border-blue-200">
                    <Sparkles className="w-3 h-3" /> Pathology Certified
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                  Track specimen collection, automated laboratory analysis, certified diagnostic findings, and download official PDF reports.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                onClick={() => refetch()}
                title="Sync Lab Reports"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => navigate('/patient/timeline')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
              >
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Health Timeline</span>
              </button>

              <button
                onClick={() => navigate('/patient/appointments')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-blue-600 transition shadow-sm shadow-blue-500/25 cursor-pointer border-none"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Book Lab Visit</span>
              </button>
            </div>
          </div>

          {/* ── Top KPI Metrics Strip ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Diagnostic Tests</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{reports.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">Verified & Released</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{completedCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700/80 uppercase tracking-wider">In Laboratory Analysis</p>
                <h3 className="text-2xl font-black text-[#2160FF] mt-0.5">{inProgressCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200/60 text-[#2160FF] flex items-center justify-center font-bold shadow-2xs">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700/80 uppercase tracking-wider">Requested & Awaiting</p>
                <h3 className="text-2xl font-black text-amber-600 mt-0.5">{requestedCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200/60 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Search, Filters & Sort Bar ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Lab Reports', count: reports.length },
              { id: 'COMPLETED', label: 'Verified & Released', count: completedCount },
              { id: 'IN_PROGRESS', label: 'In Analysis', count: inProgressCount },
              { id: 'REQUESTED', label: 'Awaiting Sample', count: requestedCount },
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
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
                placeholder="Search test, doctor, reference ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition w-56 sm:w-64"
              />
            </div>

            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              aria-label="Sort lab reports"
              style={{ backgroundImage: 'none' }}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 cursor-pointer shadow-2xs"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* ── Report List / Empty State ────────────────────────────────────── */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xs border border-slate-200/80">
            <Loader2 className="w-9 h-9 animate-spin text-[#2160FF]" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading lab diagnostic results...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          /* High-Grade Empty State */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-12 sm:p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#2160FF] flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
              <FlaskConical className="w-9 h-9" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">
              {reports.length === 0 ? 'No laboratory tests on file' : 'No matching reports found'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              {reports.length === 0
                ? "You don't have any diagnostic lab requests or results registered yet. Tests ordered by your doctor during consultations will appear here automatically."
                : `No reports match your current filter "${activeFilter}" or search query. Try clearing your filters.`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {reports.length > 0 && (
                <button
                  onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }}
                  className="px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer bg-white"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => navigate('/patient/appointments')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2160FF] text-xs font-black text-white rounded-xl hover:bg-blue-600 transition cursor-pointer shadow-sm shadow-blue-500/20 border-none"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Book Doctor Consultation</span>
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
              {filteredReports.map((report) => {
                const theme = getClinicalTheme(report);
                const testName = report.testCatalog?.testName || report.testName || 'Laboratory Test';
                const doctorName = report.doctor
                  ? `Dr. ${report.doctor.user?.firstName ?? ''} ${report.doctor.user?.lastName ?? ''}`.trim()
                  : 'Attending Physician';
                const requestedDate = report.requestedAt
                  ? format(new Date(report.requestedAt), 'EEEE, MMMM d, yyyy')
                  : 'Recent';
                const stepIdx = getStepProgress(report.status);
                const isReleased = isCompleted(report.status);

                return (
                  <motion.div
                    key={report.id}
                    variants={listStagger}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all p-5 sm:p-6 space-y-4 relative overflow-hidden group"
                  >
                    {/* Left Colored Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${theme.stripeColor}`} />

                    {/* Top Row: Test Title, Discipline & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${theme.iconBg}`}>
                          {theme.icon}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${theme.badgeClass}`}>
                              {theme.category}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              #LAB-{report.id}
                            </span>
                            {renderStatusBadge(report.status)}
                          </div>
                          <h3 
                            onClick={() => setSelectedReportDetail(report)}
                            className="text-base sm:text-lg font-black text-slate-900 hover:text-[#2160FF] transition-colors cursor-pointer tracking-tight truncate"
                          >
                            {testName}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                            <span>Ordered by {doctorName}</span>
                            <span>•</span>
                            <span className="text-slate-400">{requestedDate}</span>
                          </p>
                        </div>
                      </div>

                      {/* Top Action Pills */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {isReleased && (
                          <button
                            onClick={() => handleDownloadPdf(report.id)}
                            disabled={downloadingPdfId === report.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-blue-600 transition shadow-xs border-none cursor-pointer disabled:opacity-50"
                          >
                            {downloadingPdfId === report.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Download PDF</span>
                          </button>
                        )}

                        {report.status === 'REQUESTED' && (
                          <button
                            onClick={() => openBookModal(report.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs border-none cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Collection</span>
                          </button>
                        )}

                        {report.status === 'SCHEDULED' && report.scheduledAt && (
                          <div className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                            Scheduled: {format(new Date(report.scheduledAt), 'MMM d, hh:mm a')}
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedReportDetail(report)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                          title="View Test Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stepper Pipeline: Ordered -> Collected -> Analyzed -> Verified */}
                    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <span>Laboratory Workflow Progress</span>
                        <span className="text-[#2160FF] font-extrabold">Step {stepIdx} of 4</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: '1. Requested', step: 1 },
                          { name: '2. Collected', step: 2 },
                          { name: '3. In Analysis', step: 3 },
                          { name: '4. Verified & Released', step: 4 },
                        ].map(s => {
                          const isDone = stepIdx >= s.step;
                          const isCurrent = stepIdx === s.step;
                          return (
                            <div key={s.name} className="space-y-1">
                              <div className={`h-1.5 rounded-full transition-all ${
                                isDone ? 'bg-[#2160FF]' : 'bg-slate-200'
                              } ${isCurrent ? 'animate-pulse' : ''}`} />
                              <span className={`text-[10px] font-bold block truncate text-center ${
                                isDone ? 'text-slate-800 font-black' : 'text-slate-400'
                              }`}>
                                {s.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer: Diagnostic Notes & Reference */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-semibold">Priority:</span>
                        <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                          report.priority === 'STAT' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {report.priority || 'Routine'}
                        </span>
                        {report.notes && (
                          <span className="text-slate-600 truncate max-w-md">• {report.notes}</span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedReportDetail(report)}
                        className="text-xs font-extrabold text-[#2160FF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Diagnostic Telemetry & Reference Values</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* ── Schedule Sample Collection Modal ─────────────────────────────── */}
      <Modal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        title="Schedule Sample Collection"
        size="sm"
      >
        <div className="space-y-4 font-sans text-xs">
          <p className="text-slate-600 font-medium leading-relaxed">
            Choose your preferred time slot for clinical specimen collection at our clinic laboratory or home nursing visit.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => bookMutation.mutate(selectedReportId)}
              disabled={!scheduledAt || bookMutation.isPending}
              className="px-5 py-2 bg-[#2160FF] text-white font-black rounded-xl hover:bg-blue-600 transition shadow-xs border-none cursor-pointer disabled:opacity-50"
            >
              {bookMutation.isPending ? 'Scheduling...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Diagnostic Details Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedReportDetail}
        onClose={() => setSelectedReportDetail(null)}
        title={selectedReportDetail?.testCatalog?.testName || 'Diagnostic Test Details'}
        size="md"
      >
        {selectedReportDetail && (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Discipline</span>
                <span className="font-black text-slate-900 text-sm">{getClinicalTheme(selectedReportDetail).category}</span>
              </div>
              <div>{renderStatusBadge(selectedReportDetail.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Ordered Date</span>
                <span className="font-bold text-slate-900 block">
                  {selectedReportDetail.requestedAt ? format(new Date(selectedReportDetail.requestedAt), 'PPP') : 'Recent'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Reference ID</span>
                <span className="font-mono font-bold text-slate-900 block">#LAB-{selectedReportDetail.id}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Description & Notes</span>
              <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                {selectedReportDetail.testCatalog?.description || selectedReportDetail.notes || 'Routine diagnostic pathology screening performed under automated quality controls.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 font-medium text-[11px]">NABL Accredited Medical Laboratory</span>
              <div className="flex gap-2">
                {isCompleted(selectedReportDetail.status) && (
                  <button
                    onClick={() => handleDownloadPdf(selectedReportDetail.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2160FF] text-white rounded-xl font-bold hover:bg-blue-600 transition shadow-2xs border-none cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Report
                  </button>
                )}
                <button
                  onClick={() => setSelectedReportDetail(null)}
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

export default LabReports;
