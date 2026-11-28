import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  RotateCw, 
  Upload, 
  CheckCircle, 
  ListFilter, 
  BookOpen, 
  PlusCircle, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LabTopKpis from '../../components/lab/LabTopKpis';
import LabStatusDonut from '../../components/lab/LabStatusDonut';
import LabPriorityDonut from '../../components/lab/LabPriorityDonut';
import LabAlerts from '../../components/lab/LabAlerts';
import LabDailyTrend from '../../components/lab/LabDailyTrend';
import LabTurnaroundTime from '../../components/lab/LabTurnaroundTime';
import LabRecentRequests from '../../components/lab/LabRecentRequests';
import LabRequestDetailsModal from '../../pages/lab/LabRequestDetailsModal';

const LabDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const tabs = [
    { label: 'Overview', path: '/lab/dashboard' },
    { label: 'Worklist Queue', path: '/lab/worklist' },
    { label: 'Results Entry', path: '/lab/worklist' },
    { label: 'Verification Queue', path: '/lab/verification' },
    { label: 'Test Catalog', path: '/lab/catalog' },
  ];

  const { data: summaryResponse, isLoading: summaryLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['lab-dashboard-summary'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/operations/dashboard', {
        params: { branchId: 1 },
      });
      return res.data;
    },
    refetchInterval: 10000,
  });

  const summary = summaryResponse || {
    totalRequests: 0,
    requestsToday: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    verifiedRequests: 0,
    completedRequests: 0,
    urgentRequests: 0,
    rejectedRequests: 0,
    statusCounts: {},
    priorityCounts: {},
    lowStockItems: 0,
  };

  if (summaryLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px] bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2160FF]"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center bg-[#F8FAFC]">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="text-base font-extrabold text-slate-900">Failed to load laboratory metrics</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">Unable to connect to laboratory backend services.</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-[#2160FF] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition cursor-pointer">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]">
      {/* Top Operations Header Bar */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Laboratory Operations Center
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Real-time diagnostic workflow, specimen turnaround metrics & pathologist verification center
            </p>
          </div>

          {/* Quick Operations Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => refetch()}
              title="Manual Data Sync"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
              Sync
            </button>

            <button
              onClick={() => navigate('/doctor/lab-reports/upload')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#2160FF]" />
              Upload External Report
            </button>

            <button
              onClick={() => navigate('/lab/verification')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Verification Queue
            </button>

            <button
              onClick={() => navigate('/lab/worklist')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#2160FF] hover:bg-blue-600 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Worklist Queue
            </button>
          </div>
        </div>

        {/* Navigation Tabs Pill Bar */}
        <div className="flex gap-2.5 mt-5 pb-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveTab(tab.label);
                  if (tab.label !== 'Overview') navigate(tab.path);
                }}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all border shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2160FF] text-white border-[#2160FF] shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dashboard Grid Area */}
      <div className="px-6 pb-8 space-y-6">
        {/* Section 1: KPI Metrics Bar (Full Width Responsive Grid) */}
        <LabTopKpis summary={summary} />

        {/* Section 2: Operational Flow Row (3 Equal-Height Columns, 12-Cols Total) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Column 1: Status Distribution (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <LabStatusDonut summary={summary} />
          </div>

          {/* Column 2: Urgency Priority Matrix (3 cols) */}
          <div className="lg:col-span-3 h-full">
            <LabPriorityDonut summary={summary} />
          </div>

          {/* Column 3: Real-Time Operational Alerts (4 cols) */}
          <div className="lg:col-span-4 h-full">
            <LabAlerts 
              summary={summary} 
              onFilterUrgent={() => {
                setFilter('REQUESTED');
                const el = document.getElementById('recent-requests');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
            />
          </div>
        </div>

        {/* Section 3: Performance & Turnaround Time (2 Balanced Columns, 12-Cols Total) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 7-Day Throughput Trend (6 cols) */}
          <div className="lg:col-span-6 h-full">
            <LabDailyTrend summary={summary} />
          </div>

          {/* Average Turnaround Time SLA (6 cols) */}
          <div className="lg:col-span-6 h-full">
            <LabTurnaroundTime summary={summary} />
          </div>
        </div>

        {/* Section 4: Live Specimen Queue & Recent Lab Requests (Full Width) */}
        <div className="w-full">
          <LabRecentRequests 
            filter={filter} 
            setFilter={setFilter} 
            onViewDetails={setSelectedRequest} 
          />
        </div>
      </div>

      {/* Lab Request Details Modal */}
      <LabRequestDetailsModal
        isOpen={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
};

export default LabDashboard;
