import { useNavigate } from 'react-router-dom';
import { Plus, FlaskConical, CheckSquare, Printer, History, AlertCircle, Microscope, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const LabQuickActions = ({ setFilter }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (action.actionId === 'NEW_REQUEST') {
      navigate('/doctor/lab-request');
      return;
    }
    
    if (action.actionId === 'CATALOG') {
      navigate('/lab/catalog');
      return;
    }
    
    if (setFilter && action.filterStatus) {
      setFilter(action.filterStatus);
      const el = document.getElementById('recent-requests');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast.success(action.label + ' clicked');
    }
  };

  const actions = [
    { label: 'New Request', icon: Plus, color: 'bg-indigo-600 hover:bg-indigo-700 text-white', iconColor: 'text-white', actionId: 'NEW_REQUEST' },
    { label: 'Collect Sample', icon: FileText, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-blue-500', filterStatus: 'REQUESTED' },
    { label: 'Enter Results', icon: FlaskConical, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-purple-500', filterStatus: 'PROCESSING' },
    { label: 'Verify Reports', icon: CheckSquare, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-cyan-500', filterStatus: 'RESULT_ENTERED' },
    { label: 'Print Reports', icon: Printer, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-gray-500', filterStatus: 'VERIFIED' },
    { label: 'Patient History', icon: History, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-emerald-500' },
    { label: 'Alerts', icon: AlertCircle, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-rose-500', filterStatus: 'REJECTED' },
    { label: 'Catalog', icon: Microscope, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', iconColor: 'text-indigo-500', actionId: 'CATALOG' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <h2 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
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

export default LabQuickActions;
