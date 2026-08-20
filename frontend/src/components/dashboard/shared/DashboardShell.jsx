
export const DashboardShell = ({
  quickActions = [],
  tabs = [],
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden font-sans text-slate-700">
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
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-200 overflow-x-auto shrink-0 no-scrollbar">
          {tabs.map((tab, i) => {
            const tabId = typeof tab === 'string' ? tab : tab.id;
            const tabLabel = typeof tab === 'string' ? tab : tab.label;
            const isActive = activeTab === tabId || (!activeTab && i === 0);
            return (
              <button 
                key={i}
                onClick={() => onTabChange && onTabChange(tabId)}
                className={`whitespace-nowrap flex items-center justify-center px-5 py-2.5 rounded-[12px] border transition-all text-[15px] font-medium ${
                  isActive 
                    ? 'border-[#165DFF] bg-[#165DFF] text-white' 
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Dashboard Content Container (Fills viewport without root scroll) ── */}
      <div className="flex-1 overflow-hidden flex flex-col gap-3 min-height-0">
        {children}
      </div>
    </div>
  );
};

export const DashboardGrid = ({ left, center, right }) => (
  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
    {left && <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">{left}</div>}
    {center && <div className={(left && right) ? "lg:col-span-6 flex flex-col min-h-0 overflow-hidden" : left ? "lg:col-span-9 flex flex-col min-h-0 overflow-hidden" : right ? "lg:col-span-9 flex flex-col min-h-0 overflow-hidden" : "lg:col-span-12 flex flex-col min-h-0 overflow-hidden"}>{center}</div>}
    {right && <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">{right}</div>}
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
