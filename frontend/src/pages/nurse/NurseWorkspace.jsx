import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Activity, AlertTriangle, Pill, ClipboardList, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';




const NurseWorkspace = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');

  const { data: patient360, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await axiosPrivate.get(`/patients/${patientId}/360`)).data
  });
  
  const patient = patient360?.identity;
  const profile = patient360?.profile;

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['nursing-notes', patientId],
    queryFn: async () => (await axiosPrivate.get(`/nursing/documentation/notes/${patientId}`)).data,
    enabled: activeTab === 'notes'
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note) => await axiosPrivate.post('/nursing/documentation/notes', {
      patientId: patientId,
      noteType: 'PROGRESS',
      content: note
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['nursing-notes', patientId]);
      setNewNote('');
      toast.success('Nursing note added successfully');
    }
  });

  if (patientLoading) return <div className="p-6">Loading workspace...</div>;

  const tabs = [
    { id: 'notes', label: 'Nursing Notes', icon: FileText },
    { id: 'care-plans', label: 'Care Plans', icon: Activity },
    { id: 'assessments', label: 'Assessments (Fall/Pain)', icon: AlertTriangle },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'incidents', label: 'Incidents', icon: Pill },
    { id: 'checklists', label: 'Checklists', icon: CheckCircle },
  ];

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <button 
        onClick={() => navigate('/nurse/dashboard')} 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {patient?.firstName} {patient?.lastName}
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>MRN: {profile?.opNumber} | DOB: {profile?.dateOfBirth}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '8px',
              background: activeTab === tab.id ? '#ccfbf1' : 'var(--color-surface)',
              color: activeTab === tab.id ? '#0f766e' : 'var(--color-text-muted)',
              border: activeTab === tab.id ? '1px solid #99f6e4' : '1px solid var(--color-border)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', minHeight: '400px', padding: '24px' }}>
        {activeTab === 'notes' && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }}>Nursing Notes</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <textarea 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a progress note..."
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '80px', fontFamily: 'inherit' }}
              />
              <button 
                onClick={() => createNoteMutation.mutate(newNote)}
                disabled={!newNote.trim() || createNoteMutation.isPending}
                style={{ padding: '0 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
            {notesLoading ? <p>Loading notes...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notes.map(note => (
                  <div key={note.id} style={{ padding: '16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <strong>{note.noteType}</strong>
                      <span>{new Date(note.recordedAt || note.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{note.note}</p>
                  </div>
                ))}
                {notes.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>No notes recorded yet.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'care-plans' && <CarePlansTab patientId={patientId} />}
        {activeTab === 'tasks' && <TasksTab patientId={patientId} />}
        {activeTab === 'assessments' && <AssessmentsTab patientId={patientId} />}
        {activeTab === 'incidents' && <IncidentsTab patientId={patientId} />}
        {activeTab === 'checklists' && <ChecklistsTab patientId={patientId} />}
      </div>
    </div>
    
  );
};

export default NurseWorkspace;
