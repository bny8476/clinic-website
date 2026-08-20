import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const resultSchema = z.object({
  resultValue: z.string().min(1, 'Result value is required'),
  referenceRange: z.string().optional(),
  unit: z.string().optional(),
  isAbnormal: z.boolean().optional().default(false),
});

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch(status) {
      case 'PENDING':
      case 'REQUESTED': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'SAMPLE_COLLECTED': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'PROCESSING': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'RESULT_ENTERED': return 'bg-cyan-50 text-cyan-600 border border-cyan-100';
      case 'VERIFIED': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'RELEASED': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border border-rose-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${getStyle()}`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  const getStyle = () => {
    if (p === 'HIGH' || p === 'URGENT') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (p === 'LOW') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStyle()}`}>
      {p}
    </span>
  );
};

const LabRecentRequests = ({ onViewDetails, filter = 'ALL', setFilter }) => {
  const queryClient = useQueryClient();
  const [selectedReq, setSelectedReq] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['lab-requests-recent', filter],
    queryFn: async () => {
      const endpoint = filter === 'ALL' ? '/lab/requests/all' : `/lab/requests/status/${filter}`;
      const res = await axiosPrivate.get(endpoint);
      return res.data;
    },
    refetchInterval: 30000
  });

  const recent = requests.slice(0, 5); // Just show top 5

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(resultSchema)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries(['lab-requests-recent']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const enterResultMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const formData = new FormData();
      formData.append('result', new Blob([JSON.stringify({
        resultValue: data.resultValue,
        referenceRange: data.referenceRange,
        unit: data.unit,
        isAbnormal: data.isAbnormal
      })], { type: 'application/json' }));
      
      const res = await axiosPrivate.post(`/lab/requests/${id}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Result entered successfully');
      setSelectedReq(null);
      reset();
      queryClient.invalidateQueries(['lab-requests-recent']);
    },
    onError: () => toast.error('Failed to enter result')
  });

  const verifyResultMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/verify`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Result verified');
      queryClient.invalidateQueries(['lab-requests-recent']);
    },
    onError: () => toast.error('Failed to verify result')
  });

  const onSubmitResult = (data) => {
    if (selectedReq) {
      enterResultMutation.mutate({ id: selectedReq.id, data });
    }
  };

  const renderAction = (req) => {
    switch(req.status) {
      case 'REQUESTED':
        return (
          <button 
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'SAMPLE_COLLECTED' })}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Collect Sample
          </button>
        );
      case 'SAMPLE_COLLECTED':
        return (
          <button 
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'PROCESSING' })}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800"
          >
            Start Processing
          </button>
        );
      case 'PROCESSING':
        return (
          <button 
            onClick={() => { reset(); setSelectedReq(req); }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Enter Results
          </button>
        );
      case 'RESULT_ENTERED':
        return (
          <button 
            disabled={verifyResultMutation.isPending}
            onClick={() => verifyResultMutation.mutate(req.id)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            Verify
          </button>
        );
      case 'VERIFIED':
        return (
          <button 
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RELEASED' })}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Release
          </button>
        );
      default:
        return (
          <button 
            onClick={() => onViewDetails && onViewDetails(req)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full" id="recent-requests">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
        <h2 className="text-sm font-bold text-gray-900">Recent Lab Requests</h2>
        <div className="flex items-center gap-2">
          {setFilter && (
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Requests</option>
              <option value="REQUESTED">Requested</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="PROCESSING">Processing</option>
              <option value="RESULT_ENTERED">Result Entered</option>
              <option value="VERIFIED">Verified</option>
              <option value="RELEASED">Released</option>
            </select>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto min-h-[250px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <FlaskConical className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No requests found</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Patient & Test</th>
                <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{req.patient?.user?.firstName || 'Unknown'} {req.patient?.user?.lastName || ''}</span>
                      <span className="text-[11px] font-medium text-gray-500 truncate max-w-[150px]">
                        {req.testCatalog?.testName || 'Multiple Tests'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <PriorityBadge priority={req.priority} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {renderAction(req)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Enter Lab Result" size="md">
        <form onSubmit={handleSubmit(onSubmitResult)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Result Value *</label>
            <textarea
              {...register('resultValue')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.resultValue && <p className="text-red-500 text-xs mt-1">{errors.resultValue.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                {...register('unit')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Range</label>
              <input
                {...register('referenceRange')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              {...register('isAbnormal')}
              type="checkbox"
              id="isAbnormal"
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isAbnormal" className="text-sm font-medium text-red-600">Flag as Abnormal</label>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-4">
            <Button variant="outline" type="button" onClick={() => setSelectedReq(null)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={enterResultMutation.isPending}>Save Result</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabRecentRequests;
