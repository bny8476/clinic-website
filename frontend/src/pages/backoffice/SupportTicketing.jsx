import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { ArrowLeft, CheckCircle2, Clock, LifeBuoy, MessageSquare, Ticket, User } from 'lucide-react';
import { fadeIn } from '../../components/ui/motion';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SupportTicketing = () => {
  const [filter, setFilter] = useState('ALL');
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axiosPrivate.get('/support/tickets');
        setTickets(res.data);
      } catch {
        toast.error('Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => filter === 'ALL' || t.status === filter);

  const resolveTicket = async (id) => {
    try {
      await axiosPrivate.patch(`/support/tickets/${id}/status?status=RESOLVED`);
      setTickets(tickets.map(t => t.id === id ? { ...t, status: 'RESOLVED' } : t));
      toast.success(`Ticket ${id} marked as resolved`);
    } catch {
      toast.error('Failed to resolve ticket');
    }
  };

  return (
    <div className="p-6 md:p-8 bg-white min-h-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeIn}
        className="max-w-[1500px] mx-auto space-y-6"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-800 m-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <LifeBuoy className="w-6 h-6 text-[#2160FF]" />
              </div>
              Support & Ticketing
            </h1>
            <p className="text-sm font-medium text-slate-500 m-0 mt-2">
              Manage user support requests, technical issues, and inquiries.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-[16px] font-extrabold text-slate-800">Support Tickets</h2>
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="py-2 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold focus:outline-none focus:border-[#2160FF] focus:ring-1 focus:ring-[#2160FF] shadow-sm cursor-pointer"
            >
              <option value="ALL">All Tickets</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div className="p-0">
            {filteredTickets.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={MessageSquare} title="No Tickets Found" description="There are no support tickets matching this filter." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredTickets.map(ticket => (
                  <li key={ticket.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mt-1 shrink-0 ${
                        ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {ticket.status === 'RESOLVED' ? <CheckCircle2 size={24} /> : 
                         ticket.status === 'IN_PROGRESS' ? <Clock size={24} /> : 
                         <MessageSquare size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">#{ticket.id}</span>
                          <h3 className="font-extrabold text-slate-800 text-[15px] group-hover:text-[#2160FF] transition-colors">{ticket.subject}</h3>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" /> User: {ticket.user?.firstName} {ticket.user?.lastName}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                            ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                            ticket.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {ticket.priority} Priority
                          </span>
                          <span className="text-[10px] font-bold bg-blue-50 text-[#2160FF] px-2 py-1 rounded-md uppercase tracking-wider">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {ticket.status !== 'RESOLVED' ? (
                        <button 
                          onClick={() => resolveTicket(ticket.id)}
                          className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold py-2 px-5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={16} /> Resolve
                        </button>
                      ) : (
                        <button 
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-5 rounded-lg transition-colors border border-slate-200"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupportTicketing;
