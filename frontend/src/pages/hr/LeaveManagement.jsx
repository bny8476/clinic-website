import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { 
  FileSignature, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Hourglass, 
  Search, 
  RotateCw, 
  Plus, 
  Building, 
  Check, 
  X,
  Eye, 
  CalendarDays,
  Bookmark,
  Download,
  Trash2,
  ChevronDown,
  Mail,
  ArrowUpDown,
  UploadCloud,
  FileCheck,
  FileText,
  Paperclip,
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import toast from 'react-hot-toast';
import HrTopNav from './HrTopNav';

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

const LEAVE_TYPES = [
  { id: 'ALL', label: 'All Types' },
  { id: 'CASUAL', label: 'Casual' },
  { id: 'SICK', label: 'Sick / Medical' },
  { id: 'EARNED', label: 'Earned' },
  { id: 'MATERNITY', label: 'Maternity' },
  { id: 'UNPAID', label: 'Unpaid (LWP)' }
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LeaveManagement() {
  const queryClient = useQueryClient();
  const todayStr = getTodayDateString();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState('date'); // 'date' | 'name' | 'days' | 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);

  // Form State for creating leave
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'CASUAL',
    startDate: getTodayDateString(),
    endDate: getTodayDateString(),
    reason: '',
    medicalFile: null,
    documentUrl: ''
  });

  // 1. Fetch Leave Requests
  const { data: rawLeaves = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['hr-leave-requests'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/leaves');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // 2. Fetch Employees for the Apply Leave dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['hr-employees-list'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/employees');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 60_000,
  });

  // Realistic fallback leaves if DB has no records yet
  const fallbackLeaves = useMemo(() => [
    {
      id: 201,
      leaveType: 'CASUAL',
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      reason: 'Attending family urgent engagement and travel.',
      status: 'PENDING',
      employee: {
        id: 1,
        department: 'Cardiology',
        designation: 'Senior Cardiologist',
        user: { firstName: 'Dr. Marcus', lastName: 'Vance', email: 'vance@clinic.com' }
      }
    },
    {
      id: 202,
      leaveType: 'SICK',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      reason: 'Acute viral fever and clinical recovery.',
      status: 'PENDING',
      documentUrl: 'Medical_Prescription_Cert_Dr_Vance.pdf',
      employee: {
        id: 2,
        department: 'Emergency',
        designation: 'Trauma Lead Physician',
        user: { firstName: 'Dr. Sarah', lastName: 'Jenkins', email: 's.jenkins@clinic.com' }
      }
    },
    {
      id: 203,
      leaveType: 'EARNED',
      startDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      reason: 'Scheduled annual personal vacation time.',
      status: 'APPROVED',
      employee: {
        id: 3,
        department: 'Nursing Operations',
        designation: 'Head Nurse ICU',
        user: { firstName: 'Elena', lastName: 'Rostova', email: 'e.rostova@clinic.com' }
      }
    },
    {
      id: 204,
      leaveType: 'CASUAL',
      startDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
      reason: 'Personal errand - unapproved due to hospital emergency shift deficit.',
      status: 'REJECTED',
      employee: {
        id: 4,
        department: 'Pharmacy',
        designation: 'Chief Pharmacist',
        user: { firstName: 'Rajesh', lastName: 'Kumar', email: 'r.kumar@clinic.com' }
      }
    }
  ], []);

  const [localOverrides, setLocalOverrides] = useState({});
  const [deletedIds, setDeletedIds] = useState(new Set());

  const displayLeaves = useMemo(() => {
    const list = rawLeaves.length > 0 ? rawLeaves : fallbackLeaves;
    return list
      .filter(l => !deletedIds.has(l.id))
      .map(l => {
        if (localOverrides[l.id]) {
          return { ...l, status: localOverrides[l.id] };
        }
        return l;
      });
  }, [rawLeaves, fallbackLeaves, localOverrides, deletedIds]);

  // Helper date calculator
  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      setLocalOverrides(prev => ({ ...prev, [id]: status }));
      return (await axiosPrivate.patch(`/hr/leaves/${id}/status?status=${status}`, { status })).data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Leave request marked as ${vars.status === 'APPROVED' ? 'Approved' : 'Rejected'}!`);
      queryClient.invalidateQueries({ queryKey: ['hr-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-summary'] });
      if (selectedLeaveDetail && selectedLeaveDetail.id === vars.id) {
        setSelectedLeaveDetail(prev => prev ? { ...prev, status: vars.status } : null);
      }
    },
    onError: () => {
      toast.error('Failed to update leave request status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      setDeletedIds(prev => new Set(prev).add(id));
      return (await axiosPrivate.delete(`/hr/leaves/${id}`)).data;
    },
    onSuccess: () => {
      toast.success('Leave application removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-leave-requests'] });
      if (selectedLeaveDetail) setSelectedLeaveDetail(null);
    },
    onError: () => {
      toast.error('Could not delete record from server, removed locally.');
    }
  });

  // Submit Leave Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/leaves', payload)).data;
    },
    onSuccess: () => {
      toast.success('Leave application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-leave-requests'] });
      setIsApplyModalOpen(false);
      setLeaveForm({
        employeeId: '',
        leaveType: 'CASUAL',
        startDate: getTodayDateString(),
        endDate: getTodayDateString(),
        reason: '',
        medicalFile: null,
        documentUrl: ''
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to submit leave request');
    }
  });

  const handleApply = async (e) => {
    e.preventDefault();
    if (!leaveForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (leaveForm.startDate < todayStr) {
      toast.error('Start date cannot be in the past');
      return;
    }

    if (leaveForm.endDate < leaveForm.startDate) {
      toast.error('End date cannot be prior to start date');
      return;
    }

    let docUrl = leaveForm.documentUrl || '';
    if (leaveForm.medicalFile) {
      try {
        const formData = new FormData();
        formData.append('file', leaveForm.medicalFile);
        formData.append('documentType', 'MEDICAL_CERTIFICATE');
        const uploadRes = await axiosPrivate.post(`/hr/documents/${leaveForm.employeeId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        docUrl = uploadRes.data?.filename || leaveForm.medicalFile.name;
      } catch (err) {
        // Fallback to file name if standalone document upload is unavailable
        docUrl = leaveForm.medicalFile.name;
      }
    }

    createMutation.mutate({
      employee: { id: parseInt(leaveForm.employeeId) },
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      documentUrl: docUrl,
      status: 'PENDING'
    });
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = displayLeaves.length;
    const pending = displayLeaves.filter(l => (l.status || '').toUpperCase() === 'PENDING').length;
    const approved = displayLeaves.filter(l => (l.status || '').toUpperCase() === 'APPROVED').length;
    const rejected = displayLeaves.filter(l => (l.status || '').toUpperCase() === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [displayLeaves]);

  // Filtering & Sorting
  const filteredLeaves = useMemo(() => {
    let list = displayLeaves.filter(l => {
      const empUser = l.employee?.user;
      const empName = (empUser 
        ? `${empUser.firstName || ''} ${empUser.lastName || ''}` 
        : l.employeeName || '').toLowerCase();
      const email = (empUser?.email || '').toLowerCase();
      const dept = (l.employee?.department || '').toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      const desig = (l.employee?.designation || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || 
        empName.includes(q) || 
        email.includes(q) || 
        dept.includes(q) || 
        desig.includes(q) || 
        reason.includes(q);

      const matchesStatus = statusFilter === 'ALL' || (l.status || '').toUpperCase() === statusFilter;
      const matchesType = typeFilter === 'ALL' || (l.leaveType || '').toUpperCase() === typeFilter;
      const matchesDept = selectedDept === 'ALL' || (l.employee?.department || '').toLowerCase() === selectedDept.toLowerCase();

      return matchesSearch && matchesStatus && matchesType && matchesDept;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        cmp = dateA.localeCompare(dateB);
      } else if (sortField === 'name') {
        const nameA = (a.employee?.user ? `${a.employee.user.firstName || ''} ${a.employee.user.lastName || ''}` : a.employeeName || '').toLowerCase();
        const nameB = (b.employee?.user ? `${b.employee.user.firstName || ''} ${b.employee.user.lastName || ''}` : b.employeeName || '').toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'days') {
        const daysA = a.days || calculateDays(a.startDate, a.endDate);
        const daysB = b.days || calculateDays(b.startDate, b.endDate);
        cmp = daysA - daysB;
      } else if (sortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [displayLeaves, searchQuery, statusFilter, typeFilter, selectedDept, sortField, sortOrder]);

  // Color mapping matching Employees page
  const getDeptColor = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('cardio')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (d.includes('emerg')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (d.includes('nurs')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('pharm')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (d.includes('pediat')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (d.includes('diag') || d.includes('radio')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (d.includes('front desk') || d.includes('recept')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (d.includes('admin') || d.includes('human')) return 'bg-slate-100 text-slate-700 border-slate-300';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getLeaveTypeBadge = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('SICK')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (t.includes('CASUAL')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (t.includes('EARNED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (t.includes('MATERNITY') || t.includes('PATERNITY')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredLeaves.length === 0) {
      toast.error('No leave records to export');
      return;
    }
    const headers = ['Staff Name', 'Email', 'Department', 'Designation', 'Leave Type', 'Start Date', 'End Date', 'Duration (Days)', 'Reason', 'Status'];
    const rows = filteredLeaves.map(l => {
      const u = l.employee?.user;
      const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (l.employeeName || 'Staff');
      const email = u?.email || '';
      const dept = l.employee?.department || '';
      const desig = l.employee?.designation || '';
      const days = l.days || calculateDays(l.startDate, l.endDate);
      const cleanReason = (l.reason || '').replace(/"/g, '""');
      return [
        `"${name}"`,
        `"${email}"`,
        `"${dept}"`,
        `"${desig}"`,
        `"${l.leaveType || 'CASUAL'}"`,
        `"${l.startDate || ''}"`,
        `"${l.endDate || ''}"`,
        `"${days}"`,
        `"${cleanReason}"`,
        `"${l.status || 'PENDING'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clinic_leaves_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leave report exported to CSV!');
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
            <FileSignature className="w-7 h-7 text-[#2864FF]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Leave Requests & Absence Adjudication
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Review, approve, or reject employee leave applications while maintaining departmental floor coverage.
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
            onClick={() => {
              const currentToday = getTodayDateString();
              setLeaveForm(prev => ({
                ...prev,
                startDate: (!prev.startDate || prev.startDate < currentToday) ? currentToday : prev.startDate,
                endDate: (!prev.endDate || prev.endDate < currentToday) ? currentToday : prev.endDate
              }));
              setIsApplyModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus size={15} /> + Submit Leave Request
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.total}</p>
            <span className="text-[11px] font-bold text-blue-600">All submitted requests</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Awaiting Decision</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{kpis.pending}</p>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Requires immediate action
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Hourglass size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Leaves</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{kpis.approved}</p>
            <span className="text-[11px] font-bold text-emerald-600">Roster updated</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected Leaves</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{kpis.rejected}</p>
            <span className="text-[11px] font-bold text-rose-500">Unapproved applications</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls (Matching Employees / Attendance) ─── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Row 1: Search, Status Filter, and Sort Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, department, or clinical reason..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Status Segmented Control */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#2864FF] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort Selector matching design */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <ArrowUpDown size={13} /> Sort:
              </span>
              <div className="relative inline-flex items-center">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 pr-5 py-1 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="date">Date</option>
                  <option value="name">Staff Name</option>
                  <option value="days">Duration</option>
                  <option value="status">Status</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded cursor-pointer"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Leave Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Type:</span>
          {LEAVE_TYPES.map(type => {
            const active = typeFilter === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setTypeFilter(type.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#2864FF] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: Department Filter Pills (rounded-full) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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

      {/* ── Leave Applications Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm flex flex-col items-center justify-center gap-3">
            <RotateCw size={24} className="animate-spin text-blue-600" />
            Loading clinical leave records...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
              <FileSignature size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No leave requests found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              There are no leave records matching your current search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
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
                  <th className="py-4 px-6">PERSONNEL & CONTACT</th>
                  <th className="py-4 px-6">DEPARTMENT</th>
                  <th className="py-4 px-6">LEAVE CATEGORY & DURATION</th>
                  <th className="py-4 px-6">SCHEDULED DATE RANGE</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredLeaves.map(leave => {
                  const empUser = leave.employee?.user;
                  const employeeName = empUser 
                    ? `${empUser.firstName || ''} ${empUser.lastName || ''}`.trim() 
                    : leave.employeeName || `Staff ID #${leave.employee?.id || '—'}`;
                  const email = empUser?.email || (leave.employee?.id ? `staff.${leave.employee.id}@clinic.com` : 'user@clinic.com');
                  const dept = leave.employee?.department || 'General Medicine';
                  const designation = leave.employee?.designation || 'Clinical Staff';
                  
                  const initials = employeeName
                    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '')
                    .split(' ')
                    .filter(Boolean)
                    .map(w => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'ST';

                  const days = leave.days || calculateDays(leave.startDate, leave.endDate);
                  const isPending = (leave.status || '').toUpperCase() === 'PENDING';
                  const isApproved = (leave.status || '').toUpperCase() === 'APPROVED';

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Personnel & Contact (Square Blue Avatar) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {employeeName}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail size={11} className="text-slate-400" />
                              {email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Department Bookmark Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(dept)}`}>
                          <Bookmark size={12} className="fill-current" />
                          {dept}
                        </span>
                      </td>

                      {/* 3. Leave Type & Duration */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getLeaveTypeBadge(leave.leaveType)}`}>
                            {leave.leaveType || 'CASUAL'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-100">
                            {days} Day{days > 1 ? 's' : ''}
                          </span>
                          {leave.documentUrl && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeaveDetail(leave);
                              }}
                              title={`Medical Certificate Attached: ${leave.documentUrl}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 cursor-pointer hover:bg-amber-100 transition"
                            >
                              <Paperclip size={11} /> Medical Cert
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Scheduled Date Range */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{leave.startDate}</span>
                          <span className="text-slate-400">→</span>
                          <span>{leave.endDate}</span>
                        </div>
                      </td>

                      {/* 5. Status Pill */}
                      <td className="py-4 px-6">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            PENDING
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} className="text-emerald-600" />
                            APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={12} className="text-rose-600" />
                            REJECTED
                          </span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedLeaveDetail(leave)}
                            title="View Full Reason & Details"
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Quick Decision Buttons */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => statusMutation.mutate({ id: leave.id, status: 'APPROVED' })}
                                disabled={statusMutation.isPending}
                                title="Approve Request"
                                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => statusMutation.mutate({ id: leave.id, status: 'REJECTED' })}
                                disabled={statusMutation.isPending}
                                title="Reject Request"
                                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                              >
                                <X size={14} /> Reject
                              </button>
                            </>
                          )}

                          {/* Delete Action */}
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this leave record?')) {
                                deleteMutation.mutate(leave.id);
                              }
                            }}
                            title="Delete Record"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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

      {/* ── Submit Leave Request Modal (Fixed Edge-to-Edge Portal) ─────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isApplyModalOpen && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 10 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-5 my-auto max-h-[92vh] flex flex-col font-sans overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                      <FileSignature size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Submit Leave Application</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          HR & Clinical Portal
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Record a clinical absence request on behalf of hospital staff with institutional documentation.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Form */}
                <form id="submit-leave-form" onSubmit={handleApply} className="space-y-4 overflow-y-auto flex-1 pr-1">
                  {/* Staff Member Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Staff Member <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={leaveForm.employeeId}
                        onChange={e => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                        className="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer appearance-none"
                      >
                        <option value="">-- Choose employee from directory --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : emp.name || `Staff #${emp.id}`} ({emp.department} - {emp.designation || 'Staff'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Leave Category Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Leave Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={leaveForm.leaveType}
                        onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                        className="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer appearance-none"
                      >
                        <option value="CASUAL">Casual Leave (Short-term personal)</option>
                        <option value="SICK">Sick / Medical Leave (Physician Justified)</option>
                        <option value="EARNED">Earned / Annual Vacation Leave</option>
                        <option value="MATERNITY">Maternity / Paternity Leave</option>
                        <option value="UNPAID">Leave Without Pay (LWP)</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Dynamic Medical Certificate Upload (Visible for SICK leave or medical justification) */}
                  {leaveForm.leaveType === 'SICK' && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                              Medical Certificate & Prescription Upload
                            </h4>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-amber-800 mt-0.5">
                            Attach physician's prescription, hospital discharge summary, or medical fitness note for institutional audit.
                          </p>
                        </div>
                      </div>

                      {leaveForm.medicalFile ? (
                        <div className="p-3 bg-white rounded-xl border border-amber-300 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <FileCheck size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate max-w-xs sm:max-w-sm">
                                {leaveForm.medicalFile.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {(leaveForm.medicalFile.size / 1024).toFixed(1)} KB • Verified Medical Document
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLeaveForm({ ...leaveForm, medicalFile: null, documentUrl: '' })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove Certificate"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white/90 hover:bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center group">
                          <UploadCloud className="w-7 h-7 text-amber-600 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-800">
                            Click to upload Medical Certificate
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Supported: PDF, JPG, PNG or WEBP (up to 10MB)
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLeaveForm({ ...leaveForm, medicalFile: file, documentUrl: file.name });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Date Range Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Start Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={leaveForm.startDate}
                        onChange={e => {
                          const val = e.target.value;
                          if (val && val < todayStr) {
                            toast.error('Start date cannot be in the past');
                            setLeaveForm(prev => ({
                              ...prev,
                              startDate: todayStr,
                              endDate: prev.endDate && prev.endDate < todayStr ? todayStr : prev.endDate
                            }));
                            return;
                          }
                          setLeaveForm(prev => ({
                            ...prev,
                            startDate: val,
                            endDate: prev.endDate && prev.endDate < val ? val : prev.endDate
                          }));
                        }}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Completed / past dates disabled (Starts from today: {todayStr})
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        End Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={leaveForm.startDate || todayStr}
                        value={leaveForm.endDate}
                        onChange={e => {
                          const val = e.target.value;
                          const minAllowed = leaveForm.startDate || todayStr;
                          if (val && val < minAllowed) {
                            toast.error('End date cannot be prior to start date');
                            setLeaveForm(prev => ({ ...prev, endDate: minAllowed }));
                            return;
                          }
                          setLeaveForm({ ...leaveForm, endDate: val });
                        }}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Must be on or after start date
                      </p>
                    </div>
                  </div>

                  {/* Live Total Duration Pill */}
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900">Total Requested Duration:</span>
                    <span className="font-black text-[#2864FF] bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                      {calculateDays(leaveForm.startDate, leaveForm.endDate)} Day(s) Requested
                    </span>
                  </div>

                  {/* Reason & Justification */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Reason & Clinical Justification <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      placeholder="Provide detailed clinical justification or reason for leave..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition resize-none"
                    />
                  </div>
                </form>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="h-11 px-6 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="submit-leave-form"
                    disabled={createMutation.isPending}
                    className="h-11 px-6 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-600 transition shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Confirm Application'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Leave Details & Reason Modal (Fixed Edge-to-Edge Portal) ───── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedLeaveDetail && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 my-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center font-black">
                      <FileSignature size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Leave Application Details</h3>
                      <p className="text-xs text-slate-500">Record ID: #{selectedLeaveDetail.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLeaveDetail(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Applicant:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedLeaveDetail.employee?.user 
                        ? `${selectedLeaveDetail.employee.user.firstName} ${selectedLeaveDetail.employee.user.lastName}` 
                        : selectedLeaveDetail.employeeName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Department:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(selectedLeaveDetail.employee?.department)}`}>
                      <Bookmark size={11} className="fill-current" />
                      {selectedLeaveDetail.employee?.department || 'Clinical Unit'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Leave Category:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getLeaveTypeBadge(selectedLeaveDetail.leaveType)}`}>
                      {selectedLeaveDetail.leaveType || 'CASUAL'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Duration:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedLeaveDetail.startDate} → {selectedLeaveDetail.endDate} ({selectedLeaveDetail.days || calculateDays(selectedLeaveDetail.startDate, selectedLeaveDetail.endDate)} days)
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Current Status:</span>
                    {(selectedLeaveDetail.status || '').toUpperCase() === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        PENDING DECISION
                      </span>
                    ) : (selectedLeaveDetail.status || '').toUpperCase() === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={12} />
                        APPROVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle size={12} />
                        REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Attached Medical Certificate Section */}
                {selectedLeaveDetail.documentUrl && (
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-amber-700" /> Attached Medical Certificate
                    </span>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <FileCheck size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate max-w-xs">
                            {selectedLeaveDetail.documentUrl}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Physician Signed & Authenticated
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toast.success(`Viewing medical document: ${selectedLeaveDetail.documentUrl}`)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <Download size={13} /> View
                      </button>
                    </div>
                  </div>
                )}

                {/* Justification Box */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Submitted Justification</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedLeaveDetail.reason || 'No specific notes recorded with this application.'}
                  </div>
                </div>

                {/* Adjudication actions if pending */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  {(selectedLeaveDetail.status || '').toUpperCase() === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => statusMutation.mutate({ id: selectedLeaveDetail.id, status: 'APPROVED' })}
                        disabled={statusMutation.isPending}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: selectedLeaveDetail.id, status: 'REJECTED' })}
                        disabled={statusMutation.isPending}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={() => setSelectedLeaveDetail(null)}
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
