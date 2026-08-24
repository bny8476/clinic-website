import KPICard from '../../components/ui/KPICard';
import ChartContainer from '../../components/analytics/ChartContainer';
import AnalyticsFilterBar from '../../components/analytics/AnalyticsFilterBar';
import ExportMenu from '../../components/analytics/ExportMenu';
import Modal from '../../components/ui/Modal';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, CheckCircle, Clock, Users, X, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

/* ── KPI Drill-Down Modal ────────────────────────────────── */
const MOCK_DRILL_DOWN = {
  'Total Appointments': [
    { id: 'APT-1021', patient: 'Rahul Sharma', doctor: 'Dr. Priya Nair', dept: 'General Medicine', time: '09:00 AM', status: 'Completed' },
    { id: 'APT-1022', patient: 'Meena Iyer', doctor: 'Dr. Karthik R', dept: 'Cardiology', time: '09:30 AM', status: 'Completed' },
    { id: 'APT-1023', patient: 'Suresh P', doctor: 'Dr. Anitha K', dept: 'Orthopedics', time: '10:00 AM', status: 'No-Show' },
    { id: 'APT-1024', patient: 'Lakshmi V', doctor: 'Dr. Priya Nair', dept: 'General Medicine', time: '10:30 AM', status: 'Completed' },
    { id: 'APT-1025', patient: 'Ravi Kumar', doctor: 'Dr. Rajesh S', dept: 'Dermatology', time: '11:00 AM', status: 'Cancelled' },
  ],
  'Completed': [
    { id: 'APT-1021', patient: 'Rahul Sharma', doctor: 'Dr. Priya Nair', dept: 'General Medicine', time: '09:00 AM', status: 'Completed' },
    { id: 'APT-1022', patient: 'Meena Iyer', doctor: 'Dr. Karthik R', dept: 'Cardiology', time: '09:30 AM', status: 'Completed' },
    { id: 'APT-1024', patient: 'Lakshmi V', doctor: 'Dr. Priya Nair', dept: 'General Medicine', time: '10:30 AM', status: 'Completed' },
  ],
  'Cancelled': [
    { id: 'APT-1025', patient: 'Ravi Kumar', doctor: 'Dr. Rajesh S', dept: 'Dermatology', time: '11:00 AM', status: 'Cancelled' },
  ],
  'No-Shows': [
    { id: 'APT-1023', patient: 'Suresh P', doctor: 'Dr. Anitha K', dept: 'Orthopedics', time: '10:00 AM', status: 'No-Show' },
  ],
};

const STATUS_BADGE = {
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-700',
  'No-Show': 'bg-amber-100 text-amber-700',
};

function KpiDrillDownModal({ kpi, onClose }) {
  const rows = MOCK_DRILL_DOWN[kpi.name] || MOCK_DRILL_DOWN['Total Appointments'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800">{kpi.name} — Drill Down</h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing sample records for today</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-100">
                {['ID', 'Patient', 'Doctor', 'Department', 'Time', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{row.id}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{row.patient}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.doctor}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.dept}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" /> {row.time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[row.status] || 'bg-slate-100 text-slate-600'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">{rows.length} record{rows.length !== 1 ? 's' : ''} shown</p>
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const iconMap = {
  'Total Appointments': Users,
  'Completed': CheckCircle,
  'Cancelled': XCircle,
  'No-Shows': Activity
};

const OPDAnalyticsDashboard = () => {
  const [filters, setFilters] = useState({});
  const [drillDownKpi, setDrillDownKpi] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-opd', filters],
    queryFn: async () => {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      
      const res = await axiosPrivate.get(`/analytics/opd/dashboard?${params.toString()}`);
      return res.data;
    }
  });

  const handleExport = (format) => {
    toast.success(`Exporting OPD Analytics to ${format.toUpperCase()}...`);
    // Mock export trigger for now. In reality, call the ReportExportService API endpoint.
  };

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OPD Analytics</h1>
          <p className="text-slate-500">Outpatient department volume and trends.</p>
        </div>
        <ExportMenu onExport={handleExport} />
      </div>

      <AnalyticsFilterBar showBranch={true} onFilterChange={setFilters} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.kpis?.map((kpi, index) => (
          <KPICard
            key={index}
            label={kpi.name}
            value={kpi.value}
            icon={iconMap[kpi.name] || Activity}
            trend={{
              value: kpi.trendDirection === 'UP' ? '+%' : (kpi.trendDirection === 'DOWN' ? '-%' : '0%'),
              isPositive: kpi.trendDirection === 'UP'
            }}
            isLoading={isLoading}
            onClick={() => setDrillDownKpi(kpi)}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Volume Bar Chart */}
        <div className="lg:col-span-2">
          <ChartContainer title={data?.dailyVolumes?.chartTitle || 'Daily Volume'} isLoading={isLoading} isEmpty={!data?.dailyVolumes?.labels?.length}>
            <BarChart data={formatBarChartData(data?.dailyVolumes)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
              {data?.dailyVolumes?.datasets?.map((ds, idx) => (
                <Bar key={ds.label} dataKey={ds.label} stackId="a" fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ChartContainer>
        </div>

        {/* Specialty Pie Chart */}
        <div>
          <ChartContainer title={data?.specialtyChart?.chartTitle || 'By Specialty'} isLoading={isLoading} isEmpty={!data?.specialtyChart?.labels?.length}>
            <PieChart>
              <Pie
                data={formatPieChartData(data?.specialtyChart)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data?.specialtyChart?.labels?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </div>

    {drillDownKpi && <KpiDrillDownModal kpi={drillDownKpi} onClose={() => setDrillDownKpi(null)} />}
    </>
  );
};

// Helpers to map standard DTO to Recharts structure
function formatBarChartData(chartDto) {
  if (!chartDto || !chartDto.labels) return [];
  return chartDto.labels.map((label, idx) => {
    const obj = { name: label };
    chartDto.datasets.forEach(ds => {
      obj[ds.label] = ds.data[idx];
    });
    return obj;
  });
}

function formatPieChartData(chartDto) {
  if (!chartDto || !chartDto.labels || !chartDto.datasets?.length) return [];
  const ds = chartDto.datasets[0];
  return chartDto.labels.map((label, idx) => ({
    name: label,
    value: ds.data[idx]
  }));
}

export default OPDAnalyticsDashboard;
