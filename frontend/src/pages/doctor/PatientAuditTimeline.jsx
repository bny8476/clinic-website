import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format } from 'date-fns';

const getIcon = (action) => {
  if (action.includes('VIEW') || action.includes('SEARCH')) return <Eye size={16} className="text-blue-500" />;
  if (action.includes('EDIT') || action.includes('CREATE') || action.includes('UPDATE')) return <Edit size={16} className="text-orange-500" />;
  if (action.includes('DELETE')) return <Trash size={16} className="text-red-500" />;
  if (action.includes('PDF') || action.includes('DOWNLOAD')) return <FileText size={16} className="text-purple-500" />;
  return <Activity size={16} className="text-slate-500" />;
};

const PatientAuditTimeline = ({ patientId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-patient', patientId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/audit/patient/${patientId}?size=50`);
      return res.data.content;
    },
    enabled: !!patientId
  });

  if (isLoading) return <div className="text-center p-8 text-slate-500">Loading audit history...</div>;

  return (
    <div className="bg-white rounded shadow border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="text-slate-700" size={20}/> Record Access History
        </h3>
        <span className="text-xs text-slate-400">Compliance View</span>
      </div>
      
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {(!data || data.length === 0) ? (
          <div className="text-center p-8 text-slate-500 text-sm">No access history found.</div>
        ) : (
          <div className="space-y-6">
            {data.map((record) => (
              <div key={record.id} className="relative pl-6">
                <div className="absolute left-0 top-1 w-2 h-2 bg-slate-300 rounded-full"></div>
                <div className="absolute left-1 top-3 bottom-[-24px] w-px bg-slate-200"></div>
                
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1 bg-slate-50 p-1.5 rounded border border-slate-200 shadow-sm">
                      {getIcon(record.actionName)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {record.actorType === 'HUMAN' ? `User ID ${record.actorId}` : 'System'} {record.actionName.toLowerCase()}d {record.resourceType}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Module: {record.moduleName} | Outcome: {record.outcome}
                        {record.breakGlassUsed && <span className="ml-2 text-red-600 font-bold">BREAK-GLASS</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right whitespace-nowrap">
                    {format(new Date(record.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAuditTimeline;
