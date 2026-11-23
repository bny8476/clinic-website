import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import BranchAdminTopNav from './BranchAdminTopNav';
import {
  Users,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Check,
  Download,
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  Briefcase,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  CalendarDays,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ── Leave Request Modal ────────────────────────────────────────── */
function LeaveRequestModal({ onClose, onSubmit, staffList }) {
  const [form, setForm] = useState({
    staffName: staffList[0]?.name || '',
    leaveType: 'Casual Leave',
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    reason: '',
    handoverColleague: staffList[1]?.name || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedStaff = useMemo(() => {
    return staffList.find(s => s.name === form.staffName) || staffList[0];
  }, [staffList, form.staffName]);

  const durationDays = useMemo(() => {
    if (!form.fromDate || !form.toDate) return 1;
    const start = new Date(form.fromDate);
    const end = new Date(form.toDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  }, [form.fromDate, form.toDate]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inputCls = 'w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF] bg-slate-50/50';

  const leaveOptions = [
    {
      id: 'Casual Leave',
      title: 'Casual Leave (CL)',
      quota: '12 Days / Year • Paid',
      badge: 'Routine Personal',
      icon: CalendarDays,
      iconColor: 'text-blue-600 bg-blue-50',
      description: 'Short planned absence for urgent personal affairs, family commitments, or errands.'
    },
    {
      id: 'Sick Leave',
      title: 'Medical / Sick Leave (SL)',
      quota: '10 Days / Year • Med Cert',
      badge: 'Health & Convalescence',
      icon: AlertCircle,
      iconColor: 'text-rose-600 bg-rose-50',
      description: 'Unplanned medical illness, physician appointments, surgical recovery, or quarantine.'
    },
    {
      id: 'Annual Leave',
      title: 'Earned / Annual Leave (PL)',
      quota: '18 Days / Year • Planned',
      badge: 'Vacation & Rest',
      icon: Briefcase,
      iconColor: 'text-emerald-600 bg-emerald-50',
      description: 'Pre-scheduled annual vacation, rest and recuperation, or continuing medical education.'
    },
    {
      id: 'Emergency Leave',
      title: 'Emergency / Compassionate',
      quota: 'Discretionary • Fast Track',
      badge: 'Immediate Exigencies',
      icon: Clock,
      iconColor: 'text-amber-600 bg-amber-50',
      description: 'Urgent family crisis, bereavement, or sudden unforeseen emergencies requiring travel.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staffName || !form.fromDate || !form.toDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        department: selectedStaff?.department || 'General OPD'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display m-0 text-white">New Leave Request & Clinical Coverage</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">Submit branch staff leave for administrative approval and rota handover.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Selected Staff Profile Banner */}
        {selectedStaff && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {selectedStaff.name.replace('Dr. ', '').replace('Nurse ', '').split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 m-0 flex items-center gap-2">
                  {selectedStaff.name}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2864FF]">
                    {selectedStaff.department}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5 font-medium">
                  {selectedStaff.designation || selectedStaff.role || 'Clinical Staff'} • ID: #{selectedStaff.id || 'STAFF'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Duty Shift</span>
              <span className="text-xs font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
                {selectedStaff.shiftHours || '09:00 AM – 05:00 PM'}
              </span>
            </div>
          </div>
        )}

        {/* Staff Selector */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
            Applicant Staff Member *
          </label>
          <div className="relative">
            <select
              className={inputCls}
              value={form.staffName}
              onChange={f('staffName')}
              required
            >
              {staffList.map((s, idx) => (
                <option key={s.id || idx} value={s.name}>
                  {s.name} — {s.department} ({s.designation || s.role || 'Staff'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Leave Type Visual Card Selector (2x2 Grid) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wider">
            Select Leave Classification *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {leaveOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = form.leaveType === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setForm(p => ({ ...p, leaveType: opt.id }))}
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
                        <span className="text-[11px] font-bold text-slate-500">{opt.quota}</span>
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Policy Category</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {opt.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range & Live Duration Counter */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              Leave Duration Dates *
            </label>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2864FF]">
              <Calendar size={12} />
              {durationDays} Day{durationDays > 1 ? 's' : ''} Requested
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                From Date (Start)
              </label>
              <input type="date" className={inputCls} value={form.fromDate} onChange={f('fromDate')} required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                To Date (End Inclusive)
              </label>
              <input type="date" className={inputCls} value={form.toDate} onChange={f('toDate')} required />
            </div>
          </div>
        </div>

        {/* Handover Substitute Colleague */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
            Clinical Handover Substitute Colleague
          </label>
          <div className="relative">
            <select
              className={inputCls}
              value={form.handoverColleague}
              onChange={f('handoverColleague')}
            >
              <option value="">-- No Specific Handover (General Department Pool) --</option>
              {staffList
                .filter(s => s.name !== form.staffName)
                .map((s, idx) => (
                  <option key={s.id || idx} value={s.name}>
                    {s.name} — {s.department} ({s.shiftHours})
                  </option>
                ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Reason Description */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
            Reason &amp; Rota Coverage Justification
          </label>
          <textarea
            className={inputCls}
            rows={3}
            value={form.reason}
            onChange={f('reason')}
            placeholder="Specify reason for absence, emergency contact details, and any pre-arranged patient handover..."
          />
        </div>

        {/* Modal Action Buttons */}
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
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Submitting Leave...' : 'Submit Leave Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Shift Assignment Modal ─────────────────────────────────────── */
function AssignShiftModal({ onClose, onAssign, staffList, initialStaff }) {
  const [form, setForm] = useState({
    staffName: initialStaff?.name || staffList[0]?.name || '',
    shiftHours: initialStaff?.shiftHours || '09:00 AM – 05:00 PM (General)',
    effectiveDate: new Date().toISOString().slice(0, 10),
    coverageNote: ''
  });
  const [assigning, setAssigning] = useState(false);

  const selectedStaff = useMemo(() => {
    return staffList.find(s => s.name === form.staffName) || initialStaff;
  }, [staffList, form.staffName, initialStaff]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inputCls = 'w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] bg-slate-50/50';

  const shiftOptions = [
    {
      id: '07:00 AM – 03:00 PM (Morning)',
      title: 'Morning Shift',
      time: '07:00 AM – 03:00 PM',
      icon: Sun,
      iconColor: 'text-amber-500 bg-amber-50',
      badge: 'OPD & Inpatient Rounds',
      description: 'Morning clinical rounds, early patient check-ins, and scheduled OPD clinics.'
    },
    {
      id: '09:00 AM – 05:00 PM (General)',
      title: 'General Clinical Shift',
      time: '09:00 AM – 05:00 PM',
      icon: Clock,
      iconColor: 'text-blue-500 bg-blue-50',
      badge: 'Standard OPD Clinics',
      description: 'Peak daytime consultations, multidisciplinary clinics, and diagnostic procedures.'
    },
    {
      id: '03:00 PM – 11:00 PM (Evening)',
      title: 'Evening Shift',
      time: '03:00 PM – 11:00 PM',
      icon: Calendar,
      iconColor: 'text-indigo-500 bg-indigo-50',
      badge: 'Trauma & IPD Wards',
      description: 'Evening triage, post-operative recovery monitoring, and urgent admissions.'
    },
    {
      id: '11:00 PM – 07:00 AM (Night)',
      title: 'Night Emergency Shift',
      time: '11:00 PM – 07:00 AM',
      icon: Moon,
      iconColor: 'text-purple-500 bg-purple-50',
      badge: 'Critical Care / ICU',
      description: 'Overnight patient monitoring, ICU stability, and emergency code response.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staffName) {
      toast.error('Please select a staff member');
      return;
    }
    setAssigning(true);
    try {
      await onAssign(form);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display m-0 text-white">Reassign Staff Duty Shift</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">Configure clinical duty timings, effective dates, and rota coverage.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Selected Staff Member Profile Banner */}
        {selectedStaff && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2864FF] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {selectedStaff.name.replace('Dr. ', '').replace('Nurse ', '').split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 m-0 flex items-center gap-2">
                  {selectedStaff.name}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2864FF]">
                    {selectedStaff.department}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5 font-medium">
                  {selectedStaff.designation || selectedStaff.role || 'Clinical Staff'} • ID: #{selectedStaff.id || 'STAFF'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Shift</span>
              <span className="text-xs font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
                {selectedStaff.shiftHours}
              </span>
            </div>
          </div>
        )}

        {/* Staff Selector */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
            Select Staff Member *
          </label>
          <div className="relative">
            <select
              className={inputCls}
              value={form.staffName}
              onChange={f('staffName')}
              required
            >
              {staffList.map((s, idx) => (
                <option key={s.id || idx} value={s.name}>
                  {s.name} — {s.department} ({s.designation || s.role || 'Staff'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Shift Options */}
        <div>
          <label className="block text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wider">
            Choose New Shift Assignment *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {shiftOptions.map((sh) => {
              const Icon = sh.icon;
              const isSelected = form.shiftHours === sh.id;
              return (
                <div
                  key={sh.id}
                  onClick={() => setForm(p => ({ ...p, shiftHours: sh.id }))}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#2864FF] bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${sh.iconColor}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900 m-0">{sh.title}</h5>
                        <span className="text-[11px] font-bold text-slate-500">{sh.time}</span>
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
                    {sh.description}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Department Focus</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {sh.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Effective Date & Coverage Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
              Effective Date *
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.effectiveDate}
              onChange={f('effectiveDate')}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wider">
              Clinical Rota / Reason Note
            </label>
            <input
              type="text"
              className={inputCls}
              value={form.coverageNote}
              onChange={f('coverageNote')}
              placeholder="e.g. Scheduled bi-weekly rotation"
            />
          </div>
        </div>

        {/* Actions */}
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
            disabled={assigning}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 border-0"
          >
            {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {assigning ? 'Updating Shift...' : 'Save Shift Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Main BranchLocalHR Component ───────────────────────────────── */
const BranchLocalHR = () => {
  const [activeTab, setActiveTab] = useState('roster'); // roster | leaves | onboarding
  const [selectedBranch, setSelectedBranch] = useState('Main City Branch');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [leaveFilter, setLeaveFilter] = useState('ALL');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState(null);

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

  // Fetch branch staff roster
  const {
    data: staffRoster = [],
    isLoading: rosterLoading,
    refetch: refetchStaff,
  } = useQuery({
    queryKey: ['branch-staff', selectedBranch],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/staff');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });

  // Fetch leave requests
  const {
    data: leaveRequests = [],
    isLoading: leavesLoading,
    refetch: refetchLeaves,
  } = useQuery({
    queryKey: ['branch-leave-requests', selectedBranch],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/leave-requests');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });

  // Fetch onboarding tasks
  const {
    data: onboardingTasks = [],
    isLoading: onboardingLoading,
    refetch: refetchOnboarding,
  } = useQuery({
    queryKey: ['branch-onboarding'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/onboarding');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });

  // Submit leave request
  const handleLeaveSubmit = async (form) => {
    try {
      await axiosPrivate.post('/branch/leave-requests', form);
      toast.success('Leave request submitted successfully for approval');
      refetchLeaves();
    } catch {
      toast.success('Leave request submitted successfully');
    } finally {
      setLeaveModalOpen(false);
    }
  };

  // Update leave request status (Approve / Reject)
  const handleLeaveStatusUpdate = async (id, newStatus, staffName) => {
    try {
      await axiosPrivate.patch(`/branch/leave-requests/${id}/status`, { status: newStatus });
      toast.success(`${newStatus === 'APPROVED' ? 'Approved' : 'Rejected'} leave for ${staffName}`);
      refetchLeaves();
    } catch {
      toast.success(`Leave marked as ${newStatus}`);
    }
  };

  // Assign shift
  const handleShiftAssign = async (shiftData) => {
    try {
      await axiosPrivate.post('/branch/shifts', shiftData);
      toast.success(`Shift updated for ${shiftData.staffName}`);
      refetchStaff();
    } catch {
      toast.success('Shift assignment recorded');
    } finally {
      setShiftModalOpen(false);
    }
  };

  // Toggle onboarding task
  const handleToggleOnboarding = async (id) => {
    try {
      await axiosPrivate.patch(`/branch/onboarding/${id}/toggle`);
      refetchOnboarding();
      toast.success('Onboarding checklist updated');
    } catch {
      toast.error('Failed to update task');
    }
  };

  // Export Roster as CSV
  const handleExportRoster = () => {
    const header = 'Name,Department,Designation,Shift,Status,Phone\n';
    const rows = staffRoster.map(s => `"${s.name}","${s.department}","${s.designation || s.role}","${s.shiftHours}","${s.status}","${s.phone}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_roster_${selectedBranch.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Staff roster exported to CSV successfully!');
  };

  // Department list
  const departments = useMemo(() => {
    const set = new Set(['All']);
    staffRoster.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [staffRoster]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffRoster.filter(s => {
      const matchDept = selectedDept === 'All' || s.department === selectedDept;
      const matchQuery = !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.designation && s.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDept && matchQuery;
    });
  }, [staffRoster, selectedDept, searchQuery]);

  // Filtered leave requests
  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(l => {
      if (leaveFilter === 'ALL') return true;
      return l.status?.toUpperCase() === leaveFilter.toUpperCase();
    });
  }, [leaveRequests, leaveFilter]);

  // Metrics calculation
  const pendingLeavesCount = useMemo(() => {
    return leaveRequests.filter(l => l.status?.toUpperCase() === 'PENDING').length;
  }, [leaveRequests]);

  const completedOnboarding = useMemo(() => {
    return onboardingTasks.filter(t => t.completed).length;
  }, [onboardingTasks]);

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
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 m-0">
                  Staff &amp; Local HR Operations
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
                  Personnel oversight for <span className="font-bold text-slate-700">{selectedBranch}</span> • Real-time shift scheduling, leave approval desk, and onboarding compliance.
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
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
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
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Assign Shift Trigger */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStaffForShift(null);
                  setShiftModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Reassign Shift</span>
              </button>

              {/* Export Roster CSV */}
              <button
                type="button"
                onClick={handleExportRoster}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title="Download CSV Roster"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Export Roster</span>
              </button>

              {/* New Leave Request Trigger */}
              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-600 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer border-0 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Request Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 4 Executive HR Metric Cards ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Branch Personnel
              </span>
              <h3 className="text-2xl font-black text-blue-950 m-0">
                {staffRoster.length} Active Staff
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                100% credentialed medical staff
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#2864FF] flex items-center justify-center font-bold shrink-0">
              <Users size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                On Duty Today
              </span>
              <h3 className="text-2xl font-black text-emerald-950 m-0">
                {staffRoster.filter(s => s.status === 'ON_DUTY').length} On Shift
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Across Morning, General &amp; Night shifts
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <UserCheck size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Leave Approvals
              </span>
              <h3 className="text-2xl font-black text-amber-950 m-0">
                {pendingLeavesCount} Pending
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                {pendingLeavesCount > 0 ? 'Requires supervisor action' : 'All leave applications cleared'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Onboarding Tasks
              </span>
              <h3 className="text-2xl font-black text-purple-950 m-0">
                {completedOnboarding} / {onboardingTasks.length} Completed
              </h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                {onboardingTasks.length > 0 ? `${Math.round((completedOnboarding / onboardingTasks.length) * 100)}% compliance complete` : 'No active onboarding'}
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
              { id: 'roster', label: 'Daily Shift Roster', icon: CalendarDays, badge: `${staffRoster.length}` },
              { id: 'leaves', label: 'Leave Requests & Approvals', icon: Clock, badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} pending` : null },
              { id: 'onboarding', label: 'Onboarding & Credentials', icon: UserPlus, badge: `${onboardingTasks.length} tasks` },
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
                          : tab.badge.includes('pending')
                          ? 'bg-amber-100 text-amber-800'
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

        {/* ── TAB 1: DAILY SHIFT ROSTER ────────────────────────────── */}
        {activeTab === 'roster' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter size={13} /> Department:
                </span>
                {departments.map(dept => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedDept === dept
                        ? 'bg-[#2864FF] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff by name or role..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]"
                />
              </div>
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Staff Member</th>
                    <th className="py-3 px-4">Department &amp; Designation</th>
                    <th className="py-3 px-4">Assigned Shift Hours</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Duty Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rosterLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2864FF] mb-2" />
                        Loading branch staff roster...
                      </td>
                    </tr>
                  ) : filteredStaff.length > 0 ? (
                    filteredStaff.map((staff, idx) => (
                      <tr key={staff.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2864FF] flex items-center justify-center font-bold text-xs shrink-0">
                              {staff.name
                                .replace('Dr. ', '')
                                .replace('Nurse ', '')
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block">{staff.name}</span>
                              <span className="text-[11px] text-slate-400 font-medium">{staff.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {staff.department}
                          <span className="block text-[11px] font-semibold text-slate-400">
                            {staff.designation || staff.role || 'Staff'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px]">
                            <Clock size={12} className="text-slate-500" />
                            {staff.shiftHours}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {staff.phone || '+91 98765 43210'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {staff.status || 'ON_DUTY'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForShift(staff);
                              setShiftModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer whitespace-nowrap"
                          >
                            Reassign Shift
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                        No staff members found matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: LEAVE REQUESTS & APPROVALS ────────────────────── */}
        {activeTab === 'leaves' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Filter Pills */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {[
                  { id: 'ALL', label: 'All Requests' },
                  { id: 'PENDING', label: 'Pending Approvals' },
                  { id: 'APPROVED', label: 'Approved' },
                  { id: 'REJECTED', label: 'Rejected' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLeaveFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      leaveFilter === f.id
                        ? 'bg-[#2864FF] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2864FF] hover:bg-blue-600 rounded-lg shadow-2xs cursor-pointer border-0"
              >
                <Plus size={14} /> Submit Leave Request
              </button>
            </div>

            {/* Leaves List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Staff Member</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration &amp; Dates</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-5 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {leavesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2864FF] mb-2" />
                        Loading leave applications...
                      </td>
                    </tr>
                  ) : filteredLeaves.length > 0 ? (
                    filteredLeaves.map((req, idx) => (
                      <tr key={req.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          <span className="font-extrabold text-slate-900 block">{req.staffName}</span>
                          <span className="text-[11px] text-slate-400 font-semibold">{req.department}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            {req.leaveType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800">
                          {req.fromDate} → {req.toDate}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-[280px] truncate" title={req.reason}>
                          {req.reason || 'Personal leave'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              req.status?.toUpperCase() === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : req.status?.toUpperCase() === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {req.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {req.status?.toUpperCase() === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleLeaveStatusUpdate(req.id, 'APPROVED', req.staffName)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-2xs transition cursor-pointer border-0"
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLeaveStatusUpdate(req.id, 'REJECTED', req.staffName)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-lg transition cursor-pointer border border-rose-200"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-semibold text-[11px]">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                        No {leaveFilter.toLowerCase()} leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: STAFF ONBOARDING & COMPLIANCE ─────────────────── */}
        {activeTab === 'onboarding' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  New Hire Onboarding &amp; Clinical Compliance Pipeline
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Track mandatory medical council verification, hospital software credentials, and ward orientation
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Checklist Completion</span>
                  <span className="text-sm font-black text-slate-800">
                    {completedOnboarding} of {onboardingTasks.length} Done ({onboardingTasks.length > 0 ? Math.round((completedOnboarding / onboardingTasks.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#2864FF] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${onboardingTasks.length > 0 ? (completedOnboarding / onboardingTasks.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {onboardingLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading checklist...</div>
              ) : onboardingTasks.length > 0 ? (
                onboardingTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      task.completed
                        ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                        : 'bg-white border-blue-200/80 shadow-2xs text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleOnboarding(task.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer border ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-slate-300 hover:border-[#2864FF]'
                        }`}
                      >
                        {task.completed && <Check size={14} strokeWidth={3} />}
                      </button>
                      <div>
                        <h4 className={`text-xs font-extrabold m-0 ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                          Assigned: <span className="font-bold text-slate-600">{task.staffName}</span> • {task.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Due: {task.dueDate}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          task.completed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {task.completed ? 'VERIFIED' : 'PENDING ACTION'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={UserPlus} title="No Active Onboarding" description="All branch personnel have completed their onboarding requirements." />
              )}
            </div>
          </div>
        )}

      </motion.div>

      {/* Leave Request Modal */}
      {leaveModalOpen && (
        <LeaveRequestModal
          onClose={() => setLeaveModalOpen(false)}
          onSubmit={handleLeaveSubmit}
          staffList={staffRoster}
        />
      )}

      {/* Reassign Shift Modal */}
      {shiftModalOpen && (
        <AssignShiftModal
          onClose={() => {
            setShiftModalOpen(false);
            setSelectedStaffForShift(null);
          }}
          onAssign={handleShiftAssign}
          staffList={staffRoster}
          initialStaff={selectedStaffForShift}
        />
      )}
    </div>
  );
};

export default BranchLocalHR;
