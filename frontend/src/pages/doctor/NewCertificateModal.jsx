import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Search, 
  User, 
  Calendar, 
  CheckCircle2, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Award,
  AlertCircle,
  PenTool,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';

const CLINICAL_PRESETS = [
  {
    label: 'Bed Rest (Sick Leave)',
    icon: '🛌',
    type: 'Sick Leave Certificate',
    diagnosis: 'Acute Viral Pharyngitis with Pyrexia',
    clinicalReport: 'Patient presented with 3-day history of sore throat, malaise, and fever (100.8°F). Physical examination showed inflamed pharyngeal mucosa and tender cervical lymphadenopathy. Chest clear to auscultation.',
    remarks: 'Advised strict home bed rest for 5 days. Avoid physical exertion and public contact. Stay hydrated and take prescribed antipyretics.',
    days: '5'
  },
  {
    label: 'Fit to Resume Duty',
    icon: '✅',
    type: 'Fitness Certificate',
    diagnosis: 'General Physical & Occupational Fitness',
    clinicalReport: 'Comprehensive routine medical examination completed. Vital signs stable (BP 120/80 mmHg, PR 72 bpm, SpO2 99%). Systemic examination (CVS, RS, CNS) revealed no abnormalities. Laboratory screening within normal limits.',
    remarks: 'The patient has been evaluated clinically and is certified physically and mentally fit to resume all routine professional and workplace duties.',
    days: '30'
  },
  {
    label: 'Fit to Fly (Travel)',
    icon: '✈️',
    type: 'Travel Certificate',
    diagnosis: 'Pre-Travel Medical Clearance',
    clinicalReport: 'Pre-departure travel health assessment performed. Cardiovascular and respiratory parameters are fully stable with no contraindications for pressurized cabin flight or long-haul domestic/international air travel.',
    remarks: 'Certified fit for air travel. Patient advised to maintain adequate cabin hydration and carry personal prophylactic medications.',
    days: '60'
  },
  {
    label: 'Workplace Light Duty',
    icon: '🪑',
    type: 'Handicap Certificate',
    diagnosis: 'Acute Lumbar Musculoskeletal Strain',
    clinicalReport: 'Patient presented with localized lower back discomfort following physical strain. Physical assessment indicates paravertebral muscle spasm without neurological radiculopathy.',
    remarks: 'Advised temporary modification to light desk duty only for 14 days. Avoid heavy weight lifting (>5 kg), prolonged bending, or strenuous physical loading.',
    days: '14'
  }
];

