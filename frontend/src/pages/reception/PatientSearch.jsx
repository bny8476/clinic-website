import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import { 
  Search, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Droplet, 
  User, 
  UserCheck, 
  Ticket, 
  Receipt, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  HeartPulse,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { fadeIn, staggerChildren, scaleIn } from '../../components/ui/motion';

const PatientSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, OP, PHONE, NAME
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const { data: searchResults = [], isLoading, isFetching } = useQuery({
    queryKey: ['patient-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) return [];
      const res = await axiosPrivate.get(`/reception/patients/search?query=${encodeURIComponent(debouncedQuery.trim())}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000
  });

  // Client-side quick filter tabs
  const filteredResults = useMemo(() => {
    if (!Array.isArray(searchResults)) return [];
    if (filterType === 'ALL') return searchResults;
    if (filterType === 'OP') {
      return searchResults.filter(p => (p.opNumber || '').toLowerCase().includes(debouncedQuery.toLowerCase()));
    }
    if (filterType === 'PHONE') {
      return searchResults.filter(p => (p.phone || '').includes(debouncedQuery));
    }
    if (filterType === 'NAME') {
      return searchResults.filter(p => 
        (p.name || p.fullName || `${p.firstName} ${p.lastName}`).toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }
    return searchResults;
  }, [searchResults, filterType, debouncedQuery]);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 xl:p-10 w-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={staggerChildren}
        className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8"
      >
        {/* ─── Breadcrumb & Header ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 text-[#2160FF] rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                <Search className="w-5 h-5 text-[#2160FF]" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Patient Search & Registry
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Search and lookup master patient records across departments by UHID, OP Number, Name, or Phone.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              to="/reception/register"
              className="flex items-center gap-2 bg-[#2160FF] text-white hover:bg-blue-700 font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </Link>
            <Link
              to="/reception/walk-in"
              className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 font-bold py-2.5 px-4 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Walk-In Desk</span>
            </Link>
            <Link
              to="/reception/book"
              className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 font-bold py-2.5 px-4 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Appointments</span>
            </Link>
          </div>
        </div>

        {/* ─── Search & Filter Control Bar (Full-Width Card) ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone number, OP number (e.g. OP-2026-0001), or national ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-24 py-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:border-[#2160FF] focus:ring-4 focus:ring-blue-500/10 transition-all text-sm sm:text-base"
              autoFocus
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isFetching ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                  min 2 chars
                </span>
              )}
            </div>
          </div>

          {/* Filter Pills & Stats Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                Filter by:
              </span>
              {[
                { id: 'ALL', label: 'All Fields' },
                { id: 'NAME', label: 'Patient Name' },
                { id: 'OP', label: 'OP Number / UHID' },
                { id: 'PHONE', label: 'Mobile Phone' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-blue-50 text-[#2160FF] border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              {debouncedQuery.length >= 2 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Found <strong className="text-slate-900">{filteredResults.length}</strong> matching record{filteredResults.length !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="text-slate-400">Master database active • Enter keywords to query</span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Search Results Area ─── */}
        <div>
          {/* 1. Prompt / Initial State (< 2 chars) */}
          {debouncedQuery.trim().length < 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Search by Name & Email</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Type first or last name, e.g. <strong className="text-slate-700">"John"</strong> or <strong className="text-slate-700">"Sarah"</strong>, to find registered patient profiles.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Search by OP Number / UHID</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Look up unique hospital registration IDs, e.g. <strong className="text-slate-700">"OP-2026-0001"</strong> or numeric patient identifiers.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Search by Mobile Phone</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Lookup records using partial or full phone numbers, e.g. <strong className="text-slate-700">"555-0199"</strong> or digits directly.
                  </p>
                </div>
              </div>

              {/* Callout to Register New */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">First-time Patient Visit?</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      If the patient is not yet registered in the hospital network, proceed to create their master health record.
                    </p>
                  </div>
                </div>
                <Link
                  to="/reception/register"
                  className="bg-[#2160FF] hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm shadow-blue-500/20 whitespace-nowrap text-center"
                >
                  Register New Patient
                </Link>
              </div>
            </div>
          )}

          {/* 2. Loading State */}
          {isLoading && debouncedQuery.trim().length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-4/5" />
                  </div>
                  <div className="h-8 bg-slate-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          )}

          {/* 3. Empty Search Results */}
          {!isLoading && debouncedQuery.trim().length >= 2 && filteredResults.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-2xs space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">No matching patient records found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  We could not find any registered patient matching <strong className="text-slate-800">"{debouncedQuery}"</strong> in the database.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Clear Search
                </button>
                <Link
                  to="/reception/register"
                  className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm shadow-blue-500/20"
                >
                  Register New Patient
                </Link>
              </div>
            </div>
          )}

          {/* 4. Results Grid (Responsive 1-col mobile, 2-col md, 3-col xl) */}
          {!isLoading && debouncedQuery.trim().length >= 2 && filteredResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {filteredResults.map((patient) => {
                const fullName = patient.name || patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient Client';
                const initial = (patient.firstName?.[0] || fullName?.[0] || 'P').toUpperCase();
                const pId = patient.patientId || patient.id;
                const opNum = patient.opNumber || `ID-${patient.id}`;

                return (
                  <motion.div
                    key={patient.id}
                    variants={fadeIn}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4 group"
                  >
                    {/* Patient Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          {initial}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                            {fullName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                              {opNum}
                            </span>
                            {patient.gender && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                                {patient.gender}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {patient.bloodGroup && (
                        <span className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md">
                          <Droplet className="w-3 h-3 text-rose-500" />
                          {patient.bloodGroup}
                        </span>
                      )}
                    </div>

                    {/* Patient Details Summary */}
                    <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-600">{patient.email}</span>
                        </div>
                      )}
                      {patient.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-500">{patient.address}</span>
                        </div>
                      )}
                      {patient.emergencyContact && (
                        <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50/60 px-2 py-1 rounded-lg border border-amber-100">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Emergency: <strong>{patient.emergencyContact}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Quick Desk Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/reception/book?patientId=${pId}&patientName=${encodeURIComponent(fullName)}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#2160FF] hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-2xs shadow-blue-500/20 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => navigate(`/reception/walk-in?patientId=${pId}&patientName=${encodeURIComponent(fullName)}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-200 transition cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-slate-500" />
                          <span>Check-In</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPatientModal(patient)}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition cursor-pointer"
                          title="View Full Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/reception/insurance?patientId=${pId}`)}
                          className="hover:text-blue-600 hover:underline transition flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verify Insurance
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/reception/billing?patientId=${pId}`)}
                          className="hover:text-blue-600 hover:underline transition flex items-center gap-1 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3 text-indigo-600" /> View Billing
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Patient Quick View Modal ─── */}
        <AnimatePresence>
          {selectedPatientModal && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative z-[9999] bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-sm shadow-blue-500/20">
                      {(selectedPatientModal.firstName?.[0] || selectedPatientModal.name?.[0] || 'P').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">
                        {selectedPatientModal.name || selectedPatientModal.fullName || `${selectedPatientModal.firstName || ''} ${selectedPatientModal.lastName || ''}`.trim()}
                      </h3>
                      <p className="text-xs font-mono font-bold text-blue-700">
                        {selectedPatientModal.opNumber || `ID: ${selectedPatientModal.id}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatientModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Gender</span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{selectedPatientModal.gender || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Blood Group</span>
                      <span className="font-extrabold text-rose-600 text-xs mt-0.5 block">{selectedPatientModal.bloodGroup || 'Not Recorded'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Date of Birth</span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{selectedPatientModal.dateOfBirth || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Branch Code</span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">Branch #{selectedPatientModal.branchId || 1}</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-bold text-slate-800">{selectedPatientModal.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-slate-500">Email:</span>
                      <span className="font-bold text-slate-800 truncate">{selectedPatientModal.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-slate-500">Address:</span>
                      <span className="font-bold text-slate-800 truncate">{selectedPatientModal.address || 'Standard Registered Address'}</span>
                    </div>
                    {selectedPatientModal.emergencyContact && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-amber-700">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Emergency: <strong>{selectedPatientModal.emergencyContact}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientModal(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition text-xs cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pId = selectedPatientModal.patientId || selectedPatientModal.id;
                      const name = selectedPatientModal.name || `${selectedPatientModal.firstName || ''} ${selectedPatientModal.lastName || ''}`;
                      setSelectedPatientModal(null);
                      navigate(`/reception/book?patientId=${pId}&patientName=${encodeURIComponent(name)}`);
                    }}
                    className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar size={14} />
                    <span>Book Appointment</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default PatientSearch;
