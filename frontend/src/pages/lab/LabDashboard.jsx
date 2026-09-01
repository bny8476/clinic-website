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

const LabDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Requests', 'Results Entry', 'Verification'];
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: summaryResponse, isLoading: summaryLoading } = useQuery({
    queryKey: ['lab-dashboard-summary'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/operations/dashboard', {
        params: { branchId: 1 }
      });
      return res.data;
    },
    refetchInterval: 10000 // Realtime 10-second polling
  });

  const summary = summaryResponse || { totalRequests: 0, statusCounts: {}, priorityCounts: {}, requestsToday: 0 };

  if (summaryLoading) {
    return (
      <div className="flex justify-center items-center h-full bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2160FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]">
      {/* Navigation Tabs */}
      <div className="px-6 mt-6 flex gap-3 shrink-0 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'Requests' || tab === 'Results Entry') navigate('/lab/worklist');
                if (tab === 'Verification') navigate('/lab/verification');
              }}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-[13px] transition-all border ${
                isActive 
                  ? 'bg-[#2160FF] text-white border-[#2160FF] shadow-sm shadow-blue-500/20' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
               <LabDailyTrend summary={summary} />
               <LabTurnaroundTime summary={summary} />
            </div>
          </div>

          {/* Right Column - Sidebar style */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col">
            <div className="flex-shrink-0">
               <LabStatusSidebar summary={summary} />
            </div>
            <div className="flex-shrink-0">
               <LabAlerts summary={summary} />
            </div>
            <div className="flex-1 min-h-[300px]">
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
