import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { FlaskConical, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pageTransition, staggerChildren, listStagger, fadeUp } from '../../components/ui/motion';

const statusConfig = {
  RELEASED:        { variant: 'success', label: 'Released',         icon: CheckCircle2 },
  VERIFIED:        { variant: 'success', label: 'Verified',         icon: CheckCircle2 },
  RESULT_ENTERED:  { variant: 'info',    label: 'Result Entered',   icon: CheckCircle2 },
  PROCESSING:      { variant: 'warning', label: 'Processing',       icon: Clock },
  SAMPLE_COLLECTED:{ variant: 'warning', label: 'Sample Collected', icon: Clock },
  REQUESTED:       { variant: 'neutral', label: 'Requested',        icon: Clock },
};

const LabReports = () => {
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['patient-lab-reports'],
    queryFn: async () => (await axiosPrivate.get('/lab/patient/lab-reports')).data,
    retry: 1,
  });

  const bookMutation = useMutation({
    mutationFn: async (id) => {
      const formattedDate = new Date(scheduledAt).toISOString();
      return axiosPrivate.post(`/lab/patient/requests/${id}/book`, { scheduledAt: formattedDate });
    },
    onSuccess: () => {
      toast.success('Appointment scheduled successfully');
      queryClient.invalidateQueries(['patient-lab-reports']);
      setIsModalOpen(false);
      setScheduledAt('');
    },
    onError: (err) => {
      toast.error('Failed to schedule appointment');
    }
  });

  const openBookModal = (id) => {
    setSelectedReportId(id);
    setIsModalOpen(true);
  };

  const handleDownloadPdf = async (id) => {
    try {
      const response = await axiosPrivate.get(`/lab/requests/${id}/report/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lab_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Failed to download PDF report. It may not be ready yet.');
    }
  };

  return (
    <motion.div
      className="p-4 sm:p-6 max-w-4xl mx-auto"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-sm bg-[var(--color-info-bg)] text-[var(--color-info)]">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-[var(--color-navy-900)] m-0">
            My Lab Reports
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] m-0 mt-0.5">
            View all laboratory test requests and results
          </p>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <Card.Body className="space-y-3">
            <Skeleton variant="line" lines={4} />
          </Card.Body>
        </Card>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <EmptyState
          icon={AlertCircle}
          title="Could not load lab reports"
          description="Please try refreshing the page. If the problem persists, contact support."
        />
      )}

      {/* Empty */}
      {!isLoading && !isError && reports.length === 0 && (
        <EmptyState
          icon={FlaskConical}
          title="No lab reports yet"
          description="Your lab test requests will appear here once your doctor orders them."
        />
      )}

      {/* Report List */}
      {!isLoading && !isError && reports.length > 0 && (
        <motion.div variants={staggerChildren} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => {
            const cfg = statusConfig[report.status] || statusConfig.REQUESTED;
            const testName = report.testCatalog?.testName ?? 'Lab Test';
            const doctorName = report.doctor
              ? `Dr. ${report.doctor.user?.firstName ?? ''} ${report.doctor.user?.lastName ?? ''}`.trim()
              : 'Unknown Doctor';
            const requestedDate = report.requestedAt
              ? new Date(report.requestedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })
              : '—';

            return (
              <motion.div variants={listStagger} layout key={report.id}>
                <Card hoverable>
                  <Card.Body className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-sm bg-[var(--color-info-bg)] text-[var(--color-info)] shrink-0 mt-0.5">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[var(--color-navy-900)] m-0 truncate">
                          {testName}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] m-0 mt-0.5">
                          Ordered by {doctorName} &middot; {requestedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={cfg.variant} icon={cfg.icon}>
                        {cfg.label}
                      </Badge>
                      {report.status === 'RELEASED' && (
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                            bg-[var(--color-navy-800)] text-white rounded-sm hover:bg-[var(--color-navy-900)]
                            transition-colors focus-visible:outline-none"
                          onClick={() => handleDownloadPdf(report.id)}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </button>
                      )}
                      {report.status === 'REQUESTED' && (
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                            bg-indigo-600 text-white rounded-sm hover:bg-indigo-700
                            transition-colors focus-visible:outline-none"
                          onClick={() => openBookModal(report.id)}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Schedule
                        </button>
                      )}
                      {report.status === 'SCHEDULED' && (
                        <div className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded">
                          Scheduled: {new Date(report.scheduledAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Lab Appointment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date and Time
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              onClick={() => bookMutation.mutate(selectedReportId)}
              isLoading={bookMutation.isPending}
              disabled={!scheduledAt}
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default LabReports;
