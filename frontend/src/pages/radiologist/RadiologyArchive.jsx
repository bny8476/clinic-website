import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { useSearchParams } from 'react-router-dom';
import { fadeIn } from '../../components/ui/motion';



const RadiologyArchive = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['radiology-request', requestId],
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/requests');
      return res.data.find(r => r.id === parseInt(requestId));
    },
    enabled: !!requestId
  });

  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ['radiology-report', requestId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/radiology/requests/${requestId}/report`);
        return res.data;
      } catch (e) {
        return null; // Return null if not found
      }
    },
    enabled: !!requestId
  });

  const { data: completedRequests = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['radiology-archive'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/requests?status=COMPLETED');
      return res.data;
    },
    enabled: !requestId
  });

  if (!requestId) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link to="/radiologist" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
              <Archive className="w-7 h-7 text-indigo-600" />
              Radiology Archive
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
              View completed imaging procedures and their final reports.
            </p>
          </div>
        </div>
        
        <Card>
          <Card.Header>
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Completed Requests</h2>
          </Card.Header>
          <Card.Body className="p-0">
            {isLoadingAll ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading archive...</div>
            ) : completedRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No completed requests found in archive.</div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {completedRequests.map(req => (
                  <li key={req.id} className="p-4 hover:bg-[var(--color-surface-alt)] flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-[var(--color-navy-900)]">{req.procedure?.name}</h3>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Patient: {req.patient?.user?.firstName} {req.patient?.user?.lastName}</p>
                    </div>
                    <Link to={`/radiologist/archive?requestId=${req.id}`} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded transition-colors">
                      View Report
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </motion.div>
    );
  }

  const isLoading = isLoadingRequest || isLoadingReport;

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/radiologist/archive" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Archive
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Radiology Report
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Final diagnostic report for imaging procedure.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">Loading report details...</div>
      ) : !request ? (
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 text-center">
          Request Not Found
        </div>
      ) : (
        <Card className="border-indigo-100">
          <Card.Header className="bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-indigo-900">{request.procedure?.name}</h2>
              <p className="text-xs font-semibold text-indigo-700 mt-0.5">Patient: {request.patient?.user?.firstName} {request.patient?.user?.lastName}</p>
            </div>
            {report?.isAbnormal && (
              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Abnormal Finding
              </span>
            )}
          </Card.Header>
          <Card.Body className="space-y-6 p-6">
            {!report ? (
              <div className="text-center py-8 text-slate-500 italic">No report has been uploaded for this request yet.</div>
            ) : (
              <>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Findings</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">
                    {report.findings}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Impression / Diagnosis</h3>
                  <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 text-sm whitespace-pre-wrap text-indigo-900 leading-relaxed font-medium">
                    {report.impression}
                  </div>
                </div>

                {report.recommendations && (
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommendations</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">
                      {report.recommendations}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400 font-semibold">
                  <span>Reported By: {report.radiologist?.firstName} {report.radiologist?.lastName}</span>
                  <span>Date: {new Date(report.reportedAt).toLocaleString()}</span>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </motion.div>
    
  );
};

export default RadiologyArchive;
