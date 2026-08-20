import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';



const FleetManagement = () => {
  const { data: fleet = [], isLoading } = useQuery({
    queryKey: ['ambulance-fleet'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/fleet');
      return res.data;
    }
  });

  return (
    
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h5 className="font-bold text-lg mb-0 text-slate-800">Fleet & Personnel Directory</h5>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center"><Plus size={16} className="mr-2"/> Register Vehicle</button>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-4 font-semibold">Vehicle No</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Driver</th>
              <th className="p-4 font-semibold">Last GPS</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">Loading fleet...</td></tr>
            ) : fleet.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">No fleet registered.</td></tr>
            ) : (
              fleet.map(vehicle => (
                <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{vehicle.vehicleNumber}</td>
                  <td className="p-4">{vehicle.vehicleType}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      vehicle.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
                      vehicle.status === 'MAINTENANCE' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{vehicle.driverName || 'Unassigned'} <br/><span className="text-xs text-slate-400">{vehicle.driverPhone}</span></td>
                  <td className="p-4 text-slate-600 text-xs">
                    {vehicle.currentLatitude && vehicle.currentLongitude 
                      ? `${vehicle.currentLatitude.toFixed(4)}, ${vehicle.currentLongitude.toFixed(4)}`
                      : 'Unavailable'}
                  </td>
                  <td className="p-4"><button className="text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors">Manage</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    
  );
};

export default FleetManagement;
