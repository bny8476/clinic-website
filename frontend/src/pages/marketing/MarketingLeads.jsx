import { useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';



const STATUS_COLORS = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  QUALIFIED: 'bg-yellow-100 text-yellow-800',
  APPOINTMENT_BOOKED: 'bg-green-100 text-green-800',
  CONVERTED: 'bg-teal-100 text-teal-800',
  NURTURING: 'bg-orange-100 text-orange-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function MarketingLeads() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', null, status, page],
    queryFn: async () =>
      (await axiosPrivate.get('/marketing/leads', { params: { status: status || undefined, page, size: 20 } })).data,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', selected?.id],
    queryFn: async () => (await axiosPrivate.get(`/marketing/leads/${selected.id}/activities`)).data,
    enabled: !!selected?.id,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, newStatus }) =>
      axiosPrivate.put(`/marketing/leads/${id}/status`, null, { params: { status: newStatus, performedBy: 1 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const leads = data?.content || [];
  const STATUSES = ['', 'NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_BOOKED', 'CONVERTED', 'NURTURING', 'LOST'];

  return (
    
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Lead Pipeline</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {STATUSES.map(s => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(0); }}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading leads…</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No leads found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map(lead => (
                    <tr key={lead.id} className={`hover:bg-gray-50 cursor-pointer ${selected?.id === lead.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => setSelected(lead)}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div>{lead.email}</div>
                        <div className="text-xs text-gray-400">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{lead.source}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={e => updateStatus.mutate({ id: lead.id, newStatus: e.target.value })}
                          onClick={e => e.stopPropagation()}
                          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-40">← Prev</button>
              <span className="text-xs text-gray-400">Page {page + 1} of {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}
                className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>

        {/* Activity panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {selected ? (
            <>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{selected.firstName} {selected.lastName}</h3>
              <p className="text-xs text-gray-400 mb-3">{selected.email} · {selected.phone}</p>
              <div className="text-xs font-medium text-gray-500 mb-2">Activity History</div>
              {activities.length === 0 ? (
                <p className="text-xs text-gray-400">No activities yet</p>
              ) : (
                <div className="space-y-2">
                  {activities.map(a => (
                    <div key={a.id} className="border-l-2 border-indigo-200 pl-2">
                      <p className="text-xs font-medium text-gray-700">{a.activityType}</p>
                      <p className="text-xs text-gray-500">{a.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">Select a lead to view activity history</p>
          )}
        </div>
      </div>
    </div>
    
  );
}
