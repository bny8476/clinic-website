import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const HomeVisits = () => {
  const navigate = useNavigate();
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['patient-home-visits'],
    queryFn: async () => {
      try {
          return (await axiosPrivate.get('/v1/patient/home-visits')).data;
      } catch(e) {
          throw e;
      }
    }
  });

  const columns = [
    { key: 'id', title: 'Request ID', render: (val) => <span className="font-mono text-sm">REQ-{val}</span> },
    { key: 'serviceType', title: 'Service Requested' },
    { key: 'address', title: 'Location', render: (addr) => addr?.addressLine1 },
    { key: 'status', title: 'Status', render: (val) => (
      <Badge variant={val === 'COMPLETED' ? 'success' : val === 'EN_ROUTE' ? 'warning' : 'secondary'}>{val.replace('_', ' ')}</Badge>
    )}
  ];

  return (
    <DashboardShell tabs={[]} activeTab="" quickActions={[]}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
            <Home className="text-[var(--color-primary)]" /> Home Healthcare
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Track home visits and care requests.</p>
        </div>
        <Button onClick={() => navigate('/patient/home-visits/new')} className="flex items-center gap-2">
          <Plus size={16} /> Request Visit
        </Button>
      </div>
      
      <DashboardGrid center={
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
            <DataTable columns={columns} data={visits} isLoading={isLoading} emptyTitle="No Home Visits Requested" />
          </div>
      } />
    </DashboardShell>
  );
};
export default HomeVisits;
