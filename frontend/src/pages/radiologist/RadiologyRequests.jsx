import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fadeIn } from '../../components/ui/motion';



const RadiologyRequests = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['radiology-requests', filter],
    queryFn: async () => {
      const url = filter === 'ALL' ? '/radiology/requests' : `/radiology/requests?status=${filter}`;
      const res = await axiosPrivate.get(url);
      return res.data;
    }
  });

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/radiologist" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Camera className="w-7 h-7 text-indigo-600" />
            Imaging Requests
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage pending and completed radiology procedures.
          </p>
        </div>
      </div>

      <Card>
        <Card.Header className="flex justify-between items-center border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Requests List</h2>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="input-field py-1 px-3 w-auto bg-[var(--color-surface-alt)]"
          >
            <option value="ALL">All Requests</option>
            <option value="REQUESTED">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={ImageIcon} title="No Requests Found" description="There are no imaging requests matching this filter." />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {requests.map(req => (
                <li key={req.id} className="p-5 hover:bg-[var(--color-surface-alt)] transition-colors flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-1 shrink-0">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-navy-900)]">{req.procedure?.name || 'Unknown Procedure'}</h3>
                      <p className="text-sm font-semibold text-[var(--color-navy-700)] mt-0.5">
                        Patient: {req.patient?.user?.firstName} {req.patient?.user?.lastName} (ID: {req.patient?.id})
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-lg truncate">
                        Clinical Notes: {req.clinicalNotes || 'None'}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                          Priority: {req.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {req.status !== 'COMPLETED' ? (
                      <button 
                        onClick={() => navigate(`/radiologist/upload?requestId=${req.id}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded transition-colors shadow-sm"
                      >
                        Upload Report
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/radiologist/archive?requestId=${req.id}`)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded transition-colors"
                      >
                        View Report
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

export default RadiologyRequests;
