import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';

const ChartBanner = ({ patientId }) => {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['chartSummary', patientId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/emr/patients/${patientId}/chart-summary`);
      return res.data;
    },
    enabled: !!patientId,
  });

  if (isLoading) return <div className="h-16 animate-pulse bg-gray-800 rounded-lg mb-6"></div>;
  if (error) return <div className="text-red-500">Failed to load chart summary</div>;
  if (!summary) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shadow-md border border-gray-700">
      <div className="flex items-center gap-4 border-r border-gray-600 pr-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Age</p>
          <p className="text-lg font-bold text-white">{summary.age ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Blood Group</p>
          <p className="text-lg font-bold text-white">{summary.bloodGroup ?? 'N/A'}</p>
        </div>
      </div>
      
      <div className="flex-1 min-w-[200px] border-r border-gray-600 pr-4">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Active Allergies</p>
        {summary.activeAllergies && summary.activeAllergies.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {summary.activeAllergies.map(a => (
              <span key={a.id} className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-400 border border-red-800/50">
                {a.allergen}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">None known</p>
        )}
      </div>

      <div className="flex-1 min-w-[200px] border-r border-gray-600 pr-4">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Active Problems</p>
        {summary.activeProblems && summary.activeProblems.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {summary.activeProblems.map(p => (
              <span key={p.id} className="px-2 py-0.5 rounded text-xs font-medium bg-orange-900/40 text-orange-400 border border-orange-800/50">
                {p.problemName}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">None known</p>
        )}
      </div>

      <div className="flex-1 min-w-[200px]">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Emergency Contact</p>
        <p className="text-sm text-white">{summary.emergencyContactName ?? 'N/A'}</p>
        <p className="text-xs text-gray-400">{summary.emergencyContactPhone ?? 'N/A'}</p>
      </div>
    </div>
  );
};

export default ChartBanner;
