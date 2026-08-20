
const tatData = [];

const LabTurnaroundTime = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Test Turnaround Time (TAT)</h2>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          View Report
        </a>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-medium text-gray-400">TAT data unavailable</p>
      </div>
    </div>
  );
};

export default LabTurnaroundTime;
