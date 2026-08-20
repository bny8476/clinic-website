import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

export const AdminHeaderWidget = ({ greeting, subtitle, activeRole, formattedDate, branchName }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
        {greeting},{' '}
        <span className="text-[var(--color-primary)]">{activeRole}</span>
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">{subtitle}</p>
    </div>
    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
      <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm">
        <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
        <span className="font-medium text-[var(--color-navy-900)]">{formattedDate}</span>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm font-semibold text-[var(--color-navy-900)]">
        {branchName || 'Main Branch'}
      </div>
    </div>
  </div>
);

export const AdminKpiGridWidget = ({ kpiKeys, kpiData, KPI_META }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
    {kpiKeys?.map(key => {
      const meta = KPI_META[key] || { label: key, icon: Activity, color: 'slate' };
      const value = kpiData?.[key];
      const delta = kpiData?.deltas?.[key];
      const deltaType = kpiData?.deltaTypes?.[key];
      const isLoading = value === undefined || value === null;

      const displayValue = isLoading ? '—' : 
        meta.prefix ? `${meta.prefix}${Number(value).toLocaleString('en-IN')}` :
        meta.suffix ? `${Number(value).toLocaleString('en-IN')}${meta.suffix}` :
        Number(value).toLocaleString('en-IN');

      const subtext = delta !== undefined ? `${deltaType === 'up' ? '↑' : '↓'} ${delta} vs yesterday` : undefined;

      return (
        <KPICard
          key={key}
          title={meta.label}
          value={displayValue}
          icon={meta.icon}
          subtext={subtext}
          trend={deltaType === 'up' ? 'up' : deltaType === 'down' ? 'down' : 'neutral'}
        />
      );
    })}
  </div>
);

const SEVERITY_STYLES = {
  INFO:     { badge: 'bg-blue-100 text-blue-700',   icon: Activity },
  WARNING:  { badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  CRITICAL: { badge: 'bg-red-100 text-red-700',     icon: ShieldAlert },
};

const getRelativeTime = (isoStr) => {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

function AlertRow({ alert }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFO;
  const Icon = style.icon;
  const relTime = getRelativeTime(alert.createdAt);
  
  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${alert.severity === 'CRITICAL' ? 'bg-red-50' : 
          alert.severity === 'WARNING' ? 'bg-amber-50' : 'bg-blue-50'}`}>
        <Icon className={`w-4 h-4 
          ${alert.severity === 'CRITICAL' ? 'text-red-500' :
            alert.severity === 'WARNING' ? 'text-amber-500' : 'text-blue-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-800 truncate">{alert.title}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{relTime}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
              {alert.severity}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{alert.description}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label: lbl }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{lbl}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name?.includes('Revenue') || p.name?.includes('₹') 
            ? `₹${Number(p.value).toLocaleString('en-IN')}` 
            : p.value}
        </p>
      ))}
    </div>
  );
};

export const AdminChartAndAlertsWidget = ({ chartType, chartData, chartLabel, alerts }) => (
  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
    <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">{chartLabel}</h3>
        <button className="text-xs text-blue-500 font-semibold hover:underline">
          Operational breakdown
        </button>
      </div>
      {chartData?.length ? (
        <ResponsiveContainer width="100%" height={220}>
          {chartType === 'bar' ? (
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Sales Revenue" fill="#3B82F6" radius={[6,6,0,0]}
                   activeBar={{ fill: '#1D4ED8' }} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="value" name="Sales (₹)" stroke="#3B82F6" strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3B82F6" }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : chartType === 'dualBar' ? (
            <BarChart data={chartData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value"     name="Inflow"  fill="#3B82F6"   radius={[4,4,0,0]} />
              <Bar dataKey="secondary" name="Outflow" fill="#10B981" radius={[4,4,0,0]} />
            </BarChart>
          ) : null}
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>

    <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Active System Alerts</h3>
        <span className="text-xs text-gray-400 font-medium">{alerts?.length ?? 0} sources monitored</span>
      </div>
      <div className="space-y-0 overflow-y-auto max-h-[260px] pr-1">
        {alerts?.length ? (
          alerts.slice(0, 6).map(alert => <AlertRow key={alert.id} alert={alert} />)
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No active alerts</p>
        )}
      </div>
    </div>
  </div>
);

export const AdminRevenueStripWidget = ({ revenueStrip }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { label: "TODAY'S REVENUE",      key: 'todayRevenue' },
      { label: "THIS WEEK'S REVENUE",  key: 'weekRevenue' },
      { label: "THIS MONTH'S REVENUE", key: 'monthRevenue' },
    ].map(({ label, key }) => (
      <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">
          {revenueStrip?.[key] != null
            ? `₹${Number(revenueStrip[key]).toLocaleString('en-IN')}`
            : <span className="inline-block h-8 w-28 bg-gray-100 rounded animate-pulse" />}
        </p>
      </div>
    ))}
  </div>
);
