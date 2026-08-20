import { UserPlus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';



const BranchLocalHR = () => {
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
            <Users className="w-7 h-7 text-indigo-600" />
            Local HR & Staffing
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage branch-level staff schedules, attendance, and local HR tasks. (Mocked UI)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Today's Shift Roster</h2>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">12 Active Staff</span>
          </Card.Header>
          <Card.Body className="p-0">
            <ul className="divide-y divide-[var(--color-border)]">
              <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">Dr</div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-navy-900)]">Dr. Sarah Jenkins</h3>
                    <p className="text-xs text-slate-500">General Physician</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">08:00 AM - 04:00 PM</span>
              </li>
              <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">RN</div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-navy-900)]">Nurse Alex Morgan</h3>
                    <p className="text-xs text-slate-500">Head Nurse</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">07:00 AM - 03:00 PM</span>
              </li>
              <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">Rx</div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-navy-900)]">David Lee</h3>
                    <p className="text-xs text-slate-500">Pharmacist</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">09:00 AM - 05:00 PM</span>
              </li>
            </ul>
          </Card.Body>
        </Card>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Leave Requests</h2>
            </Card.Header>
            <Card.Body className="p-8">
              <EmptyState icon={Clock} title="No Pending Requests" description="All staff leave requests have been processed." />
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Onboarding</h2>
            </Card.Header>
            <Card.Body className="p-8">
              <EmptyState icon={UserPlus} title="No New Staff" description="There are no active onboarding tasks for this branch." />
            </Card.Body>
          </Card>
        </div>
      </div>
    </motion.div>
    
  );
};

export default BranchLocalHR;
