import { useNavigate } from 'react-router-dom';
import { Clock, Scan, Layers, CheckCircle } from 'lucide-react';

const RadiologyQuickActions = ({ setFilter }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (setFilter && action.filterStatus) {
      setFilter(action.filterStatus);
      const el = document.getElementById('radiology-requests');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const actions = [
    { label: 'Pending Requests', icon: Clock, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-orange-500', filterStatus: 'REQUESTED' },
    { label: 'Scheduled Scans', icon: Layers, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-blue-500', filterStatus: 'SCHEDULED' },
    { label: 'Reporting', icon: Scan, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-purple-500', filterStatus: 'IN_PROGRESS' },
    { label: 'Finalized', icon: CheckCircle, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-emerald-500', filterStatus: 'COMPLETED' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <h2 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => handleAction(action)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all hover:-translate-y-0.5 ${action.color}`}
            >
              <Icon className={`w-5 h-5 mb-1.5 ${action.iconColor}`} strokeWidth={2.5} />
              <span className="text-[10px] font-bold text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RadiologyQuickActions;
