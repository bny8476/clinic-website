import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useSearchParams } from 'react-router-dom';
import { FileText, Users, UserSearch, Plus, Send, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, staggerChildren } from '../../components/ui/motion';

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
    <div className="min-h-full bg-[#F8FAFC] p-6 lg:p-8 w-full font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-5 pb-2">
          <div className="p-4 bg-[#EDF2FF] rounded-2xl flex-shrink-0">
            <FileText className="w-8 h-8 text-[#2160FF]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 mb-1 tracking-tight">Nursing Notes</h1>
            <p className="text-[14.5px] text-gray-500 font-medium">Document clinical observations and nursing assessments.</p>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">
          
          {/* Left Sidebar - Assigned Patients */}
          <div className="w-full lg:w-[320px] flex-shrink-0 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="px-6 pt-6 border-b border-gray-100 flex flex-col">
              <div className="flex items-center gap-3 pb-4">
                <Users className="w-5 h-5 text-[#2160FF]" strokeWidth={2.5} />
                <h3 className="text-[15px] font-bold text-slate-800">Assigned Patients</h3>
              </div>
              <div className="w-10 h-0.5 bg-[#2160FF] rounded-t-full"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white p-2">
              {isLoadingAssignments ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-3 border-[#EDF2FF] border-t-[#2160FF] rounded-full animate-spin"></div>
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-16 h-full">
                  <div className="w-20 h-20 bg-[#F0F5FF] rounded-full flex items-center justify-center mb-5 relative">
                    <Users className="w-10 h-10 text-[#2160FF]" strokeWidth={2.5} />
                    {/* Sparkles */}
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-[#2160FF]/30 rotate-45"></div>
                    <div className="absolute top-4 right-2 w-2 h-2 bg-[#2160FF]/40 rotate-45"></div>
                    <div className="absolute bottom-4 left-3 w-1 h-1 bg-[#2160FF]/40 rotate-45"></div>
                    <div className="absolute bottom-6 right-1 w-1.5 h-1.5 bg-[#2160FF]/30 rotate-45"></div>
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800 mb-1.5">No assigned patients</h3>
                  <p className="text-[13.5px] text-gray-500 font-medium leading-relaxed">Patients assigned to you will appear here.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {assignments.map(a => (
                    <li key={a.patientId}>
                      <button 
                        onClick={() => { setSelectedPatientId(a.patientId); setIsAdding(false); }}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3 ${selectedPatientId === a.patientId ? 'bg-[#2160FF] shadow-md shadow-blue-500/20' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${selectedPatientId === a.patientId ? 'bg-white/20 text-white' : 'bg-[#F0F5FF] text-[#2160FF]'}`}>
                          {a.patientName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[14px] font-bold truncate ${selectedPatientId === a.patientId ? 'text-white' : 'text-slate-800'}`}>
                            {a.patientName}
                          </p>
                          <p className={`text-[12px] font-medium truncate mt-0.5 ${selectedPatientId === a.patientId ? 'text-blue-100' : 'text-gray-500'}`}>
                            {a.appointmentReason || 'OP Consultation'}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Main Area - Notes Section */}
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-6 lg:p-8">
            
            {!selectedPatientId ? (
              // Empty State
              <div className="h-full border-2 border-dashed border-gray-200 rounded-[20px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
                <div className="w-24 h-24 bg-[#F0F5FF] rounded-full flex items-center justify-center mb-6 relative">
                  <FileText className="w-10 h-10 text-[#2160FF]" strokeWidth={2.5} />
                  {/* Sparkles */}
                  <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-[#2160FF]/30 rotate-45"></div>
                  <div className="absolute top-3 right-5 w-2 h-2 bg-[#2160FF]/40 rotate-45"></div>
                  <div className="absolute bottom-5 left-4 w-1.5 h-1.5 bg-[#2160FF]/40 rotate-45"></div>
                  <div className="absolute bottom-8 right-2 w-1.5 h-1.5 bg-[#2160FF]/30 rotate-45"></div>
                </div>
                <h2 className="text-[22px] font-extrabold text-slate-900 mb-2">Select a Patient</h2>
                <p className="text-[14.5px] text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
                  Choose a patient from your assigned list to view or add notes.
                </p>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#F0F5FF] hover:bg-[#E5EEFF] text-[#2160FF] font-bold rounded-xl transition-colors cursor-default">
                  <UserSearch className="w-4 h-4" strokeWidth={2.5} /> Choose Patient
                </button>
              </div>
            ) : (
              // Active State
              <div className="flex flex-col h-full gap-6">
                
                {/* Active Patient Header */}
                <div className="flex items-center justify-between p-5 bg-[#F0F5FF] rounded-2xl border border-blue-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white text-[#2160FF] font-black text-xl flex items-center justify-center shadow-sm">
                      {selectedPatient?.patientName ? selectedPatient.patientName[0] : '?'}
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 mb-0.5">{selectedPatient?.patientName || `Patient #${selectedPatientId}`}</h2>
                      <p className="text-[13px] text-[#2160FF] font-bold">
                        {selectedPatient?.age && `${selectedPatient.age} Yrs`} • {selectedPatient?.gender || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {!isAdding && (
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" strokeWidth={3} /> Add Note
                    </button>
                  )}
                </div>

                {/* Add Note Form */}
                {isAdding && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 border-2 border-[#2160FF]/20 bg-[#F8FAFF] rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-[#2160FF]" strokeWidth={2.5} />
                      <h3 className="text-[14px] font-bold text-slate-800">New Nursing Note</h3>
                    </div>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                      <textarea 
                        value={noteContent} 
                        onChange={e => setNoteContent(e.target.value)} 
                        placeholder="Enter clinical observations, patient complaints, or care provided..."
                        className="w-full min-h-[120px] p-4 bg-white border border-blue-200 rounded-xl text-[14px] font-medium text-slate-700 focus:outline-none focus:border-[#2160FF] focus:ring-4 focus:ring-[#2160FF]/10 resize-none transition-all shadow-sm" 
                        required
                      />
                      <div className="flex justify-end gap-3">
                        <button 
                          type="button" 
                          onClick={() => { setIsAdding(false); setNoteContent(''); }}
                          className="px-5 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-200 transition-colors bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={addNote.isPending}
                          className="flex items-center gap-2 px-6 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" strokeWidth={2.5} /> {addNote.isPending ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-2xl bg-white p-2 flex flex-col">
                  {isLoadingNotes ? (
                    <div className="flex justify-center items-center py-20 flex-1">
                      <div className="w-8 h-8 border-3 border-[#EDF2FF] border-t-[#2160FF] rounded-full animate-spin"></div>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-[14px] font-bold text-slate-700 mb-1">No Notes Recorded</p>
                      <p className="text-[13px] text-gray-500 font-medium">There are no nursing notes for this patient yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 p-2">
                      {notes.map((note, idx) => (
                        <div key={idx} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-[#2160FF] bg-[#F0F5FF] px-3 py-1.5 rounded-lg">
                              <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                              <span className="text-[12px] font-extrabold tracking-wide">
                                {new Date(note.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-[12px]">
                              <User className="w-3.5 h-3.5" /> {note.authorName || 'Nurse'}
                            </div>
                          </div>
                          <p className="text-[14px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingNotes;
