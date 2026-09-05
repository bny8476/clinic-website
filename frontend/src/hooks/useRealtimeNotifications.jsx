import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { BASE_URL, axiosPrivate } from '../api/axios';
import useAuthStore from '../store/authStore';

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    let eventSource = null;
    let isSubscribed = true;

    const connectSse = async () => {
      try {
        const ticketRes = await axiosPrivate.post('/notifications/ticket');
        const ticket = ticketRes.data.ticket;
        if (!isSubscribed) return;

        const streamUrl = `${BASE_URL.replace('/api', '')}/api/notifications/stream?ticket=${ticket}`;
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener('NOTIFICATION', (event) => {
          try {
            const data = JSON.parse(event.data);
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer border border-blue-100`}
                onClick={() => {
                  toast.dismiss(t.id);
                  if (data.referenceId && data.type === 'MEDICINE_ORDER') {
                    window.location.href = `/doctor/orders/${data.referenceId}`;
                  } else if (data.referenceId && data.type === 'ORDER_STATUS') {
                    window.location.href = `/my-orders/${data.referenceId}`;
                  }
                }}
              >
                <div className="flex-1 w-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        🔔
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-gray-900">{data.title || 'New Notification'}</p>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed whitespace-pre-line">{data.body}</p>
                    </div>
                  </div>
                </div>
              </div>
            ), { duration: 6000 });

            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['unreadNotificationCount']);
            queryClient.invalidateQueries(['doctorOrders']);
            queryClient.invalidateQueries(['patientOrders']);
          } catch (err) {
            console.error("Error parsing SSE notification:", err);
          }
        });

        eventSource.onerror = (err) => {
          console.warn("SSE connection interrupted:", err);
          if (eventSource) {
            eventSource.close();
          }
        };
      } catch (err) {
        console.error("Failed to acquire SSE ticket for notifications:", err);
      }
    };

    connectSse();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient, token]);
}
