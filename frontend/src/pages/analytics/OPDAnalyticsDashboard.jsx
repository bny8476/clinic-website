import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, Users, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const iconMap = {
  'Total Appointments': Users,
  'Completed': CheckCircle,
  'Cancelled': XCircle,
  'No-Shows': Activity
};

const OPDAnalyticsDashboard = () => {
  const [filters, setFilters] = useState({});

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
            onClick={() => {
              if (kpi.drillDownContext) {
                // E.g., navigate to appointment list with specific filters
                console.log('Drill down to:', kpi.drillDownContext);
                toast('Navigating to ' + kpi.name + ' Details...', { icon: '🔍' });
              }
            }}
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
