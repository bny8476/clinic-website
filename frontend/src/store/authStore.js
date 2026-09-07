import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { broadcastAuthEvent, subscribeAuthEvents } from '../utils/multiTabAuth';

export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') throw new Error('Invalid token');
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Malformed JWT: missing payload segment');
  const base64url = parts[1];

  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  try {
    return JSON.parse(atob(base64));
  } catch {
    throw new Error('Malformed JWT: payload is not valid base64url');
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = parseJwtPayload(token);
    if (!exp) return false;
    return (exp * 1000) > (Date.now() + 10_000); // 10-sec buffer
  } catch {
    return false;
  }
}

export const ROLE_DASHBOARDS = {
  ROLE_SUPER_ADMIN: '/super-admin/dashboard',
  SUPER_ADMIN: '/super-admin/dashboard',
  ROLE_ADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  ROLE_DOCTOR: '/doctor/dashboard',
  DOCTOR: '/doctor/dashboard',
  ROLE_NURSE: '/nurse/dashboard',
  NURSE: '/nurse/dashboard',
  ROLE_PHARMACIST: '/pharmacy/dashboard',
  PHARMACIST: '/pharmacy/dashboard',
  ROLE_PHARMACY_STAFF: '/pharmacy/dashboard',
  ROLE_STOREKEEPER: '/pharmacy/dashboard',
  ROLE_LAB_TECHNICIAN: '/lab/dashboard',
  ROLE_LAB: '/lab/dashboard',
  LAB_TECH: '/lab/dashboard',
  ROLE_RADIOLOGIST: '/radiology/dashboard',
  RADIOLOGY: '/radiology/dashboard',
  ROLE_RECEPTIONIST: '/reception/dashboard',
  RECEPTION: '/reception/dashboard',
  ROLE_FINANCE: '/finance/dashboard',
  ACCOUNTANT: '/finance/dashboard',
  MANAGER: '/manager/dashboard',
  ROLE_PATIENT: '/patient/dashboard',
  PATIENT: '/patient/dashboard',
};

const ROLE_PRIORITY_ORDER = [
  'ROLE_SUPER_ADMIN', 'SUPER_ADMIN',
  'ROLE_ADMIN', 'ADMIN',
  'ROLE_DOCTOR', 'DOCTOR',
  'ROLE_NURSE', 'NURSE',
  'ROLE_PHARMACIST', 'PHARMACIST', 'ROLE_PHARMACY_STAFF', 'ROLE_STOREKEEPER',
  'ROLE_LAB_TECHNICIAN', 'ROLE_LAB', 'LAB_TECH',
  'ROLE_RADIOLOGIST', 'RADIOLOGY',
  'ROLE_RECEPTIONIST', 'RECEPTION',
  'ROLE_FINANCE', 'ACCOUNTANT',
  'MANAGER',
  'ROLE_PATIENT', 'PATIENT',
];

