import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  DollarSign, 
  CreditCard, 
  Search, 
  Filter, 
  RotateCw, 
  Plus, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Building, 
  FileText, 
  Check, 
  X, 
  Printer, 
  TrendingUp, 
  UserCheck, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import HrTopNav from './HrTopNav';

export default function PayrollManagement() {
  const queryClient = useQueryClient();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [formData, setFormData] = useState({
    staffId: '',
    monthYear: new Date().toISOString().slice(0, 7),
    basicSalary: '',
    allowances: '5000',
    deductions: '2000'
  });

  // 1. Fetch Payroll Records
  const { data: rawPayrolls = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['payrolls'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/payroll');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // 2. Fetch Employees for the staff selector and salary autofill
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

  // Fallback demo payrolls if database is initially empty
  const fallbackPayrolls = useMemo(() => [
    {
      id: 301,
      monthYear: selectedMonth,
      basicSalary: 120000,
      allowances: 15000,
      deductions: 8000,
      netSalary: 127000,
      status: 'PAID',
      staff: {
        id: 1,
        firstName: 'Dr. Marcus',
        lastName: 'Vance',
        email: 'vance@clinic.com'
      }
    },
    {
      id: 302,
      monthYear: selectedMonth,
      basicSalary: 95000,
      allowances: 10000,
      deductions: 6000,
      netSalary: 99000,
      status: 'PENDING',
      staff: {
        id: 2,
        firstName: 'Dr. Sarah',
        lastName: 'Jenkins',
        email: 's.jenkins@clinic.com'
      }
    },
    {
      id: 303,
      monthYear: selectedMonth,
      basicSalary: 55000,
      allowances: 6000,
      deductions: 3500,
      netSalary: 57500,
      status: 'PENDING',
      staff: {
        id: 3,
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'e.rostova@clinic.com'
      }
    },
    {
      id: 304,
      monthYear: selectedMonth,
      basicSalary: 65000,
      allowances: 7500,
      deductions: 4200,
      netSalary: 68300,
      status: 'PAID',
      staff: {
        id: 4,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'r.kumar@clinic.com'
      }
    }
  ], [selectedMonth]);

  const displayPayrolls = rawPayrolls.length > 0 ? rawPayrolls : fallbackPayrolls;

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post('/hr/payroll/generate', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      setShowGenerateModal(false);
      setFormData({
        staffId: '',
        monthYear: selectedMonth,
        basicSalary: '',
        allowances: '5000',
        deductions: '2000'
      });
      toast.success('Staff payroll generated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    }
  });

  // Process Single Payment Mutation
  const processMutation = useMutation({
    mutationFn: async (payrollId) => {
      const res = await axiosPrivate.put(`/hr/payroll/${payrollId}/process`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      toast.success('Salary payment processed successfully');
    },
    onError: () => {
      toast.error('Failed to process payment');
    }
  });

  // Batch Process Mutation
  const batchProcessMutation = useMutation({
    mutationFn: async () => {
      return (await axiosPrivate.put('/hr/payroll/process-batch', null, {
        params: { monthYear: selectedMonth }
      })).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['payrolls']);
      toast.success(`Processed batch payments for ${data.processedCount || 'all pending'} staff!`);
    },
    onError: () => {
      toast.error('Failed to batch process payrolls');
    }
  });

  const handleStaffSelect = (staffIdStr) => {
    const sId = parseInt(staffIdStr);
    const matched = employees.find(e => (e.user?.id === sId) || (e.id === sId));
    setFormData(prev => ({
      ...prev,
      staffId: staffIdStr,
      basicSalary: matched?.salary ? String(matched.salary) : prev.basicSalary
    }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!formData.staffId) {
      toast.error('Please select a staff member');
      return;
    }
    generateMutation.mutate({
      staffId: parseInt(formData.staffId),
      monthYear: formData.monthYear,
      basicSalary: parseFloat(formData.basicSalary || '0'),
      allowances: parseFloat(formData.allowances || '0'),
      deductions: parseFloat(formData.deductions || '0')
    });
  };

  // Month navigation helper
  const changeMonth = (delta) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalDisbursed = displayPayrolls
      .filter(p => (p.status || '').toUpperCase() === 'PAID')
      .reduce((sum, p) => sum + (parseFloat(p.netSalary) || 0), 0);

    const pendingCount = displayPayrolls.filter(p => (p.status || '').toUpperCase() === 'PENDING').length;
    const pendingAmount = displayPayrolls
      .filter(p => (p.status || '').toUpperCase() === 'PENDING')
      .reduce((sum, p) => sum + (parseFloat(p.netSalary) || 0), 0);

    const paidCount = displayPayrolls.filter(p => (p.status || '').toUpperCase() === 'PAID').length;
    
    const avgSalary = displayPayrolls.length > 0
      ? displayPayrolls.reduce((sum, p) => sum + (parseFloat(p.basicSalary) || 0), 0) / displayPayrolls.length
      : 0;

    return { totalDisbursed, pendingCount, pendingAmount, paidCount, avgSalary };
  }, [displayPayrolls]);

  // Filtered Payrolls
  const filteredPayrolls = useMemo(() => {
    return displayPayrolls.filter(p => {
      const staffName = p.staff ? `${p.staff.firstName || ''} ${p.staff.lastName || ''}` : p.staffName || '';
      const email = p.staff?.email || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || staffName.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || (p.status || '').toUpperCase() === statusFilter;
      const matchesMonth = !selectedMonth || p.monthYear === selectedMonth;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [displayPayrolls, searchQuery, statusFilter, selectedMonth]);

  const liveNetSalary = useMemo(() => {
    const b = parseFloat(formData.basicSalary || '0');
    const a = parseFloat(formData.allowances || '0');
    const d = parseFloat(formData.deductions || '0');
    return Math.max(0, b + a - d);
  }, [formData]);

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
            <DollarSign className="w-7 h-7 text-[#2864FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Workforce Payroll & Compensation
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <CreditCard size={14} className="text-blue-600" />
                Direct Deposit & Tax Accounting
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Compute staff salaries, manage medical allowances, process tax deductions, and disburse clinical payroll batches.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => {
              refetch();
              toast.success('Payroll records refreshed');
            }}
            title="Refresh Payroll"
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <RotateCw size={17} className={isFetching ? 'animate-spin text-blue-600' : ''} />
          </button>

          {kpis.pendingCount > 0 && (
            <button
              onClick={() => batchProcessMutation.mutate()}
              disabled={batchProcessMutation.isPending}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCircle size={15} /> Process All ({kpis.pendingCount})
            </button>
          )}

          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-700 flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus size={15} /> + Generate Payroll
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{kpis.totalDisbursed.toLocaleString('en-IN')}</p>
            <span className="text-[11px] font-bold text-emerald-600">{kpis.paidCount} Staff Disbursed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approval</p>
            <p className="text-2xl font-black text-amber-600 mt-1">₹{kpis.pendingAmount.toLocaleString('en-IN')}</p>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              {kpis.pendingCount} Salaries Awaiting Run
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff Processed</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{displayPayrolls.length} Records</p>
            <span className="text-[11px] font-bold text-blue-600">For cycle {selectedMonth}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Base Pay</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">₹{Math.round(kpis.avgSalary).toLocaleString('en-IN')}</p>
            <span className="text-[11px] font-bold text-indigo-600">Institution average</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp size={22} />
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
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search payroll by staff name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 border-0 focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {['ALL', 'PENDING', 'PAID'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[#2864FF] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payroll Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm flex flex-col items-center justify-center gap-3">
            <RotateCw size={24} className="animate-spin text-blue-600" />
            Loading payroll records...
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
              <DollarSign size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No payroll records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              There are no payroll records for cycle <span className="font-bold">{selectedMonth}</span> matching your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
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
                  <th className="py-4 px-6">Personnel</th>
                  <th className="py-4 px-6">Pay Cycle</th>
                  <th className="py-4 px-6">Basic Pay (₹)</th>
                  <th className="py-4 px-6">Allowances (+)</th>
                  <th className="py-4 px-6">Deductions (-)</th>
                  <th className="py-4 px-6">Net Salary (₹)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPayrolls.map(p => {
                  const staffName = p.staff ? `${p.staff.firstName || ''} ${p.staff.lastName || ''}`.trim() : p.staffName || `Staff #${p.staff?.id || '—'}`;
                  const email = p.staff?.email || '';
                  const initials = staffName
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'ST';
                  const isPaid = (p.status || '').toUpperCase() === 'PAID';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{staffName}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">{email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                          {p.monthYear}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-800">
                        ₹{parseFloat(p.basicSalary || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-600">
                        +₹{parseFloat(p.allowances || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6 font-bold text-rose-600">
                        -₹{parseFloat(p.deductions || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6 font-black text-slate-900 text-sm">
                        ₹{parseFloat(p.netSalary || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} className="text-emerald-600" />
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            PENDING
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => processMutation.mutate(p.id)}
                              disabled={processMutation.isPending}
                              className="px-3 py-1.5 rounded-lg font-bold text-xs bg-[#2864FF] hover:bg-blue-700 text-white flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Check size={14} /> Disburse
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPayslip(p)}
                            title="Inspect Payslip"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> Payslip
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

      {/* ── Generate Payroll Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Generate Staff Payroll</h3>
                    <p className="text-xs text-slate-500">Calculate base earnings, additions, and statutory deductions.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Staff Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.staffId}
                    onChange={e => handleStaffSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose employee from directory --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.user?.id || emp.id}>
                        {emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : emp.name || `Staff #${emp.id}`} ({emp.department} - {emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Payroll Cycle
                    </label>
                    <input
                      type="month"
                      required
                      value={formData.monthYear}
                      onChange={e => setFormData({ ...formData, monthYear: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Basic Salary (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="100"
                      value={formData.basicSalary}
                      onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                      placeholder="e.g. 75000"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Allowances (+) ₹
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={formData.allowances}
                      onChange={e => setFormData({ ...formData, allowances: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Deductions (-) ₹
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={formData.deductions}
                      onChange={e => setFormData({ ...formData, deductions: e.target.value })}
                      placeholder="e.g. 2000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Net Pay Preview Card */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">Computed Net Salary:</span>
                  <span className="text-base font-black text-[#2864FF]">
                    ₹{liveNetSalary.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {generateMutation.isPending ? 'Generating...' : 'Confirm & Generate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Payslip Breakdown Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Salary Payslip Statement</h3>
                  <p className="text-xs text-slate-500">Cycle: {selectedPayslip.monthYear} • Hospital Employee Compensation</p>
                </div>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Employee Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Staff Name</span>
                  <span className="text-sm font-black text-slate-900">
                    {selectedPayslip.staff ? `${selectedPayslip.staff.firstName} ${selectedPayslip.staff.lastName}` : selectedPayslip.staffName}
                  </span>
                  <span className="text-slate-500 block text-[11px]">{selectedPayslip.staff?.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black mt-1 ${
                    selectedPayslip.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedPayslip.status}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                  <span className="font-black text-emerald-900 uppercase tracking-wider text-[11px] block border-b border-emerald-200 pb-1.5">
                    Earnings (Credits)
                  </span>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-600">Basic Pay</span>
                    <span className="font-bold text-slate-900">₹{parseFloat(selectedPayslip.basicSalary || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-600">Medical & DA Allowance</span>
                    <span className="font-bold text-emerald-700">+₹{parseFloat(selectedPayslip.allowances || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-emerald-950">
                    <span>Total Earnings</span>
                    <span>₹{(parseFloat(selectedPayslip.basicSalary || 0) + parseFloat(selectedPayslip.allowances || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                  <span className="font-black text-rose-900 uppercase tracking-wider text-[11px] block border-b border-rose-200 pb-1.5">
                    Deductions (Debits)
                  </span>
                  <div className="flex justify-between py-1 border-b border-rose-100">
                    <span className="text-slate-600">Statutory Tax & PF</span>
                    <span className="font-bold text-rose-700">-₹{parseFloat(selectedPayslip.deductions || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-rose-100">
                    <span className="text-slate-600">Insurance & Others</span>
                    <span className="font-bold text-slate-500">₹0</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-rose-950">
                    <span>Total Deductions</span>
                    <span>-₹{parseFloat(selectedPayslip.deductions || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Grand Total */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold opacity-80 block">Net Salary Payable</span>
                  <span className="text-xs opacity-70">Disbursed into linked hospital staff salary bank account</span>
                </div>
                <div className="text-2xl font-black">
                  ₹{parseFloat(selectedPayslip.netSalary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> Print Payslip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-700 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
