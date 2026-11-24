import React, { useState, useMemo } from 'react';
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
  Briefcase
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
  'Inpatient Care',
  'Nursing Operations',
  'Pharmacy',
  'Diagnostic Imaging',
  'Administration',
  'Human Resources'
];

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEmpDetails, setSelectedEmpDetails] = useState(null);

  // Add Employee Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    designation: '',
    department: 'Cardiology',
    employmentType: 'FULL_TIME',
    salary: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const debouncedUserSearch = useDebouncedValue(userSearch, 300);

  // Fetch users for linking
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

  // Fetch employee directory
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

  // Onboard Mutation
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

  const resetForm = () => {
    setFormData({
      designation: '',
      department: 'Cardiology',
      employmentType: 'FULL_TIME',
      salary: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      isActive: true
    });
    setSelectedUser(null);
    setUserSearch('');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please search and select a registered user account.');
      return;
    }
    if (!formData.designation.trim()) {
      toast.error('Please enter a designation or job title.');
      return;
    }

    addMutation.mutate({
      userId: selectedUser.id,
      department: formData.department,
      designation: formData.designation,
      employmentType: formData.employmentType,
      dateOfJoining: formData.dateOfJoining,
      salary: parseFloat(formData.salary || '0'),
      isActive: formData.isActive
    });
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.isActive !== false).length;
    const depts = new Set(employees.map(e => e.department).filter(Boolean)).size;
    const fullTime = employees.filter(e => (e.employmentType || '').toUpperCase() === 'FULL_TIME').length;
    return { total, active, depts, fullTime };
  }, [employees]);

  // Filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
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

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, selectedDept, selectedStatus]);

  const getDeptColor = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('cardio')) return 'bg-red-50 text-red-700 border-red-200';
    if (d.includes('emerg')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (d.includes('nurs')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('pharm')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (d.includes('pediat')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (d.includes('diag') || d.includes('radio')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
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
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Staff Directory & Clinical Workforce
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <ShieldCheck size={14} className="text-blue-600" />
                Linked User Profiles
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Maintain institutional employee profiles, link verified accounts, manage credentials, and audit department assignments.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => {
              refetch();
              toast.success('Directory refreshed');
            }}
            title="Refresh Directory"
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <RotateCw size={17} className={isFetching ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus size={15} /> + Onboard Employee
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

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
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

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Status:</span>
            {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-[#2864FF] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-2 shrink-0">Department:</span>
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {dept}
            </button>
          ))}
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
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              No employee records matched your active search query or department filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedDept('ALL');
                setSelectedStatus('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider">
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

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
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
                          <Building size={12} />
                          {emp.department || 'General'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800 text-xs block">{emp.designation || 'Staff'}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Staff ID #{emp.id}</span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-700 text-xs block">
                          {(emp.employmentType || 'FULL_TIME').replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-slate-400" />
                          {emp.dateOfJoining || 'Recent'}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        {emp.salary ? `₹${parseFloat(emp.salary).toLocaleString('en-IN')}` : '₹—'}
                      </td>

                      <td className="py-4 px-6">
                        {emp.isActive !== false ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                            INACTIVE
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEmpDetails(emp)}
                            title="Inspect Profile"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          
                          <button
                            onClick={() => navigate(`/hr/documents?staffId=${userId}`)}
                            title="View Staff Documents"
                            className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <FileText size={13} />
                            Documents
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

      {/* ── Onboard Employee Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Onboard Clinical Staff</h3>
                    <p className="text-xs text-slate-500">Link a registered user account to clinic HR records.</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 pt-5">
                {/* Search & Link User */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Link User Account <span className="text-red-500">*</span>
                  </label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/70">
                      <div>
                        <p className="text-xs font-black text-blue-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                        <p className="text-[11px] text-blue-700">{selectedUser.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="text-xs font-bold text-blue-600 hover:text-red-600 transition"
                      >
                        Change
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
                        placeholder="Search existing users by name or email..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {DEPARTMENTS.filter(d => d !== 'ALL').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Designation / Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Nurse / MD Cardiologist"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PRN">Per Diem (PRN)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Base Salary (₹)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.salary}
                      onChange={e => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="e.g. 85000"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {addMutation.isPending ? 'Onboarding...' : 'Confirm Onboard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Employee Detail Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEmpDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                    {selectedEmpDetails.user?.firstName?.[0] || 'S'}{selectedEmpDetails.user?.lastName?.[0] || 'T'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedEmpDetails.user ? `${selectedEmpDetails.user.firstName} ${selectedEmpDetails.user.lastName}` : selectedEmpDetails.name}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedEmpDetails.designation} • {selectedEmpDetails.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmpDetails(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Staff Record ID:</span>
                  <span className="font-mono font-bold text-slate-800">#{selectedEmpDetails.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Linked User Account ID:</span>
                  <span className="font-mono font-bold text-slate-800">#{selectedEmpDetails.userId || selectedEmpDetails.user?.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Official Email:</span>
                  <span className="font-bold text-slate-800">{selectedEmpDetails.user?.email || selectedEmpDetails.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Phone Number:</span>
                  <span className="font-bold text-slate-800">{selectedEmpDetails.user?.phoneNumber || selectedEmpDetails.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Employment Type:</span>
                  <span className="font-bold text-slate-800">{(selectedEmpDetails.employmentType || 'FULL_TIME').replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Joined Clinic On:</span>
                  <span className="font-bold text-slate-800">{selectedEmpDetails.dateOfJoining || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500">Base Compensation:</span>
                  <span className="font-bold text-emerald-600">
                    {selectedEmpDetails.salary ? `₹${parseFloat(selectedEmpDetails.salary).toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const uId = selectedEmpDetails.userId || selectedEmpDetails.user?.id;
                    setSelectedEmpDetails(null);
                    navigate(`/hr/documents?staffId=${uId}`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText size={14} /> View Uploaded Documents
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmpDetails(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
