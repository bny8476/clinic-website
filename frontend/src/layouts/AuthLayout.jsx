import { useState } from 'react';
import { useLocation, Navigate, Link, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import NotificationBell from '../components/notifications/NotificationBell';

import './AuthLayout.css';

const AuthLayout = ({ allowedRoles }) => {
    const { token, user, roles, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.some(role => roles.includes(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const NavLinkItem = ({ to, label, exact = false }) => {
        const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
        return (
            <Link to={to} className={`portal-nav-link relative ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                {isActive && (
                    <motion.div
                        layoutId="activeNavAuth"
                        className="absolute inset-0 bg-blue-50 border-l-4 border-blue-600 z-[-1]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                <span className="relative z-10">{label}</span>
            </Link>
        );
    };

    // Determine initials for avatar
    const initial = user?.email ? user.email.substring(0, 1).toUpperCase() : 'U';
    const roleLabel = roles.includes('ROLE_ADMIN') ? 'Administrator' : roles.includes('ROLE_DOCTOR') ? 'Physician' : 'Patient';

    // Determine current page title
    let pageTitle = "Portal";
    if (location.pathname.includes('dashboard')) pageTitle = "Dashboard";
    else if (location.pathname.includes('profile')) pageTitle = "My Profile";
    else if (location.pathname.includes('branch')) pageTitle = "Branches";
    else if (location.pathname.includes('users')) pageTitle = "Users";
    else if (location.pathname.includes('analytics')) pageTitle = "Analytics";

    return (
        <ErrorBoundary>
            <div className="portal-layout">
            {/* Mobile Overlay */}
            <div className={`portal-overlay ${sidebarOpen ? 'is-open' : ''}`} onClick={closeSidebar}></div>

            {/* Sidebar */}
            <aside className={`portal-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
                <div className="portal-brand">
                    <div className="portal-brand-dot"></div>
                    <h2 className="portal-brand-text">Aurelian Health</h2>
                </div>
                
                <nav className="portal-nav">
                    {roles.includes('ROLE_ADMIN') && (
                        <>
                            <NavLinkItem to="/admin/dashboard" label="Dashboard" />
                        </>
                    )}
                    {roles.includes('ROLE_DOCTOR') && (
                        <>
                            <NavLinkItem to="/doctor/dashboard" label="Dashboard" />
                            {/* Stub for future Today's Queue specific route if needed, currently on dashboard */}
                        </>
                    )}
                    {roles.includes('ROLE_PATIENT') && (
                        <>
                            <NavLinkItem to="/patient/dashboard" label="Dashboard" />
                            <NavLinkItem to="/patient/profile-edit" label="My Profile" />
                            {/* Assuming book appointment goes back to doctors list or a specific booking page */}
                            <NavLinkItem to="/doctors" label="Book Appointment" />
                        </>
                    )}
                </nav>

                <div className="portal-user-context">
                    <div className="portal-user-info">
                        <div className="portal-user-avatar">{initial}</div>
                        <div className="portal-user-details">
                            <span className="portal-user-name">{user?.email?.split('@')[0] || 'User'}</span>
                            <span className="portal-user-role label-caps">{roleLabel}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="portal-main">
                <header className="portal-topbar">
                    <button className="portal-mobile-toggle" onClick={toggleSidebar}>
                        <Menu aria-hidden="true" size={24} />
                    </button>
                    <div className="portal-page-titles">
                        <h1 className="portal-page-title">{pageTitle}</h1>
                        <p className="portal-page-subtitle">Aurelian Health / {roleLabel}</p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <NotificationBell />
                    </div>
                </header>
                <div className="portal-content relative">
                        <Outlet />
                </div>
            </main>
        </div>
        </ErrorBoundary>
    );
};

export default AuthLayout;
