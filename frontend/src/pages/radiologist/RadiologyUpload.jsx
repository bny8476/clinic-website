import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Save } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';



const RadiologyUpload = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [reportForm, setReportForm] = useState({
    findings: '',
    impression: '',
    recommendations: '',
    isAbnormal: false
  });

  const { data: request, isLoading } = useQuery({
    queryKey: ['radiology-request', requestId],
    queryFn: async () => {
      // The backend doesn't have a direct GET /requests/{id} in the controller we checked, 
      // but assuming GET /radiology/requests returns all, we find it. Or we can use the report endpoint.
      // We will just fetch all requests and find it for simplicity.
      const res = await axiosPrivate.get('/radiology/requests');
      return res.data.find(r => r.id === parseInt(requestId));
    },
    enabled: !!requestId
  });

  const uploadReport = useMutation({
    mutationFn: async () => {
      // The backend endpoint is POST /api/radiology/requests/{requestId}/report
      // Taking RadiologyReport JSON. (No actual file upload in the controller currently, despite the prompt saying "needs multipart/form-data")
      const payload = {
        findings: reportForm.findings,
        impression: reportForm.impression,
        recommendations: reportForm.recommendations,
        isAbnormal: reportForm.isAbnormal
      };
      const res = await axiosPrivate.post(`/radiology/requests/${requestId}/report`, payload);
      
      // Also update status to COMPLETED
      await axiosPrivate.patch(`/radiology/requests/${requestId}/status?status=COMPLETED`);
      
      return res.data;
    },
    onSuccess: () => {
      toast.success('Radiology report saved successfully');
      queryClient.invalidateQueries({ queryKey: ['radiology-requests'] });
      navigate('/radiologist/requests');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save report');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reportForm.findings || !reportForm.impression) {
      toast.error('Findings and Impression are required');
      return;
    }
    uploadReport.mutate();
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading request details...</div>;
  }

  if (!request && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-8">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 text-center">
          <h2 className="text-lg font-bold mb-2">Request Not Found</h2>
          <p>The requested imaging procedure could not be found. Please return to the request list.</p>
          <Button variant="outline" className="mt-4 border-rose-300 text-rose-700" onClick={() => navigate('/radiologist/requests')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/radiologist/requests" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Requests
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <UploadCloud className="w-7 h-7 text-indigo-600" />
            Upload Report
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Submit findings and impressions for the requested imaging procedure.
          </p>
        </div>
      </div>

      <Card className="border-indigo-100">
        <Card.Header className="bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-indigo-900">{request.procedure?.name}</h2>
            <p className="text-xs font-semibold text-indigo-700 mt-0.5">Patient: {request.patient?.user?.firstName} {request.patient?.user?.lastName}</p>
          </div>
          <span className="bg-indigo-200 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Req #{request.id}
          </span>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Mock file upload UI since backend controller doesn't support multipart yet */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-[var(--color-navy-900)] mb-2">
                DICOM / Imaging Files <span className="text-slate-400 font-normal">(Optional Mock Upload)</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                <FileImage className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm font-semibold text-slate-700">Click to browse or drag and drop files here</p>
                <p className="text-xs text-slate-500 mt-1">Supported formats: DCM, JPG, PNG, PDF (Max 50MB)</p>
              </div>
            </div>

            <FormField label="Radiology Findings" required id="findings">
              <textarea 
                id="findings"
                value={reportForm.findings} 
                onChange={e => setReportForm({ ...reportForm, findings: e.target.value })} 
                placeholder="Detailed description of imaging findings..."
                className="input-field min-h-[120px]" 
                required
              />
            </FormField>

            <FormField label="Impression / Diagnosis" required id="impression">
              <textarea 
                id="impression"
                value={reportForm.impression} 
                onChange={e => setReportForm({ ...reportForm, impression: e.target.value })} 
                placeholder="Final impression or diagnosis..."
                className="input-field min-h-[80px]" 
                required
              />
            </FormField>

            <FormField label="Recommendations (Optional)" id="recommendations">
              <textarea 
                id="recommendations"
                value={reportForm.recommendations} 
                onChange={e => setReportForm({ ...reportForm, recommendations: e.target.value })} 
                placeholder="Clinical recommendations based on findings..."
                className="input-field min-h-[60px]" 
              />
            </FormField>

            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="isAbnormal" 
                checked={reportForm.isAbnormal}
                onChange={e => setReportForm({ ...reportForm, isAbnormal: e.target.checked })}
                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <label htmlFor="isAbnormal" className="text-sm font-semibold text-rose-600 cursor-pointer">
                Flag as Abnormal / Critical Finding
              </label>
            </div>

            <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate('/radiologist/requests')} type="button">Cancel</Button>
              <Button type="submit" variant="primary" icon={Save} isLoading={uploadReport.isPending}>
                Save & Complete Report
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default RadiologyUpload;
