import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  RotateCw, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Eye, 
  ShieldCheck, 
  X,
  CreditCard,
  Briefcase,
  Edit2,
  Download,
  Printer,
  ArrowUpDown,
  Check,
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  UserCheck,
  Power,
  Bookmark,
  ChevronDown
} from 'lucide-react';
import { fadeIn } from '../../components/ui/motion';
import { motion, AnimatePresence } from 'framer-motion';
import HrTopNav from './HrTopNav';

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

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

const EMPLOYMENT_TYPES = [
  { id: 'ALL', label: 'All Types' },
  { id: 'FULL_TIME', label: 'Full Time' },
  { id: 'PART_TIME', label: 'Part Time' },
  { id: 'CONTRACT', label: 'Contract' },
  { id: 'CONSULTANT', label: 'Visiting Consultant' }
];

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortField, setSortField] = useState('name'); // 'name' | 'department' | 'salary' | 'date'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Modals state
  const [selectedEmpDetails, setSelectedEmpDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Multi-step Onboarding Form state
  const [activeFormTab, setActiveFormTab] = useState('ROLE'); // 'ROLE' | 'CREDENTIALS' | 'STATUTORY'
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    department: 'Cardiology',
    designation: '',
    employmentType: 'FULL_TIME',
    salary: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    reportingManagerId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    taxIdentifier: '',
    isActive: true
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    department: 'Cardiology',
    designation: '',
    employmentType: 'FULL_TIME',
    salary: '',
    dateOfJoining: '',
    reportingManagerId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    taxIdentifier: '',
    isActive: true
  });

  const debouncedUserSearch = useDebouncedValue(userSearch, 300);

  // 1. Fetch users for onboarding link
  const { data: userResults = [], isFetching: userSearchLoading } = useQuery({
    queryKey: ['user-search', debouncedUserSearch],
    queryFn: async () => {
      if (!debouncedUserSearch.trim()) return [];
      const res = await axiosPrivate.get('/users/search', { params: { q: debouncedUserSearch } });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: debouncedUserSearch.length >= 1,
    staleTime: 30_000,
  });

  // 2. Fetch employee directory
  const { data: employees = [], isLoading, refetch, isFetching } = useQuery({
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

  // 3. Onboard Mutation (POST /hr/employees)
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/employees', payload)).data;
    },
    onSuccess: () => {
      toast.success('Staff member onboarded successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-summary'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to onboard employee');
    }
  });

  // 4. Update Mutation (PUT /hr/employees/:id)
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return (await axiosPrivate.put(`/hr/employees/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success('Employee record updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-summary'] });
      setIsEditModalOpen(false);
      setEditingEmployee(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update employee');
    }
  });

  // 5. Status Toggle Mutation (PATCH /hr/employees/:id/status)
  const statusMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      return (await axiosPrivate.patch(`/hr/employees/${id}/status?active=${active}`, { active })).data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Staff member marked as ${vars.active ? 'ACTIVE' : 'INACTIVE'}`);
      queryClient.invalidateQueries({ queryKey: ['hr-employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-summary'] });
    },
    onError: () => {
      toast.error('Failed to change employee status');
    }
  });

  const resetForm = () => {
    setFormData({
      department: 'Cardiology',
      designation: '',
      employmentType: 'FULL_TIME',
      salary: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      reportingManagerId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bankAccountNumber: '',
      bankRoutingNumber: '',
      taxIdentifier: '',
      isActive: true
    });
    setSelectedUser(null);
    setUserSearch('');
    setActiveFormTab('ROLE');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please search and select a registered user account.');
      setActiveFormTab('ROLE');
      return;
    }
    if (!formData.designation.trim()) {
      toast.error('Please enter a designation or job title.');
      setActiveFormTab('ROLE');
      return;
    }

    addMutation.mutate({
      userId: selectedUser.id,
      department: formData.department,
      designation: formData.designation,
      employmentType: formData.employmentType,
      dateOfJoining: formData.dateOfJoining,
      salary: parseFloat(formData.salary || '0'),
      reportingManagerId: formData.reportingManagerId ? parseInt(formData.reportingManagerId) : null,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      bankAccountNumber: formData.bankAccountNumber,
      bankRoutingNumber: formData.bankRoutingNumber,
      taxIdentifier: formData.taxIdentifier,
      isActive: formData.isActive
    });
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditFormData({
      department: emp.department || 'Cardiology',
      designation: emp.designation || '',
      employmentType: emp.employmentType || 'FULL_TIME',
      salary: emp.salary ? String(emp.salary) : '',
      dateOfJoining: emp.dateOfJoining || '',
      reportingManagerId: emp.reportingManagerId ? String(emp.reportingManagerId) : '',
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      bankAccountNumber: emp.bankAccountNumber || '',
      bankRoutingNumber: emp.bankRoutingNumber || '',
      taxIdentifier: emp.taxIdentifier || '',
      isActive: emp.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    updateMutation.mutate({
      id: editingEmployee.id,
      payload: {
        department: editFormData.department,
        designation: editFormData.designation,
        employmentType: editFormData.employmentType,
        dateOfJoining: editFormData.dateOfJoining,
        salary: parseFloat(editFormData.salary || '0'),
        reportingManagerId: editFormData.reportingManagerId ? parseInt(editFormData.reportingManagerId) : null,
        emergencyContactName: editFormData.emergencyContactName,
        emergencyContactPhone: editFormData.emergencyContactPhone,
        bankAccountNumber: editFormData.bankAccountNumber,
        bankRoutingNumber: editFormData.bankRoutingNumber,
        taxIdentifier: editFormData.taxIdentifier,
        isActive: editFormData.isActive
      }
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (employees.length === 0) {
      toast.error('No employee records to export');
      return;
    }
    const headers = ['ID,First Name,Last Name,Email,Department,Designation,Type,Date Joined,Salary (INR),Status,Emergency Contact,Phone'];
    const rows = employees.map(emp => {
      const fn = emp.user?.firstName || '';
      const ln = emp.user?.lastName || '';
      const em = emp.user?.email || emp.email || '';
      const dept = emp.department || '';
      const desig = emp.designation || '';
      const type = emp.employmentType || 'FULL_TIME';
      const joined = emp.dateOfJoining || '';
      const sal = emp.salary || '0';
      const st = emp.isActive !== false ? 'ACTIVE' : 'INACTIVE';
      const ec = emp.emergencyContactName || '';
      const ep = emp.emergencyContactPhone || '';
      return `${emp.id},"${fn}","${ln}","${em}","${dept}","${desig}","${type}","${joined}",${sal},"${st}","${ec}","${ep}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clinic_staff_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Staff directory CSV exported successfully!');
  };

  // Department counts & discovery
  const departmentCounts = useMemo(() => {
    const counts = {};
    employees.forEach(e => {
      const d = e.department || 'General';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [employees]);

  const activeDepartments = useMemo(() => {
    const set = new Set(['ALL']);
    // Active departments first
    Object.keys(departmentCounts).forEach(d => set.add(d));
    // Standard hospital units
    DEPARTMENTS.forEach(d => {
      if (d !== 'ALL') set.add(d);
    });
    return Array.from(set);
  }, [departmentCounts]);

  // KPIs
  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.isActive !== false).length;
    const depts = new Set(employees.map(e => e.department).filter(Boolean)).size;
    const fullTime = employees.filter(e => (e.employmentType || '').toUpperCase() === 'FULL_TIME').length;
    return { total, active, depts, fullTime };
  }, [employees]);

  // Date Formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Filtering & Sorting
  const filteredEmployees = useMemo(() => {
    let list = employees.filter(emp => {
      const name = (emp.user ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}` : emp.name || '').toLowerCase();
      const email = (emp.user?.email || emp.email || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch = !search || name.includes(q) || email.includes(q) || dept.includes(q) || desig.includes(q);
      const matchesDept = selectedDept === 'ALL' || (emp.department || '').toLowerCase() === selectedDept.toLowerCase();
      const matchesStatus = selectedStatus === 'ALL' 
        ? true 
        : selectedStatus === 'ACTIVE' 
          ? emp.isActive !== false 
          : emp.isActive === false;
      const matchesType = selectedType === 'ALL' || (emp.employmentType || 'FULL_TIME').toUpperCase() === selectedType.toUpperCase();

      return matchesSearch && matchesDept && matchesStatus && matchesType;
    });

    // Sorting
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        const nameA = (a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}` : a.name || '').toLowerCase();
        const nameB = (b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''}` : b.name || '').toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'department') {
        cmp = (a.department || '').localeCompare(b.department || '');
      } else if (sortField === 'salary') {
        const salA = parseFloat(a.salary || 0);
        const salB = parseFloat(b.salary || 0);
        cmp = salA - salB;
      } else if (sortField === 'date') {
        const dateA = a.dateOfJoining || '';
        const dateB = b.dateOfJoining || '';
        cmp = dateA.localeCompare(dateB);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [employees, search, selectedDept, selectedStatus, selectedType, sortField, sortOrder]);

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
            <Users className="w-7 h-7 text-[#2864FF]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Staff Directory & Clinical Workforce
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Maintain institutional employee profiles, link verified accounts, manage credentials, and audit department assignments.
            </p>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            title="Print Employee Directory"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus size={15} /> + Onboard Clinical Staff
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Headcount</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.total} Personnel</p>
            <span className="text-[11px] font-bold text-blue-600">Active clinic staff</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Status</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{kpis.active}</p>
            <span className="text-[11px] font-bold text-emerald-600">
              {kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 100}% Operational
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Units</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{kpis.depts} Departments</p>
            <span className="text-[11px] font-bold text-indigo-600">Across hospital campus</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full-Time Staff</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{kpis.fullTime}</p>
            <span className="text-[11px] font-bold text-purple-600">Core hospital team</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Briefcase size={22} />
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
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff by name, email, department, or clinical designation..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Status & Sorting Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Segmented Control */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
              {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedStatus === status
                      ? 'bg-white text-[#2864FF] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {status}
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
                <option value="department">Department</option>
                <option value="salary">Salary</option>
                <option value="date">Date</option>
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

        {/* Employment Type Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Type:</span>
          {EMPLOYMENT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                selectedType === type.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {type.label}
            </button>
          ))}
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

      {/* ── Employee Directory Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm flex flex-col items-center justify-center gap-3">
            <RotateCw size={24} className="animate-spin text-blue-600" />
            Loading clinical workforce records...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try adjusting your search criteria, clearing the department filter, or onboarding a new employee.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedDept('ALL'); setSelectedStatus('ALL'); setSelectedType('ALL'); }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Personnel & Contact</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Role / Designation</th>
                    <th className="py-4 px-6">Type & Joined</th>
                    <th className="py-4 px-6">Salary (₹)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredEmployees.map(emp => {
                    const fullName = emp.user 
                      ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() 
                      : emp.name || `Staff #${emp.id}`;
                    const email = emp.user?.email || emp.email || 'No email registered';
                    const initials = fullName
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'ST';
                    const userId = emp.user?.id || emp.userId;
                    const isActive = emp.isActive !== false;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
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

                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getDeptColor(emp.department)}`}>
                            <Bookmark size={12} className="shrink-0" />
                            {emp.department || 'General'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 text-xs block">{emp.designation || 'Staff'}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">Staff ID #{emp.id}</span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-extrabold text-slate-800 text-xs block">
                            {(emp.employmentType || 'FULL_TIME').replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                            <Calendar size={12} className="text-slate-400 shrink-0" />
                            {emp.dateOfJoining || '2023-01-01'}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-900">
                          {emp.salary ? `₹${parseFloat(emp.salary).toLocaleString('en-IN')}` : '₹—'}
                        </td>

                        <td className="py-4 px-6">
                          <button
                            onClick={() => statusMutation.mutate({ id: emp.id, active: !isActive })}
                            title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedEmpDetails(emp)}
                              title="Inspect Profile"
                              className="w-8 h-8 rounded-xl border border-slate-200/90 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              onClick={() => openEditModal(emp)}
                              title="Edit Employee Record"
                              className="w-8 h-8 rounded-xl border border-blue-200/90 text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            >
                              <Edit2 size={14} />
                            </button>
                            
                            <button
                              onClick={() => navigate(`/hr/documents?staffId=${userId}`)}
                              title="View Staff Documents"
                              className="px-2.5 h-8 rounded-xl border border-blue-200/90 bg-blue-50/60 hover:bg-blue-100/80 text-blue-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                            >
                              <FileText size={13} />
                              <span>Documents</span>
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
                Showing <span className="font-bold text-slate-900">{filteredEmployees.length}</span> of <span className="font-bold text-slate-900">{employees.length}</span> staff members
                {(search || selectedDept !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
                  <span className="ml-1 text-blue-600 font-bold">(Filtered)</span>
                )}
              </div>
              {(search || selectedDept !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
                <button
                  onClick={() => { setSearch(''); setSelectedDept('ALL'); setSelectedStatus('ALL'); setSelectedType('ALL'); }}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} /> Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Multi-Step Onboard Employee Modal ─────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-2xl w-full p-5 sm:p-7 max-h-[92vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Onboard Clinical Staff</h3>
                      <p className="text-xs text-slate-500 font-medium">Link a registered user account to clinic HR records.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 3 Step Navigation Pills */}
                <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-50 p-1.5 rounded-xl border border-slate-200/70 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('ROLE')}
                    className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                      activeFormTab === 'ROLE'
                        ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Role & Placement
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('CREDENTIALS')}
                    className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                      activeFormTab === 'CREDENTIALS'
                        ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Clinical License
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('STATUTORY')}
                    className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                      activeFormTab === 'STATUTORY'
                        ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. Emergency & Bank
                  </button>
                </div>

                <form onSubmit={handleCreate} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
                  {/* TAB 1: Role & Placement */}
                  {activeFormTab === 'ROLE' && (
                    <div className="space-y-4">
                      {/* Search & Link User */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Link User Account <span className="text-red-500">*</span>
                        </label>
                        {selectedUser ? (
                          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/70">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-xs font-black text-blue-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                                <p className="text-[11px] text-blue-700">{selectedUser.email} • ID #{selectedUser.id}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedUser(null)}
                              className="text-xs font-bold text-blue-600 hover:text-red-600 transition cursor-pointer"
                            >
                              Change Account
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={userSearch}
                              onChange={e => {
                                setUserSearch(e.target.value);
                                setUserDropdownOpen(true);
                              }}
                              onFocus={() => setUserDropdownOpen(true)}
                              placeholder="Search registered user accounts by name or email..."
                              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                            />
                            {userDropdownOpen && debouncedUserSearch.length >= 1 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {userSearchLoading ? (
                                  <div className="p-3 text-xs text-slate-500 text-center">Searching user accounts...</div>
                                ) : userResults.length === 0 ? (
                                  <div className="p-3 text-xs text-slate-500 text-center">No matching user accounts found.</div>
                                ) : (
                                  userResults.map(u => (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setUserDropdownOpen(false);
                                        setUserSearch('');
                                      }}
                                      className="w-full text-left p-2.5 hover:bg-slate-50 flex flex-col transition cursor-pointer"
                                    >
                                      <span className="text-xs font-bold text-slate-900">{u.firstName} {u.lastName}</span>
                                      <span className="text-[11px] text-slate-500">{u.email}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Department <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={formData.department}
                              onChange={e => setFormData({ ...formData, department: e.target.value })}
                              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                            >
                              {activeDepartments.filter(d => d !== 'ALL').map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Designation / Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Senior Nurse / MD Cardiologist"
                            value={formData.designation}
                            onChange={e => setFormData({ ...formData, designation: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Employment Type
                          </label>
                          <div className="relative">
                            <select
                              value={formData.employmentType}
                              onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                            >
                              <option value="FULL_TIME">Full Time</option>
                              <option value="PART_TIME">Part Time</option>
                              <option value="CONTRACT">Contract</option>
                              <option value="CONSULTANT">Visiting Consultant</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Base Salary (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">₹</span>
                            <input
                              type="number"
                              placeholder="e.g. 85000"
                              value={formData.salary}
                              onChange={e => setFormData({ ...formData, salary: e.target.value })}
                              className="w-full h-11 pl-7 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Date of Joining
                          </label>
                          <input
                            type="date"
                            value={formData.dateOfJoining}
                            onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveFormTab('CREDENTIALS')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          Next: Clinical Licensure <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Clinical License & Credentials */}
                  {activeFormTab === 'CREDENTIALS' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Medical Council / Nursing Licensure Registration No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MCI-2024-88492 or INC-RN-9921"
                          value={formData.taxIdentifier}
                          onChange={e => setFormData({ ...formData, taxIdentifier: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition font-mono"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Verified against institutional medical governance records.
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2 text-blue-900">
                        <div className="flex items-center gap-2 font-bold">
                          <BadgeCheck size={16} className="text-blue-600" />
                          <span>Hospital Governance Notice</span>
                        </div>
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                          Clinical employees must have their certified diploma, BLS/ACLS certification, and photo ID uploaded into the <strong>Staff Documents</strong> repository upon induction.
                        </p>
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveFormTab('ROLE')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFormTab('STATUTORY')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          Next: Emergency & Banking <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Emergency & Bank Details */}
                  {activeFormTab === 'STATUTORY' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe (Spouse / Guardian)"
                            value={formData.emergencyContactName}
                            onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Emergency Contact Phone
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +91 98765 43210"
                            value={formData.emergencyContactPhone}
                            onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Bank Account Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 5010049281923"
                            value={formData.bankAccountNumber}
                            onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            IFSC / Routing Code
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC0001234"
                            value={formData.bankRoutingNumber}
                            onChange={e => setFormData({ ...formData, bankRoutingNumber: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveFormTab('CREDENTIALS')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Modal Action Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsModalOpen(false); resetForm(); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addMutation.isPending || !selectedUser}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus size={14} />
                      {addMutation.isPending ? 'Onboarding...' : 'Confirm & Complete Onboarding'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Edit Employee Modal ───────────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditModalOpen && editingEmployee && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-xl w-full p-5 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#2864FF] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {editingEmployee.user?.firstName?.[0] || 'S'}{editingEmployee.user?.lastName?.[0] || 'T'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Edit Employee Record
                      </h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <span>{editingEmployee.user ? `${editingEmployee.user.firstName} ${editingEmployee.user.lastName}` : `Staff #${editingEmployee.id}`}</span>
                        <span>•</span>
                        <span className="font-semibold text-blue-600">Staff ID #{editingEmployee.id}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
                  {/* Section 1: Department & Role */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Department & Clinical Role
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={editFormData.department}
                            onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                          >
                            {activeDepartments.filter(d => d !== 'ALL').map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Designation / Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData.designation}
                          onChange={e => setEditFormData({ ...editFormData, designation: e.target.value })}
                          placeholder="e.g. Registered Nurse (RN)"
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Employment & Compensation */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Employment & Compensation
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Employment Type
                        </label>
                        <div className="relative">
                          <select
                            value={editFormData.employmentType}
                            onChange={e => setEditFormData({ ...editFormData, employmentType: e.target.value })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                          >
                            <option value="FULL_TIME">Full Time</option>
                            <option value="PART_TIME">Part Time</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="CONSULTANT">Visiting Consultant</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Base Salary (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">₹</span>
                          <input
                            type="number"
                            value={editFormData.salary}
                            onChange={e => setEditFormData({ ...editFormData, salary: e.target.value })}
                            placeholder="e.g. 65000"
                            className="w-full h-11 pl-7 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Date of Joining
                        </label>
                        <input
                          type="date"
                          value={editFormData.dateOfJoining}
                          onChange={e => setEditFormData({ ...editFormData, dateOfJoining: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Personnel Status
                        </label>
                        <div className="relative">
                          <select
                            value={editFormData.isActive ? 'true' : 'false'}
                            onChange={e => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none"
                          >
                            <option value="true">Active Personnel</option>
                            <option value="false">Inactive / Separated</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Emergency & Licensure */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Emergency & Credential Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          value={editFormData.emergencyContactName}
                          onChange={e => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                          placeholder="e.g. Spouse / Guardian"
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Emergency Phone
                        </label>
                        <input
                          type="text"
                          value={editFormData.emergencyContactPhone}
                          onChange={e => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                          placeholder="+91..."
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Licensure / Registration ID
                      </label>
                      <input
                        type="text"
                        value={editFormData.taxIdentifier}
                        onChange={e => setEditFormData({ ...editFormData, taxIdentifier: e.target.value })}
                        placeholder="e.g. MCI-2024-88492 or INC-RN-9921"
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Modal Action Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}
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
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Employee Detail View Modal ────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedEmpDetails && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-lg w-full p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#2864FF] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {selectedEmpDetails.user?.firstName?.[0] || 'S'}{selectedEmpDetails.user?.lastName?.[0] || 'T'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {selectedEmpDetails.user ? `${selectedEmpDetails.user.firstName} ${selectedEmpDetails.user.lastName}` : selectedEmpDetails.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {selectedEmpDetails.designation || 'Staff'} • {selectedEmpDetails.department || 'General'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmpDetails(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Details List */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Staff Record ID:</span>
                    <span className="font-bold text-slate-900">#{selectedEmpDetails.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Linked User Account ID:</span>
                    <span className="font-bold text-slate-900">#{selectedEmpDetails.userId || selectedEmpDetails.user?.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Official Email:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{selectedEmpDetails.user?.email || selectedEmpDetails.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Phone Number:</span>
                    <span className="font-bold text-slate-900">{selectedEmpDetails.user?.phoneNumber || selectedEmpDetails.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Employment Type:</span>
                    <span className="font-bold text-slate-900">{(selectedEmpDetails.employmentType || 'FULL_TIME').replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Joined Clinic On:</span>
                    <span className="font-bold text-slate-900">{formatDate(selectedEmpDetails.dateOfJoining)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                    <span className="font-bold text-slate-600">Base Compensation:</span>
                    <span className="font-extrabold text-emerald-600">
                      {selectedEmpDetails.salary ? `₹${parseFloat(selectedEmpDetails.salary).toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                  {selectedEmpDetails.emergencyContactName && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                      <span className="font-bold text-slate-600">Emergency Contact:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEmpDetails.emergencyContactName} ({selectedEmpDetails.emergencyContactPhone || '—'})
                      </span>
                    </div>
                  )}
                  {selectedEmpDetails.taxIdentifier && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90">
                      <span className="font-bold text-slate-600">Licensure / Tax ID:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmpDetails.taxIdentifier}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedEmpDetails;
                        setSelectedEmpDetails(null);
                        openEditModal(target);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const uId = selectedEmpDetails.userId || selectedEmpDetails.user?.id;
                        setSelectedEmpDetails(null);
                        navigate(`/hr/documents?staffId=${uId}`);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={13} /> Documents
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEmpDetails(null)}
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
