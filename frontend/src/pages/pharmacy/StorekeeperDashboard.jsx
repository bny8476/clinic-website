import { RotateCcw, AlertTriangle, Clock, Package, Box, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/pharmacy/SystemContext';
import { useConfig } from '../../context/pharmacy/ConfigContext';
import api from '../../utils/pharmacy/api';



const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-8 w-64 bg-slate-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
    <div className="grid grid-cols-1 gap-8">
      <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
    </div>
  </div>
);

export default function StorekeeperDashboard() {
  const navigate = useNavigate();
  const { systemData } = useSystem();
  const refreshIntervalSeconds = useConfig('dashboard_refresh_interval_seconds');
  const refreshInterval = (refreshIntervalSeconds ? Number(refreshIntervalSeconds) * 1000 : 60000);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get('/dashboard').then(r => r.data?.data || {}),
    refetchInterval: refreshInterval,
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => api.get('/pharmacy/stocks/low-stock').then(r => r.data?.data || []),
    refetchInterval: refreshInterval,
  });

  const isLoading = statsLoading || lowStockLoading;

  if (isLoading) return <DashboardSkeleton />;

  const lowStockMedicines = lowStockData || [];
  const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';

  const quickActions = [
    { label: 'Manage Stock', icon: Box, action: () => navigate('/stocks'), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Purchase Orders', icon: Package, action: () => navigate('/purchase-orders'), color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Indents', icon: RefreshCw, action: () => navigate('/pending-indents'), color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    
    <DashboardShell quickActions={quickActions}>
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
          {systemData?.greeting || 'Welcome'}, here's your Inventory Dashboard
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] font-medium m-0 mt-1">
          Stock alerts and supply chain overview as of {new Date().toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total SKUs In Stock"
          value={`${fmt(stats?.total_skus_in_stock)}`}
          icon={RotateCcw}
          colorToken="info"
        />
        <KPICard
          title="Low Stock Alerts"
          value={stats?.low_stock_alerts_count?.toString() || '0'}
          icon={AlertTriangle}
          colorToken="warning"
        />
        <KPICard
          title="Expiring Soon (30 days)"
          value={stats?.expiring_in_30_days_count?.toString() || '0'}
          icon={Clock}
          colorToken="danger"
        />
      </div>

      <DashboardGrid
        center={
          <Card>
            <Card.Header className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[var(--color-navy-900)] flex items-center gap-2 m-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Critical Low Stock
              </h3>
              <button onClick={() => navigate('/low-stock-alerts')} className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable
                data={lowStockMedicines}
                columns={[
                  { header: 'Medicine Name', render: (row) => row.medicineName || row.name },
                  { header: 'Current Stock', render: (row) => (
                    <span className="font-bold text-red-600">{row.currentStock}</span>
                  )},
                  { header: 'Reorder Level', accessor: 'reorderLevel' },
                  { header: 'Unit', accessor: 'unit' },
                  { header: 'Action', render: (row) => (
                    <button 
                      onClick={() => navigate('/purchase-orders')}
                      className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-800 transition-all">
                      Reorder
                    </button>
                  )}
                ]}
              />
            </Card.Body>
          </Card>
        }
      />
    </DashboardShell>
    
  );
}
