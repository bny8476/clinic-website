import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const NewCertificateModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    certificateType: 'Fitness Certificate',
    durationDays: '3',
    remarks: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName) {
      toast.error('Please enter patient name');
      return;
    }
    // Mock success
    toast.success('Medical Certificate generated successfully!');
    setFormData({ patientName: '', certificateType: 'Fitness Certificate', durationDays: '3', remarks: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#2160FF] rounded-xl flex items-center justify-center">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">New Medical Certificate</h2>
              <p className="text-xs font-medium text-slate-500">Issue a certificate for a patient</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Patient Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Rahul Sharma"
              value={formData.patientName}
              onChange={(e) => setFormData({...formData, patientName: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Certificate Type</label>
              <select 
                value={formData.certificateType}
                onChange={(e) => setFormData({...formData, certificateType: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all appearance-none"
              >
                <option value="Fitness Certificate">Fitness Certificate</option>
                <option value="Sick Leave Certificate">Sick Leave Certificate</option>
                <option value="Travel Certificate">Travel Certificate</option>
                <option value="Handicap Certificate">Handicap Certificate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Valid For (Days)</label>
              <input 
                type="number" 
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Remarks / Diagnosis</label>
            <textarea 
              rows={3}
              placeholder="Add relevant medical notes here..."
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2160FF] hover:bg-[#1a4acc] shadow-sm shadow-blue-500/20 transition-all"
            >
              Issue Certificate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCertificateModal;
