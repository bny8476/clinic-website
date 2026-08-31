import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Calendar, FileText, UserPlus, ArrowRight, CheckCircle, Clock, Gift, FileSignature, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const HrDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users, path: '/hr/employees' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, path: '/hr/attendance' },
    { id: 'leaves', label: 'Leaves', icon: FileText, path: '/hr/leave' },
  ];

  return (
    <div className="p-6 w-full max-w-[1400px] mx-auto space-y-6">
      {/* Navigation Tabs - styling matched to user's screenshot */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-[#2864FF] text-white shadow-md shadow-blue-500/20 border border-transparent' 
                  : 'text-gray-600 hover:bg-gray-50 bg-white border border-transparent'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#F4F7FF] to-[#EBF0FF] rounded-3xl p-8 border border-blue-100/50">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <UserPlus className="w-6 h-6 text-[#2864FF]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              HR Command Center
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-2">
            Manage your workforce efficiently with real-time insights.
          </p>
          <p className="text-gray-500">
            Monitor attendance, process leaves, and run payroll all from one unified place.
          </p>
        </div>

        {/* Decorative SVG */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-80 pointer-events-none">
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2864FF" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#2864FF" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M150 300 Q 250 100 450 300 Z" fill="url(#hr-grad)" />
          </svg>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: '142', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Present Today', value: '128', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'On Leave', value: '14', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pending Approvals', value: '5', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((metric, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${metric.bg} ${metric.color}`}>
              <metric.icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{metric.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2864FF]" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => navigate('/hr/employees')} className="flex items-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl transition-all group text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5 text-[#2864FF]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Add New Employee</h3>
                <p className="text-xs text-gray-500 mt-0.5">Onboard a new staff member</p>
              </div>
            </button>
            <button onClick={() => navigate('/hr/leave')} className="flex items-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl transition-all group text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <FileSignature className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Review Leaves</h3>
                <p className="text-xs text-gray-500 mt-0.5">Approve or reject requests</p>
              </div>
            </button>
            <button onClick={() => navigate('/hr/attendance')} className="flex items-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl transition-all group text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Update Timesheets</h3>
                <p className="text-xs text-gray-500 mt-0.5">Manage daily attendance</p>
              </div>
            </button>
            <button onClick={() => navigate('/hr/payroll')} className="flex items-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl transition-all group text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Run Payroll</h3>
                <p className="text-xs text-gray-500 mt-0.5">Process monthly salaries</p>
              </div>
            </button>
          </div>
        </div>

        {/* Alerts & Upcoming */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Alerts & Upcoming</h2>
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
              <div className="mt-0.5 text-amber-500 bg-amber-50 p-2 rounded-lg"><Clock size={16} /></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">3 Pending Leaves</p>
                <p className="text-xs text-gray-500">Require approval by tomorrow</p>
              </div>
              <ArrowRight size={14} className="ml-auto mt-2 text-gray-400" />
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
              <div className="mt-0.5 text-purple-500 bg-purple-50 p-2 rounded-lg"><Gift size={16} /></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Dr. Smith's Birthday</p>
                <p className="text-xs text-gray-500">Tomorrow • Cardiology Dept</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
              <div className="mt-0.5 text-blue-500 bg-blue-50 p-2 rounded-lg"><UserPlus size={16} /></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">New Hire Onboarding</p>
                <p className="text-xs text-gray-500">Jane Doe starting next Monday</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 py-2.5 text-sm font-medium text-[#2864FF] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;
