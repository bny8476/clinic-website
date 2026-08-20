import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';



const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200'
};

const OtSchedulingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [view, setView] = useState('DAY'); // DAY, WEEK
  const [activeModal, setActiveModal] = useState(null); // 'SCHEDULE', 'PRE_OP', 'NOTES'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  // Get OTs
  const { data: theatres, isLoading: loadingTheatres } = useQuery({
    queryKey: ['theatres'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/surgery/theatres');
      return res.data;
    }
  });

  // Get Bookings
  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['surgery-bookings'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/surgery/bookings');
      return res.data;
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/surgery/bookings', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Surgery scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['surgery-bookings'] });
      closeModal();
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.put(`/surgery/bookings/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['surgery-bookings'] });
    }
  });

  const preOpMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/surgery/bookings/${selectedBooking.id}/pre-op-checklist`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Pre-Op Checklist saved');
      queryClient.invalidateQueries({ queryKey: ['surgery-bookings'] });
      closeModal();
    }
  });

  const notesMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/surgery/bookings/${selectedBooking.id}/notes`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Surgery Notes saved');
      queryClient.invalidateQueries({ queryKey: ['surgery-bookings'] });
      closeModal();
    }
  });

  const openModal = (type, booking = null) => {
    setSelectedBooking(booking);
    setActiveModal(type);
    setFormData({});
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBooking(null);
    setFormData({});
  };

  const handleAction = () => {
    if (activeModal === 'SCHEDULE') {
      scheduleMutation.mutate({
        patientId: formData.patientId,
        surgeonId: formData.surgeonId,
        operationTheatreId: formData.operationTheatreId,
        surgeryType: formData.surgeryType,
        diagnosis: formData.diagnosis,
        scheduledStartTime: formData.scheduledStartTime,
        estimatedDurationMinutes: parseInt(formData.estimatedDurationMinutes || '60')
      });
    } else if (activeModal === 'PRE_OP') {
      preOpMutation.mutate({
        checklistData: formData.checklistData || {},
        notes: formData.notes
      });
    } else if (activeModal === 'NOTES') {
      notesMutation.mutate({
        surgeonId: formData.surgeonId || 1, // Assuming default surgeon ID
        preOpDiagnosis: formData.preOpDiagnosis,
        postOpDiagnosis: formData.postOpDiagnosis,
        procedurePerformed: formData.procedurePerformed,
        findings: formData.findings,
        complications: formData.complications
      });
    }
  };

  if (loadingTheatres || loadingBookings) {
    return <div className="p-10 flex justify-center text-slate-400">Loading OT schedule...</div>;
  }

  const dayBookings = bookings?.filter(b => 
    isSameDay(new Date(b.scheduledStartTime), selectedDate)
  ) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-purple-600" />
            Operation Theatre Schedule
          </h1>
          <p className="text-slate-500 mt-1">Manage surgery bookings and OT availability.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setView('DAY')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'DAY' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
            >
              Day
            </button>
            <button 
              onClick={() => setView('WEEK')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'WEEK' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
            >
              Week
            </button>
          </div>
          <button 
            onClick={() => openModal('SCHEDULE')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Schedule Surgery
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <button 
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
        >
          &larr; Previous
        </button>
        <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <CalendarIcon className="text-purple-600" />
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>
        <button 
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
        >
          Next &rarr;
        </button>
      </div>

      {/* OT Columns */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {theatres?.length === 0 ? (
          <div className="w-full text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
            No Operation Theatres configured for this branch.
          </div>
        ) : (
          theatres?.map(ot => {
            const otBookings = dayBookings.filter(b => b.operationTheatre.id === ot.id)
              .sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime));

            return (
    
              <div key={ot.id} className="flex-1 min-w-[350px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{ot.otName}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {ot.status || 'AVAILABLE'}
                  </span>
                </div>
                
                <div className="p-4 flex-grow space-y-4">
                  {otBookings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 italic">
                      No surgeries scheduled
                    </div>
                  ) : (
                    otBookings.map(booking => (
                      <div key={booking.id} className={`p-4 rounded-xl border-l-4 ${STATUS_COLORS[booking.status]} bg-white border border-slate-200 shadow-sm relative overflow-hidden group`}>
                        <div className={`absolute left-0 top-0 w-1 h-full ${
                          booking.status === 'SCHEDULED' ? 'bg-blue-500' : 
                          booking.status === 'IN_PROGRESS' ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                        
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Clock size={14} className={booking.status === 'IN_PROGRESS' ? 'text-orange-500 animate-pulse' : 'text-slate-400'} />
                            {format(new Date(booking.scheduledStartTime), 'HH:mm')} - 
                            {format(new Date(new Date(booking.scheduledStartTime).getTime() + booking.estimatedDurationMinutes * 60000), 'HH:mm')}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {booking.status === 'SCHEDULED' && (
                              <button 
                                onClick={() => statusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                START
                              </button>
                            )}
                            {booking.status === 'IN_PROGRESS' && (
                              <button 
                                onClick={() => statusMutation.mutate({ id: booking.id, status: 'COMPLETED' })}
                                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-orange-100 text-orange-700 hover:bg-orange-200"
                              >
                                COMPLETE
                              </button>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_COLORS[booking.status]}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="font-bold text-slate-800 text-lg mb-1">{booking.surgeryType}</h4>
                        
                        <div className="space-y-1.5 mt-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users size={14} className="text-slate-400" />
                            <span className="font-medium">{booking.patient.firstName} {booking.patient.lastName}</span>
                            <span className="text-slate-400">({booking.patient.gender}, {new Date().getFullYear() - new Date(booking.patient.dateOfBirth).getFullYear()}y)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Activity size={14} className="text-slate-400" />
                            <span>Surgeon: <span className="font-medium">Dr. {booking.primarySurgeon.userId}</span></span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                          <button 
                            onClick={() => openModal('PRE_OP', booking)}
                            className="flex-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <FileText size={12} /> Pre-Op
                          </button>
                          <button 
                            onClick={() => openModal('NOTES', booking)}
                            className="flex-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 size={12} /> Notes
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {activeModal === 'SCHEDULE' && 'Schedule Surgery'}
                {activeModal === 'PRE_OP' && 'Pre-Op Checklist'}
                {activeModal === 'NOTES' && 'Surgery Notes'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[60vh]">
              {activeModal === 'SCHEDULE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                    <input 
                      type="number" 
                      value={formData.patientId || ''}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Surgeon ID</label>
                    <input 
                      type="number" 
                      value={formData.surgeonId || ''}
                      onChange={(e) => setFormData({...formData, surgeonId: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Operation Theatre ID</label>
                    <select 
                      value={formData.operationTheatreId || ''}
                      onChange={(e) => setFormData({...formData, operationTheatreId: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    >
                      <option value="">Select OT...</option>
                      {theatres?.map(t => (
                        <option key={t.id} value={t.id}>{t.otName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Surgery Type</label>
                    <input 
                      type="text" 
                      value={formData.surgeryType || ''}
                      onChange={(e) => setFormData({...formData, surgeryType: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                    <input 
                      type="text" 
                      value={formData.diagnosis || ''}
                      onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Start</label>
                    <input 
                      type="datetime-local" 
                      value={formData.scheduledStartTime || ''}
                      onChange={(e) => setFormData({...formData, scheduledStartTime: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Est. Duration (mins)</label>
                    <input 
                      type="number" 
                      value={formData.estimatedDurationMinutes || '60'}
                      onChange={(e) => setFormData({...formData, estimatedDurationMinutes: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                </>
              )}

              {activeModal === 'PRE_OP' && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                      <input type="checkbox" className="rounded border-slate-300 text-purple-600" />
                      Consent form signed
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                      <input type="checkbox" className="rounded border-slate-300 text-purple-600" />
                      Site marked correctly
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                      <input type="checkbox" className="rounded border-slate-300 text-purple-600" />
                      NPO confirmed
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">Additional Notes</label>
                    <textarea 
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                      rows="3"
                    />
                  </div>
                </>
              )}

              {activeModal === 'NOTES' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pre-Op Diagnosis</label>
                    <input 
                      type="text" 
                      value={formData.preOpDiagnosis || ''}
                      onChange={(e) => setFormData({...formData, preOpDiagnosis: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Post-Op Diagnosis</label>
                    <input 
                      type="text" 
                      value={formData.postOpDiagnosis || ''}
                      onChange={(e) => setFormData({...formData, postOpDiagnosis: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Procedure Performed</label>
                    <textarea 
                      value={formData.procedurePerformed || ''}
                      onChange={(e) => setFormData({...formData, procedurePerformed: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Findings</label>
                    <textarea 
                      value={formData.findings || ''}
                      onChange={(e) => setFormData({...formData, findings: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complications</label>
                    <input 
                      type="text" 
                      value={formData.complications || ''}
                      onChange={(e) => setFormData({...formData, complications: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2" 
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button 
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
              >
                {activeModal === 'SCHEDULE' ? 'Schedule' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    
  );
};

export default OtSchedulingCalendar;
