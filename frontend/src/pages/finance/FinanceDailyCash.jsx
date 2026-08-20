import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Lock, Unlock, BarChart3, TrendingUp, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';



const FinanceDailyCash = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('OPEN'); // 'OPEN' or 'CLOSE'
  const [amount, setAmount] = useState('');

  const cashierId = user?.userId || 1;

  const { data: currentSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['cashier-current-session', cashierId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/v1/finance/cashier/session/current?cashierId=${cashierId}`);
      return res.data || null;
    }
  });

  const { data: sessions = [], isLoading: historyLoading } = useQuery({
    queryKey: ['cashier-sessions'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/v1/finance/cashier/sessions');
      return res.data;
    }
  });

  const openSessionMutation = useMutation({
    mutationFn: async (openingFloat) => {
      const payload = {
        branchId: 1, // Defaulting for now
        cashierId,
        openingFloat
      };
      const res = await axiosPrivate.post('/v1/finance/cashier/session/open', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Session opened successfully');
      setIsModalOpen(false);
      setAmount('');
      queryClient.invalidateQueries(['cashier-current-session']);
      queryClient.invalidateQueries(['cashier-sessions']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to open session');
    }
  });

  const closeSessionMutation = useMutation({
    mutationFn: async (closingFloat) => {
      const payload = { closingFloat };
      const res = await axiosPrivate.post(`/v1/finance/cashier/session/${currentSession.id}/close`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Session closed successfully');
      setIsModalOpen(false);
      setAmount('');
      queryClient.invalidateQueries(['cashier-current-session']);
      queryClient.invalidateQueries(['cashier-sessions']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to close session');
    }
  });

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'OPEN') {
      openSessionMutation.mutate(parseFloat(amount));
    } else {
      closeSessionMutation.mutate(parseFloat(amount));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return <Badge variant="success">Open</Badge>;
      case 'CLOSED': return <Badge variant="secondary">Closed</Badge>;
      case 'DISCREPANCY': return <Badge variant="danger">Discrepancy</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Link to="/finance" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Daily Cash & Till Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage your daily cash register float and view till history.
          </p>
        </div>
        <div>
          {currentSession ? (
            <Button variant="danger" icon={Lock} onClick={() => { setModalType('CLOSE'); setIsModalOpen(true); }}>
              Close Session
            </Button>
          ) : (
            <Button variant="primary" icon={Unlock} onClick={() => { setModalType('OPEN'); setIsModalOpen(true); }}>
              Open Session
            </Button>
          )}
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={fadeIn}>
        <Card className="bg-emerald-50 border-emerald-100 h-full">
          <Card.Body className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Session Status</h3>
            <p className="text-3xl font-bold text-emerald-600">
              {sessionLoading ? '...' : currentSession ? 'OPEN' : 'CLOSED'}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-2">
              {currentSession ? `Started at ${new Date(currentSession.openedAt).toLocaleTimeString()}` : 'No active session'}
            </p>
          </Card.Body>
        </Card>
        </motion.div>
        <motion.div variants={fadeIn}>
        <Card className="h-full">
          <Card.Body className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opening Float</h3>
            <p className="text-2xl font-bold text-[var(--color-navy-900)]">
              ${currentSession ? currentSession.openingFloat.toFixed(2) : '0.00'}
            </p>
          </Card.Body>
        </Card>
        </motion.div>
        <motion.div variants={fadeIn}>
        <Card className="h-full">
          <Card.Body className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cash Collections</h3>
            <p className="text-2xl font-bold text-[var(--color-navy-900)]">
              ${currentSession ? currentSession.cashCollections.toFixed(2) : '0.00'}
            </p>
          </Card.Body>
        </Card>
        </motion.div>
      </motion.div>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-bold text-[var(--color-navy-900)] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Session History
          </h2>
        </Card.Header>
        <Card.Body className="p-0">
          {historyLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No session history available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Opened At</th>
                    <th className="p-4 border-b border-slate-200">Closed At</th>
                    <th className="p-4 border-b border-slate-200 text-right">Opening Float</th>
                    <th className="p-4 border-b border-slate-200 text-right">Collections</th>
                    <th className="p-4 border-b border-slate-200 text-right">Closing Float</th>
                    <th className="p-4 border-b border-slate-200 text-right">Status</th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-100">
                  {sessions.slice().reverse().map((session) => (
                    <motion.tr variants={fadeIn} key={session.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-[var(--color-navy-900)]">
                        {new Date(session.openedAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-600">
                        {session.closedAt ? new Date(session.closedAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-4 text-right text-slate-700">${session.openingFloat.toFixed(2)}</td>
                      <td className="p-4 text-right text-slate-700">${session.cashCollections.toFixed(2)}</td>
                      <td className="p-4 text-right text-slate-700">
                        {session.closingFloat != null ? `$${session.closingFloat.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4 text-right">
                        {getStatusBadge(session.status)}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'OPEN' ? 'Open Session' : 'Close Session'}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {modalType === 'OPEN' ? 'Opening Float Amount ($)' : 'Closing Cash Amount ($)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant={modalType === 'OPEN' ? 'primary' : 'danger'} isLoading={modalType === 'OPEN' ? openSessionMutation.isPending : closeSessionMutation.isPending}>
              {modalType === 'OPEN' ? 'Open Till' : 'Close Till'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
    
  );
};

export default FinanceDailyCash;
