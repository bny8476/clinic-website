import api from '../../utils/pharmacy/api';
import { useQuery } from '@tanstack/react-query';

export const useConfig = (key) => {
  const {
    data: config = {},
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await api.get('/config/public');
      return response.data?.data ?? response.data ?? {};
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false
  });

  if (isError) {
    console.error(
      'Config API failed:',
      error?.response?.status,
      error?.response?.data
    );
  }

  return key ? config[key] : config;
};
