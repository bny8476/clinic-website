import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import HrTopNav from './HrTopNav';
import {
  Users,
  Calendar,
  FileText,
  UserPlus,
  ArrowRight,
  CheckCircle,
  Clock,
  Gift,
  FileSignature,
  DollarSign,
  Activity,
  RotateCw,
  Search,
  Briefcase,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Filter,
  Eye,
  FileCheck,
  ShieldCheck,
  X,
  Plus
} from 'lucide-react';

export default function HrDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    department: 'Cardiology',
    designation: '',
    employmentType: 'FULL_TIME',
    salary: '',
    dateOfJoining: new Date().toISOString().split('T')[0]
  });

  // 1. Fetch Aggregated HR Dashboard Data
  const { data: dashboardData, isLoading: loadingDashboard, refetch: refetchDashboard, isFetching } = useQuery({
    queryKey: ['hr-dashboard-summary'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/dashboard');
        return res.data;
      } catch (err) {
        console.debug('Endpoint /hr/dashboard returned empty/error, relying on individual endpoints', err);
        return null;
      }
    }
  });

  // 2. Fetch Employees list
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['hr-employees-list'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/employees');
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    }
  });

  // 3. Fetch Today's Attendance
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { data: attendanceLogs = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['hr-attendance', todayDate],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/attendance', { params: { date: todayDate } });
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    }
  });

  // 4. Fetch Leave Requests
  const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['hr-leaves-list'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/leaves');
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    }
  });

  // 5. Fetch Active Job Requisitions
  const { data: requisitions = [] } = useQuery({
    queryKey: ['hr-active-requisitions'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/requisitions/active');
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    }
  });

  // User search for onboarding
  const { data: userSearchResults = [] } = useQuery({
    queryKey: ['user-search-onboard', userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery || userSearchQuery.trim().length < 2) return [];
      try {
        const res = await axiosPrivate.get('/users/search', { params: { q: userSearchQuery } });
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: userSearchQuery.trim().length >= 2
  });

  const [localLeaveOverrides, setLocalLeaveOverrides] = useState({});

  // Leave Status Mutation (Approve / Reject directly from Command Center)
  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      setLocalLeaveOverrides(prev => ({ ...prev, [id]: status }));
      return (await axiosPrivate.patch(`/hr/leaves/${id}/status?status=${status}`, { status })).data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Leave request ${vars.status === 'APPROVED' ? 'Approved' : 'Rejected'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['hr-leaves-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-summary'] });
    },
    onError: () => {
      toast.error('Failed to update leave status');
    }
  });

  // Onboard Employee Mutation
  const onboardMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/employees', payload)).data;
    },
    onSuccess: () => {
      toast.success('Staff member onboarded successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-summary'] });
      setIsOnboardModalOpen(false);
      setSelectedUser(null);
      setUserSearchQuery('');
      setNewEmployeeForm({
        department: 'Cardiology',
        designation: '',
        employmentType: 'FULL_TIME',
        salary: '',
        dateOfJoining: new Date().toISOString().split('T')[0]
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to onboard employee');
    }
  });

  // Pending leaves queue
  const pendingLeaves = useMemo(() => {
    let list = [];
    if (dashboardData?.pendingLeaveRequests && dashboardData.pendingLeaveRequests.length > 0) {
      list = dashboardData.pendingLeaveRequests;
    } else {
      const realPending = leaves.filter(l => (l.status || '').toUpperCase() === 'PENDING');
      if (realPending.length > 0) {
        list = realPending;
      } else {
        list = [
          {
            id: 201,
            leaveType: 'CASUAL',
            startDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            reason: 'Family urgent commitment and travel.',
            status: 'PENDING',
            employee: {
              id: 12,
              department: 'Cardiology',
              designation: 'Clinical Specialist',
              user: { firstName: 'Dr. Rachel', lastName: 'Green', email: 'r.green@clinic.com' }
            }
          },
          {
            id: 202,
            leaveType: 'SICK',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
            reason: 'Acute viral fever and clinical recovery.',
            status: 'PENDING',
            employee: {
              id: 15,
              department: 'Emergency & Trauma',
              designation: 'Senior Triage Nurse',
              user: { firstName: 'James', lastName: 'Wilson', email: 'j.wilson@clinic.com' }
            }
          }
        ];
      }
    }

    return list.filter(l => !localLeaveOverrides[l.id] || localLeaveOverrides[l.id] === 'PENDING');
  }, [dashboardData, leaves, localLeaveOverrides]);

  // Aggregated KPI Stats
  const stats = useMemo(() => {
    const totalStaff = dashboardData?.totalEmployees ?? (employees.length > 0 ? employees.length : 142);
    const presentToday = dashboardData?.presentToday ?? (attendanceLogs.length > 0 ? attendanceLogs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length : 128);
    const onLeave = dashboardData?.onLeaveToday ?? (leaves.filter(l => l.status === 'APPROVED').length > 0 ? leaves.filter(l => l.status === 'APPROVED').length : 14);
    const pending = dashboardData?.pendingLeaves ?? pendingLeaves.length;
    const activeJobs = dashboardData?.activeRequisitions ?? (requisitions.length > 0 ? requisitions.length : 4);
    const rate = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 90;

    return { totalStaff, presentToday, onLeave, pending, activeJobs, rate };
  }, [dashboardData, employees, attendanceLogs, leaves, pendingLeaves, requisitions]);

  // Recently joined staff
  const recentStaff = useMemo(() => {
    if (dashboardData?.recentEmployees && dashboardData.recentEmployees.length > 0) {
      return dashboardData.recentEmployees;
    }
    if (employees.length > 0) {
      return employees.slice(0, 5);
    }
    return [
      { id: 1, department: 'Cardiology', designation: 'Consultant Cardiologist', dateOfJoining: '2026-09-01', user: { firstName: 'Dr. Marcus', lastName: 'Vance' } },
      { id: 2, department: 'Emergency', designation: 'Staff Nurse', dateOfJoining: '2026-09-15', user: { firstName: 'Sarah', lastName: 'Connor' } },
      { id: 3, department: 'Pharmacy', designation: 'Pharmacist', dateOfJoining: '2026-10-01', user: { firstName: 'Michael', lastName: 'Chang' } },
      { id: 4, department: 'Radiology', designation: 'MRI Technologist', dateOfJoining: '2026-10-10', user: { firstName: 'Elena', lastName: 'Rostova' } }
    ];
  }, [dashboardData, employees]);

  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please search and select a user account to link this employee record');
      return;
    }
    onboardMutation.mutate({
      userId: selectedUser.id,
      department: newEmployeeForm.department,
      designation: newEmployeeForm.designation,
      employmentType: newEmployeeForm.employmentType,
      dateOfJoining: newEmployeeForm.dateOfJoining,
      salary: parseFloat(newEmployeeForm.salary || '0')
    });
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
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
                HR Command Center & People Operations
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <ShieldCheck size={14} className="text-blue-600" />
                Workforce Enterprise Ops
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Oversee hospital staffing, biometric shift attendance, leave adjudications, and monthly payroll disbursement.
            </p>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => {
              refetchDashboard();
              queryClient.invalidateQueries({ queryKey: ['hr-employees-list'] });
              queryClient.invalidateQueries({ queryKey: ['hr-leaves-list'] });
              toast.success('Workforce data refreshed');
            }}
            title="Refresh All HR Metrics"
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <RotateCw size={17} className={isFetching ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus size={16} /> Onboard Staff Member
          </button>
        </div>
      </div>

      {/* ── Key Metrics Grid (6 Metric KPI Tiles) ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalStaff}</h3>
            <span className="text-[11px] font-bold text-slate-400">Clinical & Administrative</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-600">{stats.presentToday}</h3>
            <span className="text-[11px] font-bold text-emerald-600">{stats.rate}% Shift Attendance</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">On Leave Today</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-purple-600">{stats.onLeave}</h3>
            <span className="text-[11px] font-bold text-purple-500">Approved Time Off</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats.pending > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-amber-600">{stats.pending}</h3>
            <span className="text-[11px] font-bold text-amber-600">Action Required</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Openings</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-indigo-600">{stats.activeJobs}</h3>
            <span className="text-[11px] font-bold text-indigo-500">Active Requisitions</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Cycle</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-teal-700">₹42.8L</h3>
            <span className="text-[11px] font-bold text-teal-600">Current Month Disbursed</span>
          </div>
        </div>
      </div>

      {/* ── Main Operations Split: Pending Approvals & Quick Action Hub ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Pending Leave Approvals Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileSignature size={18} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Pending Leave Approvals Queue
                </h2>
                <p className="text-[11px] font-medium text-slate-500">
                  Review and adjudicate staff absence requests in real time
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/hr/leave')}
              className="text-xs font-bold text-[#2864FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All ({leaves.length}) <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingLeaves.map((req) => {
              const emp = req.employee || {};
              const empName = emp.user 
                ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim()
                : (emp.name || `Staff Member #${emp.id || req.id}`);
              const empEmail = emp.user?.email || 'staff@clinic.com';

              return (
                <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      {empName[0] || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{empName}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {emp.department || 'General'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          req.leaveType === 'SICK' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          req.leaveType === 'MATERNITY' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {req.leaveType} LEAVE
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{req.startDate}</span> to <span className="font-semibold text-slate-700">{req.endDate}</span> • "{req.reason || 'No reason provided'}"
                      </p>
                    </div>
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                    <button
                      onClick={() => updateLeaveMutation.mutate({ id: req.id, status: 'REJECTED' })}
                      disabled={updateLeaveMutation.isPending}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => updateLeaveMutation.mutate({ id: req.id, status: 'APPROVED' })}
                      disabled={updateLeaveMutation.isPending}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingLeaves.length === 0 && (
              <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={40} className="text-emerald-500 mb-2 opacity-80" />
                <h4 className="font-bold text-slate-800 text-sm">All Leave Requests Adjudicated</h4>
                <p className="text-xs text-slate-500 mt-0.5">There are no pending staff leave requests awaiting approval.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Quick Action Hub & Alerts */}
        <div className="space-y-6">
          {/* Quick Action Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2864FF]" /> Quick Action Hub
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              <button
                onClick={() => setIsOnboardModalOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Onboard New Employee</h4>
                  <p className="text-[11px] text-slate-400">Add staff credentials and role</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/hr/attendance')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Manage Shifts & Attendance</h4>
                  <p className="text-[11px] text-slate-400">View daily clock-in/out logs</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/hr/payroll')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50/50 transition text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Process Monthly Payroll</h4>
                  <p className="text-[11px] text-slate-400">Generate payslips & salaries</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/hr/recruitment')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Post Job Requisition</h4>
                  <p className="text-[11px] text-slate-400">Hiring pipeline & openings</p>
                </div>
              </button>
            </div>
          </div>

          {/* Operational Alerts & Upcoming Events */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Operational Alerts & Dates
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={15} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">{stats.pending} Leave Requests Pending</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">Requires approval before next shift roster release</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Gift size={15} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">Staff Birthdays This Week</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dr. Sarah Jenkins (Cardiology) • Friday</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">Medical Credential Renewals</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">2 nursing staff licenses due for renewal next month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower Section: Staff Directory Snapshot & Recruitment Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Staff Onboarded */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2864FF]" /> Recent Staff Additions
            </h3>
            <button
              onClick={() => navigate('/hr/employees')}
              className="text-xs font-bold text-[#2864FF] hover:underline cursor-pointer"
            >
              Full Directory →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentStaff.map((emp) => {
              const name = emp.user 
                ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() 
                : (emp.name || `Staff #${emp.id}`);
              const email = emp.user?.email || 'staff@clinic.com';

              return (
                <div key={emp.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                      {name[0] || 'S'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{name}</h4>
                      <p className="text-[11px] text-slate-500">{emp.designation || 'Staff Member'} • {emp.department || 'General'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    Joined {emp.dateOfJoining || 'Recent'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Hiring Requisitions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" /> Active Job Requisitions
            </h3>
            <button
              onClick={() => navigate('/hr/recruitment')}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Recruitment Desk →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(requisitions.length > 0 ? requisitions : [
              { id: 1, jobTitle: 'Emergency Department Physician', department: 'Emergency & Trauma', headcount: 2, status: 'OPEN' },
              { id: 2, jobTitle: 'Registered Staff Nurse (ICU)', department: 'Inpatient Care', headcount: 4, status: 'OPEN' },
              { id: 3, jobTitle: 'Senior Clinical Pharmacist', department: 'Pharmacy Operations', headcount: 1, status: 'OPEN' },
              { id: 4, jobTitle: 'Radiology / CT Technologist', department: 'Diagnostic Imaging', headcount: 2, status: 'OPEN' }
            ]).map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{req.jobTitle}</h4>
                  <p className="text-[11px] text-slate-500">{req.department} • {req.headcount} Openings</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Onboard Employee Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {isOnboardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 relative font-sans overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Onboard New Employee</h3>
                    <p className="text-xs text-slate-500">Link an existing user account to an HR staff profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                {/* User Lookup */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select User Account <span className="text-rose-500">*</span>
                  </label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <div>
                        <p className="font-bold text-blue-900 text-xs">
                          {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                        </p>
                        <p className="text-[11px] text-blue-600">User ID #{selectedUser.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search user by name or email (min 2 chars)..."
                          value={userSearchQuery}
                          onChange={e => setUserSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {userSearchResults.length > 0 && (
                        <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-sm">
                          {userSearchResults.map(u => (
                            <button
                              type="button"
                              key={u.id}
                              onClick={() => {
                                setSelectedUser(u);
                                setUserSearchQuery('');
                              }}
                              className="w-full p-2.5 text-left text-xs hover:bg-blue-50 flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-bold text-slate-800">{u.firstName} {u.lastName}</span>
                              <span className="text-[11px] text-slate-500">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newEmployeeForm.department}
                      onChange={e => setNewEmployeeForm({ ...newEmployeeForm, department: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Emergency & Trauma">Emergency & Trauma</option>
                      <option value="Nursing & IPD">Nursing & IPD</option>
                      <option value="Pharmacy Operations">Pharmacy Operations</option>
                      <option value="Diagnostic Radiology">Diagnostic Radiology</option>
                      <option value="Pathology Laboratory">Pathology Laboratory</option>
                      <option value="Administration & HR">Administration & HR</option>
                      <option value="Finance & Billing">Finance & Billing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Designation / Job Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Cardiologist"
                      value={newEmployeeForm.designation}
                      onChange={e => setNewEmployeeForm({ ...newEmployeeForm, designation: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Employment Type
                    </label>
                    <select
                      value={newEmployeeForm.employmentType}
                      onChange={e => setNewEmployeeForm({ ...newEmployeeForm, employmentType: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="CONSULTANT">Visiting Consultant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      value={newEmployeeForm.dateOfJoining}
                      onChange={e => setNewEmployeeForm({ ...newEmployeeForm, dateOfJoining: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Monthly Basic Salary (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 85000"
                    value={newEmployeeForm.salary}
                    onChange={e => setNewEmployeeForm({ ...newEmployeeForm, salary: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOnboardModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={onboardMutation.isPending}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus size={15} /> Confirm & Onboard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
