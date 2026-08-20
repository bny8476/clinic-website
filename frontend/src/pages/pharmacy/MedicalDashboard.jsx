import { Stethoscope, Users, Activity, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/pharmacy/SystemContext';
import { useConfig } from '../../context/pharmacy/ConfigContext';
import api from '../../utils/pharmacy/api';



const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-8 w-64 bg-slate-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
  </div>
);

export default function MedicalDashboard() {
  const navigate = useNavigate();
  const { systemData } = useSystem();
  const refreshIntervalSeconds = useConfig('dashboard_refresh_interval_seconds');
  const refreshInterval = (refreshIntervalSeconds ? Number(refreshIntervalSeconds) * 1000 : 60000);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get('/dashboard').then(r => r.data?.data || {}),
    refetchInterval: refreshInterval,
  });

  const isLoading = statsLoading;

  if (isLoading) return <DashboardSkeleton />;

  const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';


  const quickActions = [
    { label: 'Pending Prescriptions', icon: Stethoscope, action: () => navigate('/pending-prescriptions'), color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Patients Directory', icon: Users, action: () => navigate('/patients'), color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];
  

  return (
    
    <DashboardShell quickActions={quickActions}>
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
          {systemData?.greeting || 'Welcome'}, here's your Medical Dashboard
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] font-medium m-0 mt-1">
          Clinical operations overview as of {new Date().toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="Pending Prescriptions"
          value={`${fmt(stats?.pending_prescriptions_count)}`}
          icon={Stethoscope}
          colorToken="primary"
        />
        <KPICard
          title="Active Patients Today"
          value={`${fmt(stats?.active_patients_today_count)}`}
          icon={Activity}
          colorToken="info"
        />
      </div>

      <DashboardGrid
        center={
          <Card className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100/50">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--color-navy-900)] mb-2">Clinical Workspace</h3>
            <p className="text-[var(--color-text-muted)] max-w-md mb-6">
              Review patient history, issue new prescriptions, and manage medical workflows directly from the navigation menu.
            </p>
            <Button onClick={() => navigate('/patients')} variant="primary" icon={ArrowRight}>
              Browse Patients
            </Button>
          </Card>
        }
      />
    </DashboardShell>
    
  );
}
