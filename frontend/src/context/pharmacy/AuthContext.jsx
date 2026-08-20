import { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import logger from '../../utils/logger';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../config/pharmacy/roles.config';
import { axiosPublic, axiosPrivate } from '../../api/axios';

const AuthContext = createContext();

const ROLE_PRIORITY = [
  ROLES.SYSTEM_ADMIN,
  ROLES.SUPERVISOR,
  ROLES.SENIOR_MEDICAL_STAFF,
  ROLES.MEDICAL_STAFF,
  ROLES.BILLING_STAFF,
  ROLES.PHARMACY_STAFF,
  ROLES.RECEPTIONIST,
  ROLES.AUDIT_COMPLIANCE,
  ROLES.LAB_TECHNICIAN,
  ROLES.STOREKEEPER
];

export function AuthProvider({ children }) {
  const store = useAuthStore();
  
  // Local state for features not in authStore
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('activeRole'));
  const [mustChangePassword, setMustChangePassword] = useState(() => localStorage.getItem('mustChangePassword') === 'true');

  const getHighestPriorityRole = useCallback((roles) => {
    if (!roles || roles.length === 0) return null;
    const normalizedRoles = roles.map(r => {
      if (typeof r !== 'string') return '';
      let normalized = r.replace('ROLE_', '').replace(/ /g, '_').toUpperCase();
      if (normalized === 'ADMIN') return ROLES.SYSTEM_ADMIN;
      return normalized;
    });
    for (const role of ROLE_PRIORITY) {
      if (normalizedRoles.includes(role)) return role;
    }
    return normalizedRoles[0];
  }, []);

  useEffect(() => {
    // If auth state changes in the store, sync local state
    if (store.roles && store.roles.length > 0) {
      if (!activeRole || !store.roles.includes(activeRole)) {
        const primary = getHighestPriorityRole(store.roles) || store.roles[0];
        setActiveRole(primary);
        localStorage.setItem('activeRole', primary);
      }
    } else {
      setActiveRole(null);
      localStorage.removeItem('activeRole');
    }
  }, [store.roles, activeRole, getHighestPriorityRole]);

  const login = useCallback(async (username, password) => {
    try {
      // We explicitly call the pharmacy endpoint, using the old payload to ensure it works
      const response = await axiosPublic.post('/auth/pharmacy/login', { email: username, password });
      const data = response.data.data ? response.data.data : response.data;
      
      const { token, refreshToken } = data;
      const mustChange = data.mustChangePassword === true;
      
      let rolesArray = [];
      const legacyMap = {
        'ADMIN':         'SYSTEM_ADMIN',
        'MEDICINE_USER': 'PHARMACY_STAFF',
        'BILLING_USER':  'BILLING_STAFF',
        'PURCHASE_USER': 'STOREKEEPER',
        'ADMIN_USER':    'SYSTEM_ADMIN',
      };

      if (Array.isArray(data.roles) && data.roles.length > 0) {
        rolesArray = data.roles.map(r => {
          const stripped = r.replace(/^ROLE_/, '');
          return legacyMap[stripped] || stripped;
        });
      } else if (data.role && typeof data.role === 'string') {
        const stripped = data.role.replace(/^ROLE_/, '');
        rolesArray = [legacyMap[stripped] || stripped];
      } else {
        rolesArray = ['SYSTEM_ADMIN'];
      }

      // Manually set authStore to avoid double POST to login
      useAuthStore.setState({ 
          token, 
          refreshToken: refreshToken || null, 
          roles: rolesArray,
          user: { 
              id: data.id || data.userId, 
              name: data.name || data.username, 
              username: data.username,
              email: data.email || '', 
              branch: data.branch || 'Main Branch',
              roles: rolesArray
          },
          mfaPending: false,
          isLoading: false,
          error: null
      });

      const primary = getHighestPriorityRole(rolesArray) || rolesArray[0];
      setActiveRole(primary);
      localStorage.setItem('activeRole', primary);
      
      setMustChangePassword(mustChange);
      localStorage.setItem('mustChangePassword', mustChange ? 'true' : 'false');

      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      logger.error('AuthContext: Login failed', error);
      throw new Error(message);
    }
  }, [getHighestPriorityRole]);

  const logout = useCallback(async () => {
    if (store.token) {
      try { await axiosPrivate.post('/auth/logout', { refreshToken: store.refreshToken }); } catch (err) {}
    }
    store.logout();
    setActiveRole(null);
    setMustChangePassword(false);
    localStorage.removeItem('activeRole');
    localStorage.removeItem('mustChangePassword');
  }, [store]);

  const switchRole = useCallback((role) => {
    if (store.roles.includes(role)) {
      setActiveRole(role);
      localStorage.setItem('activeRole', role);
    }
  }, [store.roles]);

  const updateMustChangePassword = useCallback((value) => {
    setMustChangePassword(value);
    localStorage.setItem('mustChangePassword', value ? 'true' : 'false');
  }, []);

  // useAuthStore doesn't expose isAuthenticated as a boolean state, it exposes it as a method.
  // We can derive it here:
  const isAuth = !!store.token && store.isAuthenticated();

  const contextValue = useMemo(() => ({
    user: store.user,
    roles: store.roles,
    activeRole,
    mustChangePassword,
    isAuthenticated: isAuth,
    loading: store.isLoading,
    login,
    logout,
    switchRole,
    updateMustChangePassword
  }), [
    store.user, store.roles, activeRole, mustChangePassword, 
    isAuth, store.isLoading, login, logout, switchRole, updateMustChangePassword
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
