import { useAuth } from '../../context/pharmacy/AuthContext';
import { getRoleColor } from '../../config/pharmacy/roles.config';



export default function RoleDashboard({ title, description }) {
  const { activeRole } = useAuth();
  const colorClass = getRoleColor(activeRole);

  return (
    
    <div className="space-y-6">
              <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Shield className={`w-6 h-6 ${colorClass.split(' ')[1] || 'text-primary'}`} />
          {title}
        </h2>
        <p className="text-sm text-gray-500 font-medium">{description}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8 flex flex-col items-center justify-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colorClass.split(' ')[0] || 'bg-blue-100'} bg-opacity-20`}>
          <Shield className={`w-8 h-8 ${colorClass.split(' ')[1] || 'text-primary'}`} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to your workspace</h3>
        <p className="text-gray-500 max-w-md">
          This is the dedicated dashboard for the <strong>{activeRole}</strong> role. 
          Widgets and quick actions will appear here based on your assigned permissions.
        </p>
      </div>
    </div>
    
  );
}
