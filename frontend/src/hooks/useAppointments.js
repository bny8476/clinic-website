import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../api/axios';
import useAuthStore from '../store/authStore';

// Hook to fetch all active doctors for booking
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/doctors');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

// Hook to fetch available appointment slots for a doctor and date
export function useAvailableSlots(doctorId, selectedDate) {
  return useQuery({
    queryKey: ['availableSlots', doctorId, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!doctorId || !selectedDate) return [];
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const res = await axiosPrivate.get(
        `/appointments/slots?doctorId=${doctorId}&start=${start.toISOString()}&end=${end.toISOString()}`
      );
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    },
    enabled: !!doctorId && !!selectedDate,
    staleTime: 30 * 1000,
  });
}

// Hook to fetch current logged-in patient's appointments
export function useMyPatientAppointments() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['patientAppointments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get('/appointments/my');
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    },
    enabled: !!user,
  });
}

// Hook to fetch doctor's appointments for today
export function useDoctorTodayAppointments() {
  return useQuery({
    queryKey: ['doctorTodayAppointments'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/appointments/today');
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    },
  });
}

// Hook to fetch today's overall clinic queue (Reception/Nurse/Doctor)
export function useAppointmentQueue() {
  return useQuery({
    queryKey: ['appointmentQueue'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/appointments/queue');
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    },
    refetchInterval: 15000, // Auto-refresh queue every 15 seconds
  });
}

// Mutation to book appointment
export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slotId, reasonForVisit, holdId, idempotencyKey, patientUserId }) => {
      const payload = { slotId, reasonForVisit, holdId, patientUserId };
      const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
      const res = await axiosPrivate.post('/appointments/book', payload, { headers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientAppointments']);
      queryClient.invalidateQueries(['availableSlots']);
      queryClient.invalidateQueries(['appointmentQueue']);
    },
  });
}

// Mutation to update appointment status (check-in, start, complete, cancel, etc.)
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, status, reason, action }) => {
      let endpoint = `/appointments/${appointmentId}/status?status=${status}`;
      if (action === 'check-in') endpoint = `/appointments/${appointmentId}/check-in`;
      else if (action === 'start') endpoint = `/appointments/${appointmentId}/start`;
      else if (action === 'complete') endpoint = `/appointments/${appointmentId}/complete`;
      else if (action === 'cancel') endpoint = `/appointments/${appointmentId}/cancel?reason=${encodeURIComponent(reason || 'Cancelled by user')}`;

      const res = await axiosPrivate.patch(endpoint);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientAppointments']);
      queryClient.invalidateQueries(['doctorTodayAppointments']);
      queryClient.invalidateQueries(['appointmentQueue']);
      queryClient.invalidateQueries(['availableSlots']);
    },
  });
}

// Mutation to reschedule appointment
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, newSlotId }) => {
      const res = await axiosPrivate.patch(`/appointments/${appointmentId}/reschedule?newSlotId=${newSlotId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientAppointments']);
      queryClient.invalidateQueries(['availableSlots']);
      queryClient.invalidateQueries(['appointmentQueue']);
    },
  });
}
