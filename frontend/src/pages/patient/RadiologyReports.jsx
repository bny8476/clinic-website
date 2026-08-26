import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { axiosPrivate as axios } from '../../api/axios';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fadeUp, staggerChildren } from '../../components/ui/motion';
import { Calendar, Download, FileText, Scan, FileUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RadiologyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/patient/radiology-reports');
        setReports(response.data);
      } catch (err) {
        console.error('Error fetching radiology reports:', err);
        setError('Failed to load radiology reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const bookMutation = useMutation({
    mutationFn: async (id) => {
      const formattedDate = new Date(scheduledAt).toISOString();
      return axios.post(`/radiology/patient/requests/${id}/book`, { scheduledAt: formattedDate });
    },
    onSuccess: () => {
      toast.success('Scan scheduled successfully');
      // Refetch reports
      axios.get('/patient/radiology-reports').then(res => setReports(res.data));
      setIsModalOpen(false);
      setScheduledAt('');
    },
    onError: (err) => {
      toast.error('Failed to schedule scan');
    }
  });

  const openBookModal = (id) => {
    setSelectedRequestId(id);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2864FF]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md m-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans">
       {/* Header */}
       <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-[14px] bg-[#F0F5FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2864FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                   <path d="M7 8v8" />
                   <path d="M17 8v8" />
                   <path d="M10 10h4" />
                   <path d="M10 14h4" />
                   <path d="M12 8v8" />
                </svg>
             </div>
             <div>
                <h1 className="text-[22px] font-extrabold text-slate-900 mb-0.5 tracking-tight">Radiology & Imaging Reports</h1>
                <p className="text-[13.5px] font-medium text-slate-500">View and manage your radiology and imaging reports.</p>
             </div>
          </div>
       </div>

       {/* Main Card Container */}
       <div className="max-w-[1200px] mx-auto">
          {reports.length === 0 ? (
            <div className="relative bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-10">
               
               {/* Decorative Grid - Top Left */}
               <div className="absolute top-10 left-10 text-[#E8F0FE] pointer-events-none">
                  <svg width="60" height="60" fill="currentColor" viewBox="0 0 60 60">
                     <pattern id="grid1" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" />
                     </pattern>
                     <rect width="60" height="60" fill="url(#grid1)" />
                  </svg>
               </div>

               {/* Decorative Circle - Mid Left */}
               <div className="absolute top-1/2 -left-16 -translate-y-1/2 w-32 h-32 bg-[#F8FAFC] rounded-full blur-[40px] pointer-events-none"></div>

               {/* Decorative Grid & Circle - Bottom Right */}
               <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-[#F8FAFC] rounded-full blur-[50px] pointer-events-none"></div>
               <div className="absolute bottom-10 right-10 text-[#E8F0FE] pointer-events-none">
                  <svg width="60" height="60" fill="currentColor" viewBox="0 0 60 60">
                     <pattern id="grid2" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" />
                     </pattern>
                     <rect width="60" height="60" fill="url(#grid2)" />
                  </svg>
               </div>

               {/* Empty State Content */}
               <div className="relative z-10 flex flex-col items-center text-center max-w-sm mt-4">
                  
                  {/* Custom Illustration */}
                  <div className="relative w-[180px] h-[180px] mb-6 flex items-center justify-center">
                     <div className="absolute inset-0 bg-[#F5F8FF] rounded-full scale-[0.85]"></div>
                     
                     <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                        {/* Folder Back */}
                        <path d="M30 55H56L61 62H90V80H30V55Z" fill="#2864FF" />
                        
                        {/* Image Document */}
                        <rect x="42" y="42" width="36" height="40" rx="3" fill="white" />
                        {/* Picture Icon Details */}
                        <rect x="46" y="46" width="28" height="20" rx="2" fill="#E8F0FE" />
                        {/* Mountain 1 */}
                        <path d="M46 66L53 56L59 66H46Z" fill="#A6C8FF" />
                        {/* Mountain 2 */}
                        <path d="M55 66L63 52L70 66H55Z" fill="#D0E2FF" />
                        {/* Sun */}
                        <circle cx="66" cy="52" r="3" fill="#2864FF" />
                        
                        {/* Text Lines */}
                        <path d="M48 72H72 M48 76H66" stroke="#A6C8FF" strokeWidth="2" strokeLinecap="round" />
                        
                        {/* Folder Front Inner */}
                        <path d="M28 65H92V84C92 85.1 91.1 86 90 86H30C28.9 86 28 85.1 28 84V65Z" fill="#F0F5FF" />
                        
                        {/* Folder Front Main */}
                        <path d="M26 68H94L90 86C89.5 87.1 88.3 88 87 88H33C31.7 88 30.5 87.1 30 86L26 68Z" fill="#E8F0FE" />
                        <path d="M26 68H94L92.5 73H27.5L26 68Z" fill="#D0E2FF" />

                        {/* Decorative Sparkles */}
                        <path d="M20 45L22 50L27 52L22 54L20 59L18 54L13 52L18 50L20 45Z" fill="#2864FF" fillOpacity="0.5"/>
                        <path d="M95 55L96 58L99 59L96 60L95 63L94 60L91 59L94 58L95 55Z" fill="#2864FF" fillOpacity="0.4"/>
                        <circle cx="85" cy="35" r="2" fill="#2864FF" fillOpacity="0.4"/>
                        <circle cx="30" cy="35" r="1.5" fill="#2864FF" fillOpacity="0.5"/>

                        {/* Dashed swoop (Paper airplane style) */}
                        <path d="M75 35L88 28L81 41L75 35Z" stroke="#2864FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M75 35L81 41L85 45L73 43L75 35Z" fill="#2864FF" fillOpacity="0.4"/>
                        <path d="M88 28C95 30 100 35 95 45C92 50 85 55 80 50" stroke="#A6C8FF" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" fill="none"/>
                        
                        {/* Decorative Plus sign in bg */}
                        <path d="M25 35H31 M28 32V38" stroke="#A6C8FF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M100 70H104 M102 68V72" stroke="#A6C8FF" strokeWidth="1.5" strokeLinecap="round" />
                     </svg>
                  </div>

                  <h2 className="text-[20px] font-extrabold text-slate-900 mb-2">No Reports Found</h2>
                  <p className="text-[13.5px] text-slate-500 mb-8 font-medium leading-relaxed">
                     You don't have any radiology or imaging reports<br/>in your medical history yet.
                  </p>

                  <button 
                     className="bg-[#F8FAFC] border border-[#D0E2FF] hover:bg-[#F0F5FF] hover:border-[#A6C8FF] text-[#2864FF] px-8 py-2.5 rounded-[12px] font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                     <FileUp className="w-4 h-4" /> Upload Report
                  </button>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden p-6">
              {/* List View */}
              <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="lg:col-span-1 space-y-4">
                {reports.map((report) => (
                  <motion.div 
                    variants={fadeUp}
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
                      selectedReport?.id === report.id 
                        ? 'border-[#2864FF] ring-1 ring-[#2864FF]' 
                        : 'border-slate-100 hover:border-[#A6C8FF]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#2864FF]">
                        {report.request?.procedure?.name || 'Imaging Study'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {report.createdAt ? format(new Date(report.createdAt), 'MMM d, yyyy') : 'Unknown Date'}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-1">
                      {report.request?.procedure?.modality || 'Radiology'} Scan
                    </h4>
                    <p className="text-sm text-slate-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" /> 
                      Ordered by Dr. {report.request?.doctor?.lastName || 'Unknown'}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        report.status === 'FINALIZED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {report.status}
                      </span>
                      {report.status === 'REQUESTED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openBookModal(report.request.id); }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-[#2864FF] text-white rounded hover:bg-blue-700"
                        >
                          <Calendar className="w-3 h-3" />
                          Schedule
                        </button>
                      )}
                      {report.status === 'SCHEDULED' && report.request?.scheduledAt && (
                        <div className="text-xs text-[#2864FF] font-medium bg-blue-50 px-2 py-1 rounded">
                          {format(new Date(report.request.scheduledAt), 'MMM d, h:mm a')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Detail View */}
              <div className="lg:col-span-2">
                {selectedReport ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900">
                          {selectedReport.request?.procedure?.name || 'Radiology Report'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Report ID: RAD-{selectedReport.id.toString().padStart(6, '0')}
                        </p>
                      </div>
                      {selectedReport.dicomImageUrl && (
                        <a
                          href={selectedReport.dicomImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#2864FF] hover:bg-blue-700 focus:outline-none transition-colors"
                        >
                          <Download className="-ml-1 mr-2 h-4 w-4" />
                          Download Images
                        </a>
                      )}
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Date of Examination</p>
                          <p className="font-medium text-slate-900">
                            {selectedReport.createdAt ? format(new Date(selectedReport.createdAt), 'MMMM d, yyyy') : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Referring Physician</p>
                          <p className="font-medium text-slate-900">
                            Dr. {selectedReport.request?.doctor?.firstName} {selectedReport.request?.doctor?.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Radiologist</p>
                          <p className="font-medium text-slate-900">
                            Dr. {selectedReport.radiologist?.lastName || 'Pending Assignment'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Modality</p>
                          <p className="font-medium text-slate-900">
                            {selectedReport.request?.procedure?.modality || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      <div>
                        <h4 className="text-md font-semibold text-slate-900 flex items-center mb-2">
                          <FileText className="w-5 h-5 mr-2 text-slate-400" />
                          Clinical Indication
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line text-sm">
                          {selectedReport.request?.clinicalNotes || 'No specific clinical indication provided.'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-slate-900 flex items-center mb-2">
                          <FileText className="w-5 h-5 mr-2 text-slate-400" />
                          Findings
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line text-sm bg-slate-50 p-4 rounded-xl">
                          {selectedReport.findings || 'No findings recorded yet.'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-slate-900 flex items-center mb-2">
                          <FileText className="w-5 h-5 mr-2 text-slate-400" />
                          Impression
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line text-sm bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                          {selectedReport.impression || 'No impression recorded yet.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    key="empty-detail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center p-12 text-center text-slate-500"
                  >
                    <FileText className="w-12 h-12 text-slate-300 mb-4" />
                    <p>Select a report from the list to view its details.</p>
                  </motion.div>
                )}
              </div>
            </div>
          )}
       </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Radiology Scan">
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">
               Select Date and Time
             </label>
             <input
               type="datetime-local"
               className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] sm:text-sm transition-shadow"
               value={scheduledAt}
               onChange={(e) => setScheduledAt(e.target.value)}
               min={new Date().toISOString().slice(0, 16)}
             />
           </div>
           <div className="flex justify-end gap-3 mt-6">
             <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
               Cancel
             </Button>
             <Button
               onClick={() => bookMutation.mutate(selectedRequestId)}
               isLoading={bookMutation.isPending}
               disabled={!scheduledAt}
               className="bg-[#2864FF] hover:bg-blue-700 text-white border-none"
             >
               Confirm Booking
             </Button>
           </div>
         </div>
       </Modal>
    </div>
  );
}
