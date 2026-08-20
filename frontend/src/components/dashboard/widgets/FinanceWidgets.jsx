import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { CreditCard, DollarSign, ShieldAlert } from 'lucide-react';

export const FinanceHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
      <Banknote className="w-7 h-7 text-[var(--color-navy-800)]" />
      Finance & Claims Dashboard
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Financial overview, collections, expenses, and insurance claim tracking.
    </p>
  </div>
);

export const FinanceKPIWidget = ({ totalPayments, totalExpenses, pendingClaims }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={DollarSign} label="Total Collections" value={`₹${totalPayments.toLocaleString()}`} colorToken="success" />
    <KPICard icon={CreditCard} label="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} colorToken="danger" />
    <KPICard icon={ShieldAlert} label="Pending Claims" value={pendingClaims} colorToken="warning" />
  </div>
);

export const FinanceTablesWidget = ({ activeTab, payments, expenses, claims }) => {
  const queryClient = useQueryClient();

  const updateClaim = useMutation({
    mutationFn: async ({ id, status }) => axiosPrivate.patch(`/finance/claims/${id}/status?status=${status}`),
    onSuccess: () => queryClient.invalidateQueries(['finance-claims']),
  });

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      {activeTab === 'payments' && (
        <DataTable
          data={payments}
          columns={[
            { key: 'id', title: 'Payment ID', render: (val) => `#${val}` },
            { key: 'amount', title: 'Amount', render: (val) => <span className="font-bold text-[var(--color-success)]">₹{val}</span> },
            { key: 'paymentMethod', title: 'Method' },
            { key: 'transactionRef', title: 'Reference', render: (val) => val || '-' },
            { key: 'paidAt', title: 'Date', render: (val) => new Date(val).toLocaleDateString() },
          ]}
          emptyTitle="No payments found"
        />
      )}
      
      {activeTab === 'expenses' && (
        <DataTable
          data={expenses}
          columns={[
            { key: 'category', title: 'Category', render: (val) => <span className="font-medium">{val}</span> },
            { key: 'description', title: 'Description' },
            { key: 'amount', title: 'Amount', render: (val) => <span className="font-bold text-[var(--color-danger)]">₹{val}</span> },
            { key: 'incurredOn', title: 'Date' },
          ]}
          emptyTitle="No expenses recorded"
        />
      )}
      
      {activeTab === 'claims' && (
        <DataTable
          data={claims}
          columns={[
            { key: 'providerName', title: 'Provider', render: (val) => <span className="font-medium">{val}</span> },
            { key: 'claimNumber', title: 'Claim No', render: (val) => val || '-' },
            { key: 'claimedAmount', title: 'Claimed Amount', render: (val) => `₹${val}` },
            { key: 'status', title: 'Status', render: (val) => (
              <Badge variant={val === 'SETTLED' ? 'success' : val === 'REJECTED' ? 'danger' : 'warning'}>{val}</Badge>
            )},
            { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
              row.status !== 'SETTLED' && row.status !== 'REJECTED' ? (
                <button onClick={() => updateClaim.mutate({ id: row.id, status: 'SETTLED' })} className="bg-[var(--color-info)] text-[var(--color-surface)] border-none px-2 py-1 rounded text-xs cursor-pointer hover:opacity-90">
                  Settle
                </button>
              ) : null
            )}
          ]}
          emptyTitle="No claims found"
        />
      )}
    </div>
  );
};
