import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import './PatientBilling.css';

const PatientBilling = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'history'
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, invoice: null });

  // Fetch Invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['patientInvoices', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/billing/patient/${user.id}`);
      return res.data;
    },
    enabled: !!user?.id
  });

  // Fetch Payment History (Paid Invoices)
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['patientPayments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/billing/patient/${user.id}`);
      return res.data
        .filter(inv => inv.status === 'PAID')
        .map(inv => ({
          id: inv.id,
          paymentDate: inv.paidAt || inv.updatedAt,
          paymentMethod: inv.paymentMethod || 'Online',
          transactionId: inv.invoiceNumber,
          amount: inv.totalAmount || inv.amount,
          status: inv.status
        }));
    },
    enabled: activeTab === 'history' && !!user?.id
  });

  const payMutation = useMutation({
    mutationFn: async ({ invoiceId }) => {
      // Hit the real backend endpoint to mark as paid
      const res = await axiosPrivate.put(`/billing/${invoiceId}/pay`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientInvoices', user?.id]);
      queryClient.invalidateQueries(['patientPayments']);
    }
  });

  const handlePay = (invoice) => {
    setConfirmDialog({ isOpen: true, invoice });
  };

  const handleConfirmPay = () => {
    if (confirmDialog.invoice) {
      payMutation.mutate({ 
        invoiceId: confirmDialog.invoice.id 
      });
      setConfirmDialog({ isOpen: false, invoice: null });
    }
  };
  const handleDownloadPdf = async (id, invoiceNumber) => {
    const res = await axiosPrivate.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceNumber || id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ status }) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':    
        return <span className="badge badge-success"><CheckCircle2 size={12} style={{marginRight:'4px'}} aria-hidden="true"/> {status}</span>;
      case 'PENDING': return <span className="badge badge-warning"><Clock size={12} style={{marginRight:'4px'}} aria-hidden="true"/> {status}</span>;
      case 'OVERDUE': return <span className="badge badge-danger"><XCircle size={12} style={{marginRight:'4px'}} aria-hidden="true"/> {status}</span>;
      default:        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="billing-page">
      <header className="page-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
        <h2 className="page-title">Billing &amp; Payments</h2>
      </header>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('invoices')}
          className={`pb-2 px-1 font-medium transition ${activeTab === 'invoices' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Outstanding Invoices
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-1 font-medium transition ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Payment History
        </button>
      </div>

      {activeTab === 'invoices' && (
        <>
          {isLoadingInvoices ? (
            <div className="card">Loading invoices...</div>
          ) : invoices && invoices.length > 0 ? (
            <div className="invoice-list">
              {invoices.map((invoice, idx) => (
                <div key={invoice.id} className="invoice-card card card-enter" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="invoice-header">
                    <div className="invoice-icon"><FileText className="text-navy-600" size={24} /></div>
                    <div className="invoice-meta">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {invoice.invoiceNumber || `INV-${invoice.id}`}
                        <StatusBadge status={invoice.status} />
                      </h3>
                      <p style={{ margin: '2px 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{invoice.description}</p>
                      <span className="invoice-date">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="invoice-amount-section">
                      <div className="invoice-amount">₹{(invoice.totalAmount || invoice.amount || 0).toFixed(2)}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {invoice.status === 'PENDING' && (
                          <button className="btn-primary" onClick={() => handlePay(invoice)} disabled={payMutation.isPending}>
                            <CreditCard size={14} style={{ marginRight: '4px' }} />
                            {payMutation.isPending ? 'Processing...' : 'Pay Mock'}
                          </button>
                        )}
                        {invoice.status === 'PAID' && (
                          <button
                            className="btn-secondary"
                            onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Download size={14} /> Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {invoice.items && invoice.items.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-surface-alt)', paddingTop: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ color: 'var(--color-text-muted)' }}>
                            <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 600 }}>Description</th>
                            <th style={{ textAlign: 'center', padding: '4px 0', fontWeight: 600 }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map(item => (
                            <tr key={item.id} style={{ borderTop: '1px solid var(--color-surface-alt)' }}>
                              <td style={{ padding: '6px 0', color: '#334155' }}>{item.description}</td>
                              <td style={{ padding: '6px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>{item.quantity}</td>
                              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>₹{item.totalPrice?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <FileText size={48} className="text-navy-300" />
              <h3>No invoices found</h3>
              <p>You have no pending or paid invoices.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <>
          {isLoadingPayments ? (
            <div className="card">Loading payments...</div>
          ) : payments && payments.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">TXN ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map(payment => (
                             <tr key={payment.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={14} />
                                        {payment.paymentMethod}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                    {payment.transactionId || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold text-right">
                                    ₹{payment.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={payment.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
            <div className="card empty-state">
              <Receipt size={48} className="text-navy-300" />
              <h3>No payment history</h3>
              <p>You haven't made any payments yet.</p>
            </div>
          )}
        </>
      )}

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, invoice: null })}
        onConfirm={handleConfirmPay}
        title="Confirm Payment"
        description={`Process payment for ₹${confirmDialog.invoice?.totalAmount || confirmDialog.invoice?.amount || 0}?`}
        confirmText="Pay Now"
        isDestructive={false}
        isLoading={payMutation.isPending}
      />
    </div>
  );
};

export default PatientBilling;
