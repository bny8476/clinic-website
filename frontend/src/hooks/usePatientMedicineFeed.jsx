import { BASE_URL, axiosPrivate } from '../api/axios';
import { useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Custom hook to subscribe to the patient medicines SSE endpoint using single-use tickets.
 */
export function usePatientMedicineFeed(onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  const token = useAuthStore((state) => state.token);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!token) return;

    let eventSource = null;
    let isSubscribed = true;

    const connect = async () => {
      try {
        const ticketRes = await axiosPrivate.post('/sse/patient-medicines/ticket');
        const ticket = ticketRes.data.ticket;
        if (!isSubscribed) return;

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

        eventSource.onerror = (error) => {
          console.error('SSE error on patient-medicines:', error);
          if (eventSource) {
            eventSource.close();
          }
        };
      } catch (err) {
        console.error('Failed to acquire SSE ticket for patient medicines:', err);
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token]);
}

export default usePatientMedicineFeed;
