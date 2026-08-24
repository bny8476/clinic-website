import logger from '../../utils/logger';
import useAuthStore from '../../store/authStore';
import PrescriptionDocument from '../../components/doctor/PrescriptionDocument';
import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import { 
  Activity, 
  AlertCircle, 
  Calendar, 
  CalendarDays, 
  CheckCircle, 
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
  Send, 
  ShieldCheck, 
  UserCheck, 
  X 
} from 'lucide-react';
import { motion } from 'framer-motion';

const PatientPrescriptions = () => {
  const { user } = useAuthStore();
  const [viewPrescription, setViewPrescription] = useState(null);
  const [refillModal, setRefillModal] = useState(null);
  const [refillNotes, setRefillNotes] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['patientPrescriptions', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/prescriptions/patient/${user?.id}`);
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
    enabled: !!user?.id
  });

  const { data: refillRequests = [], refetch: refetchRefills } = useQuery({
    queryKey: ['patientRefillRequests', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/prescriptions/refill`);
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
    enabled: !!user?.id
  });

  const requestRefillMutation = useMutation({
    mutationFn: async (payload) => {
      return axiosPrivate.post(`/prescriptions/refill`, payload);
    },
    onSuccess: () => {
      toast.success('Refill request submitted successfully');
      setRefillModal(null);
      setRefillNotes('');
      refetchRefills();
    },
    onError: (error) => {
      logger.error('Failed to request refill', error);
      toast.error('Failed to submit refill request');
    }
  });

  // Filter logic
  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = !searchQuery || 
      (p.doctorName && p.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.items && p.items.some(i => i.medicationName.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;
    if (activeFilter === 'DISPENSED') return p.pharmacyStatus === 'DISPENSED';
    if (activeFilter === 'PENDING') return p.pharmacyStatus !== 'DISPENSED';
    if (activeFilter === 'REFILLABLE') return p.refillsRemaining > 0;
    return true;
  });

  return (
    <motion.div 
      className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 font-sans text-slate-800 max-w-7xl mx-auto space-y-8"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── Page Header ── */}
      <motion.header variants={fadeUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-blue-700 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider">
              Patient Portal
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-semibold">Medical Records</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            My Prescriptions
            <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full border border-blue-100">
              {prescriptions.length} Total
            </span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            View prescriptions sent to you by your doctor, track pharmacy status, and request refills online.
          </p>
        </div>

        {/* Action / Search Pill Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine or doctor..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      </motion.header>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
          {[
            { id: 'ALL', label: 'All Prescriptions' },
            { id: 'DISPENSED', label: 'Dispensed' },
            { id: 'PENDING', label: 'Pending Pharmacy' },
            { id: 'REFILLABLE', label: 'Refill Eligible' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeFilter === tab.id 
                  ? 'bg-white text-blue-600 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Refill Requests Banner (if any pending) ── */}
      {refillRequests && refillRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin-slow" />
            Recent Refill Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {refillRequests.map(req => (
              <div key={req.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Refill for Rx #{req.prescriptionId}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Requested: {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                  req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prescriptions List ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold text-sm shadow-2xs">
          Loading your prescriptions...
        </div>
      ) : filteredPrescriptions.length > 0 ? (
        <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
          {filteredPrescriptions.map((prescription) => (
            <motion.div 
              variants={listStagger} 
              layout 
              key={prescription.id} 
              className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-2xs hover:shadow-xs transition space-y-6"
            >
              {/* Card Top Row: Doctor Info + Pharmacy Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg shadow-2xs">
                    Dr
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      Dr. {prescription.doctorName || 'Medical Officer'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(prescription.createdAt || prescription.prescriptionDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold">Rx #{prescription.id}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 ${
                    prescription.pharmacyStatus === 'DISPENSED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {prescription.pharmacyStatus === 'DISPENSED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Dispensed
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-600" />
                        Pending Pharmacy
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Doctor's Diagnosis & Notes (if available) */}
              {(prescription.diagnosis || prescription.notes || prescription.chiefComplaint) && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-1.5 text-xs text-slate-700">
                  {prescription.diagnosis && (
                    <p className="font-bold text-slate-900">
                      <span className="text-blue-600">Diagnosis:</span> {prescription.diagnosis}
                    </p>
                  )}
                  {prescription.notes && (
                    <p className="font-medium text-slate-600">
                      <span className="font-bold text-slate-800">Doctor's Notes:</span> {prescription.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Medicines List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Prescribed Medications ({prescription.items?.length || 0})
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                  {prescription.items && prescription.items.map((item, iIdx) => (
                    <div 
                      key={item.id || iIdx} 
                      className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                          💊
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-sm font-black text-slate-900">
                            {item.medicationName}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              ({item.type || 'Tablet'}, {item.strength || item.dosage || '500mg'})
                            </span>
                          </h5>
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-700">
                              <Activity className="w-3.5 h-3.5 text-blue-500" />
                              {item.frequency || 'Once Daily'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-700">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              {item.duration || item.durationDays || '7'} Days
                            </span>
                            {item.instructions && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amber-700">
                                  <Info className="w-3.5 h-3.5 text-amber-500" />
                                  {item.instructions}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dispensed quantity progress */}
                      <div className="text-right text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shrink-0">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Qty Dispensed</span>
                        <span className="text-slate-900">
                          {item.dispensedQuantity || (prescription.pharmacyStatus === 'DISPENSED' ? (item.prescribedQuantity || item.durationDays || 30) : 0)} / {item.prescribedQuantity || item.durationDays || 30}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewPrescription(prescription)}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-extrabold transition flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> View Prescription
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const response = await axiosPrivate.get(`/prescriptions/${prescription.id}/pdf`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `prescription_${prescription.id}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (e) {
                        logger.error('Failed to download PDF', e);
                        toast.error('Failed to download PDF. Please try again.');
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>

                {prescription.refillsRemaining > 0 && (
                  <button
                    onClick={() => setRefillModal(prescription)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Request Refill ({prescription.refillsRemaining} left)
                  </button>
                )}
              </div>

            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center shadow-2xs space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            💊
          </div>
          <h3 className="text-lg font-black text-slate-900">No Prescriptions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            You don't have any prescriptions matching your current filter. Prescriptions issued by your doctor during consultations will appear here automatically.
          </p>
        </div>
      )}

      {/* ── Refill Request Modal ── */}
      {refillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden space-y-6 p-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Request Prescription Refill
              </h3>
              <button onClick={() => setRefillModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              You are requesting a refill for the prescription from <strong className="text-slate-900">Dr. {refillModal.doctorName}</strong>. You have <span className="text-blue-600 font-bold">{refillModal.refillsRemaining} refill(s)</span> remaining.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500">
                Notes for Doctor / Pharmacist (Optional)
              </label>
              <textarea 
                value={refillNotes}
                onChange={(e) => setRefillNotes(e.target.value)}
                placeholder="E.g., Please send to my default pharmacy branch"
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setRefillModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
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
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-2"
                disabled={requestRefillMutation.isPending}
              >
                {requestRefillMutation.isPending ? 'Submitting...' : 'Submit Refill Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Prescription Document Modal ── */}
      {viewPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <h3 className="text-lg font-black text-slate-900">Official Prescription View</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button 
                  onClick={() => setViewPrescription(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
