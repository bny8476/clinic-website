import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

const DoctorAnalytics = () => {
  const { data: analytics = {}, isLoading } = useQuery({
    queryKey: ['doctor-analytics'],
    queryFn: async () => (await axiosPrivate.get('/doctor/analytics')).data,
  });

  const { 
    patientSatisfactionRating = 0, 
    reviewCount = 0, 
    avgConsultTimeMin = 0, 
    followUpRatePercent = 0, 
    monthlyVolume = [] 
  } = analytics;
  return (
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: 'var(--color-text)' }}>Performance Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Patient Satisfaction Rating</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            {reviewCount > 0 ? (
              <>
                <Star size={24} color="#eab308" fill="#eab308" />
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>{patientSatisfactionRating}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({reviewCount} reviews)</span>
              </>
            ) : (
              <>
                <Star size={24} color="var(--color-text-muted)" />
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>N/A</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>(0 reviews)</span>
              </>
            )}
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Avg. Consult Time</p>
          <h2 style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-info)' }}>{avgConsultTimeMin} min</h2>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Follow-up Rate</p>
          <h2 style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>{followUpRatePercent}%</h2>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Monthly Patient Volume</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', padding: '20px 0 0', borderBottom: '1px solid var(--color-border)' }}>
          {monthlyVolume.map(bar => (
            <div key={bar.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-info)', marginBottom: '4px' }}>{bar.count}</span>
              <div style={{ width: '100%', background: 'var(--color-info)', height: `${(bar.count / 160) * 100}%`, borderRadius: '6px 6px 0 0', transition: 'height 0.3s' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>{bar.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalytics;
