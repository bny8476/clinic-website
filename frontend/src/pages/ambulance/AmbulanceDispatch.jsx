import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Ambulance } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';



const AmbulanceDispatch = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [dispatchForm, setDispatchForm] = useState({
    ambulanceId: ''
  });

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['ambulance-requests'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/requests');
      return res.data;
    }
  });

  const { data: fleet = [], isLoading: isLoadingFleet } = useQuery({
    queryKey: ['ambulance-fleet'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/fleet');
      return res.data;
    }
  });

  const dispatchAmbulance = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.patch(`/ambulance/requests/${selectedRequest.id}/dispatch?ambulanceId=${dispatchForm.ambulanceId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ambulance dispatched successfully');
      setSelectedRequest(null);
      setDispatchForm({ ambulanceId: '' });
      queryClient.invalidateQueries({ queryKey: ['ambulance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ambulance-fleet'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch ambulance');
    }
  });

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!dispatchForm.ambulanceId) {
      toast.error('Please select an ambulance');
      return;
    }
    dispatchAmbulance.mutate();
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'DISPATCHED');
  const availableAmbulances = fleet.filter(a => a.status === 'AVAILABLE');

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
            <Radio className="w-7 h-7 text-rose-600" />
            Emergency Dispatch
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage incoming emergency requests and dispatch ambulance units.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <Card.Header className="bg-rose-50 border-b border-rose-100">
              <h2 className="text-[13px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                Active Requests ({pendingRequests.length})
              </h2>
            </Card.Header>
            <Card.Body className="p-0 max-h-[600px] overflow-y-auto">
              {isLoadingRequests ? (
                <div className="p-4 text-center text-sm text-slate-500">Loading requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No active emergency requests.</div>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {pendingRequests.map(req => (
                    <li 
                      key={req.id} 
                      className={`p-4 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-rose-50 border-l-4 border-l-rose-600' : 'hover:bg-slate-50'}`}
                      onClick={() => {
                        setSelectedRequest(req);
                        setDispatchForm({ ambulanceId: req.dispatchedAmbulance?.id || '' });
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[var(--color-navy-900)] text-sm">Req #{req.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          req.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                          req.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">{req.pickupLocation}</p>
                      <p className="text-xs text-slate-500 mt-1">Caller: {req.callerName} ({req.callerPhone})</p>
                      <div className="mt-2 text-[10px] font-semibold text-slate-400">
                        {new Date(req.requestTime).toLocaleTimeString()} • {req.status}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!selectedRequest ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <Card.Body className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Radio className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-navy-900)] mb-2">Select a Request</h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
                  Choose a pending emergency request from the list to assign and dispatch an ambulance.
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-navy-900)] flex items-center gap-2">
                      Request #{selectedRequest.id} 
                      {selectedRequest.status === 'DISPATCHED' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold">Dispatched</span>}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">Pickup: {selectedRequest.pickupLocation}</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Caller details</span>
                    <p className="text-sm font-semibold text-slate-800">{selectedRequest.callerName}</p>
                    <p className="text-xs text-slate-600">{selectedRequest.callerPhone}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Emergency Nature</span>
                    <p className="text-sm font-semibold text-slate-800">{selectedRequest.natureOfEmergency}</p>
                    {selectedRequest.patientCondition && <p className="text-xs text-rose-600 mt-1">Condition: {selectedRequest.patientCondition}</p>}
                  </div>
                </div>

                {selectedRequest.status === 'PENDING' ? (
                  <form onSubmit={handleDispatch} className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-[var(--color-navy-900)] mb-3">Assign Ambulance Unit</h3>
                    <FormField label="Available Units" required id="ambulance">
                      <select 
                        id="ambulance"
                        value={dispatchForm.ambulanceId} 
                        onChange={e => setDispatchForm({ ...dispatchForm, ambulanceId: e.target.value })} 
                        className="input-field" 
                        required
                        disabled={isLoadingFleet}
                      >
                        <option value="">Select a unit to dispatch...</option>
                        {availableAmbulances.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.vehicleNumber} ({a.vehicleType}) - {a.driverName || 'No Driver'}
                          </option>
                        ))}
                        {availableAmbulances.length === 0 && <option value="" disabled>No available units!</option>}
                      </select>
                    </FormField>
                    
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" variant="primary" icon={Ambulance} isLoading={dispatchAmbulance.isPending} disabled={availableAmbulances.length === 0}>
                        Dispatch Unit
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="pt-4 border-t border-slate-100 text-center">
                    <div className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-2">
                      <CheckCircle2 size={20} /> Unit Dispatched
                    </div>
                    <p className="text-sm text-slate-600">
                      Ambulance <strong>{selectedRequest.dispatchedAmbulance?.vehicleNumber}</strong> is currently assigned to this request.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
    
  );
};

export default AmbulanceDispatch;
