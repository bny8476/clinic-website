import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';



const RadiologyReporting = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch the specific request details
  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['radiology-requests'], // We fetch all and find the one to simulate getting a single request since the controller doesn't have a GET /requests/{id}
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/requests');
      return res.data;
    },
    select: (data) => data.find(r => r.id.toString() === requestId)
  });

  // Fetch existing report if any
  const { data: existingReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['radiology-report', requestId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/radiology/requests/${requestId}/report`);
        return res.data;
      } catch (e) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    }
  });

  // Fetch actual DICOM study metadata to link to the report
  const { data: dicomMetadata } = useQuery({
    queryKey: ['radiology-dicom-meta', requestId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/radiology/dicom/study/request/${requestId}`);
        return res.data;
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 403) return null;
        throw e;
      }
    }
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      findings: '',
      impression: '',
      dicomStudyUid: ''
    }
  });

  // Pre-fill if there's an existing draft, otherwise use fetched dicom metadata
  useEffect(() => {
    reset({
      findings: existingReport?.findings || '',
      impression: existingReport?.impression || '',
      dicomStudyUid: existingReport?.dicomStudyUid || dicomMetadata?.studyInstanceUid || ''
    });
  }, [existingReport, dicomMetadata, reset]);

  const saveMutation = useMutation({
    mutationFn: async ({ data, status }) => {
      const payload = {
        ...data,
        status
      };
      const res = await axiosPrivate.post(`/radiology/requests/${requestId}/report`, payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(variables.status === 'FINALIZED' ? 'Report finalized!' : 'Draft saved!');
      queryClient.invalidateQueries(['radiology-report', requestId]);
      queryClient.invalidateQueries(['radiology-requests']);
      
      if (variables.status === 'FINALIZED') {
        navigate('/radiologist/dashboard');
      }
    },
    onError: () => toast.error('Failed to save report')
  });

  const onSubmit = (data, isFinal) => {
    saveMutation.mutate({ data, status: isFinal ? 'FINALIZED' : 'DRAFT' });
  };

  if (isLoadingRequest || isLoadingReport) {
    return <div className="p-8 text-center text-gray-500">Loading reporting interface...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center text-rose-500">Request not found!</div>;
  }

  const isFinalized = existingReport?.status === 'FINALIZED';

  return (
    
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/radiologist/dashboard')}
            className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Radiology Reporting</h1>
            <p className="text-sm text-gray-500">Order #{request.id} • {request.procedure?.name}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/radiologist/viewer?requestId=${request.id}`)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Open Viewer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Context */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <User size={16} className="text-indigo-500" />
              <h3 className="font-bold text-gray-900 text-sm">Patient Context</h3>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Patient Name</p>
                <p className="font-semibold text-gray-900">
                  {request.patient?.firstName} {request.patient?.lastName} 
                  <span className="text-gray-400 font-normal ml-2">({request.patient?.mrn})</span>
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Requested By</p>
                <p className="font-medium text-gray-800">
                  Dr. {request.doctor?.user?.firstName} {request.doctor?.user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Clinical Notes / Indication</p>
                <div className="bg-amber-50 text-amber-900 p-3 rounded-lg text-sm border border-amber-100">
                  {request.clinicalNotes || 'No specific clinical notes provided.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Editor */}
        <div className="lg:col-span-2">
          <form className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Report Editor</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Findings</label>
                <textarea
                  {...register('findings')}
                  rows={8}
                  disabled={isFinalized}
                  className="w-full rounded-lg border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  placeholder="Detailed observations and findings from the scan..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Impression (Conclusion)</label>
                <textarea
                  {...register('impression')}
                  rows={4}
                  disabled={isFinalized}
                  className="w-full rounded-lg border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  placeholder="Summary, diagnosis, or recommendations..."
                />
              </div>
            </div>

            {!isFinalized && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSubmit((d) => onSubmit(d, false))}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                >
                  <Save size={16} /> Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmit((d) => onSubmit(d, true))}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 text-sm flex items-center gap-2"
                >
                  <FileCheck size={16} /> Finalize Report
                </button>
              </div>
            )}
            
            {isFinalized && (
              <div className="p-4 border-t border-emerald-100 bg-emerald-50 text-emerald-800 flex items-center justify-center gap-2 text-sm font-bold">
                <FileCheck size={18} />
                This report has been finalized and digitally signed.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
    
  );
};

export default RadiologyReporting;
