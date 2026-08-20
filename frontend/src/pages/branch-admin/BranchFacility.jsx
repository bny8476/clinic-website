import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { fadeIn } from '../../components/ui/motion';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';



const BranchFacility = () => {
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const res = await axiosPrivate.get('/branches');
        if (res.data && res.data.length > 0) {
          setBranch(res.data[0]);
        }
      } catch (err) {
        toast.error('Failed to load branch data');
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, []);

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/branch-admin" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Building className="w-7 h-7 text-indigo-600" />
            Facility Management: {loading ? 'Loading...' : (branch ? branch.name : 'Unknown Branch')}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            {branch ? `${branch.address} • Contact: ${branch.contactNumber}` : 'Monitor branch infrastructure, maintenance schedules, and safety compliance.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <Card.Header className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Maintenance Requests</h2>
              <Button variant="secondary" size="sm">Report Issue</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <ul className="divide-y divide-[var(--color-border)]">
                <li className="p-4 hover:bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">HVAC System Repair (Ward 2)</h3>
                      <p className="text-xs text-slate-500 mt-1">Reported by: Staff • 2 days ago</p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">In Progress</span>
                </li>
                <li className="p-4 hover:bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Elevator B Routine Inspection</h3>
                      <p className="text-xs text-slate-500 mt-1">Scheduled: Next Tuesday</p>
                    </div>
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Scheduled</span>
                </li>
              </ul>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Compliance & Safety</h2>
            </Card.Header>
            <Card.Body className="p-8">
              <EmptyState icon={ShieldAlert} title="All Clear" description="No compliance alerts or safety violations reported for this branch." />
            </Card.Body>
          </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Infrastructure Status</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-700">Power Systems</span>
                    <span className="text-emerald-600">Operational</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-700">Water Supply</span>
                    <span className="text-emerald-600">Operational</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-700">Medical Gases</span>
                    <span className="text-emerald-600">Operational</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[95%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-700">IT Network</span>
                    <span className="text-amber-600">Degraded</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[70%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </motion.div>
    
  );
};

export default BranchFacility;
