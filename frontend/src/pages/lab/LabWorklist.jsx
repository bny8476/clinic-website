import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format, isPast } from 'date-fns';
import { FileText, Play } from 'lucide-react';

import { motion } from 'framer-motion';
import { staggerChildren, fadeIn } from '../../components/ui/motion';
import toast from 'react-hot-toast';



const ResultEntryModal = ({ request, onClose, onSuccess }) => {
  const [resultValue, setResultValue] = useState('');
  const [referenceRange, setReferenceRange] = useState(request.testCatalog?.referenceRange || '');
  const [unit, setUnit] = useState(request.testCatalog?.unit || '');
  const [file, setFile] = useState(null);
  
  // Live validation calculation
  let liveAbnormal = false;
  let liveCritical = false;
  
  if (resultValue && referenceRange) {
    const val = parseFloat(resultValue);
    if (!isNaN(val)) {
      const rangeMatch = referenceRange.match(/^([0-9.]+)\s*-\s*([0-9.]+)$/);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (val < min || val > max) {
          liveAbnormal = true;
          const critDev = (max - min) * 0.2;
          if (val < (min - critDev) || val > (max + critDev)) {
            liveCritical = true;
          }
        }
      } else if (referenceRange.trim().startsWith('<')) {
        const max = parseFloat(referenceRange.replace('<', '').trim());
        if (val >= max) {
          liveAbnormal = true;
          if (val >= max * 1.2) liveCritical = true;
        }
      } else if (referenceRange.trim().startsWith('>')) {
        const min = parseFloat(referenceRange.replace('>', '').trim());
        if (val <= min) {
          liveAbnormal = true;
          if (val <= min * 0.8) liveCritical = true;
        }
      }
    }
  }

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosPrivate.post(`/lab/requests/${request.id}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-requests']);
      toast.success('Result saved successfully');
      onSuccess();
    },
    onError: () => toast.error('Failed to save result')
  });

  const handleSubmit = (e, isDraft = false) => {
    e.preventDefault();
    const formData = new FormData();
    const resultObj = {
      resultValue,
      isCritical: liveCritical,
      isAbnormal: liveAbnormal,
      referenceRange,
      unit,
      isDraft
    };
    formData.append('result', new Blob([JSON.stringify(resultObj)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    submitMutation.mutate(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Result Entry - ${request.testCatalog?.testName}`}>
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        
        <FormField label="Result Value" required>
          <input type="text" value={resultValue} onChange={e => setResultValue(e.target.value)} required className="input-field" />
        </FormField>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Reference Range">
            <input type="text" value={referenceRange} onChange={e => setReferenceRange(e.target.value)} className="input-field" />
          </FormField>
          <FormField label="Unit">
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="input-field" />
          </FormField>
        </div>
        
        <div className="flex items-center space-x-4 p-4 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
          <div className="flex-1 flex items-center space-x-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">Live Status:</span>
            {liveCritical ? (
              <Badge variant="danger">CRITICAL</Badge>
            ) : liveAbnormal ? (
              <Badge variant="warning">ABNORMAL</Badge>
            ) : resultValue ? (
              <Badge variant="success">NORMAL</Badge>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)]">Enter result to evaluate</span>
            )}
          </div>
          {(liveAbnormal || liveCritical) && (
            <p className="text-xs text-[var(--color-danger)] font-medium">
              Values outside reference range. A critical result triggers immediate alerts.
            </p>
          )}
        </div>
        
        <FormField label="Upload PDF Report (Optional)">
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-navy-800)] file:text-white hover:file:opacity-90"/>
        </FormField>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, true)} isLoading={submitMutation.isPending}>Save Draft</Button>
          <Button type="submit" variant="primary" isLoading={submitMutation.isPending}>Submit Result</Button>
        </div>
      </form>
    </Modal>
  );
};

