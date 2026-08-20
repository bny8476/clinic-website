import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { CheckCircle2, Search, ArrowLeft, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';



const FinancePayments = () => {
  const queryClient = useQueryClient();
  const [searchInvoiceId, setSearchInvoiceId] = useState('');
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: ''
  });

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['finance-payments'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/finance/payments');
      return res.data;
    }
  });

  const { data: invoiceToPay, isLoading: isSearching, refetch: searchInvoice } = useQuery({
    queryKey: ['invoice-search', searchInvoiceId],
    queryFn: async () => {
      if (!searchInvoiceId) return null;
      try {
        const res = await axiosPrivate.get(`/billing/invoices/${searchInvoiceId}`);
        return res.data;
      } catch (err) {
        toast.error('Invoice not found');
        return null;
      }
    },
    enabled: false
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInvoiceId) searchInvoice();
  };

  const processPayment = useMutation({
    mutationFn: async () => {
      const idempotencyKey = `inv_${invoiceToPay.id}_${Date.now()}`;
      const initRes = await axiosPrivate.post('/v1/finance/payments/initiate', {
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        idempotencyKey: idempotencyKey
      });
      const paymentId = initRes.data.id;
      
      await axiosPrivate.post(`/v1/finance/payments/${paymentId}/capture`, {
        transactionRef: paymentForm.referenceNumber || 'CASH_TX'
      });
      
      await axiosPrivate.post(`/v1/finance/payments/${paymentId}/allocate`, {
        invoiceId: invoiceToPay.id,
        amount: Number(paymentForm.amount)
      });
      
      // Also mark invoice as paid
      await axiosPrivate.patch(`/billing/invoices/${invoiceToPay.id}/mark-paid?paymentMethod=${paymentForm.paymentMethod}`);
      
      return initRes.data;
    },
    onSuccess: () => {
      toast.success('Payment processed successfully');
      setSearchInvoiceId('');
      setPaymentForm({ amount: '', paymentMethod: 'CASH', referenceNumber: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-payments'] });
      queryClient.setQueryData(['invoice-search', searchInvoiceId], null); // Clear search result
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  });

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (Number(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    processPayment.mutate();
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
          <Link to="/finance" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Payment Processing
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Record payments for outstanding patient invoices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Process New Payment</h2>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Enter Invoice ID..."
                    value={searchInvoiceId}
                    onChange={(e) => setSearchInvoiceId(e.target.value)}
                    className="input-field py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                  />
                </div>
                <Button type="submit" variant="secondary" icon={Search} isLoading={isSearching}>
                  Find
                </Button>
              </form>

              <AnimatePresence>
              {invoiceToPay && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5 overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800">Invoice #{invoiceToPay.invoiceNumber}</h3>
                      <p className="text-sm text-slate-600">Patient: {invoiceToPay.patientName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${invoiceToPay.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {invoiceToPay.status}
                    </span>
                  </div>
                  
                  <div className="mb-6 flex justify-between items-center py-3 border-y border-slate-200">
                    <span className="font-semibold text-slate-600">Total Amount Due</span>
                    <span className="text-xl font-bold text-slate-900">${invoiceToPay.totalAmount?.toFixed(2)}</span>
                  </div>

                  {invoiceToPay.status === 'PAID' ? (
                    <div className="text-center py-4 text-emerald-600 font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 /> This invoice is already paid.
                    </div>
                  ) : (
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Amount to Pay" required id="amount">
                          <input 
                            id="amount"
                            type="number" step="0.01"
                            value={paymentForm.amount} 
                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                            className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                            required
                          />
                        </FormField>
                        <FormField label="Payment Method" required id="paymentMethod">
                          <select 
                            id="paymentMethod"
                            value={paymentForm.paymentMethod} 
                            onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} 
                            className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                          >
                            <option value="CASH">Cash</option>
                            <option value="CREDIT_CARD">Credit Card</option>
                            <option value="INSURANCE">Insurance</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                          </select>
                        </FormField>
                      </div>
                      
                      {['CREDIT_CARD', 'BANK_TRANSFER'].includes(paymentForm.paymentMethod) && (
                        <FormField label="Reference / Transaction ID" required id="referenceNumber">
                          <input 
                            id="referenceNumber"
                            type="text"
                            value={paymentForm.referenceNumber} 
                            onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} 
                            className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                            required
                          />
                        </FormField>
                      )}

                      <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
                        <Button type="submit" variant="primary" icon={CheckCircle2} isLoading={processPayment.isPending}>
                          Confirm Payment
                        </Button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Recent Payments</h2>
          </Card.Header>
          <Card.Body className="p-0 max-h-[600px] overflow-y-auto">
            {isLoadingPayments ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No payments recorded yet.</div>
            ) : (
              <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-[var(--color-border)]">
                {payments.map(payment => (
                  <motion.li variants={fadeIn} key={payment.id} className="p-4 hover:bg-[var(--color-surface-alt)]">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[var(--color-navy-900)] text-sm">Invoice #{payment.invoiceId}</h3>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {payment.paymentMethod} {payment.referenceNumber ? `• Ref: ${payment.referenceNumber}` : ''}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-2">
                          {new Date(payment.paidAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">+${payment.amount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </Card.Body>
        </Card>
      </div>
    </motion.div>
    
  );
};

export default FinancePayments;
