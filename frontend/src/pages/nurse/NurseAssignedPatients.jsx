import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
  Activity,
  AlertCircle, 
  AlertTriangle,
  ArrowRight,
  Calendar, 
  CheckCircle2, 
  Clock, 
  Filter, 
  HeartPulse, 
  Info, 
  RefreshCw, 
  Search, 
  Sparkles, 
  Stethoscope, 
  User, 
  UserCheck, 
  UserPlus, 
  Users, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NurseAssignedPatients = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('token-asc');

  // Realtime live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically calculate shift based on current hour
  const currentShift = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 8 && hour < 16) {
      return { name: 'Morning Shift', hours: '08:00 - 16:00', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' };
    } else if (hour >= 16 && hour < 24) {
      return { name: 'Evening Shift', hours: '16:00 - 00:00', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else {
      return { name: 'Night Shift', hours: '00:00 - 08:00', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
  }, [currentTime]);

  // Realtime Query for Assigned OP Patients (polling every 10s)
  const { data: rawPatients = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['nurse-assigned-patients'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/nursing/assignments/op');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000 // Realtime 10-second sync
  });

  // Normalized patient list
  const patients = useMemo(() => {
    return rawPatients.map((p, idx) => {
      const hasVitals = p.lastVitalsSummary && 
        p.lastVitalsSummary !== 'No vitals recorded' && 
        p.lastVitalsSummary.trim() !== '';

      const appointmentTimeFormatted = p.appointmentTime 
        ? new Date(p.appointmentTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        : 'Today';

      return {
        id: p.id || idx + 1,
        patientId: p.patientId || p.id || idx + 1,
        patientName: p.patientName || 'Unknown Patient',
        age: p.age ?? null,
        appointmentReason: p.appointmentReason || 'OP Consultation',
        appointmentTime: appointmentTimeFormatted,
        rawTime: p.appointmentTime,
        attendingDoctorName: p.attendingDoctorName ? p.attendingDoctorName.replace(/^Dr\.\s*/i, '') : 'Attending Physician',
        lastVitalsSummary: p.lastVitalsSummary || 'No vitals recorded',
        hasVitals: hasVitals,
        status: p.status || 'WAITING',
        insuranceStatus: p.insuranceStatus,
        injuryStatus: p.injuryStatus,
        tokenNumber: p.tokenNumber ? parseInt(p.tokenNumber, 10) : idx + 1,
        tokenDisplay: p.tokenNumber ? `#${p.tokenNumber}` : `#T${idx + 1}`
      };
    });
  }, [rawPatients]);

  // Metric counts
  const metrics = useMemo(() => {
    const total = patients.length;
    const pendingVitals = patients.filter(p => !p.hasVitals).length;
    const completedVitals = patients.filter(p => p.hasVitals).length;
    const priority = patients.filter(p => (p.age && p.age >= 60) || p.injuryStatus).length;
    return { total, pendingVitals, completedVitals, priority };
  }, [patients]);

  // Filtered and Sorted patient list
  const filteredPatients = useMemo(() => {
    let list = [...patients];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.patientName.toLowerCase().includes(term) ||
        p.tokenDisplay.toLowerCase().includes(term) ||
        p.attendingDoctorName.toLowerCase().includes(term) ||
        p.appointmentReason.toLowerCase().includes(term)
      );
    }

    // Status / Category filter
    if (activeFilter === 'AWAITING_VITALS') {
      list = list.filter(p => !p.hasVitals);
    } else if (activeFilter === 'VITALS_LOGGED') {
      list = list.filter(p => p.hasVitals);
    } else if (activeFilter === 'PRIORITY') {
      list = list.filter(p => (p.age && p.age >= 60) || p.injuryStatus);
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'token-asc') return a.tokenNumber - b.tokenNumber;
      if (sortBy === 'token-desc') return b.tokenNumber - a.tokenNumber;
      if (sortBy === 'name-asc') return a.patientName.localeCompare(b.patientName);
      return 0;
    });

    return list;
  }, [patients, searchTerm, activeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-4 sm:p-6 md:p-8 pb-28 w-full text-slate-800 space-y-6">
      
      {/* ─── 1. Header Banner & Shift Info ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Assigned Patients Queue
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Patients currently assigned to your shift for triage, vital checks, and clinical notes
            </p>
          </div>
        </div>

        {/* Shift Badge & Live Sync Clock */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 ${currentShift.badgeBg}`}>
            <Calendar className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider block leading-none">
                {currentShift.name}
              </span>
              <span className="text-xs font-black leading-tight">
                {currentShift.hours}
              </span>
            </div>
          </div>

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
            title="Refresh patient queue"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Metric Overview Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Assigned */}
        <div 
          onClick={() => setActiveFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'ALL' 
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200/90 hover:border-blue-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-[11px] font-semibold text-slate-400">In OPD Queue</span>
          </div>
        </div>

        {/* Awaiting Vitals */}
        <div 
          onClick={() => setActiveFilter('AWAITING_VITALS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'AWAITING_VITALS' 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200/90 hover:border-amber-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Awaiting Vitals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{metrics.pendingVitals}</span>
            <span className="text-[11px] font-semibold text-slate-400">Needs Triage</span>
          </div>
        </div>

        {/* Vitals Logged */}
        <div 
          onClick={() => setActiveFilter('VITALS_LOGGED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'VITALS_LOGGED' 
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200/90 hover:border-emerald-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Triaged & Ready</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{metrics.completedVitals}</span>
            <span className="text-[11px] font-semibold text-slate-400">Ready for Doctor</span>
          </div>
        </div>

        {/* Priority / Senior */}
        <div 
          onClick={() => setActiveFilter('PRIORITY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'PRIORITY' 
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20' 
              : 'bg-white border-slate-200/90 hover:border-purple-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Priority & Seniors</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">{metrics.priority}</span>
            <span className="text-[11px] font-semibold text-slate-400">Senior / Acute</span>
          </div>
        </div>

      </div>

      {/* ─── 3. Search, Filter & Controls Bar ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, token #, doctor, or reason..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills & Sort dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: `All (${patients.length})` },
              { id: 'AWAITING_VITALS', label: `Pending (${metrics.pendingVitals})` },
              { id: 'VITALS_LOGGED', label: `Triaged (${metrics.completedVitals})` },
              { id: 'PRIORITY', label: `Priority (${metrics.priority})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
          >
            <option value="token-asc">Sort: Token (Asc)</option>
            <option value="token-desc">Sort: Token (Desc)</option>
            <option value="name-asc">Sort: Name (A-Z)</option>
          </select>

          <button
            onClick={() => navigate('/nurse/walk-in')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Walk-in</span>
          </button>
        </div>

      </div>

      {/* ─── 4. Main Patients List / Cards ─── */}
      <div className="space-y-3.5">
        
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-16 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-sm font-bold text-slate-900">Synchronizing Nursing Queue</h3>
            <p className="text-xs text-slate-400 mt-1">Fetching live assigned OP patients from reception...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>
            
            {searchTerm || activeFilter !== 'ALL' ? (
              <>
                <h3 className="text-base font-black text-slate-900">No matching patients found</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No patients matched your current search query or active filter.
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setActiveFilter('ALL'); }}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-black text-slate-900">No Patients in Assigned Queue</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  There are currently no OP patients queued for vital assessments. New registrations at reception will appear automatically.
                </p>
                <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200 transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Check Queue
                  </button>
                  <button
                    onClick={() => navigate('/nurse/walk-in')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Register Walk-in
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((p, idx) => (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Patient Info Block */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    
                    {/* Token & Avatar */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/70 font-mono font-black text-xs">
                        {p.tokenDisplay}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center border border-slate-200/80">
                        {p.patientName.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Patient Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition truncate">
                          {p.patientName}
                        </h3>
                        
                        {p.age && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {p.age} Yrs
                          </span>
                        )}

                        {p.injuryStatus && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            Injury / Acute
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          p.hasVitals 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                          {p.hasVitals ? 'Triaged' : 'Awaiting Vitals'}
                        </span>
                      </div>

                      {/* Clinical Details Row */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Dr. {p.attendingDoctorName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Reason: <span className="text-slate-700 font-semibold">{p.appointmentReason}</span></span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" /> {p.appointmentTime}
                        </span>
                      </div>

                      {/* Vitals Summary Pill */}
                      <div className="pt-0.5">
                        {p.hasVitals ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/50">
                            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Last Vitals: {p.lastVitalsSummary}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/50">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Vitals not recorded yet for this shift</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2.5 sm:self-end lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => navigate(`/nurse/vitals?patientId=${p.patientId}`)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>{p.hasVitals ? 'Update Vitals' : 'Take Vitals'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/nurse/workspace/${p.patientId}`)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};

export default NurseAssignedPatients;
