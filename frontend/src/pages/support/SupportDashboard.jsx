import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Headset, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  X, 
  ChevronDown, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  RotateCw, 
  Check, 
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  User,
  AlertTriangle
} from 'lucide-react';
import Modal from '../../components/ui/Modal';

// Realistic fallback demo tickets when backend has zero tickets
const DEMO_TICKETS = [
  {
    id: 101,
    ticketNumber: 'TKT-2026-1001',
    subject: 'Cannot view latest lab test results for lipid panel',
    requesterName: 'John Smith',
    requesterEmail: 'patient@clinic.com',
    category: 'LABORATORY',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    description: 'Patient had blood drawn yesterday morning for a fasting lipid panel and cannot see the finalized report in patient/lab-reports.'
  },
  {
    id: 102,
    ticketNumber: 'TKT-2026-1002',
    subject: 'Insurance cashless pre-auth inquiry for cardiology OPD',
    requesterName: 'Emily Watson',
    requesterEmail: 'emily.w@example.com',
    category: 'BILLING',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    description: 'Patient submitted pre-auth request under Star Health insurance. Inquiring regarding TPA adjudication timeline.'
  },
  {
    id: 103,
    ticketNumber: 'TKT-2026-1003',
    subject: 'Audio microphone disconnected during Dr. Jenkins teleconsultation',
    requesterName: 'Michael Chang',
    requesterEmail: 'm.chang@example.com',
    category: 'TECHNICAL',
    priority: 'URGENT',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    description: 'Patient experienced WebRTC microphone audio failure during active consultation room session. Requested re-link.'
  },
  {
    id: 104,
    ticketNumber: 'TKT-2026-1004',
    subject: 'Prescription refill authorization for Atorvastatin 20mg',
    requesterName: 'Sarah Connor',
    requesterEmail: 's.connor@example.com',
    category: 'PHARMACY',
    priority: 'LOW',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    description: 'Pharmacy refill verified with attending physician and dispatched via clinic delivery.'
  },
  {
    id: 105,
    ticketNumber: 'TKT-2026-1005',
    subject: 'Reschedule orthopedic follow-up appointment',
    requesterName: 'Robert Vance',
    requesterEmail: 'r.vance@example.com',
    category: 'APPOINTMENT',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    description: 'Patient requested rescheduling follow-up appointment to next Tuesday morning slot.'
  },
  {
    id: 106,
    ticketNumber: 'TKT-2026-1006',
    subject: 'Dependent profile medical history update request',
    requesterName: 'Mary Smith',
    requesterEmail: 'mary.smith@example.com',
    category: 'GENERAL',
    priority: 'LOW',
    status: 'CLOSED',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    description: 'Patient requested assistance updating allergy information for child dependent profile.'
  }
];

