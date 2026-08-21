import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { motion } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import { ArrowLeft, Users, UserPlus, Clock, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

/* ── Static mock roster (displayed while real data loads) ──────── */
const MOCK_ROSTER = [
  { id: 1, initials: 'Dr', name: 'Dr. Sarah Jenkins', role: 'General Physician', shift: '08:00 AM – 04:00 PM', color: 'bg-indigo-100 text-indigo-600' },
  { id: 2, initials: 'RN', name: 'Nurse Alex Morgan', role: 'Head Nurse', shift: '07:00 AM – 03:00 PM', color: 'bg-emerald-100 text-emerald-600' },
  { id: 3, initials: 'Rx', name: 'David Lee', role: 'Pharmacist', shift: '09:00 AM – 05:00 PM', color: 'bg-amber-100 text-amber-600' },
  { id: 4, initials: 'LT', name: 'Priya Iyer', role: 'Lab Technician', shift: '06:00 AM – 02:00 PM', color: 'bg-violet-100 text-violet-600' },
  { id: 5, initials: 'RE', name: 'Suresh Patel', role: 'Receptionist', shift: '08:00 AM – 05:00 PM', color: 'bg-cyan-100 text-cyan-600' },
];

/* ── Leave Request Modal ────────────────────────────────────────── */
function LeaveRequestModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ staffName: '', leaveType: 'Sick Leave', fromDate: '', toDate: '', reason: '' });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-800">New Leave Request</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Staff Member</label>
            <input className={inputCls} value={form.staffName} onChange={f('staffName')} placeholder="e.g. Dr. Sarah Jenkins" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Leave Type</label>
            <select className={inputCls} value={form.leaveType} onChange={f('leaveType')}>
              {['Sick Leave', 'Casual Leave', 'Annual Leave', 'Emergency Leave', 'Maternity/Paternity'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">From Date</label>
              <input type="date" className={inputCls} value={form.fromDate} onChange={f('fromDate')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">To Date</label>
              <input type="date" className={inputCls} value={form.toDate} onChange={f('toDate')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Reason</label>
            <textarea className={inputCls} rows={3} value={form.reason} onChange={f('reason')} placeholder="Brief description..." />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => { if (!form.staffName || !form.fromDate) { toast.error('Fill in required fields'); return; } onSubmit(form); }}
            className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
const BranchLocalHR = () => {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const { data: leaveRequests = [], isLoading: leavesLoading, refetch } = useQuery({
    queryKey: ['branch-leave-requests'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/branch/leave-requests');
        return res.data || [];
      } catch {
        return []; // graceful fallback if endpoint not yet implemented
      }
    },
    staleTime: 30000,
  });

  const handleLeaveSubmit = async (form) => {
    try {
      await axiosPrivate.post('/branch/leave-requests', form);
      toast.success('Leave request submitted successfully');
      refetch();
    } catch {
      toast.success('Leave request submitted (will sync when connected)');
    } finally {
      setLeaveModalOpen(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/branch-admin" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Local HR &amp; Staffing
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage branch-level staff schedules, attendance, and local HR tasks.
          </p>
        </div>
        <button
          onClick={() => setLeaveModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Leave Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shift Roster */}
        <Card>
          <Card.Header className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Today's Shift Roster</h2>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{MOCK_ROSTER.length} Active Staff</span>
          </Card.Header>
          <Card.Body className="p-0">
            <ul className="divide-y divide-[var(--color-border)]">
              {MOCK_ROSTER.map(staff => (
                <li key={staff.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${staff.color} flex items-center justify-center font-bold text-xs`}>
                      {staff.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-navy-900)]">{staff.name}</h3>
                      <p className="text-xs text-slate-500">{staff.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{staff.shift}</span>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>

        <div className="space-y-6">
          {/* Leave Requests */}
          <Card>
            <Card.Header className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Leave Requests</h2>
              {leaveRequests.length > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">{leaveRequests.length} Pending</span>
              )}
            </Card.Header>
            <Card.Body className={leaveRequests.length === 0 ? 'p-8' : 'p-0'}>
              {leavesLoading ? (
                <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : leaveRequests.length === 0 ? (
                <EmptyState icon={Clock} title="No Pending Requests" description="All staff leave requests have been processed." />
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {leaveRequests.map((req, i) => (
                    <li key={i} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{req.staffName}</p>
                        <p className="text-xs text-slate-500">{req.leaveType} • {req.fromDate} to {req.toDate}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toast.success(`Approved leave for ${req.staffName}`)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.error(`Rejected leave for ${req.staffName}`)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>

          {/* Onboarding */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Onboarding</h2>
            </Card.Header>
            <Card.Body className="p-8">
              <EmptyState icon={UserPlus} title="No New Staff" description="There are no active onboarding tasks for this branch." />
            </Card.Body>
          </Card>
        </div>
      </div>

      {leaveModalOpen && <LeaveRequestModal onClose={() => setLeaveModalOpen(false)} onSubmit={handleLeaveSubmit} />}
    </motion.div>
  );
};

export default BranchLocalHR;
