import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Headset, HelpCircle, Clock, CheckCircle2, Search, Filter, Plus } from 'lucide-react';

const SupportDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({ 
    queryKey: ['support-tickets'], 
    queryFn: async () => (await axiosPrivate.get('/support/tickets')).data 
  });

  const openTicketsCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  const filteredTickets = filterStatus === 'ALL' ? tickets : tickets.filter(t => t.status === filterStatus);

  const TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans">
      {/* Top Filter Tabs */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-wrap gap-3">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-8 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all shadow-sm ${
              filterStatus === tab 
                ? 'bg-white text-[#2864FF] border-2 border-[#2864FF]' 
                : 'bg-white text-slate-500 border-2 border-transparent hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-8">
        
        {/* Left Column */}
        <div className="w-full xl:w-[400px] shrink-0 space-y-6">
          
          {/* Header Area */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-[14px] bg-[#F0F5FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
              <Headset className="w-6 h-6 text-[#2864FF]" />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold text-slate-900 mb-0.5 tracking-tight">Customer Support & Ticket Desk</h1>
              <p className="text-[13.5px] font-medium text-slate-500 leading-tight">Manage patient inquiries, support tickets, and chat threads.</p>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Open */}
            <div className="bg-white rounded-[16px] p-4 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <HelpCircle size={16} className="text-[#2864FF]" />
                 </div>
                 <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Open Tickets</span>
              </div>
              <div className="text-[26px] font-black text-[#2864FF]">{openTicketsCount}</div>
              <div className="absolute bottom-4 left-4 right-4 h-[3px] bg-[#2864FF] rounded-full opacity-50"></div>
            </div>

            {/* In Progress */}
            <div className="bg-white rounded-[16px] p-4 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Clock size={16} className="text-amber-500" />
                 </div>
                 <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">In_Progress</span>
              </div>
              <div className="text-[26px] font-black text-amber-500">{inProgressCount}</div>
              <div className="absolute bottom-4 left-4 right-4 h-[3px] bg-amber-500 rounded-full opacity-50"></div>
            </div>

            {/* Resolved */}
            <div className="bg-white rounded-[16px] p-4 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                 </div>
                 <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Resolved</span>
              </div>
              <div className="text-[26px] font-black text-emerald-500">{resolvedCount}</div>
              <div className="absolute bottom-4 left-4 right-4 h-[3px] bg-emerald-500 rounded-full opacity-50"></div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-[#F5F8FF] rounded-[24px] p-8 relative overflow-hidden border border-[#D0E2FF]/30">
            {/* Background decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E8F0FE] rounded-full opacity-60"></div>
            <div className="absolute top-20 left-10 w-4 h-4 border-2 border-[#D0E2FF] rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-3 h-3 bg-[#D0E2FF] rounded-full"></div>
            <div className="absolute top-10 left-5 w-2 h-2 bg-[#D0E2FF] rounded-full"></div>

            <div className="relative z-10 flex flex-col items-start">
              {/* Headset Illustration SVG */}
              <div className="w-[120px] h-[100px] mb-6 relative ml-4 mt-2">
                 <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <div className="absolute inset-0 bg-[#F0F5FF] rounded-full scale-[1.1] opacity-50 blur-[5px] -z-10 -translate-y-2 translate-x-2"></div>
                    
                    {/* Headband */}
                    <path d="M 30 60 C 30 20 90 20 90 60" stroke="#2864FF" strokeWidth="10" strokeLinecap="round" />
                    <path d="M 30 60 C 30 20 90 20 90 60" stroke="#5C8BFF" strokeWidth="5" strokeLinecap="round" />
                    {/* Left Earcup */}
                    <rect x="23" y="50" width="14" height="28" rx="7" fill="#2864FF" />
                    <rect x="25" y="54" width="5" height="20" rx="2.5" fill="#D0E2FF" />
                    {/* Right Earcup */}
                    <rect x="83" y="50" width="14" height="28" rx="7" fill="#2864FF" />
                    <rect x="89" y="54" width="5" height="20" rx="2.5" fill="#D0E2FF" />
                    {/* Mic boom */}
                    <path d="M 30 75 C 30 85 45 90 55 90" stroke="#5C8BFF" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <circle cx="55" cy="90" r="3.5" fill="#2864FF" />
                    
                    {/* Chat Bubble */}
                    <path d="M 85 35 C 85 20 120 20 120 35 C 120 50 85 50 85 50 L 95 35 Z" fill="white" stroke="#E8F0FE" strokeWidth="2" />
                    <circle cx="95" cy="35" r="2.5" fill="#2864FF" />
                    <circle cx="102" cy="35" r="2.5" fill="#2864FF" />
                    <circle cx="109" cy="35" r="2.5" fill="#2864FF" />
                 </svg>
              </div>

              <h3 className="text-[17px] font-extrabold text-slate-900 mb-2">We're here to help</h3>
              <p className="text-[12.5px] font-medium text-slate-500 mb-6 leading-relaxed max-w-[250px]">
                Create a new ticket, track updates, and get quick support.
              </p>
              
              <button className="bg-white border border-[#D0E2FF] text-[#2864FF] hover:bg-[#F0F5FF] hover:border-[#A6C8FF] px-6 py-2.5 rounded-[12px] font-bold text-[13px] flex items-center gap-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <Plus className="w-4 h-4" /> New Support Ticket
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (Main Content) */}
        <div className="flex-1">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 min-h-[700px] flex flex-col relative overflow-hidden">
            
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 relative z-20">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  className="w-full bg-[#F8FAFC] border border-slate-100 rounded-[12px] pl-11 pr-4 py-3 text-[14px] font-medium focus:ring-2 focus:ring-[#2864FF]/20 focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-[12px] hover:bg-slate-50 text-slate-700 font-bold text-[14px] transition-all w-full sm:w-auto justify-center">
                <Filter className="w-4 h-4" /> Filter <span className="text-[10px]">▼</span>
              </button>
            </div>

            {/* Empty State */}
            {filteredTickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 {/* Decorative Elements */}
                 <div className="absolute right-0 top-1/4 text-[#F0F5FF] pointer-events-none">
                    <svg width="100" height="100" fill="currentColor" viewBox="0 0 100 100">
                       <pattern id="grid-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1.5" />
                       </pattern>
                       <rect width="100" height="100" fill="url(#grid-dots)" />
                    </svg>
                 </div>
                 <div className="absolute left-0 bottom-0 text-[#F0F5FF] pointer-events-none">
                    <svg width="100" height="100" fill="currentColor" viewBox="0 0 100 100">
                       <pattern id="grid-dots-2" width="16" height="16" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1.5" />
                       </pattern>
                       <rect width="100" height="100" fill="url(#grid-dots-2)" />
                    </svg>
                 </div>

                 <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                    {/* Inbox Illustration */}
                    <div className="relative w-[180px] h-[180px] mb-6 flex items-center justify-center">
                       <div className="absolute inset-0 bg-[#F5F8FF] rounded-full scale-[0.85]"></div>
                       
                       <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                          {/* Inbox Back */}
                          <path d="M25 45L35 70H85L95 45H25Z" fill="#D0E2FF" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                          <path d="M25 45L35 70H85L95 45" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                          
                          {/* Tray inner shadow/depth */}
                          <path d="M35 70H85V75H35V70Z" fill="#2864FF" opacity="0.1" />

                          {/* Paper */}
                          <path d="M40 70V55C40 52 42 50 45 50H75C78 50 80 52 80 55V70" fill="white" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                          <path d="M50 58H70" stroke="#A6C8FF" strokeWidth="2.5" strokeLinecap="round" />
                          <path d="M50 64H65" stroke="#A6C8FF" strokeWidth="2.5" strokeLinecap="round" />
                          
                          {/* Inbox Front */}
                          <path d="M35 70H85C87.7614 70 90 72.2386 90 75V85C90 87.7614 87.7614 90 85 90H35C32.2386 90 30 87.7614 30 85V75C30 72.2386 32.2386 70 35 70Z" fill="#E8F0FE" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                          
                          {/* Cutout handle in front */}
                          <path d="M50 70C50 75 55 78 60 78C65 78 70 75 70 70" fill="#2864FF" opacity="0.1" />
                          <path d="M50 70C50 75 55 78 60 78C65 78 70 75 70 70" stroke="#2864FF" strokeWidth="3" strokeLinecap="round" />

                          {/* Sparkles */}
                          <path d="M25 35L27 38L30 40L27 42L25 45L23 42L20 40L23 38L25 35Z" fill="#2864FF" fillOpacity="0.5"/>
                          <path d="M95 35L96 38L99 39L96 40L95 43L94 40L91 39L94 38L95 35Z" fill="#2864FF" fillOpacity="0.4"/>
                          <circle cx="20" cy="80" r="2" fill="#2864FF" fillOpacity="0.4"/>
                       </svg>
                    </div>

                    <h2 className="text-[20px] font-extrabold text-slate-900 mb-2 tracking-tight">No tickets found</h2>
                    <p className="text-[13.5px] text-slate-500 mb-8 font-medium">
                       There are no entries to display at this time.
                    </p>

                    <button 
                       className="bg-[#2864FF] hover:bg-blue-700 text-white px-8 py-2.5 rounded-[12px] font-bold text-[13px] flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(40,100,255,0.25)]"
                    >
                       <Plus className="w-4 h-4" /> Create New Ticket
                    </button>
                 </div>
              </div>
            ) : (
              <div className="flex-1 mt-4">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket ID</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredTickets.map(t => (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                             <td className="px-6 py-4 text-sm font-medium text-slate-900">#{t.id}</td>
                             <td className="px-6 py-4 text-sm text-slate-600">{t.subject}</td>
                             <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'OPEN' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportDashboard;
