import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { User, BedDouble, Stethoscope, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';



const AdmissionWorkflow = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [admissionType, setAdmissionType] = useState('PLANNED');
  const [reason, setReason] = useState('');

  // 1. Search Patient
  const { data: patients, refetch: searchPatients } = useQuery({
    queryKey: ['patients', searchPhone],
    queryFn: async () => {
      if (!searchPhone) return [];
      const res = await axiosPrivate.get(`/patients/search?query=${searchPhone}`);
      return res.data;
    },
    enabled: false
  });

  // 2. Get Doctors
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/doctors');
      return res.data;
    }
  });

  // 3. Get Available Beds
  const { data: availableBeds } = useQuery({
    queryKey: ['beds', 'AVAILABLE'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/inpatient/beds?status=AVAILABLE');
      return res.data;
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    searchPatients();
  };

  const admitMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/inpatient/admissions', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient admitted successfully');
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['admissions']);
      setStep(5); // Success step
    },
    onError: (err) => {
      toast.error('Failed to admit patient: ' + (err.response?.data?.message || err.message));
    }
  });

  const handleSubmit = () => {
    if (!selectedPatient || !selectedDoctor || !selectedBed) {
      toast.error("Please complete all selections.");
      return;
    }
    
    admitMutation.mutate({
      patientId: selectedPatient.id,
      doctorId: selectedDoctor.id,
      bedId: selectedBed.id,
      admissionType,
      reason
    });
  };

  const resetWorkflow = () => {
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setSelectedBed(null);
    setReason('');
    setSearchPhone('');
    setStep(1);
  };

  return (
    
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" />
          Patient Admission
        </h1>
        <p className="text-slate-500 mt-1">Complete the steps below to admit a patient to the ward.</p>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center relative mb-10 px-4">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
        <div className={`absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-300`} style={{ width: `${(step - 1) * 25}%` }}></div>
        
        {[
          { num: 1, label: 'Patient', icon: User },
          { num: 2, label: 'Doctor', icon: Stethoscope },
          { num: 3, label: 'Bed', icon: BedDouble },
          { num: 4, label: 'Details', icon: FileText },
          { num: 5, label: 'Done', icon: CheckCircle }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ${
              step >= s.num ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              <s.icon size={18} />
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? 'text-blue-700' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[400px]">
        {/* Step 1: Patient Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-slate-800">Select Patient</h2>
            
            <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
              <input 
                type="text" 
                placeholder="Search by phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Search size={18} /> Search
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {patients?.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => { setSelectedPatient(p); setStep(2); }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPatient?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{p.firstName} {p.lastName}</h4>
                      <p className="text-sm text-slate-500">{p.phone} • {p.gender}</p>
                    </div>
                  </div>
                </div>
              ))}
              {patients?.length === 0 && (
                <p className="text-slate-500 italic col-span-2">No patients found. Try another search.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Doctor Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">← Back to Patient</button>
              <h2 className="text-xl font-bold text-slate-800 border-l pl-4 border-slate-300">Assign Admitting Doctor</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doctors?.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => { setSelectedDoctor(doc); setStep(3); }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedDoctor?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Stethoscope className="text-blue-600" size={20} />
                    <h4 className="font-bold text-slate-800">Dr. {doc.userId}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{doc.specialty}</p>
                  <p className="text-xs text-slate-400 mt-1">{doc.qualifications}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Bed Selection */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(2)} className="text-sm text-blue-600 hover:underline">← Back to Doctor</button>
              <h2 className="text-xl font-bold text-slate-800 border-l pl-4 border-slate-300">Assign Available Bed</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableBeds?.map(bed => (
                <div 
                  key={bed.id} 
                  onClick={() => { setSelectedBed(bed); setStep(4); }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    selectedBed?.id === bed.id ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <BedDouble className={selectedBed?.id === bed.id ? 'text-green-600' : 'text-slate-400'} size={28} />
                  <div className="text-center">
                    <h4 className="font-bold text-slate-800">Bed {bed.bedNumber}</h4>
                    <p className="text-xs text-slate-500">{bed.room.ward.name}</p>
                    <p className="text-xs text-slate-400">Room {bed.room.roomNumber}</p>
                  </div>
                </div>
              ))}
              {availableBeds?.length === 0 && (
                <div className="col-span-full p-8 text-center bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  No beds are currently available in the system.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Details & Confirm */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(3)} className="text-sm text-blue-600 hover:underline">← Back to Bed</button>
              <h2 className="text-xl font-bold text-slate-800 border-l pl-4 border-slate-300">Admission Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admission Type</label>
                  <select 
                    value={admissionType}
                    onChange={(e) => setAdmissionType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PLANNED">Planned Admission</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="TRANSFER_IN">Transfer In</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Admission</label>
                  <textarea 
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Brief description of symptoms or procedure..."
                  ></textarea>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Summary</h3>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Patient</span>
                  <span className="font-medium text-slate-800">{selectedPatient?.firstName} {selectedPatient?.lastName}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Admitting Doctor</span>
                  <span className="font-medium text-slate-800">Dr. {selectedDoctor?.userId}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium text-slate-800">
                    {selectedBed?.room.ward.name}, Rm {selectedBed?.room.roomNumber}, Bed {selectedBed?.bedNumber}
                  </span>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={admitMutation.isPending}
                  className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {admitMutation.isPending ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Admission Complete</h2>
            <p className="text-slate-500 max-w-md text-center mb-8">
              The patient has been successfully admitted and the bed status has been updated to occupied.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={resetWorkflow}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
              >
                Admit Another
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default AdmissionWorkflow;
