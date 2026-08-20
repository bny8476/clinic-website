import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { FlaskConical, CheckCircle2, Activity, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const LabHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
      <FlaskConical className="w-7 h-7 text-[var(--color-navy-800)]" />
      Laboratory Diagnostics
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Sample collection tracking, test processing pipeline, and lab result verification.
    </p>
  </div>
);

export const LabKPIWidget = ({ isLoading, requestsList, filter }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={FlaskConical} label="Active Lab Requests" value={isLoading ? '...' : requestsList?.length || 0} colorToken="navy" />
    <KPICard icon={Activity} label="In Pipeline" value={filter} colorToken="warning" />
    <KPICard icon={CheckCircle2} label="Lab Status" value="Operational" colorToken="success" />
  </div>
);

export const LabRequestsWidget = ({ requestsList, isLoading, filter }) => {
  const queryClient = useQueryClient();
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [resultForm, setResultForm] = useState({ resultValue: '', referenceRange: '', unit: '', isAbnormal: false });

  const [selectedFile, setSelectedFile] = useState(null);

  const submitResult = useMutation({
    mutationFn: async ({ id, result, file }) => {
      const formData = new FormData();
      formData.append('result', new Blob([JSON.stringify(result)], { type: 'application/json' }));
      if (file) {
        formData.append('file', file);
      }
      const res = await axiosPrivate.post(`/lab/requests/${id}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lab result entered successfully');
      setResultModalOpen(false);
      setSelectedRequest(null);
      setResultForm({ resultValue: '', referenceRange: '', unit: '', isAbnormal: false });
      setSelectedFile(null);
      queryClient.invalidateQueries(['labRequests']);
    },
    onError: () => toast.error('Failed to enter result')
  });

  const handleResultSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    submitResult.mutate({ id: selectedRequest.id, result: resultForm, file: selectedFile });
  };

  const acceptRequest = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/accept`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lab request accepted');
      queryClient.invalidateQueries(['labRequests']);
    },
    onError: () => toast.error('Failed to accept request')
  });

  const verifyResult = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/verify`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lab result verified');
      queryClient.invalidateQueries(['labRequests']);
    },
    onError: () => toast.error('Failed to verify result')
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/status?status=${newStatus}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lab request status updated');
      queryClient.invalidateQueries(['labRequests']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const nextStatusMap = {
    'REQUESTED': 'SAMPLE_COLLECTED',
    'SAMPLE_COLLECTED': 'PROCESSING',
    'PROCESSING': 'RESULT_ENTERED',
    'RESULT_ENTERED': 'VERIFIED',
    'VERIFIED': 'RELEASED'
  };

  const columns = [
    {
      key: 'testName', title: 'Test Name',
      render: (_, row) => (
        <div>
          <span className="font-semibold text-sm text-[var(--color-navy-900)] block">
            {row.testCatalog?.testName || 'Laboratory Test'}
          </span>
          <div className="flex gap-2 items-center mt-1">
            <Badge variant="neutral" size="sm">{row.testCatalog?.testCode || 'LAB-01'}</Badge>
            {row.sampleBarcodeId && (
              <Badge variant="info" size="sm" className="font-mono">🔲 {row.sampleBarcodeId}</Badge>
            )}
          </div>
        </div>
      )
    },
    { key: 'patient', title: 'Patient', render: (p) => p ? `${p.firstName} ${p.lastName}` : 'N/A' },
    { key: 'priority', title: 'Priority', render: (val) => <Badge variant={val === 'URGENT' || val === 'STAT' ? 'danger' : 'info'}>{val || 'ROUTINE'}</Badge> },
    { key: 'status', title: 'Current Status', render: (val) => <Badge variant="warning">{val}</Badge> },
    {
      key: 'actions', title: 'Action', align: 'right',
      render: (_, row) => {
        if (filter === 'REQUESTED' && !row.acceptedAt) {
          return (
            <Button variant="primary" size="sm" isLoading={acceptRequest.isPending} onClick={() => acceptRequest.mutate(row.id)}>
              Accept Request
            </Button>
          );
        }
        if (filter === 'PROCESSING') {
          return <Button variant="primary" size="sm" onClick={() => { setSelectedRequest(row); setResultModalOpen(true); }}>Enter Results</Button>;
        }
        if (filter === 'RESULT_ENTERED') {
          return (
            <Button variant="primary" size="sm" isLoading={verifyResult.isPending} onClick={() => verifyResult.mutate(row.id)}>
              Approve & Sign
            </Button>
          );
        }
        const nextState = nextStatusMap[filter];
        if (nextState) {
          return (
            <Button variant="secondary" size="sm" icon={ArrowRight} isLoading={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: row.id, newStatus: nextState })}>
              Mark {nextState.replace('_', ' ')}
            </Button>
          );
        }
        return <Badge variant="success">Completed</Badge>;
      }
    }
  ];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={requestsList || []}
        isLoading={isLoading}
        searchPlaceholder="Search lab tests or patient..."
        emptyTitle="No lab requests in this stage"
        emptyDescription={`There are currently no laboratory requests with status '${filter}'.`}
      />

      <Modal isOpen={resultModalOpen} onClose={() => setResultModalOpen(false)} title="Enter Lab Result" size="md">
        <form onSubmit={handleResultSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy-700)] mb-1">Result Value *</label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={resultForm.resultValue}
              onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-navy-700)] mb-1">Unit</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={resultForm.unit}
                onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-navy-700)] mb-1">Reference Range</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={resultForm.referenceRange}
                onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isAbnormal"
              checked={resultForm.isAbnormal}
              onChange={(e) => setResultForm({ ...resultForm, isAbnormal: e.target.checked })}
              className="w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)]"
            />
            <label htmlFor="isAbnormal" className="text-sm font-medium text-red-600">Flag as Abnormal</label>
          </div>
          <div className="mt-4">
            <FileUpload 
              label="Attach PDF Report (Optional)" 
              accept=".pdf,image/*"
              onFileSelect={(file) => setSelectedFile(file)}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)] mt-4">
            <Button variant="outline" type="button" onClick={() => setResultModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={submitResult.isPending}>Save Result</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
