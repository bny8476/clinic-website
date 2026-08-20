import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerChildren, listStagger, fadeUp } from '../../components/ui/motion';

const AppointmentHistory = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cancelId, setCancelId] = useState(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patientAppointments', user?.id],
    queryFn: async () => (await axiosPrivate.get(`/appointments/patient/${user?.id}`)).data,
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
    if (status === 'COMPLETED') return { bg: 'var(--color-success-bg)', color: 'var(--color-success)' };
    if (isActive(status)) return { bg: '#EFF4FF', color: '#2B4AFE' };
    return { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' };
  };

  return (
    <motion.div 
      className="p-4 sm:p-6 max-w-3xl mx-auto"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.h1 
        variants={fadeUp}
        className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2" 
        style={{ color: 'var(--color-text)' }}
      >
        <CalendarDays size={24} color="#2B4AFE" aria-hidden="true" /> Appointment History
      </motion.h1>

      <motion.div 
        variants={staggerChildren}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400"
            >
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Loading history...</p>
            </motion.div>
          ) : appointments.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center" 
              style={{ color: 'var(--color-text-muted)' }}
            >
              No appointments found.
            </motion.div>
          ) : (
            appointments.map(a => {
              const { bg, color } = statusColor(a.status);
              return (
                <motion.div
                  variants={listStagger}
                  layout
                  key={a.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-b"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{a.doctorName}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {a.specialty || 'General'} · {a.type || 'Consultation'}
                </p>
                <p className="text-xs mt-1 font-semibold" style={{ color: '#2B4AFE' }}>
                  {a.date || (a.startTime ? new Date(a.startTime).toLocaleDateString() : '—')} at{' '}
                  {a.time || (a.startTime ? new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')}
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <span
                  className="self-start sm:self-end text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap"
                  style={{ background: bg, color }}
                >
                  {a.status}
                </span>
                {isActive(a.status) && (
                  <div className="flex gap-2 mt-2">
                    {cancelId === a.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleCancel(a.id)} className="text-xs font-bold text-red-600 underline">Confirm</button>
                        <button onClick={() => setCancelId(null)} className="text-xs font-bold text-gray-600 underline">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelId(a.id)}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/patient/book/${a.doctorUserId}?rescheduleId=${a.id}`)}
                      className="flex items-center gap-1 text-xs font-bold text-[#2B4AFE] bg-[#EFF4FF] hover:bg-[#bae6fd] px-2 py-1 rounded transition-colors"
                    >
                      <RefreshCw size={14} /> Reschedule
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        }))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AppointmentHistory;
