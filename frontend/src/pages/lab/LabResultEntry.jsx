import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';



const LabResultEntry = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [resultForm, setResultForm] = useState({
    resultValue: '',
    referenceRange: '',
    unit: '',
    isAbnormal: false
  });

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['lab-requests-sample-collected'],
    queryFn: async () => {
      // Assuming SAMPLE_COLLECTED is the status before RESULT_ENTERED
      const res = await axiosPrivate.get('/lab/requests/status/SAMPLE_COLLECTED');
      return res.data;
    }
  });

  const submitResult = useMutation({
    mutationFn: async () => {
      const payload = {
        resultValue: resultForm.resultValue,
        referenceRange: resultForm.referenceRange,
        unit: resultForm.unit,
        isAbnormal: resultForm.isAbnormal
      };
      const res = await axiosPrivate.post(`/lab/requests/${selectedRequest.id}/result`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Result entered successfully');
      setSelectedRequest(null);
      setResultForm({ resultValue: '', referenceRange: '', unit: '', isAbnormal: false });
      queryClient.invalidateQueries({ queryKey: ['lab-requests-sample-collected'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to enter result');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resultForm.resultValue) {
      toast.error('Result value is required');
      return;
    }
    submitResult.mutate();
  };

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
            <FlaskConical className="w-7 h-7 text-indigo-600" />
            Result Entry
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Enter test results for collected samples.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <Card.Header className="bg-indigo-50 border-b border-indigo-100">
              <h2 className="text-[13px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                Pending Entry ({pendingRequests.length})
              </h2>
            </Card.Header>
            <Card.Body className="p-0 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">Loading requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">No pending tests</div>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {pendingRequests.map(req => (
                    <li 
                      key={req.id} 
                      className={`p-4 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-[var(--color-surface-alt)]'}`}
                      onClick={() => {
                        setSelectedRequest(req);
                        setResultForm({
                          resultValue: '',
                          referenceRange: req.testCatalog?.defaultReferenceRange || '',
                          unit: req.testCatalog?.defaultUnit || '',
                          isAbnormal: false
                        });
                      }}
                    >
                      <h3 className="font-bold text-[var(--color-navy-900)] text-sm">{req.testCatalog?.testName || 'Unknown Test'}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Patient: {req.patient?.user?.firstName || 'Unknown'} {req.patient?.user?.lastName || ''}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">
                        Collected: {new Date(req.sampleCollectedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
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
                  <FlaskConical className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-navy-900)] mb-2">Select a Test Request</h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
                  Choose a test from the pending list on the left to enter its results.
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-navy-900)]">{selectedRequest.testCatalog?.testName}</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Patient: <span className="font-semibold text-slate-700">{selectedRequest.patient?.user?.firstName} {selectedRequest.patient?.user?.lastName}</span>
                    </p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">
                    {selectedRequest.priority}
                  </span>
                </div>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormField label="Result Value" required id="resultValue">
                    <input 
                      id="resultValue"
                      type="text"
                      value={resultForm.resultValue} 
                      onChange={e => setResultForm({ ...resultForm, resultValue: e.target.value })} 
                      placeholder="e.g. 14.5"
                      className="input-field text-lg font-semibold py-3" 
                      required
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Unit (optional)" id="unit">
                      <input 
                        id="unit"
                        type="text"
                        value={resultForm.unit} 
                        onChange={e => setResultForm({ ...resultForm, unit: e.target.value })} 
                        placeholder="e.g. g/dL"
                        className="input-field" 
                      />
                    </FormField>
                    <FormField label="Reference Range (optional)" id="referenceRange">
                      <input 
                        id="referenceRange"
                        type="text"
                        value={resultForm.referenceRange} 
                        onChange={e => setResultForm({ ...resultForm, referenceRange: e.target.value })} 
                        placeholder="e.g. 12.0 - 15.5"
                        className="input-field" 
                      />
                    </FormField>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="isAbnormal" 
                      checked={resultForm.isAbnormal}
                      onChange={e => setResultForm({ ...resultForm, isAbnormal: e.target.checked })}
                      className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    <label htmlFor="isAbnormal" className="text-sm font-semibold text-rose-600 cursor-pointer">
                      Flag as Abnormal / Critical
                    </label>
                  </div>

                  <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                    <Button type="submit" variant="primary" icon={CheckCircle2} isLoading={submitResult.isPending}>
                      Submit Result
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
    
  );
};

export default LabResultEntry;
