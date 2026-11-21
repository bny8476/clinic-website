import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Package, Bell, ArrowRight, CheckCircle2, Activity } from 'lucide-react';

const LabAlerts = ({ summary = {}, onFilterUrgent }) => {
  const navigate = useNavigate();
  const urgentCount = summary.priorityCounts?.STAT || summary.priorityCounts?.URGENT || summary.priorityCounts?.HIGH || 0;
  const lowStock = summary.lowStockItems || 2;
  const pending = summary.statusCounts?.REQUESTED || summary.pendingRequests || 3;

  const alerts = [
    {
      id: 'urgent',
      title: `${urgentCount} Urgent / STAT Orders`,
      desc: urgentCount > 0 ? 'Critical priority sample processing required' : 'All urgent orders processed',
      actionLabel: 'View Queue',
      onClick: () => {
        if (onFilterUrgent) onFilterUrgent();
        else navigate('/lab/worklist');
      },
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      badgeBg: 'bg-rose-500 text-white',
      badge: urgentCount,
      isCritical: urgentCount > 0,
    },
    {
      id: 'pending',
      title: `${pending} Pending Collection / Intake`,
      desc: pending > 0 ? 'Awaiting sample collection & analyzer check-in' : 'All sample intakes up to date',
      actionLabel: 'Open Worklist',
      onClick: () => navigate('/lab/worklist'),
      icon: Bell,
      iconBg: 'bg-blue-50 text-[#2160FF] border border-blue-100',
      badgeBg: 'bg-[#2160FF] text-white',
      badge: pending,
      isCritical: false,
    },
    {
      id: 'stock',
      title: `${lowStock} Reagents Below Threshold`,
      desc: lowStock > 0 ? 'CBC Diluent & Lipid enzymatic reagents low' : 'All laboratory reagents sufficient',
      actionLabel: 'Catalog',
      onClick: () => navigate('/lab/catalog'),
      icon: Package,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      badgeBg: 'bg-amber-500 text-white',
      badge: lowStock,
      isCritical: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Real-Time Operational Alerts</h2>
            <p className="text-xs text-slate-400 font-medium">Urgent orders, stock alerts & analyzer events</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            LIS Active
          </span>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={alert.onClick}
              className="group p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${alert.iconBg}`}>
                    <alert.icon className="w-4 h-4" />
                  </div>
                  {alert.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${alert.badgeBg} shadow-xs`}>
                      {alert.badge}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#2160FF] transition-colors">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {alert.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#2160FF] shrink-0 transition-colors">
                <span>{alert.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Analyzers Online (Sysmex, Cobas)</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Normal Telemetry</span>
        </div>
      </div>
    </div>
  );
};

export default LabAlerts;
