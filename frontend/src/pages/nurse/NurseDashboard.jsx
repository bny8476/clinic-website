import useAuthStore from '../../store/authStore';
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { 
  Activity, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clipboard, 
  CloudUpload, 
  FlaskConical, 
  HeartPulse, 
  LayoutGrid, 
  MoreHorizontal, 
  Pill, 
  Plus, 
  Sparkles, 
  UserCheck, 
  UserPlus, 
  Users 
} from 'lucide-react';
import { motion } from 'framer-motion';

const NurseDashboard = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    if (searchParams.get('panel') === 'supplies') {
      setActiveTab('Inventory');
    }
  }, [searchParams]);

  // Quick Action cards definitions
  const quickActions = [
    { icon: Users, label: 'View Patients', desc: 'Search and manage patient records', color: 'text-blue-600', bg: 'bg-blue-50', link: '/nurse/patients' },
    { icon: HeartPulse, label: 'Record Vitals', desc: 'Record patient vital signs', color: 'text-pink-500', bg: 'bg-pink-50', link: '/nurse/vitals' },
    { icon: Pill, label: 'Medication Administration', desc: 'Manage and track medications', color: 'text-purple-600', bg: 'bg-purple-50', link: '/nurse/medications' },
    { icon: CloudUpload, label: 'Upload Reports', desc: 'Upload and manage patient reports', color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/nurse/reports' },
    { icon: Clipboard, label: 'Patient Care', desc: 'Patient care and daily notes', color: 'text-amber-600', bg: 'bg-amber-50', link: '/nurse/care' },
    { icon: FlaskConical, label: 'Lab Collection', desc: 'Manage lab collections', color: 'text-sky-600', bg: 'bg-sky-50', link: '/nurse/lab' }
  ];

  // OP Patients Mock / Live Data
  const opPatients = [
    { token: '101', name: 'Pat lent', time: '09:00 AM', status: 'Waiting', statusBg: 'bg-amber-50 text-amber-600' },
    { token: '102', name: 'James Smith', time: '09:30 AM', status: 'In Queue', statusBg: 'bg-blue-50 text-blue-600' },
    { token: '103', name: 'Linda Brown', time: '10:00 AM', status: 'Waiting', statusBg: 'bg-amber-50 text-amber-600' }
  ];

  // Scheduled Timeline Events
  const scheduleEvents = [
    { time: '09:00 AM', name: 'Pat lent', reason: 'Fever', slot: '09:00 - 09:20 AM', colorBg: 'bg-blue-50/70 border-l-4 border-blue-500 text-blue-900' },
    { time: '10:00 AM', name: 'James Smith', reason: 'Follow-up Consultation', slot: '10:00 - 10:20 AM', colorBg: 'bg-emerald-50/70 border-l-4 border-emerald-500 text-emerald-900' },
    { time: '01:00 PM', name: 'Linda Brown', reason: 'Medication Review', slot: '01:00 - 01:20 PM', colorBg: 'bg-amber-50/70 border-l-4 border-amber-500 text-amber-900' },
    { time: '03:00 PM', name: 'Robert Johnson', reason: 'Wound Dressing', slot: '03:00 - 03:20 PM', colorBg: 'bg-purple-50/70 border-l-4 border-purple-500 text-purple-900' }
  ];

  // Recent Shift Activities
  const recentActivities = [
    { icon: Clipboard, title: 'Vitals Recorded', count: '3 patients', time: '2 mins ago', iconBg: 'bg-emerald-50 text-emerald-600' },
    { icon: Pill, title: 'Medication Given', count: '5 patients', time: '15 mins ago', iconBg: 'bg-amber-50 text-amber-600' },
    { icon: FlaskConical, title: 'Lab Sample Collected', count: '2 patients', time: '30 mins ago', iconBg: 'bg-purple-50 text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-6 pb-28 max-w-[1550px] mx-auto text-slate-800 space-y-6">
      
      {/* ─── 1. Top Quick Action Cards Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((qa, idx) => {
          const Icon = qa.icon;
          return (
            <div 
              key={idx}
              onClick={() => qa.link && navigate(qa.link)}
              className="bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${qa.bg} ${qa.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug group-hover:text-blue-600 transition">
                    {qa.label}
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight line-clamp-1 mt-0.5">
                    {qa.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* ─── 2. Main Navigation Tabs ─── */}
      <div className="flex items-center gap-3">
        {[
          { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
          { id: 'OP Queue', label: 'OP Queue', icon: UserPlus },
          { id: 'IP Wards', label: 'IP Wards', icon: UserCheck },
          { id: 'Inventory', label: 'Inventory', icon: Clipboard }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── 3. Main 3-Column Content Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (3/12 = 25%) ── */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Nurse OP Patients Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Nurse OP Patients</h3>
              <button 
                onClick={() => navigate('/nurse/op-queue')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                VIEW ALL
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 border-b border-slate-50 uppercase">
                    <th className="pb-2">Token</th>
                    <th className="pb-2">Patient Name</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {opPatients.map((pt, pIdx) => (
                    <tr key={pIdx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-900">{pt.token}</td>
                      <td className="py-2.5 font-extrabold text-slate-900">{pt.name}</td>
                      <td className="py-2.5 text-slate-500">{pt.time}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${pt.statusBg}`}>
                          {pt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={() => navigate('/nurse/op-queue')}
              className="w-full py-3 bg-[#EFF4FF] hover:bg-blue-100 text-[#2B4AFE] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
            >
              Go to OP Queue <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Next Appointment Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Next Appointment</h3>
              <button 
                onClick={() => navigate('/doctor/calendar')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                VIEW CALENDAR
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Badge Tile */}
              <div className="w-20 h-20 bg-slate-100/70 rounded-2xl p-3 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">AUG</span>
                <span className="text-2xl font-black text-slate-900 leading-none my-0.5">24</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">MON</span>
              </div>

              {/* Text Details */}
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-blue-600 block">09:00 - 09:20</span>
                <h4 className="text-sm font-black text-slate-900">Pat lent</h4>
                <p className="text-xs font-medium text-slate-600">Fever</p>
                <p className="text-[11px] font-medium text-slate-400">ID: 14</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/doctor/patients/14')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <CalendarIcon className="w-4 h-4" /> View Details
            </button>
          </div>

        </div>

        {/* ── CENTER COLUMN (6/12 = 50%) ── */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-6">
          
          {/* Top Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 pb-4">
            <div className="flex items-center gap-3">
              <button className="p-1 text-slate-400 hover:text-slate-700"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-base font-black text-slate-900">18 August 2026</h2>
              <button className="p-1 text-slate-400 hover:text-slate-700"><ChevronRight className="w-5 h-5" /></button>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 ml-1">
                Today
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button className="px-3.5 py-1.5 bg-white text-blue-600 rounded-xl shadow-2xs">Day</button>
                <button className="px-3.5 py-1.5 text-slate-500 hover:text-slate-900">Week</button>
                <button className="px-3.5 py-1.5 text-slate-500 hover:text-slate-900">Month</button>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Time Slots Schedule */}
          <div className="relative space-y-6 pt-2 pl-16">
            
            {/* Slot: 08:00 AM */}
            <div className="relative flex items-center min-h-[40px]">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">08:00 AM</span>
              <div className="w-full h-[1px] bg-slate-100"></div>
            </div>

            {/* Slot: 09:00 AM */}
            <div className="relative min-h-[56px] flex items-center">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">09:00 AM</span>
              <div className="w-full bg-blue-50/70 border-l-4 border-blue-500 rounded-2xl p-3.5 ml-1 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pat lent
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 pl-4">Fever</p>
                </div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-100/60 px-2.5 py-1 rounded-lg">
                  09:00 - 09:20 AM
                </span>
              </div>
            </div>

            {/* Slot: 10:00 AM */}
            <div className="relative min-h-[56px] flex items-center">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">10:00 AM</span>
              <div className="w-full bg-emerald-50/70 border-l-4 border-emerald-500 rounded-2xl p-3.5 ml-1 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> James Smith
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 pl-4">Follow-up Consultation</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                  10:00 - 10:20 AM
                </span>
              </div>
            </div>

            {/* Current Live Indicator: 11:29 AM */}
            <div className="relative my-4">
              <span className="absolute -left-16 bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm z-10">
                11:29 AM
              </span>
              <div className="w-full h-[2px] bg-blue-600 relative flex items-center">
                <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></div>
              </div>
            </div>

            {/* Slot: 12:00 PM */}
            <div className="relative flex items-center min-h-[40px]">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">12:00 PM</span>
              <div className="w-full h-[1px] bg-slate-100"></div>
            </div>

            {/* Slot: 01:00 PM */}
            <div className="relative min-h-[56px] flex items-center">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">01:00 PM</span>
              <div className="w-full bg-amber-50/70 border-l-4 border-amber-500 rounded-2xl p-3.5 ml-1 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Linda Brown
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 pl-4">Medication Review</p>
                </div>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-100/60 px-2.5 py-1 rounded-lg">
                  01:00 - 01:20 PM
                </span>
              </div>
            </div>

            {/* Slot: 02:00 PM */}
            <div className="relative flex items-center min-h-[40px]">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">02:00 PM</span>
              <div className="w-full h-[1px] bg-slate-100"></div>
            </div>

            {/* Slot: 03:00 PM */}
            <div className="relative min-h-[56px] flex items-center">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">03:00 PM</span>
              <div className="w-full bg-purple-50/70 border-l-4 border-purple-500 rounded-2xl p-3.5 ml-1 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> Robert Johnson
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 pl-4">Wound Dressing</p>
                </div>
                <span className="text-[11px] font-bold text-purple-600 bg-purple-100/60 px-2.5 py-1 rounded-lg">
                  03:00 - 03:20 PM
                </span>
              </div>
            </div>

            {/* Slot: 04:00 PM */}
            <div className="relative flex items-center min-h-[40px]">
              <span className="absolute -left-16 text-xs font-bold text-slate-400">04:00 PM</span>
              <div className="w-full h-[1px] bg-slate-100"></div>
            </div>

          </div>
        </div>

        {/* ── RIGHT COLUMN (3/12 = 25%) ── */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* New Walk-in Patients Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">New Walk-in Patients</h3>
              <button 
                onClick={() => navigate('/nurse/walk-in')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                VIEW ALL
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-400">No new walk-in patients</p>
            </div>

            <button 
              onClick={() => navigate('/nurse/walk-in')}
              className="w-full py-3 bg-[#EFF4FF] hover:bg-blue-100 text-[#2B4AFE] font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition"
            >
              Register Walk-in <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recent Shift Activities Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Recent Shift Activities</h3>
              <button 
                onClick={() => navigate('/nurse/activities')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                VIEW ALL
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act, aIdx) => {
                const Icon = act.icon;
                return (
                  <div key={aIdx} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${act.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{act.title}</h4>
                        <p className="text-[10px] font-medium text-slate-400">{act.count}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{act.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default NurseDashboard;
