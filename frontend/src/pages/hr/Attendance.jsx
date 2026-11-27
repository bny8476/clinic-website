import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  CheckCircle2,
  Check,
  Search,
  Filter,
  RotateCw,
  User,
  Building,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Download,
  Plus,
  X,
  Edit2,
  Trash2,
  Users,
  Bookmark,
  ChevronDown,
  ArrowUpDown,
  Layers,
  Eye,
  BarChart2,
  Briefcase,
  Mail,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const SHIFT_TEMPLATES = [
  { id: 'GENERAL', name: 'General Shift (09:00 - 17:00)', start: '09:00', end: '17:00' },
  { id: 'MORNING', name: 'Morning Shift (08:00 - 16:00)', start: '08:00', end: '16:00' },
  { id: 'EVENING', name: 'Evening Shift (14:00 - 22:00)', start: '14:00', end: '22:00' },
  { id: 'NIGHT', name: 'Night Shift (22:00 - 06:00)', start: '22:00', end: '06:00' },
  { id: 'ON_CALL', name: 'Clinical On-Call (24h)', start: '08:00', end: '08:00' }
];

export default function Attendance() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('DAILY'); // 'DAILY' | 'MONTHLY'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('name'); // 'name' | 'time' | 'department' | 'status'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  // Form states
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:45',
    checkOut: '17:15',
    status: 'PRESENT',
    shift: 'MORNING',
    remarks: ''
  });

  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    remarks: ''
  });

  const [bulkForm, setBulkForm] = useState({
    department: 'ALL',
    checkIn: '08:50',
    status: 'PRESENT'
  });

  // 1. Fetch attendance records for selected date
  const { data: rawAttendance = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['hr-attendance', selectedDate],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/attendance', { params: { date: selectedDate } });
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 30_000
  });

  // 2. Fetch employee directory for roster & selectors
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
    staleTime: 60_000
  });

  // 3. Mutations
  const checkInMutation = useMutation({
    mutationFn: async (employeeId) => {
      return (await axiosPrivate.post(`/hr/attendance/check-in/${employeeId}`)).data;
    },
    onSuccess: () => {
      toast.success('Staff clocked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      refetch();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to clock in');
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async (employeeId) => {
      return (await axiosPrivate.post(`/hr/attendance/check-out/${employeeId}`)).data;
    },
    onSuccess: () => {
      toast.success('Staff clocked out successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      refetch();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to clock out');
    }
  });

  const recordManualMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/attendance/manual', payload)).data;
    },
    onSuccess: () => {
      toast.success('Attendance record recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      setIsRecordModalOpen(false);
      resetManualForm();
      refetch();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return (await axiosPrivate.put(`/hr/attendance/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success('Attendance entry updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      setIsEditModalOpen(false);
      setEditingAttendance(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update attendance');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return (await axiosPrivate.delete(`/hr/attendance/${id}`)).data;
    },
    onSuccess: () => {
      toast.success('Attendance record removed');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete attendance record');
    }
  });

  const bulkCheckInMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/attendance/bulk-check-in', payload)).data;
    },
    onSuccess: (data) => {
      toast.success(`Batch clocked in ${Array.isArray(data) ? data.length : ''} staff members!`);
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      setIsBulkModalOpen(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to process bulk clock in');
    }
  });

  const resetManualForm = () => {
    setManualForm({
      employeeId: employees[0]?.id || '',
      date: selectedDate,
      checkIn: '08:45',
      checkOut: '17:15',
      status: 'PRESENT',
      shift: 'MORNING',
      remarks: ''
    });
  };

  const openEditModal = (log) => {
    setEditingAttendance(log);
    const extractTime = (iso) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      } catch {
        return '';
      }
    };
    setEditForm({
      checkIn: extractTime(log.checkIn),
      checkOut: extractTime(log.checkOut),
      status: log.status || 'PRESENT',
      remarks: log.regularizationReason || ''
    });
    setIsEditModalOpen(true);
  };

  // Fallback demo data if no records exist in DB for this date
  const fallbackAttendance = useMemo(() => [
    {
      id: 101,
      date: selectedDate,
      employee: {
        id: 1,
        department: 'Cardiology',
        designation: 'Senior Cardiologist',
        user: { firstName: 'Dr. Marcus', lastName: 'Vance', email: 'vance@clinic.com' }
      },
      checkIn: `${selectedDate}T08:55:00Z`,
      checkOut: `${selectedDate}T17:10:00Z`,
      status: 'PRESENT',
      shiftName: 'Morning Shift'
    },
    {
      id: 102,
      date: selectedDate,
      employee: {
        id: 2,
        department: 'Emergency',
        designation: 'Charge Nurse',
        user: { firstName: 'Jane', lastName: 'Smith', email: 'nurse@clinic.com' }
      },
      checkIn: `${selectedDate}T09:02:00Z`,
      checkOut: null,
      status: 'PRESENT',
      shiftName: 'Morning Shift'
    },
    {
      id: 103,
      date: selectedDate,
      employee: {
        id: 3,
        department: 'Patient Front Desk',
        designation: 'Lead Medical Receptionist',
        user: { firstName: 'Sarah', lastName: 'Reception', email: 'receptionist@clinic.com' }
      },
      checkIn: `${selectedDate}T09:18:00Z`,
      checkOut: null,
      status: 'LATE',
      shiftName: 'General Shift'
    },
    {
      id: 104,
      date: selectedDate,
      employee: {
        id: 4,
        department: 'Pharmacy',
        designation: 'Chief Pharmacist',
        user: { firstName: 'Michael', lastName: 'Chang', email: 'm.chang@clinic.com' }
      },
      checkIn: null,
      checkOut: null,
      status: 'ON_LEAVE',
      shiftName: 'Morning Shift'
    }
  ], [selectedDate]);

  const displayLogs = rawAttendance.length > 0 ? rawAttendance : fallbackAttendance;

  // Department discovery
  const activeDepartments = useMemo(() => {
    const set = new Set(DEPARTMENTS);
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Compute duty hours
  const calculateDutyDuration = (inIso, outIso) => {
    if (!inIso) return null;
    const start = new Date(inIso).getTime();
    const end = outIso ? new Date(outIso).getTime() : Date.now();
    const diffMs = end - start;
    if (diffMs <= 0) return '0h 0m';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Filtered & Sorted logs
  const filteredLogs = useMemo(() => {
    let list = displayLogs.filter(log => {
      const emp = log.employee || {};
      const empName = (emp.user
        ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`
        : emp.name || `Staff #${emp.id || log.id}`).toLowerCase();
      const email = (emp.user?.email || emp.email || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || empName.includes(q) || email.includes(q) || dept.includes(q) || desig.includes(q);
      const matchesDept = selectedDept === 'ALL' || dept === selectedDept.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        const nameA = (a.employee?.user ? `${a.employee.user.firstName || ''} ${a.employee.user.lastName || ''}` : a.employee?.name || '').toLowerCase();
        const nameB = (b.employee?.user ? `${b.employee.user.firstName || ''} ${b.employee.user.lastName || ''}` : b.employee?.name || '').toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'department') {
        cmp = (a.employee?.department || '').localeCompare(b.employee?.department || '');
      } else if (sortField === 'time') {
        const timeA = a.checkIn || '';
        const timeB = b.checkIn || '';
        cmp = timeA.localeCompare(timeB);
      } else if (sortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [displayLogs, searchQuery, selectedDept, statusFilter, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length > 0 ? employees.length : displayLogs.length;
    const present = displayLogs.filter(l => l.status === 'PRESENT' || l.status === 'LATE').length;
    const late = displayLogs.filter(l => l.status === 'LATE').length;
    const onLeave = displayLogs.filter(l => l.status === 'ON_LEAVE' || l.status === 'ABSENT').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, late, onLeave, rate };
  }, [employees, displayLogs]);

  // Department colors matching Employees.jsx
  const getDeptColor = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('cardio')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (d.includes('emerg')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (d.includes('front desk') || d.includes('recept')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (d.includes('nurs')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('pharm')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (d.includes('pediat')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (d.includes('diag') || d.includes('radio')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (d.includes('admin') || d.includes('human')) return 'bg-slate-100 text-slate-700 border-slate-300';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No attendance logs to export');
      return;
    }
    const headers = ['ID,Employee Name,Email,Department,Designation,Date,Check In,Check Out,Duration,Status,Remarks'];
    const rows = filteredLogs.map(l => {
      const emp = l.employee || {};
      const name = emp.user ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() : emp.name || `Staff #${emp.id}`;
      const email = emp.user?.email || emp.email || '';
      const dept = emp.department || '';
      const desig = emp.designation || '';
      const date = l.date || selectedDate;
      const cin = l.checkIn ? new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      const cout = l.checkOut ? new Date(l.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      const dur = calculateDutyDuration(l.checkIn, l.checkOut) || '—';
      const status = l.status || 'PRESENT';
      const remarks = l.regularizationReason || '';
      return `${l.id},"${name}","${email}","${dept}","${desig}",${date},"${cin}","${cout}","${dur}","${status}","${remarks}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clinic_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance CSV report downloaded!');
  };

  // Handle Quick Clock In/Out for selected staff
  const handleClockToggle = (log) => {
    const empId = log.employee?.id || log.id;
    if (log.checkIn && !log.checkOut) {
      checkOutMutation.mutate(empId);
    } else {
      checkInMutation.mutate(empId);
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
            <Clock className="w-7 h-7 text-[#2864FF]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Workforce Attendance & Shift Management
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Monitor institutional staff punctuality, daily shift check-ins, biometric timestamps, and monthly attendance rosters.
            </p>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Date Selector with Today Button */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="ml-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-extrabold hover:bg-blue-200 transition cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            title="Export CSV Log"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Users size={14} /> Bulk Clock-In
          </button>

          <button
            onClick={() => {
              resetManualForm();
              setIsRecordModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus size={15} /> + Record Attendance
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Roster</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total} Personnel</p>
            <span className="text-[11px] font-bold text-blue-600">On active clinic roster</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present On Duty</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.present}</p>
            <span className="text-[11px] font-bold text-emerald-600">
              {stats.rate}% Attendance Rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.late}</p>
            <span className="text-[11px] font-bold text-amber-600">Punctuality alert threshold</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leaves / Off-Duty</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.onLeave}</p>
            <span className="text-[11px] font-bold text-purple-600">Approved clinical time-off</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* ── Search, Filter & Sort Controls ─────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, department, or clinical designation..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Status & Sorting Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Segmented Control */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
              {['ALL', 'PRESENT', 'LATE', 'ON_LEAVE', 'ABSENT'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white text-[#2864FF] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Integrated Sort Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <ArrowUpDown size={14} className="text-slate-400 mr-1.5 shrink-0" />
              <span className="text-slate-700 font-bold mr-1">Sort:</span>
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="name">Name</option>
                <option value="time">Check In Time</option>
                <option value="department">Department</option>
                <option value="status">Status</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 -ml-1 pointer-events-none" />
              <span className="text-slate-200 mx-2">|</span>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title="Toggle sort direction"
                className="font-black text-[11px] text-slate-600 hover:text-blue-600 transition cursor-pointer tracking-wider"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Department:</span>
          {activeDepartments.map(dept => {
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Attendance Log Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm flex flex-col items-center justify-center gap-3">
            <RotateCw size={24} className="animate-spin text-blue-600" />
            Loading workforce attendance timestamps...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
              <Clock size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No attendance entries recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No staff members have clocked in or have attendance records matching the chosen filters for {selectedDate}.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => { setSearchQuery(''); setSelectedDept('ALL'); setStatusFilter('ALL'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + Record Attendance
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Personnel & Contact</th>
                    <th className="py-4 px-6">Department & Role</th>
                    <th className="py-4 px-6">Date & Shift</th>
                    <th className="py-4 px-6">Check In</th>
                    <th className="py-4 px-6">Check Out</th>
                    <th className="py-4 px-6">Hours On Duty</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredLogs.map(log => {
                    const emp = log.employee || {};
                    const fullName = emp.user
                      ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim()
                      : emp.name || `Staff #${emp.id || log.id}`;
                    const email = emp.user?.email || emp.email || 'No email registered';
                    const initials = fullName
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'ST';

                    const checkInFormatted = log.checkIn
                      ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';
                    const checkOutFormatted = log.checkOut
                      ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';

                    const duration = calculateDutyDuration(log.checkIn, log.checkOut);
                    const isOnDuty = log.checkIn && !log.checkOut;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Personnel & Contact */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">{fullName}</span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail size={12} className="text-slate-400" />
                                {email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department & Role */}
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getDeptColor(emp.department)}`}>
                            <Bookmark size={12} className="shrink-0" />
                            {emp.department || 'General'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block mt-1">
                            {emp.designation || 'Staff Clinician'}
                          </span>
                        </td>

                        {/* Date & Shift */}
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 text-xs block">{log.date || selectedDate}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            {log.shiftName || log.shift?.name || 'General Shift'}
                          </span>
                        </td>

                        {/* Check In */}
                        <td className="py-4 px-6">
                          {log.checkIn ? (
                            <span className="font-bold text-emerald-600 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {checkInFormatted}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold">—</span>
                          )}
                        </td>

                        {/* Check Out */}
                        <td className="py-4 px-6">
                          {log.checkOut ? (
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              {checkOutFormatted}
                            </span>
                          ) : isOnDuty ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                              Active Shift
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold">—</span>
                          )}
                        </td>

                        {/* Hours On Duty */}
                        <td className="py-4 px-6">
                          {duration ? (
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{duration}</span>
                              <span className="text-[10px] text-slate-400 font-medium">Recorded time</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            log.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'LATE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : log.status === 'ON_LEAVE'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              log.status === 'PRESENT'
                                ? 'bg-emerald-500'
                                : log.status === 'LATE'
                                  ? 'bg-amber-500'
                                  : log.status === 'ON_LEAVE'
                                    ? 'bg-purple-500'
                                    : 'bg-rose-500'
                            }`}></span>
                            {(log.status || 'PRESENT').replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Clock In / Out Quick Action */}
                            <button
                              onClick={() => handleClockToggle(log)}
                              title={isOnDuty ? 'Clock Out Staff' : 'Clock In Staff'}
                              disabled={checkInMutation.isPending || checkOutMutation.isPending}
                              className={`px-2.5 h-8 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isOnDuty
                                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {isOnDuty ? <LogOut size={13} /> : <LogIn size={13} />}
                              <span>{isOnDuty ? 'Clock Out' : 'Clock In'}</span>
                            </button>

                            {/* Edit Attendance Record */}
                            <button
                              onClick={() => openEditModal(log)}
                              title="Edit Attendance Entry"
                              className="w-8 h-8 rounded-xl border border-blue-200/90 text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Delete Attendance Entry */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete attendance record for ${fullName}?`)) {
                                  deleteMutation.mutate(log.id);
                                }
                              }}
                              title="Delete Attendance Entry"
                              className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div>
                Showing <span className="font-bold text-slate-900">{filteredLogs.length}</span> of <span className="font-bold text-slate-900">{displayLogs.length}</span> staff shift logs for <span className="font-bold text-blue-600">{selectedDate}</span>
                {(searchQuery || selectedDept !== 'ALL' || statusFilter !== 'ALL') && (
                  <span className="ml-1 text-blue-600 font-bold">(Filtered)</span>
                )}
              </div>
              {(searchQuery || selectedDept !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedDept('ALL'); setStatusFilter('ALL'); }}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} /> Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Record / Adjust Attendance Modal ──────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isRecordModalOpen && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-lg w-full p-5 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Record Staff Attendance</h3>
                      <p className="text-xs text-slate-500 font-medium">Manual time log, shift placement, or badge regularization</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsRecordModalOpen(false); resetManualForm(); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!manualForm.employeeId) {
                      toast.error('Please select an employee');
                      return;
                    }
                    recordManualMutation.mutate({
                      employeeId: manualForm.employeeId,
                      date: manualForm.date,
                      checkIn: manualForm.checkIn,
                      checkOut: manualForm.checkOut,
                      status: manualForm.status,
                      remarks: manualForm.remarks
                    });
                  }}
                  className="flex-1 overflow-y-auto pr-1 py-4 space-y-4"
                >
                  {/* Staff Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Select Staff Member <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={manualForm.employeeId}
                        onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })}
                        required
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                      >
                        <option value="">-- Choose employee from directory --</option>
                        {employees.map(emp => {
                          const n = emp.user ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() : emp.name || `Staff #${emp.id}`;
                          return (
                            <option key={emp.id} value={emp.id}>
                              {n} ({emp.department || 'General'} - {emp.designation || 'Staff'})
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Date & Shift */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Attendance Date
                      </label>
                      <input
                        type="date"
                        value={manualForm.date}
                        onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                        required
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Shift Schedule
                      </label>
                      <div className="relative">
                        <select
                          value={manualForm.shift}
                          onChange={e => setManualForm({ ...manualForm, shift: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                        >
                          {SHIFT_TEMPLATES.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Check In / Out Time Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Clock In Time
                      </label>
                      <input
                        type="time"
                        value={manualForm.checkIn}
                        onChange={e => setManualForm({ ...manualForm, checkIn: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Clock Out Time
                      </label>
                      <input
                        type="time"
                        value={manualForm.checkOut}
                        onChange={e => setManualForm({ ...manualForm, checkOut: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Attendance Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Punctuality & Attendance Status
                    </label>
                    <div className="relative">
                      <select
                        value={manualForm.status}
                        onChange={e => setManualForm({ ...manualForm, status: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                      >
                        <option value="PRESENT">PRESENT (Standard Shift)</option>
                        <option value="LATE">LATE (Delayed arrival)</option>
                        <option value="HALF_DAY">HALF DAY (Partial Shift)</option>
                        <option value="OVERTIME">OVERTIME (Extended Shift)</option>
                        <option value="ON_LEAVE">ON LEAVE (Time-off record)</option>
                        <option value="ABSENT">ABSENT (Unexcused Absence)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Adjustment Reason / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Card badge error, biometric scanner sync, overtime approved"
                      value={manualForm.remarks}
                      onChange={e => setManualForm({ ...manualForm, remarks: e.target.value })}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Modal Action Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsRecordModalOpen(false); resetManualForm(); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={recordManualMutation.isPending}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      {recordManualMutation.isPending ? 'Saving...' : 'Confirm & Log Attendance'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Edit Attendance Entry Modal ───────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditModalOpen && editingAttendance && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-lg w-full p-5 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Edit2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Edit Attendance Record</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {editingAttendance.employee?.user
                          ? `${editingAttendance.employee.user.firstName} ${editingAttendance.employee.user.lastName}`
                          : `Staff #${editingAttendance.employee?.id || editingAttendance.id}`} • {editingAttendance.date || selectedDate}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsEditModalOpen(false); setEditingAttendance(null); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate({
                      id: editingAttendance.id,
                      payload: {
                        checkIn: editForm.checkIn,
                        checkOut: editForm.checkOut,
                        status: editForm.status,
                        remarks: editForm.remarks
                      }
                    });
                  }}
                  className="flex-1 overflow-y-auto pr-1 py-4 space-y-4"
                >
                  {/* Check In / Out Time Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Clock In Time
                      </label>
                      <input
                        type="time"
                        value={editForm.checkIn}
                        onChange={e => setEditForm({ ...editForm, checkIn: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Clock Out Time
                      </label>
                      <input
                        type="time"
                        value={editForm.checkOut}
                        onChange={e => setEditForm({ ...editForm, checkOut: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                      >
                        <option value="PRESENT">PRESENT</option>
                        <option value="LATE">LATE</option>
                        <option value="HALF_DAY">HALF DAY</option>
                        <option value="OVERTIME">OVERTIME</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="ABSENT">ABSENT</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Adjustment Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Regularized by HR"
                      value={editForm.remarks}
                      onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Modal Action Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsEditModalOpen(false); setEditingAttendance(null); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      {updateMutation.isPending ? 'Updating...' : 'Save Adjustments'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Bulk Clock-In Modal ───────────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isBulkModalOpen && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-md w-full p-5 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Batch Roster Clock-In</h3>
                      <p className="text-xs text-slate-500 font-medium">Clock in on-duty staff across hospital units</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBulkModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const targetStaff = employees.filter(emp => {
                      if (bulkForm.department === 'ALL') return true;
                      return (emp.department || '').toLowerCase() === bulkForm.department.toLowerCase();
                    });
                    if (targetStaff.length === 0) {
                      toast.error('No employees found in selected department');
                      return;
                    }
                    bulkCheckInMutation.mutate({
                      employeeIds: targetStaff.map(emp => emp.id),
                      date: selectedDate,
                      checkIn: bulkForm.checkIn,
                      status: bulkForm.status
                    });
                  }}
                  className="flex-1 overflow-y-auto pr-1 py-4 space-y-4"
                >
                  {/* Department Filter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Target Department
                    </label>
                    <div className="relative">
                      <select
                        value={bulkForm.department}
                        onChange={e => setBulkForm({ ...bulkForm, department: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                      >
                        {activeDepartments.map(d => (
                          <option key={d} value={d}>
                            {d === 'ALL' ? 'All Hospital Departments' : d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Default Clock-in Time */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Default Clock-In Time
                    </label>
                    <input
                      type="time"
                      value={bulkForm.checkIn}
                      onChange={e => setBulkForm({ ...bulkForm, checkIn: e.target.value })}
                      required
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                    />
                  </div>

                  {/* Summary note */}
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-blue-600 shrink-0" />
                      <span>Roster Sync Notice</span>
                    </p>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      This will initialize or synchronize clock-in records for all active personnel in the selected clinical unit for <strong>{selectedDate}</strong>.
                    </p>
                  </div>

                  {/* Modal Action Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsBulkModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkCheckInMutation.isPending}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Users size={14} />
                      {bulkCheckInMutation.isPending ? 'Processing...' : 'Execute Batch Clock-In'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
