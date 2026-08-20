import { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { AlertTriangle, Clock,
  Sun, Sunrise
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';



const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Spray', 'Gel', 'Suspension', 'Lotion', 'Suppository'];
const FREQUENCIES = [
    { label: 'Once Daily', value: '1-0-0', icon: Sunrise },
    { label: 'Twice Daily', value: '1-0-1', icon: Sun },
    { label: 'Thrice Daily', value: '1-1-1', icon: Sun },
    { label: 'Every 4 hours', value: 'q4h', icon: Clock },
    { label: 'Every 6 hours', value: 'q6h', icon: Clock },
    { label: 'Every 8 hours', value: 'q8h', icon: Clock },
    { label: 'Every 12 hours', value: 'q12h', icon: Clock },
    { label: 'SOS', value: 'SOS', icon: AlertTriangle },
    { label: 'Stat', value: 'Stat', icon: AlertTriangle }
];
const DURATIONS = [
    { label: '7 Days', value: '7' },
    { label: '15 Days', value: '15' },
    { label: '30 Days', value: '30' },
    { label: '60 Days', value: '60' },
    { label: '90 Days', value: '90' },
];

const NewPrescription = () => {
  const { patientId, prescriptionId: routePrescriptionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // --- State ---
  const [prescriptionId, setPrescriptionId] = useState(routePrescriptionId || null);
  const [prescriptionStatus, setPrescriptionStatus] = useState('NEW');

  useEffect(() => {
    if (routePrescriptionId) {
      axiosPrivate.get(`/prescriptions/${routePrescriptionId}`)
        .then(res => {
          const data = res.data;
          setPrescriptionStatus(data.pharmacyStatus || 'DRAFT');
          setChiefComplaint(data.chiefComplaint || '');
          setDiagnosis(data.diagnosis || '');
          setSymptoms(data.symptoms || '');
          setMedicalHistory(data.medicalHistory || '');
          setNotes(data.notes || '');
          if (data.followUpDate) {
            setFollowUpDate(data.followUpDate.substring(0, 10)); // Extract YYYY-MM-DD
          }
          if (data.items) {
            setItems(data.items.map(i => ({
              id: Date.now() + Math.random(),
              medicineName: i.medicationName,
              type: i.type,
              dosage: i.dosage,
              frequency: i.frequency,
              duration: i.duration,
              timing: i.timing,
              instructions: i.instructions || '',
              strength: i.strength || ''
            })));
          }
        })
        .catch(err => {
          toast.error("Failed to load draft prescription.");
          logger.error(err);
        });
    }
  }, [routePrescriptionId]);

  const [isPreview, setIsPreview] = useState(false);
  const [sentAt, setSentAt] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [items, setItems] = useState([
      {
        medicineId: null,
        medicineName: '',
        type: 'Tablet',
        strength: '',
        dosage: '1',
        frequency: '1-0-1',
        durationDays: '7',
        timing: 'After Food',
        instructions: '',
      }
  ]);
  
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [notes, setNotes] = useState('');
  
  const todayDate = new Date().toISOString().split('T')[0];
  const [visitDate, setVisitDate] = useState(todayDate);
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedLabs, setSelectedLabs] = useState([]); 
  
  const [showOrderSetPicker, setShowOrderSetPicker] = useState(false);
  const [interactionAlerts, setInteractionAlerts] = useState([]);
  const [errors, setErrors] = useState({});

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCdsModalOpen, setIsCdsModalOpen] = useState(false);
  const [cdsBlockedAlerts, setCdsBlockedAlerts] = useState([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [editProfile, setEditProfile] = useState({ 
    bloodGroup: '', 
    allergies: '',
    heightCm: '',
    weightKg: '',
    bloodPressure: '',
    pulseBpm: ''
  });

  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [selectedPharmacyUserId, setSelectedPharmacyUserId] = useState('');

  const isReadOnly = isPreview || prescriptionStatus === 'SENT' || prescriptionStatus === 'VOIDED';

  // --- Data Fetching ---
  const { data: profile, isError: profileError, error: profileErrorMsg } = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => {
        const res = await axiosPrivate.get(`/doctor/patients/${patientId}`);
        return res.data;
    },
    enabled: !!patientId
  });

  const { data: pharmacyUsers = [] } = useQuery({
    queryKey: ['pharmacyUsers'],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/prescriptions/pharmacy-recipients`);
      return res.data.data || [];
    }
  });

  const { data: doctorDetails } = useQuery({
    queryKey: ['doctorDetails', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/doctors/${user.id}/full-profile`);
      return res.data;
    },
    enabled: !!user?.id
  });

  const { data: vitalsLatest } = useQuery({
    queryKey: ['vitals-latest', patientId],
    queryFn: async () => {
        try {
            return (await axiosPrivate.get(`/patients/${patientId}/vitals/latest`)).data;
        } catch(e) {
            return null;
        }
    },
    enabled: !!patientId
  });



  const { data: labCatalog = [] } = useQuery({
    queryKey: ['lab-catalog'],
    queryFn: async () => {
        try {
            return (await axiosPrivate.get(`/lab/catalog`)).data;
        } catch(e) {
            return [];
        }
    }
  });

  const { data: previousPrescriptions = [] } = useQuery({
    queryKey: ['patientPrescriptions', patientId],
    queryFn: async () => {
        try {
            return (await axiosPrivate.get(`/prescriptions/patient/${patientId}`)).data;
        } catch(e) {
            return [];
        }
    },
    enabled: !!patientId
  });

  
  useEffect(() => {
    if (profile?.medicalHistorySummary && !medicalHistory) {
      setMedicalHistory(profile.medicalHistorySummary);
    }
  }, [profile, medicalHistory]);

  const openEditModal = () => {
    let parsedAllergies = '';
    try {
        if (profile?.allergies) {
            const arr = JSON.parse(profile.allergies);
            parsedAllergies = Array.isArray(arr) ? arr.join(', ') : profile.allergies;
        }
    } catch(e) {
        parsedAllergies = profile?.allergies || '';
    }

    setEditProfile({
        bloodGroup: profile?.bloodGroup || '',
        allergies: parsedAllergies,
        heightCm: vitalsLatest?.heightCm || '',
        weightKg: vitalsLatest?.weightKg || '',
        bloodPressure: vitalsLatest?.bloodPressure || '',
        pulseBpm: vitalsLatest?.pulseBpm || ''
    });
    setIsEditModalOpen(true);
  };

  const editProfileMutation = useMutation({
    mutationFn: async (data) => axiosPrivate.put(`/patients/${patientId}`, data),
    onSuccess: () => {
        toast.success("Patient details updated");
        setIsEditModalOpen(false);
        queryClient.invalidateQueries(['patient-profile', patientId]);
    },
    onError: () => toast.error("Failed to update patient details")
  });

  const saveVitalsMutation = useMutation({
    mutationFn: async (data) => axiosPrivate.post(`/patients/${patientId}/vitals/record`, data),
    onSuccess: () => {
        queryClient.invalidateQueries(['vitals-latest', patientId]);
        queryClient.invalidateQueries(['vitals-history', patientId]);
    }
  });

  const handleSaveEdit = async () => {
    const dataToSend = {
        bloodGroup: editProfile.bloodGroup,
        allergies: JSON.stringify(editProfile.allergies.split(',').map(a => a.trim()).filter(Boolean))
    };
    const vitalsToSend = {
        heightCm: editProfile.heightCm ? parseInt(editProfile.heightCm) : null,
        weightKg: editProfile.weightKg ? parseInt(editProfile.weightKg) : null,
        bloodPressure: editProfile.bloodPressure,
        pulseBpm: editProfile.pulseBpm ? parseInt(editProfile.pulseBpm) : null
    };

    try {
        await editProfileMutation.mutateAsync(dataToSend);
        if (vitalsToSend.heightCm || vitalsToSend.weightKg || vitalsToSend.bloodPressure || vitalsToSend.pulseBpm) {
            await saveVitalsMutation.mutateAsync(vitalsToSend);
        }
        setIsEditModalOpen(false);
        toast.success("Patient details and vitals updated");
    } catch (e) {
        toast.error("Failed to update patient details");
    }
  };

  const { data: medicines = [], isFetching: isSearching } = useQuery({
    queryKey: ['pharmacy-medicines-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      try {
        return (await axiosPrivate.get(`/pharmacy/medicines/search?name=${encodeURIComponent(debouncedSearch)}`)).data;
      } catch(e) {
          return [];
      }
    },
    enabled: debouncedSearch.length >= 1,
  });

  const { data: externalMedicines = [], isFetching: isSearchingExternal } = useQuery({
    queryKey: ['external-medicines-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      try {
        return (await axiosPrivate.get(`/doctor/medicines/external-search?name=${encodeURIComponent(debouncedSearch)}`)).data;
      } catch(e) {
          return [];
      }
    },
    enabled: debouncedSearch.length >= 1,
  });

  useEffect(() => {
    const checkInteractions = async () => {
      if (items.length === 0 || !items[0].medicineName) {
        setInteractionAlerts([]);
        return;
      }
      const medicationNames = items.map(i => i.medicineName).filter(Boolean);
      if(medicationNames.length === 0) return;
      try {
        const res = await axiosPrivate.post('/prescriptions/safety-check', { patientId, medicationNames });
        setInteractionAlerts(res.data.safe ? [] : res.data.messages);
      } catch (err) {}
    };
    const timer = setTimeout(checkInteractions, 1000);
    return () => clearTimeout(timer);
  }, [items, patientId]);

  const addItem = (med = null) => {
    if (isReadOnly) return;
    setItems(prev => [
      ...prev,
      {
        medicineId: med?.id || null,
        medicineName: med ? (med.name || med.medicineName || med) : '',
        type: med?.category || 'Tablet',
        strength: med?.strength || med?.packSize || '10 mg',
        dosage: '1',
        frequency: '1-0-1',
        durationDays: '30',
        timing: 'After Food',
        instructions: '',
      }
    ]);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const removeItem = (index) => {
    if (isReadOnly) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, val) => {
    if (isReadOnly) return;
    setItems(prev => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const validate = () => {
      const newErrors = {};
      const validItems = items.filter(i => i.medicineName);
      if(validItems.length === 0) newErrors.general = "At least one medicine is required.";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    patientId,
    chiefComplaint,
    diagnosis,
    symptoms,
    medicalHistory,
    notes,
    followUpDate: followUpDate ? followUpDate + 'T00:00:00' : null,
    labTestCatalogIds: selectedLabs,
    items: items.filter(i => i.medicineName).map(i => ({
      medicationName: i.medicineName,
      type: i.type,
      strength: String(i.strength),
      dosage: String(i.dosage),
      frequency: i.frequency,
      duration: String(i.durationDays),
      timing: i.timing,
      instructions: i.instructions
    }))
  });

  const handleMutationError = (error) => {
    if (error.response?.status === 422 && error.response.data?.error === 'CRITICAL_SAFETY_VIOLATION') {
      setCdsBlockedAlerts(error.response.data.alerts || [error.response.data.message]);
      setIsCdsModalOpen(true);
    } else {
      toast.error(error.response?.data?.message || 'An error occurred.');
    }
  };

  const sendToPharmacyMutation = useMutation({
    mutationFn: async (pharmacyUserId) => {
      const payload = pharmacyUserId ? { pharmacyUserId: parseInt(pharmacyUserId) } : {};
      if (!prescriptionId) {
        const res = await axiosPrivate.post(`/prescriptions`, buildPayload());
        return axiosPrivate.post(`/prescriptions/${res.data.id}/send`, payload);
      }
      return axiosPrivate.post(`/prescriptions/${prescriptionId}/send`, payload);
    },
    onSuccess: (res) => {
      setPrescriptionStatus('PENDING'); // Sent to pharmacy sets status to PENDING
      queryClient.invalidateQueries(['patientPrescriptions', patientId]);
      toast.success('Prescription sent to pharmacy successfully');
      setIsPharmacyModalOpen(false);
    },
    onError: handleMutationError
  });
  const saveDraftMutation = useMutation({
    mutationFn: async () => axiosPrivate.post(`/prescriptions/draft`, buildPayload()),
    onSuccess: (res) => {
      setPrescriptionId(res.data.id);
      setPrescriptionStatus('DRAFT');
      queryClient.invalidateQueries(['patientPrescriptions', patientId]);
      toast.success('Draft saved successfully');
    },
    onError: handleMutationError
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!prescriptionId) {
        const res = await axiosPrivate.post(`/prescriptions`, buildPayload());
        return res;
      }
      return axiosPrivate.post(`/prescriptions/${prescriptionId}/send`);
    },
    onSuccess: (res) => {
      setPrescriptionId(res.data.id);
      setPrescriptionStatus('SENT');
      setSentAt(new Date());
      setIsPreview(true);
      queryClient.invalidateQueries(['patientPrescriptions', patientId]);
      toast.success('Prescription sent successfully');
    },
    onError: handleMutationError
  });

  const aiInsightMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        patientId: parseInt(patientId),
        items: items.filter(i => i.medicineName).map(i => i.medicineName)
      };
      return axiosPrivate.post(`/cds/rules/insights`, payload);
    },
    onSuccess: (res) => {
      setAiInsight(res.data.data);
      setIsAiModalOpen(true);
    },
    onError: (err) => toast.error("Failed to fetch AI Insights.")
  });

  const handleAiCheck = () => {
      if(!validate()) { toast.error("Please add medicines."); return; }
      aiInsightMutation.mutate();
  };

  const handlePrint = () => { window.print(); };
  const handleSend = () => {
      if (profileError || !profile) { toast.error("Cannot proceed: Patient data failed to load."); return; }
      if(!validate()) { toast.error("Please add medicines."); return; }
      sendMutation.mutate();
  };

  const handleSendToPharmacy = () => {
      if (profileError || !profile) { toast.error("Cannot proceed: Patient data failed to load."); return; }
      if(!validate()) { toast.error("Please add medicines."); return; }
      setIsPharmacyModalOpen(true);
  };

  const confirmSendToPharmacy = () => {
      sendToPharmacyMutation.mutate(selectedPharmacyUserId);
  };

  const getAge = (dob) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return new Date(diff).getUTCFullYear() - 1970;
  };

  // ── Real vitals history from backend ──────────────────────────────────────
  const { data: vitalsHistory = [], isLoading: vitalsLoading } = useQuery({
    queryKey: ['vitals-history', patientId],
    queryFn: async () => (await axiosPrivate.get(`/patients/${patientId}/vitals/history`)).data,
    enabled: !!patientId,
    staleTime: 60_000,
  });

  // Transform vitals records into chart-friendly format (sys/dia parsed from "120/80")
  const bpData = vitalsHistory
    .filter(v => v.bloodPressure)
    .map(v => {
      const parts = v.bloodPressure.split('/');
      return {
        date: new Date(v.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sys: parts[0] ? Number(parts[0]) : null,
        dia: parts[1] ? Number(parts[1]) : null,
      };
    })
    .filter(d => d.sys !== null)
    .slice(-10);  // show last 10 readings

  if (isPreview) {
    const documentData = {
      clinicName: doctorDetails?.clinicName || '',
      clinicAddress: doctorDetails?.clinicAddress || '',
      clinicPhone: doctorDetails?.clinicPhone || '',
      clinicEmail: doctorDetails?.clinicEmail || '',
      doctorName: doctorDetails?.doctorName ? 'Dr. ' + doctorDetails.doctorName : 'Dr. Unknown',
      doctorSpecialty: doctorDetails?.specialty || 'General Practitioner',
      doctorQualifications: doctorDetails?.qualifications || '',
      registrationNumber: doctorDetails?.registrationNumber || '',
      patientName: profile?.patientName || profile?.name,
      patientAge: profile?.age || getAge(profile?.dateOfBirth),
      patientGender: profile?.gender,
      patientId: patientId,
      chiefComplaint,
      diagnosis,
      items: items.filter(i => i.medicineName).map(i => ({
        ...i,
        medicationName: i.medicineName
      })),
      followUpDate
    };

    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-4 flex justify-between items-center print:hidden">
          <button 
            onClick={() => setIsPreview(false)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Edit
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Printer className="w-4 h-4" /> Print Prescription
          </button>
        </div>
        <PrescriptionDocument data={documentData} />
      </div>
    );
  }

  return (
    
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans p-6 pb-28 max-w-[1500px] mx-auto text-[#1E293B]">
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="mb-4">
            <Link to={`/doctor/patients/${patientId}`} className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back to Patient Details
            </Link>
        </div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2">
            New Prescription
            <CheckCircle className="text-emerald-500 w-5 h-5 fill-emerald-50" />
        </h1>
        <p className="text-slate-500 text-sm">Create and send prescription to patient and pharmacy</p>
      </div>

      
      {profileError && (
        <div 
          id="patient-load-error"
          role="alert"
          aria-live="assertive"
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
        >
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500 w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-semibold text-red-700">Unable to load patient data. Please ensure the patient ID is valid or try again.</span>
            </div>
            <button onClick={() => window.location.reload()} className="px-4 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-xs font-bold hover:bg-red-50">Retry</button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          
          {/* Patient Card - Exact layout match */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-8 w-full">
                {/* Left side: Avatar and Basic Info */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                        <img loading="lazy" src={`https://ui-avatars.com/api/?name=${profile?.name}&background=cbd5e1&color=334155`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[17px] font-bold text-slate-900 m-0 leading-none">
                                {profile?.gender === 'Male' ? 'Mr. ' : profile?.gender === 'Female' ? 'Ms. ' : ''}{profile?.name}
                            </h2>
                            {profile?.gender && <span className={profile.gender === 'Male' ? "text-blue-500 font-bold text-sm" : "text-pink-500 font-bold text-sm"}>{profile.gender === 'Male' ? '♂' : '♀'}</span>}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 flex gap-4 mt-0.5">
                            <span className="text-blue-600 font-bold">PID: <span className="font-normal text-blue-500">#{patientId}</span></span>
                            <span>Age: {profile?.age ?? 'N/A'} Years</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Right side: Vitals Row */}
                <div className="flex gap-8 flex-wrap flex-1 items-center justify-end pr-4">
                    {!isReadOnly && (
                        <button onClick={openEditModal} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                    )}
                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500">Blood Group</span>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">{profile?.bloodGroup || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500">Allergies</span>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100">
                            {(() => {
                                try {
                                    const arr = JSON.parse(profile?.allergies || '[]');
                                    return arr.length > 0 ? arr.join(', ') : 'None';
                                } catch(e) {
                                    return profile?.allergies || 'None';
                                }
                            })()}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <ArrowLeft className="w-3 h-3 text-blue-400 rotate-90" /> Height
                        </span>
                        <span className="text-xs font-bold text-slate-700">{vitalsLatest?.heightCm ? `${vitalsLatest.heightCm} cm` : 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" /> Weight
                        </span>
                        <span className="text-xs font-bold text-slate-700">{vitalsLatest?.weightKg ? `${vitalsLatest.weightKg} kg` : 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-100" /> BP
                        </span>
                        <span className="text-xs font-bold text-slate-700">{vitalsLatest?.bloodPressure ? `${vitalsLatest.bloodPressure} mmHg` : 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 text-emerald-600">
                            <Activity className="w-3 h-3" /> Pulse
                        </span>
                        <span className="text-xs font-bold text-slate-700">{vitalsLatest?.pulseBpm ? `${vitalsLatest.pulseBpm} bpm` : 'N/A'}</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Diagnosis & Visit Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Diagnosis & Visit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
              <div className="col-span-1">
                <label htmlFor="rx-chief-complaint" className="block text-[11px] font-semibold text-slate-500 mb-2">Chief Complaint</label>
                <input 
                  id="rx-chief-complaint"
                  type="text" 
                  value={chiefComplaint} 
                  onChange={e => setChiefComplaint(e.target.value)} 
                  disabled={isReadOnly}
                  aria-label="Chief complaint"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 placeholder-slate-400 font-medium" 
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="rx-diagnosis" className="block text-[11px] font-semibold text-slate-500 mb-2">Diagnosis</label>
                <input 
                  id="rx-diagnosis"
                  type="text" 
                  value={diagnosis} 
                  onChange={e => setDiagnosis(e.target.value)} 
                  disabled={isReadOnly}
                  aria-label="Diagnosis"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 font-medium" 
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="rx-symptoms" className="block text-[11px] font-semibold text-slate-500 mb-2">Symptoms</label>
                <input 
                  id="rx-symptoms"
                  type="text" 
                  value={symptoms} 
                  onChange={e => setSymptoms(e.target.value)} 
                  disabled={isReadOnly}
                  aria-label="Symptoms"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 font-medium" 
                />
              </div>
              <div className="col-span-1 relative">
                <label htmlFor="rx-visit-date" className="block text-[11px] font-semibold text-slate-500 mb-2">Visit Date</label>
                <div className="relative">
                    <input 
                    id="rx-visit-date"
                    type="date" 
                    value={visitDate} 
                    onChange={e => setVisitDate(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 font-medium" 
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-[11px]" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="col-span-4">
                <label htmlFor="rx-medical-history" className="block text-[11px] font-semibold text-slate-500 mb-2">Medical History</label>
                <input 
                  id="rx-medical-history"
                  type="text" 
                  value={medicalHistory} 
                  onChange={e => setMedicalHistory(e.target.value)} 
                  disabled={isReadOnly}
                  aria-label="Medical history"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 font-medium" 
                />
            </div>
          </div>

          {/* Prescription (Rx) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-visible">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                Prescription (Rx)
            </h3>
            
            <div className="overflow-x-auto overflow-y-visible mb-6 pb-32">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                    <th className="pb-3 px-1 font-medium w-48">Medicine Name</th>
                    <th className="pb-3 px-1 font-medium">Type</th>
                    <th className="pb-3 px-1 font-medium">Strength</th>
                    <th className="pb-3 px-1 font-medium">Dosage</th>
                    <th className="pb-3 px-1 font-medium">Frequency</th>
                    <th className="pb-3 px-1 font-medium">Duration</th>
                    <th className="pb-3 px-1 font-medium text-center">Qty.</th>
                    <th className="pb-3 px-1 font-medium">Before/After Food</th>
                    <th className="pb-3 px-1 font-medium">Instructions</th>
                    {!isReadOnly && <th className="pb-3 px-1 font-medium text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="before:content-[''] before:block before:h-3">
                  {items.map((item, idx) => (
                    <tr key={idx} className="group bg-white">
                      <td className="p-1.5 align-top relative">
                        <input 
                            type="text"
                            value={item.medicineName}
                            onChange={(e) => {
                                updateItem(idx, 'medicineName', e.target.value);
                                setSearchQuery(e.target.value);
                                setShowSearchDropdown(true);
                                setActiveSearchIndex(idx);
                            }}
                            onFocus={() => {
                                setSearchQuery(item.medicineName);
                                setActiveSearchIndex(idx);
                            }}
                            onBlur={() => setTimeout(() => setActiveSearchIndex(null), 200)}
                            placeholder="Medicine Name"
                            aria-label={`Medicine name for row ${idx + 1}`}
                            aria-autocomplete="list"
                            aria-expanded={activeSearchIndex === idx && showSearchDropdown}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        {activeSearchIndex === idx && showSearchDropdown && debouncedSearch.length >= 1 && (
                            <div className="absolute z-50 left-1.5 right-1.5 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                                {(isSearching || isSearchingExternal) ? (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">Searching...</div>
                                ) : (medicines.length > 0 || externalMedicines.length > 0) ? (
                                    <ul className="py-1">
                                        {medicines.length > 0 && (
                                            <>
                                                <li className="px-3 py-1 bg-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                    In Pharmacy Stock
                                                </li>
                                                {medicines.map((med, mIdx) => (
                                                    <li 
                                                        key={`internal-${mIdx}`}
                                                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            updateItem(idx, 'medicineName', med.name || med.medicineName);
                                                            if (med.category) updateItem(idx, 'type', med.category);
                                                            if (med.strength || med.packSize) updateItem(idx, 'strength', med.strength || med.packSize);
                                                            setShowSearchDropdown(false);
                                                            setActiveSearchIndex(null);
                                                        }}
                                                    >
                                                        <div className="font-medium text-[13px] text-slate-800">{med.name || med.medicineName}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            {med.category} • {med.strength || med.packSize}
                                                        </div>
                                                    </li>
                                                ))}
                                            </>
                                        )}
                                        
                                        {externalMedicines.length > 0 && (
                                            <>
                                                <li className="px-3 py-1 bg-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
                                                    Other Medicines (External)
                                                </li>
                                                {externalMedicines.map((med, mIdx) => (
                                                    <li 
                                                        key={`external-${mIdx}`}
                                                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            updateItem(idx, 'medicineName', med.name);
                                                            setShowSearchDropdown(false);
                                                            setActiveSearchIndex(null);
                                                        }}
                                                    >
                                                        <div className="font-medium text-[13px] text-slate-800">{med.name}</div>
                                                        <div className="text-[11px] text-amber-600 mt-0.5">
                                                            Not in pharmacy stock
                                                        </div>
                                                    </li>
                                                ))}
                                            </>
                                        )}
                                    </ul>
                                ) : (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No medicines found</div>
                                )}
                            </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1 ml-1">{item.type}</div>
                      </td>
                      <td className="p-1.5 align-top">
                        <select 
                          value={item.type} 
                          onChange={e => updateItem(idx, 'type', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_4px_center] pr-6"
                        >
                          {TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="p-1.5 align-top">
                        <select 
                          value={item.strength} 
                          onChange={e => updateItem(idx, 'strength', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_4px_center] pr-6"
                        >
                          <option>5 mg</option>
                          <option>10 mg</option>
                          <option>40 mg</option>
                          <option>75 mg</option>
                          <option>500 mg</option>
                        </select>
                      </td>
                      <td className="p-1.5 align-top">
                        <input 
                          type="number" 
                          value={item.dosage} 
                          onChange={e => updateItem(idx, 'dosage', e.target.value)}
                          disabled={isReadOnly}
                          min="1"
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="p-1.5 align-top relative">
                        <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-amber-500">
                                {item.frequency.includes('Night') || item.frequency.includes('Moon') ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                            </span>
                            <select 
                            value={item.frequency} 
                            onChange={e => updateItem(idx, 'frequency', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full pl-8 pr-6 py-2 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_4px_center]"
                            >
                            <option>Once Daily</option>
                            <option>Twice Daily</option>
                            <option>Night</option>
                            </select>
                        </div>
                      </td>
                      <td className="p-1.5 align-top">
                        <select 
                            value={item.durationDays}
                            onChange={e => updateItem(idx, 'durationDays', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-2 py-2 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_4px_center] pr-6"
                        >
                            <option value="15">15 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                      </td>
                      <td className="p-1.5 align-top text-center text-[13px] font-bold text-slate-700 pt-2.5">
                        {parseInt(item.dosage || 1) * parseInt(item.durationDays || 30)}
                      </td>
                      <td className="p-1.5 align-top relative">
                        <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-amber-500 text-[10px]">🍔</span>
                            <select 
                            value={item.timing} 
                            onChange={e => updateItem(idx, 'timing', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-amber-400 disabled:bg-slate-50 appearance-none bg-no-repeat"
                            >
                            <option>After Food</option>
                            <option>Before Food</option>
                            </select>
                        </div>
                      </td>
                      <td className="p-1.5 align-top">
                        <input 
                          type="text" 
                          value={item.instructions} 
                          onChange={e => updateItem(idx, 'instructions', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Instructions"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      {!isReadOnly && (
                          <td className="p-1.5 align-top text-center">
                            <button 
                              onClick={() => removeItem(idx)}
                              aria-label={`Remove medicine row ${idx + 1}: ${item.medicineName || 'empty'}`}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors mt-0.5 border border-transparent hover:border-red-100"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-5">
                {!isReadOnly && (
                    <button 
                    onClick={() => addItem()}
                    aria-label="Add another medicine row"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white hover:bg-slate-50 rounded-md transition-colors border border-blue-200"
                    >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Medicine
                    </button>
                )}
                <div className="text-xs font-bold text-slate-800">
                    Total Medicines: {items.filter(i => i.medicineName).length}
                </div>
            </div>
          </div>

          {/* Bottom Notes & Lab Tests */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-[13px] font-semibold text-slate-900 mb-3">Clinical Notes</h3>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  disabled={isReadOnly}
                  rows={4} 
                  aria-label="Clinical notes"
                  className="w-full p-3 bg-[#F8FAFC] border-none rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-200 transition-colors resize-none disabled:bg-slate-50 font-medium" 
                />
            </div>
            <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-[13px] font-semibold text-slate-900 mb-3">Lab Test Recommended</h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedLabs.map(id => {
                        const lab = labCatalog.find(l => l.id === id);
                        return lab ? (
                            <div key={id} className="bg-white text-slate-700 px-3 py-1.5 rounded-md text-[11px] font-semibold border border-slate-200 flex items-center gap-2 shadow-sm">
                                {lab.testName}
                            </div>
                        ) : null;
                    })}
                    {!isReadOnly && (
                        <button className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm">
                            <Plus className="w-3 h-3" /> Add Test
                        </button>
                    )}
                </div>
            </div>
            <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-[13px] font-semibold text-slate-900 mb-3">Follow-up</h3>
                <label htmlFor="rx-followup-date" className="block text-[11px] font-semibold text-slate-500 mb-2">Follow-up Date</label>
                <div className="relative">
                    <input 
                        id="rx-followup-date"
                        type="date" 
                        value={followUpDate} 
                        onChange={e => setFollowUpDate(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-slate-50" 
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-[9px]" aria-hidden="true" />
                </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Matches mockup exactly */}
        <div className="w-full xl:w-[280px] flex-shrink-0 flex flex-col gap-5">
            
            {/* Previous Prescriptions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-bold text-slate-900">Previous Prescriptions</h3>
                    <button className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                    {previousPrescriptions.length > 0 ? previousPrescriptions.slice(0, 3).map((rx, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                            <div className="flex gap-3 items-center">
                                <div className="text-blue-500">
                                    <FileText className="w-5 h-5 stroke-[1.5]" />
                                </div>
                                <div>
                                    <div className="text-[13px] font-bold text-slate-800">
                                        {new Date(rx.createdAt || rx.prescriptionDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-400">{rx.items ? rx.items.length : 0} Medicines</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        </div>
                    )) : (
                        <div className="text-xs text-slate-500 font-medium text-center py-4">No previous prescriptions</div>
                    )}
                </div>
            </div>

            {/* Current Medications */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-[13px] font-bold text-slate-900 mb-4">Current Medications</h3>
                <div className="flex flex-wrap gap-2">
                    {previousPrescriptions.length > 0 && previousPrescriptions[0].items && previousPrescriptions[0].items.length > 0 ? (
                        previousPrescriptions[0].items.map((item, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-[#F1F5F9] text-slate-600 text-[11px] rounded-md font-semibold border border-transparent hover:border-slate-300 transition-colors">
                                {item.medicationName} {item.strength}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-slate-400 font-medium">None reported</span>
                    )}
                </div>
            </div>

            {/* Drug Interaction Check */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-[13px] font-bold flex items-center gap-2 mb-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                    Drug Interaction Check
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium pl-6">
                    No major interactions found.<br/>Prescription is safe to proceed.
                </p>
            </div>

            {/* AI Suggestions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
                <WipBanner feature="AI Prescription Suggestions" note="Backend API not implemented yet." />
                <h3 className="text-[13px] font-bold flex items-center gap-2 mb-1 text-slate-900">
                    AI Prescription Suggestions
                    <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Beta</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mb-3">Based on patient history and diagnosis</p>
                
                <div className="flex flex-col gap-2.5 pl-1">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-semibold text-slate-600">Consider adding Vitamin D3</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-semibold text-slate-600">Lifestyle modification recommended</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-semibold text-slate-600">Regular BP monitoring advised</span>
                    </div>
                </div>
            </div>

            {/* Patient History Overview (BP Trend) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-bold text-slate-900">Patient History Overview</h3>
                    <button className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">View All</button>
                </div>
                <h4 className="text-[11px] font-semibold text-slate-700 mb-3">Blood Pressure Trend</h4>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 bg-emerald-500 rounded-sm"></div> Systolic</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 bg-blue-500 rounded-sm"></div> Diastolic</div>
                </div>
                <div className="h-32 w-full">
                    {vitalsLoading ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading vitals…</div>
                    ) : bpData.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center gap-1">
                        <span className="text-xs font-semibold text-slate-400">No BP readings recorded yet</span>
                        <span className="text-[10px] text-slate-300">Vitals will appear here once recorded by nursing staff</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={bpData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 200]} ticks={[0, 50, 100, 150, 200]} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                              <Line type="monotone" dataKey="sys" stroke="#10b981" strokeWidth={2} dot={{r: 2, fill: '#10b981'}} activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2} dot={{r: 2, fill: '#3b82f6'}} activeDot={{ r: 4 }} />
                          </LineChart>
                      </ResponsiveContainer>
                    )}
                </div>
            </div>


        </div>
      </div>

      {/* Action Bar (Static at bottom of container, not fixed to window in mockup, but often implemented as sticky for UX) */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-6 text-[13px] font-bold text-slate-600">
            <button className="flex items-center gap-2 hover:text-slate-800 transition-colors">
                <FileCode className="w-4 h-4 stroke-[1.5]" /> Save Draft
            </button>
            <button className="flex items-center gap-2 hover:text-slate-800 transition-colors">
                <Eye className="w-4 h-4 stroke-[1.5]" /> Preview Prescription
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 hover:text-slate-800 transition-colors">
                <Printer className="w-4 h-4 stroke-[1.5]" /> Print
            </button>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={handleAiCheck} disabled={aiInsightMutation.isPending} className="flex items-center justify-center gap-3 px-5 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                {aiInsightMutation.isPending ? <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-4 h-4 shrink-0" />}
                <span className="text-[13px] font-bold">AI Safety Check</span>
            </button>
            <button onClick={handleSend} disabled={sendMutation.isPending} className="flex items-center justify-center gap-3 px-5 py-2 text-white bg-[#0F766E] hover:bg-teal-800 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                <Send className="w-4 h-4 shrink-0" />
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] font-bold">Send to Patient</span>
                    <span className="text-[9px] font-medium text-teal-100">via Patient Portal / SMS</span>
                </div>
            </button>
            <button onClick={handleSendToPharmacy} disabled={sendToPharmacyMutation.isPending} className="flex items-center justify-center gap-3 px-5 py-2 text-white bg-[#0F766E] hover:bg-teal-800 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10.5 20.5 19 12a4.94 4.94 0 0 0 0-7 4.94 4.94 0 0 0-7 0L3.5 13.5a4.94 4.94 0 0 0 0 7 4.94 4.94 0 0 0 7 0Z"/><path d="m7.5 9.5 7 7"/></svg>
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] font-bold">Send to Pharmacy</span>
                    <span className="text-[9px] font-medium text-teal-100">via Pharmacy System</span>
                </div>
            </button>
        </div>
      </div>

      {/* Patient Edit Modal */}
      {isEditModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-patient-modal-title"
          >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 id="edit-patient-modal-title" className="font-bold text-slate-800">Edit Patient Details</h3>
                      <button 
                        onClick={() => setIsEditModalOpen(false)} 
                        aria-label="Close edit patient details dialog"
                        className="text-slate-400 hover:text-slate-600"
                      >
                          <X className="w-5 h-5" aria-hidden="true" />
                      </button>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Blood Group</label>
                              <select 
                                  value={editProfile.bloodGroup} 
                                  onChange={e => setEditProfile({...editProfile, bloodGroup: e.target.value})}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                              >
                                  <option value="">Select Blood Group</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Allergies</label>
                              <input 
                                  type="text" 
                                  value={editProfile.allergies} 
                                  onChange={e => setEditProfile({...editProfile, allergies: e.target.value})}
                                  placeholder="e.g. Peanuts, Penicillin"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400"
                              />
                              <p className="text-[10px] text-slate-400 mt-1">Separate multiple with commas</p>
                          </div>
                      </div>
                      <hr className="border-slate-100" />
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Height (cm)</label>
                              <input 
                                  type="number" 
                                  value={editProfile.heightCm} 
                                  onChange={e => setEditProfile({...editProfile, heightCm: e.target.value})}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Weight (kg)</label>
                              <input 
                                  type="number" 
                                  value={editProfile.weightKg} 
                                  onChange={e => setEditProfile({...editProfile, weightKg: e.target.value})}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Blood Pressure</label>
                              <input 
                                  type="text" 
                                  value={editProfile.bloodPressure} 
                                  onChange={e => setEditProfile({...editProfile, bloodPressure: e.target.value})}
                                  placeholder="e.g. 120/80"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pulse (bpm)</label>
                              <input 
                                  type="number" 
                                  value={editProfile.pulseBpm} 
                                  onChange={e => setEditProfile({...editProfile, pulseBpm: e.target.value})}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                              />
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button 
                          onClick={() => setIsEditModalOpen(false)}
                          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleSaveEdit}
                          disabled={editProfileMutation.isPending || saveVitalsMutation.isPending}
                          className="px-4 py-2 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                          {(editProfileMutation.isPending || saveVitalsMutation.isPending) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                              <Save className="w-4 h-4" />
                          )}
                          Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Pharmacy Selection Modal */}
      {isPharmacyModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
          >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Select Pharmacy / Pharmacist</h3>
                      <button 
                        onClick={() => setIsPharmacyModalOpen(false)} 
                        className="text-slate-400 hover:text-slate-600"
                      >
                          <X className="w-5 h-5" aria-hidden="true" />
                      </button>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign To</label>
                          <select 
                              value={selectedPharmacyUserId} 
                              onChange={e => setSelectedPharmacyUserId(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          >
                              <option value="">Any Available Pharmacist</option>
                              {pharmacyUsers.map(u => (
                                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                              ))}
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">If "Any Available" is selected, all pharmacists will see this prescription in their pending queue.</p>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button 
                          onClick={() => setIsPharmacyModalOpen(false)}
                          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmSendToPharmacy}
                          disabled={sendToPharmacyMutation.isPending}
                          className="px-4 py-2 text-sm font-bold text-white bg-teal-600 border border-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                          {sendToPharmacyMutation.isPending ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                              <Send className="w-4 h-4" />
                          )}
                          Send Prescription
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CDS Block Modal */}
      {isCdsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <h3 className="font-bold text-red-900 text-lg">Critical Safety Alert</h3>
                  </div>
                  <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                      <p className="text-sm text-slate-700 font-medium">
                          The prescription was blocked by the Clinical Decision Support system due to the following critical contraindications:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-red-700 space-y-2">
                          {cdsBlockedAlerts.map((alert, idx) => (
                              <li key={idx}><strong>{alert}</strong></li>
                          ))}
                      </ul>
                      <p className="text-xs text-slate-500 mt-2">
                          Please modify the prescription items. You cannot proceed with these critical safety violations.
                      </p>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button 
                          onClick={() => setIsCdsModalOpen(false)}
                          className="px-5 py-2 text-sm font-bold text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                          Acknowledge & Edit
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* AI Insights Modal */}
      {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-indigo-600" />
                      <h3 className="font-bold text-indigo-900 text-lg">AI Clinical Insights</h3>
                  </div>
                  <div className="p-5 max-h-[70vh] overflow-y-auto">
                      <div className="prose prose-sm prose-indigo whitespace-pre-wrap">
                          {aiInsight}
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button 
                          onClick={() => setIsAiModalOpen(false)}
                          className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
    
  );
};

export default NewPrescription;
