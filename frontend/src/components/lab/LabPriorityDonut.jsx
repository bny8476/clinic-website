import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const LabPriorityDonut = ({ summary }) => {
  const data = useMemo(() => {
    const stats = summary?.priorityCounts || {};
    const items = [
      { name: 'STAT / Emergency', value: Number(stats.STAT) || 0, color: '#f43f5e' },
      { name: 'Urgent', value: Number(stats.URGENT) || 0, color: '#f59e0b' },
      { name: 'Routine', value: Number(stats.ROUTINE) || 0, color: '#3b82f6' }
    ].filter(item => item.value > 0);

    if (items.length > 0) return items;

    // Fallback demonstration distribution if DB has no records yet
    return [
      { name: 'STAT / Emergency', value: 2, color: '#f43f5e' },
      { name: 'Urgent', value: 5, color: '#f59e0b' },
      { name: 'Routine', value: 12, color: '#3b82f6' }
    ];
  }, [summary]);

  const chartTotal = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const chartData = data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Priority Breakdown</h2>
      
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
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
            <span className="text-2xl font-extrabold text-gray-900 leading-none">{chartTotal}</span>
            <span className="text-[10px] font-medium text-gray-500 mt-1 uppercase">Total</span>
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs font-bold text-gray-700">{item.name}</span>
              </div>
              <div className="pl-4 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                <span className="text-xs font-medium text-gray-500">
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

export default LabPriorityDonut;
