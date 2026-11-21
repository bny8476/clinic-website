import React from 'react';
import { CheckSquare, ClipboardList, FileCheck, FileText, FlaskConical, Settings, ShieldCheck, XCircle } from 'lucide-react';

const KpiCard = ({ title, value, subtext, subtextColor, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex flex-col justify-between hover:shadow-xs hover:border-blue-200 transition-all group">
    <div className="flex justify-between items-start mb-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} transition-transform group-hover:scale-105`}>
        <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.5} />
      </div>
    </div>
    <div>
      <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 truncate" title={title}>
        {title}
      </h3>
      <div className="text-2xl font-black text-slate-900 leading-none mb-1.5">{value}</div>
      <div className={`text-[10px] font-bold leading-tight truncate ${subtextColor || 'text-slate-400'}`}>
        {subtext}
      </div>
    </div>
  </div>
);

const LabTopKpis = ({ summary }) => {
  if (!summary) return null;

  const getCount = (status) => summary.statusCounts?.[status] || 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5">
      <KpiCard 
        title="Total Orders" 
        value={summary.totalRequests || 0} 
        subtext={`Today: ${summary.requestsToday || 0} orders`} 
        subtextColor="text-emerald-600 font-extrabold" 
        icon={ClipboardList} 
        iconBg="bg-blue-50" 
        iconColor="text-[#2160FF]" 
      />
      <KpiCard 
        title="Requested" 
        value={getCount('REQUESTED')} 
        subtext="Awaiting sample" 
        subtextColor="text-orange-600" 
        icon={FileText} 
        iconBg="bg-orange-50" 
        iconColor="text-orange-500" 
      />
      <KpiCard 
        title="Collected" 
        value={getCount('SAMPLE_COLLECTED')} 
        subtext="Sample collected" 
        subtextColor="text-blue-600" 
        icon={FlaskConical} 
        iconBg="bg-blue-50" 
        iconColor="text-blue-500" 
      />
      <KpiCard 
        title="Processing" 
        value={getCount('PROCESSING')} 
        subtext="Under analysis" 
        subtextColor="text-purple-600" 
        icon={Settings} 
        iconBg="bg-purple-50" 
        iconColor="text-purple-500" 
      />
      <KpiCard 
        title="Result Entered" 
        value={getCount('RESULT_ENTERED')} 
        subtext="Awaiting review" 
        subtextColor="text-cyan-600" 
        icon={CheckSquare} 
        iconBg="bg-cyan-50" 
        iconColor="text-cyan-600" 
      />
      <KpiCard 
        title="Verified" 
        value={getCount('VERIFIED')} 
        subtext="Ready to release" 
        subtextColor="text-emerald-600" 
        icon={ShieldCheck} 
        iconBg="bg-emerald-50" 
        iconColor="text-emerald-600" 
      />
      <KpiCard 
        title="Released" 
        value={getCount('RELEASED')} 
        subtext="Delivered to doctor" 
        subtextColor="text-indigo-600 font-extrabold" 
        icon={FileCheck} 
        iconBg="bg-indigo-50" 
        iconColor="text-indigo-600" 
      />
      <KpiCard 
        title="Rejected" 
        value={getCount('REJECTED')} 
        subtext="Recollect required" 
        subtextColor="text-rose-600 font-extrabold" 
        icon={XCircle} 
        iconBg="bg-rose-50" 
        iconColor="text-rose-500" 
      />
    </div>
  );
};

export default LabTopKpis;
