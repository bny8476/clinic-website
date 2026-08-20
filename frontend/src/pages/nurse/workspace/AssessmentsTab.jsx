import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import toast from 'react-hot-toast';

export const AssessmentsTab = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [assessmentType, setAssessmentType] = useState('FALL'); // FALL or PAIN
  
  // Fall Risk Form State
  const [fallScore, setFallScore] = useState('');
  const [fallNotes, setFallNotes] = useState('');
  
  // Pain Form State
  const [painScore, setPainScore] = useState('');
  const [painLocation, setPainLocation] = useState('');
  const [painChars, setPainChars] = useState('');
  const [painInterventions, setPainInterventions] = useState('');

  const { data: fallAssessments = [] } = useQuery({
    queryKey: ['fall-assessments', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/documentation/fall-risk/${patientId}`)).data
  });

  const { data: painAssessments = [] } = useQuery({
    queryKey: ['pain-assessments', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/documentation/pain/${patientId}`)).data
  });

  const createFallMutation = useMutation({
    mutationFn: async () => await axiosPrivate.post('/nursing/documentation/fall-risk', {
      patientId, score: parseInt(fallScore), notes: fallNotes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fall-assessments']);
      setFallScore(''); setFallNotes('');
      toast.success('Fall risk assessment saved');
    }
  });

  const createPainMutation = useMutation({
    mutationFn: async () => await axiosPrivate.post('/nursing/documentation/pain', {
      patientId, painScore: parseInt(painScore), painLocation, painCharacteristics: painChars, interventions: painInterventions
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pain-assessments']);
      setPainScore(''); setPainLocation(''); setPainChars(''); setPainInterventions('');
      toast.success('Pain assessment saved');
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setAssessmentType('FALL')}
          style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 600, background: assessmentType === 'FALL' ? '#0f766e' : '#e2e8f0', color: assessmentType === 'FALL' ? 'white' : 'var(--color-text)' }}
        >
          Fall Risk Assessment (Morse)
        </button>
        <button 
          onClick={() => setAssessmentType('PAIN')}
          style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 600, background: assessmentType === 'PAIN' ? '#0f766e' : '#e2e8f0', color: assessmentType === 'PAIN' ? 'white' : 'var(--color-text)' }}
        >
          Pain Assessment
        </button>
      </div>

      {assessmentType === 'FALL' && (
        <>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>New Fall Risk Assessment</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="number" placeholder="Total Morse Score" value={fallScore} onChange={e => setFallScore(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', width: '150px' }} />
              <input placeholder="Clinical Notes" value={fallNotes} onChange={e => setFallNotes(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', flex: 1 }} />
              <button onClick={() => createFallMutation.mutate()} disabled={!fallScore || createFallMutation.isPending} style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fallAssessments.map(fa => (
              <div key={fa.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>Score: {fa.score}</strong> <span style={{ color: fa.riskLevel === 'HIGH' ? '#b91c1c' : '#15803d', fontWeight: 700, marginLeft: '8px' }}>[{fa.riskLevel} RISK]</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{fa.notes}</p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(fa.assessedAt || fa.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {assessmentType === 'PAIN' && (
        <>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>New Pain Assessment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '12px' }}>
              <input type="number" placeholder="Pain Score (0-10)" min="0" max="10" value={painScore} onChange={e => setPainScore(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
              <input placeholder="Location" value={painLocation} onChange={e => setPainLocation(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
              <input placeholder="Characteristics (e.g. throbbing)" value={painChars} onChange={e => setPainChars(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
            </div>
            <input placeholder="Interventions" value={painInterventions} onChange={e => setPainInterventions(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
            <button onClick={() => createPainMutation.mutate()} disabled={!painScore || createPainMutation.isPending} style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>Save</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {painAssessments.map(pa => (
              <div key={pa.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Pain Score: {pa.painScore}/10</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(pa.assessedAt || pa.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>Location: {pa.painLocation} | Nature: {pa.painCharacteristics}</p>
                {pa.interventions && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#0f766e' }}>Interventions: {pa.interventions}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
