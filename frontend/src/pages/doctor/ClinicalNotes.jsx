import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const ClinicalNotes = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [note, setNote] = useState({ subjective: '', objective: '', assessment: '', plan: '' });

  const { data: patient } = useQuery({
    queryKey: ['patient-info', patientId],
    queryFn: async () => (await axiosPrivate.get(`/patients/${patientId}`)).data,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: async () => (await axiosPrivate.get(`/medical-records/patient/${patientId}/clinical-notes`)).data,
  });

  const saveNote = useMutation({
    mutationFn: async () => axiosPrivate.post(`/medical-records/patient/${patientId}/clinical-notes`, note),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient-notes', patientId]);
      setNote({ subjective: '', objective: '', assessment: '', plan: '' });
    },
  });

  const fields = [
    { key: 'subjective', label: 'S — Subjective', placeholder: "Patient's complaints and history…" },
    { key: 'objective', label: 'O — Objective', placeholder: 'Vitals, physical findings, lab results…' },
    { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis, differential diagnosis…' },
    { key: 'plan', label: 'P — Plan', placeholder: 'Treatment plan, medications, follow-up…' },
  ];

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} style={{ background: 'var(--color-surface-alt)', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Clinical Notes</h1>
            {patient && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{patient.name} · {patient.age}y · {patient.bloodGroup}</p>}
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto flex-wrap">
          <button onClick={() => navigate(`/doctor/patients/${patientId}/prescriptions/new`)}
            style={{ background: 'var(--color-info)', color: 'var(--color-surface)', border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Pill size={13} /> Prescribe
          </button>
          <button onClick={() => navigate(`/doctor/patients/${patientId}/lab-request`)}
            style={{ background: '#0e7490', color: 'var(--color-surface)', border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FlaskConical size={13} /> Order Tests
          </button>
          <button onClick={() => navigate(`/doctor/patients/${patientId}/radiology-request`)}
            style={{ background: '#6366f1', color: 'var(--color-surface)', border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HeartPulse size={13} /> Order Imaging
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* SOAP note form */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--color-info)" /> New SOAP Note
          </h2>
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>{label}</label>
              <textarea
                value={note[key]}
                onChange={e => setNote(n => ({ ...n, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          ))}
          <button onClick={() => saveNote.mutate()} disabled={saveNote.isPending}
            style={{ background: 'var(--color-info)', color: 'var(--color-surface)', border: 'none', padding: '10px 20px', borderRadius: '7px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
            <Save size={14} /> Save Note
          </button>
        </div>

        {/* History */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Previous Notes</h2>
          {notes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No notes yet</p>
          ) : notes.map((n, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--color-surface-alt)', paddingBottom: '12px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</p>
              {n.subjective && <p style={{ margin: '2px 0', fontSize: '0.8rem', color: 'var(--color-text)' }}><strong>S:</strong> {n.subjective}</p>}
              {n.assessment && <p style={{ margin: '2px 0', fontSize: '0.8rem', color: 'var(--color-text)' }}><strong>A:</strong> {n.assessment}</p>}
              {n.plan && <p style={{ margin: '2px 0', fontSize: '0.8rem', color: 'var(--color-text)' }}><strong>P:</strong> {n.plan}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
    
  );
};

export default ClinicalNotes;
