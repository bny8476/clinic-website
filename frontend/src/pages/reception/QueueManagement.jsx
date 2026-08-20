import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Ticket, CheckCircle2, UserCheck, Play, ArrowLeft, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useAuthStore from '../../store/authStore';



const QueueManagement = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const branchId = user?.branchId || 1;

  const { data: queueList = [], isLoading } = useQuery({
    queryKey: ['queueTokens', branchId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/queue/branch/${branchId}`);
      return res.data;
    },
    refetchInterval: 5000 // Live updates
  });

  const updateStatus = useMutation({
    mutationFn: async ({ tokenId, status }) => {
      const res = await axiosPrivate.put(`/reception/queue/${tokenId}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Queue token updated successfully');
      queryClient.invalidateQueries(['queueTokens', branchId]);
    },
    onError: () => {
      toast.error('Failed to update token status');
    }
  });

  const waitingQueue = queueList.filter(q => q.status === 'WAITING' || q.status === 'IN_PROGRESS');
  const completedQueue = queueList.filter(q => q.status === 'COMPLETED' || q.status === 'NO_SHOW');

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={staggerChildren}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/reception" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reception Desk
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Users className="w-7 h-7 text-[var(--color-navy-800)]" />
            Live Queue Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Monitor and manage patient waiting queue across departments.
          </p>
        </div>
        
        <Link to="/reception/walk-in">
          <Button variant="primary" icon={UserCheck}>Register Walk-In</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Queue Status */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between w-full">
              <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--color-navy-800)]" />
                Active Waiting Queue
              </h2>
              <Badge variant="warning">{waitingQueue.length} Active</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <Skeleton count={4} variant="card" className="h-32" />
              </div>
            ) : waitingQueue.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="Queue is empty"
                description="There are currently no waiting tokens in the reception queue."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {waitingQueue.map((q) => (
                  <motion.div
                    key={q.id}
                    variants={fadeIn}
                    className={`p-4 rounded-md border text-center flex flex-col items-center justify-between gap-3 shadow-sm transition-shadow ${
                      q.status === 'IN_PROGRESS' 
                        ? 'border-[var(--color-info)]/30 bg-[var(--color-info-bg)]/40' 
                        : 'border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)]/40'
                    }`}
                  >
                    <div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${q.status === 'IN_PROGRESS' ? 'text-[var(--color-info)]' : 'text-[var(--color-warning)]'}`}>
                        {q.department} • P{q.priorityLevel}
                      </span>
                      <div className="text-4xl font-extrabold font-display text-[var(--color-navy-900)] my-1">
                        {q.tokenNumber}
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-navy-800)]">
                        {q.status}
                      </span>
                    </div>

                    <div className="flex gap-2 w-full mt-2">
                      {q.status === 'WAITING' && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          fullWidth 
                          icon={Play}
                          onClick={() => updateStatus.mutate({ tokenId: q.id, status: 'IN_PROGRESS' })}
                          isLoading={updateStatus.isPending}
                        >
                          Call
                        </Button>
                      )}
                      {q.status === 'IN_PROGRESS' && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          fullWidth 
                          icon={CheckCircle2}
                          onClick={() => updateStatus.mutate({ tokenId: q.id, status: 'COMPLETED' })}
                          isLoading={updateStatus.isPending}
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </motion.div>
    
  );
};

export default QueueManagement;
