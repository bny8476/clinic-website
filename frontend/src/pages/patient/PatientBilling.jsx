import useAuthStore from '../../store/authStore';
import './PatientBilling.css';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { CheckCircle2, Clock, CreditCard, Download, FileText, Receipt, XCircle, Sparkles, DollarSign } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-16 pt-3 px-4 sm:px-6 lg:px-8 text-slate-800 space-y-6">
      
      {/* ── Top Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <div className="relative">
            <FileText className="w-6 h-6 text-blue-600" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-blue-700">$</span>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Billing & Payments</h2>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">Manage your invoices, payments, and billing history.</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-slate-200/80 mb-6 px-2">
        <button 
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 font-bold text-[13px] flex items-center gap-2 transition-all cursor-pointer relative ${activeTab === 'invoices' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Outstanding Invoices</span>
          {activeTab === 'invoices' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-bold text-[13px] flex items-center gap-2 transition-all cursor-pointer relative ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock className="w-4 h-4" />
          <span>Payment History</span>
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-full" />
          )}
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
            <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-6 lg:p-8">
              <div className="border border-dashed border-slate-200/80 rounded-[20px] p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                
                {/* Glowing Illustration */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                  {/* Background glow and circle */}
                  <div className="absolute inset-0 bg-blue-50/50 rounded-full scale-110" />
                  <div className="absolute inset-4 bg-gradient-to-tr from-blue-50 to-blue-50/20 rounded-full" />
                  
                  {/* Sparkles/Stars */}
                  <Sparkles className="absolute top-2 right-4 w-4 h-4 text-blue-200 fill-blue-200" />
                  <Sparkles className="absolute bottom-6 left-2 w-3 h-3 text-blue-200 fill-blue-200" />
                  <Sparkles className="absolute top-8 left-4 w-2 h-2 text-blue-200 fill-blue-200" />
                  <Sparkles className="absolute bottom-8 right-6 w-3 h-3 text-blue-200 fill-blue-200" />
                  
                  {/* Document + Dollar Sign */}
                  <div className="relative z-10 w-[52px] h-[64px] bg-gradient-to-b from-[#87a0ff] to-[#6082ff] rounded-[10px] shadow-lg flex flex-col p-[7px]">
                    {/* Folded Corner Effect (visual only) */}
                    <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-lg" />
                    
                    {/* Document lines */}
                    <div className="w-5 h-[3px] bg-white/60 rounded-full mb-[6px] mt-2" />
                    <div className="w-[30px] h-[3px] bg-white/60 rounded-full mb-[6px]" />
                    <div className="w-[22px] h-[3px] bg-white/60 rounded-full mb-auto" />
                    
                    {/* Coin */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 border-[2.5px] border-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-[13px] font-black">$</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-[19px] font-extrabold text-slate-900 mb-1">No invoices found</h3>
                <p className="text-[13px] font-medium text-slate-500 mb-7">You have no pending or paid invoices.</p>
                
                <button 
                  onClick={() => setActiveTab('history')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-[15px] h-[15px]" />
                  <span>View Payment History</span>
                </button>
              </div>
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
            <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-6 lg:p-8">
              <div className="border border-dashed border-slate-200/80 rounded-[20px] p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                
                {/* Glowing Illustration */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                  {/* Background glow and circle */}
                  <div className="absolute inset-0 bg-blue-50/50 rounded-full scale-110" />
                  <div className="absolute inset-4 bg-gradient-to-tr from-blue-50 to-blue-50/20 rounded-full" />
                  
                  {/* Sparkles/Stars */}
                  <Sparkles className="absolute top-2 right-4 w-4 h-4 text-blue-200 fill-blue-200" />
                  <Sparkles className="absolute bottom-6 left-2 w-3 h-3 text-blue-200 fill-blue-200" />
                  <Sparkles className="absolute top-8 left-4 w-2 h-2 text-blue-200 fill-blue-200" />
                  <Sparkles className="absolute bottom-8 right-6 w-3 h-3 text-blue-200 fill-blue-200" />
                  
                  {/* Document + Dollar Sign */}
                  <div className="relative z-10 w-[52px] h-[64px] bg-gradient-to-b from-[#87a0ff] to-[#6082ff] rounded-[10px] shadow-lg flex flex-col p-[7px]">
                    <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-lg" />
                    <div className="w-5 h-[3px] bg-white/60 rounded-full mb-[6px] mt-2" />
                    <div className="w-[30px] h-[3px] bg-white/60 rounded-full mb-[6px]" />
                    <div className="w-[22px] h-[3px] bg-white/60 rounded-full mb-auto" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 border-[2.5px] border-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-[13px] font-black">$</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-[19px] font-extrabold text-slate-900 mb-1">No payment history</h3>
                <p className="text-[13px] font-medium text-slate-500 mb-7">You haven't made any payments yet.</p>
                
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Clock className="w-[15px] h-[15px]" />
                  <span>View Outstanding Invoices</span>
                </button>
              </div>
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
