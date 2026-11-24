import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../../utils/pharmacy/cn';
import { Menu } from 'lucide-react';

export default function Sidebar({ items = [], isOpen, setIsOpen }) {
  const location = useLocation();

  if (!items || items.length === 0) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/50 z-20 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside className={cn(
        "flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden font-sans transition-all duration-300 absolute lg:relative z-30 shadow-xl lg:shadow-none",
        isOpen ? "translate-x-0 w-72" : "-translate-x-full w-72 lg:translate-x-0 lg:w-0 lg:opacity-0"
      )}>
        <div className="w-72 flex flex-col h-full">
          {/* Top Header matching TopNav h-16 height */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl shrink-0 shadow-xs">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[13px] font-bold text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                  ELIXIR HEALTH CARE
                </span>
                <span className="text-[10px] font-semibold text-slate-400 leading-tight uppercase tracking-widest whitespace-nowrap mt-0.5">
                  Pharmacy
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto border-none bg-transparent"
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Scrollable independently) */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Main Modules</h2>
            <nav className="space-y-1">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/' && location.pathname.startsWith(`${item.path}/`)) ||
                               (item.path === '/' && location.pathname.startsWith('/dashboard'));
              
              return (
                <NavLink
                  key={index}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors group",
                    isActive 
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {Icon && <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />}
                  <span className="truncate">{item.label || item.name}</span>
                </NavLink>
              );
            })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
