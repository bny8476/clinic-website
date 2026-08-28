import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

const LabTurnaroundTime = ({ summary = {} }) => {
  const tatList = summary.tatData || [
    { testName: 'Complete Blood Count', avgTatMinutes: 45 },
    { testName: 'Lipid Profile', avgTatMinutes: 90 },
    { testName: 'Liver Function Test', avgTatMinutes: 60 },
    { testName: 'Thyroid Panel', avgTatMinutes: 120 },
    { testName: 'Blood Glucose', avgTatMinutes: 30 },
  ];

  const maxTat = Math.max(...tatList.map(t => t.avgTatMinutes), 120);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Average Turnaround Time (TAT)</h2>
          <p className="text-xs text-slate-400 font-medium">Processing time per test catalog</p>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {tatList.map((item, idx) => {
          const pct = Math.min(100, Math.round((item.avgTatMinutes / maxTat) * 100));
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="truncate max-w-[180px]">{item.testName}</span>
                <span className="text-[#2160FF] font-extrabold">{item.avgTatMinutes} min</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2160FF] to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LabTurnaroundTime;
