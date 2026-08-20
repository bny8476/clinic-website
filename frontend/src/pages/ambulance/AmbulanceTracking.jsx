import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';



const AmbulanceTracking = () => {
  const { data: fleet = [], isLoading } = useQuery({
    queryKey: ['ambulance-fleet'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/fleet');
      return res.data;
    },
    refetchInterval: 15000 // refresh every 15s to mock real-time tracking
  });

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/ambulance" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Map className="w-7 h-7 text-indigo-600" />
            Fleet Tracking
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Monitor real-time status and location of all ambulance units.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50">
          <Card.Body className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Units</p>
              <p className="text-2xl font-bold text-slate-800">{fleet.length}</p>
            </div>
            <Truck className="w-8 h-8 text-slate-300" />
          </Card.Body>
        </Card>
        <Card className="bg-emerald-50">
          <Card.Body className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Available</p>
              <p className="text-2xl font-bold text-emerald-800">{fleet.filter(a => a.status === 'AVAILABLE').length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </Card.Body>
        </Card>
        <Card className="bg-amber-50">
          <Card.Body className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-700 mb-1">Dispatched / En Route</p>
              <p className="text-2xl font-bold text-amber-800">{fleet.filter(a => ['EN_ROUTE', 'AT_SCENE', 'TRANSPORTING'].includes(a.status)).length}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-300" />
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-bold text-[var(--color-navy-900)] flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-500" /> Fleet Status Board
          </h2>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading fleet status...</div>
          ) : fleet.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No ambulances registered in the fleet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Vehicle</th>
                    <th className="p-4 border-b border-slate-200">Crew</th>
                    <th className="p-4 border-b border-slate-200">Status</th>
                    <th className="p-4 border-b border-slate-200">Current Location (GPS)</th>
                    <th className="p-4 border-b border-slate-200 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fleet.map(unit => (
                    <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[var(--color-navy-900)]">{unit.vehicleNumber}</div>
                        <div className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{unit.vehicleType}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">{unit.driverName || 'Unassigned'}</div>
                        <div className="text-xs text-slate-500">{unit.driverPhone}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          unit.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 
                          unit.status === 'MAINTENANCE' || unit.status === 'OUT_OF_SERVICE' ? 'bg-rose-100 text-rose-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {unit.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-600">
                        {unit.currentLatitude && unit.currentLongitude 
                          ? `${Number(unit.currentLatitude).toFixed(5)}, ${Number(unit.currentLongitude).toFixed(5)}`
                          : 'GPS Unavailable'}
                      </td>
                      <td className="p-4 text-right text-xs text-slate-500">
                        {unit.lastLocationUpdate ? new Date(unit.lastLocationUpdate).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex items-start gap-4">
        <Map className="w-8 h-8 text-indigo-500 shrink-0" />
        <div>
          <h3 className="font-bold text-indigo-900 text-sm">Map View Integration</h3>
          <p className="text-xs text-indigo-700 mt-1">Real-time map visualization of fleet coordinates is pending Google Maps API integration. Currently displaying tabular GPS data.</p>
        </div>
      </div>
    </motion.div>
    
  );
};

export default AmbulanceTracking;
