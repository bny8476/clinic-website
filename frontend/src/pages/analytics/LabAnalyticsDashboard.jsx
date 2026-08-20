import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, FlaskConical, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const iconMap = {
  'Total Requests': FileText,
  'Abnormal Results': AlertTriangle,
  'Abnormality Rate': Activity
};

const LabAnalyticsDashboard = () => {
  const [filters, setFilters] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-lab', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      
      const res = await axiosPrivate.get(`/analytics/lab/dashboard?${params.toString()}`);
      return res.data;
    }
  });

  const handleExport = (format) => {
    toast.success(`Exporting Lab Analytics to ${format.toUpperCase()}...`);
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Analytics</h1>
          <p className="text-slate-500">Test volumes, abnormality rates, and request trends.</p>
        </div>
        <ExportMenu onExport={handleExport} />
      </div>

      <AnalyticsFilterBar showBranch={true} onFilterChange={setFilters} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.kpis?.map((kpi, index) => (
          <KPICard
            key={index}
            label={kpi.name}
            value={kpi.value + (kpi.suffix || '')}
            icon={iconMap[kpi.name] || FlaskConical}
            trend={kpi.trendDirection !== 'NEUTRAL' ? {
              value: kpi.trendDirection === 'UP' ? '+%' : '-%',
              isPositive: kpi.trendDirection === 'UP'
            } : null}
            colorToken={kpi.name === 'Abnormal Results' ? 'danger' : 'navy'}
            isLoading={isLoading}
            onClick={() => {
              if (kpi.drillDownContext) {
                toast('Drill-down to: ' + kpi.name, { icon: '🔍' });
              }
            }}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Volume Bar Chart */}
        <div className="lg:col-span-2">
          <ChartContainer title={data?.volumeChart?.chartTitle || 'Daily Test Requests'} isLoading={isLoading} isEmpty={!data?.volumeChart?.labels?.length}>
            <BarChart data={formatChartData(data?.volumeChart)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
              {data?.volumeChart?.datasets?.map((ds, idx) => (
                <Bar key={ds.label} dataKey={ds.label} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ChartContainer>
        </div>

        {/* Test Type Pie Chart */}
        <div>
          <ChartContainer title={data?.testTypeChart?.chartTitle || 'Tests by Type'} isLoading={isLoading} isEmpty={!data?.testTypeChart?.labels?.length}>
            <PieChart>
              <Pie
                data={formatPieChartData(data?.testTypeChart)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data?.testTypeChart?.labels?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
    
  );
};

// Helpers
function formatChartData(chartDto) {
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

export default LabAnalyticsDashboard;
