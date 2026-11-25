import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  Headphones,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Monitor,
  Plus,
  Search,
  Send,
  Ticket,
  User,
  UserCheck,
  Users,
  X,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

export default function ReceptionSupport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [ticketFilter, setTicketFilter] = useState('ALL'); // ALL | OPEN | RESOLVED
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [ticketType, setTicketType] = useState('PATIENT'); // 'PATIENT' | 'FACILITY'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Form state
  const [ticketForm, setTicketForm] = useState({
    patientMrn: '',
    patientName: '',
    patientPhone: '',
    subject: '',
    category: 'BILLING',
    priority: 'HIGH',
    description: '',
    counterNumber: 'Counter 1'
  });

  // Query: Reception tickets
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['receptionTickets'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/support/my-tickets');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Failed to load tickets', err);
        return [];
      }
    }
  });

  // Query: Selected ticket discussion messages
  const { data: ticketMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['ticketMessages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      try {
        const res = await axiosPrivate.get(`/support/tickets/${selectedTicket.id}/messages`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!selectedTicket?.id
  });

  // Mutation: Create Ticket
  const createMutation = useMutation({
    mutationFn: async (data) => {
      let finalSubject = data.subject;
      let finalDescription = data.description;

      if (ticketType === 'PATIENT') {
        const patientTag = data.patientName ? `[Patient: ${data.patientName}${data.patientMrn ? ` / ${data.patientMrn}` : ''}] ` : '[Walk-in Patient] ';
        finalSubject = patientTag + data.subject;
        finalDescription = `Contact: ${data.patientPhone || 'N/A'}\nMRN/Name: ${data.patientName || 'Anonymous'}\n\nGrievance Details:\n${data.description}`;
      } else {
        finalSubject = `[Front-Desk: ${data.counterNumber}] ` + data.subject;
        finalDescription = `Location: ${data.counterNumber}\nIssue:\n${data.description}`;
      }

      const res = await axiosPrivate.post('/support/tickets', {
        subject: finalSubject,
        category: data.category,
        priority: data.priority,
        description: finalDescription
      }, {
        params: { initialMessage: finalDescription }
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['receptionTickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setIsCreating(false);
      setTicketForm({
        patientMrn: '',
        patientName: '',
        patientPhone: '',
        subject: '',
        category: 'BILLING',
        priority: 'HIGH',
        description: '',
        counterNumber: 'Counter 1'
      });
      toast.success(
        `Ticket #${data?.ticketNumber || 'TKT-NEW'} created! Support desk has been notified.`,
        { duration: 4000 }
      );
    },
    onError: () => {
      toast.error('Failed to create ticket. Please check connection.');
    }
  });

  // Mutation: Reply
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const res = await axiosPrivate.post(`/support/tickets/${ticketId}/messages`, { message });
      return res.data;
    },
    onSuccess: () => {
      setReplyText('');
      refetchMessages();
      toast.success('Reply submitted to support desk.');
    },
    onError: () => {
      toast.error('Failed to deliver message.');
    }
  });

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket?.id) return;
    replyMutation.mutate({ ticketId: selectedTicket.id, message: replyText.trim() });
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let list = Array.isArray(tickets) ? tickets : [];
    if (ticketFilter === 'OPEN') {
      list = list.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
    } else if (ticketFilter === 'RESOLVED') {
      list = list.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tickets, ticketFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 font-bold';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
              <button
                onClick={() => navigate('/reception/dashboard')}
                className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Reception Dashboard
              </button>
              <span>/</span>
              <span className="text-blue-600 font-bold">Customer Support Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Front Desk & Patient Grievance Desk
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Reception Operations
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Log in-person patient grievances or submit front-desk hardware and facility maintenance tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTicketType('PATIENT');
                setIsCreating(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Log Patient Grievance</span>
            </button>
            <button
              onClick={() => {
                setTicketType('FACILITY');
                setIsCreating(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Report Counter IT Issue</span>
            </button>
          </div>
        </div>

        {/* 2 Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => {
              setTicketType('PATIENT');
              setIsCreating(true);
            }}
            className="bg-white rounded-2xl p-5 border border-blue-100 shadow-2xs hover:shadow-xs hover:border-blue-300 transition cursor-pointer flex items-center gap-4 bg-gradient-to-r from-blue-50/50 to-white"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Proxy Patient Grievance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Walk-in patient reporting a billing discrepancy, missing lab report, or appointment dispute.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
          </div>

          <div
            onClick={() => {
              setTicketType('FACILITY');
              setIsCreating(true);
            }}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer flex items-center gap-4 bg-gradient-to-r from-slate-50/50 to-white"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Counter Hardware & Facility</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Token screen offline, receipt printer jam, POS card terminal error, or check-in kiosk failure.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                Tickets Logged from Reception
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                {tickets.length} Total
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reception tickets..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                {['ALL', 'OPEN', 'RESOLVED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTicketFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      ticketFilter === filter ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'OPEN' ? 'Active' : 'Resolved'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        #{ticket.ticketNumber || `TKT-${ticket.id}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                        {ticket.category || 'GENERAL'}
                      </span>
                      {ticket.priority && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(ticket.status)}`}>
                      {ticket.status || 'OPEN'}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {ticket.subject}
                  </h4>

                  {ticket.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Today'}
                  </span>
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Thread</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No reception tickets logged yet.</p>
              <p className="text-[11px] text-slate-400">
                Log patient complaints or counter equipment issues using the buttons above.
              </p>
            </div>
          )}
        </div>

        {/* Modal: Create Ticket */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {ticketType === 'PATIENT' ? <UserCheck className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {ticketType === 'PATIENT' ? 'Log Patient Grievance (Proxy)' : 'Report Counter Hardware / IT Issue'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Auto-routes to hospital customer support & IT teams</p>
                  </div>
                </div>
                <button onClick={() => setIsCreating(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Ticket Type inside Modal */}
              <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTicketType('PATIENT')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    ticketType === 'PATIENT' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Patient Grievance
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('FACILITY')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    ticketType === 'FACILITY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Front Desk IT / Hardware
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(ticketForm); }} className="space-y-3.5">
                {ticketType === 'PATIENT' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Patient Name / MRN</label>
                      <input
                        type="text"
                        value={ticketForm.patientName}
                        onChange={(e) => setTicketForm({ ...ticketForm, patientName: e.target.value })}
                        placeholder="John Doe (MRN-1002)"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Patient Contact Phone</label>
                      <input
                        type="tel"
                        value={ticketForm.patientPhone}
                        onChange={(e) => setTicketForm({ ...ticketForm, patientPhone: e.target.value })}
                        placeholder="+1 (555) 019-2831"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Counter Location / Equipment</label>
                    <input
                      type="text"
                      value={ticketForm.counterNumber}
                      onChange={(e) => setTicketForm({ ...ticketForm, counterNumber: e.target.value })}
                      placeholder="E.g., Reception Counter 2 - POS Terminal"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="BILLING">Billing & Payments</option>
                      <option value="APPOINTMENT">Appointment Reschedule</option>
                      <option value="LABORATORY">Lab / Radiology Reports</option>
                      <option value="PHARMACY">Pharmacy / Medicines</option>
                      <option value="TECHNICAL">Hardware / Software IT</option>
                      <option value="GENERAL">General Grievance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Urgency</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="URGENT">Urgent (Patient at counter)</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    required
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    placeholder={ticketType === 'PATIENT' ? 'E.g., Patient charged twice for ultrasound' : 'E.g., Token printer paper jam / offline'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    required
                    rows="3"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    placeholder="Enter full details and context for customer support..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit to Support Desk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Thread */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-600">
                      #{selectedTicket.ticketNumber || `TKT-${selectedTicket.id}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedTicket.subject}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Original Logged Details:</p>
                  <p className="whitespace-pre-wrap">{selectedTicket.description || 'No description recorded.'}</p>
                </div>

                {ticketMessages.map((msg, idx) => {
                  const isAgent = msg.agent || msg.isAgent || msg.senderType === 'AGENT' || msg.isAgentResponse;
                  return (
                    <div key={idx} className={`flex gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 text-xs ${isAgent ? 'bg-white border border-blue-100 text-slate-800' : 'bg-blue-600 text-white'}`}>
                        <div className="text-[10px] opacity-75 font-bold mb-0.5">
                          {isAgent ? (msg.senderName || 'Support Desk Agent') : 'Reception'}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.message || msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type follow-up note to support agent..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
