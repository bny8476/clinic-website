import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../../store/authStore';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    {
      label: "Profile",
      href: "/pharmacy/profile-settings",
      icon: <User className="h-4 w-4" />,
    },
    {
      label: "Settings",
      href: "/pharmacy/profile-settings",
      icon: <Settings className="h-4 w-4" />,
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=e0e7ff&color=2563eb&rounded=true&bold=true`} 
          className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" 
          alt="User" 
        />
        <div className="hidden sm:block text-right">
          <p className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{user?.username || 'User'}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{user?.roles?.[0]?.replace('ROLE_', '') || 'User'}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 hidden sm:block ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-slate-200/60 bg-white p-2 shadow-xl shadow-slate-900/5 backdrop-blur-sm z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="group flex cursor-pointer items-center rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-slate-200/50 hover:bg-slate-100/80 hover:shadow-sm"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="text-slate-500 group-hover:text-slate-700 transition-colors">
                    {item.icon}
                  </div>
                  <span className="whitespace-nowrap font-medium text-sm text-slate-900 leading-tight tracking-tight transition-colors group-hover:text-slate-950">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-red-500/10 p-3 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/20 hover:shadow-sm"
            type="button"
          >
            <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
            <span className="font-medium text-red-500 text-sm group-hover:text-red-600 transition-colors">
              Sign Out
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
