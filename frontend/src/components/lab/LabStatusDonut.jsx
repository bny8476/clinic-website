import { useMemo } from 'react';

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
    if (!summary || !summary.statusCounts) return [];
    
    return Object.keys(statusColors).map(key => ({
      name: statusLabels[key],
      value: summary.statusCounts[key] || 0,
      color: statusColors[key]
    })).filter(item => item.value > 0);
  }, [summary]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const chartData = data;
  const chartTotal = total;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Requests Overview</h2>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">
          <Calendar className="w-3.5 h-3.5" /> May 21, 2026
        </button>
      </div>
      
      <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-8">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 min-h-[224px]">
            <p className="text-sm font-medium">No requests yet</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default LabStatusDonut;
