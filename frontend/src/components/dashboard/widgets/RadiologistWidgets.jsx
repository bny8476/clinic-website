import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { FileText, Eye, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const RadiologistHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
      <Scan className="w-7 h-7 text-[var(--color-navy-800)]" />
      Radiology & PACS Workstation
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Imaging procedure management, DICOM study review, and diagnostic report generation.
    </p>
  </div>
);

export const RadiologistKPIWidget = ({ pendingCount, completedCount, proceduresCount, isLoading }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={AlertCircle} label="Pending Scans / Reports" value={isLoading ? '...' : pendingCount} colorToken="warning" />
    <KPICard icon={CheckCircle2} label="Completed Studies" value={isLoading ? '...' : completedCount} colorToken="success" />
    <KPICard icon={ImageIcon} label="Active Procedures" value={isLoading ? '...' : proceduresCount} colorToken="navy" />
  </div>
);

export const RadiologistWorkstationWidget = ({ requests, isLoading }) => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewingDicom, setViewingDicom] = useState(null);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [dicomUrl, setDicomUrl] = useState('');

  const saveReport = useMutation({
    mutationFn: async ({ requestId, payload }) => axiosPrivate.post(`/radiology/requests/${requestId}/report`, payload),
    onSuccess: () => {
      toast.success('Radiology report saved successfully');
      queryClient.invalidateQueries(['radiology-requests']);
      setSelectedRequest(null);
      setFindings('');
      setImpression('');
      setDicomUrl('');
    },
    onError: () => toast.error('Failed to save report')
  });

  const updateStatus = useMutation({
    mutationFn: async ({ requestId, status }) => axiosPrivate.patch(`/radiology/requests/${requestId}/status?status=${status}`),
    onSuccess: () => {
      toast.success('Procedure status updated');
      queryClient.invalidateQueries(['radiology-requests']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const openReportModal = async (req) => {
    setSelectedRequest(req);
    try {
      const res = await axiosPrivate.get(`/radiology/requests/${req.id}/report`);
      if (res.data) {
        setFindings(res.data.findings || '');
        setImpression(res.data.impression || '');
        setDicomUrl(res.data.dicomImageUrl || '');
      }
    } catch {
      setFindings('');
      setImpression('');
      setDicomUrl('');
    }
  };

  const handleSubmitReport = (finalized = false) => {
    if (!selectedRequest) return;
    saveReport.mutate({
      requestId: selectedRequest.id,
      payload: { findings, impression, dicomImageUrl: dicomUrl, status: finalized ? 'FINALIZED' : 'DRAFT' },
    });
  };

  const columns = [
    { key: 'id', title: 'Req #', render: (val) => `#${val}` },
    { key: 'procedure', title: 'Procedure', render: (p) => p?.name || 'Radiology Scan' },
    { key: 'modality', title: 'Modality', render: (_, row) => <Badge variant="info">{row.procedure?.modality || 'RAD'}</Badge> },
    { key: 'priority', title: 'Priority', render: (val) => <Badge variant={val === 'STAT' ? 'danger' : val === 'URGENT' ? 'warning' : 'neutral'}>{val || 'ROUTINE'}</Badge> },
    { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'COMPLETED' ? 'success' : 'warning'}>{val}</Badge> },
    {
      key: 'actions', title: 'Actions', align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'REQUESTED' && (
            <Button variant="secondary" size="sm" isLoading={updateStatus.isPending} onClick={() => updateStatus.mutate({ requestId: row.id, status: 'SCHEDULED' })}>Schedule</Button>
          )}
          <Button variant="primary" size="sm" icon={FileText} onClick={() => openReportModal(row)}>Report</Button>
          <Button variant="outline" size="sm" icon={Eye} onClick={() => setViewingDicom(row)}>DICOM</Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={requests}
          isLoading={isLoading}
          searchPlaceholder="Search imaging studies..."
          emptyTitle="No radiology requests found"
        />
      </div>

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title={`Radiology Report — Req #${selectedRequest?.id || ''} (${selectedRequest?.procedure?.name || 'Study'})`} size="lg">
        <div className="space-y-4">
          <FormField label="Radiological Findings" required id="findings">
            <textarea id="findings" rows={4} value={findings} onChange={e => setFindings(e.target.value)} placeholder="Enter detailed radiological findings and anatomical observations..." className="input-field" />
          </FormField>
          <FormField label="Diagnostic Impression" required id="impression">
            <textarea id="impression" rows={3} value={impression} onChange={e => setImpression(e.target.value)} placeholder="Enter summary diagnostic impression and key conclusions..." className="input-field" />
          </FormField>
          <FormField label="DICOM Image / PACS URL" id="dicomUrl">
            <input id="dicomUrl" type="text" value={dicomUrl} onChange={e => setDicomUrl(e.target.value)} placeholder="https://pacs.clinic.org/dicom/viewer?study=123" className="input-field" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" isLoading={saveReport.isPending} onClick={() => handleSubmitReport(false)}>Save Draft</Button>
            <Button variant="primary" isLoading={saveReport.isPending} onClick={() => handleSubmitReport(true)}>Finalize Report</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewingDicom} onClose={() => setViewingDicom(null)} title={`DICOM PACS Viewer — Study #${viewingDicom?.id || ''}`} size="xl">
        <div className="bg-[#0B1220] rounded-md p-6 border border-slate-800 text-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          <ImageIcon className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">Web DICOM Canvas Viewport</h3>
          <p className="text-xs text-slate-400 m-0">Modality: {viewingDicom?.procedure?.modality} &bull; PACS Study UID: {viewingDicom?.id}-STUDY-PACS</p>
        </div>
      </Modal>
    </>
  );
};
