import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



const InpatientDashboard = () => {
  const queryClient = useQueryClient();
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: beds, isLoading: bedsLoading } = useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/inpatient/beds');
      return res.data;
    }
  });

  const { data: admissions, isLoading: admissionsLoading } = useQuery({
    queryKey: ['activeAdmissions'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/inpatient/admissions?status=ACTIVE');
      return res.data;
    }
  });

  const admitMutation = useMutation({
    mutationFn: async (data) => {
      // Backend expects AdmissionRequest: patientId, doctorId, bedId, admissionType, reason
      const payload = {
        ...data,
        doctorId: 1, // default doctor for demo
        admissionType: 'ROUTINE',
        reason: data.notes
      };
      const res = await axiosPrivate.post('/inpatient/admissions', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['activeAdmissions']);
      setShowAdmitModal(false);
      setPatientId('');
      setNotes('');
    }
  });

  const dischargeMutation = useMutation({
    mutationFn: async (admissionId) => {
      // Backend expects DischargeRequest: dischargingDoctorId, summaryData
      const payload = { dischargingDoctorId: 1, summaryData: "Discharged from UI" };
      const res = await axiosPrivate.post(`/inpatient/admissions/${admissionId}/discharge`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['activeAdmissions']);
    }
  });

  const updateBedStatusMutation = useMutation({
    mutationFn: async ({ bedId, status }) => {
      // Backend doesn't have a direct status update yet, but simulating it.
      // Ideally we need an endpoint in BedManagementController
      const res = await axiosPrivate.patch(`/inpatient/beds/${bedId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['beds']);
    }
  });

  const handleAdmit = (bed) => {
    setSelectedBed(bed);
    setShowAdmitModal(true);
  };

  const getBedColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 border-green-500';
      case 'OCCUPIED': return 'bg-red-100 border-red-500';
      case 'MAINTENANCE': return 'bg-yellow-100 border-yellow-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inpatient Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Bed Status</h2>
          {bedsLoading ? <p>Loading beds...</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {beds?.map(bed => (
                <div key={bed.id} className={`p-4 border-l-4 rounded shadow-sm ${getBedColor(bed.status)}`}>
                  <div className="font-bold">{bed.ward} - {bed.room}</div>
                  <div className="text-sm text-gray-700">Bed: {bed.bedNumber}</div>
                  <div className="mt-2 text-xs font-semibold">{bed.status}</div>
                  
                  {bed.status === 'AVAILABLE' && (
                    <button 
                      onClick={() => handleAdmit(bed)}
                      className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 w-full"
                    >
                      Admit Patient
                    </button>
                  )}
                  {bed.status === 'MAINTENANCE' && (
                    <button 
                      onClick={() => updateBedStatusMutation.mutate({ bedId: bed.id, status: 'AVAILABLE' })}
                      className="mt-2 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 w-full"
                    >
                      Mark Available
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Admissions</h2>
          {admissionsLoading ? <p>Loading admissions...</p> : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admissions?.map(adm => (
                    <tr key={adm.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{adm.patient.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adm.bed.ward} - {adm.bed.bedNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(adm.admissionDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => dischargeMutation.mutate(adm.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Discharge
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admissions?.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No active admissions</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdmitModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Admit Patient to {selectedBed?.ward} - Bed {selectedBed?.bedNumber}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Profile ID</label>
                <input 
                  type="number" 
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowAdmitModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => admitMutation.mutate({ bedId: selectedBed.id, patientId: parseInt(patientId), notes })}
                  disabled={!patientId || admitMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Admit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default InpatientDashboard;
