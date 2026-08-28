import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { ShieldCheck, FileText, CheckCircle2, User, Clock, FileCheck, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ReportVerification = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState('');
  const [search, setSearch] = useState('');

  // Fetch lab requests with status RESULT_ENTERED or PENDING_VERIFICATION
  const { data: requests = [], isLoading, isError, refetch } = useQuery({
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
      const fallbackRes = await axiosPrivate.get('/lab/requests/status/PENDING_VERIFICATION');
      return fallbackRes.data || [];
    },
    refetchInterval: 10000 // Realtime 10-second polling
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ requestId, payload }) => {
      const res = await axiosPrivate.post(`/lab/requests/${requestId}/verify`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests-verification'] });
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      setSelectedRequest(null);
      setComments('');
      toast.success('Report verified and signed successfully!');
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
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabReport_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Failed to download PDF', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const filteredRequests = (requests || []).filter(req => {
    if (!search) return true;
    const s = search.toLowerCase();
    const testName = req.testCatalog?.testName?.toLowerCase() || '';
    const patientName = `${req.patient?.user?.firstName || ''} ${req.patient?.user?.lastName || ''}`.toLowerCase();
    const reqNo = String(req.labRequestNumber || req.id).toLowerCase();
    return testName.includes(s) || patientName.includes(s) || reqNo.includes(s);
  });

  return (
    <div className="min-h-full bg-[#F8FAFC] p-6 lg:p-8 w-full font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#EDF2FF] rounded-2xl flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-[#2160FF]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[26px] font-extrabold text-slate-900 mb-1 tracking-tight">Report Verification</h1>
              <p className="text-[14.5px] text-gray-500 font-medium">Review and sign off entered lab results before final release.</p>
            </div>
          </div>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-[13px] rounded-xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Pending List */}
          <div className="lg:col-span-5 border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#2160FF]" />
                <h2 className="text-sm font-extrabold text-slate-900">Pending Reports ({filteredRequests.length})</h2>
              </div>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter pending reports..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#2160FF] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 p-2">
              {isLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#EDF2FF] border-t-[#2160FF] rounded-full animate-spin"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-sm flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="font-extrabold text-slate-800">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No lab reports currently pending verification.</p>
                </div>
              ) : (
                filteredRequests.map(req => {
                  const isSelected = selectedRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-blue-50/80 border-[#2160FF] shadow-sm' 
                          : 'bg-white hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-extrabold text-slate-900 text-sm truncate max-w-[200px]">
                          {req.testCatalog?.testName || 'Lab Test'}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                          Pending Verification
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {req.patient?.user?.firstName ? `${req.patient.user.firstName} ${req.patient.user.lastName || ''}` : `Patient #${req.patient?.id || 'N/A'}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          #{req.labRequestNumber || req.id}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Verification Action Panel */}
          <div className="lg:col-span-7 border border-slate-200 rounded-3xl bg-white shadow-sm p-6 min-h-[500px]">
            <AnimatePresence mode="wait">
              {selectedRequest ? (
                <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 mb-1">{selectedRequest.testCatalog?.testName}</h2>
                      <p className="text-xs text-slate-500 font-medium">Request Number: #{selectedRequest.labRequestNumber || selectedRequest.id}</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg uppercase">
                      {selectedRequest.priority || 'ROUTINE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Patient Name</span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {selectedRequest.patient?.user?.firstName ? `${selectedRequest.patient.user.firstName} ${selectedRequest.patient.user.lastName || ''}` : `Patient #${selectedRequest.patient?.id}`}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Sample Status</span>
                      <span className="text-sm font-extrabold text-[#2160FF]">
                        {(selectedRequest.status || 'RESULT_ENTERED').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Report Preview */}
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 mb-0.5">PDF Lab Report</h4>
                      <p className="text-xs text-slate-500 font-medium">Download or preview generated PDF report file.</p>
                    </div>
                    <button
                      onClick={() => handleDownloadPdf(selectedRequest.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                    >
                      <FileText className="w-4 h-4" /> Preview PDF
                    </button>
                  </div>

                  {/* Pathologist Comments */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Pathologist / Manager Verification Notes
                    </label>
                    <textarea
                      rows={4}
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder="Add official verification notes or observations..."
                      className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-[#2160FF] focus:ring-4 focus:ring-[#2160FF]/10 transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={verifyMutation.isPending}
                      className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {verifyMutation.isPending ? 'Verifying...' : 'Sign & Verify Report'}
                    </button>
                  </div>

                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-32 text-slate-400 font-medium">
                  <ShieldCheck className="w-16 h-16 text-slate-200 mb-3" />
                  <h3 className="text-lg font-extrabold text-slate-700 mb-1">Select a Report</h3>
                  <p className="text-xs text-slate-400 max-w-sm">Choose a pending lab report from the left column to review entered values and sign off.</p>
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
