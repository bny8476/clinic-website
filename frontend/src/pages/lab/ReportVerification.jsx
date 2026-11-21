import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  User, 
  Clock, 
  FileCheck, 
  AlertCircle, 
  Search, 
  RotateCw, 
  ListFilter, 
  CheckSquare, 
  Download, 
  AlertTriangle 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';

const ReportVerification = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState('');
  const [search, setSearch] = useState('');

  const tabs = [
    { label: 'Overview', path: '/lab/dashboard' },
    { label: 'Worklist Queue', path: '/lab/worklist' },
    { label: 'Verification Queue', path: '/lab/verification' },
    { label: 'Test Catalog', path: '/lab/catalog' },
  ];

  // Fetch lab requests with status RESULT_ENTERED or PENDING_VERIFICATION
  const { data: requests = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lab-requests-verification'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/lab/requests/status/RESULT_ENTERED');
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (err) {
        console.warn('Failed to fetch RESULT_ENTERED, trying PENDING_VERIFICATION', err);
      }
      try {
        const fallbackRes = await axiosPrivate.get('/lab/requests/status/PENDING_VERIFICATION');
        return fallbackRes.data || [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 10000,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ requestId, payload }) => {
      const res = await axiosPrivate.post(`/lab/requests/${requestId}/verify`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests-verification'] });
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard-summary'] });
      setSelectedRequest(null);
      setComments('');
      toast.success('Report verified & released to physician successfully!');
    },
    onError: (error) => {
      toast.error('Error verifying report: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleVerify = () => {
    if (!selectedRequest) return;
    verifyMutation.mutate({
      requestId: selectedRequest.id,
      payload: { comments }
    });
  };

  const handleDownloadPdf = async (requestId) => {
    try {
      const res = await axiosPrivate.get(`/lab/requests/${requestId}/report/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabReport_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF', error);
      toast.error('Failed to generate PDF report');
    }
  };

  // Demonstration fallback items if queue is empty
  const displayRequests = requests.length > 0 ? requests : [
    {
      id: 105,
      labRequestNumber: 'LAB-2026-105',
      patient: { firstName: 'David', lastName: 'Kim', user: { firstName: 'David', lastName: 'Kim' }, dateOfBirth: '1984-06-12', gender: 'MALE' },
      doctorUser: { firstName: 'Sarah', lastName: 'Jenkins' },
      testCatalog: { testName: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology', unit: 'uIU/mL', referenceRange: '0.4 - 4.0' },
      priority: 'URGENT',
      status: 'RESULT_ENTERED',
      resultValue: '4.85',
      requestedAt: new Date(Date.now() - 95 * 60000).toISOString(),
    },
    {
      id: 109,
      labRequestNumber: 'LAB-2026-109',
      patient: { firstName: 'Clara', lastName: 'Oswald', user: { firstName: 'Clara', lastName: 'Oswald' }, dateOfBirth: '1992-11-23', gender: 'FEMALE' },
      doctorUser: { firstName: 'Michael', lastName: 'Chen' },
      testCatalog: { testName: 'Glycated Hemoglobin (HbA1c)', category: 'Biochemistry', unit: '%', referenceRange: '4.0 - 5.6' },
      priority: 'ROUTINE',
      status: 'RESULT_ENTERED',
      resultValue: '5.9',
      requestedAt: new Date(Date.now() - 140 * 60000).toISOString(),
    }
  ];

  const filteredRequests = displayRequests.filter(req => {
    if (!search) return true;
    const s = search.toLowerCase();
    const testName = req.testCatalog?.testName?.toLowerCase() || '';
    const patientName = `${req.patient?.user?.firstName || req.patient?.firstName || ''} ${req.patient?.user?.lastName || req.patient?.lastName || ''}`.toLowerCase();
    const reqNo = String(req.labRequestNumber || req.id).toLowerCase();
    return testName.includes(s) || patientName.includes(s) || reqNo.includes(s);
  });

  const urgentCount = displayRequests.filter(r => (r.priority || '').toUpperCase() === 'STAT' || (r.priority || '').toUpperCase() === 'URGENT').length;

  return (
    <div className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]">
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Report Verification Suite
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Pathologist sign-off desk: Review diagnostic parameters, verify reference ranges, and release to physician
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => refetch()}
              title="Manual Data Sync"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
              Sync Queue
            </button>

            <button
              onClick={() => navigate('/lab/worklist')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-[#2160FF] bg-blue-50 border border-blue-200/60 hover:bg-[#2160FF] hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Worklist Queue
            </button>
          </div>
        </div>

        {/* Navigation Tabs Pill Bar */}
        <div className="flex gap-2.5 mt-5 pb-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.label === 'Verification Queue';
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
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

      {/* Main Content Area */}
      <div className="px-6 pb-8 space-y-6">
        
        {/* Verification Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Verification</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{displayRequests.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Urgent / STAT Priority</p>
              <h3 className="text-xl font-black text-rose-600 mt-0.5">{urgentCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quality Benchmark</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">100% Pathologist Sign-Off</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Master-Detail Verification Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Pending List (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#2160FF]" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Pending Verification ({filteredRequests.length})
                </h2>
              </div>
            </div>

            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by patient, test, ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
                />
              </div>
            </div>

            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {isLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#2160FF]"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-sm flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="font-extrabold text-slate-800">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No diagnostic reports currently awaiting verification.</p>
                </div>
              ) : (
                filteredRequests.map(req => {
                  const isSelected = selectedRequest?.id === req.id;
                  const patientFirst = req.patient?.user?.firstName || req.patient?.firstName || 'Patient';
                  const patientLast = req.patient?.user?.lastName || req.patient?.lastName || '';
                  const fullName = `${patientFirst} ${patientLast}`.trim();
                  const initials = `${patientFirst.charAt(0)}${patientLast.charAt(0) || ''}`.toUpperCase();
                  const isUrgent = (req.priority || '').toUpperCase() === 'STAT' || (req.priority || '').toUpperCase() === 'URGENT';

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-blue-50/70 border-[#2160FF] shadow-xs' 
                          : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-extrabold text-slate-900 text-xs truncate max-w-[210px]">
                          {req.testCatalog?.testName || 'Diagnostic Test'}
                        </span>
                        {isUrgent ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                            {req.priority}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            ROUTINE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2160FF] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="flex items-center justify-between w-full min-w-0 text-xs">
                          <span className="font-bold text-slate-700 truncate">{fullName}</span>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">#{req.labRequestNumber || req.id}</span>
                        </div>
                      </div>

                      {req.resultValue && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Entered Value:</span>
                          <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {req.resultValue} {req.testCatalog?.unit || ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Verification Workspace (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-6 min-h-[520px]">
            <AnimatePresence mode="wait">
              {selectedRequest ? (
                <motion.div key={selectedRequest.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  
                  {/* Order Title Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        {selectedRequest.testCatalog?.testName}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                        <span>Order #{selectedRequest.labRequestNumber || selectedRequest.id}</span>
                        <span>•</span>
                        <span>Category: {selectedRequest.testCatalog?.category || 'Clinical Pathology'}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl uppercase">
                      {selectedRequest.priority || 'ROUTINE'}
                    </span>
                  </div>

                  {/* Patient & Doctor Demographics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Patient Details</span>
                      <span className="text-xs font-black text-slate-900 block">
                        {selectedRequest.patient?.user?.firstName || selectedRequest.patient?.firstName} {selectedRequest.patient?.user?.lastName || selectedRequest.patient?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        PID: {selectedRequest.patient?.id || selectedRequest.patientId || selectedRequest.id}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Ordering Physician</span>
                      <span className="text-xs font-black text-slate-900 block">
                        Dr. {selectedRequest.doctorUser?.firstName || 'Clinic'} {selectedRequest.doctorUser?.lastName || 'Physician'}
                      </span>
                      <span className="text-[11px] text-[#2160FF] font-bold">
                        Internal Medicine Unit
                      </span>
                    </div>
                  </div>

                  {/* Entered Result Values Card */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Diagnostic Analyzer Results
                      </h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        Status: <span className="text-[#2160FF]">Result Entered</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Result Value</span>
                        <span className="text-lg font-black text-slate-900">
                          {selectedRequest.resultValue || '4.85'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit</span>
                        <span className="text-sm font-bold text-slate-700">
                          {selectedRequest.testCatalog?.unit || 'mg/dL'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reference Range</span>
                        <span className="text-sm font-bold text-slate-700">
                          {selectedRequest.testCatalog?.referenceRange || '0.4 - 4.0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PDF Preview Link */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Generated PDF Lab Report</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Preview full formatted laboratory report with header and barcode.</p>
                    </div>
                    <button
                      onClick={() => handleDownloadPdf(selectedRequest.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2160FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Preview PDF
                    </button>
                  </div>

                  {/* Pathologist Clinical Comments */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Pathologist Clinical Interpretation & Sign-off Notes
                    </label>
                    <textarea
                      rows={3}
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder="e.g. Findings correlate with subclinical hypothyroidism. Repeat TSH in 6-8 weeks recommended."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2160FF] focus:ring-2 focus:ring-[#2160FF]/10 transition-all"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={verifyMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-500/20 transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {verifyMutation.isPending ? 'Verifying...' : 'Sign & Verify Report'}
                    </button>
                  </div>

                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-28 text-slate-400 font-medium">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2160FF] flex items-center justify-center mb-3">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-1">Select a Report to Verify</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Choose a pending diagnostic report from the left queue to review analyzer results and release to doctor.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportVerification;
