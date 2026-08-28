import { BASE_URL } from '../api/axios';
import { useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Custom hook to subscribe to the patient medicines SSE endpoint.
 * Uses a stable useEffect with useRef callback to prevent cancellation
 * loops on every re-render.
 */
export function usePatientMedicineFeed(onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const token = useAuthStore.getState().token || localStorage.getItem('token');
    if (!token) return;

    const url = `${BASE_URL.replace('/api', '')}/api/sse/patient-medicines?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

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
    };

    return () => {
      eventSource.close();
    };
  }, []);
}

export default usePatientMedicineFeed;
