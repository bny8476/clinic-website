import { BASE_URL, axiosPrivate } from '../api/axios';
import { useEffect, useRef } from 'react';
import useAuthStore, { isTokenValid } from '../store/authStore';

/**
 * Custom hook to subscribe to the patient medicines SSE endpoint using single-use tickets.
 */
export function usePatientMedicineFeed(onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  const token = useAuthStore((state) => state.token);
  const isInitializingAuth = useAuthStore((state) => state.isInitializingAuth);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (isInitializingAuth || !token || !isTokenValid(token)) return;

    let eventSource = null;
    let isSubscribed = true;

    const connect = async () => {
      try {
        const ticketRes = await axiosPrivate.post('/sse/patient-medicines/ticket');
        const ticket = ticketRes.data?.ticket;
        if (!ticket || !isSubscribed) return;

        const url = `${BASE_URL.replace('/api', '')}/api/sse/patient-medicines?ticket=${ticket}`;
        eventSource = new EventSource(url);

        const handleUpdate = (event) => {
          if (onUpdateRef.current) {
            try {
              onUpdateRef.current(JSON.parse(event.data));
            } catch {
              onUpdateRef.current(event.data);
            }
          }
        };

        eventSource.addEventListener('medicines_updated', handleUpdate);

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
        };
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error('Failed to acquire SSE ticket for patient medicines:', err);
        }
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, isInitializingAuth]);
}

export default usePatientMedicineFeed;
