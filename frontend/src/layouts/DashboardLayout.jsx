import React, { useState } from 'react';
import useAuthStore, { isTokenValid, extractRoles } from '../store/authStore';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import NotificationBell from '../components/NotificationBell';
import ActivityDropdown from '../components/ActivityDropdown';
import MessageDropdown from '../components/pharmacy/layout/MessageDropdown';
import CommandPalette from '../components/ui/CommandPalette';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../api/axios';
import { getPortalConfig } from '../config/portalConfig';
import { ArrowLeft, Bell, ChevronDown, LogOut, Search, ShieldPlus, Stethoscope, Zap } from 'lucide-react';

const DashboardLayout = ({ portalSlug, allowedRoles }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { token, user, roles = [], logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/notifications/unread-count');
        return res.data;
      } catch (err) {
        return { count: 0 };
      }
    },
    enabled: !!user?.id && isTokenValid(token),
    retry: false,
    refetchInterval: 30000 // Poll every 30s
  });
  const unreadCount = unreadCountData?.count || 0;

  if (!isTokenValid(token)) return <Navigate to="/login" replace />;
  const userRoles = extractRoles(roles);
  const normalizedUserRoles = userRoles.map(r => r.toUpperCase().replace(/^ROLE_/, ''));

  const hasPermission = userRoles.includes('ROLE_ADMIN') || 
                        userRoles.includes('ROLE_SUPER_ADMIN') ||
                        normalizedUserRoles.includes('ADMIN') ||
                        normalizedUserRoles.includes('SUPER_ADMIN') ||
                        !allowedRoles ||
                        allowedRoles.length === 0 ||
                        allowedRoles.some((r) => {
                          if (typeof r !== 'string') return false;
                          const normReq = r.toUpperCase().replace(/^ROLE_/, '');
                          return userRoles.includes(r) || (normReq && normalizedUserRoles.includes(normReq));
                        });

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const portalConfig = getPortalConfig(portalSlug);
  const { displayName, dashboardTiles = [] } = portalConfig;

  const userName = user?.email?.split('@')[0] || 'John Smith';
  const displayTitle = displayName || 'Doctor';

  return (
    <ErrorBoundary>
    <div className="h-screen overflow-hidden bg-[var(--color-bg-app)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-[var(--color-surface)] border-b border-slate-200 sticky top-0 z-50 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            {location.pathname !== `/${portalSlug}/dashboard` && location.pathname !== `/${portalSlug}/dashboard/` && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 mr-1 hover:bg-slate-100 rounded-full text-slate-600 transition flex items-center justify-center cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <Link to={`/${portalSlug}/dashboard`} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-navy-800)] rounded-xl flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90 transition">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--color-navy-900)] leading-none cursor-pointer hover:opacity-80 transition">ELIXIR HEALTH CARE</h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                  {portalSlug ? `${portalSlug.charAt(0).toUpperCase() + portalSlug.slice(1)} Portal` : 'Portal'}
                </p>
              </div>
            </Link>
          </div>


          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-12 hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="text"
                readOnly
                onClick={() => setIsSearchOpen(true)} 
                placeholder={portalSlug === 'patient' ? "Search health records, vitals, appointments..." : "Search patients, appointments, reports..."}
                className="block w-full pl-10 pr-12 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-input-bg)] text-sm focus:ring-[var(--color-navy-600)] focus:border-[var(--color-navy-600)] text-[var(--color-text)] placeholder-slate-400 cursor-pointer hover:bg-[var(--color-surface-alt)] transition-colors"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-medium">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-slate-500">
              <NotificationBell />

              <MessageDropdown />
              <ActivityDropdown />
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <img loading="lazy" 
                alt="User Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs" 
                src={portalSlug === 'patient' 
                  ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
                  : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150"} 
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {portalSlug === 'patient' ? `Mr. ${userName}` : (userRoles.includes('ROLE_DOCTOR') ? `Dr. ${userName}` : userName)}
                </p>
                <p className="text-xs text-slate-400">
                  {portalSlug === 'patient' ? 'Patient ID: AH-9821' : displayTitle}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              <button 
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-red-600 transition ml-1 cursor-pointer"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal Nav Bar Removed as requested */}
      
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Main Content Area */}
      <main
        className={`flex-1 w-full flex flex-col overflow-x-hidden overflow-y-auto relative`}
      >
        <div key={location.pathname} className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
};

export default DashboardLayout;
