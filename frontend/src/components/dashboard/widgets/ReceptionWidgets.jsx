import { Users, Clock, UserPlus, ArrowRight } from 'lucide-react';
import { fadeIn } from '../../ui/motion';

export const ReceptionKPIWidget = ({ walkInsData, isLoading }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <KPICard icon={Users} label="Total Walk-ins Today" value={isLoading ? '...' : walkInsData?.length || 0} colorToken="navy" />
    <KPICard icon={Clock} label="Patients Waiting" value={isLoading ? '...' : walkInsData?.length || 0} colorToken="warning" />
    <KPICard icon={UserPlus} label="New Registrations" value={isLoading ? '...' : walkInsData?.length || 0} colorToken="success" />
  </div>
);

export const ReceptionWaitingListWidget = ({ walkInsData, isLoading }) => {
  const columns = [
    { key: 'name', title: 'Patient Name', render: (_, row) => <span className="font-semibold text-[var(--color-navy-900)]">{row.firstName} {row.lastName}</span> },
    { key: 'phone', title: 'Phone' },
    { key: 'reasonForVisit', title: 'Reason for Visit' },
    { key: 'registeredAt', title: 'Registration Time', render: (val) => val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A' },
    { key: 'status', title: 'Status', render: () => <Badge variant="warning">Waiting</Badge> }
  ];

  return (
    <motion.div variants={fadeIn} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={walkInsData || []}
        isLoading={isLoading}
        searchPlaceholder="Search waiting patients..."
        emptyTitle="No waiting walk-ins"
        emptyDescription="All registered walk-in patients have been assigned or attended."
      />
    </motion.div>
  );
};

export const ReceptionHeaderWidget = () => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">Reception Desk</h1>
      <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">Real-time patient walk-ins, queue management, and registration portal.</p>
    </div>
    <div className="flex items-center gap-2">
      <Link to="/reception/register"><Button variant="secondary" icon={UserPlus}>Register Patient</Button></Link>
      <Link to="/reception/queue"><Button variant="primary" icon={ArrowRight}>Queue Management</Button></Link>
    </div>
  </div>
);
