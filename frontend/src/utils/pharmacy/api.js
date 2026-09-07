import logger from '../../utils/logger';
import axios from 'axios';
import { BASE_URL } from '../../api/axios';
import useAuthStore from '../../store/authStore';

const api = axios.create({
  baseURL: `${BASE_URL}/pharmacy`,
  withCredentials: true,
});

// Request interceptor – attach token directly from shared auth store (useAuthStore)
api.interceptors.request.use(
  (config) => {
    // Prevent double /pharmacy/pharmacy due to baseURL and component URLs
    if (config.url && config.url.startsWith('/pharmacy/')) {
      config.url = config.url.substring('/pharmacy'.length);
    }

    // Map identity module requests to bypass the pharmacy baseURL
    if (config.url) {
      if (config.url.startsWith('/auth') && !config.url.startsWith('/auth/roles') && !config.url.startsWith('/auth/users')) {
        config.url = config.url.replace('/auth', '/api/auth');
        config.baseURL = '';
      }
    }
    
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const activeRole = localStorage.getItem('activeRole');
    if (activeRole) {
      config.headers['X-Active-Role'] = activeRole;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – delegate 401 to refresh flow without hard clearing session
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (!originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;
        try {
          const newToken = await useAuthStore.getState().refresh();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (_e) {
          useAuthStore.getState().handleSessionExpired();
        }
      }
    }
    if (error.response?.status === 403) {
      logger.error('403 Forbidden:', error.config?.url,
        '| Check: 1) token sent? 2) role allowed in SecurityConfig?');
    }
    return Promise.reject(error);
  }
);

export default api;

export const fetchWithRetry = async (url, options = {}, retries = 2) => {
  let attempt = 0;
  const delays = [500, 1000];

  while (attempt <= retries) {
    try {
      const response = await api({ url, ...options });
      return response;
    } catch (error) {
      if (attempt === retries || (error.response && error.response.status !== 429 && (error.response.status >= 400))) {
        throw error;
      }
      logger.warn(`Fetch failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delays[attempt]}ms...`);
      await new Promise(res => setTimeout(res, delays[attempt] || 1000));
      attempt++;
    }
  }
};
