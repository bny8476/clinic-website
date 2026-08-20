import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { CheckCircle2, MailOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/notifications');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const markRead = useMutation({
    mutationFn: async (id) => axiosPrivate.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });

  const markAllRead = useMutation({
    mutationFn: async () => axiosPrivate.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1 bg-transparent border-none cursor-pointer p-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600" />
            Notifications
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Stay updated with alerts, test results, and system messages.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            icon={CheckCircle2} 
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12">
               <EmptyState icon={MailOpen} title="All Caught Up" description="You don't have any notifications right now." />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] max-h-[700px] overflow-y-auto">
              {notifications.map(notification => (
                <li key={notification.id} className={`p-4 transition-colors ${notification.isRead ? 'opacity-70 bg-transparent' : 'bg-indigo-50/30'}`}>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                        {notification.isRead ? <MailOpen size={20} /> : <Bell size={20} />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`text-sm font-bold ${notification.isRead ? 'text-[var(--color-navy-800)]' : 'text-[var(--color-navy-900)]'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap uppercase tracking-wider">
                          {new Date(notification.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                        {notification.message}
                      </p>
                      
                      {!notification.isRead && (
                        <div className="mt-3">
                          <button 
                            onClick={() => markRead.mutate(notification.id)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                          >
                            <CheckCircle2 size={14} /> Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default NotificationsPage;
