import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Users,
  Calendar,
  FileSignature,
  DollarSign,
  Briefcase,
  FileText
} from 'lucide-react';

export default function HrTopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navTabs = [
    { id: 'dashboard', label: 'Command Center', icon: Activity, path: '/hr/dashboard' },
    { id: 'employees', label: 'Staff Directory', icon: Users, path: '/hr/employees' },
    { id: 'attendance', label: 'Attendance & Shifts', icon: Calendar, path: '/hr/attendance' },
    { id: 'leave', label: 'Leave Requests', icon: FileSignature, path: '/hr/leave' },
    { id: 'payroll', label: 'Payroll Processing', icon: DollarSign, path: '/hr/payroll' },
    { id: 'recruitment', label: 'Recruitment & Jobs', icon: Briefcase, path: '/hr/recruitment' },
    { id: 'documents', label: 'Staff Documents', icon: FileText, path: '/hr/documents' }
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="flex w-fit max-w-full items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-2xs border border-slate-200/80 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path === '/hr/dashboard'
            ? location.pathname === '/hr/dashboard' || location.pathname === '/hr' || location.pathname === '/hr/'
            : location.pathname.startsWith(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer shrink-0 ${
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
