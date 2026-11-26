import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Headphones,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Ticket,
  User,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Comprehensive verified FAQ articles for patient self-service
const CLINIC_FAQS = [
  {
    id: 'faq-1',
    category: 'Lab Reports',
    title: 'How do I download and view my finalized diagnostic lab reports?',
    summary: 'View your completed blood tests, pathology panels, and diagnostic findings.',
    content: 'Completed lab results are automatically posted to your patient portal under "Lab Reports" once reviewed and digitally signed off by the attending pathologist. You can view interactive parameter ranges, download a tamper-evident certified PDF, or share the report directly with external specialists.'
  },
  {
    id: 'faq-2',
    category: 'Appointments',
    title: 'How do I reschedule or cancel an existing upcoming consultation?',
    summary: 'Easily modify appointment slots up to 2 hours prior to scheduled visit time.',
    content: 'Navigate to "Appointments" on your patient dashboard. Locate the upcoming consultation card and click "Reschedule". You can choose an alternate date and available time slot without any penalty. Cancellations made at least 2 hours before the appointment are eligible for immediate credit or refund.'
  },
  {
    id: 'faq-3',
    category: 'Billing & Insurance',
    title: 'How does cashless health insurance and TPA pre-authorization work?',
    summary: 'Streamlined cashless hospitalization and outpatient claims processing.',
    content: 'Upload your primary policy card and corporate / individual health ID in the "Insurance" portal tab. Our in-house medical claims and TPA desk will verify policy eligibility within 30 minutes, generate initial cashless pre-authorization, and notify you via SMS and portal alert.'
  },
  {
    id: 'faq-4',
    category: 'Prescriptions',
    title: 'How do I request a medication refill or order home medicine delivery?',
    summary: 'Quick repeat prescriptions and doorstep medicine dispatch.',
    content: 'From the "Prescriptions" or "Order Medicine" tab, select your ongoing active medication regime and click "Request Refill" or "Add to Cart". Your physician will electronically authorize refills within 24 hours, and our pharmacy delivery network dispatches within the same day.'
  },
  {
    id: 'faq-5',
    category: 'Teleconsultation',
    title: 'How do I join a video telehealth consultation with my doctor?',
    summary: 'High-definition WebRTC video room accessible from any browser or mobile device.',
    content: 'Five minutes prior to your scheduled teleconsultation, head to "Teleconsultations" from your dashboard. Click the "Join Consultation Room" button. Ensure your camera and microphone permissions are granted. Your physician will join directly at the scheduled time.'
  },
  {
    id: 'faq-6',
    category: 'Billing & Insurance',
    title: 'Where can I find itemized invoices and receipt downloads for tax/claims?',
    summary: 'Official hospital financial receipts and GST/VAT tax invoices.',
    content: 'All past invoices, copay receipts, pharmacy purchases, and diagnostic billing records are preserved under the "Invoices" section. Each receipt includes official hospital tax registration numbers and can be exported as printable PDF.'
  }
];

