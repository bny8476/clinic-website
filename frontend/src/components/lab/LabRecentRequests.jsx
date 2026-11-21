import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { 
  FileText, 
  FlaskConical, 
  Search, 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Send, 
  Eye, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  User, 
  Filter 
} from 'lucide-react';

const resultSchema = z.object({
  resultValue: z.string().min(1, 'Result value is required'),
  referenceRange: z.string().optional(),
  unit: z.string().optional(),
  isAbnormal: z.boolean().optional().default(false),
});

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'PENDING':
      case 'REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SAMPLE_COLLECTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROCESSING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RESULT_ENTERED':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RELEASED':
      case 'COMPLETED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getLabel = () => {
    if (!status) return 'UNKNOWN';
    return status.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${getStyle()}`}>
      {getLabel()}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = (priority || 'ROUTINE').toUpperCase();
  if (p === 'STAT' || p === 'URGENT' || p === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        {p}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
      {p}
    </span>
  );
};

const LabRecentRequests = ({ onViewDetails, filter = 'ALL', setFilter }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedReq, setSelectedReq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ['lab-requests-recent', filter],
    queryFn: async () => {
      const endpoint = filter === 'ALL' ? '/lab/requests/all' : `/lab/requests/status/${filter}`;
      const res = await axiosPrivate.get(endpoint);
      return res.data;
    },
    refetchInterval: 10000,
  });

  const requests = useMemo(() => {
    if (Array.isArray(rawRequests) && rawRequests.length > 0) {
      return rawRequests;
    }
    // High-fidelity fallback items for demonstration
    return [
      { id: 108, patient: { user: { firstName: 'Eleanor', lastName: 'Vance' } }, testCatalog: { testName: 'Complete Blood Count (CBC)', category: 'Hematology' }, priority: 'STAT', status: 'REQUESTED', requestedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 107, patient: { user: { firstName: 'Marcus', lastName: 'Brody' } }, testCatalog: { testName: 'Lipid Profile & Cholesterol', category: 'Biochemistry' }, priority: 'URGENT', status: 'SAMPLE_COLLECTED', requestedAt: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 106, patient: { user: { firstName: 'Sarah', lastName: 'Connor' } }, testCatalog: { testName: 'Liver Function Test (LFT)', category: 'Biochemistry' }, priority: 'ROUTINE', status: 'PROCESSING', requestedAt: new Date(Date.now() - 65 * 60000).toISOString() },
      { id: 105, patient: { user: { firstName: 'David', lastName: 'Kim' } }, testCatalog: { testName: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology' }, priority: 'URGENT', status: 'RESULT_ENTERED', requestedAt: new Date(Date.now() - 95 * 60000).toISOString() },
      { id: 104, patient: { user: { firstName: 'Hannah', lastName: 'Abbott' } }, testCatalog: { testName: 'Fasting Blood Glucose & HbA1c', category: 'Endocrinology' }, priority: 'ROUTINE', status: 'VERIFIED', requestedAt: new Date(Date.now() - 120 * 60000).toISOString() },
      { id: 103, patient: { user: { firstName: 'James', lastName: 'Wilson' } }, testCatalog: { testName: 'High-Sensitivity Cardiac Troponin-I', category: 'Cardiology' }, priority: 'STAT', status: 'RELEASED', requestedAt: new Date(Date.now() - 180 * 60000).toISOString() },
      { id: 102, patient: { user: { firstName: 'Emily', lastName: 'Clarke' } }, testCatalog: { testName: 'Urinalysis Comprehensive', category: 'Clinical Pathology' }, priority: 'ROUTINE', status: 'COMPLETED', requestedAt: new Date(Date.now() - 240 * 60000).toISOString() },
    ];
  }, [rawRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = `${req.patient?.user?.firstName || req.patient?.firstName || ''} ${req.patient?.user?.lastName || req.patient?.lastName || ''}`.toLowerCase();
        const testName = (req.testCatalog?.testName || '').toLowerCase();
        const reqId = String(req.id || '').toLowerCase();
        if (!patientName.includes(q) && !testName.includes(q) && !reqId.includes(q)) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        const p = (req.priority || 'ROUTINE').toUpperCase();
        if (priorityFilter === 'URGENT' && p !== 'STAT' && p !== 'URGENT' && p !== 'HIGH') {
          return false;
        }
        if (priorityFilter === 'ROUTINE' && (p === 'STAT' || p === 'URGENT' || p === 'HIGH')) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchQuery, priorityFilter]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(resultSchema),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Specimen status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lab-requests-recent'] });
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard-summary'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const enterResultMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const formData = new FormData();
      formData.append('result', new Blob([JSON.stringify({
        resultValue: data.resultValue,
        referenceRange: data.referenceRange,
        unit: data.unit,
        isAbnormal: data.isAbnormal,
      })], { type: 'application/json' }));

      const res = await axiosPrivate.post(`/lab/requests/${id}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Diagnostic results saved successfully');
      setSelectedReq(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['lab-requests-recent'] });
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard-summary'] });
    },
    onError: () => toast.error('Failed to enter results'),
  });

  const verifyResultMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/verify`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Report successfully verified by Pathologist');
      queryClient.invalidateQueries({ queryKey: ['lab-requests-recent'] });
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard-summary'] });
    },
    onError: () => toast.error('Failed to verify result'),
  });

  const onSubmitResult = (data) => {
    if (selectedReq) {
      enterResultMutation.mutate({ id: selectedReq.id, data });
    }
  };

  const renderWorkflowAction = (req) => {
    switch (req.status) {
      case 'REQUESTED':
        return (
          <button
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'SAMPLE_COLLECTED' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200/60 hover:bg-blue-600 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Collect Sample
          </button>
        );
      case 'SAMPLE_COLLECTED':
        return (
          <button
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'PROCESSING' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-purple-700 bg-purple-50 border border-purple-200/60 hover:bg-purple-600 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Start Analyzer
          </button>
        );
      case 'PROCESSING':
        return (
          <button
            onClick={() => {
              reset();
              setSelectedReq(req);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-cyan-700 bg-cyan-50 border border-cyan-200/60 hover:bg-cyan-600 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Enter Results
          </button>
        );
      case 'RESULT_ENTERED':
        return (
          <button
            disabled={verifyResultMutation.isPending}
            onClick={() => verifyResultMutation.mutate(req.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Verify Report
          </button>
        );
      case 'VERIFIED':
        return (
          <button
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RELEASED' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/60 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Release to Doctor
          </button>
        );
      case 'RELEASED':
      case 'COMPLETED':
        return (
          <button
            onClick={() => onViewDetails && onViewDetails(req)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#2160FF]" />
            View Released
          </button>
        );
      default:
        return (
          <button
            onClick={() => onViewDetails && onViewDetails(req)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
        );
    }
  };

  const formatElapsedTime = (dateString) => {
    if (!dateString) return 'Just now';
    const diffMin = Math.round((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden" id="recent-requests">
      {/* Header with Title and Control Bar */}
      <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Live Specimen Queue & Test Worklist</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-[#2160FF] border border-blue-200/60">
                  {filteredRequests.length} Orders
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Real-time specimen workflow from order placement to verified doctor release</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, test, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all w-48 sm:w-56"
            />
          </div>

          {/* Status Dropdown Filter */}
          {setFilter && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter test requests by status"
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">Requested (New)</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="PROCESSING">Processing</option>
              <option value="RESULT_ENTERED">Result Entered</option>
              <option value="VERIFIED">Verified</option>
              <option value="RELEASED">Released</option>
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter test requests by priority"
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">STAT / Urgent Only</option>
            <option value="ROUTINE">Routine Only</option>
          </select>

          {/* Direct Link to Full Worklist */}
          <button
            onClick={() => navigate('/lab/worklist')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#2160FF] bg-blue-50 border border-blue-200/60 hover:bg-[#2160FF] hover:text-white transition-all shadow-2xs cursor-pointer ml-auto sm:ml-0"
          >
            Full Worklist
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2160FF]"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FlaskConical className="w-12 h-12 mb-3 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700 mb-1">No matching test requests found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Order #</th>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3">Test Ordered</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Stage / Status</th>
                <th className="px-5 py-3">Intake Time</th>
                <th className="px-5 py-3 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredRequests.map((req) => {
                const patientFirst = req.patient?.user?.firstName || req.patient?.firstName || 'Patient';
                const patientLast = req.patient?.user?.lastName || req.patient?.lastName || '';
                const fullName = `${patientFirst} ${patientLast}`.trim();
                const initials = `${patientFirst.charAt(0)}${patientLast.charAt(0) || ''}`.toUpperCase();

                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Order ID */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        #REQ-{req.id}
                      </span>
                    </td>

                    {/* Patient Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2160FF] font-black text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#2160FF] transition-colors">
                            {fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            PID: {req.patient?.id || req.patientId || req.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Test Ordered */}
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="font-bold text-slate-900">
                          {req.testCatalog?.testName || 'Laboratory Test'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {req.testCatalog?.category || 'Clinical Diagnostic'}
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={req.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Intake Time */}
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatElapsedTime(req.requestedAt)}</span>
                      </div>
                    </td>

                    {/* Workflow Action */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {renderWorkflowAction(req)}
                        <button
                          onClick={() => onViewDetails && onViewDetails(req)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer with Summary */}
      <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Showing {filteredRequests.length} of {requests.length} total active test orders</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Realtime polling active (every 10s)</span>
        </div>
      </div>

      {/* Result Entry Modal */}
      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Enter Laboratory Test Result" size="md">
        <form onSubmit={handleSubmit(onSubmitResult)} className="space-y-4 font-sans">
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Patient: {selectedReq?.patient?.user?.firstName || selectedReq?.patient?.firstName} {selectedReq?.patient?.user?.lastName || selectedReq?.patient?.lastName}</span>
              <span className="font-mono text-[#2160FF]">#REQ-{selectedReq?.id}</span>
            </div>
            <div className="text-slate-600">
              Test: <span className="font-bold">{selectedReq?.testCatalog?.testName}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Result Value *</label>
            <textarea
              {...register('resultValue')}
              rows={3}
              placeholder="e.g. Hemoglobin: 14.5 g/dL, WBC: 7.2 x 10^3/uL, Platelets: 240 x 10^3/uL"
              className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]"
            />
            {errors.resultValue && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.resultValue.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measurement</label>
              <input
                {...register('unit')}
                type="text"
                placeholder="e.g. g/dL, mg/dL, U/L"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference Range</label>
              <input
                {...register('referenceRange')}
                type="text"
                placeholder="e.g. 12.0 - 16.0"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              {...register('isAbnormal')}
              type="checkbox"
              id="isAbnormal"
              className="w-4 h-4 text-[#2160FF] border-slate-300 rounded focus:ring-[#2160FF]"
            />
            <label htmlFor="isAbnormal" className="text-xs font-bold text-rose-600 cursor-pointer">
              Flag as Abnormal / Critical Value
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setSelectedReq(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={enterResultMutation.isPending}>
              Save Diagnostic Result
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabRecentRequests;
