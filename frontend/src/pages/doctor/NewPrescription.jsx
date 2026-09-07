import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Activity, 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  CheckCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Edit, 
  Edit2, 
  Eye, 
  FileCode, 
  FileText, 
  Heart, 
  Info, 
  Moon, 
  Plus, 
  Printer, 
  Save, 
  Search,
  Send, 
  ShieldAlert,
  ShieldCheck,
  Sparkles, 
  Stethoscope,
  Sun, 
  Sunrise, 
  Trash2, 
  X,
  Zap
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import logger from '../../utils/logger';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import PrescriptionDocument from '../../components/doctor/PrescriptionDocument';
import { axiosPrivate } from '../../api/axios';

const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Spray', 'Gel', 'Suspension', 'Lotion', 'Suppository'];

const FREQUENCIES = [
  { label: 'Once Daily (1-0-0)', value: '1-0-0', short: '1-0-0', icon: Sunrise },
  { label: 'Twice Daily (1-0-1)', value: '1-0-1', short: '1-0-1', icon: Sun },
  { label: 'Thrice Daily (1-1-1)', value: '1-1-1', short: '1-1-1', icon: Sun },
  { label: 'Four times daily (1-1-1-1)', value: '1-1-1-1', short: '1-1-1-1', icon: Sun },
  { label: 'Every 4 hours (q4h)', value: 'q4h', short: 'q4h', icon: Clock },
  { label: 'Every 6 hours (q6h)', value: 'q6h', short: 'q6h', icon: Clock },
  { label: 'Every 8 hours (q8h)', value: 'q8h', short: 'q8h', icon: Clock },
  { label: 'SOS (As Needed)', value: 'SOS', short: 'SOS', icon: AlertTriangle },
  { label: 'Stat (Immediately)', value: 'Stat', short: 'Stat', icon: AlertTriangle }
];

const DURATIONS = [
  { label: '3 Days', value: '3' },
  { label: '5 Days', value: '5' },
  { label: '7 Days', value: '7' },
  { label: '15 Days', value: '15' },
  { label: '30 Days', value: '30' },
];

const TIMINGS = [
  { label: 'After Food', value: 'After Food' },
  { label: 'Before Food', value: 'Before Food' },
  { label: 'With Food', value: 'With Food' },
  { label: 'Empty Stomach', value: 'Empty Stomach' }
];

