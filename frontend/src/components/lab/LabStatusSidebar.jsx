import { useMemo } from 'react';

const LabStatusSidebar = ({ summary }) => {
  const statusMap = [
    { id: 'REQUESTED', label: 'Requested', color: 'text-orange-500' },
    { id: 'SAMPLE_COLLECTED', label: 'Sample Collected', color: 'text-blue-500' },
    { id: 'PROCESSING', label: 'Processing', color: 'text-purple-500' },
    { id: 'RESULT_ENTERED', label: 'Result Entered', color: 'text-cyan-500' },
    { id: 'VERIFIED', label: 'Verified', color: 'text-emerald-500' },
    { id: 'RELEASED', label: 'Released', color: 'text-indigo-500' },
    { id: 'REJECTED', label: 'Rejected', color: 'text-rose-500' }
  ];

  const stats = useMemo(() => {
    if (!summary || !summary.statusCounts) {
      return statusMap.reduce((acc, st) => ({ ...acc, [st.id]: 0 }), {});
    }
    return summary.statusCounts;
  }, [summary]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Request Queue by Status</h2>
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {statusMap.map((status) => (
            <div key={status.id} className="flex justify-between items-center py-2.5 px-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-700">{status.label}</span>
              <span className={`text-sm font-bold ${status.color}`}>{stats[status.id] || 0}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
            View All Requests <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabStatusSidebar;
