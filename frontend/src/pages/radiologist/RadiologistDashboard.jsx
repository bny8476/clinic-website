import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Focus, Search, Filter, AlertCircle, CheckCircle2, Image as ImageIcon, Inbox, Plus, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const RadiologistDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['radiology-requests-dashboard'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/requests');
      return res.data;
    },
    refetchInterval: 30000
  });

  const pendingCount = requests.filter(r => r.status === 'REQUESTED' || r.status === 'SCHEDULED').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  const tabs = [
    { id: 'ALL', label: 'ALL' },
    { id: 'REQUESTED', label: 'REQUESTED' },
    { id: 'SCHEDULED', label: 'SCHEDULED' },
    { id: 'COMPLETED', label: 'COMPLETED' },
  ];

  return (
    <div className="p-6 w-full min-h-full bg-[#F8FAFF]">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        {tabs.map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm border ${
                isActive
                  ? 'bg-[#2864FF] text-white border-[#2864FF]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
          <Focus className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
        </div>
        <div className="pt-1">
          <h1 className="text-3xl font-bold text-slate-900">Radiology & PACS Workstation</h1>
          <p className="text-gray-500 mt-2 font-medium text-[15px]">Imaging procedure management, DICOM study review, and diagnostic report generation.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
          {/* KPI 1 */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-[20px] flex items-center justify-center shrink-0">
                <AlertCircle className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                <p className="text-4xl font-bold text-orange-500 leading-none">{pendingCount}</p>
            </div>
          </div>
          
          {/* KPI 2 */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-[20px] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Completed</p>
                <p className="text-4xl font-bold text-green-500 leading-none">{completedCount}</p>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-[#F4F7FF] text-[#2864FF] rounded-[20px] flex items-center justify-center shrink-0">
                <ImageIcon className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Archived</p>
                <p className="text-4xl font-bold text-[#2864FF] leading-none">0</p>
            </div>
          </div>
        </div>

        {/* Right Column / Main Area */}
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[500px]">
            {/* Top Toolbar */}
            <div className="flex items-center gap-4 mb-16 relative z-10">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search imaging studies..." 
                        className="w-full bg-[#F8FAFF] text-[15px] text-gray-700 font-medium rounded-2xl pl-12 pr-4 py-4 outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-gray-200 text-gray-700 text-[15px] font-semibold hover:bg-gray-50 transition-colors bg-white">
                    <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                </button>
            </div>

            {/* Empty State */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-10">
                {/* Custom Tray SVG */}
                <div className="w-44 h-44 bg-[#F8FAFF] rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-[#EBF0FF] rounded-full animate-ping opacity-20"></div>
                    
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-[#2864FF] z-10" style={{ filter: 'drop-shadow(0px 10px 10px rgba(40, 100, 255, 0.25))' }}>
                        <defs>
                            <linearGradient id="trayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#608FFF" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="#2864FF" />
                            </linearGradient>
                            <linearGradient id="trayBack" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#A0C0FF" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#608FFF" stopOpacity="0.9" />
                            </linearGradient>
                        </defs>
                        {/* Tray Back */}
                        <path d="M 15 45 L 25 20 L 75 20 L 85 45 Z" fill="url(#trayBack)" />
                        {/* Tray Front */}
                        <path d="M 10 45 L 90 45 L 90 75 Q 90 85 80 85 L 20 85 Q 10 85 10 75 Z" fill="url(#trayGrad)" />
                        <path d="M 35 45 L 35 55 Q 50 65 65 55 L 65 45 Z" fill="#F8FAFF" />
                    </svg>

                    {/* Decorative dots */}
                    <div className="absolute top-6 right-6 w-3 h-3 bg-blue-200 rounded-full"></div>
                    <div className="absolute bottom-8 left-2 w-2.5 h-2.5 bg-blue-200 rounded-full"></div>
                    <div className="absolute top-4 left-10 w-2 h-2 bg-blue-100 rounded-full"></div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    No radiology requests found
                </h3>
                <p className="text-gray-500 text-[15px] mb-8 font-medium">
                    There are no entries to display at this time.
                </p>
                <button className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/30">
                    <Plus className="w-5 h-5" /> New Radiology Request
                </button>
            </div>

            {/* Decorative Dot Patterns */}
            <div className="absolute right-0 top-1/3 opacity-20 pointer-events-none">
                <svg width="120" height="240" viewBox="0 0 120 240">
                    <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle fill="#2864FF" cx="2" cy="2" r="1.5"></circle>
                    </pattern>
                    <rect x="0" y="0" width="120" height="240" fill="url(#dots)"></rect>
                </svg>
            </div>
            <div className="absolute left-0 bottom-0 opacity-20 pointer-events-none">
                <svg width="150" height="120" viewBox="0 0 150 120">
                    <pattern id="dots2" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle fill="#2864FF" cx="2" cy="2" r="1.5"></circle>
                    </pattern>
                    <rect x="0" y="0" width="150" height="120" fill="url(#dots2)"></rect>
                </svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologistDashboard;
