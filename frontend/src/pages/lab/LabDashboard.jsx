import LabTopKpis from '../../components/lab/LabTopKpis';
import LabStatusDonut from '../../components/lab/LabStatusDonut';
import LabPriorityDonut from '../../components/lab/LabPriorityDonut';
import LabDailyTrend from '../../components/lab/LabDailyTrend';
import LabTurnaroundTime from '../../components/lab/LabTurnaroundTime';
import LabStatusSidebar from '../../components/lab/LabStatusSidebar';
import LabAlerts from '../../components/lab/LabAlerts';
import LabRecentRequests from '../../components/lab/LabRecentRequests';
import LabRequestDetailsModal from '../../pages/lab/LabRequestDetailsModal';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { AlertCircle, CheckSquare, FileText, FlaskConical, History, Microscope, Plus, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

const LabDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Requests', 'Results Entry', 'Verification'];

  const { data: summaryResponse, isLoading: summaryLoading } = useQuery({
    queryKey: ['lab-dashboard-summary'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/operations/dashboard', {
        params: { branchId: 1 }
      });
      return res.data;
    },
    refetchInterval: 30000 
  });

  const summary = summaryResponse || { totalRequests: 0, statusCounts: {}, priorityCounts: {}, requestsToday: 0 };

  const topActions = [
    { label: 'New Request', icon: Plus, action: () => navigate('/doctor/lab-request') },
    { label: 'Collect Sample', icon: FileText, action: () => setFilter('REQUESTED') },
    { label: 'Enter Results', icon: FlaskConical, action: () => setFilter('PROCESSING') },
    { label: 'Verify Reports', icon: CheckSquare, action: () => setFilter('RESULT_ENTERED') },
    { label: 'Print Reports', icon: Printer, action: () => setFilter('VERIFIED') },
    { label: 'Patient History', icon: History, action: () => {} },
    { label: 'Alerts', icon: AlertCircle, action: () => setFilter('REJECTED') },
    { label: 'Catalog', icon: Microscope, action: () => navigate('/lab/catalog') }
  ];

    const [selectedRequest, setSelectedRequest] = useState(null);

  if (summaryLoading) {
    return (
      <div className="flex justify-center items-center h-full bg-[var(--color-bg-app)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-navy-600)]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans overflow-y-auto bg-[var(--color-bg-app)]">
      
      {/* Top Action Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex gap-4 p-6 shrink-0 bg-[var(--color-bg-app)] overflow-x-auto"
      >
        {topActions.map((action, idx) => (
          <motion.button
            key={idx}
            onClick={action.action}
            variants={fadeIn}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="min-w-[120px] flex-1 flex flex-col items-center justify-center gap-3 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-2xl py-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <action.icon size={26} strokeWidth={1.5} />
            </div>
            <span className="font-bold text-[13px] text-slate-700 text-center leading-tight group-hover:text-blue-700 transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="px-6 flex gap-3 shrink-0 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg font-bold text-[14px] transition-colors border ${
                isActive 
                  ? 'bg-[var(--color-navy-800)] text-white border-[var(--color-navy-800)] shadow-sm' 
                  : 'bg-white text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="px-6 pb-6 space-y-6">
        <LabTopKpis summary={summary} />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Charts */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LabStatusDonut summary={summary} />
              <LabPriorityDonut summary={summary} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <LabDailyTrend />
               <LabTurnaroundTime />
            </div>
          </div>

          {/* Right Column - Sidebar style */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col">
            <div className="h-64 flex-shrink-0">
               <LabStatusSidebar summary={summary} />
            </div>
            <div className="h-64 flex-shrink-0">
               <LabAlerts />
            </div>
            <div className="flex-1 min-h-[300px]">
               {/* Small sized table at bottom right */}
               <LabRecentRequests filter={filter} setFilter={setFilter} onViewDetails={setSelectedRequest} />
            </div>
          </div>
        </div>
      </div>
      
      <LabRequestDetailsModal 
        isOpen={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
};

export default LabDashboard;
