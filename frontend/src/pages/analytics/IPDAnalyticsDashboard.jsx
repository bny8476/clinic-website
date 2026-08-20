import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, Bed, Users, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const iconMap = {
  'Currently Admitted': Bed,
  'Period Admissions': Users,
  'Total Discharges': UserCheck
};

const IPDAnalyticsDashboard = () => {
  const [filters, setFilters] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-ipd', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      
      const res = await axiosPrivate.get(`/analytics/ipd/dashboard?${params.toString()}`);
      return res.data;
    }
  });

  const handleExport = (format) => {
    toast.success(`Exporting IPD Analytics to ${format.toUpperCase()}...`);
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inpatient (IPD) Analytics</h1>
          <p className="text-slate-500">Admissions, discharges, and ward occupancy trends.</p>
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
            value={kpi.value}
            icon={iconMap[kpi.name] || Activity}
            trend={{
              value: kpi.trendDirection === 'UP' ? '+%' : (kpi.trendDirection === 'DOWN' ? '-%' : '0%'),
              isPositive: kpi.trendDirection === 'UP'
            }}
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
        
        {/* Admissions Area Chart */}
        <div className="lg:col-span-2">
          <ChartContainer title={data?.admissionsChart?.chartTitle || 'Admissions Trend'} isLoading={isLoading} isEmpty={!data?.admissionsChart?.labels?.length}>
            <AreaChart data={formatChartData(data?.admissionsChart)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
              {data?.admissionsChart?.datasets?.map((ds, idx) => (
                <Area 
                  key={ds.label} 
                  type="monotone" 
                  dataKey={ds.label} 
                  stroke={COLORS[idx % COLORS.length]} 
                  fill={COLORS[idx % COLORS.length]} 
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Ward Occupancy Bar Chart */}
        <div>
          <ChartContainer title={data?.wardOccupancyChart?.chartTitle || 'Current Ward Occupancy'} isLoading={isLoading} isEmpty={!data?.wardOccupancyChart?.labels?.length}>
            <BarChart data={formatChartData(data?.wardOccupancyChart)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
              {data?.wardOccupancyChart?.datasets?.map((ds, idx) => (
                <Bar key={ds.label} dataKey={ds.label} fill={COLORS[(idx + 1) % COLORS.length]} radius={[0, 4, 4, 0]} />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
    
  );
};

// Helper
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

export default IPDAnalyticsDashboard;
