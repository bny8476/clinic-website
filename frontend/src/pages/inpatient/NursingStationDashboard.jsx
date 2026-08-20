import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';



const NursingStationDashboard = () => {
  const [filter, setFilter] = useState('ALL'); // ALL, ADMITTED, DISCHARGED
  const [activeModal, setActiveModal] = useState(null); // 'TRANSFER', 'DISCHARGE'
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: admissions, isLoading } = useQuery({
    queryKey: ['admissions', filter],
    queryFn: async () => {
      let url = '/inpatient/admissions';
      if (filter !== 'ALL') {
        url += `?status=${filter}`;
      }
      const res = await axiosPrivate.get(url);
      return res.data;
    }
  });

  const { data: availableBeds } = useQuery({
    queryKey: ['available-beds'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/inpatient/beds?status=AVAILABLE');
      return res.data;
    },
    enabled: activeModal === 'TRANSFER'
  });

  const transferMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/inpatient/admissions/${selectedAdmission.id}/transfer`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient transferred successfully');
      queryClient.invalidateQueries(['admissions']);
      queryClient.invalidateQueries(['available-beds']);
      closeModal();
    }
  });

  const dischargeMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/inpatient/admissions/${selectedAdmission.id}/discharge`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient discharged successfully');
      queryClient.invalidateQueries(['admissions']);
      closeModal();
    }
  });

  const openModal = (type, admission) => {
    setSelectedAdmission(admission);
    setActiveModal(type);
    setFormData({});
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAdmission(null);
    setFormData({});
  };

  const handleAction = () => {
    if (activeModal === 'TRANSFER') {
      transferMutation.mutate({
        newBedId: formData.newBedId,
        reason: formData.reason
      });
    } else if (activeModal === 'DISCHARGE') {
      dischargeMutation.mutate({
        dischargingDoctorId: formData.dischargingDoctorId,
        summaryData: formData.summaryData || {}
      });
    }
  };

  if (isLoading) {
    return <div className="p-10 flex justify-center text-slate-400">Loading admitted patients...</div>;
  }

  return (
    
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600" />
            Nursing Station
          </h1>
          <p className="text-slate-500 mt-1">Manage admitted patients, vitals, and bed transfers.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['ALL', 'ADMITTED', 'DISCHARGED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === tab 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {!admissions || admissions.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No Patients Found"
          message="There are no admissions matching the current filter."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {admissions.map(admission => (
            <div key={admission.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                    {admission.patient.firstName[0]}{admission.patient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {admission.patient.firstName} {admission.patient.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {admission.patient.gender} • {new Date().getFullYear() - new Date(admission.patient.dateOfBirth).getFullYear()} years
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                        {admission.admissionNumber}
                      </span>
                      <span className={`px-2 py-1 rounded font-medium border ${
                        admission.status === 'ADMITTED' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {admission.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-slate-50 flex-grow grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1 flex items-center gap-1.5"><BedDoubleIcon /> Location</p>
                  <p className="font-medium text-slate-800">{admission.bed?.room?.ward?.name}, Room {admission.bed?.room?.roomNumber}</p>
                  <p className="text-xs text-slate-500">Bed {admission.bed?.bedNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1 flex items-center gap-1.5"><Clock size={14} /> Admitted At</p>
                  <p className="font-medium text-slate-800">{new Date(admission.admittedAt).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">{new Date(admission.admittedAt).toLocaleTimeString()}</p>
                </div>
                <div className="col-span-2 mt-2 pt-4 border-t border-slate-200">
                  <p className="text-slate-500 mb-1">Admission Reason</p>
                  <p className="text-slate-800 font-medium">{admission.admissionReason || 'No reason provided'}</p>
                  <p className="text-xs text-slate-500 mt-1">Admitting Dr. {admission.admittingDoctor?.userId}</p>
                </div>
              </div>

              {admission.status === 'ADMITTED' && (
                <div className="p-4 bg-white border-t border-slate-100 flex gap-2 justify-end">
                  <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1.5">
                    <Activity size={16} /> Vitals
                  </button>
                  <button 
                    onClick={() => openModal('TRANSFER', admission)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRightLeft size={16} /> Transfer
                  </button>
                  <button 
                    onClick={() => openModal('DISCHARGE', admission)}
                    className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                  >
                    <FileOutput size={16} /> Discharge
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {activeModal === 'TRANSFER' && 'Transfer Bed'}
                {activeModal === 'DISCHARGE' && 'Discharge Patient'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[60vh]">
              {activeModal === 'TRANSFER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Bed</label>
                    <select 
                      value={formData.newBedId || ''}
                      onChange={(e) => setFormData({...formData, newBedId: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Bed...</option>
                      {availableBeds?.map(bed => (
                        <option key={bed.id} value={bed.id}>
                          {bed.room?.ward?.name} - Room {bed.room?.roomNumber} - Bed {bed.bedNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transfer Reason</label>
                    <textarea 
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {activeModal === 'DISCHARGE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discharging Doctor ID</label>
                    <input 
                      type="number"
                      value={formData.dischargingDoctorId || ''}
                      onChange={(e) => setFormData({...formData, dischargingDoctorId: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discharge Summary / Notes</label>
                    <textarea 
                      value={formData.summaryData?.notes || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        summaryData: { ...(formData.summaryData || {}), notes: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button 
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={activeModal === 'TRANSFER' ? transferMutation.isPending : dischargeMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {activeModal === 'TRANSFER' && (transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer')}
                {activeModal === 'DISCHARGE' && (dischargeMutation.isPending ? 'Discharging...' : 'Confirm Discharge')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    
  );
};

// Helper inline component
const BedDoubleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
);

export default NursingStationDashboard;
