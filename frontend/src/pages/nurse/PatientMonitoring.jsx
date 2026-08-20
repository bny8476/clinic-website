import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';


const PatientMonitoring = () => {
  // Fetch assigned patients first
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['nurse-assigned-patients'],
    queryFn: async () => (await axiosPrivate.get('/nursing/assignments/op')).data,
    refetchInterval: 30000, // Poll assignments every 30s
  });

  // Fetch vitals for all assigned patients
  const patientIds = assignments.map(a => a.patientId);
  const vitalsQueries = useQuery({
    queryKey: ['all-patients-vitals', patientIds],
    queryFn: async () => {
      if (patientIds.length === 0) return {};
      const results = {};
      // Fetch concurrently for all assigned patients
      await Promise.all(patientIds.map(async (id) => {
        try {
          const res = await axiosPrivate.get(`/patients/${id}/vitals/history`);
          results[id] = res.data[0]; // Get the most recent one
        } catch (e) {
          results[id] = null;
        }
      }));
      return results;
    },
    enabled: patientIds.length > 0,
    refetchInterval: 15000, // Poll vitals every 15s
  });

  const latestVitals = vitalsQueries.data || {};

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/nurse" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-600" />
            Live Patient Monitoring
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Real-time vitals monitoring panel for all assigned patients. Auto-updates every 15s.
          </p>
        </div>
        <div className="flex items-center gap-2">
           {vitalsQueries.isFetching && (
             <span className="text-xs font-semibold text-emerald-600 animate-pulse flex items-center gap-1">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </span>
               Updating...
             </span>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingAssignments ? (
          <div className="col-span-full p-8 text-center text-sm text-[var(--color-text-muted)]">Loading patients...</div>
        ) : assignments.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-[var(--color-border)]">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)] font-semibold">No patients currently assigned</p>
          </div>
        ) : (
          assignments.map(patient => {
            const vitals = latestVitals[patient.patientId];
            
            // Check for critical thresholds (dummy logic)
            const isCriticalBp = vitals && (vitals.systolicBp > 160 || vitals.systolicBp < 90 || vitals.diastolicBp > 100 || vitals.diastolicBp < 60);
            const isCriticalHr = vitals && (vitals.heartRate > 120 || vitals.heartRate < 50);
            const isCriticalSpo2 = vitals && (vitals.spo2Percentage < 92);
            const hasAlert = isCriticalBp || isCriticalHr || isCriticalSpo2;

            return (
              <Card key={patient.patientId} className={hasAlert ? 'border-rose-300 shadow-sm shadow-rose-100 ring-1 ring-rose-200' : ''}>
                <Card.Header className={`flex justify-between items-start ${hasAlert ? 'bg-rose-50/50' : 'bg-slate-50/50'}`}>
                  <div>
                    <h2 className="text-[15px] font-bold text-[var(--color-navy-900)] truncate">{patient.patientName}</h2>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      ID: {patient.patientId} • {patient.age ? `${patient.age}y` : ''}
                    </p>
                  </div>
                  {hasAlert && (
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      Alert
                    </span>
                  )}
                </Card.Header>
                <Card.Body className="p-4">
                  {!vitals ? (
                    <div className="text-center py-6 text-sm text-slate-400 font-medium">
                      No vitals recorded recently
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      <div className="flex items-start gap-2">
                        <HeartPulse className={`w-5 h-5 mt-0.5 ${isCriticalBp ? 'text-rose-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Blood Press.</p>
                          <p className={`text-lg font-bold leading-tight ${isCriticalBp ? 'text-rose-600' : 'text-slate-800'}`}>
                            {vitals.systolicBp}/{vitals.diastolicBp}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Activity className={`w-5 h-5 mt-0.5 ${isCriticalHr ? 'text-rose-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</p>
                          <p className={`text-lg font-bold leading-tight ${isCriticalHr ? 'text-rose-600' : 'text-slate-800'}`}>
                            {vitals.heartRate} <span className="text-xs font-semibold text-slate-400">bpm</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Wind className={`w-5 h-5 mt-0.5 ${isCriticalSpo2 ? 'text-rose-500' : 'text-sky-400'}`} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">SpO2</p>
                          <p className={`text-lg font-bold leading-tight ${isCriticalSpo2 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {vitals.spo2Percentage}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Thermometer className="w-5 h-5 mt-0.5 text-amber-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Temp</p>
                          <p className="text-lg font-bold text-slate-800 leading-tight">
                            {vitals.temperatureF}°F
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {vitals && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span>Last updated: {new Date(vitals.recordedAt).toLocaleTimeString()}</span>
                      <Link to={`/nurse/vitals?patientId=${patient.patientId}`} className="text-emerald-600 hover:underline">Update</Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default PatientMonitoring;
