import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { ArrowLeft, Ticket, Users, RefreshCcw, Printer, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import { Link } from 'react-router-dom';

const TokenGeneration = () => {
  const [issuedToken, setIssuedToken] = useState(null);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const branchId = user?.branchId || 1;

  const fetchWalkIns = async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get(`/reception/branches/${branchId}/walk-ins`);
      setWalkIns(res.data || []);
    } catch (err) {
      toast.error('Failed to load walk-in registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalkIns();
  }, [branchId]);

  const issueToken = async (walkIn) => {
    try {
      setIssuing(true);
      const res = await axiosPrivate.post(`/reception/branches/${branchId}/queue/generate?walkInId=${walkIn.id}`);
      
      const token = {
        tokenNumber: `T-${res.data.tokenNumber}`,
        department: walkIn.reasonForVisit || 'General OPD',
        doctor: walkIn.patient?.firstName 
          ? `${walkIn.patient.firstName} ${walkIn.patient.lastName}` 
          : `${walkIn.firstName} ${walkIn.lastName}`,
        issuedAt: new Date(res.data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setIssuedToken(token);
      toast.success(`Token ${token.tokenNumber} issued successfully`);
      
    } catch (err) {
      toast.error('Failed to issue token');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] p-6 lg:p-10 w-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={staggerChildren}
        className="max-w-[1200px] mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col gap-6">

          
          <div className="flex items-start gap-5">
            <div className="p-4 bg-[#2864FF] rounded-2xl flex-shrink-0 shadow-lg shadow-blue-500/30">
              <Ticket className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="pt-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Issue Queue Token</h1>
              <p className="text-[15px] text-gray-500 font-medium">Generate physical print tokens for walk-in patient consultation and queues.</p>
            </div>
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[600px]">
          
          {/* Left Column: Walk-ins */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Users className="w-6 h-6 text-[#2864FF]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pending Walk-in Registrations</h2>
              </div>
              <button 
                onClick={fetchWalkIns}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#2864FF] bg-white border-2 border-blue-100 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <RefreshCcw className="w-4 h-4" /> Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2864FF]" />
                </div>
              ) : walkIns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <Ticket className="w-10 h-10 text-[#2864FF]" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No Walk-ins</h3>
                  <p className="text-[15px] font-medium text-gray-500 mb-8 z-10">There are no pending walk-in registrations.</p>
                  
                  {/* Paper Plane Decorative SVG */}
                  <div className="relative w-full max-w-sm h-32 flex items-center justify-center pointer-events-none opacity-50">
                    <svg viewBox="0 0 200 100" className="w-full h-full text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
                      <path d="M 10 90 Q 50 90 70 70 T 130 50 Q 150 40 180 30" />
                    </svg>
                    <div className="absolute top-4 right-4 text-blue-200">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {walkIns.map((w) => {
                    const name = w.patient ? `${w.patient.firstName} ${w.patient.lastName}` : `${w.firstName} ${w.lastName}`;
                    return (
                      <div 
                        key={w.id} 
                        className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900 text-[15px]">
                              {name}
                            </h3>
                            <span className="bg-blue-100 text-[#2864FF] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {w.opNumber}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-500 mt-1">
                            {w.reasonForVisit || 'General Consultation'}
                          </p>
                        </div>
                        <button 
                          className="px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-[#2864FF] hover:text-[#2864FF] text-gray-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
                          onClick={() => issueToken(w)}
                          disabled={issuing}
                        >
                          Issue Token
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100 shrink-0">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Printer className="w-6 h-6 text-[#2864FF]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Token Slip Preview</h2>
            </div>
            
            <div className="flex-1 pt-6 flex flex-col">
              {issuedToken ? (
                <motion.div 
                  variants={fadeIn}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="w-full p-8 rounded-2xl border-2 border-dashed border-[#2864FF] bg-blue-50/50 text-center space-y-4">
                    <span className="inline-block bg-[#2864FF] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      Aurelian Health Clinic
                    </span>
                    <h2 className="text-6xl font-black text-slate-900 tracking-tight py-4">
                      {issuedToken.tokenNumber}
                    </h2>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-800">
                        {issuedToken.doctor}
                      </p>
                      <p className="text-sm font-medium text-gray-500">
                        {issuedToken.department}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-blue-200">
                      <p className="text-xs font-semibold text-gray-400">
                        Issued at {issuedToken.issuedAt}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors mt-6"
                  >
                    <Printer className="w-5 h-5" /> Print Slip
                  </button>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <Ticket className="w-10 h-10 text-[#2864FF]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Token Issued</h3>
                  <p className="text-sm font-medium text-gray-500 text-center max-w-[200px] mb-auto">
                    Click 'Issue Token' on any walk-in to generate a slip preview.
                  </p>
                  
                  <button 
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-blue-100 text-[#2864FF] font-bold rounded-xl mt-6 opacity-50 cursor-not-allowed"
                  >
                    <Printer className="w-5 h-5" /> Issue Token
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default TokenGeneration;
