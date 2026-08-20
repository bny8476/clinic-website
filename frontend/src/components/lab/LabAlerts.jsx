
const alerts = [];

const LabAlerts = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Alerts & Notifications</h2>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          View All
        </a>
      </div>
      
      <div className="flex-1 space-y-5 flex flex-col items-center justify-center">
        {alerts.length === 0 ? (
          <p className="text-sm font-medium text-gray-400">No new alerts</p>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className="flex gap-4 items-start w-full">
              <div className="relative mt-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert.iconBg}`}>
                  <alert.icon className={`w-4 h-4 ${alert.iconColor}`} />
                </div>
                <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white rounded-full ${alert.badgeBg}`}>
                  {alert.badge}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">{alert.title}</h4>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">{alert.time}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">{alert.desc}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LabAlerts;
