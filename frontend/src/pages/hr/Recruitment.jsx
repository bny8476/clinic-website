import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const Recruitment = () => {
  const [activeTab, setActiveTab] = useState('requisitions'); // requisitions or applications
  const [selectedReq, setSelectedReq] = useState(null);
  const queryClient = useQueryClient();

  // Fetch Requisitions
  const { data: requisitions = [], isLoading: isLoadingReqs } = useQuery({
    queryKey: ['jobRequisitions'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/hr/requisitions/active');
      return res.data;
    }
  });

  return (
    
    <div className="p-6 max-w-7xl mx-auto font-sans text-slate-800">

      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recruitment</h1>
          <p className="text-sm text-slate-500">Manage job requisitions and candidate applications.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm text-sm font-semibold flex items-center gap-2 transition">
          <Briefcase size={16} /> New Requisition
        </button>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'requisitions' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Job Requisitions
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'applications' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Applications pipeline
          </button>
        </div>
      </div>

      {activeTab === 'requisitions' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Job Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Openings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingReqs ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : requisitions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">No active requisitions found.</td></tr>
              ) : (
                requisitions.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{req.jobTitle}</td>
                    <td className="px-4 py-3 text-slate-600">{req.department}</td>
                    <td className="px-4 py-3 text-slate-600">{req.location}</td>
                    <td className="px-4 py-3 text-slate-600">{req.headcount}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">View Candidates</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400">
          <UserPlus size={48} className="mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-slate-600 mb-1">Applications Pipeline</h3>
          <p className="text-sm">Candidate tracking will appear here.</p>
        </div>
      )}

    </div>
    
  );
};

export default Recruitment;