const NewPrescription = () => {
  const { patientId, prescriptionId: routePrescriptionId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // --- Core State ---
  const [prescriptionId, setPrescriptionId] = useState(routePrescriptionId || null);
  const [prescriptionStatus, setPrescriptionStatus] = useState('NEW');

  const [isPreview, setIsPreview] = useState(false);
  const [sentAt, setSentAt] = useState(null);
  
  // Search Autocomplete State
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [items, setItems] = useState([
    {
      id: Date.now(),
      medicineId: null,
      medicineName: '',
      type: 'Tablet',
      strength: '500 mg',
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

  // --- Initial Data Load (Draft or Template) ---
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
            setFollowUpDate(data.followUpDate.substring(0, 10));
          }
          if (data.items && data.items.length > 0) {
            setItems(data.items.map((i, idx) => ({
              id: Date.now() + idx + Math.random(),
              medicineName: i.medicationName || i.medicineName || '',
              type: i.type || 'Tablet',
              dosage: i.dosage || '1',
              frequency: i.frequency || '1-0-1',
              durationDays: String(i.duration || i.durationDays || '7'),
              timing: i.timing || 'After Food',
              instructions: i.instructions || '',
              strength: i.strength || '500 mg'
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
            setItems(data.items.map((i, idx) => ({
              id: Date.now() + idx + Math.random(),
              medicineName: i.medicationName || i.medicineName || '',
              type: i.type || 'Tablet',
              dosage: i.dosage || '1',
              frequency: i.frequency || '1-0-1',
              durationDays: String(i.duration || i.durationDays || '7'),
              timing: i.timing || 'After Food',
              instructions: i.instructions || '',
              strength: i.strength || '500 mg'
            })));
          }
        })
        .catch(err => {
          toast.error("Failed to load template.");
          logger.error(err);
        });
    }
  }, [routePrescriptionId, templateId]);

  // --- Data Fetching Queries ---
  const { data: profile, isError: profileError } = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => (await axiosPrivate.get(`/doctor/patients/${patientId}`)).data,
    enabled: !!patientId
  });

  const { data: pharmacyUsers = [] } = useQuery({
    queryKey: ['pharmacyUsers'],
    queryFn: async () => (await axiosPrivate.get(`/prescriptions/pharmacy-recipients`)).data.data || []
  });

  const { data: doctorDetails } = useQuery({
    queryKey: ['doctorDetails', user?.id],
    queryFn: async () => (await axiosPrivate.get(`/doctors/${user.id}/full-profile`)).data,
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

  const { data: vitalsHistory = [] } = useQuery({
    queryKey: ['vitals-history', patientId],
    queryFn: async () => (await axiosPrivate.get(`/patients/${patientId}/vitals/history`)).data,
    enabled: !!patientId,
    staleTime: 60_000,
  });

  // Autocomplete medicine search query
  const { data: medicines = [] } = useQuery({
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

  const { data: externalMedicines = [] } = useQuery({
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

  const combinedMedicineSuggestions = React.useMemo(() => {
    const list = [];
    if (Array.isArray(medicines)) {
      medicines.forEach(m => list.push({
        id: m.id,
        name: m.name || m.medicineName || m.title,
        brand: m.brandName || m.brand,
        strength: m.strength || '500 mg',
        type: m.dosageForm || m.type || 'Tablet',
        stock: m.stockQuantity ?? m.stock,
        source: 'Pharmacy Stock'
      }));
    }
    if (Array.isArray(externalMedicines)) {
      externalMedicines.forEach(m => {
        if (!list.some(existing => existing.name?.toLowerCase() === (m.name || m.title || '').toLowerCase())) {
          list.push({
            id: m.id || null,
            name: m.name || m.title,
            brand: m.brandName || m.manufacturer,
            strength: m.strength || '500 mg',
            type: m.dosageForm || m.type || 'Tablet',
            stock: null,
            source: 'Rx Catalog'
          });
        }
      });
    }
    return list;
  }, [medicines, externalMedicines]);

  useEffect(() => {
    if (profile?.medicalHistorySummary && !medicalHistory) {
      setMedicalHistory(profile.medicalHistorySummary);
    }
  }, [profile, medicalHistory]);

  // Real-time Drug Safety Check
  useEffect(() => {
    const checkInteractions = async () => {
      if (items.length === 0 || !items[0].medicineName) {
        setInteractionAlerts([]);
        return;
      }
      const medicationNames = items.map(i => i.medicineName).filter(Boolean);
      if (medicationNames.length === 0) return;
      try {
        const res = await axiosPrivate.post('/prescriptions/safety-check', { patientId, medicationNames });
        setInteractionAlerts(res.data.safe ? [] : res.data.messages);
      } catch (err) {}
    };
    const timer = setTimeout(checkInteractions, 1000);
    return () => clearTimeout(timer);
  }, [items, patientId]);

  // Transform BP vitals history for trend chart
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
    .slice(-10);

  // --- Handlers & Mutations ---
  const addItem = (med = null) => {
    if (isReadOnly) return;
    setItems(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        medicineId: med?.id || null,
        medicineName: med ? (med.name || med.medicineName || med) : '',
        type: med?.type || 'Tablet',
        strength: med?.strength || '500 mg',
        dosage: '1',
        frequency: '1-0-1',
        durationDays: '7',
        timing: 'After Food',
        instructions: '',
      }
    ]);
    setActiveSearchIndex(null);
    setSearchQuery('');
  };

  const removeItem = (index) => {
    if (isReadOnly) return;
    if (items.length === 1) {
      setItems([{
        id: Date.now(),
        medicineId: null,
        medicineName: '',
        type: 'Tablet',
        strength: '500 mg',
        dosage: '1',
        frequency: '1-0-1',
        durationDays: '7',
        timing: 'After Food',
        instructions: '',
      }]);
      return;
    }
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

  const selectSuggestion = (index, med) => {
    updateItem(index, 'medicineName', med.name);
    if (med.type) updateItem(index, 'type', med.type);
    if (med.strength) updateItem(index, 'strength', med.strength);
    if (med.id) updateItem(index, 'medicineId', med.id);
    setActiveSearchIndex(null);
    setSearchQuery('');
  };

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

  const validate = () => {
    const newErrors = {};
    const validItems = items.filter(i => i.medicineName);
    if (validItems.length === 0) newErrors.general = "At least one medicine is required.";
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
      setPrescriptionStatus('PENDING');
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
    onError: () => toast.error("Failed to fetch AI Insights.")
  });

  const handleAiCheck = () => {
    if (!validate()) { toast.error("Please add at least one medicine."); return; }
    aiInsightMutation.mutate();
  };

  const handlePrint = () => { window.print(); };

  const handleSend = () => {
    if (profileError || !profile) { toast.error("Cannot proceed: Patient data failed to load."); return; }
    if (!validate()) { toast.error("Please add at least one medicine."); return; }
    sendMutation.mutate();
  };

  const handleSendToPharmacy = () => {
    if (profileError || !profile) { toast.error("Cannot proceed: Patient data failed to load."); return; }
    if (!validate()) { toast.error("Please add at least one medicine."); return; }
    setIsPharmacyModalOpen(true);
  };

  const confirmSendToPharmacy = () => {
    sendToPharmacyMutation.mutate(selectedPharmacyUserId);
  };

  const setFollowUpOffset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFollowUpDate(date.toISOString().split('T')[0]);
  };

  const getAge = (dob) => {
    if (!dob) return profile?.age || 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return new Date(diff).getUTCFullYear() - 1970;
  };

  // --- Full Page Print Preview ---
  if (isPreview) {
    const documentData = {
      clinicName: doctorDetails?.clinicName || 'AURELIAN CLINIC',
      clinicAddress: doctorDetails?.clinicAddress || 'Medical Heights, Tower 4, Healthcare City',
      clinicPhone: doctorDetails?.clinicPhone || '+91 98765 43210',
      clinicEmail: doctorDetails?.clinicEmail || 'clinic@aurelianhealth.com',
      doctorName: doctorDetails?.doctorName ? 'Dr. ' + doctorDetails.doctorName : (user?.firstName ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Practitioner'),
      doctorSpecialty: doctorDetails?.specialty || 'General Physician',
      doctorQualifications: doctorDetails?.qualifications || 'MBBS, MD',
      registrationNumber: doctorDetails?.registrationNumber || 'REG-2026-8891',
      patientName: profile?.patientName || profile?.name || 'Patient',
      patientAge: profile?.age || getAge(profile?.dateOfBirth),
      patientGender: profile?.gender || 'Male',
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
      <div className="max-w-4xl mx-auto py-8 px-4 font-sans">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Edit Form
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <Edit className="w-4 h-4 text-slate-500" /> Edit Prescription
            </button>

            <button 
              onClick={handleSendToPharmacy}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send to Pharmacy
            </button>

            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Rx Document
            </button>
          </div>
        </div>
        
        <PrescriptionDocument data={documentData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-3 sm:p-5 md:p-8 pb-32 max-w-7xl mx-auto text-slate-800">
      
      {/* ─── Top Header & Floating Action Controls ─── */}
      <div className="mb-6 bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link 
            to={`/doctor/patients/${patientId}`} 
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Patient Profile
          </Link>
          
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Clinical Prescription
            </h1>

            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 ${
              prescriptionStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              prescriptionStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              prescriptionStatus === 'DRAFT' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {prescriptionStatus === 'NEW' ? 'NEW DRAFT' : prescriptionStatus}
            </span>
          </div>

          <p className="text-slate-500 text-xs font-medium mt-1">
            Create, validate drug interactions, and dispatch electronic prescription
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => saveDraftMutation.mutate()}
            disabled={saveDraftMutation.isPending || isReadOnly}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            Save Draft
          </button>

          <button 
            onClick={handleAiCheck}
            disabled={aiInsightMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            AI Safety Check
          </button>

          <button 
            onClick={() => setIsPreview(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm transition"
          >
            <Eye className="w-4 h-4 text-slate-300" />
            Preview
          </button>

          <button 
            onClick={handleSendToPharmacy}
            disabled={sendToPharmacyMutation.isPending || isReadOnly}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send to Pharmacy
          </button>

          <button 
            onClick={handleSend}
            disabled={sendMutation.isPending || isReadOnly}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {sendMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Save & Prescribe
          </button>
        </div>
      </div>

      {profileError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <span className="text-xs font-bold text-red-700">Unable to load patient profile details. Please try again.</span>
          </div>
          <button onClick={() => window.location.reload()} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50">Retry</button>
        </div>
      )}

      {/* ─── Main Content Grid Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (8/12 = 67%) ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Banner Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              
              {/* Left Profile Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xl flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
                  {profile?.name ? profile.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'PT'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900">
                      {profile?.name || 'Patient'}
                    </h2>
                    <button 
                      onClick={openEditModal} 
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-full font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Vitals
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                    <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">PID: #{patientId || 14}</span>
                    <span>Age: {profile?.age || getAge(profile?.dateOfBirth)} Yrs</span>
                    <span>Gender: {profile?.gender || 'Male'}</span>
                    <span>Phone: {profile?.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Right Health Vitals Cards */}
              <div className="flex items-center gap-3 flex-wrap text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <div className="space-y-0.5 text-center px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Blood</p>
                  <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-lg text-xs block">
                    {profile?.bloodGroup || 'N/A'}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <div className="space-y-0.5 text-center px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Allergies</p>
                  <span className="bg-amber-100 text-amber-800 font-extrabold px-2.5 py-0.5 rounded-lg text-xs block">
                    {profile?.allergies && profile.allergies !== '[]' ? 'Present' : 'None'}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <div className="space-y-0.5 text-center px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Height</p>
                  <span className="font-black text-slate-900 block">{vitalsLatest?.heightCm ? `${vitalsLatest.heightCm} cm` : 'N/A'}</span>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <div className="space-y-0.5 text-center px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Weight</p>
                  <span className="font-black text-slate-900 block">{vitalsLatest?.weightKg ? `${vitalsLatest.weightKg} kg` : 'N/A'}</span>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <div className="space-y-0.5 text-center px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">BP</p>
                  <span className="font-black text-blue-700 block">{vitalsLatest?.bloodPressure || 'N/A'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Diagnosis & Visit Information Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Diagnosis & Clinical Visit Summary</h3>
                <p className="text-[11px] text-slate-400 font-medium">Record chief complaints, diagnosis, and medical history</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Chief Complaint</label>
                <input 
                  type="text" 
                  value={chiefComplaint} 
                  onChange={e => setChiefComplaint(e.target.value)} 
                  placeholder="e.g. Severe headache, Fever"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Primary Diagnosis</label>
                <input 
                  type="text" 
                  value={diagnosis} 
                  onChange={e => setDiagnosis(e.target.value)} 
                  placeholder="e.g. Acute Viral Bronchitis"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Symptoms</label>
                <input 
                  type="text" 
                  value={symptoms} 
                  onChange={e => setSymptoms(e.target.value)} 
                  placeholder="e.g. Cough, Fatigue"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Visit Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={visitDate} 
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">Medical History & Clinical Notes</label>
              <textarea 
                value={medicalHistory} 
                onChange={e => setMedicalHistory(e.target.value)} 
                rows={2} 
                placeholder="Record pertinent past medical history, chronic conditions, or clinical exam findings..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition" 
              />
            </div>
          </div>

          {/* Prescription (Rx) Table & Medicine Builder Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm shadow-blue-200">
                  Rx
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Prescription Medications (Rx)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Add medications, dosage form, frequency, and instructions</p>
                </div>
              </div>

              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                {items.filter(i => i.medicineName).length} Medications Selected
              </span>
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {errors.general}
              </div>
            )}

            {/* List of Medicine Items */}
            <div className="space-y-4">
              {items.map((item, idx) => {
                const calculatedQty = (parseInt(item.dosage) || 1) * (parseInt(item.durationDays) || 1);
                
                return (
                  <div key={item.id || idx} className="bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 rounded-2xl p-4 transition space-y-3 relative group">
                    
                    {/* Top Row: Index & Medicine Search & Type & Strength */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      
                      {/* Rx Badge & Search Autocomplete (6 Cols) */}
                      <div className="md:col-span-6 relative">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                          <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          Medicine Name
                        </label>
                        
                        <div className="relative">
                          <input 
                            type="text"
                            value={item.medicineName}
                            onChange={(e) => {
                              updateItem(idx, 'medicineName', e.target.value);
                              setActiveSearchIndex(idx);
                              setSearchQuery(e.target.value);
                            }}
                            onFocus={() => {
                              setActiveSearchIndex(idx);
                              setSearchQuery(item.medicineName);
                            }}
                            placeholder="Type medicine name (e.g. Paracetamol, Amoxicillin)..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>

                        {/* Autocomplete Dropdown */}
                        {activeSearchIndex === idx && combinedMedicineSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-50">
                            {combinedMedicineSuggestions.map((med, mIdx) => (
                              <div 
                                key={mIdx}
                                onClick={() => selectSuggestion(idx, med)}
                                className="p-3 hover:bg-blue-50/80 cursor-pointer transition flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">{med.name}</span>
                                  {med.brand && <span className="text-[11px] text-slate-400 ml-1.5">({med.brand})</span>}
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-600">{med.type}</span>
                                    <span>{med.strength}</span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full block">
                                    {med.source}
                                  </span>
                                  {med.stock !== null && (
                                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                      Stock: {med.stock}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dosage Form (3 Cols) */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Form</label>
                        <select 
                          value={item.type} 
                          onChange={e => updateItem(idx, 'type', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                        >
                          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      {/* Strength (3 Cols) */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Strength</label>
                        <input 
                          type="text" 
                          value={item.strength} 
                          onChange={e => updateItem(idx, 'strength', e.target.value)}
                          placeholder="e.g. 500 mg"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                    </div>

                    {/* Middle Row: Dosage, Frequency Chips, Duration Chips, Timing, Total Qty */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-slate-200/60">
                      
                      {/* Dosage (2 Cols) */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Dose Unit</label>
                        <input 
                          type="text" 
                          value={item.dosage} 
                          onChange={e => updateItem(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-extrabold focus:outline-none text-center"
                        />
                      </div>

                      {/* Frequency Selection Chips (5 Cols) */}
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Frequency</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {FREQUENCIES.slice(0, 5).map(f => (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() => updateItem(idx, 'frequency', f.value)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition border ${
                                item.frequency === f.value 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {f.short}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration Chips (3 Cols) */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Duration (Days)</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            value={item.durationDays} 
                            onChange={e => updateItem(idx, 'durationDays', e.target.value)}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 text-center"
                          />
                          <div className="flex gap-1">
                            {DURATIONS.slice(0, 3).map(d => (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() => updateItem(idx, 'durationDays', d.value)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                                  item.durationDays === d.value 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Calculated Total Qty (2 Cols) */}
                      <div className="md:col-span-2 text-center bg-blue-50/80 p-2 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-600 block uppercase">Total Qty</span>
                        <span className="text-sm font-black text-blue-900">{calculatedQty || 1} units</span>
                      </div>

                    </div>

                    {/* Bottom Row: Timing Pills & Instructions & Action */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
                      
                      {/* Timing Radio Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 mr-1">Timing:</span>
                        {TIMINGS.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => updateItem(idx, 'timing', t.value)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition border ${
                              item.timing === t.value 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Instructions & Remove Button */}
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <input 
                          type="text" 
                          value={item.instructions} 
                          onChange={e => updateItem(idx, 'instructions', e.target.value)}
                          placeholder="Special instructions (e.g. take after breakfast)..."
                          className="flex-1 md:w-64 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500"
                        />

                        <button 
                          onClick={() => removeItem(idx)}
                          title="Remove medication"
                          className="p-2 text-rose-500 hover:bg-rose-100/80 hover:text-rose-700 rounded-xl transition cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

            {/* Add Medicine Footer Row */}
            <div className="flex items-center justify-between pt-2">
              <button 
                onClick={() => addItem()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Another Medication
              </button>

              <span className="text-xs font-extrabold text-slate-500">
                {items.filter(i => i.medicineName).length} active medication lines
              </span>
            </div>
          </div>

          {/* Follow-up & Lab Orders Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Follow-up Date & Instructions</h3>
                <p className="text-[11px] text-slate-400 font-medium">Set next appointment review date</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Follow-up Date</label>
                <input 
                  type="date" 
                  value={followUpDate} 
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition" 
                />
              </div>

              <div className="md:col-span-7 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Quick Offset Options</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    type="button" 
                    onClick={() => setFollowUpOffset(7)} 
                    className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    +7 Days
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFollowUpOffset(14)} 
                    className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    +14 Days (2 Wks)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFollowUpOffset(30)} 
                    className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    +30 Days (1 Mo)
                  </button>
                  {followUpDate && (
                    <button 
                      type="button" 
                      onClick={() => setFollowUpDate('')} 
                      className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition"
                    >
                      Clear Date
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Patient Notice Tip Box */}
          <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-center gap-3.5 text-xs text-blue-900 font-semibold shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>All prescriptions issued are digitally signed and automatically recorded in the patient's electronic health record (EHR).</span>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR (4/12 = 33%) ── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Blood Pressure History Chart Card */}
          {bpData.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> BP Trends
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Last 10 Records</span>
              </div>

              <div className="h-40 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpData}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[60, 180]} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="sys" stroke="#2563eb" strokeWidth={2.5} name="Systolic" dot={false} />
                    <Line type="monotone" dataKey="dia" stroke="#16a34a" strokeWidth={2.5} name="Diastolic" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Drug Safety & Interaction Monitor */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  interactionAlerts.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {interactionAlerts.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Safety & Interaction Check</h3>
              </div>

              <span className={`w-3 h-3 rounded-full ${interactionAlerts.length > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            </div>

            {interactionAlerts.length > 0 ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-amber-800">Potential Interactions Found:</p>
                <ul className="text-xs text-amber-700 space-y-1 pl-4 list-disc font-medium">
                  {interactionAlerts.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                ✓ No major drug-drug interactions detected for selected medications. Safe to proceed.
              </p>
            )}
          </div>

          {/* Previous Prescriptions History Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Previous Prescriptions
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {previousPrescriptions.length} Records
              </span>
            </div>

            {previousPrescriptions.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {previousPrescriptions.slice(0, 5).map((rx) => (
                  <div key={rx.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50/50 transition space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Rx #{rx.id}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {rx.diagnosis || rx.chiefComplaint || 'Consultation Record'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-400">No prior prescription records.</p>
              </div>
            )}
          </div>

          {/* AI Clinical Assistant Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 text-purple-300 rounded-2xl flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">AI Clinical Assistant</h3>
                <p className="text-[10px] text-indigo-200">Powered by Healthcare Clinical AI</p>
              </div>
            </div>

            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              Analyze prescription items against patient diagnosis and medical history to verify dosage guidelines and safety rules.
            </p>

            <button 
              onClick={handleAiCheck}
              disabled={aiInsightMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiInsightMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4 text-purple-200" />
              )}
              Run AI Diagnostic Check
            </button>
          </div>

        </div>

      </div>

      {/* ─── MODALS ─── */}

      {/* Patient Vitals Edit Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Patient Details & Vitals</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select 
                    value={editProfile.bloodGroup} 
                    onChange={e => setEditProfile({...editProfile, bloodGroup: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allergies</label>
                  <input 
                    type="text" 
                    value={editProfile.allergies} 
                    onChange={e => setEditProfile({...editProfile, allergies: e.target.value})}
                    placeholder="e.g. Penicillin, Peanuts"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input 
                    type="number" 
                    value={editProfile.heightCm} 
                    onChange={e => setEditProfile({...editProfile, heightCm: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={editProfile.weightKg} 
                    onChange={e => setEditProfile({...editProfile, weightKg: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Pressure</label>
                  <input 
                    type="text" 
                    value={editProfile.bloodPressure} 
                    onChange={e => setEditProfile({...editProfile, bloodPressure: e.target.value})}
                    placeholder="e.g. 120/80"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pulse (bpm)</label>
                  <input 
                    type="number" 
                    value={editProfile.pulseBpm} 
                    onChange={e => setEditProfile({...editProfile, pulseBpm: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={editProfileMutation.isPending || saveVitalsMutation.isPending}
                className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition flex items-center gap-2"
              >
                {(editProfileMutation.isPending || saveVitalsMutation.isPending) ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Selection Modal */}
      {isPharmacyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-base">Select Pharmacy / Pharmacist</h3>
              <button 
                onClick={() => setIsPharmacyModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assign To Pharmacist</label>
                <select 
                  value={selectedPharmacyUserId} 
                  onChange={e => setSelectedPharmacyUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Any Available Pharmacist</option>
                  {pharmacyUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  Selecting "Any Available Pharmacist" will dispatch the electronic prescription to all authorized pharmacy personnel.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsPharmacyModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSendToPharmacy}
                disabled={sendToPharmacyMutation.isPending}
                className="px-5 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {sendToPharmacyMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Dispatch to Pharmacy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CDS Safety Block Modal */}
      {isCdsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <h3 className="font-extrabold text-rose-900 text-lg">Critical Safety Contraindication Alert</h3>
            </div>
            
            <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto text-xs">
              <p className="text-slate-700 font-bold">
                The prescription was automatically flagged and blocked by Clinical Decision Support (CDS) due to severe contraindications:
              </p>
              <ul className="list-disc pl-5 text-rose-700 font-semibold space-y-2">
                {cdsBlockedAlerts.map((alert, idx) => (
                  <li key={idx}><strong>{alert}</strong></li>
                ))}
              </ul>
              <p className="text-slate-500 font-medium">
                Please modify the medicine items or dosage before re-submitting.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsCdsModalOpen(false)}
                className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition"
              >
                Acknowledge & Revise Rx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h3 className="font-extrabold text-indigo-900 text-lg">AI Clinical Safety & Treatment Insights</h3>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto text-xs">
              <div className="prose prose-sm prose-indigo whitespace-pre-wrap font-medium text-slate-800">
                {aiInsight}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewPrescription;