const LabWorklist = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data = {}, isLoading, isError } = useQuery({
    queryKey: ['lab-requests', filterStatus, search],
    queryFn: async () => {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (search) params.search = search;
      params.size = 100; // Fetch up to 100 for now to keep it simple
      const res = await axiosPrivate.get('/lab/worklist', { params });
      return res.data;
    },
    refetchInterval: 30000
  });

  const requests = data.content || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-requests']);
      toast.success('Status updated');
    }
  });

  const generateBarcodeMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await axiosPrivate.post(`/lab/requests/generate-barcodes`, [requestId]);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-requests']);
      toast.success('Barcode generated successfully!');
    }
  });

  const filteredRequests = requests;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Beaker className="w-7 h-7 text-[var(--color-navy-800)]" />
            Lab Worklist
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage lab test queue
          </p>
        </div>
      </div>

      <Card>
        <Card.Body className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[var(--color-border)] p-4 bg-[var(--color-surface-alt)]">
          <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['ALL', 'ORDERED', 'COLLECTED', 'RECEIVED', 'IN_PROGRESS', 'PENDING_VERIFICATION'].map(s => (
               <button 
                 key={s} 
                 onClick={() => setFilterStatus(s)} 
                 className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                   filterStatus === s 
                    ? 'bg-[var(--color-navy-800)] text-white' 
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
                 }`}
               >
                 {s.replace('_', ' ')}
               </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
             <input type="text" placeholder="Search patient or ID..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-full" />
          </div>
        </Card.Body>

        <Card.Body className="p-0">
          {isLoading ? (
             <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-navy-800)]"></div></div>
          ) : isError ? (
             <div className="p-8 text-center text-[var(--color-danger)]">Error loading worklist.</div>
          ) : filteredRequests.length === 0 ? (
             <div className="p-12 text-center text-[var(--color-text-muted)]">No requests found.</div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {filteredRequests.map(req => {
                const targetHours = req.testCatalog?.turnaroundTargetHours || 24;
                const dueTime = new Date(req.requestedAt).getTime() + (targetHours * 60 * 60 * 1000);
                const isOverdue = isPast(new Date(dueTime)) && req.status !== 'RELEASED' && req.status !== 'VERIFIED';
                
                return (
    
                  <motion.li variants={fadeIn} key={req.id} className="p-4 hover:bg-[var(--color-surface-alt)] transition-colors flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant={req.priority === 'STAT' ? 'danger' : req.priority === 'URGENT' ? 'warning' : 'info'}>
                          {req.priority}
                        </Badge>
                        <span className="font-bold text-[var(--color-navy-900)]">{req.testCatalog?.testName}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">#{req.labRequestNumber}</span>
                        {isOverdue && <Badge variant="danger" className="animate-pulse flex items-center gap-1"><AlertCircle size={10} /> OVERDUE</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
                        <span><strong className="text-[var(--color-text)]">Patient:</strong> {req.patient?.user?.firstName} {req.patient?.user?.lastName}</span>
                        <span><strong className="text-[var(--color-text)]">Requested:</strong> {format(new Date(req.requestedAt), 'PPp')}</span>
                        <span><strong className="text-[var(--color-text)]">Status:</strong> {req.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                       {req.status === 'ORDERED' && (
                         <>
                           {!req.sampleBarcodeId && (
                             <Button size="sm" variant="secondary" onClick={() => generateBarcodeMutation.mutate(req.id)} isLoading={generateBarcodeMutation.isPending}>Barcode</Button>
                           )}
                           <Button size="sm" variant="primary" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'COLLECTED' })}>Mark Collected</Button>
                         </>
                       )}
                       {req.status === 'COLLECTED' && (
                         <>
                           {req.sampleBarcodeId && (
                             <Button size="sm" variant="ghost" icon={FileText} onClick={() => window.print()}>Print</Button>
                           )}
                           <Button size="sm" variant="primary" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RECEIVED' })}>Receive</Button>
                         </>
                       )}
                       {req.status === 'RECEIVED' && (
                         <Button size="sm" variant="primary" icon={Play} onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'IN_PROGRESS' })}>Start Processing</Button>
                       )}
                       {req.status === 'IN_PROGRESS' && (
                         <Button size="sm" variant="primary" onClick={() => setSelectedRequest(req)}>Enter Results</Button>
                       )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card.Body>
      </Card>
      
      {selectedRequest && (
        <ResultEntryModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onSuccess={() => setSelectedRequest(null)} />
      )}
    </motion.div>
    
  );
};

export default LabWorklist;
