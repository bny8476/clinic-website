import { Users, Activity, FileSpreadsheet, IndianRupee, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/pharmacy/SystemContext';
import { useConfig } from '../../context/pharmacy/ConfigContext';
import api from '../../utils/pharmacy/api';



const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-8 w-64 bg-slate-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
  </div>
);

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { systemData } = useSystem();
  const refreshIntervalSeconds = useConfig('dashboard_refresh_interval_seconds');
  const refreshInterval = (refreshIntervalSeconds ? Number(refreshIntervalSeconds) * 1000 : 60000);
  const currencySymbol = useConfig('currency_symbol') || '₹';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get('/dashboard').then(r => r.data?.data || {}),
    refetchInterval: refreshInterval,
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.get('/dashboard/alerts').then(r => r.data?.data || []),
    refetchInterval: refreshInterval,
  });

  const isLoading = statsLoading || alertsLoading;

  if (isLoading) return <DashboardSkeleton />;

  const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
  const alerts = alertsData || [];

  const quickActions = [
    { label: 'View Analytics', icon: FileSpreadsheet, action: () => navigate('/reports'), color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    
    <DashboardShell quickActions={quickActions}>
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
          {systemData?.greeting || 'Welcome'}, here's your Supervisor Dashboard
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] font-medium m-0 mt-1">
          Operational oversight and team activity as of {new Date().toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Staff"
          value={`${fmt(stats?.active_staff)}`}
          icon={Users}
          colorToken="primary"
        />
        <KPICard
          title="Today's Bills"
          value={`${fmt(stats?.bills_today)}`}
          icon={FileSpreadsheet}
          colorToken="info"
        />
        <KPICard
          title="Today's Revenue"
          value={`${currencySymbol} ${fmt(stats?.todays_sales_revenue)}`}
          icon={IndianRupee}
          colorToken="success"
        />
        <KPICard
          title="Active Patients"
          value={`${fmt(stats?.active_patients_today_count)}`}
          icon={Activity}
          colorToken="warning"
        />
      </div>

      <DashboardGrid
        left={
          <Card className="h-full">
            <Card.Header>
              <h3 className="font-bold text-lg text-[var(--color-navy-900)] flex items-center gap-2 m-0">
                <Bell className="w-5 h-5 text-indigo-500" /> Active System Alerts
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-[var(--color-text-muted)] text-center py-4">No active alerts.</p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' : alert.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-navy-900)] text-sm">{alert.title}</h4>
                        <p className="text-[var(--color-text-muted)] text-sm mt-1">{alert.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        }
        center={
          <Card className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-indigo-100/50">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--color-navy-900)] mb-2">Management Controls</h3>
            <p className="text-[var(--color-text-muted)] max-w-md mb-6">
              Review detailed reports, manage user access, and oversee clinical and financial operations.
            </p>
            <Button onClick={() => navigate('/reports')} variant="primary" icon={ArrowRight}>
              View Analytics & Reports
            </Button>
          </Card>
        }
      />
    </DashboardShell>
    
  );
}
