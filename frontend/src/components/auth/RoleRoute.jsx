import useAuthStore, { isTokenValid, extractRoles } from '../../store/authStore';
import { Navigate, useLocation } from 'react-router-dom';
import { getPortalConfig } from '../../config/portalConfig';
import PageLoadingSkeleton from '../ui/PageLoadingSkeleton';

export default function RoleRoute({ portalSlug, allowedRoles, children }) {
    const { token, roles = [], isInitializingAuth } = useAuthStore();
    const location = useLocation();

    // 1. Show skeleton while restoring session on page load
    if (isInitializingAuth) {
        return <PageLoadingSkeleton message="Checking your secure session..." />;
    }

    // 2. Unauthenticated -> redirect to unified /login with returnTo parameter
    if (!token) {
        const returnToParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnTo=${returnToParam}`} state={{ from: location }} replace />;
    }

    const portalConfig = portalSlug ? getPortalConfig(portalSlug) : {};
    const targetRoles = allowedRoles || (portalConfig.role ? [portalConfig.role, 'ROLE_SUPER_ADMIN'] : []);
    const userRoles = extractRoles(roles);

    // Normalise role matching (support both ROLE_ADMIN and ADMIN strings)
    const normalizedUserRoles = userRoles.map(r => r.toUpperCase().replace(/^ROLE_/, ''));

    const hasPermission =
        userRoles.includes('ROLE_ADMIN') ||
        userRoles.includes('ROLE_SUPER_ADMIN') ||
        normalizedUserRoles.includes('ADMIN') ||
        normalizedUserRoles.includes('SUPER_ADMIN') ||
        targetRoles.length === 0 ||
        targetRoles.some(r => {
            if (typeof r !== 'string') return false;
            const normReq = r.toUpperCase().replace(/^ROLE_/, '');
            return userRoles.includes(r) || normalizedUserRoles.includes(normReq);
        });

    // 3. Authenticated but unauthorized -> redirect to 403 page without logging out
    if (!hasPermission) {
        return <Navigate to="/403" replace />;
    }

    return children;
}
