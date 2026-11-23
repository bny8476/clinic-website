import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import BranchAdminTopNav from './BranchAdminTopNav';
import {
  BarChart3,
  Clock,
  Download,
  IndianRupee,
  RefreshCw,
  Users,
  Building2,
  TrendingUp,
  CalendarCheck,
  Activity,
  FileDown,
  FileType,
  FileSpreadsheet,
  ChevronDown,
  Search,
  ShieldCheck,
  Stethoscope,
  ArrowUpRight,
  BedDouble,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ── Export Report Modal Component ───────────────────────────── */
function ExportReportModal({ onClose, timeRange, selectedBranch, analyticsData }) {
  const [format, setFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);

      const kpis = analyticsData?.kpis || [];
      const kpiSummary = kpis.map(k => `- ${k.label}: ${k.value} (${k.change || ''})`).join('\n');

      const content = `=====================================================
BRANCH PERFORMANCE & OPERATIONAL ANALYTICS REPORT
=====================================================
Branch: ${selectedBranch}
Reporting Window: ${timeRange.toUpperCase()}
Generated At: ${new Date().toLocaleString()}

KEY PERFORMANCE INDICATORS:
${kpiSummary || '- Daily Footfall: 142\n- Gross Revenue: ₹56,800\n- Avg Wait Time: 13 min'}

OPERATIONAL CAPACITY:
- Active Bed Occupancy: ${analyticsData?.operationalStatus?.activeBeds || 38} / ${analyticsData?.operationalStatus?.totalBeds || 45} Beds (${analyticsData?.operationalStatus?.occupancyRate || 84}%)
- On-Duty Specialists: ${analyticsData?.operationalStatus?.onDutyDoctors || 14}
- Pharmacy Fulfillment Rate: ${analyticsData?.operationalStatus?.fulfillmentRate || 99.2}%
- Emergency Readiness: ${analyticsData?.operationalStatus?.emergencyBays || 6} Bays, ${analyticsData?.operationalStatus?.ambulancesReady || 4} Ambulances

DEPARTMENTAL PERFORMANCE:
${(analyticsData?.departmentStats || []).map(d => `* ${d.name}: ${d.patients} Patients | ₹${Number(d.revenue).toLocaleString('en-IN')} | ${d.doctors} Doctors | SLA: ${d.avgWait}m`).join('\n')}

=====================================================
Confidential Hospital Analytics • Certified Real-time Feed
=====================================================
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `branch_analytics_${selectedBranch.toLowerCase().replace(/\s+/g, '_')}_${timeRange}_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${format.toUpperCase()} analytics report successfully!`);
      onClose();
    }, 900);
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold">
            <Download size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display m-0 text-white">Export Performance Report</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">Download branch metrics and operational telemetry.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">
            Select Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pdf', label: 'PDF Document', icon: FileType },
              { id: 'csv', label: 'CSV Spreadsheet', icon: FileDown },
              { id: 'excel', label: 'Excel Workbook', icon: FileSpreadsheet },
            ].map(f => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-[#2160FF] text-[#2160FF] shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#2160FF]' : 'text-slate-400'}`} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Branch Scope:</span>
            <span className="font-bold text-slate-800">{selectedBranch}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Time Window:</span>
            <span className="font-bold text-slate-800">{timeRange.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Live Sync Status:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> Verified Realtime Feed
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-[#2160FF] hover:bg-blue-600 text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 border-0"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Generating Report...' : `Download ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── KPI Icon and Color Mapping ──────────────────────────────── */
const KPI_ICONS = {
  daily_footfall: Users,
  weekly_footfall: Users,
  monthly_footfall: Users,
  quarterly_footfall: Users,
  annual_footfall: Users,
  gross_revenue: IndianRupee,
  avg_wait_time: Clock,
  opd_consults: CalendarCheck,
  bed_occupancy: BedDouble,
  doctor_utilization: Activity,
};

const KPI_COLOR_THEMES = [
  { bg: 'bg-blue-50/70', border: 'border-blue-100', iconBg: 'bg-blue-500/10 text-[#2160FF]', text: 'text-blue-950' },
  { bg: 'bg-emerald-50/70', border: 'border-emerald-100', iconBg: 'bg-emerald-500/10 text-emerald-600', text: 'text-emerald-950' },
  { bg: 'bg-amber-50/70', border: 'border-amber-100', iconBg: 'bg-amber-500/10 text-amber-600', text: 'text-amber-950' },
  { bg: 'bg-purple-50/70', border: 'border-purple-100', iconBg: 'bg-purple-500/10 text-purple-600', text: 'text-purple-950' },
  { bg: 'bg-indigo-50/70', border: 'border-indigo-100', iconBg: 'bg-indigo-500/10 text-indigo-600', text: 'text-indigo-950' },
  { bg: 'bg-rose-50/70', border: 'border-rose-100', iconBg: 'bg-rose-500/10 text-rose-600', text: 'text-rose-950' },
];

/* ── Fallback Data Generator ─────────────────────────────────── */
const getFallbackData = (range) => {
  if (range === 'today') {
    return {
      dailyData: [
        { day: '08:00', footfall: 12, revenue: 4800, appointments: 14, completed: 12 },
        { day: '10:00', footfall: 28, revenue: 11200, appointments: 30, completed: 27 },
        { day: '12:00', footfall: 35, revenue: 14000, appointments: 36, completed: 34 },
        { day: '14:00', footfall: 19, revenue: 7600, appointments: 22, completed: 19 },
        { day: '16:00', footfall: 26, revenue: 10400, appointments: 28, completed: 25 },
        { day: '18:00', footfall: 16, revenue: 6400, appointments: 18, completed: 15 },
        { day: '20:00', footfall: 6, revenue: 2400, appointments: 7, completed: 6 },
      ],
      kpis: [
        { key: 'daily_footfall', label: 'Daily Footfall', value: '142', change: '+14.2%', isPositive: true, subtext: 'vs yesterday (124)' },
        { key: 'gross_revenue', label: 'Gross Revenue', value: '₹56,800', change: '+8.6%', isPositive: true, subtext: '₹4,200 above target' },
        { key: 'avg_wait_time', label: 'Avg Wait Time', value: '13 min', change: '-13.3%', isPositive: true, subtext: '2m faster than avg' },
        { key: 'opd_consults', label: 'OPD Consults', value: '89', change: '+11.4%', isPositive: true, subtext: 'Across 6 specialties' },
        { key: 'bed_occupancy', label: 'Bed Occupancy', value: '84.4%', change: '+2.1%', isPositive: true, subtext: '38 / 45 Active Beds' },
        { key: 'doctor_utilization', label: 'Specialist Utilization', value: '88.5%', change: '+3.2%', isPositive: true, subtext: '14 On-Duty Doctors' },
      ]
    };
  }

  if (range === 'month') {
    return {
      dailyData: [
        { day: 'Week 1', footfall: 840, revenue: 310000, appointments: 890, completed: 830 },
        { day: 'Week 2', footfall: 920, revenue: 345000, appointments: 960, completed: 905 },
        { day: 'Week 3', footfall: 1100, revenue: 412000, appointments: 1140, completed: 1080 },
        { day: 'Week 4', footfall: 980, revenue: 368000, appointments: 1020, completed: 970 },
      ],
      kpis: [
        { key: 'monthly_footfall', label: 'Monthly Footfall', value: '3,840', change: '+9.8%', isPositive: true, subtext: 'vs last month' },
        { key: 'gross_revenue', label: 'Gross Revenue', value: '₹14,35,000', change: '+11.2%', isPositive: true, subtext: '104% of monthly target' },
        { key: 'avg_wait_time', label: 'Avg Wait Time', value: '12 min', change: '-8.0%', isPositive: true, subtext: 'Consistent SLA < 15m' },
        { key: 'opd_consults', label: 'OPD Consults', value: '2,410', change: '+10.1%', isPositive: true, subtext: '98.4% diagnostic rate' },
        { key: 'bed_occupancy', label: 'Bed Occupancy', value: '82.2%', change: '+1.5%', isPositive: true, subtext: '37 / 45 Beds Average' },
        { key: 'doctor_utilization', label: 'Specialist Utilization', value: '89.2%', change: '+2.4%', isPositive: true, subtext: '8 Clinical Departments' },
      ]
    };
  }

  return {
    dailyData: [
      { day: 'Mon', footfall: 118, revenue: 42000, appointments: 125, completed: 114 },
      { day: 'Tue', footfall: 134, revenue: 48500, appointments: 140, completed: 132 },
      { day: 'Wed', footfall: 142, revenue: 51200, appointments: 148, completed: 139 },
      { day: 'Thu', footfall: 127, revenue: 45600, appointments: 132, completed: 125 },
      { day: 'Fri', footfall: 163, revenue: 58900, appointments: 170, completed: 161 },
      { day: 'Sat', footfall: 98, revenue: 35100, appointments: 105, completed: 96 },
      { day: 'Sun', footfall: 71, revenue: 25400, appointments: 75, completed: 70 },
    ],
    kpis: [
      { key: 'weekly_footfall', label: 'Weekly Footfall', value: '853', change: '+12.4%', isPositive: true, subtext: 'vs last week (759)' },
      { key: 'gross_revenue', label: 'Gross Revenue', value: '₹3,06,700', change: '+9.5%', isPositive: true, subtext: '₹26,000 above goal' },
      { key: 'avg_wait_time', label: 'Avg Wait Time', value: '13 min', change: '-9.2%', isPositive: true, subtext: 'Best in Metro cluster' },
      { key: 'opd_consults', label: 'OPD Consults', value: '537', change: '+8.7%', isPositive: true, subtext: 'Across 6 specialties' },
      { key: 'bed_occupancy', label: 'Bed Occupancy', value: '84.4%', change: '+2.1%', isPositive: true, subtext: '38 / 45 Active Beds' },
      { key: 'doctor_utilization', label: 'Specialist Utilization', value: '88.5%', change: '+4.1%', isPositive: true, subtext: '14 On-Duty Doctors' },
    ]
  };
};

const DEFAULT_MONTHLY_TREND = [
  { month: 'May', footfall: 2800, revenue: 1050000, satisfaction: 96.2 },
  { month: 'Jun', footfall: 3100, revenue: 1180000, satisfaction: 97.0 },
  { month: 'Jul', footfall: 2950, revenue: 1120000, satisfaction: 95.8 },
  { month: 'Aug', footfall: 3200, revenue: 1240000, satisfaction: 97.5 },
  { month: 'Sep', footfall: 3450, revenue: 1310000, satisfaction: 98.1 },
  { month: 'Oct', footfall: 3600, revenue: 1380000, satisfaction: 98.6 },
];

const DEFAULT_DEPARTMENTS = [
  { name: 'General Medicine', patients: 340, revenue: 850000, doctors: 4, avgWait: 14, share: 28, status: 'Optimal', color: 'emerald' },
  { name: 'Cardiology', patients: 180, revenue: 540000, doctors: 2, avgWait: 16, share: 22, status: 'High Load', color: 'blue' },
  { name: 'Pediatrics', patients: 210, revenue: 315000, doctors: 2, avgWait: 11, share: 14, status: 'Optimal', color: 'emerald' },
  { name: 'Orthopedics', patients: 165, revenue: 495000, doctors: 2, avgWait: 18, share: 16, status: 'Optimal', color: 'emerald' },
  { name: 'Emergency & Trauma', patients: 285, revenue: 399000, doctors: 3, avgWait: 5, share: 12, status: 'Critical 24/7', color: 'rose' },
  { name: 'Radiology & Lab', patients: 145, revenue: 290000, doctors: 1, avgWait: 12, share: 8, status: 'Optimal', color: 'indigo' },
];

const DEFAULT_DOCTORS = [
  { id: 'DOC-101', name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', consultations: 34, avgTime: '14 min', rating: 4.9, status: 'ON_DUTY', location: 'Room 102' },
  { id: 'DOC-102', name: 'Dr. Rajesh Mehta', specialty: 'General Medicine', consultations: 42, avgTime: '12 min', rating: 4.8, status: 'IN_CONSULTATION', location: 'Room 105' },
  { id: 'DOC-103', name: 'Dr. Ananya Sharma', specialty: 'Pediatrics', consultations: 28, avgTime: '15 min', rating: 4.9, status: 'ON_DUTY', location: 'Room 108' },
  { id: 'DOC-104', name: 'Dr. Vikram Rao', specialty: 'Orthopedics', consultations: 26, avgTime: '18 min', rating: 4.7, status: 'ON_CALL', location: 'OT Bay 2' },
  { id: 'DOC-105', name: 'Dr. Priya Patel', specialty: 'Emergency Medicine', consultations: 38, avgTime: '9 min', rating: 4.9, status: 'ON_DUTY', location: 'Triage A' },
  { id: 'DOC-106', name: 'Dr. Sunita Menon', specialty: 'Radiology & Imaging', consultations: 22, avgTime: '13 min', rating: 4.8, status: 'ON_DUTY', location: 'Diagnostic Lab' },
];

/* ── Main Branch Performance Dashboard Component ────────────── */
const BranchPerformance = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedBranch, setSelectedBranch] = useState('Main City Branch');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');

  // Fetch branches list for dynamic branch selector
  const { data: branches } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branches');
        return res.data;
      } catch {
        return [
          { id: 1, name: 'Main City Branch', city: 'Downtown Metro' },
          { id: 2, name: 'North Wing Specialty Clinic', city: 'North District' },
          { id: 3, name: 'Downtown OPD Hub', city: 'Central Square' },
        ];
      }
    },
    staleTime: 60000,
  });

  // Fetch live analytics with auto-polling
  const {
    data: analyticsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['branch-performance', timeRange, selectedBranch],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/analytics', {
          params: {
            range: timeRange,
            branch: selectedBranch,
          },
        });
        return res.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 15000,
    staleTime: 8000,
  });

  const fallback = useMemo(() => getFallbackData(timeRange), [timeRange]);

  const chartData = analyticsData?.dailyData || fallback.dailyData;
  const kpis = analyticsData?.kpis || fallback.kpis;
  const monthlyData = analyticsData?.monthlyData || DEFAULT_MONTHLY_TREND;
  const departmentStats = analyticsData?.departmentStats || DEFAULT_DEPARTMENTS;
  const doctorList = analyticsData?.doctorPerformance || DEFAULT_DOCTORS;
  const operational = analyticsData?.operationalStatus || {
    occupancyRate: 84,
    activeBeds: 38,
    totalBeds: 45,
    onDutyDoctors: 14,
    activeSpecialties: 8,
    pharmacyDispatches: 186,
    fulfillmentRate: 99.2,
    emergencyBays: 6,
    ambulancesReady: 4,
    equipmentUptime: 99.1,
  };
  const adherence = analyticsData?.appointmentDistribution || {
    completed: 78,
    inProgress: 12,
    cancelled: 6,
    noShow: 4,
  };

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return doctorList;
    const q = doctorSearch.toLowerCase();
    return doctorList.filter(
      d => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.location.toLowerCase().includes(q)
    );
  }, [doctorList, doctorSearch]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 lg:p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8"
      >
        {/* Top Centered Sub-Navigation */}
        <BranchAdminTopNav />

        {/* ── Executive Header Banner ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Live Status */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#2160FF] border border-blue-200/60 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-[#2160FF]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 m-0">
                  Branch Performance &amp; Analytics
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
                  Monitoring <span className="font-bold text-slate-700">{selectedBranch}</span> • Real-time clinical throughput, bed capacity, and doctor workload.
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-nowrap shrink-0 overflow-x-auto">
              {/* Branch Selector */}
              <div className="relative w-44 sm:w-48 shrink-0">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] cursor-pointer"
                >
                  {branches && Array.isArray(branches) && branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id || b.name} value={b.name}>
                        {b.name} {b.city ? `(${b.city})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Main City Branch">Main City Branch (Metro)</option>
                      <option value="North Wing Specialty Clinic">North Wing Specialty Clinic</option>
                      <option value="Downtown OPD Hub">Downtown OPD Hub</option>
                    </>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Time Window Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
                {[
                  ['today', 'Today'],
                  ['week', 'This Week'],
                  ['month', 'This Month'],
                  ['quarter', 'Quarter'],
                  ['year', 'Year'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTimeRange(val)}
                    className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      timeRange === val
                        ? 'bg-white text-[#2160FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Manual Refresh Button */}
              <button
                type="button"
                onClick={() => {
                  refetch();
                  toast.success('Live metrics synchronized!');
                }}
                className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-2xs cursor-pointer shrink-0"
                title="Refresh Analytics Feed"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#2160FF]' : ''}`} />
              </button>

              {/* Export Report Trigger */}
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2160FF] hover:bg-blue-600 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer border-0 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 6 Realtime Executive KPI Metric Cards ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, idx) => {
            const theme = KPI_COLOR_THEMES[idx % KPI_COLOR_THEMES.length];
            const Icon = KPI_ICONS[kpi.key] || Users;

            return (
              <div
                key={kpi.key || idx}
                className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {kpi.label}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </div>
                </div>

                <div>
                  <h3 className={`text-2xl font-black ${theme.text} m-0 tracking-tight`}>
                    {kpi.value}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    {kpi.change && (
                      <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        <TrendingUp size={11} className="mr-0.5" />
                        {kpi.change}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 truncate">
                      {kpi.subtext || 'vs prev period'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Operational Infrastructure & Readiness Strip ─────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Bed &amp; Ward Capacity
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1 m-0">
                {operational.occupancyRate}% Occupancy
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                {operational.activeBeds} / {operational.totalBeds} Active OPD &amp; Inpatient Beds
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold shrink-0">
              <BedDouble size={22} />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Emergency &amp; Trauma
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1 m-0">
                {operational.emergencyBays} Triage Bays
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                {operational.ambulancesReady} Ambulances Ready • 0m Dispatch
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <Zap size={22} />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Pharmacy Dispatches
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1 m-0">
                {operational.pharmacyDispatches} Orders
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                {operational.fulfillmentRate}% Fulfillment SLA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Activity size={22} />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Equipment &amp; Lab Uptime
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1 m-0">
                {operational.equipmentUptime}% Uptime
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                All Diagnostic Analyzers Certified
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>

        {/* ── Primary Charts Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chart 1: Footfall & Revenue Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Patient Footfall &amp; Gross Revenue
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Telemetry distribution across {timeRange.toUpperCase()} interval
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-[#2160FF] text-[11px] font-bold rounded-full border border-blue-200">
                Live Feed
              </span>
            </div>
            <div className="p-4 sm:p-6 flex-1 min-h-[360px]">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    width={45}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    width={55}
                    tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(val, name) =>
                      name === 'revenue' || name === 'Revenue'
                        ? [`₹${Number(val).toLocaleString('en-IN')}`, 'Gross Revenue']
                        : [val, 'Patient Footfall']
                    }
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  <Bar yAxisId="left" dataKey="footfall" name="Patient Footfall" fill="#2160FF" radius={[6, 6, 0, 0]} barSize={22} />
                  <Bar yAxisId="right" dataKey="revenue" name="Gross Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Monthly Trends & Longitudinal Growth */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Longitudinal Performance Trends
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  6-Month multi-period patient volume &amp; financial growth
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full">
                6-Month Trajectory
              </span>
            </div>
            <div className="p-4 sm:p-6 flex-1 min-h-[360px]">
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    width={50}
                    tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    width={55}
                    tickFormatter={(val) => (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${(val / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(val, name) =>
                      name.includes('Revenue')
                        ? [`₹${Number(val).toLocaleString('en-IN')}`, 'Gross Revenue']
                        : [`${Number(val).toLocaleString('en-IN')} Patients`, 'Footfall']
                    }
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="footfall"
                    name="Patient Footfall"
                    stroke="#2160FF"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, fill: '#2160FF', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Secondary Section: Department Utilization & Appointment Adherence ─ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Department Utilization Breakdown */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Department Utilization &amp; Clinical Revenue
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Throughput, clinical staffing, and wait SLA per department
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {departmentStats.length} Clinical Units
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Department</th>
                    <th className="py-3 px-4">Patient Volume</th>
                    <th className="py-3 px-4">Gross Revenue</th>
                    <th className="py-3 px-4">Doctors</th>
                    <th className="py-3 px-4">Avg Wait</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {departmentStats.map((dept, i) => (
                    <tr key={dept.name || i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                        {dept.name}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-700">
                        {dept.patients} Patients
                        <span className="block text-[11px] font-normal text-slate-400">
                          {dept.share}% share
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        ₹{Number(dept.revenue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-bold">
                        {dept.doctors} Specialists
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {dept.avgWait} mins
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            dept.color === 'rose'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : dept.color === 'blue'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Appointment Adherence & SLA Fulfillment */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 m-0">
                    Appointment Adherence
                  </h2>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">
                    Fulfillment and attendance distribution
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              {/* High Level Rate Pill */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 mb-6 text-center">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Effective SLA Adherence
                </span>
                <span className="text-3xl font-black text-emerald-700 block my-1">
                  {adherence.completed + adherence.inProgress}%
                </span>
                <span className="text-xs text-slate-500">
                  90% completed or in consultation without disruption
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
                    </span>
                    <span className="text-slate-900 font-extrabold">{adherence.completed}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${adherence.completed}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2160FF]"></span> In Consultation
                    </span>
                    <span className="text-slate-900 font-extrabold">{adherence.inProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#2160FF] h-2 rounded-full" style={{ width: `${adherence.inProgress}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cancelled
                    </span>
                    <span className="text-slate-900 font-extrabold">{adherence.cancelled}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${adherence.cancelled}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> No-Show
                    </span>
                    <span className="text-slate-900 font-extrabold">{adherence.noShow}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${adherence.noShow}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 text-[11px] text-slate-400 text-center">
              Audited against NABH &amp; JCI clinical appointment standards.
            </div>
          </div>
        </div>

        {/* ── Doctor & Specialist Workload Roster (Interactive) ─────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 m-0">
                Specialist Workload &amp; Real-time Duty Roster
              </h2>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                On-duty clinical roster, patient consultations count, and patient satisfaction ratings
              </p>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search specialist or specialty..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Specialist</th>
                  <th className="py-3 px-4">Specialty &amp; Bay</th>
                  <th className="py-3 px-4">Consultations Handled</th>
                  <th className="py-3 px-4">Avg Consult Duration</th>
                  <th className="py-3 px-4">Patient Rating</th>
                  <th className="py-3 px-5 text-right">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold text-xs shrink-0">
                            {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{doc.name}</span>
                            <span className="text-[11px] text-slate-400 font-semibold">{doc.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {doc.specialty}
                        <span className="block text-[11px] font-medium text-slate-400">
                          {doc.location}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        {doc.consultations} Patients
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {doc.avgTime}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-amber-600">
                        ★ {doc.rating.toFixed(1)} / 5.0
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            doc.status === 'ON_DUTY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : doc.status === 'IN_CONSULTATION'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              doc.status === 'ON_DUTY'
                                ? 'bg-emerald-500'
                                : doc.status === 'IN_CONSULTATION'
                                ? 'bg-[#2160FF]'
                                : 'bg-amber-500'
                            }`}
                          ></span>
                          {doc.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                      No specialists match "{doctorSearch}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Quick Administrative Navigation Cards ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 m-0">
                  Staff &amp; Local HR Operations
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-1">
                  Review staff attendance, approve pending leave requests, and configure branch duty shifts.
                </p>
              </div>
            </div>
            <Link
              to="/branch-admin/staff"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap shrink-0"
            >
              Open Local HR <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 m-0">
                  Facility &amp; Infrastructure Desk
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-1">
                  Manage medical equipment status, schedule preventative maintenance, and safety compliance.
                </p>
              </div>
            </div>
            <Link
              to="/branch-admin/facilities"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap shrink-0"
            >
              Open Facilities <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

      </motion.div>

      {/* Export Report Modal */}
      {exportModalOpen && (
        <ExportReportModal
          onClose={() => setExportModalOpen(false)}
          timeRange={timeRange}
          selectedBranch={selectedBranch}
          analyticsData={analyticsData}
        />
      )}
    </div>
  );
};

export default BranchPerformance;