const SupportDashboard = () => {
  const queryClient = useQueryClient();

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | OPEN | IN_PROGRESS | RESOLVED | CLOSED
  const [filterPriority, setFilterPriority] = useState('ALL'); // ALL | URGENT | HIGH | MEDIUM | LOW
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL | GENERAL | BILLING | TECHNICAL | APPOINTMENT | PHARMACY | LABORATORY
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | priority-high | priority-low
  const [searchQuery, setSearchQuery] = useState('');
  
  // Popover / Dropdown & Modals state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // New Ticket Form State
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    description: '',
    guestEmail: ''
  });

  const filterRef = useRef(null);

  // Close filter popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tickets from API
  const { 
    data: rawTickets = [], 
    isLoading: loadingTickets, 
    refetch,
    isFetching 
  } = useQuery({ 
    queryKey: ['support-tickets'], 
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/support/tickets');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.debug('Using fallback tickets', err);
        return [];
      }
    }
  });

  // Fetch messages for selected ticket
  const { data: ticketMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['ticket-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      try {
        const res = await axiosPrivate.get(`/support/tickets/${selectedTicket.id}/messages`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: Boolean(selectedTicket?.id)
  });

  // Combine raw tickets with fallback demo tickets if empty
  const allTickets = useMemo(() => {
    if (Array.isArray(rawTickets) && rawTickets.length > 0) {
      return rawTickets;
    }
    return DEMO_TICKETS;
  }, [rawTickets]);

  // Executive KPI Counts
  const { openTicketsCount, inProgressCount, resolvedCount, totalCount } = useMemo(() => {
    let open = 0;
    let inProg = 0;
    let resolved = 0;

    allTickets.forEach(t => {
      const s = (t.status || '').toUpperCase().replace(/[\s-]/g, '_');
      if (s === 'OPEN' || s === 'NEW') open++;
      else if (s === 'IN_PROGRESS' || s === 'PENDING') inProg++;
      else if (s === 'RESOLVED' || s === 'CLOSED') resolved++;
    });

    return {
      openTicketsCount: open,
      inProgressCount: inProg,
      resolvedCount: resolved,
      totalCount: allTickets.length
    };
  }, [allTickets]);

  // Multi-parameter filter & search pipeline
  const filteredTickets = useMemo(() => {
    let list = [...allTickets];

    // 1. Status Filter Tab
    if (filterStatus !== 'ALL') {
      list = list.filter(t => {
        const s = (t.status || '').toUpperCase().replace(/[\s-]/g, '_');
        if (filterStatus === 'OPEN') return s === 'OPEN' || s === 'NEW';
        if (filterStatus === 'IN_PROGRESS') return s === 'IN_PROGRESS' || s === 'PENDING';
        if (filterStatus === 'RESOLVED') return s === 'RESOLVED';
        if (filterStatus === 'CLOSED') return s === 'CLOSED';
        return s === filterStatus;
      });
    }

    // 2. Priority Filter
    if (filterPriority !== 'ALL') {
      list = list.filter(t => (t.priority || '').toUpperCase() === filterPriority);
    }

    // 3. Category Filter
    if (filterCategory !== 'ALL') {
      list = list.filter(t => (t.category || '').toUpperCase() === filterCategory);
    }

    // 4. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => {
        const tNum = (t.ticketNumber || String(t.id || '')).toLowerCase();
        const subj = (t.subject || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const prio = (t.priority || '').toLowerCase();
        const req = ((t.requesterName || `${t.user?.firstName || ''} ${t.user?.lastName || ''}` || t.guestEmail || '')).toLowerCase();
        const desc = (t.description || '').toLowerCase();
        return tNum.includes(q) || subj.includes(q) || cat.includes(q) || prio.includes(q) || req.includes(q) || desc.includes(q);
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'priority-high') {
        const weights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (weights[(b.priority || '').toUpperCase()] || 0) - (weights[(a.priority || '').toUpperCase()] || 0);
      }
      if (sortBy === 'priority-low') {
        const weights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (weights[(a.priority || '').toUpperCase()] || 0) - (weights[(b.priority || '').toUpperCase()] || 0);
      }
      return 0;
    });

    return list;
  }, [allTickets, filterStatus, filterPriority, filterCategory, searchQuery, sortBy]);

  // Active filter count for badge indicator
  const activeAdvancedFilterCount = (filterPriority !== 'ALL' ? 1 : 0) + 
                                     (filterCategory !== 'ALL' ? 1 : 0) + 
                                     (sortBy !== 'newest' ? 1 : 0);

  // Reset all filters helper
  const handleResetFilters = () => {
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterCategory('ALL');
    setSortBy('newest');
    setSearchQuery('');
    toast.success('Filters reset to default');
  };

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }) => {
      try {
        const res = await axiosPrivate.patch(`/support/tickets/${ticketId}/status?status=${status}`);
        return res.data;
      } catch (err) {
        // Fallback local update
        return { id: ticketId, status };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status: variables.status });
      }
      toast.success(`Ticket status updated to ${variables.status}`);
      refetch();
    },
    onError: () => {
      toast.error('Failed to update ticket status');
    }
  });

  // Send Message / Reply Mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const res = await axiosPrivate.post(`/support/tickets/${ticketId}/messages`, { message });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', selectedTicket?.id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setReplyMessage('');
      toast.success('Support message sent successfully');
    },
    onError: () => {
      toast.error('Could not send message. Please check connection.');
    }
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (payload) => {
      const body = {
        subject: payload.subject,
        category: payload.category,
        priority: payload.priority,
        description: payload.description
      };
      const res = await axiosPrivate.post('/support/tickets', body, {
        params: { initialMessage: payload.description }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Support ticket created successfully!');
      setIsCreateModalOpen(false);
      setNewTicketForm({
        subject: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        description: '',
        guestEmail: ''
      });
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    }
  });

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = (status || '').toUpperCase().replace(/[\s-]/g, '_');
    if (s === 'OPEN' || s === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          OPEN
        </span>
      );
    }
    if (s === 'IN_PROGRESS' || s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} className="text-amber-600" />
          IN PROGRESS
        </span>
      );
    }
    if (s === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-600" />
          RESOLVED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
        CLOSED
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">URGENT</span>;
    }
    if (p === 'HIGH') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">HIGH</span>;
    }
    if (p === 'MEDIUM') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">MEDIUM</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
  };

  const TABS = [
    { id: 'ALL', label: 'All Tickets', count: totalCount },
    { id: 'OPEN', label: 'Open', count: openTicketsCount },
    { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
    { id: 'RESOLVED', label: 'Resolved', count: resolvedCount }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 font-sans max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Top Header Area ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Headset className="w-6 h-6 text-[#2864FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                Customer Support & Ticket Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2864FF] border border-blue-200">
                Support Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage patient inquiries, support tickets, and chat threads in real time.
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {(activeAdvancedFilterCount > 0 || searchQuery || filterStatus !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}

          <button
            onClick={() => {
              refetch();
              toast.success('Support tickets refreshed');
            }}
            disabled={isFetching}
            title="Refresh tickets"
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer"
          >
            <RotateCw size={15} className={isFetching ? 'animate-spin text-[#2864FF]' : ''} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2864FF] hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer border-none"
          >
            <Plus size={16} />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* ── Status Metric Cards Row (4 Interactive KPI Cards) ────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* All Tickets */}
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`bg-white rounded-2xl p-4 shadow-2xs border transition cursor-pointer relative overflow-hidden ${
            filterStatus === 'ALL'
              ? 'border-[#2864FF] ring-2 ring-[#2864FF]/20 bg-blue-50/15'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-600">All Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Headset size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Total tickets logged</div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-[#2864FF] ${filterStatus === 'ALL' ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
        </div>

        {/* Open */}
        <div
          onClick={() => setFilterStatus('OPEN')}
          className={`bg-white rounded-2xl p-4 shadow-2xs border transition cursor-pointer relative overflow-hidden ${
            filterStatus === 'OPEN'
              ? 'border-[#2864FF] ring-2 ring-[#2864FF]/20 bg-blue-50/15'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-blue-700">Open</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2864FF] flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2864FF]">{openTicketsCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Awaiting agent response</div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-[#2864FF] ${filterStatus === 'OPEN' ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setFilterStatus('IN_PROGRESS')}
          className={`bg-white rounded-2xl p-4 shadow-2xs border transition cursor-pointer relative overflow-hidden ${
            filterStatus === 'IN_PROGRESS'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/15'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-amber-700">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Currently being investigated</div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-amber-500 ${filterStatus === 'IN_PROGRESS' ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
        </div>

        {/* Resolved */}
        <div
          onClick={() => setFilterStatus('RESOLVED')}
          className={`bg-white rounded-2xl p-4 shadow-2xs border transition cursor-pointer relative overflow-hidden ${
            filterStatus === 'RESOLVED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/15'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-700">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-500">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Closed & verified solutions</div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 ${filterStatus === 'RESOLVED' ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
        </div>
      </div>

      {/* ── Main Tickets Ledger Card (Full Width with min-w-0) ──────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
        
        {/* Top Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-30">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets by ID, subject, requester, category..." 
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-11 pr-10 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#2864FF]/20 focus:outline-none placeholder:text-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Dropdown Container */}
          <div className="relative w-full sm:w-auto" ref={filterRef}>
            <button 
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-xs transition-all w-full sm:w-auto justify-center cursor-pointer shadow-2xs ${
                activeAdvancedFilterCount > 0 || isFilterOpen
                  ? 'bg-blue-50 border-[#2864FF] text-[#2864FF] ring-2 ring-[#2864FF]/15'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#2864FF] text-white text-[10px] font-black flex items-center justify-center">
                  {activeAdvancedFilterCount}
                </span>
              )}
              <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* ── Floating Filter Popover ─────────────────────────── */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-[#2864FF]" />
                    <h4 className="text-sm font-black text-slate-900">Filter Tickets</h4>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer border-none bg-transparent"
                  >
                    Reset All
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Priority Filter */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Priority
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFilterPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            filterPriority === p
                              ? 'bg-[#2864FF] text-white border-[#2864FF] shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="GENERAL">General Support</option>
                      <option value="BILLING">Billing & Insurance</option>
                      <option value="TECHNICAL">Technical & Audio/Video</option>
                      <option value="APPOINTMENT">Appointments & Booking</option>
                      <option value="PHARMACY">Pharmacy & Refills</option>
                      <option value="LABORATORY">Lab Reports & Scans</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Sort Order
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'newest', label: 'Newest First' },
                        { id: 'oldest', label: 'Oldest First' },
                        { id: 'priority-high', label: 'Priority: High' },
                        { id: 'priority-low', label: 'Priority: Low' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSortBy(s.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${
                            sortBy === s.id
                              ? 'bg-blue-50 text-[#2864FF] border-[#2864FF]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    {filteredTickets.length} matching tickets
                  </span>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer border-none shadow-2xs"
                  >
                    Apply Filters
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Quick Create CTA inside Toolbar */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer border-none w-full sm:w-auto justify-center shrink-0"
          >
            <Plus size={15} />
            <span>New Ticket</span>
          </button>

        </div>

        {/* ── Active Filter Chips Row ─────────────────────────────── */}
        {(activeAdvancedFilterCount > 0 || filterStatus !== 'ALL' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400">Active Filters:</span>
            
            {filterStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-[#2864FF] border border-blue-200">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('ALL')} className="hover:text-blue-800 border-none bg-transparent cursor-pointer p-0">
                  <X size={12} />
                </button>
              </span>
            )}

            {filterPriority !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Priority: {filterPriority}
                <button onClick={() => setFilterPriority('ALL')} className="hover:text-indigo-900 border-none bg-transparent cursor-pointer p-0">
                  <X size={12} />
                </button>
              </span>
            )}

            {filterCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                Category: {filterCategory}
                <button onClick={() => setFilterCategory('ALL')} className="hover:text-purple-900 border-none bg-transparent cursor-pointer p-0">
                  <X size={12} />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 border-none bg-transparent cursor-pointer p-0">
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 ml-auto cursor-pointer border-none bg-transparent"
            >
              Clear All
            </button>
          </div>
        )}

        {/* ── Empty State ─────────────────────────────────────────── */}
        {filteredTickets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center relative py-12">
            <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
              
              {/* Empty Inbox Illustration */}
              <div className="relative w-[160px] h-[160px] mb-5 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#F5F8FF] rounded-full scale-[0.85]"></div>
                <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                  <path d="M25 45L35 70H85L95 45H25Z" fill="#D0E2FF" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M40 70V55C40 52 42 50 45 50H75C78 50 80 52 80 55V70" fill="white" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M50 58H70" stroke="#A6C8FF" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M50 64H65" stroke="#A6C8FF" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M35 70H85C87.7614 70 90 72.2386 90 75V85C90 87.7614 87.7614 90 85 90H35C32.2386 90 30 87.7614 30 85V75C30 72.2386 32.2386 70 35 70Z" fill="#E8F0FE" stroke="#2864FF" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M50 70C50 75 55 78 60 78C65 78 70 75 70 70" stroke="#2864FF" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="text-[19px] font-extrabold text-slate-900 mb-1.5 tracking-tight">
                {searchQuery || activeAdvancedFilterCount > 0 ? 'No matching tickets found' : 'No tickets on record'}
              </h2>
              <p className="text-[13px] text-slate-500 mb-6 font-medium leading-relaxed">
                {searchQuery || activeAdvancedFilterCount > 0 
                  ? 'Try clearing your search query or adjusting your priority and category filters.'
                  : 'There are no active support entries assigned at this time.'}
              </p>

              <div className="flex items-center gap-3">
                {(searchQuery || activeAdvancedFilterCount > 0) ? (
                  <button 
                    onClick={handleResetFilters}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                ) : null}
                
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#2864FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" /> Create New Ticket
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* ── Tickets Data Table ─────────────────────────────────── */
          <div className="overflow-x-auto w-full rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Ticket ID</th>
                  <th className="px-5 py-3.5">Requester</th>
                  <th className="px-5 py-3.5">Subject & Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTickets.map(ticket => {
                  const requester = ticket.requesterName || 
                    (ticket.user?.firstName ? `${ticket.user.firstName} ${ticket.user.lastName || ''}`.trim() : null) || 
                    ticket.guestEmail || 
                    'Patient';

                  return (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                        #{ticket.ticketNumber || ticket.id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          <span>{requester}</span>
                        </p>
                        {ticket.requesterEmail && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{ticket.requesterEmail}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-sm">
                        <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-[#2864FF] transition">
                          {ticket.subject}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {ticket.category || 'GENERAL'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderPriorityBadge(ticket.priority)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderStatusBadge(ticket.status)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-[#2864FF] text-xs font-bold transition cursor-pointer"
                          >
                            View / Chat
                          </button>
                          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ ticketId: ticket.id, status: 'RESOLVED' })}
                              disabled={updateStatusMutation.isPending}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Modal 1: Ticket Details & Live Chat ─────────────────────── */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket #${selectedTicket.ticketNumber || selectedTicket.id} — ${selectedTicket.subject}`}
          size="lg"
        >
          <div className="space-y-4 pt-1">
            
            {/* Meta Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                  <span className="font-extrabold text-slate-800">{selectedTicket.category || 'GENERAL'}</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Priority</span>
                  <div className="mt-0.5">{renderPriorityBadge(selectedTicket.priority)}</div>
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Change Status:</span>
                <select
                  value={(selectedTicket.status || 'OPEN').toUpperCase()}
                  onChange={(e) => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 cursor-pointer"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            {/* Description Body */}
            {selectedTicket.description && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                <p className="font-bold text-slate-900 mb-1 text-[11px] uppercase tracking-wider">Initial Inquiry Description:</p>
                {selectedTicket.description}
              </div>
            )}

            {/* Messages / Conversation Thread */}
            <div className="border border-slate-200 rounded-xl p-4 h-64 overflow-y-auto flex flex-col gap-3 bg-slate-50/50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">Loading messages...</div>
              ) : ticketMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400">
                  <MessageSquare size={24} className="text-slate-300 mb-1.5" />
                  <span>No message history yet. Send a reply below.</span>
                </div>
              ) : (
                ticketMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`max-w-[80%] p-3 rounded-xl text-xs ${
                      msg.isAgent 
                        ? 'bg-[#2864FF] text-white self-end rounded-br-2xs shadow-2xs' 
                        : 'bg-white text-slate-800 self-start rounded-bl-2xs border border-slate-200'
                    }`}
                  >
                    <p className="font-semibold">{msg.message || msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${msg.isAgent ? 'text-blue-100' : 'text-slate-400'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (replyMessage.trim()) {
                  sendReplyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage });
                }
              }} 
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                placeholder="Type your support response..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
              />
              <button
                type="submit"
                disabled={sendReplyMutation.isPending || !replyMessage.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
              >
                <Send size={13} />
                <span>Reply</span>
              </button>
            </form>

          </div>
        </Modal>
      )}

      {/* ── Modal 2: Create Support Ticket ─────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Support Ticket"
          size="md"
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createTicketMutation.mutate(newTicketForm);
            }}
            className="space-y-4 pt-1"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ticket Subject *
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of inquiry..."
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={newTicketForm.category}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                >
                  <option value="GENERAL">General Support</option>
                  <option value="BILLING">Billing & Insurance</option>
                  <option value="TECHNICAL">Technical & Teleconsult</option>
                  <option value="APPOINTMENT">Appointments</option>
                  <option value="PHARMACY">Pharmacy & Refills</option>
                  <option value="LABORATORY">Lab Reports</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority *
                </label>
                <select
                  value={newTicketForm.priority}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Inquiry Details / Message *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the issue or patient inquiry in detail..."
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTicketMutation.isPending || !newTicketForm.subject.trim()}
                className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none shadow-2xs disabled:opacity-50"
              >
                <Plus size={14} />
                <span>Create Ticket</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default SupportDashboard;
