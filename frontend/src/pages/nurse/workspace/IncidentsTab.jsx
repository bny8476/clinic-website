import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import toast from 'react-hot-toast';

export const IncidentsTab = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [newIncident, setNewIncident] = useState({ medicationName: '', incidentType: 'WRONG_DOSE', description: '', actionTaken: '', doctorNotified: false, incidentTime: '' });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['medication-incidents', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/tasks/incidents/${patientId}`)).data
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (incidentData) => await axiosPrivate.post('/nursing/tasks/incidents', { ...incidentData, patientId, incidentTime: new Date(incidentData.incidentTime).toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(['medication-incidents', patientId]);
      setNewIncident({ medicationName: '', incidentType: 'WRONG_DOSE', description: '', actionTaken: '', doctorNotified: false, incidentTime: '' });
      toast.success('Incident reported');
    }
  });

  if (isLoading) return <div>Loading incidents...</div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }}>Medication Incidents</h2>
      
      <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#b91c1c' }}>Report Incident</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input placeholder="Medication Name" value={newIncident.medicationName} onChange={e => setNewIncident(p => ({...p, medicationName: e.target.value}))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
          <select value={newIncident.incidentType} onChange={e => setNewIncident(p => ({...p, incidentType: e.target.value}))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <option value="WRONG_DOSE">Wrong Dose</option>
            <option value="WRONG_TIME">Wrong Time</option>
            <option value="WRONG_PATIENT">Wrong Patient</option>
            <option value="WRONG_MEDICATION">Wrong Medication</option>
            <option value="ADVERSE_REACTION">Adverse Reaction</option>
            <option value="REFUSAL">Patient Refused</option>
          </select>
          <input type="datetime-local" value={newIncident.incidentTime} onChange={e => setNewIncident(p => ({...p, incidentTime: e.target.value}))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
        </div>
        <textarea placeholder="Incident Description" value={newIncident.description} onChange={e => setNewIncident(p => ({...p, description: e.target.value}))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', minHeight: '60px' }} />
        <textarea placeholder="Action Taken" value={newIncident.actionTaken} onChange={e => setNewIncident(p => ({...p, actionTaken: e.target.value}))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', minHeight: '60px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
          <input type="checkbox" checked={newIncident.doctorNotified} onChange={e => setNewIncident(p => ({...p, doctorNotified: e.target.checked}))} />
          Doctor Notified
        </label>
        <button 
          onClick={() => createIncidentMutation.mutate(newIncident)}
          disabled={!newIncident.medicationName || !newIncident.description || !newIncident.incidentTime || createIncidentMutation.isPending}
          style={{ padding: '8px 16px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}
        >
          Submit Report
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {incidents.map(inc => (
          <div key={inc.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{inc.incidentType}</span>
                <strong style={{ fontSize: '1rem' }}>{inc.medicationName}</strong>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(inc.incidentTime).toLocaleString()}</span>
            </div>
            <p style={{ margin: '8px 0', fontSize: '0.9rem' }}><strong>Description:</strong> {inc.description}</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#0f766e' }}><strong>Action:</strong> {inc.actionTaken}</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', fontWeight: 600, color: inc.doctorNotified ? '#15803d' : '#b91c1c' }}>Doctor Notified: {inc.doctorNotified ? 'Yes' : 'No'}</p>
          </div>
        ))}
        {incidents.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No incidents reported.</p>}
      </div>
    </div>
  );
};
