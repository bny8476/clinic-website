import logger from '../../utils/logger';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import PrescriptionDocument from '../../components/doctor/PrescriptionDocument';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, AlertTriangle, ArrowLeft, Check, CheckCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Edit, Edit2, Eye, FileCode, FileText, Heart, Info, Moon, Plus, Printer, Save, Send, Sparkles, Sun, Sunrise, Trash2, X } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
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
    } else if (templateId) {
      axiosPrivate.get(`/prescriptions/templates/${templateId}`)
        .then(res => {
          const data = res.data;
          setChiefComplaint(data.chiefComplaint || '');
          setDiagnosis(data.diagnosis || '');
          if (data.items && data.items.length > 0) {
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
          toast.error("Failed to load template.");
          logger.error(err);
        });
    }
  }, [routePrescriptionId, templateId]);


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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans p-4 md:p-6 pb-28 max-w-7xl mx-auto text-slate-800">
      
      {/* ─── Top Navigation & Header ─── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to={`/doctor/patients/${patientId}`} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to Patient Details
          </Link>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            New Prescription
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
              ✓
            </span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">Create and send prescription to patient and pharmacy</p>
        </div>

        {/* Top-Right Action */}
        <div className="flex flex-col items-end gap-1">
          <button 
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg transition"
          >
            <Send className="w-4 h-4" />
            Save & Send Prescription
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 font-medium">Prescription will be sent to pharmacy</span>
        </div>
      </div>

      {profileError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <span className="text-xs font-bold text-red-700">Unable to load patient data. Please try again.</span>
          </div>
          <button onClick={() => window.location.reload()} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50">Retry</button>
        </div>
      )}

      {/* ─── Main Content Grid (Left Form + Right Sidebar) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (8/12 = ~67%) ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Banner Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left Avatar & Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl font-black text-xl flex items-center justify-center flex-shrink-0">
                  PI
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-slate-900">
                      {profile?.name || 'Pat lent'}
                    </h2>
                    <button 
                      onClick={openEditModal} 
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                    <span className="text-blue-600 font-bold">PID: #{patientId || 14}</span>
                    <span>Age: {profile?.age ?? 0} Years</span>
                    <span>Gender: {profile?.gender || 'Male'}</span>
                    <span>N/A</span>
                  </div>
                </div>
              </div>

              {/* Right Health Vitals Row */}
              <div className="flex items-center gap-4 flex-wrap text-xs">
                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</p>
                  <span className="bg-red-50 text-red-500 font-bold px-3 py-1 rounded-xl text-xs block">
                    {profile?.bloodGroup || 'N/A'}
                  </span>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Allergies</p>
                  <span className="bg-amber-50 text-amber-600 font-bold px-3 py-1 rounded-xl text-xs block">
                    None
                  </span>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-0.5">
                    <span>↑</span> Height
                  </p>
                  <span className="font-extrabold text-slate-900 block">N/A</span>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-0.5">
                    <span>⏱</span> Weight
                  </p>
                  <span className="font-extrabold text-slate-900 block">N/A</span>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-0.5">
                    <span>♡</span> BP
                  </p>
                  <span className="font-extrabold text-slate-900 block">N/A</span>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-0.5">
                    <span>⚡</span> Pulse
                  </p>
                  <span className="font-extrabold text-slate-900 block">N/A</span>
                </div>
              </div>

            </div>
          </div>

          {/* Diagnosis & Visit Information Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Diagnosis & Visit Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">Chief Complaint</label>
                <input 
                  type="text" 
                  value={chiefComplaint} 
                  onChange={e => setChiefComplaint(e.target.value)} 
                  placeholder="Enter chief complaint"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">Diagnosis</label>
                <input 
                  type="text" 
                  value={diagnosis} 
                  onChange={e => setDiagnosis(e.target.value)} 
                  placeholder="Enter diagnosis"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">Symptoms</label>
                <input 
                  type="text" 
                  value={symptoms} 
                  onChange={e => setSymptoms(e.target.value)} 
                  placeholder="Enter symptoms"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">Visit Date</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={visitDate || '24/08/2026'} 
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500" 
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-500">Medical History</label>
              <textarea 
                value={medicalHistory} 
                onChange={e => setMedicalHistory(e.target.value)} 
                rows={3} 
                placeholder="Enter medical history"
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" 
              />
              <p className="text-[10px] text-slate-400 font-bold text-right">0/500</p>
            </div>
          </div>

          {/* Prescription (Rx) Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                  Rx
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Prescription (Rx)</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead>
                  <tr className="text-slate-400 font-bold text-[11px] border-b border-slate-50">
                    <th className="pb-3 px-2">Medicine Name</th>
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2">Strength</th>
                    <th className="pb-3 px-2">Dosage</th>
                    <th className="pb-3 px-2">Frequency</th>
                    <th className="pb-3 px-2">Duration</th>
                    <th className="pb-3 px-2">Qty.</th>
                    <th className="pb-3 px-2">Before/After Food</th>
                    <th className="pb-3 px-2">Instructions</th>
                    <th className="pb-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-2 relative min-w-[160px]">
                        <input 
                          type="text"
                          value={item.medicineName}
                          onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                          placeholder="Search medicine"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <select 
                          value={item.type} 
                          onChange={e => updateItem(idx, 'type', e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option>Select</option>
                          {TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </td>

                      <td className="py-2.5 px-2">
                        <input 
                          type="text" 
                          value={item.strength} 
                          onChange={e => updateItem(idx, 'strength', e.target.value)}
                          placeholder="e.g. 500mg"
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <input 
                          type="text" 
                          value={item.dosage} 
                          onChange={e => updateItem(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 1 tablet"
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <input 
                          type="text" 
                          value={item.frequency} 
                          onChange={e => updateItem(idx, 'frequency', e.target.value)}
                          placeholder="e.g. BD"
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <input 
                          type="text" 
                          value={item.durationDays} 
                          onChange={e => updateItem(idx, 'durationDays', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <input 
                          type="text" 
                          value={item.dosage ? parseInt(item.dosage) * parseInt(item.durationDays || 1) : ''} 
                          readOnly
                          placeholder="e.g. 10"
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none text-center cursor-not-allowed"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <select 
                          value={item.timing} 
                          onChange={e => updateItem(idx, 'timing', e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option>Select</option>
                          <option>After Food</option>
                          <option>Before Food</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-2">
                        <input 
                          type="text" 
                          value={item.instructions} 
                          onChange={e => updateItem(idx, 'instructions', e.target.value)}
                          placeholder="Add instructions"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button 
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button 
                onClick={() => addItem()}
                className="bg-[#EFF4FF] hover:bg-blue-100 text-[#2B4AFE] font-bold text-xs px-4 py-2 rounded-2xl border border-blue-100 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>

              <span className="text-xs font-bold text-slate-400">
                {items.filter(i => i.medicineName).length} medicines added
              </span>
            </div>
          </div>

          {/* Bottom Tip Notice Banner */}
          <div className="bg-[#EFF4FF] border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-700 font-medium">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>Tip: Double-check the dosage, frequency, and duration before sending prescription to ensure patient safety.</span>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR (4/12 = ~33%) ── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Previous Prescriptions Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Previous Prescriptions</h3>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-400">No previous prescriptions found.</p>
            </div>
          </div>

          {/* Current Medications Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs">
                💊
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Current Medications</h3>
            </div>
            <p className="text-xs font-medium text-slate-400">None reported</p>
          </div>

          {/* Drug Interaction Check Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs">
                  🛡️
                </div>
                <h3 className="font-extrabold text-emerald-600 text-sm">Drug Interaction Check</h3>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              No major interactions found.<br />Prescription is safe to proceed.
            </p>
          </div>

          {/* AI Prescription Suggestions Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xs">
                🤖
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">AI Prescription Suggestions</h3>
                <p className="text-[10px] font-medium text-slate-400">Based on patient history and diagnosis</p>
              </div>
            </div>

            <button 
              onClick={handleAiCheck}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              Get AI Suggestions
            </button>
          </div>

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
