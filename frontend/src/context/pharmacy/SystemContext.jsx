import api from '../../utils/pharmacy/api';
import { useQuery } from '@tanstack/react-query';

export const useSystem = () => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['system', 'datetime'],
    queryFn: async () => {
      const response = await api.get('/system/current-datetime');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: {
      current_date: '',
      current_time: '',
      current_datetime: '',
      day_of_week: '',
      greeting: 'Welcome',
      branch_name: 'Loading...',
    }
  });

  return { systemData: data, loading };
};
