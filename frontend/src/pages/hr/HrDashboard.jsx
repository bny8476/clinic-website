import React, { useState } from 'react';
import { Users, Calendar, FileText, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const HrDashboard = () => {
  const [activeTab, setActiveTab] = useState('employees');

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'leaves', label: 'Leaves', icon: FileText },
  ];

  return (
    <div className="p-6 w-full space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#2864FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 hover:bg-gray-50 border border-gray-100 bg-white'
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
              HR & Staff Operations
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-2">
            Manage your workforce efficiently with our HR tools.
          </p>
          <p className="text-gray-500">
            Access employee directory, track shift attendance, and streamline leave approvals.
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
              <linearGradient id="hr-card" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f8faff" stopOpacity="0.95" />
              </linearGradient>
              <filter id="hr-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.06" />
              </filter>
            </defs>
            <path d="M150 300 Q 250 100 450 300 Z" fill="url(#hr-grad)" />
            {/* Card 1 */}
            <g transform="translate(140, 50) rotate(-10)" filter="url(#hr-shadow)">
              <rect width="110" height="150" rx="16" fill="url(#hr-card)" />
              <circle cx="55" cy="45" r="22" fill="#EBF0FF" />
              <path d="M25 100 Q 55 75 85 100 L 85 120 L 25 120 Z" fill="#EBF0FF" />
              <rect x="25" y="130" width="60" height="6" rx="3" fill="#D3E0FF" />
            </g>
            {/* Card 2 */}
            <g transform="translate(210, 80) rotate(5)" filter="url(#hr-shadow)">
              <rect width="130" height="180" rx="16" fill="url(#hr-card)" />
              <circle cx="65" cy="55" r="26" fill="#D3E0FF" />
              <path d="M30 120 Q 65 85 100 120 L 100 140 L 30 140 Z" fill="#D3E0FF" />
              <rect x="30" y="150" width="70" height="8" rx="4" fill="#2864FF" fillOpacity="0.4" />
            </g>
          </svg>
        </div>
      </div>

      {/* Empty State */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-2 border-dashed border-blue-200 rounded-3xl p-16 flex flex-col items-center justify-center bg-gray-50/50"
      >
        <div className="w-20 h-20 bg-[#EBF0FF] rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-[#2864FF]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No data available
        </h3>
        <p className="text-gray-500">
          Select a module from above to get started.
        </p>
      </motion.div>
    </div>
  );
};

export default HrDashboard;
