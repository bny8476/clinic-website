import { Navigation } from 'lucide-react';

export const DashboardShell = ({
  quickActions = [],
  tabs = [],
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden font-sans text-slate-700">
      {/* ── Quick Actions Row ── */}
      {quickActions.length > 0 && (
        <div className="flex items-center gap-4 overflow-x-auto pb-4 shrink-0 no-scrollbar">
          {quickActions.map((btn, i) => {
            const Icon = btn.icon;
            return (
              <button 
                key={i} 
                onClick={btn.action}
                className="flex flex-col items-center justify-center min-w-[110px] h-[80px] px-3 py-3 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all text-[11px] font-bold text-slate-700 shrink-0"
              >
                <span className={`${btn.bg || 'bg-indigo-50'} ${btn.color || 'text-indigo-600'} p-2 rounded-[10px] mb-2`}>
                  <Icon size={18} strokeWidth={2.5} />
                </span>
                <span className="leading-tight text-center whitespace-pre-line">{btn.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Navigation Tabs ── */}
      {tabs.length > 0 && (
        <div className="flex items-center flex-wrap gap-2.5 px-6 py-3 bg-white border-b border-slate-200 shrink-0 w-full max-w-full overflow-x-hidden">
          {tabs.map((tab, i) => {
            const tabId = typeof tab === 'string' ? tab : tab.id;
            const tabLabel = typeof tab === 'string' ? tab : tab.label;
            const tabSub = typeof tab === 'object' ? tab.sub : null;
            const TabIcon = typeof tab === 'object' ? tab.icon : null;
            const isActive = activeTab === tabId || (!activeTab && i === 0);
            return (
              <button 
                key={i}
                onClick={() => onTabChange && onTabChange(tabId)}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  isActive 
                    ? 'border-[#2160FF] bg-[#2160FF] text-white shadow-md shadow-blue-500/20' 
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {TabIcon && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2160FF]'
                  }`}>
                    <TabIcon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                )}
                <div className="text-left leading-tight">
                  <p className={`text-[12px] font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{tabLabel}</p>
                  {tabSub && <p className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{tabSub}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Dashboard Content Container (Fills viewport with scroll) ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 min-h-0 p-6 w-full max-w-full">
        {children}
      </div>
    </div>
  );
};

export const DashboardGrid = ({ left, center, right }) => (
  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
    {left && <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-y-auto pr-0.5">{left}</div>}
    {center && <div className={(left && right) ? "lg:col-span-6 flex flex-col min-h-0" : left ? "lg:col-span-9 flex flex-col min-h-0" : right ? "lg:col-span-9 flex flex-col min-h-0" : "lg:col-span-12 flex flex-col min-h-0"}>{center}</div>}
    {right && <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-y-auto pr-0.5">{right}</div>}
  </div>
);

export const BottomRow = ({ recentActivities, aiAssistant, quickSearch, pharmacyRecentBills, pharmacyLowStock }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
    {recentActivities && <div className="lg:col-span-4">{recentActivities}</div>}
    {aiAssistant && <div className="lg:col-span-4 flex flex-col">{aiAssistant}</div>}
    {quickSearch && <div className="lg:col-span-4">{quickSearch}</div>}
    {pharmacyRecentBills && <div className="lg:col-span-6">{pharmacyRecentBills}</div>}
    {pharmacyLowStock && <div className="lg:col-span-6">{pharmacyLowStock}</div>}
  </div>
);

export default DashboardShell;
