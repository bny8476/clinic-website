import React from 'react';
import { AlertTriangle, Bell, ShieldAlert, Package } from 'lucide-react';

const LabAlerts = ({ summary = {} }) => {
  const urgentCount = summary.priorityCounts?.URGENT || summary.priorityCounts?.STAT || 0;
  const lowStock = summary.lowStockItems || 0;
  const pending = summary.pendingRequests || 0;

  const alerts = [
    {
      id: 1,
      title: `${urgentCount} High Priority Tests`,
      desc: urgentCount > 0 ? 'Requires immediate sample processing' : 'All urgent tests cleared',
      time: 'Realtime',
      icon: ShieldAlert,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-500',
      badge: urgentCount,
    },
    {
      id: 2,
      title: `${lowStock} Low Stock Reagents`,
      desc: lowStock > 0 ? 'Items at or below minimum threshold' : 'Reagent stock normal',
      time: 'Inventory',
      icon: Package,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-500',
      badge: lowStock,
    },
    {
      id: 3,
      title: `${pending} Pending Worklist Items`,
      desc: pending > 0 ? 'Awaiting technician assignment/processing' : 'Worklist up to date',
      time: 'Worklist',
      icon: Bell,
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#2160FF]',
      badgeBg: 'bg-[#2160FF]',
      badge: pending,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Realtime Alerts</h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          Live System
        </span>
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-3 items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
            <div className="relative flex-shrink-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${alert.iconBg}`}>
                <alert.icon className={`w-4 h-4 ${alert.iconColor}`} />
              </div>
              <div className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white rounded-full ${alert.badgeBg}`}>
                {alert.badge}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-1 mb-0.5">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{alert.title}</h4>
                <span className="text-[10px] font-bold text-slate-400">{alert.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabAlerts;
