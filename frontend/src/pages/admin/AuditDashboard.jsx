import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';



const AuditDashboard = () => {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    patientId: '',
    actorId: '',
    moduleName: '',
    actionName: '',
    outcome: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page,
        size: 20,
      });
      if (filters.patientId) params.append('patientId', filters.patientId);
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.moduleName) params.append('moduleName', filters.moduleName);
      if (filters.actionName) params.append('actionName', filters.actionName);
      if (filters.outcome) params.append('outcome', filters.outcome);

      const res = await axiosPrivate.get(`/audit/search?${params.toString()}`);
      return res.data; // Page<AuditRecord>
    }
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const exportAuditLog = () => {
    toast.success('Exporting audit log for compliance review...');
    // Real implementation would trigger a file download from backend
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-blue-600" />
            Compliance & Audit Logs
          </h1>
          <p className="text-slate-500">Immutable record of all sensitive access and modifications.</p>
        </div>
        <button 
          onClick={exportAuditLog}
          className="bg-slate-800 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-slate-700"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-5 gap-4 border border-slate-200">
        <input 
          type="text" name="patientId" placeholder="Patient ID" 
          value={filters.patientId} onChange={handleFilterChange}
          className="border border-slate-300 rounded px-3 py-2 w-full"
        />
        <input 
          type="text" name="actorId" placeholder="Actor User ID" 
          value={filters.actorId} onChange={handleFilterChange}
          className="border border-slate-300 rounded px-3 py-2 w-full"
        />
        <select 
          name="moduleName" value={filters.moduleName} onChange={handleFilterChange}
          className="border border-slate-300 rounded px-3 py-2 w-full bg-white"
        >
          <option value="">All Modules</option>
          <option value="PATIENT">Patient</option>
          <option value="MEDICAL_RECORD">Medical Record</option>
          <option value="LABORATORY">Laboratory</option>
          <option value="PHARMACY">Pharmacy</option>
          <option value="BILLING">Billing</option>
        </select>
        <input 
          type="text" name="actionName" placeholder="Action (e.g. VIEW)" 
          value={filters.actionName} onChange={handleFilterChange}
          className="border border-slate-300 rounded px-3 py-2 w-full"
        />
        <select 
          name="outcome" value={filters.outcome} onChange={handleFilterChange}
          className="border border-slate-300 rounded px-3 py-2 w-full bg-white"
        >
          <option value="">All Outcomes</option>
          <option value="SUCCESS">Success</option>
          <option value="DENIED">Denied</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded shadow overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Event ID</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Resource</th>
                <th className="p-4 font-semibold">Target (Pat. ID)</th>
                <th className="p-4 font-semibold">Outcome</th>
                <th className="p-4 font-semibold">Sensitivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="8" className="p-4 text-center text-slate-500">Loading audit trail...</td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan="8" className="p-4 text-center text-slate-500">No matching audit events found.</td></tr>
              ) : (
                data?.content?.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-600">
                      {format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {record.eventId.split('-')[0]}...
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{record.actorType}</div>
                      <div className="text-xs text-slate-500">ID: {record.actorId} ({record.actorRole})</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-700">[{record.moduleName}]</span> {record.actionName}
                    </td>
                    <td className="p-4 text-slate-600">
                      {record.resourceType} {record.resourceId ? `#${record.resourceId}` : ''}
                    </td>
                    <td className="p-4 text-slate-600">
                      {record.patientId || '-'}
                    </td>
                    <td className="p-4">
                      {record.outcome === 'SUCCESS' && <span className="flex items-center text-green-600 gap-1 text-xs font-semibold bg-green-50 px-2 py-1 rounded"><CheckCircle size={14}/> SUCCESS</span>}
                      {record.outcome === 'DENIED' && <span className="flex items-center text-orange-600 gap-1 text-xs font-semibold bg-orange-50 px-2 py-1 rounded"><AlertTriangle size={14}/> DENIED</span>}
                      {record.outcome === 'FAILED' && <span className="flex items-center text-red-600 gap-1 text-xs font-semibold bg-red-50 px-2 py-1 rounded"><XCircle size={14}/> FAILED</span>}
                    </td>
                    <td className="p-4">
                      {record.sensitivityLevel === 'HIGH' ? (
                        <span className="text-red-600 font-bold text-xs uppercase bg-red-100 px-2 py-1 rounded">High</span>
                      ) : (
                        <span className="text-slate-500 font-medium text-xs uppercase bg-slate-100 px-2 py-1 rounded">Normal</span>
                      )}
                      {record.breakGlassUsed && (
                        <span className="ml-2 text-white font-bold text-xs uppercase bg-red-600 px-2 py-1 rounded">Break-Glass</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
            <button 
              disabled={page === 0} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 bg-white"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page + 1} of {data.totalPages}
            </span>
            <button 
              disabled={page === data.totalPages - 1} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 bg-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default AuditDashboard;
