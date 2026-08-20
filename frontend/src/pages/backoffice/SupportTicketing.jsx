import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';



const SupportTicketing = () => {
  const [filter, setFilter] = useState('ALL');
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axiosPrivate.get('/support/tickets');
        setTickets(res.data);
      } catch (err) {
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
    } catch (err) {
      toast.error('Failed to resolve ticket');
    }
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
          <Link to="/backoffice" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-indigo-600" />
            Support & Ticketing
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage user support requests, technical issues, and inquiries.
          </p>
        </div>
      </div>

      <Card>
        <Card.Header className="flex justify-between items-center border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Support Tickets</h2>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="input-field py-1 px-3 w-auto bg-[var(--color-surface-alt)]"
          >
            <option value="ALL">All Tickets</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={MessageSquare} title="No Tickets Found" description="There are no support tickets matching this filter." />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {filteredTickets.map(ticket => (
                <li key={ticket.id} className="p-5 hover:bg-[var(--color-surface-alt)] transition-colors flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-1 shrink-0 ${
                      ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {ticket.status === 'RESOLVED' ? <CheckCircle2 size={20} /> : 
                       ticket.status === 'IN_PROGRESS' ? <Clock size={20} /> : 
                       <MessageSquare size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{ticket.id}</span>
                        <h3 className="font-bold text-[var(--color-navy-900)]">{ticket.subject}</h3>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-navy-700)] mt-0.5">
                        User: {ticket.user}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          ticket.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                          ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {ticket.priority} Priority
                        </span>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">
                          {ticket.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {ticket.status !== 'RESOLVED' ? (
                      <button 
                        onClick={() => resolveTicket(ticket.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded transition-colors shadow-sm flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    ) : (
                      <button 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default SupportTicketing;
