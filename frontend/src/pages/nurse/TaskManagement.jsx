import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';



const TaskManagement = () => {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['nursing-tasks'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/nursing/mar');
      return res.data.data || [];
    },
    refetchInterval: 30000,
  });

  const completeTask = useMutation({
    mutationFn: async (id) => axiosPrivate.post(`/nursing/mar/${id}/administer`),
    onSuccess: () => {
      toast.success('Task marked as completed');
      queryClient.invalidateQueries({ queryKey: ['nursing-tasks'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  });

  const pendingTasks = records.filter(r => r.status === 'SCHEDULED' || r.status === 'PENDING').sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  const completedTasks = records.filter(r => r.status === 'GIVEN' || r.status === 'COMPLETED').sort((a, b) => new Date(b.administeredAt || b.scheduledTime) - new Date(a.administeredAt || a.scheduledTime));

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/nurse" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <ListTodo className="w-7 h-7 text-[var(--color-navy-800)]" />
            Task Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            View and complete assigned clinical tasks and medication schedules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-200">
          <Card.Header className="bg-amber-50">
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" /> Pending Tasks ({pendingTasks.length})
            </h2>
          </Card.Header>
          <Card.Body className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading tasks...</div>
            ) : pendingTasks.length === 0 ? (
              <div className="p-8">
                <EmptyState icon={CheckCircle2} title="All Caught Up" description="You have no pending tasks at the moment." />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] max-h-[600px] overflow-y-auto">
                {pendingTasks.map(task => (
                  <li key={task.id} className="p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5 shrink-0">
                          <Pill size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--color-navy-900)] text-sm">{task.medicationName}</h3>
                          <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-0.5">
                            Dosage: {task.dosage}
                          </p>
                          <p className="text-xs text-[var(--color-text)] mt-1">
                            Patient: <span className="font-semibold">{task.patientName}</span> {task.bedNumber && `• Bed: ${task.bedNumber}`}
                          </p>
                          <p className="text-[10px] font-bold text-amber-600 mt-2 uppercase tracking-wider">
                            Scheduled: {new Date(task.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => completeTask.mutate(task.id)}
                        disabled={completeTask.isPending}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> Done
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-bold text-[var(--color-navy-900)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Completed Tasks
            </h2>
          </Card.Header>
          <Card.Body className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading tasks...</div>
            ) : completedTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No completed tasks yet.</div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] max-h-[600px] overflow-y-auto">
                {completedTasks.map(task => (
                  <li key={task.id} className="p-4 opacity-75">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--color-navy-900)] text-sm line-through decoration-slate-300">{task.medicationName}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Patient: <span className="font-semibold">{task.patientName}</span>
                          </p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-wider">
                            Completed: {new Date(task.administeredAt || task.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>
    </motion.div>
    
  );
};

export default TaskManagement;
