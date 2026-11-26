import React, { useState, useMemo } from 'react';
import logger from '../../utils/logger';
import useAuthStore from '../../store/authStore';
import PrescriptionDocument from '../../components/doctor/PrescriptionDocument';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fadeUp, listStagger, pageTransition } from '../../components/ui/motion';
import { 
  Activity, 
  AlertCircle, 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Download, 
  Eye, 
  FileText, 
  Filter, 
  Info, 
  Pill, 
  Printer, 
  RefreshCw, 
  Search, 
  RotateCw,
  ShoppingBag,
  CalendarPlus,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
  Layers,
  Check
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PatientMedicineRecommendations from '../../components/patient/PatientMedicineRecommendations';

const PatientPrescriptions = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewPrescription, setViewPrescription] = useState(null);
  const [refillModal, setRefillModal] = useState(null);
  const [refillNotes, setRefillNotes] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [isDownloadingPdfId, setIsDownloadingPdfId] = useState(null);

  // Real prescriptions query
  const { data: rawPrescriptions = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['patientPrescriptions', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/prescriptions/patient/${user?.id}`);
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch (err) {
        console.warn('Failed to fetch prescriptions', err);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const prescriptions = useMemo(() => Array.isArray(rawPrescriptions) ? rawPrescriptions : [], [rawPrescriptions]);

  // Refill requests query
  const { data: rawRefills = [], refetch: refetchRefills } = useQuery({
    queryKey: ['patientRefillRequests', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/prescriptions/refill`);
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const refillRequests = useMemo(() => Array.isArray(rawRefills) ? rawRefills : [], [rawRefills]);

  const requestRefillMutation = useMutation({
    mutationFn: async (payload) => {
      return axiosPrivate.post(`/prescriptions/refill`, payload);
    },
    onSuccess: () => {
      toast.success('Refill request submitted successfully');
      setRefillModal(null);
      setRefillNotes('');
      refetchRefills();
      queryClient.invalidateQueries({ queryKey: ['patientPrescriptions', user?.id] });
    },
    onError: (error) => {
      logger.error('Failed to request refill', error);
      toast.error('Failed to submit refill request');
    }
  });

  // Calculate statistics
  const totalMedsCount = useMemo(() => {
    return prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);
  }, [prescriptions]);

  const dispensedCount = useMemo(() => {
    return prescriptions.filter(p => p.pharmacyStatus === 'DISPENSED').length;
  }, [prescriptions]);

  const pendingCount = useMemo(() => {
    return prescriptions.filter(p => p.pharmacyStatus !== 'DISPENSED').length;
  }, [prescriptions]);

  const refillableCount = useMemo(() => {
    return prescriptions.filter(p => (p.refillsRemaining || 0) > 0).length;
  }, [prescriptions]);

  // Filter & Search Logic
  const filteredPrescriptions = useMemo(() => {
    let list = prescriptions.filter(p => {
      // Filter tab
      if (activeFilter === 'DISPENSED' && p.pharmacyStatus !== 'DISPENSED') return false;
      if (activeFilter === 'PENDING' && p.pharmacyStatus === 'DISPENSED') return false;
      if (activeFilter === 'REFILLABLE' && !(p.refillsRemaining > 0)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const docName = (p.doctorName || '').toLowerCase();
        const diag = (p.diagnosis || '').toLowerCase();
        const rxId = String(p.id || '').toLowerCase();
        const matchesMed = (p.items || []).some(item => 
          (item.medicationName || '').toLowerCase().includes(q) ||
          (item.instructions || '').toLowerCase().includes(q)
        );

        if (!docName.includes(q) && !diag.includes(q) && !rxId.includes(q) && !matchesMed) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.prescriptionDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.prescriptionDate || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [prescriptions, activeFilter, searchQuery, sortOrder]);

  const handleDownloadPdf = async (prescriptionId) => {
    try {
      setIsDownloadingPdfId(prescriptionId);
      const response = await axiosPrivate.get(`/prescriptions/${prescriptionId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Prescription_${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Prescription PDF downloaded');
    } catch (e) {
      logger.error('Failed to download PDF', e);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPdfId(null);
    }
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top Header Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                <Pill className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    My Prescriptions & Medications
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3" /> E-Prescription Live
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                  Review digital prescriptions issued by your attending physicians, monitor pharmacy fulfillment, reorder medicines, and request refill renewals.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                onClick={() => refetch()}
                title="Sync Prescriptions"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => navigate('/patient/order-medicine')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm shadow-emerald-500/25 cursor-pointer border-none"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Medicines</span>
              </button>

              <button
                onClick={() => navigate('/patient/book')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-blue-600 transition shadow-sm shadow-blue-500/25 cursor-pointer border-none"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Consult Doctor</span>
              </button>
            </div>
          </div>

          {/* ── Top KPI Metrics Strip ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Prescriptions</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{prescriptions.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold shadow-2xs">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">Dispensed by Pharmacy</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{dispensedCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700/80 uppercase tracking-wider">Pending Fulfillment</p>
                <h3 className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200/60 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700/80 uppercase tracking-wider">Active Prescribed Meds</p>
                <h3 className="text-2xl font-black text-[#2160FF] mt-0.5">{totalMedsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200/60 text-[#2160FF] flex items-center justify-center font-bold shadow-2xs">
                <Pill className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Doctor Recommended Medicine Sales Banner ─────────────────────── */}
        <PatientMedicineRecommendations />

        {/* ── Filter Bar, Tabs & Search Controls ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Prescriptions', count: prescriptions.length },
              { id: 'DISPENSED', label: 'Dispensed', count: dispensedCount },
              { id: 'PENDING', label: 'Pending Pharmacy', count: pendingCount },
              { id: 'REFILLABLE', label: 'Refill Eligible', count: refillableCount },
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine, doctor, diagnosis..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition w-56 sm:w-64"
              />
            </div>

            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              aria-label="Sort prescriptions"
              style={{ backgroundImage: 'none' }}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* ── Active Refill Requests Strip (if any) ────────────────────────── */}
        {refillRequests && refillRequests.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#2160FF]" />
              Active Refill Requests ({refillRequests.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {refillRequests.map(req => (
                <div key={req.id} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">Refill for Rx #{req.prescriptionId}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Requested: {req.requestedAt ? format(new Date(req.requestedAt), 'MMM d, yyyy') : 'Recently'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    req.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Prescriptions List / Empty State ─────────────────────────────── */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xs border border-slate-200/80">
            <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading electronic prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          /* Professional Empty State */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-12 sm:p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
              <Pill className="w-9 h-9" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">
              {prescriptions.length === 0 ? 'No prescriptions on file' : 'No matching prescriptions found'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              {prescriptions.length === 0
                ? "You don't have any electronic prescriptions issued yet. When your doctor prescribes medications during consultations, they will appear here automatically."
                : `No prescriptions match your filter "${activeFilter}" or search term. Try resetting your search filters.`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {prescriptions.length > 0 && (
                <button
                  onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }}
                  className="px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer bg-white"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => navigate('/patient/order-medicine')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-xs font-black text-white rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-sm shadow-emerald-500/20 border-none"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse & Order Medicines</span>
              </button>
              <button
                onClick={() => navigate('/patient/book')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <span>Consult a Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="space-y-5">
            <AnimatePresence>
              {filteredPrescriptions.map((prescription) => {
                const isDispensed = prescription.pharmacyStatus === 'DISPENSED';
                const rxDate = prescription.createdAt || prescription.prescriptionDate;
                const formattedDate = rxDate ? format(new Date(rxDate), 'EEEE, MMMM d, yyyy') : 'Recent';

                return (
                  <motion.div
                    key={prescription.id}
                    variants={listStagger}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all p-5 sm:p-7 space-y-5 relative overflow-hidden"
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${
                      isDispensed ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />

                    {/* Top Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-black text-base shadow-2xs shrink-0">
                          Rx
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              Dr. {prescription.doctorName || 'Attending Physician'}
                            </h3>
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              #Rx-{prescription.id}
                            </span>
                            {prescription.refillsRemaining > 0 && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2160FF] border border-blue-200 px-2.5 py-0.5 rounded-full">
                                {prescription.refillsRemaining} Refill(s) Left
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                            {prescription.doctorSpecialty && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-semibold">{prescription.doctorSpecialty}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Pharmacy Status Pill */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 border ${
                          isDispensed 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isDispensed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Dispensed by Pharmacy</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>Pending Fulfillment</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Doctor's Diagnosis & Notes (if any) */}
                    {(prescription.diagnosis || prescription.notes || prescription.chiefComplaint) && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-1.5 text-xs">
                        {prescription.diagnosis && (
                          <p className="text-slate-900 font-bold">
                            <span className="text-[#2160FF] uppercase tracking-wider text-[11px] font-black mr-1">Diagnosis:</span>
                            {prescription.diagnosis}
                          </p>
                        )}
                        {prescription.notes && (
                          <p className="text-slate-600 font-medium leading-relaxed">
                            <span className="text-slate-800 font-bold mr-1">Physician's Instructions:</span>
                            {prescription.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Prescribed Medications Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                          Prescribed Medication Regimen ({prescription.items?.length || 0})
                        </h4>
                        <button
                          onClick={() => navigate('/patient/order-medicine')}
                          className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Order Meds Online</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {prescription.items && prescription.items.map((item, idx) => (
                          <div 
                            key={item.id || idx}
                            className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col justify-between gap-3 transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                                💊
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h5 className="text-sm font-black text-slate-900 truncate">
                                  {item.medicationName}
                                </h5>
                                <p className="text-xs font-semibold text-slate-500">
                                  {item.type || 'Tablet'} • {item.strength || item.dosage || 'Standard Dose'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                                <Activity className="w-3 h-3 text-[#2160FF]" />
                                {item.frequency || 'Daily'}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                                <CalendarDays className="w-3 h-3 text-slate-400" />
                                {item.duration || item.durationDays || '7'} Days
                              </span>
                              {item.instructions && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-700 font-semibold truncate">
                                    {item.instructions}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setViewPrescription(prescription)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#2160FF] bg-blue-50 hover:bg-[#2160FF] hover:text-white border border-blue-200/60 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Official Rx</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(prescription.id)}
                          disabled={isDownloadingPdfId === prescription.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          {isDownloadingPdfId === prescription.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2160FF]" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>Download PDF</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {prescription.refillsRemaining > 0 && (
                          <button
                            onClick={() => setRefillModal(prescription)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-[#2160FF] hover:bg-[#2160FF] hover:text-white border border-blue-200/60 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Request Refill ({prescription.refillsRemaining} left)</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            navigate('/patient/order-medicine', {
                              state: {
                                selectedPrescription: prescription,
                                autoOpenCart: true
                              }
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer border-none"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Order Medicines with this Rx</span>
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* ── Refill Request Modal ─────────────────────────────────────────── */}
      {refillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden space-y-5 p-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#2160FF]" />
                Request Prescription Refill
              </h3>
              <button 
                onClick={() => setRefillModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              You are requesting an authorized medication refill for the prescription issued by{' '}
              <strong className="text-slate-900">Dr. {refillModal.doctorName || 'your physician'}</strong>. You currently have{' '}
              <span className="text-[#2160FF] font-black">{refillModal.refillsRemaining} refill(s)</span> remaining.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500">
                Notes for Doctor & Pharmacist (Optional)
              </label>
              <textarea 
                value={refillNotes}
                onChange={(e) => setRefillNotes(e.target.value)}
                placeholder="E.g., Please deliver to my primary address or home clinic"
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setRefillModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border-none cursor-pointer"
                disabled={requestRefillMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  requestRefillMutation.mutate({
                    prescriptionId: refillModal.id,
                    notes: refillNotes
                  });
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
                disabled={requestRefillMutation.isPending}
              >
                {requestRefillMutation.isPending ? 'Submitting...' : 'Confirm Refill Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Prescription Document Modal ──────────────────────────── */}
      {viewPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div>
                <h3 className="text-lg font-black text-slate-900">Official Clinical Prescription</h3>
                <p className="text-xs text-slate-400 font-medium">Rx #{viewPrescription.id} • Issued by Licensed Medical Practitioner</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigate('/patient/order-medicine', {
                      state: {
                        selectedPrescription: viewPrescription,
                        autoOpenCart: true
                      }
                    });
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-2xs border-none cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> Order Medicines with this Rx
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs border-none cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button 
                  onClick={() => handleDownloadPdf(viewPrescription.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs border-none cursor-pointer"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={() => setViewPrescription(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <PrescriptionDocument data={{
              doctorName: 'Dr. ' + (viewPrescription.doctorName || 'Medical Officer'),
              doctorSpecialty: viewPrescription.doctorSpecialty,
              doctorQualifications: viewPrescription.doctorQualifications,
              registrationNumber: viewPrescription.registrationNumber,
              clinicName: viewPrescription.clinicName,
              clinicAddress: viewPrescription.clinicAddress,
              clinicPhone: viewPrescription.clinicPhone,
              clinicEmail: viewPrescription.clinicEmail,
              patientName: viewPrescription.patientName || user?.name,
              patientAge: viewPrescription.patientAge || 'N/A', 
              patientGender: viewPrescription.patientGender || 'N/A',
              patientId: viewPrescription.patientId || user?.id,
              chiefComplaint: viewPrescription.chiefComplaint,
              diagnosis: viewPrescription.diagnosis,
              items: (viewPrescription.items || []).map(i => ({
                medicationName: i.medicationName,
                type: i.type,
                strength: i.strength,
                dosage: i.dosage,
                frequency: i.frequency,
                duration: i.duration || i.durationDays,
                instructions: i.instructions
              })),
              followUpDate: viewPrescription.followUpDate
            }} />
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default PatientPrescriptions;
