import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, FileText, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const LabRequestDetailsModal = ({ isOpen, onClose, request }) => {
  const navigate = useNavigate();

  if (!isOpen || !request) return null;

  const handleAction = (action) => {
    onClose();
    if (action === 'process') {
      navigate('/lab/results'); // Just navigate to result entry
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden font-sans"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-[16px] font-bold text-slate-800">Lab Request Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Patient</span>
                <div className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                  <User size={16} className="text-indigo-600" />
                  {request.patient?.firstName} {request.patient?.lastName}
                </div>
              </div>
              
              <div className="flex flex-col gap-1 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Status</span>
                <div className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                  <Clock size={16} className="text-amber-600" />
                  {request.status}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText size={18} className="text-slate-400" />
                Test Information
              </h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <span className="block text-[12px] font-medium text-slate-500 mb-1">Test Name</span>
                  <span className="text-[14px] font-bold text-slate-800">{request.testCatalog?.testName || 'Unknown Test'}</span>
                </div>
                <div>
                  <span className="block text-[12px] font-medium text-slate-500 mb-1">Category</span>
                  <span className="text-[14px] font-bold text-slate-800">{request.testCatalog?.category || 'General'}</span>
                </div>
                <div>
                  <span className="block text-[12px] font-medium text-slate-500 mb-1">Requested By</span>
                  <span className="text-[14px] font-bold text-slate-800">
                    Dr. {request.doctorUser?.firstName} {request.doctorUser?.lastName}
                  </span>
                </div>
                <div>
                  <span className="block text-[12px] font-medium text-slate-500 mb-1">Date</span>
                  <span className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {request.notes && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="block text-[12px] font-bold text-slate-700 mb-1">Clinical Notes</span>
                <p className="text-[13px] text-slate-600">{request.notes}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
            {(request.status === 'REQUESTED' || request.status === 'SAMPLE_COLLECTED') && (
              <button 
                onClick={() => handleAction('process')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold text-white bg-[var(--color-navy-600)] hover:bg-[var(--color-navy-700)] transition-colors shadow-sm"
              >
                <CheckCircle size={16} strokeWidth={2.5} />
                Enter Results
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LabRequestDetailsModal;
