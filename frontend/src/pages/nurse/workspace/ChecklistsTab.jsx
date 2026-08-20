import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import toast from 'react-hot-toast';

export const ChecklistsTab = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [checklistType, setChecklistType] = useState('ADMISSION');

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['nursing-checklists', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/escalations/checklists/${patientId}`)).data
  });

  const createChecklistMutation = useMutation({
    mutationFn: async () => {
      // Create a default JSON structure
      const itemsJson = JSON.stringify([
        { id: 1, label: 'Verify Patient ID', checked: false },
        { id: 2, label: 'Review Allergies', checked: false },
        { id: 3, label: 'Check Vitals', checked: false }
      ]);
      return await axiosPrivate.post('/nursing/escalations/checklists', { patientId, checklistType, itemsJson });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['nursing-checklists', patientId]);
      toast.success('Checklist created');
    }
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ checklistId, status, itemsJson }) => await axiosPrivate.patch(`/nursing/escalations/checklists/${checklistId}`, { status, itemsJson }),
    onSuccess: () => {
      queryClient.invalidateQueries(['nursing-checklists', patientId]);
    }
  });

  const handleToggleCheck = (checklist, itemId) => {
    let items = JSON.parse(checklist.itemsJson);
    items = items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item);
    const allChecked = items.every(item => item.checked);
    
    updateChecklistMutation.mutate({
      checklistId: checklist.id,
      status: allChecked ? 'COMPLETED' : 'IN_PROGRESS',
      itemsJson: JSON.stringify(items)
    });
  };

  if (isLoading) return <div>Loading checklists...</div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }}>Checklists</h2>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select value={checklistType} onChange={e => setChecklistType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
          <option value="ADMISSION">Admission Checklist</option>
          <option value="TRANSFER">Transfer Checklist</option>
          <option value="PRE_OP">Pre-Op Checklist</option>
          <option value="DISCHARGE">Discharge Checklist</option>
        </select>
        <button 
          onClick={() => createChecklistMutation.mutate()}
          disabled={createChecklistMutation.isPending}
          style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Start New Checklist
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {checklists.map(checklist => {
          const items = JSON.parse(checklist.itemsJson);
          return (
            <div key={checklist.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <strong style={{ fontSize: '1.1rem' }}>{checklist.checklistType}</strong>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, background: checklist.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: checklist.status === 'COMPLETED' ? '#166534' : '#854d0e' }}>
                  {checklist.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={() => handleToggleCheck(checklist, item.id)} 
                      disabled={checklist.status === 'COMPLETED'}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {checklists.length === 0 && <p style={{ color: 'var(--color-text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>No active checklists.</p>}
      </div>
    </div>
  );
};
