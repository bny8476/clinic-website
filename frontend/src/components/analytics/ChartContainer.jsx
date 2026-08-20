
/**
 * Universal wrapper for Recharts to enforce standard styling and loading states.
 */
const ChartContainer = ({ 
  title, 
  children, 
  isLoading = false, 
  height = 300,
  isEmpty = false
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col w-full">
      {title && (
        <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>
      )}
      
      <div className="flex-1 w-full relative" style={{ height }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm text-slate-400">No data available for this period</p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartContainer;
