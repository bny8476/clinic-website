import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import toast from 'react-hot-toast';

export const CarePlansTab = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [newPlan, setNewPlan] = useState({ diagnosis: '', goals: '', interventions: '' });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['care-plans', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/documentation/care-plans/${patientId}`)).data
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData) => await axiosPrivate.post('/nursing/documentation/care-plans', { ...planData, patientId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['care-plans', patientId]);
      setNewPlan({ diagnosis: '', goals: '', interventions: '' });
      toast.success('Care plan created');
    }
  });

  if (isLoading) return <div>Loading care plans...</div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }}>Nursing Care Plans</h2>
      
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Create New Care Plan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            placeholder="Nursing Diagnosis" 
            value={newPlan.diagnosis}
            onChange={e => setNewPlan(p => ({...p, diagnosis: e.target.value}))}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
          />
          <textarea 
            placeholder="Goals" 
            value={newPlan.goals}
            onChange={e => setNewPlan(p => ({...p, goals: e.target.value}))}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', minHeight: '60px' }}
          />
          <textarea 
            placeholder="Interventions" 
            value={newPlan.interventions}
            onChange={e => setNewPlan(p => ({...p, interventions: e.target.value}))}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', minHeight: '60px' }}
          />
          <button 
            onClick={() => createPlanMutation.mutate(newPlan)}
            disabled={!newPlan.diagnosis || createPlanMutation.isPending}
            style={{ alignSelf: 'flex-start', padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Save Care Plan
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, color: '#0f766e' }}>{plan.diagnosis}</h4>
              <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{plan.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Goals</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{plan.goals}</p>
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Interventions</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{plan.interventions}</p>
              </div>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No care plans found.</p>}
      </div>
    </div>
  );
};
