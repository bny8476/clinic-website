import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';



const TripHistory = () => {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['ambulance-requests-history'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/requests');
      return res.data;
    }
  });

  // Only show completed or cancelled trips
  const history = requests.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  return (
    
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h5 className="font-bold text-lg mb-0 text-slate-800">Completed Trips & History</h5>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-4 font-semibold">Trip ID</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Ambulance</th>
              <th className="p-4 font-semibold">Outcome</th>
              <th className="p-4 font-semibold">Emergency Nature</th>
              <th className="p-4 font-semibold">Location</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">Loading history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">No completed trips in history.</td></tr>
            ) : (
              history.map(trip => (
                <tr key={trip.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">REQ-{trip.id}</td>
                  <td className="p-4 text-slate-600">{new Date(trip.requestTime).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-blue-600">{trip.dispatchedAmbulance?.vehicleNumber || 'N/A'}</td>
                  <td className="p-4 text-slate-600">Handed Over</td>
                  <td className="p-4 text-slate-600">{trip.natureOfEmergency}</td>
                  <td className="p-4 text-slate-800 font-medium max-w-[200px] truncate">{trip.pickupLocation}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                      trip.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    
  );
};

export default TripHistory;
