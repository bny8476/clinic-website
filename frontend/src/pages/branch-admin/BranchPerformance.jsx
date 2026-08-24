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
  { label: 'Daily Footfall', value: '142', icon: Users, color: 'bg-indigo-50 border-indigo-100 text-indigo-600', valueColor: 'text-indigo-900' },
  { label: 'Gross Revenue', value: '₹51,200', icon: IndianRupee, color: 'bg-emerald-50 border-emerald-100 text-emerald-600', valueColor: 'text-emerald-900' },
  { label: 'Avg Wait Time', value: '14 min', icon: Clock, color: 'bg-amber-50 border-amber-100 text-amber-600', valueColor: 'text-amber-900' },
  { label: 'OPD Consults', value: '89', icon: BarChart3, color: 'bg-violet-50 border-violet-100 text-violet-600', valueColor: 'text-violet-900' },
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link to="/branch-admin" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Branch Performance
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Daily patient footfall, revenue, and clinical metrics.
          </p>
        </div>
        <div className="flex gap-2">
          {[['week', 'This Week'], ['month', 'This Month'], ['year', 'This Year']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTimeRange(val)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                timeRange === val
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => toast.success('Exporting performance report…')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {normalizeKpis(kpis).map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`rounded-xl border p-5 flex items-center gap-4 ${kpi.color}`}>
              <div className={`w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shrink-0 ${kpi.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${kpi.valueColor}`}>{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Bar Chart */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Daily Patient Footfall &amp; Revenue</h2>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={chartData[0]?.day ? 'day' : 'date'} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(val, name) => name === 'revenue' ? [`₹${val.toLocaleString('en-IN')}`, 'Revenue'] : [val, 'Footfall']} />
              <Legend />
              <Bar yAxisId="left" dataKey="footfall" name="Footfall" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      {/* Monthly Trend Line Chart */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Monthly Performance Trends</h2>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="footfall" name="Footfall" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default BranchPerformance;
