import { useLocation, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getPortalConfig } from '../../config/portalConfig';

export default function RoleRoute({ portalSlug, allowedRoles, children }) {
    const { token, roles = [] } = useAuthStore();
    const location = useLocation();

    // Let Axios interceptors handle expired tokens and refresh them.
    // Only redirect if there is absolutely no token (user intentionally logged out or cleared storage).
    if (!token) {
        return <Navigate to={`/${portalSlug || 'patient'}/login`} state={{ from: location }} replace />;
    }

    const portalConfig = getPortalConfig(portalSlug);
    const targetRoles = allowedRoles || (portalConfig.role ? [portalConfig.role, 'ROLE_SUPER_ADMIN'] : []);

    const userRoles = roles || [];

    /**
     * INTENTIONAL ADMIN BYPASS
     * ─────────────────────────────────────────────────────────────────────────
     * ROLE_ADMIN and ROLE_SUPER_ADMIN are granted access to every portal route
     * regardless of the `allowedRoles` prop passed in. This is by design:
     * super-users need unrestricted access across all portals for support,
     * auditing, and emergency overrides without being listed in each route's
     * allowedRoles array individually.
     *
     * If this bypass should ever be restricted (e.g. ROLE_ADMIN should NOT
     * access the pharmacy or finance portal), remove the first two conditions
     * below and add ROLE_ADMIN explicitly only to the specific allowedRoles
     * arrays in App.jsx instead.
     * ─────────────────────────────────────────────────────────────────────────
     */
    const hasPermission = userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN') || (targetRoles.length === 0) || targetRoles.some(r => userRoles.includes(r));

    if (!hasPermission) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
