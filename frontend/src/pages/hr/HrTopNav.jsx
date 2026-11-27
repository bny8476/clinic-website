import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  BarChart3
} from 'lucide-react';

export default function HrTopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/hr/dashboard' },
    { id: 'employees', label: 'Employees', icon: Users, path: '/hr/employees' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, path: '/hr/attendance' },
    { id: 'leave', label: 'Leave', icon: Clock, path: '/hr/leave' },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, path: '/hr/payroll' },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase, path: '/hr/recruitment' },
    { id: 'documents', label: 'Documents', icon: FileText, path: '/hr/documents' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/hr/reports' }
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="flex w-fit max-w-full items-center gap-1 sm:gap-1.5 bg-white p-1.5 rounded-2xl shadow-2xs border border-slate-200/80 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path === '/hr/dashboard'
            ? location.pathname === '/hr/dashboard' || location.pathname === '/hr' || location.pathname === '/hr/'
            : location.pathname.startsWith(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#2864FF] text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
