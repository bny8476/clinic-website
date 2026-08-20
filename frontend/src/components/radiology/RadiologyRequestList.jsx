import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch(status) {
      case 'ORDERED': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'SCHEDULED': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'IMAGE_ACQUIRED': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'REPORTING': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'VERIFIED': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'RELEASED': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'DRAFT': return 'bg-gray-50 text-gray-600 border border-gray-100';
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
  const p = (priority || 'ROUTINE').toUpperCase();
  const getStyle = () => {
    if (p === 'STAT' || p === 'URGENT') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStyle()}`}>
      {p}
    </span>
  );
};

const RadiologyRequestList = ({ filter = 'ALL' }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['radiology-requests', filter],
    queryFn: async () => {
      const url = filter === 'ALL' ? '/radiology/requests' : `/radiology/requests?status=${filter}`;
      const res = await axiosPrivate.get(url);
      return res.data;
    },
    refetchInterval: 30000
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.patch(`/radiology/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries(['radiology-requests']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const acquireImageMutation = useMutation({
    mutationFn: async ({ id, modality }) => {
      const res = await axiosPrivate.post(`/radiology/dicom/study/mock?requestId=${id}&modality=${modality}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Mock DICOM study acquired');
      queryClient.invalidateQueries(['radiology-requests']);
    },
    onError: () => toast.error('Failed to acquire mock study')
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full" id="radiology-requests">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-900">
          {filter === 'ALL' ? 'All Requests' : `${filter.replace('_', ' ')} Requests`}
        </h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {requests.length} Total
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No requests found for this status.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {requests.map(req => (
              <li key={req.id} className="p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      {req.patient?.firstName} {req.patient?.lastName}
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {req.patient?.mrn || `ID: ${req.patient?.id}`}
                      </span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {req.procedure?.name} ({req.procedure?.modality})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <PriorityBadge priority={req.priority} />
                    <StatusBadge status={req.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-400 font-medium">
                    Requested: {new Date(req.requestedAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'ORDERED' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'SCHEDULED' })}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Mark Scheduled
                      </button>
                    )}
                    {req.status === 'SCHEDULED' && (
                      <button 
                        onClick={() => acquireImageMutation.mutate({ id: req.id, modality: req.procedure?.modality || 'CR' })}
                        className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-md hover:bg-yellow-100 transition-colors flex items-center gap-1"
                      >
                        Acquire Image
                      </button>
                    )}
                    {req.status === 'IMAGE_ACQUIRED' && (
                      <button 
                        onClick={() => navigate(`/radiologist/reporting/${req.id}`)}
                        className="text-[10px] font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-1"
                      >
                        <Edit size={12} /> Start Report
                      </button>
                    )}
                    {req.status === 'REPORTING' && (
                      <button 
                        onClick={() => navigate(`/radiologist/reporting/${req.id}`)}
                        className="text-[10px] font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-1"
                      >
                        <Edit size={12} /> Resume Report
                      </button>
                    )}
                    {(req.status === 'VERIFIED' || req.status === 'RELEASED') && (
                      <button 
                        onClick={() => navigate(`/radiologist/reporting/${req.id}`)}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} /> View Report
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RadiologyRequestList;
