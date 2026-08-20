import { Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AgentDashboard() {
    const stats = [
        { label: 'Open Tickets', value: '14', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Pending Customer', value: '5', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'SLA Breached', value: '2', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Resolved Today', value: '28', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' }
    ];

    return (
        <div className="p-6">
            <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">Support Dashboard</h1><p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">Overview of your active workload and SLAs</p></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Urgent Attention Needed</h3>
                <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No critical escalations or breached SLAs require your immediate attention right now.</p>
                </div>
            </div>
        </div>
    );
}
