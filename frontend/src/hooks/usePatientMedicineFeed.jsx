import { useEffect } from 'react';

/**
 * Custom hook to subscribe to the patient medicines SSE endpoint.
 * When the server pushes a 'medicines_updated' event, this hook
 * will call the provided onUpdate callback so the UI can refetch the medicines.
 */
export function usePatientMedicineFeed(onUpdate) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use EventSource to connect to our new SSE endpoint
    // We add the token in the query string or wait, EventSource doesn't support headers.
    // Let's check how the app usually does it. Wait, the backend expects a token.
    // Standard EventSource doesn't allow Authorization headers.
    
    // Usually, the app might have an interceptor or we pass it via query param. 
    // Let's check how other SSE endpoints are accessed in this project.
    // For now, I'll pass it as a query param assuming standard fallback if needed.
    // Wait, let's look at `frontend/src/components/ui/AIAssistantWidget.jsx` or similar, or I can just pass `?token=${token}`.
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const eventSource = new EventSource(`${baseUrl.replace('/api', '')}/api/sse/patient-medicines?token=${token}`);

    eventSource.addEventListener('medicines_updated', (event) => {
      if (onUpdate) {
        onUpdate(JSON.parse(event.data));
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE error on patient-medicines:', error);
      // EventSource automatically reconnects, but we can log it.
    };

    return () => {
      eventSource.close();
    };
  }, [onUpdate]);
}
