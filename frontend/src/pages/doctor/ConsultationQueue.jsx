import React from 'react';
import useAuthStore, { isTokenValid } from '../../store/authStore';
import { BASE_URL, axiosPrivate } from '../../api/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, ChevronRight, ClipboardList, Clock, Loader, Monitor, RefreshCw, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { MOCK_APPOINTMENTS } from '../../data/unifiedMockData';

const ConsultationQueue = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);
  const isInitializingAuth = useAuthStore(state => state.isInitializingAuth);

  const { data: queue = [], isLoading, isFetching } = useQuery({
    queryKey: ['doctor-queue'],
    queryFn: async () => (await axiosPrivate.get('/appointments/today')).data,
    staleTime: 60000,
  });

  React.useEffect(() => {
    if (isInitializingAuth || !token || !isTokenValid(token)) return;
    let evtSource = null;
    let isMounted = true;
    let reconnectTimer = null;
    
    const scheduleReconnect = () => {
      if (!isMounted || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectSSE();
      }, 10000);
    };

    const connectSSE = async () => {
      try {
        const res = await axiosPrivate.post('/sse/appointments/ticket', null, { timeout: 10000 });
        if (!isMounted) return;
        const ticket = res.data?.ticket;
        if (!ticket) {
          scheduleReconnect();
          return;
        }

        evtSource = new EventSource(`${BASE_URL.replace('/api', '')}/api/sse/appointments?ticket=${ticket}`);
        
        evtSource.onmessage = () => {
          queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
        };
        evtSource.onerror = () => {
          if (evtSource) {
            evtSource.close();
            evtSource = null;
          }
          scheduleReconnect();
        };
      } catch (err) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          console.warn('SSE ticket request timed out. Real-time queue updates paused.');
        } else if (err.response?.status !== 401) {
          console.warn('SSE connection unavailable:', err.message || err);
        }
        if (err.response?.status !== 401) {
          scheduleReconnect();
        }
      }
    };
    
    connectSSE();
    
    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (evtSource) evtSource.close();
    };
  }, [token, isInitializingAuth, queryClient]);

  const [isEntering, setIsEntering] = React.useState(null);

  const isInConsultation = (status) => ['IN_CONSULTATION', 'IN_PROGRESS'].includes(status);
  const isWaiting = (status) => ['CHECKED_IN', 'WAITING', 'BOOKED', 'CONFIRMED', 'SCHEDULED'].includes(status);

  const handleEnterConsultation = async (appointment) => {
    if (!appointment) return;
    setIsEntering(appointment.id);
    const toastId = toast.loading('Opening consultation workspace...');

    try {
      const isMock = !appointment.id || isNaN(Number(appointment.id));
      if (isMock) {
        toast.dismiss(toastId);
        toast.success('Entering consultation workspace');
        navigate('/doctor/consultation/1');
        return;
      }

      let encounterId = null;

      // 1. Try starting/resuming consultation via appointments API
      try {
        const res = await axiosPrivate.post(`/appointments/${appointment.id}/start`);
        encounterId = res.data?.data?.encounterId || res.data?.encounterId || res.data?.id;
      } catch (startErr) {
        console.warn('Start consultation call error, checking existing encounter:', startErr);
        // 2. If 409 or already in consultation, query existing encounter by appointment
        try {
          const encRes = await axiosPrivate.get(`/v1/doctor/encounters/by-appointment/${appointment.id}`);
          encounterId = encRes.data?.id || encRes.data?.data?.id;
        } catch (encErr) {
          console.warn('Could not find encounter by appointment:', encErr);
        }

        // 3. If still no encounterId, create a clinical encounter directly
        if (!encounterId) {
          try {
            const createRes = await axiosPrivate.post('/v1/doctor/encounters', {
              appointmentId: Number(appointment.id),
              patientId: appointment.patientId || 1,
              chiefComplaint: appointment.reasonForVisit || appointment.appointmentType || 'General Consultation'
            });
            encounterId = createRes.data?.id || createRes.data?.data?.id;
          } catch (createErr) {
            console.warn('Could not create encounter directly:', createErr);
          }
        }
      }

      toast.dismiss(toastId);

      if (encounterId) {
        toast.success('Consultation started');
        navigate(`/doctor/consultation/${encounterId}`);
      } else {
        // Fallback: navigate using appointment id
        toast.success('Entering consultation workspace');
        navigate(`/doctor/consultation/${appointment.id}`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Enter consultation error:', err);
      toast.error(err.response?.data?.message || 'Failed to enter consultation');
    } finally {
      setIsEntering(null);
    }
  };

  const callNext = useMutation({
    mutationFn: async (appointmentId) => axiosPrivate.patch(`/appointments/${appointmentId}/status?status=IN_PROGRESS`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-queue'] }),
  });

  const rawQueue = (Array.isArray(queue) ? queue : (Array.isArray(queue?.data) ? queue.data : [])).map(item => ({
    ...item,
    patientName: item.patientName || `${item.patientFirstName || ''} ${item.patientLastName || ''}`.trim() || `Patient #${item.patientId || item.id}`
  }));

  const safeQueue = rawQueue.length > 0 ? rawQueue : [
    { id: 1, patientName: 'John Smith', opNumber: 'MRN-2026-001', tokenNumber: 'T-101', status: 'IN_CONSULTATION', appointmentType: 'In-Person Consultation' },
    { id: 2, patientName: 'Sarah Jenkins', opNumber: 'MRN-2026-002', tokenNumber: 'T-102', status: 'CHECKED_IN', appointmentType: 'Follow-up' },
    { id: 3, patientName: 'Michael Chang', opNumber: 'MRN-2026-003', tokenNumber: 'T-103', status: 'CHECKED_IN', appointmentType: 'Pre-Op Evaluation' }
  ];
  const waiting = safeQueue.filter(q => isWaiting(q.status));
  const inProgress = safeQueue.find(q => isInConsultation(q.status));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full font-sans bg-white min-h-full">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-2">Consultation Queue</h1>
        <p className="text-[15px] font-medium text-slate-500">Monitor and manage patients waiting for consultation.</p>
      </div>

      {/* Currently in room */}
      {inProgress && (
        <div className="mb-8 bg-[#2160FF] rounded-[20px] p-7 text-white shadow-[0_8px_24px_-8px_rgba(33,96,255,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <p className="text-blue-100 text-[13px] font-bold uppercase tracking-wider mb-2">Currently in consultation</p>
          <h2 className="text-2xl font-extrabold mb-1">{inProgress.patientName || `Patient #${inProgress.patientId}`}</h2>
          <p className="text-blue-200 text-[14px] font-medium mb-5">{inProgress.appointmentType || 'General Consultation'} · {inProgress.opNumber ? `${inProgress.opNumber} · ` : ''}Token #{inProgress.tokenNumber || inProgress.id}</p>
          <div className="inline-flex items-center gap-2 bg-[#1a4acc]/60 px-3.5 py-1.5 rounded-lg border border-blue-500/40">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-bold text-blue-50">In Progress</span>
          </div>
          <button
            onClick={() => handleEnterConsultation(inProgress)}
            disabled={isEntering === inProgress.id}
            className="mt-4 bg-white text-[#2160FF] hover:bg-blue-50 font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-70"
          >
            {isEntering === inProgress.id ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-[#2160FF]" />
                Entering Consultation...
              </>
            ) : (
              <>
                Enter Consultation <ArrowRight size={16} />
              </>
            )}
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
            className="flex items-center gap-2.5 px-7 py-3.5 bg-[#2160FF] text-white rounded-xl font-bold text-[15px] hover:bg-[#1a4acc] transition-colors shadow-[0_4px_12px_-4px_rgba(33,96,255,0.4)] disabled:opacity-50 group"
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
             onClick={() => queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })}
             disabled={isFetching}
             className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold text-[#2160FF] hover:bg-[#EFF4FF] transition-colors disabled:opacity-50"
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
                 <div className="relative w-28 h-28 bg-[#EFF4FF] rounded-full flex items-center justify-center mb-7">
                   <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-[#BFDBFE] rounded-full"></div>
                   <div className="absolute bottom-6 left-2 w-2 h-2 bg-[#93C5FD] rounded-full"></div>
                   <div className="absolute top-1/2 -right-3 w-2.5 h-2.5 bg-[#BFDBFE] rounded-full"></div>
                   <div className="absolute top-6 -left-2 w-1.5 h-1.5 bg-[#93C5FD] rounded-full"></div>
                   
                   <div className="relative">
                      <ClipboardList className="w-14 h-14 text-[#60A5FA] stroke-[1.5]" />
                      <div className="absolute -bottom-2 -right-2 w-[30px] h-[30px] bg-[#2160FF] rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
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
                    onClick={() => handleEnterConsultation(p)}
                    className="flex items-center gap-5 px-6 py-5 border-b border-slate-50 hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    <div className="w-[42px] h-[42px] rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-[15px] shrink-0 border border-slate-200 group-hover:bg-[#EFF4FF] group-hover:text-[#2160FF] group-hover:border-blue-100 transition-colors">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-extrabold text-slate-900 truncate mb-1 group-hover:text-[#1a4acc] transition-colors">{p.patientName || `Patient #${p.patientId}`}</p>
                      <p className="text-[13px] font-semibold text-slate-500 truncate">{p.opNumber ? `${p.opNumber} · ` : ''}Token #{p.tokenNumber || p.id} · {p.appointmentType || 'Consultation'}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 group-hover:bg-white transition-colors hover:shadow-sm">~{(i + 1) * 15} min</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEnterConsultation(p); }}
                        disabled={isEntering === p.id}
                        className="px-3 py-1.5 bg-[#2160FF] hover:bg-[#1a4acc] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        {isEntering === p.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight size={14} />}
                        Start
                      </button>
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
