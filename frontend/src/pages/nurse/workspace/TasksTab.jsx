import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import toast from 'react-hot-toast';

export const TasksTab = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState({ taskType: 'OBSERVATION', description: '', dueTime: '' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['nursing-tasks', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/tasks/my-tasks`)).data // This usually gets all assigned tasks, we might need to filter by patientId in the component or backend
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => await axiosPrivate.post('/nursing/tasks', { ...taskData, patientId, dueTime: new Date(taskData.dueTime).toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(['nursing-tasks']);
      setNewTask({ taskType: 'OBSERVATION', description: '', dueTime: '' });
      toast.success('Task created');
    }
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({taskId, status}) => await axiosPrivate.patch(`/nursing/tasks/${taskId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['nursing-tasks']);
      toast.success('Task updated');
    }
  });

  if (isLoading) return <div>Loading tasks...</div>;

  // Filter tasks for this patient (if the endpoint returned all my-tasks)
  const patientTasks = tasks.filter(t => t.patient?.id === parseInt(patientId) || t.patientId === parseInt(patientId));

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }}>Nursing Tasks</h2>
      
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Assign New Task</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '12px', alignItems: 'center' }}>
          <select 
            value={newTask.taskType} 
            onChange={e => setNewTask(p => ({...p, taskType: e.target.value}))}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
          >
            <option value="OBSERVATION">Observation</option>
            <option value="MEDICATION">Medication</option>
            <option value="PROCEDURE">Procedure</option>
            <option value="OTHER">Other</option>
          </select>
          <input 
            placeholder="Task Description" 
            value={newTask.description}
            onChange={e => setNewTask(p => ({...p, description: e.target.value}))}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
          />
          <input 
            type="datetime-local"
            value={newTask.dueTime}
            onChange={e => setNewTask(p => ({...p, dueTime: e.target.value}))}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
          />
          <button 
            onClick={() => createTaskMutation.mutate(newTask)}
            disabled={!newTask.description || !newTask.dueTime || createTaskMutation.isPending}
            style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Add Task
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {patientTasks.map(task => (
          <div key={task.id} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: task.status === 'COMPLETED' ? '#f0fdf4' : 'white' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{task.taskType}</span>
                <span style={{ fontSize: '0.85rem', color: task.status === 'COMPLETED' ? '#166534' : '#b91c1c', fontWeight: 600 }}>Due: {new Date(task.dueTime).toLocaleString()}</span>
              </div>
              <p style={{ margin: 0, fontWeight: 500 }}>{task.description}</p>
            </div>
            {task.status !== 'COMPLETED' && (
              <button 
                onClick={() => updateStatusMutation.mutate({taskId: task.id, status: 'COMPLETED'})}
                style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Mark Complete
              </button>
            )}
            {task.status === 'COMPLETED' && (
              <span style={{ color: '#10b981', fontWeight: 600 }}>Completed</span>
            )}
          </div>
        ))}
        {patientTasks.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No pending tasks.</p>}
      </div>
    </div>
  );
};
