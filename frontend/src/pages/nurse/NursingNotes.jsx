import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useSearchParams, Link } from 'react-router-dom';
import { FileText, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';



const NursingNotes = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId');
  
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ? parseInt(initialPatientId) : null);
  const [noteContent, setNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['nurse-assigned-patients'],
    queryFn: async () => (await axiosPrivate.get('/nursing/assignments/op')).data,
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['nursing-notes', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const res = await axiosPrivate.get(`/patients/${selectedPatientId}/nursing-notes`);
      return res.data;
    },
    enabled: !!selectedPatientId,
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const payload = {
        patientId: selectedPatientId,
        content: noteContent
      };
      const res = await axiosPrivate.post(`/patients/${selectedPatientId}/nursing-notes`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Note added successfully');
      setIsAdding(false);
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['nursing-notes', selectedPatientId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add note');
    }
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }
    addNote.mutate();
  };

  const selectedPatient = assignments.find(a => a.patientId === selectedPatientId);

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/nurse" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <FileText className="w-7 h-7 text-[var(--color-navy-800)]" />
            Nursing Notes
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Document clinical observations and nursing assessments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <Card.Header>
              <h2 className="text-[13px] font-bold text-[var(--color-navy-900)] uppercase tracking-wider">Assigned Patients</h2>
            </Card.Header>
            <Card.Body className="p-0 max-h-[600px] overflow-y-auto">
              {isLoadingAssignments ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
              ) : assignments.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">No assigned patients</div>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {assignments.map(a => (
                    <li 
                      key={a.patientId} 
                      className={`p-3 cursor-pointer transition-colors ${selectedPatientId === a.patientId ? 'bg-[var(--color-navy-50)] border-l-4 border-l-[var(--color-navy-600)]' : 'hover:bg-[var(--color-surface-alt)]'}`}
                      onClick={() => { setSelectedPatientId(a.patientId); setIsAdding(false); }}
                    >
                      <p className="font-bold text-[var(--color-navy-900)] text-sm truncate">{a.patientName}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{a.appointmentReason || 'OP Consultation'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="md:col-span-3">
          {!selectedPatientId ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <Card.Body className="flex flex-col items-center justify-center text-center p-8">
                <FileText className="w-12 h-12 text-[var(--color-navy-200)] mb-4" />
                <h3 className="text-lg font-bold text-[var(--color-navy-900)] mb-2">Select a Patient</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Choose a patient from your assigned list to view or add notes.</p>
              </Card.Body>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-navy-900)]">{selectedPatient?.patientName || `Patient #${selectedPatientId}`}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {selectedPatient?.age && `${selectedPatient.age}y`} • {selectedPatient?.gender || 'N/A'}
                  </p>
                </div>
                {!isAdding && (
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAdding(true)}>
                    Add Note
                  </Button>
                )}
              </div>

              {isAdding && (
                <Card className="border-[var(--color-navy-200)] shadow-md">
                  <Card.Header>
                    <h3 className="text-[13px] font-bold text-[var(--color-navy-900)]">New Nursing Note</h3>
                  </Card.Header>
                  <Card.Body>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                      <FormField label="Note Content" required id="noteContent">
                        <textarea 
                          id="noteContent"
                          value={noteContent} 
                          onChange={e => setNoteContent(e.target.value)} 
                          placeholder="Enter clinical observations, patient complaints, or care provided..."
                          className="input-field min-h-[120px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" 
                          required
                        />
                      </FormField>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => { setIsAdding(false); setNoteContent(''); }}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={addNote.isPending}>Save Note</Button>
                      </div>
                    </form>
                  </Card.Body>
                </Card>
              )}

              <Card>
                <Card.Header>
                  <h3 className="text-[13px] font-bold text-[var(--color-navy-900)]">Note History</h3>
                </Card.Header>
                <Card.Body className="p-0">
                  {isLoadingNotes ? (
                    <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading notes...</div>
                  ) : notes.length === 0 ? (
                    <div className="p-8 text-center">
                       <EmptyState icon={FileText} title="No Notes" description="No nursing notes have been recorded for this patient." />
                    </div>
                  ) : (
                    <ul className="divide-y divide-[var(--color-border)]">
                      {notes.map((note, idx) => (
                        <li key={idx} className="p-5 hover:bg-[var(--color-surface-alt)] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-[var(--color-navy-600)] bg-[var(--color-navy-50)] px-2 py-1 rounded">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                              By: {note.authorName || 'Nurse'}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      </div>
    </motion.div>
    
  );
};

export default NursingNotes;
