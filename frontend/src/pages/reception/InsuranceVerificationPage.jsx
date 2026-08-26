import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { Shield, User, Search, Info, Plus, ClipboardList, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';

const InsuranceVerificationPage = () => {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState('');
  const [searchedId, setSearchedId] = useState(null);
  const [formData, setFormData] = useState({
    insuranceProvider: '',
    policyNumber: ''
  });
  const [reviewId, setReviewId] = useState(null);
  const [reviewData, setReviewData] = useState({ status: 'VERIFIED', coverageDetails: '' });

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['insuranceVerifications', searchedId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/insurance/patient/${searchedId}`);
      return res.data;
    },
    enabled: !!searchedId
  });

  const requestVerification = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post('/reception/insurance/request', {
        patientId: searchedId,
        ...formData
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Insurance verification requested');
      queryClient.invalidateQueries({ queryKey: ['insuranceVerifications', searchedId] });
      setFormData({ insuranceProvider: '', policyNumber: '' });
    },
    onError: () => toast.error('Failed to request verification')
  });

  const verifyInsurance = useMutation({
    mutationFn: async (verificationId) => {
      const res = await axiosPrivate.put(`/reception/insurance/${verificationId}/verify`, reviewData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Insurance verification updated');
      queryClient.invalidateQueries({ queryKey: ['insuranceVerifications', searchedId] });
      setReviewId(null);
    },
    onError: () => toast.error('Failed to update verification')
  });

  const inputClass = "w-full bg-white text-[15px] text-gray-700 font-medium rounded-xl border border-gray-200 focus:border-[#2864FF] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none py-3.5 px-4";
  const labelClass = "block text-sm font-bold text-slate-800 mb-2";

  return (
    <div className="min-h-full bg-[#F4F7FB] p-6 lg:p-10 w-full font-sans">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-8 lg:p-10">
          {/* Subtle background waves */}
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 pointer-events-none">
            <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,0 C300,120 700,0 1000,120 L1000,120 L0,120 Z" fill="#EBF0FF" />
              <path d="M0,120 C300,50 700,150 1000,50 L1000,120 L0,120 Z" fill="#D6E4FF" opacity="0.6" />
            </svg>
          </div>
          {/* Decorative Dots */}
          <div className="absolute top-10 right-1/4 grid grid-cols-4 gap-2 opacity-20">
            {Array.from({length: 16}).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2864FF]"></div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-5 pt-4">
                <div className="p-4 bg-[#2864FF] rounded-2xl flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <Shield className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div className="pt-1">
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Insurance Verification</h1>
                  <p className="text-[15px] text-gray-500 font-medium">Request and manage insurance coverage verifications for patients.</p>
                </div>
              </div>
            </div>

            {/* 3D Shield & Document Graphic */}
            <div className="hidden sm:flex relative shrink-0 w-32 h-32 items-center justify-center pt-8">
               {/* Background Shield */}
               <div className="absolute w-24 h-28 bg-[#D6E4FF] rounded-[24px] rounded-br-[48px] rounded-bl-[48px] rotate-[15deg] right-2 top-0 flex items-center justify-center shadow-inner opacity-70">
                 <CheckCircle2 className="w-12 h-12 text-white absolute top-8" strokeWidth={3} />
               </div>
               
               {/* Foreground Document */}
               <div className="absolute w-20 h-24 bg-white rounded-xl shadow-xl shadow-blue-500/20 border border-gray-100 flex flex-col p-2 left-0 bottom-0 z-10">
                 <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center self-end -mr-4 -mt-4 shadow-sm border border-gray-100 z-20">
                   <CheckCircle2 className="w-4 h-4 text-[#2864FF]" />
                 </div>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                     <User className="w-3 h-3 text-gray-400" />
                   </div>
                   <div className="flex-1 space-y-1.5">
                     <div className="w-full h-1.5 bg-gray-100 rounded-full"></div>
                     <div className="w-2/3 h-1.5 bg-gray-100 rounded-full"></div>
                   </div>
                 </div>
                 <div className="mt-4 space-y-2">
                   <div className="w-full h-1.5 bg-blue-50 rounded-full"></div>
                   <div className="w-4/5 h-1.5 bg-blue-50 rounded-full"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Patient Lookup Card */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Patient Lookup</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Search by Patient ID</label>
              <p className="text-[13px] text-gray-500 font-medium mb-3">Enter the patient ID to look up insurance information and request verification.</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Patient ID (e.g., P12345)"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className={`${inputClass} pl-12`}
                    onKeyDown={(e) => e.key === 'Enter' && patientId && setSearchedId(patientId)}
                  />
                </div>
                <button 
                  onClick={() => setSearchedId(patientId || null)} 
                  disabled={!patientId}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors disabled:opacity-50"
                >
                  Search <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F4F7FF] rounded-xl border border-blue-100/50">
              <div className="w-6 h-6 bg-[#2864FF] rounded-full flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[14px] font-semibold text-[#2864FF]">Search using the unique Patient ID to proceed with insurance verification.</p>
            </div>
          </div>
        </div>

        {searchedId && (
          <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="space-y-6">
            {/* Request New Verification */}
            <motion.div variants={fadeIn} className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Request New Verification</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={labelClass}>Insurance Provider</label>
                  <input
                    placeholder="e.g. BlueCross, Star Health"
                    value={formData.insuranceProvider}
                    onChange={e => setFormData(f => ({ ...f, insuranceProvider: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Policy Number</label>
                  <input
                    placeholder="e.g. POL-123456"
                    value={formData.policyNumber}
                    onChange={e => setFormData(f => ({ ...f, policyNumber: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  className="flex items-center gap-2 px-8 py-3.5 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors disabled:opacity-50"
                  onClick={() => requestVerification.mutate()}
                  disabled={!formData.insuranceProvider || !formData.policyNumber || requestVerification.isPending}
                >
                  <Shield className="w-5 h-5" />
                  {requestVerification.isPending ? 'Requesting...' : 'Request Verification'}
                </button>
              </div>
            </motion.div>

            {/* Verification History */}
            <motion.div variants={fadeIn} className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Verification History</h2>
              </div>
              
              <div>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2864FF]" />
                  </div>
                ) : verifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Verifications</h3>
                    <p className="text-sm font-semibold text-gray-400">No insurance verifications have been requested for this patient.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifications.map(v => (
                      <div key={v.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#2864FF]">
                              <Shield className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-extrabold text-slate-900 text-[15px]">
                                  {v.insuranceProvider}
                                </h3>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                                  v.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                  v.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {v.status}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-gray-500 mt-1">
                                Policy: {v.policyNumber}
                                {v.coverageDetails && ` • ${v.coverageDetails}`}
                              </p>
                            </div>
                          </div>
                          
                          {v.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-sm rounded-lg transition-colors"
                                onClick={() => {
                                  setReviewId(v.id);
                                  setReviewData({ status: 'VERIFIED', coverageDetails: '' });
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Verify
                              </button>
                              <button
                                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm rounded-lg transition-colors"
                                onClick={() => {
                                  setReviewId(v.id);
                                  setReviewData({ status: 'REJECTED', coverageDetails: '' });
                                }}
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                            </div>
                          )}
                        </div>

                        <AnimatePresence>
                          {reviewId === v.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
                                <h4 className="font-extrabold text-sm text-slate-900 border-b border-gray-100 pb-2">Review Verification</h4>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                  <div className="w-40 shrink-0">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                                    <select
                                      className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-[#2864FF]"
                                      value={reviewData.status}
                                      onChange={e => setReviewData(d => ({ ...d, status: e.target.value }))}
                                    >
                                      <option value="VERIFIED">VERIFIED</option>
                                      <option value="REJECTED">REJECTED</option>
                                    </select>
                                  </div>
                                  <div className="flex-1 w-full">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Coverage Details / Notes</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Coverage: 80%, Max $50,000/year"
                                      value={reviewData.coverageDetails}
                                      onChange={e => setReviewData(d => ({ ...d, coverageDetails: e.target.value }))}
                                      className="w-full bg-gray-50 border border-gray-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-[#2864FF]"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                  <button 
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                    onClick={() => setReviewId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="px-5 py-2.5 bg-[#2864FF] text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    disabled={verifyInsurance.isPending}
                                    onClick={() => verifyInsurance.mutate(v.id)}
                                  >
                                    {verifyInsurance.isPending ? 'Submitting...' : 'Submit Review'}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InsuranceVerificationPage;
