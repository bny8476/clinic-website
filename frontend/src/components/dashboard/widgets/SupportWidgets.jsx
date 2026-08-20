import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { HelpCircle, MessageSquare, CheckCircle, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const SupportHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
      Customer Support & Ticket Desk
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Manage patient inquiries, support tickets, and chat threads.
    </p>
  </div>
);

export const SupportKPIWidget = ({ openTicketsCount, inProgressCount, resolvedCount, loadingTickets }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={HelpCircle} label="Open Tickets" value={loadingTickets ? '...' : openTicketsCount} colorToken="info" />
    <KPICard icon={Clock} label="In Progress" value={loadingTickets ? '...' : inProgressCount} colorToken="warning" />
    <KPICard icon={CheckCircle} label="Resolved Tickets" value={loadingTickets ? '...' : resolvedCount} colorToken="success" />
  </div>
);

export const SupportTicketsWidget = ({ filteredTickets, loadingTickets }) => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['support-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const res = await axiosPrivate.get(`/support/tickets/${selectedTicket.id}/messages`);
      return res.data;
    },
    enabled: !!selectedTicket,
  });

  const sendReply = useMutation({
    mutationFn: async ({ ticketId, message }) => axiosPrivate.post(`/support/tickets/${ticketId}/messages`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries(['support-messages', selectedTicket?.id]);
      queryClient.invalidateQueries(['support-tickets']);
      setReplyMessage('');
      toast.success('Reply sent successfully');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ ticketId, status }) => axiosPrivate.patch(`/support/tickets/${ticketId}/status?status=${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['support-tickets']);
      if (selectedTicket) setSelectedTicket(null);
      toast.success('Ticket status updated');
    },
  });

  const columns = [
    { key: 'ticketNumber', title: 'Ticket #', render: (val) => <span className="font-bold text-[var(--color-info)]">{val}</span> },
    { key: 'subject', title: 'Subject', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'category', title: 'Category', render: (val) => <Badge variant="info">{val}</Badge> },
    { key: 'priority', title: 'Priority', render: (val) => <span className={`font-semibold ${val === 'URGENT' || val === 'HIGH' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>{val}</span> },
    { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'RESOLVED' ? 'success' : val === 'IN_PROGRESS' ? 'warning' : 'danger'}>{val}</Badge> },
    {
      key: 'actions', title: 'Actions', align: 'right',
      render: (_, t) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="info" size="sm" icon={MessageSquare} onClick={() => setSelectedTicket(t)}>Chat</Button>
          {t.status !== 'RESOLVED' && <Button variant="success" size="sm" icon={CheckCircle} onClick={() => updateStatus.mutate({ ticketId: t.id, status: 'RESOLVED' })}>Resolve</Button>}
        </div>
      )
    }
  ];

  return (
    <>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <DataTable columns={columns} data={filteredTickets} isLoading={loadingTickets} searchPlaceholder="Search tickets..." emptyTitle="No tickets found" />
      </div>

      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={`${selectedTicket?.ticketNumber} — ${selectedTicket?.subject}`} size="lg">
        {selectedTicket && (
          <div className="flex flex-col h-[500px]">
            <p className="text-sm text-[var(--color-text-muted)] m-0 mb-4">
              Category: <strong className="text-[var(--color-text)]">{selectedTicket.category}</strong> | Priority: <strong className="text-[var(--color-text)]">{selectedTicket.priority}</strong>
            </p>
            <div className="flex-1 overflow-y-auto border border-[var(--color-border)] rounded-lg p-4 mb-4 flex flex-col gap-3 bg-[var(--color-surface-alt)]">
              {loadingMessages ? (
                <div className="text-center text-sm text-[var(--color-text-muted)] py-4">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-[var(--color-text-muted)] py-4">No messages yet.</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`max-w-[75%] px-4 py-2 rounded-2xl ${m.isAgentResponse ? 'self-end bg-[var(--color-info-bg)] text-[var(--color-text)] rounded-tr-sm border border-[var(--color-info)] border-opacity-20' : 'self-start bg-[var(--color-surface)] text-[var(--color-text)] rounded-tl-sm border border-[var(--color-border)]'}`}>
                    <p className={`m-0 text-[10px] font-bold uppercase tracking-wider mb-1 ${m.isAgentResponse ? 'text-[var(--color-info)]' : 'text-[var(--color-text-muted)]'}`}>{m.isAgentResponse ? 'Support Agent' : 'Patient'}</p>
                    <p className="m-0 text-sm leading-relaxed">{m.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Type response message..." value={replyMessage} onChange={e => setReplyMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && replyMessage.trim()) sendReply.mutate({ ticketId: selectedTicket.id, message: replyMessage }); }} className="input-field flex-1" disabled={selectedTicket.status === 'RESOLVED'} />
              <Button variant="info" icon={Send} disabled={!replyMessage.trim() || selectedTicket.status === 'RESOLVED'} isLoading={sendReply.isPending} onClick={() => sendReply.mutate({ ticketId: selectedTicket.id, message: replyMessage })}>Send</Button>
            </div>
            {selectedTicket.status === 'RESOLVED' && <p className="text-xs text-[var(--color-danger)] mt-2 m-0 text-center">This ticket is resolved and closed for new messages.</p>}
          </div>
        )}
      </Modal>
    </>
  );
};
