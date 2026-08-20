import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';



const LeaveManagement = () => {
  const { data: leaves = [] } = useQuery({
    queryKey: ['hr-leave-requests'],
    queryFn: async () => (await axiosPrivate.get('/hr/leaves')).data,
  });

  const sampleLeaves = leaves.length > 0 ? leaves : [
    { id: 1, employeeName: 'Nurse Sunita Sharma', leaveType: 'Casual Leave', startDate: '2026-07-30', endDate: '2026-07-31', days: 2, status: 'PENDING', reason: 'Personal family event' },
    { id: 2, employeeName: 'Anjali Gupta', leaveType: 'Sick Leave', startDate: '2026-07-24', endDate: '2026-07-24', days: 1, status: 'APPROVED', reason: 'Fever' },
  ];

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
        <CalendarX size={22} color="#be185d" aria-hidden="true" /> Leave Requests Management
      </h1>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '580px' }}>
            <thead style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Employee</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Type</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Dates &amp; Duration</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Reason</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleLeaves.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--color-surface-alt)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>{l.employeeName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text)' }}>{l.leaveType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{l.startDate} to {l.endDate} ({l.days}d)</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{l.reason}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
                      background: l.status === 'APPROVED' ? 'var(--color-success-bg)' : l.status === 'PENDING' ? '#fef9c3' : 'var(--color-danger-bg)',
                      color: l.status === 'APPROVED' ? 'var(--color-success)' : l.status === 'PENDING' ? '#854d0e' : 'var(--color-danger)'
                    }}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ background: 'var(--color-success)', color: 'var(--color-surface)', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Approve</button>
                        <button style={{ background: 'var(--color-danger)', color: 'var(--color-surface)', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
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

export default LeaveManagement;
