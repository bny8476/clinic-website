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
      


      {/* Tabs */}
      <div className="px-6 mt-6 flex gap-3 shrink-0 mb-4">
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
