import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, Pill, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const iconMap = {
  'Total Prescriptions': Pill,
  'Follow-ups Completed': CheckCircle,
  'Follow-ups Missed': XCircle
};

const ClinicalAnalyticsDashboard = () => {
  const [filters, setFilters] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-clinical', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      
      const res = await axiosPrivate.get(`/analytics/clinical/dashboard?${params.toString()}`);
      return res.data;
    }
  });

  const handleExport = (format) => {
    toast.success(`Exporting Clinical Analytics to ${format.toUpperCase()}...`);
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Analytics</h1>
          <p className="text-slate-500">Patient outcomes, follow-ups, and prescription trends.</p>
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
        
        {/* Prescription Volume Line Chart */}
        <div className="lg:col-span-2">
          <ChartContainer title={data?.prescriptionChart?.chartTitle || 'Prescription Volume'} isLoading={isLoading} isEmpty={!data?.prescriptionChart?.labels?.length}>
            <LineChart data={formatLineChartData(data?.prescriptionChart)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
              {data?.prescriptionChart?.datasets?.map((ds, idx) => (
                <Line 
                  key={ds.label} 
                  type="monotone" 
                  dataKey={ds.label} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS[idx % COLORS.length] }} 
                  activeDot={{ r: 6 }} 
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>

        {/* Follow up Pie Chart */}
        <div>
          <ChartContainer title={data?.followUpChart?.chartTitle || 'Follow-ups'} isLoading={isLoading} isEmpty={!data?.followUpChart?.labels?.length}>
            <PieChart>
              <Pie
                data={formatPieChartData(data?.followUpChart)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data?.followUpChart?.labels?.map((_, index) => (
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
function formatLineChartData(chartDto) {
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

export default ClinicalAnalyticsDashboard;
