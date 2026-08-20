import logger from '../../../utils/logger';
import { useAuth } from '../../../context/pharmacy/AuthContext';
import { ROLES, DASHBOARD_ROUTES, getBaseRoleForUI } from '../../../config/pharmacy/roles.config';

export default function RoleGuard({ allowedRoles, children, fallback }) {
  const { user, activeRole, roles, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Check if ANY of the user's roles is in the allowedRoles list
  const userRoles = roles || (activeRole ? [activeRole] : []);
  const hasAccess = userRoles.some(r => allowedRoles.includes(r) || allowedRoles.includes(getBaseRoleForUI(r)));

  // SYSTEM_ADMIN always has full access
  if (userRoles.includes(ROLES.SYSTEM_ADMIN)) {
    return children || <Outlet />;
  }

  if (hasAccess) {
    return children || <Outlet />;
  }

  // If user is authenticated but not authorized for this specific route,
  // redirect them to their active role's dashboard or a fallback
  if (user) {
    const fallbackRoute = fallback || DASHBOARD_ROUTES[getBaseRoleForUI(activeRole)] || '/dashboard/pharmacy';
    logger.warn('RoleGuard: Access denied.', 'User roles:', userRoles, 'Required:', allowedRoles);
    
    // Guard against infinite redirect if already at fallback
    if (window.location.pathname === fallbackRoute) {
      return <div className="p-8 text-red-500">Access Denied. You do not have permission to view this page.</div>;
    }
    
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Navigate to="/login" replace />;
}
