import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const iconMap = {
  'Total Collected': DollarSign,
  'Outstanding Balance': AlertCircle,
  'Cancelled Revenue': Activity
};

const FinanceAnalyticsDashboard = () => {
  const [filters, setFilters] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-finance', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      
      const res = await axiosPrivate.get(`/analytics/finance/dashboard?${params.toString()}`);
      return res.data;
    }
  });

  const handleExport = (format) => {
    toast.success(`Exporting Finance Analytics to ${format.toUpperCase()}...`);
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Analytics</h1>
          <p className="text-slate-500">Revenue, collections, and outstanding balances.</p>
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
            value={kpi.prefix + kpi.value.toLocaleString()}
            icon={iconMap[kpi.name] || DollarSign}
            trend={kpi.trendDirection !== 'NEUTRAL' ? {
              value: kpi.trendDirection === 'UP' ? '+%' : '-%',
              isPositive: kpi.trendDirection === 'UP'
            } : null}
            colorToken={kpi.name === 'Outstanding Balance' ? 'warning' : 'success'}
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
        
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2">
          <ChartContainer title={data?.revenueChart?.chartTitle || 'Daily Revenue'} isLoading={isLoading} isEmpty={!data?.revenueChart?.labels?.length}>
            <AreaChart data={formatChartData(data?.revenueChart)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => `$${val.toLocaleString()}`} />
              {data?.revenueChart?.datasets?.map((ds, idx) => (
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

        {/* Payment Method Pie Chart */}
        <div>
          <ChartContainer title={data?.paymentMethodChart?.chartTitle || 'By Payment Method'} isLoading={isLoading} isEmpty={!data?.paymentMethodChart?.labels?.length}>
            <PieChart>
              <Pie
                data={formatPieChartData(data?.paymentMethodChart)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data?.paymentMethodChart?.labels?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(val) => `$${val.toLocaleString()}`} />
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

export default FinanceAnalyticsDashboard;
