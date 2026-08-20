import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';



const LabNotifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Initial fetch from REST history
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/notifications');
      return res.data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id) => axiosPrivate.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => axiosPrivate.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  // Setup SSE connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`/api/sse/lab?token=${token}`);

    const handleSseMessage = (event) => {
      // Invalidate the query to fetch the new notification persisted by the backend
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      toast("New Lab Notification", { icon: "🔔" });
    };

    eventSource.addEventListener('lab-request-new', handleSseMessage);
    eventSource.addEventListener('lab-result-critical', handleSseMessage);
    eventSource.addEventListener('lab-status-changed', handleSseMessage);

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/lab/dashboard')}
            style={{ p: '8px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} color="var(--color-text)" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Lab Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.875rem', background: 'var(--color-danger)', color: 'white', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>Stay updated on critical results and new requests.</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <MailOpen size={16} /> Mark All Read
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up!"
            description="You don't have any notifications at the moment."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border)' }}>
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                custom={index * 0.05}
                style={{
                  padding: '20px 24px',
                  background: notif.isRead ? 'var(--color-surface)' : 'var(--color-surface-hover)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                {!notif.isRead && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--color-primary)' }} />
                )}
                
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: notif.type === 'LAB_RESULT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  color: notif.type === 'LAB_RESULT' ? 'var(--color-danger)' : 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {notif.type === 'LAB_RESULT' ? <AlertTriangle size={20} /> : <Bell size={20} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)', fontWeight: notif.isRead ? 500 : 600 }}>
                      {notif.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {notif.body}
                  </p>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => markRead.mutate(notif.id)}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--color-primary)', padding: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.7, transition: 'opacity 0.2s'
                    }}
                    title="Mark as read"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
    
  );
};

export default LabNotifications;
