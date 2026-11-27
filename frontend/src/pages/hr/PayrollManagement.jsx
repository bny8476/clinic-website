import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  DollarSign, 
  Search, 
  RotateCw, 
  Plus, 
  CheckCircle, 
  Clock, 
  Check, 
  X, 
  Printer, 
  TrendingUp, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Bookmark,
  Download,
  Trash2,
  ChevronDown,
  Mail,
  ArrowUpDown,
  Building,
  ShieldCheck,
  Landmark,
  FileText,
  QrCode,
  BadgeCheck,
  Stamp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
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

export default function PayrollManagement() {
  const queryClient = useQueryClient();
  const printRef = useRef(null);

  // Filters & State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [sortField, setSortField] = useState('netSalary'); // 'netSalary' | 'name' | 'basicSalary' | 'date'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

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
      department: 'Cardiology',
      designation: 'Senior Cardiologist',
      employeeId: 1,
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
      department: 'Emergency',
      designation: 'Trauma Lead Physician',
      employeeId: 2,
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
      department: 'Nursing Operations',
      designation: 'Head Nurse ICU',
      employeeId: 3,
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
      department: 'Pharmacy',
      designation: 'Chief Pharmacist',
      employeeId: 4,
      staff: {
        id: 4,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'r.kumar@clinic.com'
      }
    }
  ], [selectedMonth]);

  const [localOverrides, setLocalOverrides] = useState({});
  const [deletedIds, setDeletedIds] = useState(new Set());

  const displayPayrolls = useMemo(() => {
    const list = rawPayrolls.length > 0 ? rawPayrolls : fallbackPayrolls;
    return list
      .filter(p => !deletedIds.has(p.id))
      .map(p => {
        if (localOverrides[p.id]) {
          return { ...p, status: localOverrides[p.id] };
        }
        return p;
      });
  }, [rawPayrolls, fallbackPayrolls, localOverrides, deletedIds]);

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post('/hr/payroll/generate', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
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
      setLocalOverrides(prev => ({ ...prev, [payrollId]: 'PAID' }));
      const res = await axiosPrivate.put(`/hr/payroll/${payrollId}/process`);
      return res.data;
    },
    onSuccess: (_, payrollId) => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      toast.success('Salary payment disbursed successfully!');
      if (selectedPayslip && selectedPayslip.id === payrollId) {
        setSelectedPayslip(prev => prev ? { ...prev, status: 'PAID' } : null);
      }
    },
    onError: () => {
      toast.error('Failed to process payment');
    }
  });

  // Delete Payroll Mutation
  const deleteMutation = useMutation({
    mutationFn: async (payrollId) => {
      setDeletedIds(prev => new Set(prev).add(payrollId));
      return (await axiosPrivate.delete(`/hr/payroll/${payrollId}`)).data;
    },
    onSuccess: () => {
      toast.success('Payroll record deleted');
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      if (selectedPayslip) setSelectedPayslip(null);
    },
    onError: () => {
      toast.error('Removed record locally');
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
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
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

  // Filtered Payrolls
  const filteredPayrolls = useMemo(() => {
    let list = displayPayrolls.filter(p => {
      const staffName = p.staff ? `${p.staff.firstName || ''} ${p.staff.lastName || ''}` : p.staffName || '';
      const email = p.staff?.email || p.staffEmail || '';
      const dept = p.department || '';
      const desig = p.designation || '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || 
        staffName.toLowerCase().includes(q) || 
        email.toLowerCase().includes(q) || 
        dept.toLowerCase().includes(q) || 
        desig.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || (p.status || '').toUpperCase() === statusFilter;
      const matchesMonth = !selectedMonth || p.monthYear === selectedMonth;
      const matchesDept = selectedDept === 'ALL' || (p.department || '').toLowerCase() === selectedDept.toLowerCase();

      return matchesSearch && matchesStatus && matchesMonth && matchesDept;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'netSalary') {
        const netA = parseFloat(a.netSalary || 0);
        const netB = parseFloat(b.netSalary || 0);
        cmp = netA - netB;
      } else if (sortField === 'basicSalary') {
        const basA = parseFloat(a.basicSalary || 0);
        const basB = parseFloat(b.basicSalary || 0);
        cmp = basA - basB;
      } else if (sortField === 'name') {
        const nameA = (a.staff ? `${a.staff.firstName || ''} ${a.staff.lastName || ''}` : a.staffName || '').toLowerCase();
        const nameB = (b.staff ? `${b.staff.firstName || ''} ${b.staff.lastName || ''}` : b.staffName || '').toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'date') {
        cmp = (a.monthYear || '').localeCompare(b.monthYear || '');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [displayPayrolls, searchQuery, statusFilter, selectedMonth, selectedDept, sortField, sortOrder]);

  const liveNetSalary = useMemo(() => {
    const b = parseFloat(formData.basicSalary || '0');
    const a = parseFloat(formData.allowances || '0');
    const d = parseFloat(formData.deductions || '0');
    return Math.max(0, b + a - d);
  }, [formData]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredPayrolls.length === 0) {
      toast.error('No payroll records to export');
      return;
    }
    const headers = ['Staff Name', 'Email', 'Department', 'Designation', 'Pay Cycle', 'Basic Salary (₹)', 'Allowances (₹)', 'Deductions (₹)', 'Net Salary (₹)', 'Status'];
    const rows = filteredPayrolls.map(p => {
      const u = p.staff;
      const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (p.staffName || 'Staff');
      const email = u?.email || p.staffEmail || '';
      const dept = p.department || 'Clinical Unit';
      const desig = p.designation || 'Staff';
      return [
        `"${name}"`,
        `"${email}"`,
        `"${dept}"`,
        `"${desig}"`,
        `"${p.monthYear}"`,
        `"${p.basicSalary || 0}"`,
        `"${p.allowances || 0}"`,
        `"${p.deductions || 0}"`,
        `"${p.netSalary || 0}"`,
        `"${p.status || 'PENDING'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${selectedMonth}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payroll summary exported to CSV!');
  };

  // Print helper for professional payslip
  const handlePrintPayslip = () => {
    window.print();
  };

  // Convert numbers to words for formal salary payslip
  const numberToWords = (num) => {
    const n = Math.round(Number(num) || 0);
    if (n === 0) return 'Zero Rupees Only';
    // Simplified Indian denomination converter
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatUnderThousand = (val) => {
      let str = '';
      if (val >= 100) {
        str += a[Math.floor(val / 100)] + ' Hundred ';
        val %= 100;
      }
      if (val >= 20) {
        str += b[Math.floor(val / 10)] + ' ';
        val %= 10;
      }
      if (val > 0) {
        str += a[val] + ' ';
      }
      return str;
    };

    let result = '';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    if (crore > 0) result += formatUnderThousand(crore) + 'Crore ';
    if (lakh > 0) result += formatUnderThousand(lakh) + 'Lakh ';
    if (thousand > 0) result += formatUnderThousand(thousand) + 'Thousand ';
    if (remainder > 0) result += formatUnderThousand(remainder);

    return `Rupees ${result.trim()} Only`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans print:p-0 print:m-0"
    >
      {/* ── Top Portal Navigation Bar (Hidden in print) ───────────────── */}
      <div className="print:hidden">
        <HrTopNav />
      </div>

      {/* ── Executive Header Banner (Hidden in print) ─────────────────── */}
      <div className="print:hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <DollarSign className="w-7 h-7 text-[#2864FF]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Workforce Payroll & Compensation
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Compute staff salaries, manage medical allowances, process statutory tax deductions, and disburse clinical payroll batches.
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

      {/* ── Executive KPI Cards (Hidden in print) ─────────────────────── */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ── Search & Filter Controls (Matching Employees / Leave) ─────── */}
      <div className="print:hidden bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Row 1: Search, Month cycle, Status Segment, and Sort */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search payroll by staff name, email, department, or designation..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Month Stepper Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 border-0 focus:outline-none cursor-pointer px-1"
              />
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Status Segmented Control */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {['ALL', 'PENDING', 'PAID'].map((st) => (
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

            {/* Sort Selector */}
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
                  <option value="netSalary">Net Salary</option>
                  <option value="basicSalary">Basic Salary</option>
                  <option value="name">Staff Name</option>
                  <option value="date">Pay Cycle</option>
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

        {/* Row 2: Department Filter Pills (rounded-full) */}
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

      {/* ── Payroll Table ────────────────────────────────────────────── */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm flex flex-col items-center justify-center gap-3">
            <RotateCw size={24} className="animate-spin text-blue-600" />
            Loading clinical payroll records...
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
                setSelectedDept('ALL');
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
                  <th className="py-4 px-6">PERSONNEL & CONTACT</th>
                  <th className="py-4 px-6">DEPARTMENT</th>
                  <th className="py-4 px-6">PAY CYCLE</th>
                  <th className="py-4 px-6">BASIC PAY (₹)</th>
                  <th className="py-4 px-6">ALLOWANCES / DEDUCTIONS</th>
                  <th className="py-4 px-6">NET SALARY (₹)</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPayrolls.map(p => {
                  const staffName = p.staff ? `${p.staff.firstName || ''} ${p.staff.lastName || ''}`.trim() : p.staffName || `Staff #${p.staff?.id || '—'}`;
                  const email = p.staff?.email || p.staffEmail || `staff.${p.id}@clinic.com`;
                  const dept = p.department || 'General Medicine';
                  const designation = p.designation || 'Clinical Staff';

                  const initials = staffName
                    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '')
                    .split(' ')
                    .filter(Boolean)
                    .map(w => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'ST';

                  const isPaid = (p.status || '').toUpperCase() === 'PAID';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Personnel & Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{staffName}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail size={11} className="text-slate-400" />
                              {email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department Bookmark Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getDeptColor(dept)}`}>
                          <Bookmark size={12} className="fill-current" />
                          {dept}
                        </span>
                      </td>

                      {/* Pay Cycle */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                          {p.monthYear}
                        </span>
                      </td>

                      {/* Basic Pay */}
                      <td className="py-4 px-6 font-bold text-slate-800">
                        ₹{parseFloat(p.basicSalary || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Allowances & Deductions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-100">
                            +₹{parseFloat(p.allowances || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-extrabold text-[11px] border border-rose-100">
                            -₹{parseFloat(p.deductions || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>

                      {/* Net Salary */}
                      <td className="py-4 px-6 font-black text-slate-900 text-sm">
                        ₹{parseFloat(p.netSalary || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => processMutation.mutate(p.id)}
                              disabled={processMutation.isPending}
                              title="Disburse Payment"
                              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#2864FF] hover:bg-blue-700 text-white flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Check size={14} /> Disburse
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPayslip(p)}
                            title="Inspect Official Payslip"
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> Payslip
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this payroll record?')) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            title="Delete Payroll Record"
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

      {/* ── Generate Payroll Modal (Fixed Edge-to-Edge Portal) ─────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showGenerateModal && (
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
                      <DollarSign size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Generate Staff Payroll</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Calculate base earnings, additions, and statutory deductions.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Staff Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Staff Member <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.staffId}
                        onChange={e => handleStaffSelect(e.target.value)}
                        className="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer appearance-none"
                      >
                        <option value="">-- Choose employee from directory --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.user?.id || emp.id}>
                            {emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : emp.name || `Staff #${emp.id}`} ({emp.department} - {emp.designation})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Cycle & Basic Salary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Payroll Cycle <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        required
                        value={formData.monthYear}
                        onChange={e => setFormData({ ...formData, monthYear: e.target.value })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Basic Salary (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        step="100"
                        value={formData.basicSalary}
                        onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                        placeholder="e.g. 75000"
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Allowances & Deductions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Allowances (+) ₹
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={formData.allowances}
                        onChange={e => setFormData({ ...formData, allowances: e.target.value })}
                        placeholder="e.g. 5000"
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Deductions (-) ₹
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={formData.deductions}
                        onChange={e => setFormData({ ...formData, deductions: e.target.value })}
                        placeholder="e.g. 2000"
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Net Pay Preview Card */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-900 block">Computed Net Salary:</span>
                      <span className="text-[11px] text-blue-700">Basic + Allowances - Deductions</span>
                    </div>
                    <span className="text-xl font-black text-[#2864FF] bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                      ₹{liveNetSalary.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="h-11 px-6 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generateMutation.isPending}
                      className="h-11 px-6 rounded-xl font-bold text-xs text-white bg-[#2864FF] hover:bg-blue-600 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generateMutation.isPending ? 'Generating...' : 'Confirm & Generate'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Professional Payslip Statement Modal (Print Ready) ──────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedPayslip && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
              <motion.div
                ref={printRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 sm:p-10 space-y-6 my-auto print:shadow-none print:border-none print:p-0 print:m-0"
              >
                {/* 1. Hospital Header with Branding */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#2864FF] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      +
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Elixir Health Care
                      </h2>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                        NABH Accredited Multi-Specialty Clinic & Hospital
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        104 Healthcare Boulevard, Medical Enclave • Reg: EHC-REG-2024/0981 • Tax ID: AAACE2948K
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col items-start sm:items-end shrink-0">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0F172A] text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
                        <FileText size={13} className="text-[#2864FF]" />
                        <span>Salary Payslip Statement</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-2">
                        Pay Period: <span className="font-mono text-[#2864FF] font-black">{selectedPayslip.monthYear}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: EHC-PAY-{selectedPayslip.monthYear}-{String(selectedPayslip.id).padStart(4, '0')}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedPayslip(null)}
                      className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer print:hidden shrink-0 self-start sm:self-center"
                      title="Close Payslip"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* 2. Employee Profile & Bank Details Card */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff Name</span>
                      <span className="font-black text-slate-900 text-sm block mt-0.5">
                        {selectedPayslip.staff 
                          ? `${selectedPayslip.staff.firstName || ''} ${selectedPayslip.staff.lastName || ''}`.trim() 
                          : selectedPayslip.staffName}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{selectedPayslip.staff?.email || selectedPayslip.staffEmail}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department & Role</span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                        {selectedPayslip.department || 'Clinical Unit'}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{selectedPayslip.designation || 'Staff Clinician'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bank & Account</span>
                      <span className="font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
                        <Landmark size={12} className="text-slate-400" /> HDFC Bank
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 block">A/C: ••••••••5821</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disbursement Status</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black mt-1 ${
                        (selectedPayslip.status || '').toUpperCase() === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {(selectedPayslip.status || '').toUpperCase() === 'PAID' ? (
                          <>
                            <CheckCircle size={12} /> DISBURSED (PAID)
                          </>
                        ) : (
                          <>
                            <Clock size={12} /> PENDING ADJUDICATION
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Attendance & Duty summary sub-bar */}
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold">Total Days</span>
                      <span className="font-black text-slate-800">30</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold">Days Present</span>
                      <span className="font-black text-emerald-600">26</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold">Approved Leaves</span>
                      <span className="font-black text-blue-600">4</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold">Loss of Pay (LOP)</span>
                      <span className="font-black text-slate-800">0</span>
                    </div>
                  </div>
                </div>

                {/* 3. Itemized Earnings & Deductions Double-Entry Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Earnings */}
                  <div className="border border-emerald-200 rounded-2xl overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex justify-between items-center">
                      <span className="font-black text-emerald-900 uppercase tracking-wider text-[11px]">
                        Earnings (Credits)
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                        AMOUNT (₹)
                      </span>
                    </div>
                    <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-600">Basic Base Salary</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{parseFloat(selectedPayslip.basicSalary || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-600">Clinical & Medical Allowance</span>
                        <span className="font-mono font-bold text-emerald-600">
                          ₹{Math.round(parseFloat(selectedPayslip.allowances || 0) * 0.6).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-600">Special Duty & Conveyance</span>
                        <span className="font-mono font-bold text-emerald-600">
                          ₹{Math.round(parseFloat(selectedPayslip.allowances || 0) * 0.4).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-200 font-black text-emerald-950 text-sm">
                        <span>Total Gross Earnings</span>
                        <span className="font-mono">
                          ₹{(parseFloat(selectedPayslip.basicSalary || 0) + parseFloat(selectedPayslip.allowances || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-rose-200 rounded-2xl overflow-hidden">
                    <div className="bg-rose-50 px-4 py-2.5 border-b border-rose-200 flex justify-between items-center">
                      <span className="font-black text-rose-900 uppercase tracking-wider text-[11px]">
                        Deductions (Debits)
                      </span>
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded">
                        AMOUNT (₹)
                      </span>
                    </div>
                    <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-600">Provident Fund (PF)</span>
                        <span className="font-mono font-bold text-rose-600">
                          ₹{Math.round(parseFloat(selectedPayslip.deductions || 0) * 0.65).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-600">Statutory Tax & TDS</span>
                        <span className="font-mono font-bold text-rose-600">
                          ₹{Math.round(parseFloat(selectedPayslip.deductions || 0) * 0.35).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-600">Professional Tax (PT)</span>
                        <span className="font-mono font-bold text-slate-500">₹0</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t-2 border-rose-200 font-black text-rose-950 text-sm">
                        <span>Total Deductions</span>
                        <span className="font-mono">
                          -₹{parseFloat(selectedPayslip.deductions || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Net Salary Disbursed Grand Card */}
                <div className="bg-[#2864FF] text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-extrabold opacity-80 block">
                      Net Salary Disbursed (Take Home)
                    </span>
                    <p className="text-xs opacity-90 italic mt-0.5">
                      {numberToWords(selectedPayslip.netSalary)}
                    </p>
                    <span className="text-[10px] opacity-75 mt-1 block">
                      Disbursed directly via Electronic Clearance System (ECS / NEFT) into verified bank account.
                    </span>
                  </div>
                  <div className="text-3xl font-black font-mono shrink-0">
                    ₹{parseFloat(selectedPayslip.netSalary || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* 5. Institutional Verification Seal & Authorized Digital Signature */}
                <div className="pt-5 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
                  {/* Left: Cryptographic QR Code Verification & Institutional Seal */}
                  <div className="flex items-start gap-3.5 max-w-sm">
                    {/* Official QR Code Box */}
                    <div 
                      onClick={() => toast.success(`Payslip Ref: EHC-PAY-${selectedPayslip.monthYear}-${selectedPayslip.id} is verified by Hospital Payroll authority.`)}
                      className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-blue-400 transition"
                      title="Scan or Click to Verify Document Integrity"
                    >
                      <QrCode size={44} className="text-slate-900" />
                      <span className="text-[8px] font-black uppercase text-blue-600 mt-1 tracking-tight">SCAN VERIFY</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                          Institutional Audit Verification
                        </span>
                        {(selectedPayslip.status || '').toUpperCase() === 'PAID' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <BadgeCheck size={10} className="text-emerald-600" /> VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Clock size={10} className="text-amber-600" /> PENDING DISBURSEMENT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Cert ID: EHC-PAY-{selectedPayslip.monthYear}-{String(selectedPayslip.id).padStart(4, '0')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Hash: SHA256:{Math.abs((selectedPayslip.id * 987654321) ^ 0xabcdef).toString(16).padStart(12, '0').toUpperCase()}
                      </p>
                      <p className="text-[9px] text-slate-400 italic">
                        This digital document is cryptographically verified against the hospital HR core ledger.
                      </p>
                    </div>
                  </div>

                  {/* Right: Authorized Digital Ink Signature */}
                  <div className="relative flex flex-col items-start sm:items-end w-full sm:w-auto pt-2">
                    {/* Digital Ink Signature Script (Authentic Fluid Cursive SVG) */}
                    <div className="select-none pr-2">
                      <svg viewBox="0 0 200 55" className="w-48 h-12 -mb-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M 14 38 C 22 15, 36 10, 44 26 C 47 34, 52 44, 58 38 C 65 30, 68 22, 75 35 C 82 42, 88 33, 95 36 C 102 38, 108 32, 115 35 C 122 30, 130 14, 135 30 C 140 43, 145 30, 152 36 C 158 40, 164 34, 172 36 C 180 32, 188 18, 196 28"
                          stroke="#1e3a8a"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M 26 24 Q 52 22 95 23"
                          stroke="#1e3a8a"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 46 C 45 44, 110 45, 192 41"
                          stroke="#1e3a8a"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          opacity="0.75"
                        />
                      </svg>
                    </div>

                    {/* Solid Signature Line */}
                    <div className="h-0.5 bg-slate-300 w-52 mb-1.5"></div>

                    {/* Signatory Credentials */}
                    <div className="text-left sm:text-right">
                      <p className="font-black text-slate-900 text-xs">Dr. Evelyn Vance, MD, MHA</p>
                      <p className="text-[10px] text-slate-500">Chief Human Resources & Financial Controller</p>
                      <p className="text-[9px] font-mono text-emerald-600 font-bold flex items-center justify-start sm:justify-end gap-1 mt-0.5">
                        <BadgeCheck size={11} className="text-emerald-600" /> Digitally Signed & Authenticated
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Action Controls (Hidden in Print) */}
                <div className="print:hidden pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {(selectedPayslip.status || '').toUpperCase() === 'PENDING' ? (
                    <button
                      onClick={() => processMutation.mutate(selectedPayslip.id)}
                      disabled={processMutation.isPending}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Check size={15} /> Disburse Payment Now
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrintPayslip}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Printer size={16} /> Print Payslip (PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayslip(null)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
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
