import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d

  const { data: dailyMetrics = [], isLoading } = useQuery({
    queryKey: ['analyticsDailyMetrics', dateRange],
    queryFn: async () => {
      const res = await axiosPrivate.get('/analytics/daily-metrics');
      // Limit to random subset for UI demo if huge
      return res.data;
    }
  });

  const totalRevenue = dailyMetrics.reduce((acc, cur) => acc + (cur.totalRevenue || 0), 0);
  const totalPatients = dailyMetrics.reduce((acc, cur) => acc + (cur.newPatientsRegistered || 0), 0);
  const totalAppointments = dailyMetrics.reduce((acc, cur) => acc + (cur.totalAppointments || 0), 0);
  const avgWaitTime = dailyMetrics.length ? (dailyMetrics.reduce((acc, cur) => acc + (cur.averageWaitTimeMinutes || 0), 0) / dailyMetrics.length).toFixed(1) : 0;

  return (
    
    <div className="p-6 max-w-7xl mx-auto font-sans text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Operations</h1>
          <p className="text-sm text-slate-500">Overview of clinic performance, financials, and patient flow.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-slate-200 bg-white rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><IndianRupee size={20} /></div>
            <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} className="mr-1" /> +12%
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg"><Users size={20} /></div>
            <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} className="mr-1" /> +5%
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-500">New Patients</h3>
          <p className="text-2xl font-bold text-slate-800">{totalPatients}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><FileText size={20} /></div>
            <span className="flex items-center text-slate-500 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-full">
              --
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-500">Appointments</h3>
          <p className="text-2xl font-bold text-slate-800">{totalAppointments}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg"><Activity size={20} /></div>
            <span className="flex items-center text-rose-600 text-xs font-bold bg-rose-50 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} className="mr-1" /> +2m
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-500">Avg Wait Time</h3>
          <p className="text-2xl font-bold text-slate-800">{avgWaitTime} min</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col items-center justify-center text-slate-400">
          <BarChart2 size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-semibold">Revenue Trend Chart Placeholder</p>
          <p className="text-xs mt-1 text-slate-400 max-w-xs text-center">Chart.js or Recharts will render time-series data from /analytics/daily-metrics here.</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col items-center justify-center text-slate-400">
          <PieChart size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-semibold">Department Breakdown</p>
          <p className="text-xs mt-1 text-slate-400 max-w-xs text-center">Visualizing patient distribution across specialties.</p>
        </div>
      </div>

    </div>
    
  );
};

export default AnalyticsDashboard;
