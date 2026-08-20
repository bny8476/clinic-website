import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const WardManagement = () => {

  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['nursing-assignments'],
    queryFn: async () => {
      const response = await axiosPrivate.get('/nursing/assignments');
      return response.data?.data || [];
    }
  });

  if (isLoading) return <div className="p-6 text-sm text-blue-600 font-medium">Loading assignments...</div>;
  if (error) return <div className="p-6 text-sm text-red-600 font-medium">Failed to load patient assignments.</div>;

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
        <BedDouble size={22} color="#0f766e" aria-hidden="true" /> My Patient Assignments
      </h1>

      {assignments.length === 0 ? (
        <p className="text-gray-500">No active patient assignments.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {assignments.map(assignment => (
            <div key={assignment.id} style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {assignment.patient?.firstName} {assignment.patient?.lastName}
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Assigned: {new Date(assignment.assignedAt).toLocaleString()}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span>Status</span>
                <span style={{ fontWeight: 700, color: '#0f766e' }}>{assignment.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    
  );
};

export default WardManagement;
