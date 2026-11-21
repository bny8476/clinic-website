import React from 'react';
import { Clock, CheckCircle2, Award } from 'lucide-react';

const LabTurnaroundTime = ({ summary = {} }) => {
  const tatList = summary.tatData || [
    { testName: 'Complete Blood Count (CBC)', avgTatMinutes: 42, target: 60 },
    { testName: 'Lipid Profile & Cholesterol', avgTatMinutes: 85, target: 90 },
    { testName: 'Liver Function Test (LFT)', avgTatMinutes: 58, target: 75 },
    { testName: 'Thyroid Panel (TSH, T3, T4)', avgTatMinutes: 110, target: 120 },
    { testName: 'Blood Glucose & HbA1c', avgTatMinutes: 30, target: 45 },
  ];

  const maxTat = Math.max(...tatList.map(t => Math.max(t.avgTatMinutes, t.target)), 130);
  const avgOverall = Math.round(tatList.reduce((acc, curr) => acc + curr.avgTatMinutes, 0) / tatList.length);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Average Turnaround Time (TAT)</h2>
              <p className="text-xs text-slate-400 font-medium">Processing SLA benchmark per test catalog</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 shrink-0">
            Avg: <span className="font-extrabold">{avgOverall}</span> min
          </span>
        </div>

        <div className="space-y-3.5">
          {tatList.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.avgTatMinutes / maxTat) * 100));
            const isWithinTarget = item.avgTatMinutes <= item.target;
            const barGradient = item.avgTatMinutes <= 45 
              ? 'from-emerald-500 to-teal-500' 
              : item.avgTatMinutes <= 90 
                ? 'from-[#2160FF] to-indigo-500' 
                : 'from-amber-500 to-orange-500';

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 truncate max-w-[200px]">{item.testName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400">Target &lt; {item.target}m</span>
                    <span className="font-black text-slate-900">{item.avgTatMinutes} min</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${barGradient} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>94.8% SLA Compliance</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>NABH / CAP Benchmark</span>
        </div>
      </div>
    </div>
  );
};

export default LabTurnaroundTime;
