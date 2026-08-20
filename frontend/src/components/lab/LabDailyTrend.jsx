
const data = [];

const LabDailyTrend = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Daily Trend</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-200">
          Requests <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
        <p className="text-sm font-medium text-gray-400">Trend data unavailable</p>
      </div>
    </div>
  );
};

export default LabDailyTrend;
