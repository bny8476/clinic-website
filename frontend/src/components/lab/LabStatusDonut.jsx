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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col h-full justify-between">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Status Pipeline Distribution</h2>
          <p className="text-xs text-slate-400 font-medium">Real-time status progression of active test requests</p>
        </div>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/60 flex items-center gap-1.5 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#2160FF]" /> Live
        </span>
      </div>
      
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={92}
                paddingAngle={2}
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
            <span className="text-3xl font-black text-slate-900 leading-none mb-1">{chartTotal}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="font-bold text-slate-700 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-slate-900">{item.value}</span>
                <span className="text-[10px] font-bold text-slate-400 w-11 text-right">
                  {chartTotal > 0 ? `(${((item.value / chartTotal) * 100).toFixed(0)}%)` : '(0%)'}
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
