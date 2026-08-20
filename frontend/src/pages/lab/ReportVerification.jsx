import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import toast from 'react-hot-toast';



const ReportVerification = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState('');

  // Fetch only requests pending verification
  const { data: requests, isLoading } = useQuery({
    queryKey: ['lab-requests-verification'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/requests/status/PENDING_VERIFICATION');
      return res.data;
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ requestId, payload }) => {
      const res = await axiosPrivate.post(`/lab/requests/${requestId}/verify`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-requests-verification']);
      setSelectedRequest(null);
      setComments('');
      toast.success('Report verified successfully!');
    },
    onError: (error) => {
      toast.error('Error verifying report: ' + error.message);
    }
  });

  const handleVerify = () => {
    if (!selectedRequest) return;
    verifyMutation.mutate({
      requestId: selectedRequest.id,
      payload: { comments }
    });
  };

  const handleDownloadPdf = async (requestId) => {
    try {
      const res = await axiosPrivate.get(`/lab/requests/${requestId}/report/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabReport_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Failed to download PDF', error);
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Report Verification</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="md:col-span-1 border border-[var(--color-border)] rounded-xl shadow-sm bg-white p-4 h-screen overflow-y-auto"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-text)]">Pending Verification</h2>
          {(!requests || requests.length === 0) ? (
            <p className="text-[var(--color-text-muted)] text-sm">No reports pending verification.</p>
          ) : (
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {requests.map(req => (
                <motion.li
                  variants={fadeIn}
                  key={req.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedRequest?.id === req.id
                      ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-[var(--color-border)]'
                  }`}
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="font-semibold text-indigo-600 text-sm">{req.testCatalog?.testName}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">Patient ID: {req.patient?.id}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Req #: {req.labRequestNumber}</div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        <motion.div
          className="md:col-span-2 border border-[var(--color-border)] rounded-xl shadow-sm bg-white p-6"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="wait">
            {selectedRequest ? (
              <motion.div key="verify-form" variants={fadeIn} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">Verify Report: {selectedRequest.testCatalog?.testName}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3"><span className="font-semibold text-[var(--color-text-muted)]">Patient ID: </span>{selectedRequest.patient?.id}</div>
                  <div className="bg-slate-50 rounded-lg p-3"><span className="font-semibold text-[var(--color-text-muted)]">Request No.: </span>{selectedRequest.labRequestNumber}</div>
                  <div className="bg-slate-50 rounded-lg p-3"><span className="font-semibold text-[var(--color-text-muted)]">Status: </span>{selectedRequest.status}</div>
                  <div className="bg-slate-50 rounded-lg p-3"><span className="font-semibold text-[var(--color-text-muted)]">Priority: </span>{selectedRequest.priority}</div>
                </div>

                <div className="mb-6">
                  <button
                    onClick={() => handleDownloadPdf(selectedRequest.id)}
                    className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm font-semibold transition-colors"
                  >
                    Preview PDF
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Pathologist Comments (Optional)</label>
                  <textarea
                    className="w-full border border-[var(--color-border)] rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3 text-sm transition-all"
                    rows="4"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter any comments for the final report..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-5 py-2 border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={verifyMutation.isLoading}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {verifyMutation.isLoading ? 'Verifying...' : 'Sign & Verify Report'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" variants={fadeIn} initial="hidden" animate="show" className="flex h-full items-center justify-center text-[var(--color-text-muted)] py-20">
                Select a report from the list to review and verify.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    
  );
};

export default ReportVerification;
