import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const DoctorEarnings = () => {
  const { data: earningsData = {}, isLoading } = useQuery({
    queryKey: ['doctor-earnings'],
    queryFn: async () => (await axiosPrivate.get('/doctor/earnings')).data,
  });

  const stats = {
    today: earningsData.today || 0,
    thisWeek: earningsData.thisWeek || 0,
    thisMonth: earningsData.thisMonth || 0,
    totalConsultations: earningsData.totalConsultations || 0,
  };

  const recentPayouts = earningsData.recentPayouts || [];

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: 'var(--color-text)' }}>Earnings &amp; Consultations</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: "Today's Earnings", val: `₹${stats.today.toLocaleString()}`, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
          { label: 'This Week', val: `₹${stats.thisWeek.toLocaleString()}`, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
          { label: 'This Month', val: `₹${stats.thisMonth.toLocaleString()}`, color: '#9333ea', bg: '#fdf4ff' },
          { label: 'Total Consultations', val: stats.totalConsultations, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{m.label}</p>
            <h2 style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 800, color: m.color }}>{m.val}</h2>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Recent Consultation Payouts</h3>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '480px' }}>
          <thead style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              <th style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Date</th>
              <th style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Patient</th>
              <th style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Type</th>
              <th style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Fee</th>
              <th style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Doctor Share</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading earnings...</td></tr>}
            {!isLoading && recentPayouts.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No recent payouts found.</td></tr>}
            {recentPayouts.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-surface-alt)', fontSize: '0.85rem' }}>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{row.date}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-text)' }}>{row.patient}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{row.type}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text)' }}>₹{row.fee}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-success)' }}>₹{row.doctorShare}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>{/* overflow-x-auto */}
      </div>
    </div>
    
  );
};

export default DoctorEarnings;
