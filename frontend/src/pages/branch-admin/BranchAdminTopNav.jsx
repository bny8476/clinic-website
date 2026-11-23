import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2
} from 'lucide-react';

export default function BranchAdminTopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navTabs = [
    { id: 'analytics', label: 'Analytics & Performance', icon: BarChart3, path: '/branch-admin/analytics' },
    { id: 'staff', label: 'Staff & Local HR', icon: Users, path: '/branch-admin/staff' },
    { id: 'facilities', label: 'Facilities & Infrastructure', icon: Building2, path: '/branch-admin/facilities' }
  ];

  return (
    <div className="w-full flex justify-center mb-6">
      <div className="flex w-fit max-w-full items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-2xs border border-slate-200/80 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) ||
            (tab.path === '/branch-admin/analytics' && (location.pathname === '/branch-admin' || location.pathname === '/branch-admin/'));

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#2864FF] text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
