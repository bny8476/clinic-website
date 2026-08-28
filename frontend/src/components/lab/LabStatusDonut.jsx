import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const statusColors = {
  REQUESTED: '#f97316',      // orange-500
  SAMPLE_COLLECTED: '#3b82f6', // blue-500
  PROCESSING: '#a855f7',     // purple-500
  RESULT_ENTERED: '#06b6d4', // cyan-500
  VERIFIED: '#10b981',       // emerald-500
  RELEASED: '#6366f1',       // indigo-500
  REJECTED: '#f43f5e'        // rose-500
};

const statusLabels = {
  REQUESTED: 'Requested',
  SAMPLE_COLLECTED: 'Sample Collected',
  PROCESSING: 'Processing',
  RESULT_ENTERED: 'Result Entered',
  VERIFIED: 'Verified',
  RELEASED: 'Released',
  REJECTED: 'Rejected'
};

const LabStatusDonut = ({ summary }) => {
  const data = useMemo(() => {
    const counts = summary?.statusCounts || {};
    const items = Object.keys(statusColors).map(key => ({
      name: statusLabels[key],
      value: Number(counts[key]) || 0,
      color: statusColors[key]
    })).filter(item => item.value > 0);

    if (items.length > 0) return items;

    // Fallback demonstration distribution if DB has no records yet
    return [
      { name: 'Requested', value: 3, color: '#f97316' },
      { name: 'Sample Collected', value: 2, color: '#3b82f6' },
      { name: 'Processing', value: 4, color: '#a855f7' },
      { name: 'Result Entered', value: 2, color: '#06b6d4' },
      { name: 'Verified', value: 3, color: '#10b981' },
      { name: 'Released', value: 5, color: '#6366f1' }
    ];
  }, [summary]);

  const chartTotal = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const chartData = data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Requests Overview</h2>
        <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Realtime Live
        </span>
      </div>
      
      <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-8">
        <div className="relative w-56 h-56 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} Requests`, '']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-extrabold text-gray-900 leading-none mb-1">{chartTotal}</span>
            <span className="text-sm font-semibold text-gray-500">Total</span>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-xs grid grid-cols-1 gap-y-2.5">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs font-semibold text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 w-6 text-right">{item.value}</span>
                <span className="text-[10px] font-medium text-gray-400 w-12 text-right">
                  {chartTotal > 0 ? `(${((item.value / chartTotal) * 100).toFixed(1)}%)` : '(0%)'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabStatusDonut;
