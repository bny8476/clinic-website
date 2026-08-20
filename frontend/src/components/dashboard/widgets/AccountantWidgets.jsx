import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { Download, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const AccountantHeaderWidget = () => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
        Billing & Revenue Dashboard
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
        Manage hospital invoices, process payments, and download financial receipts.
      </p>
    </div>
  </div>
);

export const AccountantKPIWidget = ({ totalRevenue, pendingCount, overdueCount }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={TrendingUp} label="Total Paid Revenue" value={`₹${totalRevenue.toFixed(2)}`} colorToken="success" />
    <KPICard icon={Clock} label="Pending Invoices" value={pendingCount} colorToken="warning" />
    <KPICard icon={AlertCircle} label="Overdue Invoices" value={overdueCount} colorToken="danger" />
  </div>
);

const getStatusBadge = (status) => {
  switch (status?.toUpperCase()) {
    case 'PAID': return <Badge variant="success" icon={CheckCircle}>{status}</Badge>;
    case 'PENDING': return <Badge variant="warning" icon={Clock}>{status}</Badge>;
    case 'OVERDUE': return <Badge variant="danger" icon={AlertCircle}>{status}</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
};

export const AccountantInvoicesWidget = ({ filteredInvoices, isLoading }) => {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const markPaid = useMutation({
    mutationFn: async ({ id, method }) => axiosPrivate.patch(`/billing/invoices/${id}/mark-paid?paymentMethod=${method}`),
    onSuccess: () => {
      toast.success('Invoice marked as paid');
      queryClient.invalidateQueries(['allInvoices']);
    },
    onError: () => toast.error('Failed to update invoice status')
  });

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      const res = await axiosPrivate.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice PDF');
    }
  };

  const columns = [
    {
      key: 'invoiceNumber', title: 'Invoice #',
      render: (val, row) => (
        <span className="font-semibold font-display text-[var(--color-navy-900)] flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
          {val || `INV-${row.id}`}
        </span>
      )
    },
    { key: 'patientName', title: 'Patient Name' },
    { key: 'totalAmount', title: 'Total Amount', render: (val, row) => <span className="font-bold text-[var(--color-navy-900)]">₹{(val || row.amount || 0).toFixed(2)}</span> },
    { key: 'status', title: 'Status', render: (val) => getStatusBadge(val) },
    { key: 'dueDate', title: 'Due Date', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    {
      key: 'actions', title: 'Actions', align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status !== 'PAID' && (
            <Button variant="primary" size="sm" icon={CheckCircle} isLoading={markPaid.isPending} onClick={() => markPaid.mutate({ id: row.id, method: paymentMethod })}>
              Mark Paid
            </Button>
          )}
          <Button variant="outline" size="sm" icon={Download} onClick={() => handleDownloadPdf(row.id, row.invoiceNumber)}>PDF</Button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-end bg-[var(--color-surface-alt)]/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Payment Method:</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field py-1.5 px-3 text-xs w-auto m-0">
            {['CASH', 'CARD', 'INSURANCE', 'ONLINE'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
        searchPlaceholder="Search invoices or patient name..."
        emptyTitle="No invoices found"
        emptyDescription="There are no billing invoices matching the selected status filter."
      />
    </div>
  );
};
