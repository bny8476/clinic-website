import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

export const InsuranceHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
      <Shield className="w-7 h-7 text-[var(--color-navy-800)]" />
      Insurance Adjudication Portal
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Review insurance claims, pre-authorization requests, and payment settlements.
    </p>
  </div>
);

export const InsuranceKPIWidget = ({ pendingClaimsCount, approvedClaimsCount, preAuthsCount }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={AlertCircle} label="Pending Claims" value={pendingClaimsCount} colorToken="warning" />
    <KPICard icon={CheckCircle} label="Approved / Settled" value={approvedClaimsCount} colorToken="success" />
    <KPICard icon={ShieldCheck} label="Pre-Auth Requests" value={preAuthsCount} colorToken="info" />
  </div>
);

export const InsuranceAdjudicationWidget = ({ activeTab, claims, preAuths }) => {
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [claimStatus, setClaimStatus] = useState('APPROVED');
  const [notes, setNotes] = useState('');

  const adjudicateClaim = useMutation({
    mutationFn: async ({ claimId, status, approvedAmount, notes }) =>
      axiosPrivate.post(`/insurance/claims/${claimId}/adjudicate`, {
        status,
        approvedAmount: approvedAmount || 0,
        notes: notes || ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['insurance-claims']);
      setSelectedClaim(null);
      setApprovedAmount('');
      setNotes('');
    },
  });

  const adjudicatePreAuth = useMutation({
    mutationFn: async ({ id, status }) => axiosPrivate.patch(`/insurance/pre-auths/${id}/adjudicate?status=${status}`),
    onSuccess: () => queryClient.invalidateQueries(['insurance-preauths']),
  });

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      {activeTab === 'claims' && (
        <DataTable
          data={claims}
          columns={[
            { key: 'id', title: 'Claim ID', render: (val) => <span className="font-semibold text-[var(--color-info)]">CLM-{val}</span> },
            { key: 'providerName', title: 'Provider', render: (val) => <span className="font-medium">{val}</span> },
            { key: 'claimedAmount', title: 'Claimed Amount', render: (val) => `₹${val}` },
            { key: 'approvedAmount', title: 'Approved Amount', render: (val) => <span className="font-bold text-[var(--color-success)]">{val ? `₹${val}` : '-'}</span> },
            { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'APPROVED' || val === 'SETTLED' ? 'success' : val === 'REJECTED' ? 'danger' : 'warning'}>{val}</Badge> },
            { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
              <Button size="sm" variant="primary" onClick={() => { setSelectedClaim(row); setApprovedAmount(row.claimedAmount || ''); setClaimStatus('APPROVED'); setNotes(''); }}>
                Adjudicate
              </Button>
            )}
          ]}
          emptyTitle="No claims found"
        />
      )}
      
      {activeTab === 'pre-auths' && (
        <DataTable
          data={preAuths}
          columns={[
            { key: 'id', title: 'Pre-Auth ID', render: (val) => <span className="font-medium">PA-{val}</span> },
            { key: 'procedureName', title: 'Procedure', render: (val) => <span className="font-semibold">{val}</span> },
            { key: 'providerName', title: 'Provider' },
            { key: 'estimatedCost', title: 'Est. Cost', render: (val) => `₹${val}` },
            { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'APPROVED' ? 'success' : val === 'REJECTED' ? 'danger' : 'warning'}>{val}</Badge> },
            { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
              row.status === 'SUBMITTED' ? (
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="primary" onClick={() => adjudicatePreAuth.mutate({ id: row.id, status: 'APPROVED' })}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => adjudicatePreAuth.mutate({ id: row.id, status: 'REJECTED' })}>Reject</Button>
                </div>
              ) : null
            )}
          ]}
          emptyTitle="No pre-authorizations found"
        />
      )}

      <Modal isOpen={!!selectedClaim} onClose={() => setSelectedClaim(null)} title={`Adjudicate Claim CLM-${selectedClaim?.id || ''}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-[var(--color-navy-900)]">Decision Status</label>
            <select value={claimStatus} onChange={e => setClaimStatus(e.target.value)} className="w-full p-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              <option value="APPROVED">APPROVED</option>
              <option value="SETTLED">SETTLED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[var(--color-navy-900)]">Approved Payout Amount (₹)</label>
            <input type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} className="w-full p-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[var(--color-navy-900)]">Adjudication Notes / Remarks</label>
            <textarea rows={3} placeholder="Enter approval notes or rejection rationale..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
            <Button variant="secondary" onClick={() => setSelectedClaim(null)}>Cancel</Button>
            <Button variant="primary" isLoading={adjudicateClaim.isPending} onClick={() => adjudicateClaim.mutate({ claimId: selectedClaim?.id, status: claimStatus, approvedAmount: Number(approvedAmount), notes })}>Submit Adjudication</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