export function getDefaultDashboardRoute(roles = []) {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return '/patient/dashboard';
  }
  for (const pRole of ROLE_PRIORITY_ORDER) {
    if (roles.includes(pRole)) {
      return ROLE_DASHBOARDS[pRole] || '/patient/dashboard';
    }
  }
  return ROLE_DASHBOARDS[roles[0]] || '/patient/dashboard';
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      roles: [],
      permissions: [],
      mfaPending: false,
      mfaEmail: null,
      error: null,
      isLoading: false,
      isInitializingAuth: true,
      sessionExpiredNotice: null,

      initAuth: async () => {
        set({ isInitializingAuth: true });
        const { token, refreshToken } = get();

        // If no token and no refresh token in state, user is an unauthenticated guest — skip refresh request
        if (!token && !refreshToken) {
          set({
            token: null,
            refreshToken: null,
            user: null,
            roles: [],
            permissions: [],
            isInitializingAuth: false,
          });
          return;
        }

        try {
          const { axiosPublic, axiosPrivate } = await import('../api/axios');

          if (token && isTokenValid(token)) {
            // Validate existing token with /api/auth/me
            try {
              const profileRes = await axiosPrivate.get('/auth/me');
              const data = profileRes.data;
              set({
                user: data.user || get().user,
                roles: Array.from(data.roles || get().roles || []),
                permissions: Array.from(data.permissions || get().permissions || []),
                isInitializingAuth: false,
              });
              return;
            } catch (_err) {
              // Token is valid locally — retain active session state on reload and exit initAuth
              set({ isInitializingAuth: false });
              return;
            }
          }

          // Try refreshing token via refresh cookie / token
          const refreshRes = await axiosPublic.post(
            '/auth/refresh',
            refreshToken ? { refreshToken } : {},
            { withCredentials: true }
          );

          if (refreshRes.data && (refreshRes.data.accessToken || refreshRes.data.token)) {
            const newAccessToken = refreshRes.data.accessToken || refreshRes.data.token;
            const newRefreshToken = refreshRes.data.refreshToken || refreshToken;
            const parsed = parseJwtPayload(newAccessToken);

            set({
              token: newAccessToken,
              refreshToken: newRefreshToken || null,
              user: refreshRes.data.user || { id: parsed.userId, email: parsed.sub, name: parsed.sub },
              roles: Array.from(refreshRes.data.roles || parsed.roles || []),
              permissions: Array.from(refreshRes.data.permissions || parsed.permissions || []),
              isInitializingAuth: false,
            });
            return;
          }
        } catch (_err) {
          // If refresh fails on startup, clear invalid credentials silently
          set({ token: null, refreshToken: null, user: null, roles: [], permissions: [] });
        } finally {
          set({ isInitializingAuth: false });
        }
      },

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true, error: null, sessionExpiredNotice: null });
        try {
          const { axiosPublic } = await import('../api/axios');
          const res = await axiosPublic.post('/auth/login', { email, password }, { withCredentials: true });

          if (res.data.mfaRequired) {
            set({ mfaPending: true, mfaEmail: res.data.email, isLoading: false });
            return { success: false, mfaRequired: true };
          }

          const { token, accessToken, refreshToken, user, roles, permissions } = res.data;
          const jwtToken = accessToken || token;
          const parsed = parseJwtPayload(jwtToken);
          const finalRoles = Array.from(roles || parsed.roles || []);
          const finalPermissions = Array.from(permissions || parsed.permissions || []);
          const finalUser = user || { id: parsed.userId, email: parsed.sub, name: parsed.sub };

          set({
            token: jwtToken,
            refreshToken: refreshToken || null,
            user: finalUser,
            roles: finalRoles,
            permissions: finalPermissions,
            mfaPending: false,
            isLoading: false,
            error: null,
          });

          return { success: true, user: finalUser, roles: finalRoles };
        } catch (err) {
          let errorMsg = 'Invalid email or password';
          if (err.response?.status === 423) {
            errorMsg = 'Account is locked due to multiple failed attempts. Please try again later.';
          } else if (typeof err.response?.data === 'string') {
            errorMsg = err.response.data;
          } else if (err.response?.data?.message) {
            errorMsg = err.response.data.message;
          }
          set({ error: errorMsg, isLoading: false });
          return { success: false, error: errorMsg };
        }
      },

      verifyMfa: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const { axiosPublic } = await import('../api/axios');
          const res = await axiosPublic.post('/auth/login/mfa', { email, otp }, { withCredentials: true });

          const { token, accessToken, refreshToken, user, roles, permissions } = res.data;
          const jwtToken = accessToken || token;
          const parsed = parseJwtPayload(jwtToken);
          const finalRoles = Array.from(roles || parsed.roles || []);
          const finalPermissions = Array.from(permissions || parsed.permissions || []);
          const finalUser = user || { id: parsed.userId, email: parsed.sub, name: parsed.sub };

          set({
            token: jwtToken,
            refreshToken: refreshToken || null,
            user: finalUser,
            roles: finalRoles,
            permissions: finalPermissions,
            mfaPending: false,
            mfaEmail: null,
            isLoading: false,
            error: null,
          });

          return { success: true, user: finalUser, roles: finalRoles };
        } catch (err) {
          const errorMsg = typeof err.response?.data === 'string' ? err.response.data : 'Invalid or expired OTP';
          set({ error: errorMsg, isLoading: false });
          return { success: false, error: errorMsg };
        }
      },

      refresh: async () => {
        const inMemoryRefreshToken = get().refreshToken;
        const currentToken = get().token;
        if (!inMemoryRefreshToken && !currentToken) return null;

        try {
          const { axiosPublic } = await import('../api/axios');

          const res = await axiosPublic.post(
            '/auth/refresh',
            inMemoryRefreshToken ? { refreshToken: inMemoryRefreshToken } : {},
            { withCredentials: true }
          );

          const newAccessToken = res.data.accessToken || res.data.token;
          const newRefreshToken = res.data.refreshToken || inMemoryRefreshToken;

          if (!newAccessToken) return null;

          const parsed = parseJwtPayload(newAccessToken);
          set({
            token: newAccessToken,
            refreshToken: newRefreshToken || null,
            user: res.data.user || get().user || { id: parsed.userId, email: parsed.sub, name: parsed.sub },
            roles: Array.from(res.data.roles || parsed.roles || get().roles || []),
            permissions: Array.from(res.data.permissions || parsed.permissions || get().permissions || []),
          });

          return newAccessToken;
        } catch (_err) {
          return null;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const { axiosPublic } = await import('../api/axios');
          await axiosPublic.post('/auth/password/forgot', { email });
          set({ isLoading: false });
          return true;
        } catch (err) {
          set({ error: typeof err.response?.data === 'string' ? err.response.data : 'Failed to send reset code', isLoading: false });
          return false;
        }
      },

      resetPassword: async (email, otp, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const { axiosPublic } = await import('../api/axios');
          await axiosPublic.post('/auth/password/reset', { email, otp, newPassword });
          set({ isLoading: false });
          return true;
        } catch (err) {
          set({ error: typeof err.response?.data === 'string' ? err.response.data : 'Failed to reset password', isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      handleSessionExpired: (reason = 'Your session has expired. Please sign in again.') => {
        set({ sessionExpiredNotice: reason });
        get().logout(reason, false);
      },

      logout: async (reason = null, notifyCrossTab = true) => {
        const inMemoryRefreshToken = get().refreshToken;

        set({
          token: null,
          refreshToken: null,
          user: null,
          roles: [],
          permissions: [],
          mfaPending: false,
          mfaEmail: null,
          error: null,
        });

        localStorage.removeItem('activeRole');
        localStorage.removeItem('mustChangePassword');

        if (notifyCrossTab) {
          broadcastAuthEvent('LOGOUT', { reason });
        }

        try {
          const { axiosPrivate } = await import('../api/axios');
          await axiosPrivate.post(
            '/auth/logout',
            inMemoryRefreshToken ? { refreshToken: inMemoryRefreshToken } : {},
            { withCredentials: true }
          );
        } catch (_err) {
          // Ignore backend errors during logout
        }
      },

      clearStaleToken: () => {
        const { token } = get();
        if (token && !isTokenValid(token)) {
          set({ token: null, refreshToken: null, user: null, roles: [], permissions: [] });
        }
      },

      isAuthenticated: () => {
        const { token } = get();
        return isTokenValid(token);
      },

      hasRole: (role) => get().roles.includes(role),
      hasPermission: (perm) => get().permissions.includes(perm),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        roles: state.roles,
        permissions: state.permissions,
      }),
    }
  )
);

// Subscribe to multi-tab logout events
if (typeof window !== 'undefined') {
  subscribeAuthEvents((reason) => {
    const state = useAuthStore.getState();
    if (state.token) {
      useAuthStore.setState({
        token: null,
        refreshToken: null,
        user: null,
        roles: [],
        permissions: [],
        sessionExpiredNotice: reason || 'You were logged out from another tab.',
      });
    }
  });
}

export default useAuthStore;

