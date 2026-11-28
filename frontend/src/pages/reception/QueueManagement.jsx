import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { AlertCircle, ArrowLeft, Clock, Users, UserPlus, Ticket, History, Hourglass, Play, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import { Link } from 'react-router-dom';

const QueueManagement = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const branchId = user?.branchId || 1;

  const { data: queueList = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['queueTokens', branchId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/queue/branch/${branchId}`);
      return res.data;
    },
    refetchInterval: 5000
  });

  const updateStatus = useMutation({
    mutationFn: async ({ tokenId, status }) => {
      const res = await axiosPrivate.put(`/reception/queue/${tokenId}/status?status=${status}`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Queue token updated successfully');
      queryClient.invalidateQueries({ queryKey: ['queueTokens', branchId] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update token status');
    }
  });

  const displayTokens = Array.isArray(queueList) ? queueList : [];

  const waitingQueue = displayTokens.filter(q =>
    ['WAITING', 'CALLED', 'IN_PROGRESS', 'IN_CONSULTATION'].includes((q.status || '').toUpperCase())
  );

  const waitingOnly = waitingQueue.filter(q => (q.status || '').toUpperCase() === 'WAITING');
  const waitMinutesList = waitingOnly
    .map(q => q.generatedAt ? Math.max(0, Math.round((Date.now() - new Date(q.generatedAt).getTime()) / 60000)) : 0);
  const estWaitTime = waitingOnly.length > 0 ? `${waitingOnly.length * 10}m` : '0m';
  const avgWaitTime = waitMinutesList.length > 0
    ? `${Math.round(waitMinutesList.reduce((a, b) => a + b, 0) / waitMinutesList.length)}m`
    : '0m';
  const longestWaitTime = waitMinutesList.length > 0 ? `${Math.max(...waitMinutesList)}m` : '0m';

  return (
    <div className="min-h-full bg-[#F8FAFF] p-6 lg:p-10 w-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={staggerChildren}
        className="max-w-[1200px] mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-6">

            
            <div className="flex items-start gap-5">
              <div className="p-4 bg-[#EBF0FF] rounded-2xl flex-shrink-0">
                <Users className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Queue Management</h1>
                <p className="text-[15px] text-gray-500 font-medium">Monitor and manage patient waiting queue across departments.</p>
              </div>
            </div>
          </div>
          
          <Link to="/reception/walk-in">
            <button className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/30">
              <UserPlus className="w-5 h-5" /> Register Walk-In
            </button>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100 flex flex-col gap-8">
          
          {/* Active Queue Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#2864FF]" />
              <h2 className="text-xl font-bold text-slate-900">Active Waiting Queue</h2>
            </div>
            <div className="bg-orange-50 text-orange-500 font-bold px-4 py-1.5 rounded-full text-sm">
              {waitingQueue.length} Active
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1 */}
            <div className="p-6 rounded-2xl border border-gray-100 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-[#2864FF] rounded-xl flex items-center justify-center shrink-0">
                <Ticket className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total in Queue</p>
                <p className="text-2xl font-bold text-[#2864FF]">{waitingQueue.length}</p>
              </div>
            </div>
            {/* KPI 2 */}
            <div className="p-6 rounded-2xl border border-gray-100 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Wait Time</p>
                <p className="text-2xl font-bold text-green-500">{estWaitTime}</p>
              </div>
            </div>
            {/* KPI 3 */}
            <div className="p-6 rounded-2xl border border-gray-100 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
                <History className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1">Avg. Waiting Time</p>
                <p className="text-2xl font-bold text-purple-500">{avgWaitTime}</p>
              </div>
            </div>
            {/* KPI 4 */}
            <div className="p-6 rounded-2xl border border-gray-100 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Hourglass className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1">Longest Wait Time</p>
                <p className="text-2xl font-bold text-orange-500">{longestWaitTime}</p>
              </div>
            </div>
          </div>

          {/* Queue Content */}
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500 font-medium">Loading queue data...</div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-200 rounded-3xl bg-red-50/40 space-y-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-red-700 font-bold text-sm">Failed to load queue tokens from server.</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2.5 rounded-xl bg-white border border-red-200 text-red-700 font-bold text-xs hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : waitingQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <div className="w-40 h-40 bg-[#F4F7FF] rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-[#EBF0FF] rounded-full animate-ping opacity-20"></div>
                    
                    {/* Clock Bubble */}
                    <div className="absolute top-4 right-4 bg-[#608FFF] w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-20">
                       <Clock className="w-4 h-4 text-white" />
                    </div>

                    {/* Couch SVG */}
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#2864FF] z-10" style={{ filter: 'drop-shadow(0px 8px 8px rgba(40, 100, 255, 0.2))' }}>
                        <rect x="20" y="45" width="60" height="20" rx="4" fill="#A0C0FF" />
                        <rect x="15" y="55" width="70" height="15" rx="3" fill="#608FFF" />
                        <rect x="25" y="35" width="50" height="15" rx="3" fill="#A0C0FF" />
                        <path d="M 22 70 L 22 80 M 78 70 L 78 80" stroke="#2864FF" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 25 35 V 45 M 50 35 V 45 M 75 35 V 45" stroke="#F4F7FF" strokeWidth="2" />
                        <path d="M 20 45 L 80 45" stroke="#F4F7FF" strokeWidth="2" />
                    </svg>

                    {/* Decorative stars */}
                    <svg className="absolute w-full h-full inset-0 z-0" viewBox="0 0 100 100">
                        <path d="M 10 30 L 12 35 L 17 37 L 12 39 L 10 44 L 8 39 L 3 37 L 8 35 Z" fill="#A0C0FF" opacity="0.6"/>
                        <path d="M 85 20 L 87 23 L 90 25 L 87 27 L 85 30 L 83 27 L 80 25 L 83 23 Z" fill="#A0C0FF" opacity="0.6"/>
                        <circle cx="90" cy="50" r="1.5" fill="#608FFF" opacity="0.5"/>
                    </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Queue is empty</h3>
                <p className="text-[15px] font-medium text-gray-500 mb-8">There are currently no waiting tokens in the reception queue.</p>
                
                <Link to="/reception/walk-in">
                  <button className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-[#2864FF] border-2 border-[#2864FF] hover:bg-blue-50 transition-colors">
                    <UserPlus className="w-5 h-5" /> Register Walk-In
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {waitingQueue.map((q) => {
                  const isActiveCall = ['CALLED', 'IN_PROGRESS', 'IN_CONSULTATION'].includes((q.status || '').toUpperCase());
                  const deptLabel = q.currentDepartment || q.department || 'GENERAL';
                  return (
                  <motion.div
                    key={q.id}
                    variants={fadeIn}
                    className={`p-6 rounded-2xl border-2 flex flex-col justify-between gap-4 shadow-sm transition-all bg-white hover:-translate-y-1 ${
                      isActiveCall
                        ? 'border-blue-400/50 shadow-blue-500/10' 
                        : 'border-orange-200 shadow-orange-500/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isActiveCall ? 'bg-blue-50 text-[#2864FF]' : 'bg-orange-50 text-orange-500'}`}>
                        {deptLabel} • P{q.priorityLevel ?? 0}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isActiveCall ? 'text-[#2864FF]' : 'text-orange-500'}`}>
                        {q.status}
                      </span>
                    </div>

                    <div className="text-center my-4">
                      <div className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        {q.tokenNumber}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full mt-2">
                      {q.status === 'WAITING' && (
                        <>
                          <button 
                            className="flex-1 flex justify-center items-center gap-2 bg-[#2864FF] text-white hover:bg-blue-700 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                            onClick={() => updateStatus.mutate({ tokenId: q.id ?? q.tokenNumber, status: 'CALLED' })}
                            disabled={updateStatus.isPending}
                          >
                            <Play className="w-4 h-4" /> Call
                          </button>
                          <button
                            title="Mark No-Show"
                            className="px-3 flex justify-center items-center bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                            onClick={() => updateStatus.mutate({ tokenId: q.id ?? q.tokenNumber, status: 'NO_SHOW' })}
                            disabled={updateStatus.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {q.status === 'CALLED' && (
                        <>
                          <button 
                            className="flex-1 flex justify-center items-center gap-2 bg-[#2864FF] text-white hover:bg-blue-700 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                            onClick={() => updateStatus.mutate({ tokenId: q.id ?? q.tokenNumber, status: 'IN_CONSULTATION' })}
                            disabled={updateStatus.isPending}
                          >
                            <Play className="w-4 h-4" /> Start
                          </button>
                          <button 
                            className="px-3 flex justify-center items-center bg-green-500 text-white hover:bg-green-600 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                            onClick={() => updateStatus.mutate({ tokenId: q.id ?? q.tokenNumber, status: 'COMPLETED' })}
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(q.status === 'IN_PROGRESS' || q.status === 'IN_CONSULTATION') && (
                        <button 
                          className="w-full flex justify-center items-center gap-2 bg-green-500 text-white hover:bg-green-600 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                          onClick={() => updateStatus.mutate({ tokenId: q.id ?? q.tokenNumber, status: 'COMPLETED' })}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </button>
                      )}
                    </div>
                  </motion.div>
                );})}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QueueManagement;
