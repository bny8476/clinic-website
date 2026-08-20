import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';



const CrewView = () => {
  const queryClient = useQueryClient();
  const [showClinicalRecord, setShowClinicalRecord] = useState(false);
  const [clinicalForm, setClinicalForm] = useState({
    patientName: '',
    chiefComplaint: '',
    vitalsHeartRate: '',
    vitalsBloodPressure: '',
    interventionsProvided: ''
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['ambulance-requests'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/ambulance/requests');
      return res.data;
    },
    refetchInterval: 5000
  });

  // Filter for requests that are currently assigned and active (not completed)
  const activeDispatch = requests.find(req => 
    req.status === 'DISPATCHED' || req.status === 'EN_ROUTE' || req.status === 'AT_SCENE' || req.status === 'TRANSPORTING'
  );

  const updateStatus = useMutation({
    mutationFn: async (newStatus) => {
      const res = await axiosPrivate.patch(`/ambulance/requests/${activeDispatch.id}/status?status=${newStatus}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['ambulance-requests'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const submitClinicalRecord = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post('/ambulance/clinical/record', {
        requestId: activeDispatch.id,
        ambulanceId: activeDispatch.dispatchedAmbulance?.id,
        ...clinicalForm
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Clinical record saved');
      setShowClinicalRecord(false);
    }
  });

  if (isLoading) {
    return <div className="flex justify-center pt-12"><Loader className="animate-spin text-blue-500" size={32} /></div>;
  }

  if (!activeDispatch) {
    return (
      <div className="flex justify-center items-start pt-8 min-h-[600px]">
        <div className="bg-slate-100 rounded-xl shadow border border-slate-200 p-8 w-full max-w-md text-center">
          <CheckCircle className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="font-bold text-slate-700 text-lg">No Active Dispatch</h3>
          <p className="text-slate-500 mt-2 text-sm">Standby for incoming emergency requests.</p>
        </div>
      </div>
    );
  }

  const getNextAction = (currentStatus) => {
    switch (currentStatus) {
      case 'DISPATCHED': return { label: 'MARK EN ROUTE', status: 'EN_ROUTE', color: 'bg-blue-500 hover:bg-blue-600' };
      case 'EN_ROUTE': return { label: 'MARK AT SCENE', status: 'AT_SCENE', color: 'bg-amber-500 hover:bg-amber-600' };
      case 'AT_SCENE': return { label: 'START TRANSPORT', status: 'TRANSPORTING', color: 'bg-indigo-500 hover:bg-indigo-600' };
      case 'TRANSPORTING': return { label: 'ARRIVED AT HOSPITAL', status: 'COMPLETED', color: 'bg-emerald-500 hover:bg-emerald-600' };
      default: return null;
    }
  };

  const action = getNextAction(activeDispatch.status);

  return (
    
    <div className="flex justify-center items-start pt-8 min-h-[600px]">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full max-w-md">
        <div className={`p-4 text-center text-white ${activeDispatch.priority === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'}`}>
          <h4 className="font-bold text-xl mb-1">ACTIVE DISPATCH: {activeDispatch.status}</h4>
          <p className="text-sm text-white/80 mb-0 font-medium">REQ-{activeDispatch.id} • {activeDispatch.priority}</p>
        </div>
        
        {showClinicalRecord ? (
          <div className="p-6">
            <h5 className="font-bold text-slate-900 mb-4">Pre-Hospital Care Record</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Name (if known)</label>
                <input 
                  type="text" 
                  value={clinicalForm.patientName}
                  onChange={e => setClinicalForm({...clinicalForm, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chief Complaint / Condition</label>
                <textarea 
                  value={clinicalForm.chiefComplaint}
                  onChange={e => setClinicalForm({...clinicalForm, chiefComplaint: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Heart Rate (bpm)</label>
                  <input 
                    type="number" 
                    value={clinicalForm.vitalsHeartRate}
                    onChange={e => setClinicalForm({...clinicalForm, vitalsHeartRate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">BP (e.g. 120/80)</label>
                  <input 
                    type="text" 
                    value={clinicalForm.vitalsBloodPressure}
                    onChange={e => setClinicalForm({...clinicalForm, vitalsBloodPressure: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Interventions Provided</label>
                <textarea 
                  value={clinicalForm.interventionsProvided}
                  onChange={e => setClinicalForm({...clinicalForm, interventionsProvided: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowClinicalRecord(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded">Cancel</button>
              <button 
                onClick={() => submitClinicalRecord.mutate()} 
                disabled={submitClinicalRecord.isPending}
                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded"
              >
                {submitClinicalRecord.isPending ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center mb-6">
              <h5 className="font-bold text-slate-900 text-lg mb-1">{activeDispatch.natureOfEmergency}</h5>
              <p className="text-slate-500 mb-3">{activeDispatch.pickupLocation}</p>
              <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold text-sm">Caller: {activeDispatch.callerName}</span>
            </div>
            
            <div className="flex flex-col gap-3 mb-6">
              <button className="bg-blue-100 text-blue-700 w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center hover:bg-blue-200 transition-colors shadow-sm">
                <Navigation size={22} className="mr-2" /> Start Navigation
              </button>
              <button 
                onClick={() => setShowClinicalRecord(true)}
                className="bg-slate-100 text-slate-700 border border-slate-200 w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center hover:bg-slate-200 transition-colors shadow-sm"
              >
                <FileText size={22} className="mr-2" /> Pre-Hospital Care Record
              </button>
            </div>

            {action && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h6 className="font-bold text-slate-700 mb-3 text-sm uppercase">Next Action Required:</h6>
                <button 
                  onClick={() => updateStatus.mutate(action.status)}
                  disabled={updateStatus.isPending}
                  className={`${action.color} text-white w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center transition-colors shadow-sm`}
                >
                  {updateStatus.isPending ? <Loader className="animate-spin mr-2" size={22} /> : <CheckCircle size={22} className="mr-2" />}
                  {action.label}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    
  );
};

export default CrewView;
