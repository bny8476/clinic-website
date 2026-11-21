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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col h-full justify-between">
      <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Priority Breakdown</h2>
          <p className="text-xs text-slate-400 font-medium">STAT vs routine distribution</p>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
          Urgency
        </span>
      </div>
      
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} Orders`, '']}
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0F172A', color: '#FFF', fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 leading-none">{chartTotal}</span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Total</span>
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-2.5">
          {chartData.map((item) => (
            <div key={item.name} className="flex flex-col">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-bold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900">{item.value}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {chartTotal > 0 ? `(${((item.value / chartTotal) * 100).toFixed(0)}%)` : '(0%)'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabPriorityDonut;
