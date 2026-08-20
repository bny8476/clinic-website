import logger from '../../utils/logger';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const BASE_URL =
  (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api';

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

// Response interceptor – handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ignore 401s from the login endpoint so the UI can display the error
      if (error.config && !error.config.url.includes('/auth/login')) {
        // Token expired — clear and redirect to login
        localStorage.clear();
        window.dispatchEvent(new Event('auth:expired'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
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
