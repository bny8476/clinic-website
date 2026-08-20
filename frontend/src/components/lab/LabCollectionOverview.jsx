
const LabCollectionOverview = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Sample Collection Overview</h2>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          View All
        </a>
      </div>
      
      <div className="flex gap-4 flex-1">
        {/* Card 1 */}
        <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 mb-1">Collected Today</span>
          <span className="text-2xl font-bold text-gray-900 mb-2">64</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
            <TrendingUp className="w-3 h-3" /> 8%
          </span>
        </div>
        
        {/* Card 2 */}
        <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 mb-1">To Be Collected</span>
          <span className="text-2xl font-bold text-gray-900 mb-2">28</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-500">
            <TrendingDown className="w-3 h-3" /> 5%
          </span>
        </div>

        {/* Card 3 */}
        <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 mb-1">Collected</span>
          <span className="text-2xl font-bold text-gray-900 mb-2">64</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
            <TrendingUp className="w-3 h-3" /> 8%
          </span>
        </div>
      </div>
    </div>
  );
};

export default LabCollectionOverview;
