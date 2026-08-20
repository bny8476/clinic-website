import { FileText, ClipboardList, FlaskConical, Settings, CheckSquare, ShieldCheck, FileCheck, XCircle } from 'lucide-react';

const KpiCard = ({ title, value, subtext, subtextColor, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.5} />
      </div>
    </div>
    <div className="mt-1">
      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{title}</h3>
      <div className="text-xl font-extrabold text-gray-900 mb-0.5">{value}</div>
      <div className={`text-[9px] font-medium leading-tight ${subtextColor || 'text-gray-500'}`}>
        {subtext}
      </div>
    </div>
  </div>
);

const LabTopKpis = ({ summary }) => {
  if (!summary) return null;

  const getCount = (status) => summary.statusCounts?.[status] || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
      <KpiCard title="Total Requests" value={summary.totalRequests || 0} subtext={`Today: ${summary.requestsToday || 0}`} subtextColor="text-emerald-500" icon={ClipboardList} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
      <KpiCard title="Requested" value={getCount('REQUESTED')} subtext="Awaiting samples" icon={FileText} iconBg="bg-orange-100" iconColor="text-orange-500" />
      <KpiCard title="Sample Collected" value={getCount('SAMPLE_COLLECTED')} subtext="Collected today" icon={FlaskConical} iconBg="bg-blue-100" iconColor="text-blue-500" />
      <KpiCard title="Processing" value={getCount('PROCESSING')} subtext="In progress" icon={Settings} iconBg="bg-purple-100" iconColor="text-purple-500" />
      <KpiCard title="Result Entered" value={getCount('RESULT_ENTERED')} subtext="Awaiting verification" icon={CheckSquare} iconBg="bg-cyan-100" iconColor="text-cyan-500" />
      <KpiCard title="Verified" value={getCount('VERIFIED')} subtext="Ready to release" icon={ShieldCheck} iconBg="bg-emerald-100" iconColor="text-emerald-500" />
      <KpiCard title="Released" value={getCount('RELEASED')} subtext="Released today" icon={FileCheck} iconBg="bg-indigo-100" iconColor="text-indigo-500" />
      <KpiCard title="Rejected" value={getCount('REJECTED')} subtext="Requires attention" icon={XCircle} iconBg="bg-rose-100" iconColor="text-rose-500" />
    </div>
  );
};

export default LabTopKpis;
