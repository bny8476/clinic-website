import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2, 
  ClipboardList, 
  Clock, 
  FileText, 
  HeartPulse, 
  Phone, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Stethoscope, 
  User, 
  UserCheck, 
  UserPlus, 
  Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WalkInCheckIn = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const branchId = 1;

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Form mode: 'new' or 'existing'
  const [patientMode, setPatientMode] = useState('new');
  const [queueSearch, setQueueSearch] = useState('');

  const [walkInForm, setWalkInForm] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: 'General OPD',
    priorityLevel: 0,
    reasonForVisit: ''
  });

  // Realtime Query for Walk-ins (10-second polling)
  const { data: walkIns = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['reception-walk-ins', branchId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/reception/branches/${branchId}/walk-ins`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000 // Realtime 10s auto-sync
  });

  // Register Walk-in Mutation
  const registerWalkIn = useMutation({
    mutationFn: async (data) => {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        department: data.department || 'General OPD',
        priorityLevel: data.priorityLevel || 0,
        reasonForVisit: data.reasonForVisit.trim()
      };

      if (data.patientId && data.patientId.trim() !== '') {
        payload.patient = { id: parseInt(data.patientId.trim(), 10) };
      }
      
      const res = await axiosPrivate.post(`/reception/branches/${branchId}/walk-ins`, payload);
      const walkIn = res.data;

      // Generate queue token for walk-in
      try {
        const deptParam = encodeURIComponent(data.department || 'General OPD');
        const priorityParam = data.priorityLevel || 0;
        const tokenRes = await axiosPrivate.post(
          `/reception/branches/${branchId}/queue/generate?walkInId=${walkIn.id}&department=${deptParam}&priorityLevel=${priorityParam}`
        );
        return { walkIn, token: tokenRes.data };
      } catch (tokErr) {
        return { walkIn, token: { tokenNumber: 'Q-WalkIn' } };
      }
    },
    onSuccess: (data) => {
      toast.success(
        `Walk-In Registered! OP: ${data.walkIn.opNumber || 'Assigned'} | Token #${data.token.tokenNumber || 'Active'}`
      );
      setWalkInForm({
        patientId: '',
        firstName: '',
        lastName: '',
        phone: '',
        department: 'General OPD',
        priorityLevel: 0,
        reasonForVisit: ''
      });
      queryClient.invalidateQueries({ queryKey: ['reception-walk-ins', branchId] });
      queryClient.invalidateQueries({ queryKey: ['reception-queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['nurse-dashboard-walkins'] });
      queryClient.invalidateQueries({ queryKey: ['nurse-dashboard-op-patients'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register walk-in patient');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (patientMode === 'existing' && !walkInForm.patientId) {
      toast.error('Please enter the existing Patient ID');
      return;
    }
    if (patientMode === 'new' && (!walkInForm.firstName || !walkInForm.phone)) {
      toast.error('First Name and Phone are required for new walk-in patients');
      return;
    }
    registerWalkIn.mutate(walkInForm);
  };

  // Filtered walk-ins for the right column list
  const filteredWalkIns = useMemo(() => {
    if (!queueSearch.trim()) return walkIns;
    const term = queueSearch.toLowerCase();
    return walkIns.filter(w => {
      const name = w.patient?.firstName
        ? `${w.patient.firstName} ${w.patient.lastName || ''}`
        : `${w.firstName || ''} ${w.lastName || ''}`;
      return (
        name.toLowerCase().includes(term) ||
        (w.opNumber && w.opNumber.toLowerCase().includes(term)) ||
        (w.phone && w.phone.includes(term)) ||
        (w.department && w.department.toLowerCase().includes(term))
      );
    });
  }, [walkIns, queueSearch]);

  const inputClass = "w-full bg-slate-50/70 text-xs sm:text-sm text-slate-800 font-medium rounded-xl border border-slate-200/90 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none py-2.5 sm:py-3";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 0. Header & Back Bar ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Walk-In Patient Check-In
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Register arrival for walk-in OPD consultations and instantly generate queue tokens
            </p>
          </div>
        </div>

        {/* Live Clock & Sync indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs font-black text-slate-900 font-mono tracking-wide leading-tight">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
          </div>

          <button 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Refresh walk-in queue"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ─── Main Two-Column Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Registration Form (7 cols on lg) ── */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-2xs space-y-6">
          
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">Patient Registration</h2>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setPatientMode('new'); setWalkInForm({ ...walkInForm, patientId: '' }); }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  patientMode === 'new' 
                    ? 'bg-white text-blue-600 shadow-2xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Patient
              </button>
              <button
                type="button"
                onClick={() => setPatientMode('existing')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  patientMode === 'existing' 
                    ? 'bg-white text-blue-600 shadow-2xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Existing Patient ID
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {patientMode === 'existing' ? (
              <div>
                <label className={labelClass}>Patient ID <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="number"
                    value={walkInForm.patientId} 
                    onChange={e => setWalkInForm({ ...walkInForm, patientId: e.target.value })} 
                    placeholder="Enter registered patient ID (e.g. 101)" 
                    className={`${inputClass} pl-10 pr-4`} 
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Existing records and medical history will be auto-linked.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                        type="text"
                        value={walkInForm.firstName} 
                        onChange={e => setWalkInForm({ ...walkInForm, firstName: e.target.value })} 
                        placeholder="First Name" 
                        className={`${inputClass} pl-10 pr-4`} 
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Last Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                        type="text"
                        value={walkInForm.lastName} 
                        onChange={e => setWalkInForm({ ...walkInForm, lastName: e.target.value })} 
                        placeholder="Last Name" 
                        className={`${inputClass} pl-10 pr-4`} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone Number <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="tel"
                      value={walkInForm.phone} 
                      onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })} 
                      placeholder="+91 98765 43210" 
                      className={`${inputClass} pl-10 pr-4`} 
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Department & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Consultation Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={walkInForm.department}
                    onChange={e => setWalkInForm({ ...walkInForm, department: e.target.value })}
                    className={`${inputClass} pl-10 pr-4 cursor-pointer`}
                  >
                    <option value="General OPD">General Medicine / OPD</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Emergency Triage">Emergency Triage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Triage Priority Level</label>
                <div className="relative">
                  <ShieldAlert className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={walkInForm.priorityLevel}
                    onChange={e => setWalkInForm({ ...walkInForm, priorityLevel: parseInt(e.target.value, 10) })}
                    className={`${inputClass} pl-10 pr-4 cursor-pointer`}
                  >
                    <option value={0}>Standard (Routine)</option>
                    <option value={1}>Priority (Senior / Severe)</option>
                    <option value={2}>Immediate (Acute / Critical)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reason for Visit */}
            <div>
              <label className={labelClass}>Chief Complaint / Reason for Visit</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5 pointer-events-none" />
                <textarea 
                  value={walkInForm.reasonForVisit} 
                  onChange={e => setWalkInForm({ ...walkInForm, reasonForVisit: e.target.value })} 
                  placeholder="Describe patient symptoms (e.g. High fever for 2 days, acute throat pain, vitals check)..."
                  rows={3}
                  className={`${inputClass} pl-10 pr-4 resize-none`} 
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={registerWalkIn.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm shadow-blue-500/25 disabled:opacity-50"
              >
                <ClipboardList className="w-4 h-4" />
                {registerWalkIn.isPending ? 'Registering & Generating Token...' : 'Register Walk-In & Issue Token'}
              </button>
            </div>

          </form>

        </div>

        {/* ── RIGHT COLUMN: Today's Waiting Walk-Ins (5 cols on lg) ── */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col min-h-[550px]">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">Waiting Walk-Ins</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
              {walkIns.length} Queued
            </span>
          </div>

          {/* Quick Search within queue */}
          {walkIns.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                placeholder="Search waiting walk-in queue..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          )}

          {/* Queue Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-semibold text-slate-500">Checking waiting walk-in queue...</p>
              </div>
            ) : filteredWalkIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-black text-slate-900">No Waiting Walk-in Patients</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  {queueSearch 
                    ? 'No walk-in patients matched your search query.' 
                    : 'Registered walk-in arrivals will appear here in real time.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWalkIns.map(w => {
                  const patientName = w.patient?.firstName
                    ? `${w.patient.firstName} ${w.patient.lastName || ''}`.trim()
                    : `${w.firstName || ''} ${w.lastName || ''}`.trim() || 'Walk-in Patient';
                  const isPriority = w.priorityLevel && w.priorityLevel > 0;

                  return (
                    <div 
                      key={w.id} 
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {w.opNumber || `ID #${w.id}`}
                            </span>
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate group-hover:text-blue-600 transition">
                              {patientName}
                            </h4>
                          </div>

                          <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>{w.department || 'General OPD'}</span>
                            {w.phone && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{w.phone}</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
                            {w.status || 'WAITING'}
                          </span>
                          {isPriority && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              Priority
                            </span>
                          )}
                        </div>
                      </div>

                      {w.reasonForVisit && (
                        <p className="text-[11px] text-slate-600 font-medium bg-white p-2 rounded-lg border border-slate-100">
                          {w.reasonForVisit}
                        </p>
                      )}

                      {/* Quick action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        {w.patient?.id && (
                          <button
                            onClick={() => navigate(`/nurse/vitals?patientId=${w.patient.id}`)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1"
                          >
                            <HeartPulse className="w-3 h-3" /> Take Vitals
                          </button>
                        )}
                        {w.patient?.id && (
                          <button
                            onClick={() => navigate(`/nurse/workspace/${w.patient.id}`)}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition flex items-center gap-1"
                          >
                            Workspace <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default WalkInCheckIn;
