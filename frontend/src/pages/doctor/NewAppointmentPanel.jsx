import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const NewAppointmentPanel = ({ onClose }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    patientFirstName: '',
    patientLastName: '',
    patientEmail: '',
    patientPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    reasonForVisit: '',
    type: 'CONSULTATION',
    priority: 'ROUTINE',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientFirstName || !formData.appointmentDate || !formData.startTime) {
      toast.error('Please fill required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Mock duration of 30 mins
      const startDateTime = new Date(`${formData.appointmentDate}T${formData.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

      const payload = {
        patientFirstName: formData.patientFirstName,
        patientLastName: formData.patientLastName,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
        doctorId: user?.id,
        appointmentDate: formData.appointmentDate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        reasonForVisit: formData.reasonForVisit,
        type: formData.type,
        status: 'SCHEDULED',
        priority: formData.priority,
        notes: formData.notes
      };

      await axiosPrivate.post('/appointments', payload);
      toast.success('Appointment scheduled successfully');
      queryClient.invalidateQueries(['doctor-today-appointments']);
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Schedule New Appointment
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Patient Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">First Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required name="patientFirstName" value={formData.patientFirstName} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="First Name" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Last Name</label>
                <input name="patientLastName" value={formData.patientLastName} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Last Name" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input name="patientPhone" value={formData.patientPhone} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Phone Number" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email</label>
                <input type="email" name="patientEmail" value={formData.patientEmail} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Email Address" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="date" required name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Time *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="time" required name="startTime" value={formData.startTime} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Reason for Visit</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea name="reasonForVisit" value={formData.reasonForVisit} onChange={handleChange} rows="2" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Brief reason for visit..."></textarea>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="PROCEDURE">Procedure</option>
                  <option value="CHECKUP">Checkup</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAppointmentPanel;
