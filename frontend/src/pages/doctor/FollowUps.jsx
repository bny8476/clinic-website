import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const FollowUps = () => {
  const navigate = useNavigate();
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['doctor-follow-ups'],
    queryFn: async () => (await axiosPrivate.get('/doctor/follow-ups')).data,
  });

  return (
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)', margin: 0 }}>Follow-up Schedule</h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Track scheduled patient follow-up visits &amp; reviews</p>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {/* overflow-x-auto lets the table scroll horizontally on narrow viewports */}
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Patient Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Phone</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Scheduled Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Reason</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Loading follow-ups...</td></tr>}
              {!isLoading && followUps.length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No follow-ups found.</td></tr>}
              {followUps.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--color-surface-alt)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>{f.patientName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{f.phone}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text)' }}>{f.followUpDate}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{f.reason}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      background: f.status === 'OVERDUE' ? 'var(--color-danger-bg)' : f.status === 'DUE_TODAY' ? '#fef9c3' : 'var(--color-surface-alt)',
                      color: f.status === 'OVERDUE' ? '#991b1b' : f.status === 'DUE_TODAY' ? '#854d0e' : 'var(--color-text-muted)'
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => navigate('/doctor/calendar', { state: { prefillPatientId: f.patientId, prefillPatientName: f.patientName } })}
                      style={{ background: 'var(--color-info)', color: 'var(--color-surface)', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Book Visit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
