import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import HrTopNav from './HrTopNav';
import { 
  Briefcase, 
  UserPlus, 
  Search, 
  Plus, 
  Users, 
  Building, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Filter, 
  X, 
  RotateCw,
  Mail,
  Phone,
  FileText,
  Bookmark,
  Download,
  Trash2,
  Eye,
  ChevronDown,
  ArrowUpDown,
  Check,
  Star,
  Columns,
  ListFilter,
  CheckCircle,
  XCircle,
  Award,
  BadgeCheck
} from 'lucide-react';

const DEPARTMENTS = [
  'ALL',
  'Cardiology',
  'Emergency',
  'Pediatrics',
  'Patient Front Desk',
  'Inpatient Care',
  'Nursing Operations',
  'Pharmacy',
  'Diagnostic Imaging',
  'Administration',
  'Human Resources'
];

const PIPELINE_STAGES = [
  { id: 'ALL', label: 'All Stages' },
  { id: 'APPLIED', label: 'Applied' },
  { id: 'SCREENING', label: 'Screening' },
  { id: 'INTERVIEW', label: 'Interview' },
  { id: 'OFFER', label: 'Offer Extended' },
  { id: 'HIRED', label: 'Hired' },
  { id: 'REJECTED', label: 'Rejected' }
];

export default function Recruitment() {
  const queryClient = useQueryClient();

  // Tab & View Controls
  const [activeTab, setActiveTab] = useState('requisitions'); // 'requisitions' | 'pipeline'
  const [pipelineLayout, setPipelineLayout] = useState('kanban'); // 'kanban' | 'table'

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [sortField, setSortField] = useState('date'); // 'date' | 'title' | 'vacancies'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form State for New Job Requisition
  const [formData, setFormData] = useState({
    title: '',
    department: 'Cardiology',
    vacancyCount: 1,
    requiredQualifications: 'MBBS / MD / Relevant Clinical Board Certification',
    requiredExperienceYears: 3,
    minSalary: '',
    maxSalary: '',
    status: 'POSTED'
  });

  // 1. Fetch Job Requisitions from Backend
  const { data: rawRequisitions = [], isLoading: isLoadingReqs, refetch: refetchReqs, isFetching: isFetchingReqs } = useQuery({
    queryKey: ['jobRequisitions'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/requisitions');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // 2. Fetch Job Applications from Backend
  const { data: rawApplications = [], isLoading: isLoadingApps, refetch: refetchApps, isFetching: isFetchingApps } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/applications');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // Realistic Fallback Data if Database is newly initialized
  const fallbackRequisitions = useMemo(() => [
    {
      id: 101,
      title: 'Emergency Department Physician',
      department: 'Emergency',
      vacancyCount: 2,
      status: 'POSTED',
      requiredExperienceYears: 5,
      requiredQualifications: 'MBBS, MD Emergency Medicine with ACLS/ATLS certification',
      minSalary: 120000,
      maxSalary: 160000,
      createdAt: '2026-11-20T10:00:00Z'
    },
    {
      id: 102,
      title: 'Registered Staff Nurse (ICU)',
      department: 'Inpatient Care',
      vacancyCount: 4,
      status: 'POSTED',
      requiredExperienceYears: 3,
      requiredQualifications: 'B.Sc Nursing / GNM with Critical Care certification',
      minSalary: 45000,
      maxSalary: 60000,
      createdAt: '2026-11-21T11:30:00Z'
    },
    {
      id: 103,
      title: 'Senior Clinical Pharmacist',
      department: 'Pharmacy',
      vacancyCount: 1,
      status: 'POSTED',
      requiredExperienceYears: 4,
      requiredQualifications: 'Pharm.D or B.Pharm with Registered Pharmacy Council license',
      minSalary: 65000,
      maxSalary: 85000,
      createdAt: '2026-11-22T09:15:00Z'
    },
    {
      id: 104,
      title: 'Lead Diagnostic Radiologist',
      department: 'Diagnostic Imaging',
      vacancyCount: 1,
      status: 'POSTED',
      requiredExperienceYears: 6,
      requiredQualifications: 'MD Radiodiagnosis with MRI / CT scan expertise',
      minSalary: 130000,
      maxSalary: 175000,
      createdAt: '2026-11-23T14:00:00Z'
    },
    {
      id: 105,
      title: 'Senior Consultant Pediatrician',
      department: 'Pediatrics',
      vacancyCount: 2,
      status: 'POSTED',
      requiredExperienceYears: 5,
      requiredQualifications: 'MD Pediatrics / DCH with Neonatal resuscitation expertise',
      minSalary: 110000,
      maxSalary: 150000,
      createdAt: '2026-11-24T08:45:00Z'
    }
  ], []);

  const fallbackApplications = useMemo(() => [
    {
      id: 201,
      applicantName: 'Dr. Anita Roy',
      applicantEmail: 'anita.roy@medmail.com',
      applicantPhone: '+91 98765 43210',
      status: 'INTERVIEW',
      interviewNotes: '[{"interviewer":"Dr. Marcus Vance","score":"4.8/5","feedback":"Excellent trauma resuscitation and triage knowledge"}]',
      createdAt: '2026-11-22T10:00:00Z',
      jobRequisition: { id: 101, title: 'Emergency Department Physician', department: 'Emergency' }
    },
    {
      id: 202,
      applicantName: 'Kavita Menon',
      applicantEmail: 'k.menon@healthnursing.org',
      applicantPhone: '+91 98765 43211',
      status: 'OFFER',
      interviewNotes: '[{"interviewer":"Elena Rostova","score":"4.9/5","feedback":"Outstanding critical care and ICU shift leadership"}]',
      createdAt: '2026-11-20T11:00:00Z',
      jobRequisition: { id: 102, title: 'Registered Staff Nurse (ICU)', department: 'Inpatient Care' }
    },
    {
      id: 203,
      applicantName: 'Rahul Sharma',
      applicantEmail: 'rahul.s@pharmconnect.in',
      applicantPhone: '+91 98765 43212',
      status: 'SCREENING',
      interviewNotes: '[{"interviewer":"HR Team","score":"4.5/5","feedback":"Strong clinical dispensing and institutional inventory background"}]',
      createdAt: '2026-11-24T14:20:00Z',
      jobRequisition: { id: 103, title: 'Senior Clinical Pharmacist', department: 'Pharmacy' }
    },
    {
      id: 204,
      applicantName: 'Vikram Joshi',
      applicantEmail: 'v.joshi@imagingpro.com',
      applicantPhone: '+91 98765 43213',
      status: 'INTERVIEW',
      interviewNotes: '[{"interviewer":"Diagnostic Lead","score":"4.6/5","feedback":"Proficient in 128-slice CT and cardiac MRI protocols"}]',
      createdAt: '2026-11-23T16:10:00Z',
      jobRequisition: { id: 104, title: 'Lead Diagnostic Radiologist', department: 'Diagnostic Imaging' }
    },
    {
      id: 205,
      applicantName: 'Dr. Sneha Patil',
      applicantEmail: 'sneha.patil@cliniclabs.com',
      applicantPhone: '+91 98765 43214',
      status: 'HIRED',
      interviewNotes: '[{"interviewer":"Medical Executive Board","score":"5.0/5","feedback":"Approved for immediate clinical onboarding"}]',
      createdAt: '2026-11-18T09:30:00Z',
      jobRequisition: { id: 105, title: 'Senior Consultant Pediatrician', department: 'Pediatrics' }
    },
    {
      id: 206,
      applicantName: 'Dr. Arjun Mehra',
      applicantEmail: 'arjun.m@medicare.com',
      applicantPhone: '+91 98765 43215',
      status: 'APPLIED',
      interviewNotes: '[]',
      createdAt: '2026-11-25T12:00:00Z',
      jobRequisition: { id: 101, title: 'Emergency Department Physician', department: 'Emergency' }
    }
  ], []);

  const [localRequisitionOverrides, setLocalRequisitionOverrides] = useState({});
  const [deletedRequisitionIds, setDeletedRequisitionIds] = useState(new Set());
  const [localAppOverrides, setLocalAppOverrides] = useState({});
  const [deletedAppIds, setDeletedAppIds] = useState(new Set());

  const displayRequisitions = useMemo(() => {
    const list = rawRequisitions.length > 0 ? rawRequisitions : fallbackRequisitions;
    return list
      .filter(r => !deletedRequisitionIds.has(r.id))
      .map(r => {
        if (localRequisitionOverrides[r.id]) {
          return { ...r, ...localRequisitionOverrides[r.id] };
        }
        return r;
      });
  }, [rawRequisitions, fallbackRequisitions, localRequisitionOverrides, deletedRequisitionIds]);

  const displayApplications = useMemo(() => {
    const list = rawApplications.length > 0 ? rawApplications : fallbackApplications;
    return list
      .filter(a => !deletedAppIds.has(a.id))
      .map(a => {
        if (localAppOverrides[a.id]) {
          return { ...a, ...localAppOverrides[a.id] };
        }
        return a;
      });
  }, [rawApplications, fallbackApplications, localAppOverrides, deletedAppIds]);

  // Color mapping matching Employees / Leave / Payroll
  const getDeptColor = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('cardio')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (d.includes('emerg')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (d.includes('nurs') || d.includes('inpatient')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('pharm')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (d.includes('pediat')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (d.includes('diag') || d.includes('radio')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (d.includes('front desk') || d.includes('recept')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (d.includes('admin') || d.includes('human')) return 'bg-slate-100 text-slate-700 border-slate-300';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getStageBadge = (stage) => {
    const s = (stage || '').toUpperCase();
    if (s === 'HIRED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'OFFER' || s === 'OFFER_EXTENDED') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'INTERVIEW') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s === 'SCREENING') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // KPIs
  const kpis = useMemo(() => {
    const activeReqs = displayRequisitions.filter(r => (r.status || 'POSTED').toUpperCase() === 'POSTED').length;
    const totalVacancies = displayRequisitions.reduce((sum, r) => sum + (parseInt(r.vacancyCount) || 1), 0);
    const activeCandidates = displayApplications.filter(a => a.status !== 'REJECTED').length;
    const interviewCount = displayApplications.filter(a => (a.status || '').toUpperCase() === 'INTERVIEW').length;
    const hiredCount = displayApplications.filter(a => (a.status || '').toUpperCase() === 'HIRED').length;
    return { activeReqs, totalVacancies, activeCandidates, interviewCount, hiredCount };
  }, [displayRequisitions, displayApplications]);

  // Mutations
  const createReqMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/requisitions', payload)).data;
    },
    onSuccess: () => {
      toast.success('Job requisition posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobRequisitions'] });
      setIsModalOpen(false);
      setFormData({
        title: '',
        department: 'Cardiology',
        vacancyCount: 1,
        requiredQualifications: 'MBBS / MD / Relevant Clinical Board Certification',
        requiredExperienceYears: 3,
        minSalary: '',
        maxSalary: '',
        status: 'POSTED'
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to post job requisition');
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      setLocalAppOverrides(prev => ({ ...prev, [id]: { status } }));
      return (await axiosPrivate.put(`/hr/applications/${id}/status?status=${status}`, { status })).data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Candidate moved to ${vars.status} stage!`);
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      if (selectedCandidate && selectedCandidate.id === vars.id) {
        setSelectedCandidate(prev => prev ? { ...prev, status: vars.status } : null);
      }
    },
    onError: () => {
      toast.error('Could not update stage on server, updated locally.');
    }
  });

  const deleteReqMutation = useMutation({
    mutationFn: async (id) => {
      setDeletedRequisitionIds(prev => new Set(prev).add(id));
      return (await axiosPrivate.delete(`/hr/requisitions/${id}`)).data;
    },
    onSuccess: () => {
      toast.success('Job requisition removed');
      queryClient.invalidateQueries({ queryKey: ['jobRequisitions'] });
      if (selectedRequisition) setSelectedRequisition(null);
    },
    onError: () => {
      toast.error('Removed requisition locally');
    }
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id) => {
      setDeletedAppIds(prev => new Set(prev).add(id));
      return (await axiosPrivate.delete(`/hr/applications/${id}`)).data;
    },
    onSuccess: () => {
      toast.success('Candidate application removed');
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      if (selectedCandidate) setSelectedCandidate(null);
    },
    onError: () => {
      toast.error('Removed application locally');
    }
  });

  // Filtered Requisitions
  const filteredRequisitions = useMemo(() => {
    let list = displayRequisitions.filter(r => {
      const title = (r.title || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      const quals = (r.requiredQualifications || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || title.includes(q) || dept.includes(q) || quals.includes(q);
      const matchesDept = selectedDept === 'ALL' || dept === selectedDept.toLowerCase();

      return matchesSearch && matchesDept;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'vacancies') {
        cmp = (a.vacancyCount || 1) - (b.vacancyCount || 1);
      } else {
        cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [displayRequisitions, searchQuery, selectedDept, sortField, sortOrder]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    let list = displayApplications.filter(a => {
      const name = (a.applicantName || '').toLowerCase();
      const email = (a.applicantEmail || '').toLowerCase();
      const role = (a.jobRequisition?.title || '').toLowerCase();
      const dept = (a.jobRequisition?.department || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q);
      const matchesDept = selectedDept === 'ALL' || dept === selectedDept.toLowerCase();
      const matchesStage = selectedStage === 'ALL' || (a.status || '').toUpperCase() === selectedStage;

      return matchesSearch && matchesDept && matchesStage;
    });

    return list;
  }, [displayApplications, searchQuery, selectedDept, selectedStage]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a valid job title');
      return;
    }
    createReqMutation.mutate({
      title: formData.title,
      department: formData.department,
      vacancyCount: parseInt(formData.vacancyCount) || 1,
      requiredQualifications: formData.requiredQualifications,
      requiredExperienceYears: parseInt(formData.requiredExperienceYears) || 0,
      minSalary: formData.minSalary ? parseFloat(formData.minSalary) : null,
      maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : null,
      status: 'POSTED'
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (activeTab === 'requisitions') {
      if (filteredRequisitions.length === 0) {
        toast.error('No requisitions to export');
        return;
      }
      const headers = ['Requisition ID', 'Title', 'Department', 'Openings', 'Experience (Yrs)', 'Min Salary (₹)', 'Max Salary (₹)', 'Status'];
      const rows = filteredRequisitions.map(r => [
        `"#${r.id}"`,
        `"${r.title || ''}"`,
        `"${r.department || ''}"`,
        `"${r.vacancyCount || 1}"`,
        `"${r.requiredExperienceYears || 0}"`,
        `"${r.minSalary || ''}"`,
        `"${r.maxSalary || ''}"`,
        `"${r.status || 'POSTED'}"`
      ].join(','));
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `hospital_requisitions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Job requisitions exported to CSV!');
    } else {
      if (filteredApplications.length === 0) {
        toast.error('No candidate applications to export');
        return;
      }
      const headers = ['Candidate Name', 'Email', 'Phone', 'Applied Role', 'Department', 'Pipeline Stage', 'Applied Date'];
      const rows = filteredApplications.map(a => [
        `"${a.applicantName || ''}"`,
        `"${a.applicantEmail || ''}"`,
        `"${a.applicantPhone || ''}"`,
        `"${a.jobRequisition?.title || ''}"`,
        `"${a.jobRequisition?.department || ''}"`,
        `"${a.status || 'APPLIED'}"`,
        `"${a.createdAt ? a.createdAt.slice(0, 10) : ''}"`
      ].join(','));
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `candidate_pipeline_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Applications pipeline exported to CSV!');
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans"
    >
      {/* ── Top Portal Navigation Bar ───────────────────────────────── */}
      <HrTopNav />

      {/* ── Executive Header Banner ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Briefcase className="w-7 h-7 text-[#2864FF]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Recruitment & Talent Acquisition
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Publish clinical requisitions, manage interview pipelines, advance candidate applications, and accelerate institutional staffing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <Download size={17} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus size={15} /> + Create Job Requisition
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Requisitions</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.activeReqs}</p>
            <span className="text-[11px] font-bold text-blue-600">{kpis.totalVacancies} Open Vacancies</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Pipeline</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.activeCandidates}</p>
            <span className="text-[11px] font-bold text-slate-500">Active Talent Profiles</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Interview Rounds</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{kpis.interviewCount}</p>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Under Clinical Evaluation
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Offers & Hires</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{kpis.hiredCount}</p>
            <span className="text-[11px] font-bold text-emerald-600">Onboarded Specialists</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* ── Search, View Switcher & Department Filter Toolbar ─────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Row 1: Section Switcher & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
          {/* Module Section Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('requisitions')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'requisitions'
                  ? 'bg-[#2864FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase size={14} /> Job Requisitions ({displayRequisitions.length})
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'pipeline'
                  ? 'bg-[#2864FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus size={14} /> Applications Pipeline ({displayApplications.length})
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 lg:max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'requisitions' ? "Search requisitions by title or department..." : "Search candidates by name, email, or role..."}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
              />
            </div>

            {/* Layout toggle for pipeline */}
            {activeTab === 'pipeline' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setPipelineLayout('kanban')}
                  title="Kanban Board View"
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    pipelineLayout === 'kanban' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Columns size={16} />
                </button>
                <button
                  onClick={() => setPipelineLayout('table')}
                  title="Table View"
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    pipelineLayout === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ListFilter size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Stage Filter Pills (when in Pipeline view) */}
        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Stage:</span>
            {PIPELINE_STAGES.map(st => {
              const active = selectedStage === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStage(st.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[#2864FF] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Row 3: Department Filter Pills (rounded-full) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Department:</span>
          {DEPARTMENTS.map(dept => {
            const active = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab 1: Job Requisitions ──────────────────────────────────── */}
      {activeTab === 'requisitions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoadingReqs ? (
            <div className="p-16 text-center text-slate-500 font-semibold text-sm flex flex-col items-center justify-center gap-3">
              <RotateCw size={24} className="animate-spin text-blue-600" />
              Loading institutional job requisitions...
            </div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                <Briefcase size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No job requisitions found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                There are no open requisitions matching your filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                    <th className="py-4 px-6">JOB TITLE & REQUISITION</th>
                    <th className="py-4 px-6">DEPARTMENT</th>
                    <th className="py-4 px-6">OPENINGS</th>
                    <th className="py-4 px-6">SALARY BAND</th>
                    <th className="py-4 px-6">EXPERIENCE</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredRequisitions.map(req => {
                    const title = req.title || req.jobTitle || 'Clinical Specialist';
                    const openings = req.vacancyCount || req.headcount || 1;
                    const dept = req.department || 'General Medicine';
                    const salary = req.minSalary && req.maxSalary 
                      ? `₹${(req.minSalary / 1000).toFixed(0)}k - ₹${(req.maxSalary / 1000).toFixed(0)}k /mo` 
                      : 'Market Standard';
                    const exp = req.requiredExperienceYears ? `${req.requiredExperienceYears}+ Years` : '1+ Year';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Title & Requisition */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              <Briefcase size={18} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">{title}</span>
                              <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                                Req #{req.id} • Main Campus
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(dept)}`}>
                            <Bookmark size={12} className="fill-current" />
                            {dept}
                          </span>
                        </td>

                        {/* Openings */}
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-100">
                            {openings} Vacanc{openings > 1 ? 'ies' : 'y'}
                          </span>
                        </td>

                        {/* Salary Band */}
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {salary}
                        </td>

                        {/* Experience */}
                        <td className="py-4 px-6 font-semibold text-slate-600">
                          {exp}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {req.status || 'POSTED'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedRequisition(req)}
                              title="View Requisition Details"
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('pipeline');
                                setSearchQuery(title);
                              }}
                              title="Inspect Candidate Pipeline"
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-[#2864FF] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Users size={13} /> Pipeline
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this job requisition?')) {
                                  deleteReqMutation.mutate(req.id);
                                }
                              }}
                              title="Delete Requisition"
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Applications Pipeline ────────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Kanban Board Layout */}
          {pipelineLayout === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'].map(stageKey => {
                const stageCandidates = filteredApplications.filter(a => {
                  const s = (a.status || 'APPLIED').toUpperCase();
                  if (stageKey === 'OFFER') return s === 'OFFER' || s === 'OFFER_EXTENDED';
                  return s === stageKey;
                });

                const stageMeta = {
                  APPLIED: { title: 'Applied', color: 'bg-slate-100 text-slate-800 border-slate-200', countBg: 'bg-slate-200 text-slate-700' },
                  SCREENING: { title: 'Screening', color: 'bg-amber-50 text-amber-800 border-amber-200', countBg: 'bg-amber-200 text-amber-800' },
                  INTERVIEW: { title: 'Clinical Interview', color: 'bg-purple-50 text-purple-800 border-purple-200', countBg: 'bg-purple-200 text-purple-800' },
                  OFFER: { title: 'Offer Extended', color: 'bg-blue-50 text-blue-800 border-blue-200', countBg: 'bg-blue-200 text-blue-800' },
                  HIRED: { title: 'Hired & Joined', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', countBg: 'bg-emerald-200 text-emerald-800' }
                }[stageKey];

                return (
                  <div key={stageKey} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3 min-h-[420px] flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        {stageMeta.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${stageMeta.countBg}`}>
                        {stageCandidates.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto">
                      {stageCandidates.length === 0 ? (
                        <div className="p-6 text-center text-[11px] text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                          No applicants in this stage
                        </div>
                      ) : (
                        stageCandidates.map(c => {
                          const initials = (c.applicantName || 'Candidate')
                            .replace(/^(Dr\.|Mr\.|Ms\.)\s+/i, '')
                            .split(' ')
                            .map(w => w[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase();

                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCandidate(c)}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400 transition cursor-pointer space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-[#2864FF] text-white font-black text-xs flex items-center justify-center shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-xs leading-tight">{c.applicantName}</h4>
                                    <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">{c.applicantEmail}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-700 block line-clamp-1">
                                  {c.jobRequisition?.title || 'Clinical Specialist'}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getDeptColor(c.jobRequisition?.department)}`}>
                                  <Bookmark size={10} className="fill-current" />
                                  {c.jobRequisition?.department || 'Clinical Unit'}
                                </span>
                              </div>

                              {/* Card Footer with Quick Stage Advancement */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-slate-400">
                                  {c.createdAt ? c.createdAt.slice(0, 10) : 'Active'}
                                </span>
                                <span className="font-black text-[#2864FF] hover:underline flex items-center gap-0.5">
                                  Review <ArrowRight size={10} />
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                      <th className="py-4 px-6">CANDIDATE & CONTACT</th>
                      <th className="py-4 px-6">TARGET REQUISITION</th>
                      <th className="py-4 px-6">DEPARTMENT</th>
                      <th className="py-4 px-6">PIPELINE STAGE</th>
                      <th className="py-4 px-6">APPLIED DATE</th>
                      <th className="py-4 px-6 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredApplications.map(c => {
                      const initials = (c.applicantName || 'Candidate')
                        .replace(/^(Dr\.|Mr\.|Ms\.)\s+/i, '')
                        .split(' ')
                        .map(w => w[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-xl bg-[#2864FF] text-white font-black text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">{c.applicantName}</span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Mail size={11} className="text-slate-400" />
                                  {c.applicantEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 font-bold text-slate-800">
                            {c.jobRequisition?.title || 'Clinical Specialist'}
                          </td>

                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(c.jobRequisition?.department)}`}>
                              <Bookmark size={12} className="fill-current" />
                              {c.jobRequisition?.department || 'Clinical Unit'}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${getStageBadge(c.status)}`}>
                              {c.status || 'APPLIED'}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-semibold text-slate-500">
                            {c.createdAt ? c.createdAt.slice(0, 10) : 'Recent'}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCandidate(c)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-[#2864FF] font-bold text-xs transition cursor-pointer"
                              >
                                Review Dossier
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete candidate application?')) {
                                    deleteAppMutation.mutate(c.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 size={15} />
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
      )}

      {/* ── Create Job Requisition Modal (Fixed Edge-to-Edge Portal) ───── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 sm:p-8 space-y-6 my-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/80 text-[#2864FF] flex items-center justify-center shrink-0">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Create Job Requisition</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Publish a clinical vacancy and open candidate applications.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  {/* Job Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Job Title & Specialization <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Interventional Cardiologist"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
                    />
                  </div>

                  {/* Department & Vacancies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Clinical Department <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.department}
                          onChange={e => setFormData({ ...formData, department: e.target.value })}
                          className="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer appearance-none"
                        >
                          {DEPARTMENTS.filter(d => d !== 'ALL').map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Openings / Vacancies <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.vacancyCount}
                        onChange={e => setFormData({ ...formData, vacancyCount: e.target.value })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Experience & Facility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Required Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requiredExperienceYears}
                        onChange={e => setFormData({ ...formData, requiredExperienceYears: e.target.value })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Facility Location
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Main Hospital Campus & Critical Wing"
                        className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Minimum Monthly Salary (₹)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        placeholder="e.g. 75000"
                        value={formData.minSalary}
                        onChange={e => setFormData({ ...formData, minSalary: e.target.value })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Maximum Monthly Salary (₹)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        placeholder="e.g. 120000"
                        value={formData.maxSalary}
                        onChange={e => setFormData({ ...formData, maxSalary: e.target.value })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Qualifications & Clinical Credentials <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.requiredQualifications}
                      onChange={e => setFormData({ ...formData, requiredQualifications: e.target.value })}
                      placeholder="e.g. MBBS, MD with Medical Council of India / State Registration"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-11 px-6 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createReqMutation.isPending}
                      className="h-11 px-6 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-600 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createReqMutation.isPending ? 'Publishing...' : 'Publish Requisition'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Requisition Details Modal ─────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedRequisition && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 space-y-5 my-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center font-black">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedRequisition.title}</h3>
                      <p className="text-xs text-slate-500">Requisition ID: #{selectedRequisition.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequisition(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Department:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(selectedRequisition.department)}`}>
                      <Bookmark size={11} className="fill-current" />
                      {selectedRequisition.department}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Open Positions:</span>
                    <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      {selectedRequisition.vacancyCount || 1} Vacancies
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Salary Band:</span>
                    <span className="font-black text-slate-900">
                      {selectedRequisition.minSalary && selectedRequisition.maxSalary 
                        ? `₹${parseFloat(selectedRequisition.minSalary).toLocaleString('en-IN')} - ₹${parseFloat(selectedRequisition.maxSalary).toLocaleString('en-IN')} / month` 
                        : 'Competitive / Market Band'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Experience Required:</span>
                    <span className="font-bold text-slate-800">
                      {selectedRequisition.requiredExperienceYears || 0}+ Years clinical experience
                    </span>
                  </div>

                  <div className="py-2">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">Required Credentials</p>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 leading-relaxed">
                      {selectedRequisition.requiredQualifications || 'MBBS / MD / State Medical Council Registration'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequisition(null);
                      setActiveTab('pipeline');
                      setSearchQuery(selectedRequisition.title);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Users size={14} /> View Candidates ({displayApplications.filter(a => a.jobRequisition?.id === selectedRequisition.id).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRequisition(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Candidate Dossier Modal ───────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedCandidate && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 space-y-5 my-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center font-black">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedCandidate.applicantName}</h3>
                      <p className="text-xs text-slate-500">Applicant ID: #{selectedCandidate.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Applied Role:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedCandidate.jobRequisition?.title || 'Clinical Specialist'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Department:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(selectedCandidate.jobRequisition?.department)}`}>
                      <Bookmark size={11} className="fill-current" />
                      {selectedCandidate.jobRequisition?.department || 'Clinical Unit'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Email & Phone:</span>
                    <span className="font-bold text-slate-800 text-right">
                      {selectedCandidate.applicantEmail}<br />
                      <span className="text-[11px] text-slate-500 font-mono">{selectedCandidate.applicantPhone || '+91 98765 00000'}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Current Pipeline Stage:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getStageBadge(selectedCandidate.status)}`}>
                      {selectedCandidate.status || 'APPLIED'}
                    </span>
                  </div>

                  {/* Stage Advancement Quick Controls */}
                  <div className="py-2">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">Advance Stage</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map(st => (
                        <button
                          key={st}
                          onClick={() => updateStageMutation.mutate({ id: selectedCandidate.id, status: st })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            (selectedCandidate.status || '').toUpperCase() === st
                              ? 'bg-[#2864FF] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
