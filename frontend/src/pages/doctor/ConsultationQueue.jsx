import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';

const ConsultationQueue = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  const { data: queue = [], isLoading, isFetching } = useQuery({
    queryKey: ['doctor-queue'],
    queryFn: async () => (await axiosPrivate.get('/appointments/today')).data,
    staleTime: 60000,
  });

  React.useEffect(() => {
    if (!token) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const evtSource = new EventSource(`${baseUrl.replace('/api', '')}/api/sse/appointments?token=${token}`);
    
    evtSource.onmessage = () => {
      queryClient.invalidateQueries(['doctor-queue']);
    };
    
    return () => evtSource.close();
  }, [token, queryClient]);

  const callNext = useMutation({
    mutationFn: async (appointmentId) => axiosPrivate.patch(`/appointments/${appointmentId}/status?status=IN_PROGRESS`),
    onSuccess: () => queryClient.invalidateQueries(['doctor-queue']),
  });

  const waiting = queue.filter(q => q.status === 'CHECKED_IN');
  const inProgress = queue.find(q => q.status === 'IN_PROGRESS');

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full font-sans bg-white min-h-full">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-2">Consultation Queue</h1>
        <p className="text-[15px] font-medium text-slate-500">Monitor and manage patients waiting for consultation.</p>
      </div>

      {/* Currently in room */}
      {inProgress && (
        <div className="mb-8 bg-indigo-600 rounded-[20px] p-7 text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <p className="text-indigo-100 text-[13px] font-bold uppercase tracking-wider mb-2">Currently in consultation</p>
          <h2 className="text-2xl font-extrabold mb-1">{inProgress.patientName || `Patient #${inProgress.patientId}`}</h2>
          <p className="text-indigo-200 text-[14px] font-medium mb-5">{inProgress.appointmentType || 'General Consultation'} · {inProgress.opNumber ? `${inProgress.opNumber} · ` : ''}Token #{inProgress.tokenNumber || inProgress.id}</p>
          <div className="inline-flex items-center gap-2 bg-indigo-700/60 px-3.5 py-1.5 rounded-lg border border-indigo-500/40">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-bold text-indigo-50">In Progress</span>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await axiosPrivate.post('/v1/doctor/encounters', {
                  patientId: inProgress.patientId,
                  appointmentId: inProgress.id,
                  branchId: inProgress.branchId || 1
                });
                navigate(`/doctor/consultation/${res.data.id}`);
              } catch (err) {
                console.error(err);
              }
            }}
            style={{ marginTop: '16px', background: 'var(--color-surface)', color: 'var(--color-info)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Enter Consultation <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-[16px] border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 flex items-center gap-5">
           <div className="w-[60px] h-[60px] rounded-[20px] bg-[#FFF2E5] flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-[#E85D04] stroke-[1.5]" />
           </div>
           <div>
              <p className="text-[15px] font-bold text-slate-700 mb-1">Waiting</p>
              <h3 className="text-[34px] font-extrabold text-[#E85D04] leading-none tracking-tight">{waiting.length}</h3>
           </div>
        </div>

        <div className="bg-white rounded-[16px] border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 flex items-center gap-5">
           <div className="w-[60px] h-[60px] rounded-[20px] bg-[#E8F8F0] flex items-center justify-center shrink-0">
              <Clock className="w-8 h-8 text-[#10B981] stroke-[1.5]" />
           </div>
           <div>
              <p className="text-[15px] font-bold text-slate-700 mb-1">Est. Wait (min)</p>
              <h3 className="text-[34px] font-extrabold text-[#10B981] leading-none tracking-tight">{waiting.length * 15}</h3>
           </div>
        </div>
      </div>

      {/* Call next */}
      {waiting.length > 0 && !inProgress && (
        <div className="mb-8 flex justify-end">
          <button
            onClick={() => callNext.mutate(waiting[0].id)}
            disabled={callNext.isPending}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[15px] hover:bg-indigo-700 transition-colors shadow-[0_4px_12px_-4px_rgba(79,70,229,0.4)] disabled:opacity-50 group"
          >
            {callNext.isPending ? <Loader className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Call Next Patient
          </button>
        </div>
      )}

      {/* Queue list */}
      <div className="bg-white rounded-[16px] border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-10">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <h3 className="text-[16px] font-extrabold text-slate-900">Waiting Queue ({waiting.length})</h3>
           <button 
             onClick={() => queryClient.invalidateQueries(['doctor-queue'])}
             disabled={isFetching}
             className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
           >
             <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
             Refresh
           </button>
        </div>

        <div className="p-0">
           {isLoading ? (
             <div className="py-24 text-center text-[15px] font-semibold text-slate-500">Loading queue...</div>
           ) : waiting.length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="relative w-28 h-28 bg-[#F5F3FF] rounded-full flex items-center justify-center mb-7">
                   <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-[#C7D2FE] rounded-full"></div>
                   <div className="absolute bottom-6 left-2 w-2 h-2 bg-[#A5B4FC] rounded-full"></div>
                   <div className="absolute top-1/2 -right-3 w-2.5 h-2.5 bg-[#C7D2FE] rounded-full"></div>
                   <div className="absolute top-6 -left-2 w-1.5 h-1.5 bg-[#A5B4FC] rounded-full"></div>
                   
                   <div className="relative">
                      <ClipboardList className="w-14 h-14 text-[#818CF8] stroke-[1.5]" />
                      <div className="absolute -bottom-2 -right-2 w-[30px] h-[30px] bg-[#6366F1] rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
                         <User className="w-4 h-4 text-white stroke-[2.5]" />
                      </div>
                   </div>
                </div>
                <h4 className="text-[20px] font-extrabold text-slate-900 mb-2 tracking-tight">Queue is empty</h4>
                <p className="text-[15px] font-medium text-slate-500 max-w-sm">No patients are currently waiting for consultation.</p>
             </div>
           ) : (
             <motion.div 
               className="flex flex-col"
               initial="hidden"
               animate="visible"
               variants={{
                 hidden: { opacity: 0 },
                 visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
               }}
             >
               {waiting.map((p, i) => (
                  <motion.div 
                    key={p.id} 
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="flex items-center gap-5 px-6 py-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <div className="w-[42px] h-[42px] rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-[15px] shrink-0 border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-extrabold text-slate-900 truncate mb-1 group-hover:text-indigo-700 transition-colors">{p.patientName || `Patient #${p.patientId}`}</p>
                      <p className="text-[13px] font-semibold text-slate-500 truncate">{p.opNumber ? `${p.opNumber} · ` : ''}Token #{p.tokenNumber || p.id} · {p.appointmentType || 'Consultation'}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 group-hover:bg-white transition-colors hover:shadow-sm">~{(i + 1) * 15} min</div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </motion.div>
               ))}
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationQueue;
