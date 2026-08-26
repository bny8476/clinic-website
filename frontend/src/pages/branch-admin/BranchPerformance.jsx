import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import { ArrowLeft, BarChart3, Clock, Download, IndianRupee, RefreshCw, Sun, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ── Mocked chart data (used when API returns nothing) ─────── */
const MOCK_DAILY = [
  { day: 'Mon', footfall: 118, revenue: 42000 },
  { day: 'Tue', footfall: 134, revenue: 48500 },
  { day: 'Wed', footfall: 142, revenue: 51200 },
  { day: 'Thu', footfall: 127, revenue: 45600 },
  { day: 'Fri', footfall: 163, revenue: 58900 },
  { day: 'Sat', footfall: 98, revenue: 35100 },
  { day: 'Sun', footfall: 71, revenue: 25400 },
];

const MOCK_KPIS = [
  { label: 'Daily Footfall', value: '142', icon: Users, color: 'bg-blue-50 border-blue-100 text-[#2160FF]', valueColor: 'text-blue-900' },
  { label: 'Gross Revenue', value: '₹51,200', icon: IndianRupee, color: 'bg-emerald-50 border-emerald-100 text-emerald-600', valueColor: 'text-emerald-900' },
  { label: 'Avg Wait Time', value: '14 min', icon: Clock, color: 'bg-amber-50 border-amber-100 text-amber-600', valueColor: 'text-amber-900' },
  { label: 'OPD Consults', value: '89', icon: BarChart3, color: 'bg-blue-50 border-blue-100 text-[#2160FF]', valueColor: 'text-blue-900' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const MOCK_MONTHLY = MONTHS.map((m, i) => ({
  month: m,
  footfall: 2800 + Math.floor(Math.sin(i) * 300 + Math.random() * 400),
  revenue: 920000 + Math.floor(Math.sin(i) * 80000 + Math.random() * 120000),
}));

const BranchPerformance = () => {
  const [timeRange, setTimeRange] = useState('week');

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['branch-performance', timeRange],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/branch/analytics?range=${timeRange}`);
        return res.data;
      } catch {
        return null; // graceful fallback to mocked data
      }
    },
    staleTime: 60000,
  });

  const chartData = analyticsData?.dailyData || MOCK_DAILY;
  const kpis = analyticsData?.kpis || MOCK_KPIS;
  const monthlyData = analyticsData?.monthlyData || MOCK_MONTHLY;

  const normalizeKpis = (raw) => {
    // If API returned structured KPIs, normalize them; otherwise use mock
    if (Array.isArray(raw) && raw[0]?.label) return raw;
    return MOCK_KPIS;
  };

  return (
    <div className="p-6 md:p-8 bg-white min-h-full font-sans">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-[1500px] mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 m-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#2160FF]" />
              </div>
              Branch Performance
            </h1>
            <p className="text-sm font-medium text-slate-500 m-0 mt-2">
              Daily patient footfall, revenue, and clinical metrics.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[['week', 'This Week'], ['month', 'This Month'], ['year', 'This Year']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTimeRange(val)}
                  className={`px-4 py-2 text-[13px] font-bold rounded-md transition-colors ${
                    timeRange === val
                      ? 'bg-white text-[#2160FF] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => toast.success('Exporting performance report…')}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold text-white bg-[#2160FF] hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {normalizeKpis(kpis).map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className={`rounded-2xl border p-6 flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md ${kpi.color} bg-white shadow-sm`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <Icon size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
                  <p className={`text-[28px] font-extrabold leading-none ${kpi.valueColor}`}>{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Daily Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-slate-800">Daily Patient Footfall &amp; Revenue</h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full">Last 7 Days</span>
            </div>
            <div className="p-6 flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey={chartData[0]?.day ? 'day' : 'date'} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dx={10}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val, name) => name === 'revenue' ? [`₹${val.toLocaleString('en-IN')}`, 'Revenue'] : [val, 'Footfall']} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  <Bar yAxisId="left" dataKey="footfall" name="Footfall" fill="#2160FF" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend Line Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-slate-800">Monthly Performance Trends</h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full">6 Months</span>
            </div>
            <div className="p-6 flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  <Line type="monotone" dataKey="footfall" name="Footfall" stroke="#2160FF" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#2160FF', stroke: '#fff', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BranchPerformance;
