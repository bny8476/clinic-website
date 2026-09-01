import useAuthStore from '../../store/authStore';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import { CalendarDays, Loader2, RefreshCw, XCircle, Clock, User, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const AppointmentHistory = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cancelId, setCancelId] = useState(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patientAppointments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/appointments/patient/${user?.id}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.patch(`/appointments/${id}/cancel?reason=Patient requested cancellation`);
    },
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      queryClient.invalidateQueries(['patientAppointments', user?.id]);
      queryClient.invalidateQueries(['patient-360']);
      setCancelId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
      setCancelId(null);
    }
  });

  const handleCancel = (id) => {
    cancelMutation.mutate(id);
  };

  const isActive = (status) => ['SCHEDULED', 'BOOKED', 'CONFIRMED'].includes(status);

  const statusColor = (status) => {
    if (status === 'COMPLETED') return { bg: 'bg-emerald-50', color: 'text-emerald-700', dot: 'bg-emerald-500' };
    if (isActive(status)) return { bg: 'bg-blue-50', color: 'text-blue-700', dot: 'bg-blue-500' };
    return { bg: 'bg-rose-50', color: 'text-rose-700', dot: 'bg-rose-500' };
  };

  return (
    <motion.div 
      className="p-4 sm:p-6 max-w-5xl mx-auto"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <CalendarDays size={24} />
          </div>
          My Appointments
        </h1>
        <p className="text-slate-500 mt-2 font-medium">View and manage your upcoming and past consultations.</p>
      </motion.div>

      <motion.div variants={staggerChildren} className="space-y-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-slate-400 shadow-sm border border-slate-100"
            >
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm font-bold tracking-wide uppercase">Loading your history...</p>
            </motion.div>
          ) : appointments.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center gap-4" 
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <CalendarDays size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">No appointments found</h3>
                <p className="text-slate-500 mt-1 font-medium">You don't have any upcoming or past appointments.</p>
              </div>
            </motion.div>
          ) : (
            appointments.map(a => {
              const { bg, color, dot } = statusColor(a.status);
              const apptDate = a.date || (a.startTime ? new Date(a.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—');
              const apptTime = a.time || (a.startTime ? new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
              
              return (
                <motion.div
                  variants={listStagger}
                  layout
                  key={a.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{a.doctorName}</h3>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${bg} ${color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                          {a.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5"><Activity size={16} className="text-slate-400" /> {a.specialty || 'General'}</span>
                        <span className="flex items-center gap-1.5"><CalendarDays size={16} className="text-blue-400" /> {apptDate}</span>
                        <span className="flex items-center gap-1.5"><Clock size={16} className="text-amber-400" /> {apptTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {isActive(a.status) && (
                      <>
                        {cancelId === a.id ? (
                          <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl">
                            <button onClick={() => handleCancel(a.id)} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-red-200">Confirm Cancel</button>
                            <button onClick={() => setCancelId(null)} className="px-4 py-2 text-red-700 text-xs font-bold hover:bg-red-100 rounded-lg">Back</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelId(a.id)}
                            disabled={cancelMutation.isPending}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                          >
                            <XCircle size={16} /> Cancel
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/patient/book/${a.doctorUserId}?rescheduleId=${a.id}`)}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shadow-sm"
                        >
                          <RefreshCw size={16} /> Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AppointmentHistory;
