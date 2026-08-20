import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/pharmacy/cn';
import * as LucideIcons from 'lucide-react';

export default function DashboardGrid({ tiles = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPanel = searchParams.get('panel');

  // List of paths that should open in a panel instead of standard navigation
  const panelRoutes = {
    '/doctor/queue': 'queue',
    '/doctor/calendar': 'calendar',
    '/doctor/follow-ups': 'follow-ups',
    '/doctor/patients': 'patients'
  };

  const handleTileClick = (e, path) => {
    // Check if this path maps to a panel
    const panelName = panelRoutes[path];
    if (panelName) {
      e.preventDefault();
      // Ensure we are on the dashboard root before opening the panel
      // If we are already on a nested page (e.g. /doctor/settings), navigate to dashboard + panel
      const dashboardPath = tiles.length > 0 ? tiles[0].path : '/doctor/dashboard';
      navigate(`${dashboardPath}?panel=${panelName}`);
    }
  };

  return (
    <div className="bg-white dark:bg-[#101830] border-b border-gray-200 dark:border-[#1A263E] w-full overflow-x-auto scrollbar-hide shadow-sm sticky top-16 z-20 transition-colors duration-200">
      <div className="flex mx-auto max-w-7xl px-4 sm:px-6">
        {tiles.map((tile) => {
          const path = tile.path || '/';
          const panelName = panelRoutes[path];
          
          // A tile is active if:
          // 1. Its panel is currently open in the URL params
          // 2. OR it has no panel mapping and its route matches the current location
          let isActive = false;
          if (panelName && currentPanel === panelName) {
            isActive = true;
          } else if (!currentPanel) {
             isActive = location.pathname === path || 
              (path !== '/' && location.pathname.startsWith(`${path}/`)) ||
              (path === '/' && location.pathname.startsWith('/dashboard'));
          }
            
          const Icon = typeof tile.icon === 'string' ? LucideIcons[tile.icon] : tile.icon;
          const label = tile.label || tile.name;
          
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => handleTileClick(e, path)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-4 min-w-max transition-colors outline-none",
                isActive ? "text-[#D4AF37]" : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1A263E]"
              )}
            >
              {Icon && (
                <Icon size={18} className={isActive ? "text-[#D4AF37]" : "text-slate-400"} />
              )}
              <span className={cn(
                "text-sm font-semibold tracking-wide",
                isActive ? "text-[#D4AF37]" : ""
              )}>
                {label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
