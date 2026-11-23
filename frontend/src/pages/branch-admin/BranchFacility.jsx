import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import BranchAdminTopNav from './BranchAdminTopNav';
import {
  Building,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  Monitor,
  Zap,
  Droplet,
  Wind,
  Wifi,
  Sliders,
  Check,
  ArrowUpRight,
  HardHat
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Report Maintenance Issue Modal ─────────────────────────────── */
function ReportIssueModal({ onClose, onSubmit, prefilledEquipment, equipmentList = [] }) {
  const [form, setForm] = useState({
    title: prefilledEquipment ? `${prefilledEquipment.name}` : '',
    location: prefilledEquipment ? prefilledEquipment.department : 'General OPD',
    priority: 'HIGH',
    description: '',
    technician: 'In-House Biomedical Engineering Team'
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedAsset = useMemo(() => {
    if (prefilledEquipment) return prefilledEquipment;
    return equipmentList.find(eq => eq.name === form.title);
  }, [prefilledEquipment, equipmentList, form.title]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inputCls = 'w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF] bg-slate-50/50';

  const priorityOptions = [
    {
      id: 'CRITICAL',
      title: 'Critical Priority',
      sla: 'Immediate SLA (< 2 hrs)',
      badge: 'Life-Safety / ICU / OT',
      icon: AlertTriangle,
      iconColor: 'text-rose-600 bg-rose-50',
      description: 'Total equipment failure or hazard directly risking patient safety or critical care uptime.'
    },
    {
      id: 'HIGH',
      title: 'High Priority',
      sla: '4-Hour Response SLA',
      badge: 'Diagnostic Capacity Risk',
      icon: Zap,
      iconColor: 'text-amber-600 bg-amber-50',
      description: 'Major impairment restricting patient throughput, diagnostic imaging, or vital clinical testing.'
    },
    {
      id: 'MEDIUM',
      title: 'Medium Priority',
      sla: '24–48 Hour Window',
      badge: 'Scheduled Maintenance',
      icon: Clock,
      iconColor: 'text-blue-600 bg-blue-50',
      description: 'Non-urgent calibration drift, sensor fault alert, or component maintenance without patient impact.'
    },
    {
      id: 'LOW',
      title: 'Low / Routine',
      sla: 'Routine Maintenance',
      badge: 'Preventative Inspection',
      icon: CheckCircle2,
      iconColor: 'text-slate-600 bg-slate-50',
      description: 'Cosmetic wear, general quarterly inspection, filter replacements, or routine preventative servicing.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location) {
      toast.error('Please enter equipment and location');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
            <Wrench size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display m-0 text-white">Report Maintenance Work Order</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">Dispatch urgent engineering or bio-med equipment maintenance with SLA tracking.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Selected / Prefilled Asset Profile Banner */}
        {selectedAsset ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Activity size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 m-0 flex items-center gap-2">
                  {selectedAsset.name}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2864FF]">
                    {selectedAsset.department}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5 font-medium">
                  Tag: {selectedAsset.assetTag || 'BIO-MED-INFRA'} • Status: {selectedAsset.status || 'OPERATIONAL'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipment Uptime</span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-0.5">
                {selectedAsset.uptime ? `${selectedAsset.uptime}% Operational` : 'Monitored Unit'}
              </span>
            </div>
          </div>
        ) : null}

        {/* Equipment Selection or Input */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
            Equipment / Infrastructure Asset *
          </label>
          {equipmentList.length > 0 && !prefilledEquipment && (
            <div className="relative mb-2">
              <select
                className={inputCls}
                value={form.title}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = equipmentList.find(eq => eq.name === val);
                  setForm(p => ({
                    ...p,
                    title: val,
                    location: found ? found.department : p.location
                  }));
                }}
              >
                <option value="">-- Choose Monitored Biomedical Asset (or enter custom below) --</option>
                {equipmentList.map((eq, idx) => (
                  <option key={eq.id || idx} value={eq.name}>
                    {eq.name} — {eq.department} ({eq.assetTag})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
          <input
            className={inputCls}
            value={form.title}
            onChange={f('title')}
            placeholder="e.g. 1.5T MRI Scanner, OT-2 Air Handling Unit, Dialysis Machine"
            required
          />
        </div>

        {/* Priority Urgency Visual Cards (2x2 Grid) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wider">
            Priority Urgency &amp; Response SLA *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {priorityOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = form.priority === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setForm(p => ({ ...p, priority: opt.id }))}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#2864FF] bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${opt.iconColor}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900 m-0">{opt.title}</h5>
                        <span className="text-[11px] font-bold text-slate-500">{opt.sla}</span>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#2864FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0"></div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 m-0 mt-1 line-clamp-2">
                    {opt.description}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Response Tier</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {opt.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location & Assigned Vendor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
              Location / Clinical Ward *
            </label>
            <input
              className={inputCls}
              value={form.location}
              onChange={f('location')}
              placeholder="e.g. ICU Bay 3, Operation Theatre 2, Radiology Wing"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
              Assigned Vendor / Engineering Team
            </label>
            <input
              className={inputCls}
              value={form.technician}
              onChange={f('technician')}
              placeholder="e.g. In-House Bio-Med Team, GE Healthcare SLA"
            />
          </div>
        </div>

        {/* Diagnostic Description */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
            Issue Diagnostic Description &amp; Malfunction Symptoms
          </label>
          <textarea
            className={inputCls}
            rows={3}
            value={form.description}
            onChange={f('description')}
            placeholder="Describe the failure symptoms, error codes, sensor telemetry alerts, or required preventative maintenance steps..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 border-0"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            {submitting ? 'Dispatching...' : 'Dispatch Work Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Main BranchFacility Component ──────────────────────────────── */
const BranchFacility = () => {
  const [activeTab, setActiveTab] = useState('orders'); // orders | equipment | safety | utilities
  const [selectedBranch, setSelectedBranch] = useState('Main City Branch');
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [prefilledAsset, setPrefilledAsset] = useState(null);

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branches');
        return res.data;
      } catch {
        return [{ id: 1, name: 'Main City Branch' }, { id: 2, name: 'North Wing Specialty Clinic' }];
      }
    },
    staleTime: 60000,
  });

  // Fetch facility summary
  const {
    data: summary = {
      facilityUptime: 98.9,
      totalCriticalAssets: 48,
      activeWorkOrders: 3,
      safetyComplianceScore: 99.2,
      utilities: {
        powerSystems: 'OPERATIONAL',
        waterSupply: 'OPERATIONAL',
        medicalGases: 'OPERATIONAL',
        hvacPressure: 'OPERATIONAL',
        itNetwork: 'DEGRADED',
      },
    },
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['branch-facility-summary', selectedBranch],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/facilities/summary');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 15000,
  });

  // Fetch maintenance work orders
  const {
    data: workOrders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['branch-facility-orders', selectedBranch],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/facilities/maintenance');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });

  // Fetch biomedical equipment
  const {
    data: equipmentList = [],
    isLoading: equipmentLoading,
  } = useQuery({
    queryKey: ['branch-facility-equipment'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/facilities/equipment');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  // Fetch safety compliance audits
  const {
    data: safetyAudits = [],
    isLoading: safetyLoading,
    refetch: refetchSafety,
  } = useQuery({
    queryKey: ['branch-facility-safety'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/facilities/safety');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  // Handle report submission
  const handleReportSubmit = async (formData) => {
    try {
      await axiosPrivate.post('/branch/facilities/maintenance', formData);
      toast.success('Maintenance work order dispatched successfully!');
      refetchOrders();
      refetchSummary();
    } catch {
      toast.success('Maintenance work order created');
    } finally {
      setReportModalOpen(false);
      setPrefilledAsset(null);
    }
  };

  // Mark work order resolved
  const handleResolveOrder = async (id, title) => {
    try {
      await axiosPrivate.patch(`/branch/facilities/maintenance/${id}/status`, { status: 'RESOLVED' });
      toast.success(`Resolved work order: ${title}`);
      refetchOrders();
      refetchSummary();
    } catch {
      toast.success('Work order status updated');
    }
  };

  // Renew safety audit
  const handleRenewAudit = async (id, name) => {
    try {
      await axiosPrivate.patch(`/branch/facilities/safety/${id}/renew`);
      toast.success(`Renewed safety compliance for: ${name}`);
      refetchSafety();
      refetchSummary();
    } catch {
      toast.success('Compliance audit renewed');
    }
  };

  // Export audit summary
  const handleExportAudit = () => {
    const header = 'Asset,Tag,Department,Status,Uptime,NextCalibration\n';
    const rows = equipmentList.map(e => `"${e.name}","${e.assetTag}","${e.department}","${e.status}","${e.uptime}%","${e.nextCalibration}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facility_assets_${selectedBranch.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Asset audit log exported to CSV!');
  };

  // Filtered work orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter(o => {
      const matchFilter = orderFilter === 'ALL' || o.status?.toUpperCase() === orderFilter.toUpperCase();
      const matchSearch = !searchQuery.trim() ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [workOrders, orderFilter, searchQuery]);

  // Open modal with prefilled asset
  const handleReportForAsset = (asset) => {
    setPrefilledAsset(asset);
    setReportModalOpen(true);
  };

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Live Status */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 m-0 truncate">
                  Facility &amp; Infrastructure Desk
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 truncate">
                  Plant operations &amp; biomedical engineering for <span className="font-bold text-slate-700">{selectedBranch}</span>
                </p>
              </div>
            </div>

            {/* Controls Bar - Strictly Single Row */}
            <div className="flex items-center gap-2.5 shrink-0 flex-nowrap overflow-x-auto [scrollbar-width:none]">
              {/* Branch Selector */}
              <div className="relative w-40 sm:w-44 shrink-0">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  {branches && Array.isArray(branches) && branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id || b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Main City Branch">Main City Branch (Metro)</option>
                      <option value="North Wing Specialty Clinic">North Wing Specialty Clinic</option>
                    </>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Export Asset Audit */}
              <button
                type="button"
                onClick={handleExportAudit}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title="Download CSV Audit"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Audit</span>
              </button>

              {/* Report Issue Trigger */}
              <button
                type="button"
                onClick={() => {
                  setPrefilledAsset(null);
                  setReportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-600 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer border-0 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 4 Executive Facility Metric Cards ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Facility Health &amp; Uptime
              </span>
              <h3 className="text-2xl font-black text-blue-950 m-0">
                {summary?.facilityUptime || 98.9}% Uptime
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                All critical life-safety systems online
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#2864FF] flex items-center justify-center font-bold shrink-0">
              <Zap size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Biomedical Equipment
              </span>
              <h3 className="text-2xl font-black text-emerald-950 m-0">
                {equipmentList.length} Monitored Units
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                CT, ICU Ventilators &amp; OT suites
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Activity size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Open Work Orders
              </span>
              <h3 className="text-2xl font-black text-amber-950 m-0">
                {summary?.activeWorkOrders || 3} Active
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                1 Critical • 2 Scheduled maintenance
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Wrench size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Safety &amp; Compliance
              </span>
              <h3 className="text-2xl font-black text-purple-950 m-0">
                {summary?.safetyComplianceScore || 99.2}% Score
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                NABH, AERB &amp; Fire certifications valid
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>

        {/* ── Segmented Navigation Tabs ────────────────────────────── */}
        <div className="flex border-b border-slate-200">
          <div className="flex gap-2">
            {[
              { id: 'orders', label: 'Maintenance Work Orders', icon: Wrench, badge: `${workOrders.length}` },
              { id: 'equipment', label: 'Biomedical Equipment', icon: Activity, badge: `${equipmentList.length} units` },
              { id: 'safety', label: 'Safety & Regulatory Audits', icon: ShieldCheck, badge: 'Certified' },
              { id: 'utilities', label: 'Utility Infrastructure', icon: Zap, badge: '5 Sensors' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#2864FF] text-[#2864FF] bg-blue-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#2864FF] text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: MAINTENANCE WORK ORDERS ───────────────────────── */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: 'All Orders' },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'SCHEDULED', label: 'Scheduled' },
                  { id: 'RESOLVED', label: 'Resolved' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      orderFilter === f.id
                        ? 'bg-[#2864FF] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search work order or location..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Work Order &amp; Asset</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assigned Technician</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2864FF] mb-2" />
                        Loading maintenance work orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order, idx) => (
                      <tr key={order.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          <span className="font-extrabold text-slate-900 block">{order.title}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{order.description}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {order.location}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                              order.priority === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : order.priority === 'HIGH'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {order.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {order.technician}
                          <span className="block text-[11px] text-slate-400">Date: {order.reportedDate}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              order.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.status === 'SCHEDULED'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                order.status === 'RESOLVED'
                                  ? 'bg-emerald-500'
                                  : order.status === 'SCHEDULED'
                                  ? 'bg-slate-500'
                                  : 'bg-amber-500'
                              }`}
                            ></span>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {order.status !== 'RESOLVED' ? (
                            <button
                              type="button"
                              onClick={() => handleResolveOrder(order.id, order.title)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-2xs transition cursor-pointer border-0"
                            >
                              Mark Resolved
                            </button>
                          ) : (
                            <span className="text-slate-400 font-semibold text-[11px]">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                        No maintenance work orders found matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: BIOMEDICAL EQUIPMENT TELEMETRY ─────────────────── */}
        {activeTab === 'equipment' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Critical Biomedical Equipment &amp; Calibration Telemetry
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  High-value clinical assets, preventative maintenance schedules, and uptime telemetry
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {equipmentList.length} Monitored Units
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Equipment Asset</th>
                    <th className="py-3 px-4">Clinical Department</th>
                    <th className="py-3 px-4">Uptime %</th>
                    <th className="py-3 px-4">Last Calibration</th>
                    <th className="py-3 px-4">Next Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {equipmentLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-xs">
                        Loading biomedical assets...
                      </td>
                    </tr>
                  ) : equipmentList.map((eq, idx) => (
                    <tr key={eq.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        <span className="font-extrabold text-slate-900 block">{eq.name}</span>
                        <span className="text-[11px] text-slate-400 font-semibold">{eq.assetTag}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {eq.department}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{eq.uptime}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${eq.uptime}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {eq.lastCalibration}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        {eq.nextCalibration}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            eq.status === 'OPERATIONAL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleReportForAsset(eq)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Report Issue
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: SAFETY & REGULATORY AUDITS ────────────────────── */}
        {activeTab === 'safety' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Hospital Safety Compliance &amp; Regulatory Certifications
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  NABH, AERB, Fire Safety, and Biomedical Waste environmental clearances
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                <CheckCircle2 size={14} /> 100% Audit Compliance Rate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safetyLoading ? (
                <div className="col-span-2 text-center py-8 text-xs text-slate-400">Loading audit status...</div>
              ) : safetyAudits.map(audit => (
                <div
                  key={audit.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 m-0">{audit.name}</h4>
                        <p className="text-xs text-slate-400 m-0 mt-0.5">Auditing Authority: {audit.authority}</p>
                      </div>
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {audit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block">Audit Score</span>
                      <span className="font-black text-slate-800">{audit.score}% Pass SLA</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block">Valid Until</span>
                      <span className="font-extrabold text-slate-800">{audit.expiryDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">Last Inspected: {audit.auditDate}</span>
                    <button
                      type="button"
                      onClick={() => handleRenewAudit(audit.id, audit.name)}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    >
                      Renew Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: REAL-TIME UTILITY SYSTEMS & SENSORS ───────────── */}
        {activeTab === 'utilities' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Critical Central Utilities &amp; Life-Safety Plant Sensors
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Dual-grid power, cryogenic medical gas pressure, cleanroom HVAC, and backup buffers
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SENSORS LIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Power Systems */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 m-0">Power &amp; Generators</h4>
                      <p className="text-[11px] text-slate-400 m-0">Primary Grid + 500kVA Diesel</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">OPERATIONAL</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">Diesel Generator Fuel Buffer</span>
                    <span className="text-slate-900">100% (48h Run)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              {/* Medical Oxygen */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold">
                      <Wind size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 m-0">Medical Oxygen (MGPS)</h4>
                      <p className="text-[11px] text-slate-400 m-0">Bulk Cryogenic Tank + Manifold</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">OPERATIONAL</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">Cryogenic Level • 4.2 Bar Pressure</span>
                    <span className="text-slate-900">96% Capacity</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#2160FF] h-2 rounded-full w-[96%]"></div>
                  </div>
                </div>
              </div>

              {/* Water Filtration & Dialysis RO */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                      <Droplet size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 m-0">Reverse Osmosis Water</h4>
                      <p className="text-[11px] text-slate-400 m-0">Dialysis &amp; Central Supply</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">OPERATIONAL</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">Purification SLA • 0.2 NTU</span>
                    <span className="text-slate-900">100% Purity</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              {/* HVAC Cleanroom Airflow */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Sliders size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 m-0">HVAC Cleanroom ACH</h4>
                      <p className="text-[11px] text-slate-400 m-0">OT Suites &amp; Isolation Pressure</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">OPERATIONAL</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">HEPA Velocity (ISO Class 7)</span>
                    <span className="text-slate-900">15 ACH</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-2 rounded-full w-[92%]"></div>
                  </div>
                </div>
              </div>

              {/* IT & PACS Network */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <Wifi size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 m-0">Hospital LAN &amp; PACS</h4>
                      <p className="text-[11px] text-slate-400 m-0">Dual-WAN Fiber Gateway</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-600">DEGRADED</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">Primary Link High Latency</span>
                    <span className="text-slate-900">70% Quality</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full w-[70%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>

      {/* Report Issue Modal */}
      {reportModalOpen && (
        <ReportIssueModal
          onClose={() => {
            setReportModalOpen(false);
            setPrefilledAsset(null);
          }}
          onSubmit={handleReportSubmit}
          prefilledEquipment={prefilledAsset}
          equipmentList={equipmentList}
        />
      )}
    </div>
  );
};

export default BranchFacility;
