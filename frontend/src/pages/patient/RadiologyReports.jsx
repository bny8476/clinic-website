import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { axiosPrivate as axios } from '../../api/axios';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerChildren } from '../../components/ui/motion';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Radiology & Imaging Reports</h2>
      </div>

      {reports.length === 0 ? (
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUp}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"
        >
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            You don't have any radiology or imaging reports in your medical history yet.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List View */}
          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="lg:col-span-1 space-y-4">
            {reports.map((report) => (
              <motion.div 
                variants={fadeUp}
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
                  selectedReport?.id === report.id 
                    ? 'border-indigo-600 ring-1 ring-indigo-600' 
                    : 'border-gray-100 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {report.request?.procedure?.name || 'Imaging Study'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {report.createdAt ? format(new Date(report.createdAt), 'MMM d, yyyy') : 'Unknown Date'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {report.request?.procedure?.modality || 'Radiology'} Scan
                </h4>
                <p className="text-sm text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> 
                  Ordered by Dr. {report.request?.doctor?.lastName || 'Unknown'}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    report.status === 'FINALIZED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                  {report.status === 'REQUESTED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openBookModal(report.request.id); }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      <Calendar className="w-3 h-3" />
                      Schedule
                    </button>
                  )}
                  {report.status === 'SCHEDULED' && report.request?.scheduledAt && (
                    <div className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedReport.request?.procedure?.name || 'Radiology Report'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Report ID: RAD-{selectedReport.id.toString().padStart(6, '0')}
                    </p>
                  </div>
                  {selectedReport.dicomImageUrl && (
                    <a
                      href={selectedReport.dicomImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Download className="-ml-1 mr-2 h-4 w-4" />
                      Download Images
                    </a>
                  )}
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date of Examination</p>
                      <p className="font-medium text-gray-900">
                        {selectedReport.createdAt ? format(new Date(selectedReport.createdAt), 'MMMM d, yyyy') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Referring Physician</p>
                      <p className="font-medium text-gray-900">
                        Dr. {selectedReport.request?.doctor?.firstName} {selectedReport.request?.doctor?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Radiologist</p>
                      <p className="font-medium text-gray-900">
                        Dr. {selectedReport.radiologist?.lastName || 'Pending Assignment'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Modality</p>
                      <p className="font-medium text-gray-900">
                        {selectedReport.request?.procedure?.modality || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-2">
                      <FileText className="w-5 h-5 mr-2 text-gray-400" />
                      Clinical Indication
                    </h4>
                    <p className="text-gray-700 whitespace-pre-line text-sm">
                      {selectedReport.request?.clinicalNotes || 'No specific clinical indication provided.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-2">
                      <FileText className="w-5 h-5 mr-2 text-gray-400" />
                      Findings
                    </h4>
                    <p className="text-gray-700 whitespace-pre-line text-sm bg-gray-50 p-4 rounded-md">
                      {selectedReport.findings || 'No findings recorded yet.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-2">
                      <FileText className="w-5 h-5 mr-2 text-gray-400" />
                      Impression
                    </h4>
                    <p className="text-gray-700 whitespace-pre-line text-sm bg-indigo-50 p-4 rounded-md border border-indigo-100">
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
                className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center p-12 text-center text-gray-500"
              >
                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                <p>Select a report from the list to view its details.</p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Radiology Scan">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date and Time
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-shadow"
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
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
