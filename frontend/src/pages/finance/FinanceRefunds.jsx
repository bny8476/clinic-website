import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import useAuthStore from '../../store/authStore';



const FinanceRefunds = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    paymentId: '',
    amount: '',
    reason: ''
  });

  const { data: refunds = [], isLoading } = useQuery({
    queryKey: ['finance-refunds'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/v1/finance/refunds');
      return res.data;
    }
  });

  const initiateMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        requestedBy: user?.userId || 1, // Fallback to 1 if no user context
        idempotencyKey: crypto.randomUUID()
      };
      const res = await axiosPrivate.post('/v1/finance/refunds/initiate', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund initiated successfully');
      setIsModalOpen(false);
      setFormData({ paymentId: '', amount: '', reason: '' });
      queryClient.invalidateQueries(['finance-refunds']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to initiate refund');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (refundId) => {
      const payload = { approvedBy: user?.userId || 1 };
      const res = await axiosPrivate.post(`/v1/finance/refunds/${refundId}/approve`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund approved');
      queryClient.invalidateQueries(['finance-refunds']);
    },
    onError: (error) => toast.error('Failed to approve refund')
  });

  const processMutation = useMutation({
    mutationFn: async (refundId) => {
      const res = await axiosPrivate.post(`/v1/finance/refunds/${refundId}/process`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund processed');
      queryClient.invalidateQueries(['finance-refunds']);
    },
    onError: (error) => toast.error('Failed to process refund')
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'INITIATED':
      case 'PENDING_APPROVAL':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Approved</span>;
      case 'PROCESSED':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Processed</span>;
      case 'REJECTED':
      case 'FAILED':
        return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">Failed/Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleInitiate = (e) => {
    e.preventDefault();
    initiateMutation.mutate(formData);
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/finance" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <RefreshCcw className="w-7 h-7 text-amber-500" />
            Refunds Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Process patient refunds for overpayments or cancelled services.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={Plus}>
          Initiate Refund
        </Button>
      </div>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-bold text-slate-800">Refund History</h2>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={RefreshCcw} title="No Refunds Found" description="There are no refunds recorded in the system yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{refund.refundReference}</td>
                      <td className="px-6 py-4 text-slate-600">${parseFloat(refund.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{getStatusBadge(refund.status)}</td>
                      <td className="px-6 py-4 text-slate-600">{refund.refundReason}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        {(refund.status === 'INITIATED' || refund.status === 'PENDING_APPROVAL') && (
                          <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(refund.id)} isLoading={approveMutation.isPending}>
                            Approve
                          </Button>
                        )}
                        {refund.status === 'APPROVED' && (
                          <Button size="sm" variant="primary" onClick={() => processMutation.mutate(refund.id)} isLoading={processMutation.isPending}>
                            Process
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initiate Refund">
        <form onSubmit={handleInitiate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment ID</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              placeholder="Original Payment ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for refund"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={initiateMutation.isPending}>Initiate</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
    
  );
};

export default FinanceRefunds;
