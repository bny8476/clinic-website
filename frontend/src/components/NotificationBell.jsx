import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from './ui/motion';
import { axiosPrivate } from '../api/axios';

const TYPE_ICONS = {
  APPOINTMENT: '📅',
  INVOICE: '🧾',
  LAB_RESULT: '🔬',
  QUEUE: '🔔',
  NURSE_ASSIGNMENT: '👩‍⚕️',
  SYSTEM: '⚙️',
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Unread count — polls every 30 seconds
  const { data: countData } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/notifications/unread-count');
        return res.data;
      } catch (err) {
        return 0; // Fallback to 0 unread on 401/404
      }
    },
    refetchInterval: 30000,
  });

  // Full notification list — fetched when panel opens
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/notifications');
      return res.data;
    },
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: async () => axiosPrivate.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notificationCount']);
    },
  });

  const markRead = useMutation({
    mutationFn: async (id) => axiosPrivate.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notificationCount']);
    },
  });

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = countData?.count || 0;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '8px', borderRadius: '8px',
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <Bell size={22} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: 'var(--color-danger)', color: 'var(--color-surface)', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '0.7rem',
            fontWeight: 700, display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '2px solid var(--color-surface)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="notification-panel"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '380px', maxHeight: '480px',
              background: 'var(--color-surface)', borderRadius: '12px',
              border: '1px solid var(--color-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              transformOrigin: 'top right',
            }}
          >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid var(--color-surface-alt)',
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Notifications {unread > 0 && (
                <span style={{
                  marginLeft: '8px', background: 'var(--color-danger)', color: 'var(--color-surface)',
                  borderRadius: '12px', padding: '1px 8px', fontSize: '0.75rem',
                }}>{unread}</span>
              )}
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  title="Mark all as read"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-info)', fontSize: '0.8rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <CheckCheck size={14} /> All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Bell size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                  style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--color-surface-alt)',
                    background: n.isRead ? 'var(--color-surface)' : 'var(--color-info-bg)',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.background = 'var(--color-info-bg)'; }}
                  onMouseLeave={e => { if (!n.isRead) e.currentTarget.style.background = 'var(--color-info-bg)'; }}
                >
                  <span style={{ fontSize: '1.3rem', flexShrink: 0, lineHeight: 1 }}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: n.isRead ? 500 : 700,
                      fontSize: '0.875rem', color: 'var(--color-text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      {n.body}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.isRead && (
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'var(--color-info)', flexShrink: 0, marginTop: '4px',
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
