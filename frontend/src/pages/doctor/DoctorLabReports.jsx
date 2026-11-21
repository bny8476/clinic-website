import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  Activity, 
  Brain, 
  ChevronDown, 
  Download, 
  Droplet, 
  Eye, 
  FlaskConical,
  RefreshCw, 
  Scan, 
  Search, 
  Upload,
  Calendar
} from 'lucide-react';
import LabReportDocument from '../../components/doctor/LabReportDocument';

const DoctorLabReports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Filter States
  const [activeTab, setActiveTab] = useState('All Reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState('ALL');
  const [summaryTimeframe, setSummaryTimeframe] = useState('month'); // 'month' | 'week' | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal / Preview States
  const [selectedReportForPreview, setSelectedReportForPreview] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ─── Query: Live Doctor Lab Requests ───
  const { data: rawRequests, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['doctorLabRequests'],
    queryFn: async () => {
      const response = await axiosPrivate.get('/lab/doctor/my-requests');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    refetchInterval: 10000, // Real-time background sync every 10s
    staleTime: 5000,
  });

  const myRequests = useMemo(() => Array.isArray(rawRequests) ? rawRequests : [], [rawRequests]);

  // Extract unique patients for the filter dropdown
  const uniquePatients = useMemo(() => {
    const map = new Map();
    myRequests.forEach(req => {
      const p = req.patient;
      if (p && p.id) {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || `Patient #${p.id}`;
        map.set(String(p.id), fullName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [myRequests]);

  // ─── Handle Download PDF ───
  const handleDownloadPdf = async (id) => {
    try {
      const response = await axiosPrivate.get(`/lab/requests/${id}/report/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Official_Lab_Report_REQ_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Lab Report PDF downloaded successfully');
    } catch (err) {
      console.error('Failed to download PDF', err);
      toast.error('Failed to download PDF report. It may not be ready or verified yet.');
    }
  };

  // ─── Handle View Report (Eye Button) ───
  const handleViewReport = async (report) => {
    setSelectedReportForPreview(report);
    setLoadingPreview(true);
    try {
      const res = await axiosPrivate.get(`/lab/requests/${report.id}/result`);
      setPreviewResult(res.data || null);
    } catch (err) {
      console.warn('Could not load specific result, using request defaults', err);
      setPreviewResult(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'RELEASED': return 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]';
      case 'VERIFIED': return 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]';
      case 'RESULT_ENTERED': return 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]';
      case 'PROCESSING': return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      case 'SAMPLE_COLLECTED': return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'REQUESTED': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getIconForTest = (testName) => {
    if (!testName) return <Activity size={14} />;
    const name = testName.toLowerCase();
    if (name.includes('blood') || name.includes('cbc') || name.includes('lipid') || name.includes('glucose')) {
      return <Droplet size={14} className="text-red-500" />;
    }
    if (name.includes('x-ray') || name.includes('mri') || name.includes('ultrasound') || name.includes('scan')) {
      return <Scan size={14} className="text-blue-500" />;
    }
    if (name.includes('brain') || name.includes('neuro')) {
      return <Brain size={14} className="text-purple-500" />;
    }
    return <Activity size={14} className="text-orange-500" />;
  };

  // ─── Filtered Table Requests ───
  const filteredRequests = useMemo(() => {
    return myRequests.filter(req => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesPatient = `${req.patient?.firstName || ''} ${req.patient?.lastName || ''}`.toLowerCase().includes(q);
        const matchesTest = (req.testCatalog?.testName || '').toLowerCase().includes(q);
        const matchesId = String(req.id).includes(q);
        if (!matchesPatient && !matchesTest && !matchesId) return false;
      }

      // 2. Status Dropdown Filter
      if (selectedStatus !== 'ALL' && req.status !== selectedStatus) {
        return false;
      }

      // 3. Patient Dropdown Filter
      if (selectedPatient !== 'ALL') {
        const patId = String(req.patient?.id || req.patientId || '');
        if (patId !== selectedPatient) return false;
      }

      // 4. Category Tabs
      if (activeTab === 'All Reports') return true;
      const testName = (req.testCatalog?.testName || '').toLowerCase();
      const isBlood = testName.includes('blood') || testName.includes('cbc') || testName.includes('lipid') || testName.includes('glucose') || testName.includes('hemoglobin');
      const isImaging = testName.includes('x-ray') || testName.includes('mri') || testName.includes('ultrasound') || testName.includes('scan');
      const isPathology = testName.includes('biopsy') || testName.includes('cytology') || testName.includes('smear');
      const isMicrobiology = testName.includes('culture') || testName.includes('urine') || testName.includes('stool') || testName.includes('swab');

      switch(activeTab) {
        case 'Blood Tests': return isBlood;
        case 'Imaging': return isImaging;
        case 'Pathology': return isPathology;
        case 'Microbiology': return isMicrobiology;
        case 'Other Tests': return !isBlood && !isImaging && !isPathology && !isMicrobiology;
        default: return true;
      }
    });
  }, [myRequests, searchQuery, selectedStatus, selectedPatient, activeTab]);

  // ─── Real-time Filtered Requests for Summary & Top Test Types ───
  const summaryRequests = useMemo(() => {
    const now = new Date();
    return myRequests.filter(req => {
      if (summaryTimeframe === 'all') return true;
      const date = req.requestedAt ? new Date(req.requestedAt) : null;
      if (!date || isNaN(date.getTime())) return true;

      if (summaryTimeframe === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (summaryTimeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }
      return true;
    });
  }, [myRequests, summaryTimeframe]);

  // Summary Metrics (Real-time)
  const summaryMetrics = useMemo(() => {
    const total = summaryRequests.length;
    const released = summaryRequests.filter(r => r.status === 'RELEASED').length;
    const verified = summaryRequests.filter(r => r.status === 'VERIFIED').length;
    const pending = summaryRequests.filter(r => !['RELEASED', 'VERIFIED'].includes(r.status)).length;
    return { total, released, verified, pending };
  }, [summaryRequests]);

  // Top Test Types (Real-time with Percentage)
  const topTestTypes = useMemo(() => {
    if (summaryRequests.length === 0) return [];
    const counts = {};
    summaryRequests.forEach(req => {
      const name = req.testCatalog?.testName || 'Unknown Test';
      counts[name] = (counts[name] || 0) + 1;
    });
    const total = summaryRequests.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }));
  }, [summaryRequests]);

  // ─── Functional Pagination ───
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const tabs = ['All Reports', 'Blood Tests', 'Imaging', 'Pathology', 'Microbiology', 'Other Tests'];

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen font-sans">
      <div className="w-full max-w-[1680px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800">Lab Reports & Diagnostics</h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-200/60">
                Live Feed
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              View, preview, and manage verified diagnostic laboratory reports in real time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              title="Refresh Lab Feed"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button 
              onClick={() => navigate('/doctor/lab-reports/upload')}
              className="flex items-center gap-2 bg-[#2160FF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Upload size={16} strokeWidth={2.5} /> Upload Report
            </button>
          </div>
        </div>

        {/* Tabs and Filters Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-1 border-b border-slate-200">
          
          {/* Category Tabs */}
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative cursor-pointer ${
                  activeTab === tab ? 'text-[#2160FF]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2160FF] rounded-t-md"></div>
                )}
              </button>
            ))}
          </div>

          {/* Search and Working Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 pb-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search patient, test or ID..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2160FF] w-[220px] shadow-2xs"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            {/* Status Dropdown Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#2160FF] cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Status</option>
                <option value="RELEASED">Released</option>
                <option value="VERIFIED">Verified</option>
                <option value="RESULT_ENTERED">Result Entered</option>
                <option value="PROCESSING">Processing</option>
                <option value="SAMPLE_COLLECTED">Sample Collected</option>
                <option value="REQUESTED">Requested</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Filters */}
            {(selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-blue-600 hover:underline px-2 py-1"
              >
                Reset Filters
              </button>
            )}

          </div>
        </div>

        {/* All Reports Table (Full Width) */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Report ID</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Patient</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Test / Investigation</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Collection Date</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Order Date</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Lab Facility</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap">Status</th>
                    <th className="py-4 px-6 text-[12px] font-black text-slate-600 whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-400">
                        <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Loading real-time diagnostic reports...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-400">
                        <Scan className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600">No lab reports found matching criteria</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((report) => (
                      <tr key={report.id} className="hover:bg-blue-50/20 transition-colors bg-white group">
                        
                        {/* Report ID */}
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                            REQ-{report.id}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {(report.patient?.firstName?.[0] || 'P')}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                                {report.patient?.firstName} {report.patient?.lastName}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                PID #{report.patient?.id || report.patientId} • {report.patient?.gender || 'Patient'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Test Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-100/80">
                              {getIconForTest(report.testCatalog?.testName)}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-900 leading-tight">
                                {report.testCatalog?.testName || 'Laboratory Test'}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                Code: {report.testCatalog?.testCode || 'LAB-TEST'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Collection Date */}
                        <td className="py-4 px-6">
                          <p className="text-xs font-bold text-slate-700">
                            {report.sampleCollectedAt ? format(new Date(report.sampleCollectedAt), 'dd MMM yyyy') : '-'}
                          </p>
                        </td>

                        {/* Test / Order Date */}
                        <td className="py-4 px-6">
                          <p className="text-xs font-bold text-slate-700">
                            {report.requestedAt ? format(new Date(report.requestedAt), 'dd MMM yyyy') : '-'}
                          </p>
                        </td>

                        {/* Lab Facility */}
                        <td className="py-4 px-6">
                          <p className="text-xs font-bold text-slate-700">Central Pathology Lab</p>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${getStatusBadgeClasses(report.status)}`}>
                            {report.status}
                          </span>
                        </td>

                        {/* Actions: Eye (Preview) & Download */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Working Eye Preview Button */}
                            <button 
                              onClick={() => handleViewReport(report)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                              title="View Professional Report Preview"
                            >
                              <Eye size={15} strokeWidth={2.5} />
                            </button>

                            {/* Download PDF Button */}
                            <button 
                              onClick={() => handleDownloadPdf(report.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                              title="Download Official PDF"
                            >
                              <Download size={15} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-t border-slate-200/80 gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} reports
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === i + 1 
                        ? 'bg-[#2160FF] text-white shadow-xs' 
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>

        {/* ─── Bottom Section: Lab Reports Summary & Top Test Types in One Row ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* 1. Real-time Lab Reports Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Lab Reports Summary</h3>
                    <p className="text-xs text-slate-400 font-medium">Real-time clinical metrics & workload</p>
                  </div>
                </div>

                {/* Timeframe Switcher Dropdown */}
                <div className="relative">
                  <select
                    value={summaryTimeframe}
                    onChange={(e) => setSummaryTimeframe(e.target.value)}
                    className="appearance-none text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 rounded-xl pl-3 pr-8 py-1.5 focus:outline-none cursor-pointer hover:bg-blue-100/60 transition shadow-2xs"
                  >
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                    <option value="all">All Time</option>
                  </select>
                  <ChevronDown size={14} className="text-blue-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
                
                {/* Total */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">
                    {summaryMetrics.total}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">Total Orders</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">All requests</span>
                </div>
                
                {/* Released */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 leading-none">
                      {summaryMetrics.released}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-emerald-100/80 text-emerald-800 rounded">
                      {summaryMetrics.total > 0 ? Math.round((summaryMetrics.released / summaryMetrics.total) * 100) : 0}%
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800">Released</span>
                  <span className="text-[10px] text-emerald-600/80 mt-0.5">Signed & ready</span>
                </div>
                
                {/* Verified */}
                <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl sm:text-3xl font-black text-orange-700 leading-none">
                      {summaryMetrics.verified}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-orange-100/80 text-orange-800 rounded">
                      {summaryMetrics.total > 0 ? Math.round((summaryMetrics.verified / summaryMetrics.total) * 100) : 0}%
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-orange-800">Verified</span>
                  <span className="text-[10px] text-orange-600/80 mt-0.5">Pending release</span>
                </div>
                
                {/* Pending */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl sm:text-3xl font-black text-blue-700 leading-none">
                      {summaryMetrics.pending}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-100/80 text-blue-800 rounded">
                      {summaryMetrics.total > 0 ? Math.round((summaryMetrics.pending / summaryMetrics.total) * 100) : 0}%
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-800">Pending</span>
                  <span className="text-[10px] text-blue-600/80 mt-0.5">In process</span>
                </div>

              </div>
            </div>

            {/* Distribution Legend & Quick Upload shortcut */}
            <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Released
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Verified
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> In Process
                </div>
              </div>

              <button
                onClick={() => navigate('/doctor/lab-reports/upload')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 hover:underline whitespace-nowrap cursor-pointer"
              >
                <Upload size={13} />
                Upload External Report
              </button>
            </div>
          </div>

          {/* 2. Real-time Top Test Types */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FlaskConical size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Top Test Types</h3>
                    <p className="text-xs text-slate-400 font-medium">Diagnostic volume distribution</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 uppercase">
                  {summaryTimeframe === 'month' ? 'This Month' : summaryTimeframe === 'week' ? 'This Week' : 'All Time'}
                </span>
              </div>

              <div className="space-y-3 mt-4">
                {topTestTypes.length > 0 ? (
                  topTestTypes.map((test, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {getIconForTest(test.name)}
                          </div>
                          <span className="font-bold text-slate-800 truncate" title={test.name}>
                            {test.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {test.percentage}%
                          </span>
                          <span className="font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px]">
                            {test.count} {test.count === 1 ? 'test' : 'tests'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Visual progress distribution bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                          style={{ width: `${test.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    No diagnostic tests recorded for this period
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Showing top {topTestTypes.length} test categories</span>
              <span>Updated live in real time</span>
            </div>
          </div>

        </div>

      </div>

      {/* ─── Professional Lab Report Preview Modal ─── */}
      {selectedReportForPreview && (
        <LabReportDocument 
          report={selectedReportForPreview} 
          result={previewResult} 
          onClose={() => {
            setSelectedReportForPreview(null);
            setPreviewResult(null);
          }} 
          onDownloadPdf={handleDownloadPdf}
        />
      )}

    </div>
  );
};

export default DoctorLabReports;
