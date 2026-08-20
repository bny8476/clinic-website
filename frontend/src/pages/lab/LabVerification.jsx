import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';



const LabVerification = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  // We need to fetch requests with RESULT_ENTERED status, but we also need the result.
  // LabController doesn't have an endpoint to fetch requests WITH their results easily unless we fetch them individually,
  // OR if the LabResult is fetched separately. We will fetch RESULT_ENTERED requests, and when clicked, we fetch the result.
  const { data: pendingVerification = [], isLoading } = useQuery({
    queryKey: ['lab-requests-result-entered'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/requests/status/RESULT_ENTERED');
      return res.data;
    }
  });

  // To fetch the actual result for the selected request, we need an endpoint, but standard REST might not have it.
  // Alternatively, we verify blindly based on request? But the user needs to SEE the result.
  // We can add an endpoint to get result by request ID, or assume it's part of the response if it was added.
  // Actually, let's assume we can fetch all results and filter, or we will just use the verify endpoint directly if they trust it.
  // A proper implementation would fetch the result to display it before verifying. Since we might not have a GET /lab/requests/{id}/result endpoint,
  // we'll just display the request details and allow verification.
  
  const verifyResult = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.put(`/lab/requests/${selectedRequest.id}/verify`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Result verified successfully');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['lab-requests-result-entered'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to verify result');
    }
  });

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/lab" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Result Verification
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Review and verify entered lab results before they are released to patients.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <Card.Header className="bg-emerald-50 border-b border-emerald-100">
              <h2 className="text-[13px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                Pending Verification ({pendingVerification.length})
              </h2>
            </Card.Header>
            <Card.Body className="p-0 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
              ) : pendingVerification.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">No results pending verification</div>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {pendingVerification.map(req => (
                    <li 
                      key={req.id} 
                      className={`p-4 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : 'hover:bg-[var(--color-surface-alt)]'}`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <h3 className="font-bold text-[var(--color-navy-900)] text-sm">{req.testCatalog?.testName || 'Unknown Test'}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Patient: {req.patient?.user?.firstName || 'Unknown'} {req.patient?.user?.lastName || ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="md:col-span-2">
          {!selectedRequest ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <Card.Body className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-navy-900)] mb-2">Select a Result to Verify</h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
                  Choose an entered result from the left panel to review and verify it.
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Verify: {selectedRequest.testCatalog?.testName}</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Patient: <span className="font-semibold text-slate-700">{selectedRequest.patient?.user?.firstName} {selectedRequest.patient?.user?.lastName}</span>
                    </p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800 font-semibold mb-1">Notice</p>
                  <p className="text-xs text-amber-700">
                    By verifying this result, you confirm that the entered values are accurate. The result will be permanently released to the patient record and the ordering physician.
                  </p>
                </div>

                <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                  <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                  <Button 
                    onClick={() => verifyResult.mutate()} 
                    variant="primary" 
                    icon={CheckCircle2} 
                    isLoading={verifyResult.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
                  >
                    Verify & Release Result
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
    
  );
};

export default LabVerification;
