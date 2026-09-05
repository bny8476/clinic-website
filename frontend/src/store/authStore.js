import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Decodes a JWT payload segment from base64url to a plain object.
 *
 * WHY: JWT payloads use base64url encoding (RFC 4648 §5) which replaces
 * '+' → '-' and '/' → '_' and omits '=' padding. The browser's native
 * `atob()` only understands standard base64 and throws InvalidCharacterError
 * on any token whose raw payload bytes map to '+' or '/' characters.
 * This function normalises the alphabet and restores padding before decoding.
 *
 * NOTE — SECURITY TRADEOFF (localStorage):
 * The token is persisted via Zustand's `persist` middleware to localStorage.
 * This is convenient but means an XSS vulnerability could steal the token.
 * The alternative is an httpOnly cookie set by the backend, which is
 * inaccessible to JavaScript and therefore XSS-resistant. We accept
 * localStorage here because: (a) the frontend has a strict CSP, (b) the
 * access-token lifetime is short (15 minutes), and (c) implementing
 * cookie-based auth would require CSRF protection as a new trade-off.
 * If XSS posture changes, migrate to httpOnly cookies on the backend.
 */
export function parseJwtPayload(token) {
  const base64url = token.split('.')[1];
  if (!base64url) throw new Error('Malformed JWT: missing payload segment');

  // Normalise base64url → standard base64
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

/**
 * Returns true only if the JWT token exists and hasn't expired yet.
 * Gives a 30-second buffer to account for clock skew.
 */
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = parseJwtPayload(token);
    if (!exp) return false;
    return (exp * 1000) > (Date.now() + 30_000); // 30-sec buffer
  } catch {
    return false;
  }
}

const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            roles: [],
            mfaPending: false,
            mfaEmail: null,
            error: null,
            isLoading: false,

            login: async (portal, email, password) => {
                set({ isLoading: true, error: null });
                try {
                    // Avoid circular dependency by dynamically importing axiosPublic
                    const { axiosPublic } = await import('../api/axios');
                    const res = await axiosPublic.post(`/auth/${portal}/login`, { email, password });
                    
                    if (res.data.mfaRequired) {
                        set({ mfaPending: true, mfaEmail: res.data.email, isLoading: false });
                        return false; // MFA needed
                    }
                    
                    const { token, refreshToken } = res.data;
                    const parsedToken = parseJwtPayload(token);
                    set({ 
                        token, 
                        refreshToken: refreshToken || null,
                        roles: parsedToken.roles || [],
                        user: { id: parsedToken.userId, email: parsedToken.sub },
                        mfaPending: false,
                        isLoading: false 
                    });
                    return true;
                } catch (err) {
                    set({ error: err.response?.data || 'Login failed', isLoading: false });
                    return false;
                }
            },
            
            verifyMfa: async (portal, email, otp) => {
                set({ isLoading: true, error: null });
                try {
                    const { axiosPublic } = await import('../api/axios');
                    const res = await axiosPublic.post(`/auth/${portal}/login/mfa`, { email, otp });
                    
                    const { token, refreshToken } = res.data;
                    const parsedToken = parseJwtPayload(token);
                    set({ 
                        token, 
                        refreshToken: refreshToken || null,
                        roles: parsedToken.roles || [],
                        user: { id: parsedToken.userId, email: parsedToken.sub },
                        mfaPending: false,
                        mfaEmail: null,
                        isLoading: false 
                    });
                    return true;
                } catch (err) {
                    set({ error: err.response?.data || 'Invalid OTP', isLoading: false });
                    return false;
                }
            },

            refresh: async () => {
                try {
                    const { axiosPublic } = await import('../api/axios');
                    const state = useAuthStore.getState();
                    const inMemoryRefreshToken = state.refreshToken;

                    // Pass refresh token via body if available in memory, and withCredentials for HttpOnly cookie support
                    const res = await axiosPublic.post(
                        `/auth/refresh`,
                        inMemoryRefreshToken ? { refreshToken: inMemoryRefreshToken } : {},
                        { withCredentials: true }
                    );

                    const newAccessToken = res.data.accessToken;
                    const newRefreshToken = res.data.refreshToken || inMemoryRefreshToken;

                    set({ token: newAccessToken, refreshToken: newRefreshToken || null });
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
                    set({ error: err.response?.data || 'Failed to send reset code', isLoading: false });
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
                    set({ error: err.response?.data || 'Failed to reset password', isLoading: false });
                    return false;
                }
            },

            clearError: () => set({ error: null }),
            logout: async () => {
                const inMemoryRefreshToken = useAuthStore.getState().refreshToken;
                set({ token: null, refreshToken: null, user: null, roles: [], mfaPending: false, mfaEmail: null, error: null });
                try {
                    const { axiosPrivate } = await import('../api/axios');
                    await axiosPrivate.post('/auth/logout', inMemoryRefreshToken ? { refreshToken: inMemoryRefreshToken } : {}, { withCredentials: true });
                } catch (err) {
                    // Ignore errors if backend session is already dead or network fails
                }
            },
            // Clears any stale/expired token from storage without full logout UI
            clearStaleToken: () => {
                const { token } = useAuthStore.getState();
                if (token && !isTokenValid(token)) {
                    set({ token: null, refreshToken: null, user: null, roles: [] });
                }
            },
            isAuthenticated: () => {
                const { token } = useAuthStore.getState();
                return isTokenValid(token);
            },
            hasRole: (role) => useAuthStore.getState().roles.includes(role),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                roles: state.roles,
            }),
        }
    )
);

export default useAuthStore;
