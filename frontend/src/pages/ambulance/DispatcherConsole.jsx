import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const DispatcherConsole = () => {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['ambulance-requests'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/requests');
      return res.data;
    },
    refetchInterval: 5000
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req => 
    req.status === 'PENDING' && 
    (req.callerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     req.natureOfEmergency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     req.id?.toString().includes(searchTerm))
  );

  return (
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h5 className="font-bold text-lg mb-0 text-slate-800">Emergency Triage Queue</h5>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Search incidents..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"><Search size={18} /></button>
            </div>
            
            {isLoading ? (
               <div className="text-center text-slate-500 py-4">Loading queue...</div>
            ) : filteredRequests.length === 0 ? (
               <div className="text-center text-slate-500 py-4">No pending requests</div>
            ) : (
              filteredRequests.map(req => (
                <div key={req.id} className="mb-3 border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-bold text-slate-900">REQ-{req.id}</h6>
                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{req.priority}</span>
                  </div>
                  <p className="mb-1 text-slate-700 text-sm font-semibold flex items-center"><AlertTriangle size={14} className="mr-1 text-red-500" /> {req.natureOfEmergency}</p>
                  <p className="mb-1 text-slate-500 text-xs">Loc: {req.pickupLocation}</p>
                  <p className="mb-3 text-slate-600 text-sm">Caller: {req.callerName}</p>
                  <a href={`/ambulance/dispatch?reqId=${req.id}`} className="block text-center w-full bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Dispatch Unit</a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h5 className="font-bold text-lg mb-0 text-slate-800">Live Fleet Map (SSE Tracking)</h5>
          </div>
          <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
            <MapPin size={48} className="text-blue-500 opacity-50 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg mb-2">GPS Telemetry System</h3>
            <p className="text-slate-500 max-w-md">Live map visualization requires Maps API key. View tabular fleet tracking in the Fleet Management tab or Tracking module.</p>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default DispatcherConsole;
