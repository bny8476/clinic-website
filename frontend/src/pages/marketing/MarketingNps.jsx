import { useState } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';



export default function MarketingNps() {
  const qc = useQueryClient();
  const [branchId, setBranchId] = useState('');
  const [searched, setSearched] = useState(null);
  const [page, setPage] = useState(0);
  const [responding, setResponding] = useState(null);
  const [response, setResponse] = useState({ npsScore: '', rating: '', comments: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: surveys } = useQuery({
    queryKey: ['nps-surveys', searched, page],
    queryFn: async () =>
      (await axiosPrivate.get('/marketing/nps/surveys', { params: { branchId: searched, page, size: 20 } })).data,
    enabled: !!searched,
  });

  const { data: metrics } = useQuery({
    queryKey: ['nps-metrics', searched],
    queryFn: async () =>
      (await axiosPrivate.get('/marketing/nps/metrics', { params: { branchId: searched } })).data,
    enabled: !!searched,
  });

  const handleSubmitResponse = async () => {
    if (!responding) return;
    setSubmitting(true);
    try {
      await axiosPrivate.post(`/marketing/nps/surveys/${responding}/respond`, null, {
        params: { npsScore: response.npsScore, rating: response.rating, comments: response.comments, category: 'GENERAL' },
      });
      qc.invalidateQueries({ queryKey: ['nps-surveys', searched, page] });
      qc.invalidateQueries({ queryKey: ['nps-metrics', searched] });
      setResponding(null);
      setResponse({ npsScore: '', rating: '', comments: '' });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (surveyId) => {
    try {
      await axiosPrivate.post(`/marketing/nps/surveys/${surveyId}/resolve`, null, {
        params: { resolvedBy: 1, resolutionNotes: 'Resolved by manager' },
      });
      qc.invalidateQueries({ queryKey: ['nps-surveys', searched, page] });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Resolution failed');
    }
  };

  const surveysContent = surveys?.content || [];

  return (
    
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">NPS & Patient Feedback</h1>

      {/* Branch selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Select Branch</h2>
        <div className="flex gap-2">
          <input type="number" placeholder="Branch ID" value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button onClick={() => { setSearched(branchId); setPage(0); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Load
          </button>
        </div>
      </div>

      {searched && (
        <>
          {/* Metrics summary */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Average NPS Score</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">
                  {metrics.averageNpsScore != null ? metrics.averageNpsScore.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-1">0–10 scale</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Branch</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">#{searched}</p>
              </div>
            </div>
          )}

          {/* Surveys list */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Surveys</h3>
              <span className="text-xs text-gray-400">{surveys?.totalElements ?? 0} total</span>
            </div>
            {surveysContent.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No surveys found</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {surveysContent.map(survey => (
                  <div key={survey.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Survey #{survey.id}</p>
                      <p className="text-xs text-gray-400">Patient #{survey.patientId} · {survey.status}</p>
                      {survey.appointmentId && <p className="text-xs text-gray-400">Appointment #{survey.appointmentId}</p>}
                    </div>
                    <div className="flex gap-2">
                      {survey.status === 'PENDING' || survey.status === 'SENT' ? (
                        <button onClick={() => setResponding(survey.id)}
                          className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">
                          Submit Response
                        </button>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded">Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {surveys?.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-40">← Prev</button>
                <span className="text-xs text-gray-400">Page {page + 1} of {surveys.totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= surveys.totalPages - 1}
                  className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Response modal */}
      {responding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-900 mb-4">Submit NPS Response — Survey #{responding}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">NPS Score (0–10)</label>
                <input type="number" min="0" max="10" value={response.npsScore}
                  onChange={e => setResponse(r => ({ ...r, npsScore: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Rating (1–5)</label>
                <input type="number" min="1" max="5" value={response.rating}
                  onChange={e => setResponse(r => ({ ...r, rating: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Comments</label>
                <textarea value={response.comments}
                  onChange={e => setResponse(r => ({ ...r, comments: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmitResponse} disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
              <button onClick={() => setResponding(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}
