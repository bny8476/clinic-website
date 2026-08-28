import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// Resolve API base URL:
//   1. window.__ENV__ — injected at container start by docker-entrypoint.sh (Render / Docker deployment)
//   2. import.meta.env — set at build time by Vite (works in local dev and CI builds)
//   3. Hard-coded localhost fallback (local dev without Docker)
export const BASE_URL =
    (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080/api';


export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

export const axiosPublic = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

axiosPrivate.interceptors.request.use(
    config => {
        const token =
            useAuthStore.getState().token ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Track if a refresh is already in progress to avoid parallel refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

axiosPrivate.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error?.config;

        if (error?.response?.status === 401 && !originalRequest?._retry) {
            // If this is a login request failing, don't try to refresh — surface the error
            if (originalRequest?.url?.includes('/auth/') && originalRequest?.url?.includes('/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue the failed request — resolve/reject it after the refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return axiosPrivate(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await useAuthStore.getState().refresh();
                if (newAccessToken) {
                    processQueue(null, newAccessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axiosPrivate(originalRequest);
                } else {
                    // Refresh failed — clear auth state and let the RoleRoute redirect to login
                    processQueue(new Error('Session expired'));
                    useAuthStore.getState().logout();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                processQueue(refreshError);
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Show toast for timeouts or network errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.code === 'ERR_NETWORK') {
            toast.error('Network Error: The request took too long or the server is unreachable.');
        } else if (error.response?.status === 409) {
            toast.error(error.response?.data?.message || 'State conflict error. Please try again or refresh.');
        } else if (error.response?.status === 422) {
            toast.error(error.response?.data?.message || 'Invalid operation error.');
        }

        return Promise.reject(error);
    }
);
