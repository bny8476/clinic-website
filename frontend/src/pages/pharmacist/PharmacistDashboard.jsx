import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Pill, Activity } from 'lucide-react';



const PharmacistDashboard = () => {
  const { data: dispensed = [], isLoading } = useQuery({
    queryKey: ['dispensedPrescriptions'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/pharmacy/dispensed');
      return res.data;
    }
  });

  const columns = [
    {
      key: 'id',
      title: 'Dispensed ID',
      render: (val) => <span className="font-medium text-[var(--color-navy-800)]">#{val}</span>
    },
    {
      key: 'prescription.id',
      title: 'Prescription Ref',
      render: (_, row) => row.prescription?.id || 'N/A'
    },
    {
      key: 'dispensedAt',
      title: 'Time',
      render: (val) => <span className="text-[var(--color-text-muted)]">{new Date(val).toLocaleString()}</span>
    },
    {
      key: 'notes',
      title: 'Notes'
    }
  ];

  return (
    
    <DashboardShell
      tabs={['Dashboard', 'My Dispensed', 'Inventory']}
      activeTab="Dashboard"
      quickActions={[
        { label: 'Dispense Prescription', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-500/10', action: () => {} },
        { label: 'Check Stock', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10', action: () => {} }
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
          Pharmacist Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
          Review and dispense patient prescriptions.
        </p>
      </div>

      <DashboardGrid
        center={
          <Card>
            <Card.Header>
              <h3 className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0">My Dispensed Prescriptions</h3>
            </Card.Header>
            <Card.Body className="p-0 sm:p-0">
              <DataTable 
                columns={columns}
                data={dispensed}
                isLoading={isLoading}
                emptyTitle="No records found"
                emptyDescription="You haven't dispensed any prescriptions yet."
              />
            </Card.Body>
          </Card>
        }
      />
    </DashboardShell>
    
  );
};

export default PharmacistDashboard;