export default function PatientSupport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mount guard for React Portals
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('All');
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'RESOLVED'

  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isCreating || selectedTicket) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCreating, selectedTicket]);

  // New ticket form data
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    description: '',
    contactPhone: ''
  });

  // Query: Patient tickets (Unified Support Desk)
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['patientTickets'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/support/my-tickets');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Failed to load tickets from /support/my-tickets', err);
        return [];
      }
    }
  });

  // Query: KB Search
  const { data: serverArticles = [] } = useQuery({
    queryKey: ['kbSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) return [];
      try {
        const res = await axiosPrivate.get(`/v1/patient/support/kb/search?q=${encodeURIComponent(searchQuery)}`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('KB search API unavailable, using local articles', err);
        return [];
      }
    },
    enabled: searchQuery.trim().length > 1
  });

  // Filtered FAQs (Combining local verified FAQs with any server returned articles)
  const filteredFaqs = useMemo(() => {
    let list = [...CLINIC_FAQS];

    // Append any server articles
    if (serverArticles.length > 0) {
      serverArticles.forEach(art => {
        if (!list.some(f => f.title.toLowerCase() === art.title?.toLowerCase())) {
          list.push({
            id: `server-${art.id}`,
            category: art.category || 'General',
            title: art.title,
            summary: art.summary || art.title,
            content: art.content || art.summary || ''
          });
        }
      });
    }

    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    } else if (selectedFaqCategory !== 'All') {
      list = list.filter(item => item.category === selectedFaqCategory);
    }

    return list;
  }, [serverArticles, searchQuery, selectedFaqCategory]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    if (ticketFilter === 'OPEN') {
      return tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
    }
    if (ticketFilter === 'RESOLVED') {
      return tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }
    return tickets;
  }, [tickets, ticketFilter]);

  // Query: Ticket Discussion Messages
  const { data: ticketMessages = [], isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['ticketMessages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      try {
        const res = await axiosPrivate.get(`/support/tickets/${selectedTicket.id}/messages`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Could not load ticket messages', err);
        return [];
      }
    },
    enabled: !!selectedTicket?.id
  });

  // Mutation: Create Ticket (Unified Support Desk)
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/support/tickets', {
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        description: data.description
      }, {
        params: { initialMessage: data.description }
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patientTickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setIsCreating(false);
      setNewTicket({
        subject: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        description: '',
        contactPhone: ''
      });
      toast.success(
        `Ticket #${data?.ticketNumber || 'TKT-NEW'} created! Support desk has been notified.`,
        { duration: 4000 }
      );
    },
    onError: (err) => {
      toast.error('Failed to submit support ticket. Please verify inputs or try again.');
    }
  });

  // Mutation: Send Reply Message
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const res = await axiosPrivate.post(`/support/tickets/${ticketId}/messages`, {
        message
      });
      return res.data;
    },
    onSuccess: () => {
      setReplyText('');
      refetchMessages();
      toast.success('Reply submitted to support team.');
    },
    onError: () => {
      toast.error('Failed to deliver message. Please try again.');
    }
  });

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket?.id) return;
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyText.trim()
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PENDING_PATIENT':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'NEW':
      default:
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
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
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* ── 1. Top Breadcrumb & Page Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </button>
              <span>/</span>
              <span className="text-blue-600 font-bold">Help & Support</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Help & Support Center
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                24/7 Desk Active
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Search verified clinic guides, explore frequent questions, or contact our dedicated patient care team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Support Ticket</span>
            </button>
          </div>
        </div>

        {/* ── 2. Full-Width Knowledge Base Search Hero ───────────────────────── */}
        <div className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg">
          {/* Subtle background ambient glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Patient Concierge & Self-Service
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">How can we help you today?</h2>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-xl mx-auto">
              Instant search across clinic policies, lab report guides, billing queries, and prescription refills.
            </p>

            <div className="relative max-w-2xl mx-auto pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, e.g. 'lab reports', 'billing', 'reschedule appointment'..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 shadow-xl text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30 transition border-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Keyword Chips */}
            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              <span className="text-xs text-blue-200 font-medium">Quick Topics:</span>
              {[
                'Lab Reports',
                'Billing & Insurance',
                'Appointments',
                'Prescriptions',
                'Teleconsultation'
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    setSelectedFaqCategory('All');
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition backdrop-blur-sm border border-white/15 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Quick Assistance Channels (3 Responsive Cards) ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: 24/7 Telephone Concierge */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">24/7 Telephone Concierge</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect directly with our hospital reception or emergency nursing coordinator for prompt assistance.
              </p>
            </div>
            <div className="pt-1">
              <a
                href="tel:18005550199"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
              >
                +1 (800) 555-ELIXIR <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Support Ticket Desk */}
          <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-2xs hover:shadow-xs transition space-y-3 bg-gradient-to-br from-white to-indigo-50/40">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Raise a Support Ticket</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit complex inquiries regarding medical records, billing disputes, or insurance pre-authorizations.
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => setIsCreating(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
              >
                Open Ticket Form <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Emergency Protocol */}
          <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-2xs hover:shadow-xs transition space-y-3 bg-gradient-to-br from-white to-red-50/30">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Urgent & Emergency Care</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Experiencing acute chest pain, trauma, or severe shortness of breath? Contact 911 or visit our ER immediately.
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                Hospital ER: Ambulance Ext. 911
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. Frequently Asked Questions & Knowledge Base ────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Frequently Asked Questions'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified clinical guidance and patient portal walkthroughs
              </p>
            </div>

            {/* Category Filter Chips */}
            {!searchQuery && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All', 'Lab Reports', 'Appointments', 'Billing & Insurance', 'Prescriptions', 'Teleconsultation'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFaqCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedFaqCategory === cat
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FAQ Accordion List */}
          <div className="divide-y divide-slate-100">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
                    <button
                      onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                      className="w-full flex items-start justify-between text-left gap-4 group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {faq.category}
                        </span>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                            {faq.title}
                          </h4>
                          {!isOpen && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {faq.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="p-1 rounded-lg text-slate-400 group-hover:text-indigo-600 shrink-0 transition">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-3 pl-12 pr-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                        <p>{faq.content}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No knowledge base articles match your search.</p>
                <p className="text-xs text-slate-500">
                  Try searching with different terms or raise a ticket directly with our team below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. My Support Tickets Section ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                My Support Tickets
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700">
                {tickets.length} Total
              </span>
            </div>

            {/* Status Tabs & Action */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                {['ALL', 'OPEN', 'RESOLVED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTicketFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      ticketFilter === filter
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'OPEN' ? 'Active' : 'Resolved'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Ticket
              </button>
            </div>
          </div>

          {/* Ticket Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-indigo-200 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        #{ticket.ticketNumber || `TKT-${ticket.id}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {ticket.category || 'GENERAL'}
                      </span>
                      {ticket.priority && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(ticket.status)}`}>
                      {ticket.status || 'NEW'}
                    </span>
                  </div>

                  {/* Subject & Description */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {ticket.subject}
                    </h4>
                    {ticket.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Recent'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Thread</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTickets.length === 0 && !isCreating && (
            <div className="text-center p-10 sm:p-14 bg-white rounded-3xl border border-slate-200/80 border-dashed space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <LifeBuoy className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  {ticketFilter === 'ALL'
                    ? 'No Support Tickets Found'
                    : `No ${ticketFilter === 'OPEN' ? 'Active' : 'Resolved'} Tickets`}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You currently have no support requests in this view. If you have questions about bills, appointments, or medical records, submit a ticket anytime.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Raise a Support Ticket
              </button>
            </div>
          )}
        </div>

        {/* ── 6. Create Support Ticket Modal ────────────────────────────────── */}
        {mounted && isCreating && typeof document !== 'undefined' && Boolean(document?.body) && createPortal(
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
            {/* Fullscreen Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setIsCreating(false)}
            />

            {/* Modal Dialog */}
            <div className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 sm:p-8 space-y-5 animate-in fade-in duration-200 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Create Support Ticket</h3>
                    <p className="text-xs text-slate-500">Our patient concierge team will respond promptly</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(newTicket);
                }}
                className="space-y-4"
              >
                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Issue Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="GENERAL">General Inquiry</option>
                      <option value="APPOINTMENT">Appointments & Rescheduling</option>
                      <option value="BILLING">Billing & Insurance Claims</option>
                      <option value="LABORATORY">Lab Reports & Diagnostics</option>
                      <option value="PHARMACY">Prescriptions & Pharmacy Refill</option>
                      <option value="TECHNICAL">Telehealth / Video Connection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Urgency Level
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low (General guidance)</option>
                      <option value="MEDIUM">Medium (Normal priority)</option>
                      <option value="HIGH">High (Important medical query)</option>
                      <option value="URGENT">Urgent (Immediate attention)</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subject / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                    placeholder="E.g., Cannot download recent lipid profile lab report"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                    placeholder="Please include relevant doctor name, appointment dates, or test details..."
                  ></textarea>
                </div>

                {/* Optional Contact Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Preferred Callback Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newTicket.contactPhone}
                    onChange={(e) => setNewTicket({ ...newTicket, contactPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                    placeholder="+1 (555) 012-3456"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Support Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ── 7. Ticket Details & Discussion Thread Modal ───────────────────── */}
        {mounted && selectedTicket && typeof document !== 'undefined' && Boolean(document?.body) && createPortal(
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto">
            {/* Fullscreen Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedTicket(null)}
            />

            {/* Modal Dialog */}
            <div className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200 my-auto">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-600">
                      #{selectedTicket.ticketNumber || `TKT-${selectedTicket.id}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 text-slate-700">
                      {selectedTicket.category || 'GENERAL'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(selectedTicket.status)}`}>
                      {selectedTicket.status || 'NEW'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Opened on {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'Recent'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Thread Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/30">
                {/* Initial Description Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Original Description (Patient)
                    </span>
                    <span>{selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description || 'No initial description provided.'}
                  </p>
                </div>

                {/* Follow-up Messages Thread */}
                {ticketMessages.map((msg, idx) => {
                  const isAgent = msg.agent || msg.isAgent || msg.senderType === 'AGENT' || msg.senderType === 'STAFF';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAgent && (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
                          <Headphones className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm space-y-1 shadow-2xs ${
                          isAgent
                            ? 'bg-white border border-indigo-100 text-slate-800'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                          <span className="font-bold">
                            {isAgent ? (msg.senderName || 'Support Care Agent') : 'You (Patient)'}
                          </span>
                          <span>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message || msg.content}</p>
                      </div>
                    </div>
                  );
                })}

                {ticketMessages.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 space-y-1">
                    <p>No follow-up messages yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Our customer support desk will triage this ticket shortly. You can add notes below.
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type follow-up message to support team..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}
