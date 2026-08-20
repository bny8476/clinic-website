import { fadeIn } from '../../components/ui/motion';
import { motion, AnimatePresence } from 'framer-motion';



const BranchPerformance = () => {
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
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Branch Performance
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Analyze daily patient footfall, revenue, and clinical metrics. (Mocked UI)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-indigo-50 border-indigo-100">
          <Card.Body className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-800">Daily Footfall</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">142</p>
            </div>
          </Card.Body>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-100">
          <Card.Body className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Gross Revenue</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">$12,450</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <Card.Body className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Avg Wait Time</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">14 min</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Monthly Performance Trends</h2>
        </Card.Header>
        <Card.Body className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Analytics Charts Pending</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Performance metrics and detailed reporting charts are currently mocked. Full integration with the analytics engine will be available soon.
            </p>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default BranchPerformance;