const NewCertificateModal = ({ 
  isOpen, 
  onClose, 
  onAddCertificate,
  editCertificate = null,
  onUpdateCertificate = null 
}) => {
  const { user } = useAuthStore();

  // Helper for current formatted date & time
  const now = new Date();
  const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const todayTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Doctor credentials derived from logged-in user
  const initialDoctorName = user?.name 
    ? (user.name.toLowerCase().startsWith('dr') ? user.name : `Dr. ${user.name}`)
    : (user?.firstName ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Dr. Sarah Jenkins, MD');

  const initialDoctorId = user?.id ? `DOC-${String(user.id).padStart(4, '0')}` : 'DOC-4829';
  const initialDoctorDept = user?.department || user?.specialty || 'General Medicine';
  const initialDoctorRegNo = user?.registrationNumber || 'KMC-2024-884920';

  const [formData, setFormData] = useState({
    doctorName: initialDoctorName,
    doctorId: initialDoctorId,
    doctorDepartment: initialDoctorDept,
    doctorRegNo: initialDoctorRegNo,
    patientName: '',
    patientDetails: '35 Years, Male',
    patientId: '',
    certificateType: 'Fitness Certificate',
    diagnosis: 'General Physical Fitness',
    clinicalReport: 'Patient clinically evaluated. Vital signs within normal physiological limits (BP 120/80 mmHg, HR 72 bpm). No active cardiopulmonary or systemic complaints.',
    remarks: 'Certified medically fit to resume all routine professional and daily physical activities.',
    issueDate: todayDateStr,
    issueTime: todayTimeStr,
    durationDays: '30'
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Sync editCertificate when opening in edit mode vs new mode
  useEffect(() => {
    if (editCertificate) {
      setFormData({
        doctorName: editCertificate.doctor?.name || initialDoctorName,
        doctorId: editCertificate.doctor?.id || initialDoctorId,
        doctorDepartment: editCertificate.doctor?.department || initialDoctorDept,
        doctorRegNo: editCertificate.doctor?.regNo || initialDoctorRegNo,
        patientName: editCertificate.patient?.name || '',
        patientDetails: editCertificate.patient?.details || '35 Years, Male',
        patientId: editCertificate.patient?.id ? `P-${editCertificate.patient.id}` : '',
        certificateType: editCertificate.type?.name || 'Fitness Certificate',
        diagnosis: editCertificate.diagnosis || editCertificate.type?.sub || '',
        clinicalReport: editCertificate.clinicalReport || '',
        remarks: editCertificate.remarks || '',
        issueDate: editCertificate.issueDate || todayDateStr,
        issueTime: editCertificate.issueTime || todayTimeStr,
        durationDays: editCertificate.durationDays || '14'
      });
      setSelectedPatient(editCertificate.patient || null);
    } else if (isOpen) {
      setFormData({
        doctorName: initialDoctorName,
        doctorId: initialDoctorId,
        doctorDepartment: initialDoctorDept,
        doctorRegNo: initialDoctorRegNo,
        patientName: '',
        patientDetails: '35 Years, Male',
        patientId: '',
        certificateType: 'Fitness Certificate',
        diagnosis: 'General Physical Fitness',
        clinicalReport: 'Patient clinically evaluated. Vital signs within normal physiological limits (BP 120/80 mmHg, HR 72 bpm). No active cardiopulmonary or systemic complaints.',
        remarks: 'Certified medically fit to resume all routine professional and daily physical activities.',
        issueDate: todayDateStr,
        issueTime: todayTimeStr,
        durationDays: '30'
      });
      setSelectedPatient(null);
    }
  }, [editCertificate, isOpen]);

  // Search existing patients from backend if available
  const { data: patientResults = [] } = useQuery({
    queryKey: ['patientSearchCertificate', patientSearch],
    queryFn: async () => {
      if (!patientSearch || patientSearch.length < 2) return [];
      try {
        const res = await axiosPrivate.get(`/patients/search?query=${encodeURIComponent(patientSearch)}`);
        return res.data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && patientSearch.length >= 2
  });

  if (!isOpen) return null;

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || 'Patient';
    const ageGender = [p.age ? `${p.age} Years` : 'Adult', p.gender || 'Male'].filter(Boolean).join(', ');
    setFormData(prev => ({
      ...prev,
      patientName: fullName,
      patientDetails: ageGender,
      patientId: p.id ? `P-${p.id}` : ''
    }));
    setPatientSearch('');
  };

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      certificateType: preset.type,
      diagnosis: preset.diagnosis,
      clinicalReport: preset.clinicalReport,
      remarks: preset.remarks,
      durationDays: preset.days
    }));
    toast.success(`Applied template: ${preset.label}`);
  };

  // Calculated validity target date string
  const validUntilDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (parseInt(formData.durationDays, 10) || 7));
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  // --- SAVE DRAFT HANDLER (Saves certificate with Draft status, no seal/signature until issued) ---
  const handleSaveDraft = (e) => {
    if (e) e.preventDefault();
    if (!formData.patientName.trim()) {
      toast.error('Please enter patient name before saving draft');
      return;
    }

    const issueDateObj = new Date();
    const validTillObj = new Date();
    validTillObj.setDate(validTillObj.getDate() + (parseInt(formData.durationDays, 10) || 7));

    const finalIssueDate = issueDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const finalIssueTime = issueDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const finalValidTill = validTillObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const isSick = formData.certificateType.toLowerCase().includes('sick');
    const isTravel = formData.certificateType.toLowerCase().includes('travel');
    const isHandicap = formData.certificateType.toLowerCase().includes('handicap');

    if (editCertificate) {
      const updatedDraft = {
        ...editCertificate,
        patient: { 
          ...editCertificate.patient,
          name: formData.patientName.trim(), 
          details: formData.patientDetails || 'Adult Patient'
        },
        doctor: {
          name: formData.doctorName.trim() || 'Dr. Sarah Jenkins, MD',
          id: formData.doctorId.trim() || 'DOC-4829',
          department: formData.doctorDepartment.trim() || 'General Medicine',
          regNo: formData.doctorRegNo.trim() || 'KMC-2024-884920'
        },
        type: { 
          ...editCertificate.type,
          name: formData.certificateType, 
          sub: formData.diagnosis || 'Clinical Assessment', 
          iconName: isSick ? 'Activity' : isTravel ? 'Plane' : isHandicap ? 'Briefcase' : 'FileText',
          iconColor: isSick 
            ? 'text-red-500 bg-red-50' 
            : isTravel 
            ? 'text-green-600 bg-green-50' 
            : isHandicap 
            ? 'text-orange-500 bg-orange-50' 
            : 'text-[#2160FF] bg-blue-50' 
        },
        diagnosis: formData.diagnosis,
        clinicalReport: formData.clinicalReport,
        remarks: formData.remarks,
        durationDays: formData.durationDays,
        validTill: finalValidTill,
        status: 'Draft',
        statusColor: 'blue'
      };

      if (onUpdateCertificate) {
        onUpdateCertificate(updatedDraft);
      }
      toast.success(`Draft Certificate ${updatedDraft.id} saved successfully!`);
      onClose();
      return;
    }

    const newDraftCert = {
      id: `MC-${String(Math.floor(1000 + Math.random() * 9000))}`,
      patient: { 
        name: formData.patientName.trim(), 
        details: formData.patientDetails || 'Adult Patient', 
        id: selectedPatient?.id || Math.floor(Math.random() * 100) 
      },
      doctor: {
        name: formData.doctorName.trim() || 'Dr. Sarah Jenkins, MD',
        id: formData.doctorId.trim() || 'DOC-4829',
        department: formData.doctorDepartment.trim() || 'General Medicine',
        regNo: formData.doctorRegNo.trim() || 'KMC-2024-884920'
      },
      type: { 
        name: formData.certificateType, 
        sub: formData.diagnosis || 'Clinical Assessment', 
        iconName: isSick ? 'Activity' : isTravel ? 'Plane' : isHandicap ? 'Briefcase' : 'FileText',
        iconColor: isSick 
          ? 'text-red-500 bg-red-50' 
          : isTravel 
          ? 'text-green-600 bg-green-50' 
          : isHandicap 
          ? 'text-orange-500 bg-orange-50' 
          : 'text-[#2160FF] bg-blue-50' 
      },
      diagnosis: formData.diagnosis,
      clinicalReport: formData.clinicalReport,
      remarks: formData.remarks,
      durationDays: formData.durationDays,
      issueDate: finalIssueDate,
      issueTime: finalIssueTime,
      validTill: finalValidTill,
      status: 'Draft',
      statusColor: 'blue'
    };

    if (onAddCertificate) {
      onAddCertificate(newDraftCert);
    }
    toast.success(`Certificate ${newDraftCert.id} saved as Draft! (Seal and signature will be applied upon issuance)`);
    onClose();
  };

  // --- ISSUE & DIGITALLY SIGN HANDLER ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }

    const issueDateObj = new Date();
    const validTillObj = new Date();
    validTillObj.setDate(validTillObj.getDate() + (parseInt(formData.durationDays, 10) || 7));

    const finalIssueDate = issueDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const finalIssueTime = issueDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const finalValidTill = validTillObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const isSick = formData.certificateType.toLowerCase().includes('sick');
    const isTravel = formData.certificateType.toLowerCase().includes('travel');
    const isHandicap = formData.certificateType.toLowerCase().includes('handicap');

    // If Editing an existing draft certificate and issuing it directly
    if (editCertificate) {
      const updatedCert = {
        ...editCertificate,
        patient: { 
          ...editCertificate.patient,
          name: formData.patientName.trim(), 
          details: formData.patientDetails || 'Adult Patient'
        },
        doctor: {
          name: formData.doctorName.trim() || 'Dr. Sarah Jenkins, MD',
          id: formData.doctorId.trim() || 'DOC-4829',
          department: formData.doctorDepartment.trim() || 'General Medicine',
          regNo: formData.doctorRegNo.trim() || 'KMC-2024-884920'
        },
        type: { 
          ...editCertificate.type,
          name: formData.certificateType, 
          sub: formData.diagnosis || 'Clinical Assessment', 
          iconName: isSick ? 'Activity' : isTravel ? 'Plane' : isHandicap ? 'Briefcase' : 'FileText',
          iconColor: isSick 
            ? 'text-red-500 bg-red-50' 
            : isTravel 
            ? 'text-green-600 bg-green-50' 
            : isHandicap 
            ? 'text-orange-500 bg-orange-50' 
            : 'text-[#2160FF] bg-blue-50' 
        },
        diagnosis: formData.diagnosis,
        clinicalReport: formData.clinicalReport,
        remarks: formData.remarks,
        durationDays: formData.durationDays,
        validTill: finalValidTill,
        issueDate: finalIssueDate,
        issueTime: finalIssueTime,
        status: 'Issued',
        statusColor: 'green'
      };

      if (onUpdateCertificate) {
        onUpdateCertificate(updatedCert);
      }
      toast.success(`Certificate ${updatedCert.id} officially issued with clinic seal and digital signature!`);
      onClose();
      return;
    }

    // Creating a new certificate with Issued status
    const newCert = {
      id: `MC-${String(Math.floor(1000 + Math.random() * 9000))}`,
      patient: { 
        name: formData.patientName.trim(), 
        details: formData.patientDetails || 'Adult Patient', 
        id: selectedPatient?.id || Math.floor(Math.random() * 100) 
      },
      doctor: {
        name: formData.doctorName.trim() || 'Dr. Sarah Jenkins, MD',
        id: formData.doctorId.trim() || 'DOC-4829',
        department: formData.doctorDepartment.trim() || 'General Medicine',
        regNo: formData.doctorRegNo.trim() || 'KMC-2024-884920'
      },
      type: { 
        name: formData.certificateType, 
        sub: formData.diagnosis || 'Clinical Assessment', 
        iconName: isSick ? 'Activity' : isTravel ? 'Plane' : isHandicap ? 'Briefcase' : 'FileText',
        iconColor: isSick 
          ? 'text-red-500 bg-red-50' 
          : isTravel 
          ? 'text-green-600 bg-green-50' 
          : isHandicap 
          ? 'text-orange-500 bg-orange-50' 
          : 'text-[#2160FF] bg-blue-50' 
      },
      diagnosis: formData.diagnosis,
      clinicalReport: formData.clinicalReport,
      remarks: formData.remarks,
      durationDays: formData.durationDays,
      issueDate: finalIssueDate,
      issueTime: finalIssueTime,
      validTill: finalValidTill,
      status: 'Issued',
      statusColor: 'green'
    };

    if (onAddCertificate) {
      onAddCertificate(newCert);
    }
    toast.success(`Medical Certificate ${newCert.id} successfully issued by ${newCert.doctor.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 lg:p-8 font-sans overflow-y-auto">
      {/* WIDER RESPONSIVE MODAL CONTAINER */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[96vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 text-white ${
              editCertificate ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-[#2160FF] shadow-blue-500/20'
            }`}>
              {editCertificate ? <PenTool size={22} strokeWidth={2.5} /> : <Stethoscope size={22} strokeWidth={2.5} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 m-0 tracking-tight">
                  {editCertificate ? `Edit Draft Certificate (${editCertificate.id})` : 'Write Clinical Report & Issue Certificate'}
                </h2>
                {editCertificate && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Draft Status
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 m-0 mt-0.5">
                {editCertificate 
                  ? 'Update patient details, clinical findings, and recommendations prior to official issuance'
                  : 'Generate clinical evaluation findings, diagnostic prose, and digitally sign verified medical certificates'
                }
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body with 2-Column Responsive Desktop Grid */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (6/12 on LG+): Doctor Info, Patient Particulars, Type & Validity */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Section 1: Issuing Doctor Details Card */}
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={16} className="text-blue-600" />
                    Issuing Doctor Credentials & Section
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                    Authorized Issuer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Doctor Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.doctorName}
                      onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Doctor ID / Reg No *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. DOC-4829"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Section / Department *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.doctorDepartment}
                      onChange={(e) => setFormData({...formData, doctorDepartment: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. General Medicine"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Patient Particulars */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={16} className="text-[#2160FF]" />
                    Patient Particulars
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Verify recipient patient</span>
                </div>

                {/* Patient Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search registered patient by name, phone or ID to auto-fill..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                      {patientResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{p.firstName} {p.lastName}</span>
                            <span className="text-slate-500 ml-2">({p.gender || 'Adult'}, Age: {p.age || 'N/A'})</span>
                          </div>
                          <span className="text-blue-600 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Select Patient
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Patient Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Robert Williams"
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age & Gender</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 45 Years, Male"
                      value={formData.patientDetails}
                      onChange={(e) => setFormData({...formData, patientDetails: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Certificate Type & Validity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={16} className="text-[#2160FF]" />
                    Type & Period of Validity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Type</label>
                    <select 
                      value={formData.certificateType}
                      onChange={(e) => setFormData({...formData, certificateType: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all cursor-pointer"
                    >
                      <option value="Fitness Certificate">Fitness Certificate</option>
                      <option value="Sick Leave Certificate">Sick Leave Certificate</option>
                      <option value="Travel Certificate">Travel Medical Certificate</option>
                      <option value="Medical Fitness">Medical Fitness (Employment)</option>
                      <option value="Handicap Certificate">Handicap / Disability Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Validity (Days from Today)</label>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="number" 
                        min="1"
                        max="365"
                        value={formData.durationDays}
                        onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
                        className="w-24 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all text-center"
                      />
                      <div className="text-[11px] text-slate-500 font-medium">
                        Valid until <strong className="text-emerald-700">{validUntilDateStr}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Quick Clinical Templates */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Quick Clinical Presets (Click to Auto-fill)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CLINICAL_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (6/12 on LG+): Diagnosis, Clinical Findings, Recommendations & Preview */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Clinical Diagnosis */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={16} className="text-[#2160FF]" />
                    Clinical Diagnosis & Certified Condition
                  </span>
                </div>
                <div>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Acute Upper Respiratory Infection with Pyrexia"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
                  />
                </div>
              </div>

              {/* Doctor's Written Clinical Findings & Examination Report */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Doctor's Written Clinical Examination Report
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Physical exam & vitals</span>
                </div>
                <textarea 
                  rows={4}
                  placeholder="Document physical examination findings, vitals (BP, PR, temp), auscultation observations, and systemic evaluation..."
                  value={formData.clinicalReport}
                  onChange={(e) => setFormData({...formData, clinicalReport: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all resize-none"
                />
              </div>

              {/* Medical Advice, Directives & Restrictions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Medical Advice, Rest Directives & Restrictions
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Leave guidance</span>
                </div>
                <textarea 
                  rows={3}
                  placeholder="Specify recommended medical leave period, workplace duty modifications, physical precautions, or follow-up schedule..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all resize-none"
                />
              </div>

              {/* Live Issuance Summary Card */}
              <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/90 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-blue-900 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-blue-600" />
                    {editCertificate ? 'Draft Certificate Status' : 'Digital Certificate Issuance Summary'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    editCertificate ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {editCertificate ? 'Draft Record' : 'Verified OPD'}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed m-0 text-[11px]">
                  Document scheduled under the authority of <strong>{formData.doctorName}</strong> ({formData.doctorId}, {formData.doctorDepartment}) and valid until <strong>{validUntilDateStr}</strong>.
                </p>
              </div>

            </div>

          </div>

          {/* Form Actions Footer with Save Draft Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
              <span>
                {editCertificate 
                  ? 'Saving draft changes keeps certificate unsealed until officially approved.' 
                  : 'Save as draft to review later, or issue directly with official seal and digital signature.'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <button 
                type="button" 
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                Cancel
              </button>

              {/* SAVE AS DRAFT BUTTON */}
              <button 
                type="button" 
                onClick={handleSaveDraft}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Save size={15} className="text-amber-600" />
                {editCertificate ? 'Save Draft Changes' : 'Save as Draft'}
              </button>

              {/* ISSUE & DIGITALLY SIGN BUTTON */}
              <button 
                type="submit"
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2 shrink-0 ${
                  editCertificate 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                    : 'bg-[#2160FF] hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                <CheckCircle2 size={17} />
                {editCertificate ? 'Update & Issue Certificate' : 'Issue & Digitally Sign Certificate'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewCertificateModal;
