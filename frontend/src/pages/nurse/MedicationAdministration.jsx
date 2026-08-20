import { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { axiosPrivate } from '../../api/axios';



const MedicationAdministration = () => {
  const [marList, setMarList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarList = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/nursing/mar');
      setMarList(response.data.data || []);
      setError(null);
    } catch (err) {
      logger.error(err);
      setError('Failed to load Medication Administration Records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarList();
  }, []);

  const markGiven = async (id) => {
    try {
      await axiosPrivate.post(`/nursing/mar/${id}/administer`);
      fetchMarList();
    } catch (err) {
      logger.error(err);
      toast.error('Failed to update status.');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Pill size={24} color="#0f766e" /> Medication Administration Record (MAR)
      </h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>Patient & Bed</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>Medication & Dose</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>Scheduled Time</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
            ) : marList.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No medications due.</td></tr>
            ) : marList.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{m.patientName} (Bed {m.bedNumber})</td>
                <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{m.medicationName} ({m.dosage})</td>
                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{formatTime(m.scheduledTime)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    background: m.status === 'GIVEN' ? '#dcfce7' : '#fef9c3',
                    color: m.status === 'GIVEN' ? '#15803d' : '#854d0e'
                  }}>
                    {m.status === 'GIVEN' ? `Given at ${formatTime(m.administeredAt)}` : 'DUE NOW'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {m.status === 'DUE' && (
                    <button onClick={() => markGiven(m.id)} style={{ background: '#0f766e', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      Mark Administered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    
  );
};

export default MedicationAdministration;
