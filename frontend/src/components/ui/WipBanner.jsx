
const WipBanner = ({ feature = 'This feature', note = 'Backend endpoint status to be determined' }) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-md flex items-start shadow-sm">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-amber-800">Work In Progress: {feature}</h3>
        <div className="mt-1 text-sm text-amber-700">
          <p>
            This page is currently a frontend mock.
            <span className="block mt-1 font-mono text-xs">Note: {note}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WipBanner;
