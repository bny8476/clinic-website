import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Phone, User, FileText, Users, UserPlus, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { Link } from 'react-router-dom';

const WalkInCheckIn = () => {
  const queryClient = useQueryClient();
  const branchId = 1;

  const [walkInForm, setWalkInForm] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    phone: '',
    reasonForVisit: ''
  });

  const { data: walkIns = [], isLoading } = useQuery({
    queryKey: ['reception-walk-ins', branchId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/branches/${branchId}/walk-ins`);
      return res.data;
    },
    refetchInterval: 15000
  });

  const registerWalkIn = useMutation({
    mutationFn: async (data) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        reasonForVisit: data.reasonForVisit
      };
      if (data.patientId) {
        payload.patient = { id: parseInt(data.patientId) };
      }
      
      const res = await axiosPrivate.post(`/reception/branches/${branchId}/walk-ins`, payload);
      const walkIn = res.data;
      const tokenRes = await axiosPrivate.post(`/reception/branches/${branchId}/queue/generate?walkInId=${walkIn.id}`);
      return { walkIn, token: tokenRes.data };
    },
    onSuccess: (data) => {
      toast.success(`OP Registered! OP No: ${data.walkIn.opNumber} | Token No: ${data.token.tokenNumber}`);
      setWalkInForm({ patientId: '', firstName: '', lastName: '', phone: '', reasonForVisit: '' });
      queryClient.invalidateQueries({ queryKey: ['reception-walk-ins', branchId] });
      queryClient.invalidateQueries({ queryKey: ['reception-queue', branchId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register walk-in');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!walkInForm.patientId && (!walkInForm.firstName || !walkInForm.phone)) {
      toast.error('First Name and Phone are required for unregistered patients');
      return;
    }
    registerWalkIn.mutate(walkInForm);
  };

  const inputClass = "w-full bg-white text-[15px] text-gray-700 font-medium rounded-xl border border-gray-200 focus:border-[#2864FF] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none py-3.5";
  const labelClass = "block text-sm font-bold text-slate-800 mb-2";

  return (
    <div className="min-h-full bg-[#F8FAFF] p-6 lg:p-10 w-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeIn}
        className="max-w-[1200px] mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col gap-6">

          
          <div className="flex items-start gap-5">
            <div className="p-4 bg-[#EBF0FF] rounded-2xl flex-shrink-0">
              <Clock className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
            </div>
            <div className="pt-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Walk-In Check-In</h1>
              <p className="text-[15px] text-gray-500 font-medium">Register arrival for existing or quick walk-in patients and generate queue tokens.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Form */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
              <UserPlus className="w-6 h-6 text-[#2864FF]" />
              <h2 className="text-xl font-bold text-slate-900">New Walk-In Registration</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                
                <motion.div variants={fadeIn}>
                  <label className={labelClass}>Existing Patient ID (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      type="text"
                      value={walkInForm.patientId} 
                      onChange={e => setWalkInForm({ ...walkInForm, patientId: e.target.value })} 
                      placeholder="e.g. 12" 
                      className={`${inputClass} pl-12 pr-4`} 
                    />
                  </div>
                </motion.div>

                {!walkInForm.patientId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={fadeIn}>
                      <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                          type="text"
                          value={walkInForm.firstName} 
                          onChange={e => setWalkInForm({ ...walkInForm, firstName: e.target.value })} 
                          placeholder="First Name" 
                          className={`${inputClass} pl-12 pr-4`} 
                          required
                        />
                      </div>
                    </motion.div>
                    
                    <motion.div variants={fadeIn}>
                      <label className={labelClass}>Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                          type="text"
                          value={walkInForm.lastName} 
                          onChange={e => setWalkInForm({ ...walkInForm, lastName: e.target.value })} 
                          placeholder="Last Name" 
                          className={`${inputClass} pl-12 pr-4`} 
                        />
                      </div>
                    </motion.div>
                    
                    <motion.div variants={fadeIn} className="md:col-span-2">
                      <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                          type="tel"
                          value={walkInForm.phone} 
                          onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })} 
                          placeholder="Phone Number" 
                          className={`${inputClass} pl-12 pr-4`} 
                          required
                        />
                      </div>
                    </motion.div>
                  </div>
                )}

                <motion.div variants={fadeIn}>
                  <label className={labelClass}>Reason for Visit</label>
                  <div className="relative">
                    <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <textarea 
                      value={walkInForm.reasonForVisit} 
                      onChange={e => setWalkInForm({ ...walkInForm, reasonForVisit: e.target.value })} 
                      placeholder="Brief reason for visit"
                      className={`${inputClass} pl-12 pr-4 min-h-[100px] resize-y`} 
                    />
                  </div>
                </motion.div>
              </motion.div>

              <div className="pt-6 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={registerWalkIn.isPending}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-[#2864FF] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  <ClipboardList className="w-5 h-5" />
                  {registerWalkIn.isPending ? 'Registering...' : 'Register OP & Generate Token'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Queue list */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#2864FF]" />
                <h2 className="text-xl font-bold text-slate-900">Today's Walk-Ins (Waiting)</h2>
              </div>
              <div className="bg-blue-50 text-[#2864FF] font-bold px-3 py-1 rounded-full text-sm">
                {walkIns.length}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-500">Loading...</div>
              ) : walkIns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-12">
                  <div className="w-40 h-40 bg-[#F4F7FF] rounded-full flex items-center justify-center mb-6 relative">
                     <div className="absolute inset-0 bg-[#EBF0FF] rounded-full animate-ping opacity-20"></div>
                     {/* Couch SVG */}
                     <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#2864FF] z-10" style={{ filter: 'drop-shadow(0px 8px 8px rgba(40, 100, 255, 0.2))' }}>
                        <rect x="20" y="45" width="60" height="20" rx="4" fill="#A0C0FF" />
                        <rect x="15" y="55" width="70" height="15" rx="3" fill="#608FFF" />
                        <rect x="25" y="35" width="50" height="15" rx="3" fill="#A0C0FF" />
                        <path d="M 22 70 L 22 80 M 78 70 L 78 80" stroke="#2864FF" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 25 35 V 45 M 50 35 V 45 M 75 35 V 45" stroke="#F4F7FF" strokeWidth="2" />
                        <path d="M 20 45 L 80 45" stroke="#F4F7FF" strokeWidth="2" />
                     </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No waiting walk-in patients.</h3>
                  <p className="text-[15px] font-medium text-gray-500">Newly registered walk-ins will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto pr-2 -mr-2">
                  {walkIns.map(w => (
                    <li key={w.id} className="py-4 first:pt-0 hover:bg-gray-50 rounded-xl px-2 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-[15px]">
                            {w.patient ? w.patient.name : `${w.firstName} ${w.lastName || ''}`}
                          </p>
                          <p className="text-sm font-medium text-gray-500 mt-1">
                            OP: {w.opNumber} {w.phone ? `• ${w.phone}` : ''}
                          </p>
                        </div>
                        <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full border border-amber-100">
                          {w.status}
                        </span>
                      </div>
                      {w.reasonForVisit && (
                        <p className="text-sm font-medium text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {w.reasonForVisit}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalkInCheckIn;
