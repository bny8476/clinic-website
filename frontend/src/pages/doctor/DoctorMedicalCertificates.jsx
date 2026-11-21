import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  ArrowUp, 
  Briefcase, 
  ChevronDown, 
  Download, 
  Eye, 
  FileText, 
  MoreVertical, 
  PenTool, 
  Plane, 
  Plus, 
  Search, 
  Trash2, 
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  ShieldCheck,
  Stethoscope,
  Clock,
  Award,
  Building2,
  Stamp
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import NewCertificateModal from './NewCertificateModal';
import useAuthStore from '../../store/authStore';

// Helper for dynamic formatting relative to current real date
const formatDate = (date) => {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getDateWithOffset = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d;
};

// Check if a certificate's validity date is completed / passed
const isDateExpired = (validTillStr) => {
  if (!validTillStr) return false;
  try {
    const d = new Date(validTillStr);
    if (!isNaN(d.getTime())) {
      // Set to the end of that day (23:59:59.999) so it is valid throughout that full day
      d.setHours(23, 59, 59, 999);
      return d.getTime() < Date.now();
    }
  } catch {
    return false;
  }
  return false;
};

// Automatically evaluate and synchronize certificate status according to its validity date
const syncCertificateExpiration = (cert) => {
  if (!cert) return cert;
  // If the certificate is Deleted (or legacy Cancelled), remain Deleted
  if (cert.status === 'Deleted' || cert.status === 'Cancelled') {
    return {
      ...cert,
      status: 'Deleted',
      statusColor: 'red'
    };
  }
  // If the certificate is still in Draft state, remain Draft until officially issued
  if (cert.status === 'Draft') return cert;

  const expired = isDateExpired(cert.validTill);
  if (expired) {
    if (cert.status !== 'Expired') {
      return {
        ...cert,
        status: 'Expired',
        statusColor: 'orange'
      };
    }
  } else {
    // If validity date is in the future and status was Expired, restore to active Issued
    if (cert.status === 'Expired') {
      return {
        ...cert,
        status: 'Issued',
        statusColor: 'green'
      };
    }
  }
  return cert;
};

// Generate initial certificates relative to CURRENT real-time date
const generateInitialCertificates = (defaultDoctor) => {
  const doc = defaultDoctor || {
    name: 'Dr. Sarah Jenkins, MD',
    id: 'DOC-4829',
    department: 'Department of General Medicine',
    regNo: 'KMC-2024-884920'
  };

  return [
    {
      id: 'MC-0001',
      patient: { name: 'Robert Williams', details: '45 Years, Male', id: 1 },
      doctor: doc,
      type: { name: 'Fitness Certificate', sub: 'General Fitness Evaluation', iconName: 'FileText', iconColor: 'text-[#2160FF] bg-blue-50' },
      diagnosis: 'General Physical & Occupational Fitness',
      clinicalReport: 'Comprehensive routine medical examination completed. Vital signs stable (BP 120/80 mmHg, PR 72 bpm, SpO2 99%). Systemic examination (CVS, RS, CNS) revealed no abnormalities. Laboratory screening within normal physiological limits.',
      remarks: 'Patient is clinically evaluated and found medically fit for all routine physical and professional duties without restriction.',
      durationDays: '30',
      issueDate: formatDate(new Date()),
      issueTime: '09:30 AM',
      validTill: formatDate(getDateWithOffset(30)),
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0002',
      patient: { name: 'Emily Davis', details: '36 Years, Female', id: 2 },
      doctor: {
        name: 'Dr. Marcus Vance, MD',
        id: 'DOC-3102',
        department: 'Pulmonology & Respiratory Medicine',
        regNo: 'MCI-2023-419082'
      },
      type: { name: 'Sick Leave Certificate', sub: 'Acute Pharyngitis & Fever', iconName: 'Activity', iconColor: 'text-red-500 bg-red-50' },
      diagnosis: 'Acute Viral Pharyngitis with Moderate Pyrexia',
      clinicalReport: 'Patient presented with 3-day history of sore throat, pyrexia (101°F), and headache. Physical examination showed erythematous posterior pharynx and bilateral submandibular lymphadenopathy.',
      remarks: 'Advised 5 days strict bed rest and absence from duties. Maintain hydration and complete prescribed oral antipyretic course.',
      durationDays: '5',
      issueDate: formatDate(getDateWithOffset(-1)),
      issueTime: '08:45 AM',
      validTill: formatDate(getDateWithOffset(4)),
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0003',
      patient: { name: 'Michael Johnson', details: '50 Years, Male', id: 3 },
      doctor: {
        name: 'Dr. Elena Rostova, MD',
        id: 'DOC-5912',
        department: 'Family Medicine & Post-Op Care',
        regNo: 'MCI-2024-991204'
      },
      type: { name: 'Medical Leave', sub: 'Convalescence & Care', iconName: 'Briefcase', iconColor: 'text-orange-500 bg-orange-50' },
      diagnosis: 'Post-Surgical Abdominal Convalescence',
      clinicalReport: 'Follow-up examination post laparoscopic cholecystectomy. Surgical incision healing satisfactorily without signs of infection or hematoma.',
      remarks: 'Advised temporary medical leave for convalescence. Restricted from strenuous abdominal strain or lifting heavy loads.',
      durationDays: '14',
      issueDate: formatDate(getDateWithOffset(-2)),
      issueTime: '11:30 AM',
      validTill: formatDate(getDateWithOffset(12)),
      status: 'Draft',
      statusColor: 'blue'
    },
    {
      id: 'MC-0004',
      patient: { name: 'Sarah Wilson', details: '34 Years, Female', id: 4 },
      doctor: doc,
      type: { name: 'Travel Certificate', sub: 'International Flight Clearance', iconName: 'Plane', iconColor: 'text-green-600 bg-green-50' },
      diagnosis: 'Pre-Travel Health & Cardiorespiratory Clearance',
      clinicalReport: 'Pre-departure travel health assessment performed. Cardiovascular and respiratory parameters are fully stable with no contraindications for commercial air travel.',
      remarks: 'Certified fit for domestic and international air travel with standard inflight medical prophylaxis.',
      durationDays: '60',
      issueDate: formatDate(getDateWithOffset(-3)),
      issueTime: '02:30 PM',
      validTill: formatDate(getDateWithOffset(60)),
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0005',
      patient: { name: 'David Brown', details: '47 Years, Male', id: 5 },
      doctor: {
        name: 'Dr. Alexander Fleming, MD',
        id: 'DOC-2041',
        department: 'Occupational Health',
        regNo: 'KMC-2022-771890'
      },
      type: { name: 'Medical Fitness', sub: 'Pre-Employment Assessment', iconName: 'FileText', iconColor: 'text-blue-500 bg-blue-50' },
      diagnosis: 'Pre-Employment Occupational Clearance',
      clinicalReport: 'Comprehensive employment medical screening completed. Audiometry, visual acuity (6/6 corrected), and spirometry within normal parameters.',
      remarks: 'Pre-employment fitness assessment completed. Cleared for administrative and corporate desk duties.',
      durationDays: '180',
      issueDate: formatDate(getDateWithOffset(-4)),
      issueTime: '03:15 PM',
      validTill: formatDate(getDateWithOffset(180)),
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0006',
      patient: { name: 'Linda Taylor', details: '40 Years, Female', id: 6 },
      doctor: {
        name: 'Dr. Alan Grant, MD',
        id: 'DOC-7193',
        department: 'Department of Orthopedics',
        regNo: 'MCI-2021-338291'
      },
      type: { name: 'Handicap Certificate', sub: 'Orthopedic Rehabilitation', iconName: 'FileText', iconColor: 'text-[#2160FF] bg-blue-50' },
      diagnosis: 'Right Knee Ligament Repair Rehabilitation',
      clinicalReport: 'Post-ACL ligament reconstruction evaluation. Active range of motion 0-110 degrees with mild residual joint effusion.',
      remarks: 'Temporary mobility adjustment advised. Cleared for sedentary duties with ergonomic seating and minimal stair climbing.',
      durationDays: '365',
      issueDate: formatDate(getDateWithOffset(-5)),
      issueTime: '10:00 AM',
      validTill: formatDate(getDateWithOffset(365)),
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0007',
      patient: { name: 'Daniel Martinez', details: '41 Years, Male', id: 7 },
      doctor: doc,
      type: { name: 'Sick Leave Certificate', sub: 'Acute Migraine Episode', iconName: 'Activity', iconColor: 'text-red-500 bg-red-50' },
      diagnosis: 'Acute Migraine with Photophobia',
      clinicalReport: 'Patient presented during acute migraine attack with unilateral throbbing headache, photophobia, and nausea. Neurological screening normal.',
      remarks: 'Acute migraine episode requiring pharmacological rest in dark environment.',
      durationDays: '3',
      issueDate: formatDate(getDateWithOffset(-10)),
      issueTime: '01:10 PM',
      validTill: formatDate(getDateWithOffset(-7)),
      status: 'Expired',
      statusColor: 'red'
    },
    {
      id: 'MC-0008',
      patient: { name: 'Patricia Harris', details: '38 Years, Female', id: 8 },
      doctor: {
        name: 'Dr. Marcus Vance, MD',
        id: 'DOC-3102',
        department: 'Cardiology',
        regNo: 'MCI-2023-419082'
      },
      type: { name: 'Fitness Certificate', sub: 'Sports & Marathon Clearance', iconName: 'FileText', iconColor: 'text-orange-500 bg-orange-50' },
      diagnosis: 'Cardiovascular Sports Evaluation',
      clinicalReport: 'Pre-marathon fitness evaluation requested. Treadmill stress test showed elevated early recovery pulse requiring further 24-hr Holter monitoring.',
      remarks: 'Certificate record deleted and archived by attending doctor.',
      durationDays: '90',
      issueDate: formatDate(getDateWithOffset(-12)),
      issueTime: '09:05 AM',
      validTill: formatDate(getDateWithOffset(90)),
      status: 'Deleted',
      statusColor: 'red'
    }
  ];
};

// --- AUTHENTIC ROUNDED CIRCLE CLINIC OFFICIAL SEAL COMPONENT ---
const ClinicOfficialSeal = ({ isIssued, certNo, issueDate }) => {
  if (!isIssued) {
    return (
      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full aspect-square border-2 border-dashed border-amber-400 bg-amber-50/70 p-3 flex flex-col items-center justify-center text-center select-none shadow-xs -rotate-3">
        <Stamp size={22} className="text-amber-500 mb-1" />
        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
          UNSEALED DRAFT
        </span>
        <span className="text-[8.5px] text-amber-700 font-semibold leading-tight mt-0.5 block">
          Round seal stamped on issuance
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block select-none group">
      {/* Authentic Rounded Circle Rubber Stamp Seal in Rich Blue Ink */}
      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full aspect-square -rotate-6 hover:rotate-0 transition-transform duration-300 drop-shadow-sm flex items-center justify-center">
        <svg 
          viewBox="0 0 150 150" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Curved Top Arc Path */}
            <path 
              id="topCircleArc" 
              d="M 18,75 A 57,57 0 1,1 132,75" 
              fill="none" 
            />
            {/* Curved Bottom Arc Path */}
            <path 
              id="bottomCircleArc" 
              d="M 132,75 A 57,57 0 0,1 18,75" 
              fill="none" 
            />
          </defs>

          {/* Outer Border Circle */}
          <circle cx="75" cy="75" r="71" stroke="#1e40af" strokeWidth="2.8" fill="#eff6ff" fillOpacity="0.45" />
          
          {/* Concentric Dashed Inner Ring */}
          <circle cx="75" cy="75" r="65" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3.5 2.5" fill="none" />
          
          {/* Third Inner Solid Circle */}
          <circle cx="75" cy="75" r="44" stroke="#1e40af" strokeWidth="1.6" fill="#dbeafe" fillOpacity="0.4" />

          {/* Top Curved Text */}
          <text fill="#1e3a8a" fontSize="8.2" fontWeight="900" letterSpacing="2.2">
            <textPath href="#topCircleArc" startOffset="50%" textAnchor="middle">
              ★ ELIXIR HEALTH CARE ★
            </textPath>
          </text>

          {/* Bottom Curved Text */}
          <text fill="#1d4ed8" fontSize="7.2" fontWeight="800" letterSpacing="1.8">
            <textPath href="#bottomCircleArc" startOffset="50%" textAnchor="middle">
              ★ REGD: MED-KA-8842 ★
            </textPath>
          </text>

          {/* Center Medical Emblem & Inscription */}
          <g transform="translate(75, 68)">
            {/* Medical Cross Icon */}
            <path 
              d="M -4,-12 H 4 V -4 H 12 V 4 H 4 V 12 H -4 V 4 H -12 V -4 H -4 Z" 
              fill="#1e40af" 
            />
            <text y="21" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="900" letterSpacing="0.8">
              OFFICIAL SEAL
            </text>
            <text y="29" textAnchor="middle" fill="#16a34a" fontSize="6.5" fontWeight="800" letterSpacing="0.5">
              VERIFIED & ISSUED
            </text>
          </g>
        </svg>
      </div>

      <div className="text-center mt-1">
        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
          ✓ Rounded Seal Affixed
        </span>
      </div>
    </div>
  );
};

// --- DOCTOR DIGITAL SIGNATURE COMPONENT (PERSONALIZED TO DOCTOR NAME) ---
const DoctorDigitalSignature = ({ doctorName, doctorId, isIssued, issueDate, issueTime, department }) => {
  const cleanName = doctorName || 'Dr. Attending Physician, MD';

  if (!isIssued) {
    return (
      <div className="w-60 p-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 text-center select-none ml-auto">
        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">
          SIGNATURE PENDING
        </span>
        <span className="text-[9px] text-amber-600 font-medium block mt-0.5">
          Digital signature will be affixed once certificate is issued
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-right select-none ml-auto">
      {/* Cursive Handwritten Digital Signature SVG matching Doctor Name */}
      <div className="relative inline-block pr-2">
        <div className="h-12 flex items-center justify-end">
          <svg 
            viewBox="0 0 240 50" 
            className="w-52 h-12 text-blue-900 drop-shadow-xs"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cursive Doctor Name Handwriting Script */}
            <text 
              x="220" 
              y="32" 
              textAnchor="end"
              fill="#1e3a8a" 
              fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', 'Great Vibes', cursive, serif" 
              fontSize="24" 
              fontStyle="italic"
              fontWeight="600"
              transform="rotate(-2 220 32)"
            >
              {cleanName.startsWith('Dr') ? cleanName : `Dr. ${cleanName}`}
            </text>
            {/* Elegant Calligraphy Flourish Strokes */}
            <path 
              d="M 25 38 Q 85 26, 150 42 T 225 32" 
              stroke="#1d4ed8" 
              strokeWidth="1.6" 
              strokeLinecap="round" 
              fill="none"
              opacity="0.8" 
            />
            <path 
              d="M 130 40 Q 165 48, 205 35" 
              stroke="#2563eb" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
              fill="none"
              opacity="0.65" 
            />
          </svg>
        </div>
      </div>

      {/* Signature Underline */}
      <div className="w-56 border-b-2 border-slate-800 ml-auto"></div>

      {/* Doctor Particulars & Digital Timestamp */}
      <div className="pt-1 space-y-0.5">
        <p className="text-xs font-black text-slate-900 m-0">{cleanName}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 size={10} className="text-emerald-600" />
            Digitally Signed & Verified
          </span>
        </div>
        <p className="text-[10px] text-slate-500 m-0 font-medium">
          Doc ID: <strong>{doctorId || 'DOC-4829'}</strong> · {department || 'General Medicine'}
        </p>
        <p className="text-[9px] text-slate-400 m-0">
          Sign Timestamp: {issueDate} {issueTime || ''}
        </p>
      </div>
    </div>
  );
};

export default function DoctorMedicalCertificates() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Current logged in doctor fallback
  const currentDoctor = useMemo(() => {
    const docName = user?.name 
      ? (user.name.toLowerCase().startsWith('dr') ? user.name : `Dr. ${user.name}`)
      : (user?.firstName ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Dr. Sarah Jenkins, MD');
    const docId = user?.id ? `DOC-${String(user.id).padStart(4, '0')}` : 'DOC-4829';
    const docDept = user?.department || user?.specialty || 'Department of General Medicine';
    const docReg = user?.registrationNumber || 'KMC-2024-884920';

    return {
      name: docName,
      id: docId,
      department: docDept,
      regNo: docReg
    };
  }, [user]);

  // Load initial certificates, migrating any old 2024 dates or missing doctor data to CURRENT real-time date
  const [certificates, setCertificates] = useState(() => {
    try {
      const saved = localStorage.getItem('elixir_doctor_certificates');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasOld2024 = parsed.some(c => c.issueDate?.includes('2024') || c.validTill?.includes('2024') || !c.doctor);
        if (!hasOld2024 && parsed.length > 0) {
          return parsed.map(c => {
            const item = c.status === 'Cancelled' ? { ...c, status: 'Deleted', statusColor: 'red' } : c;
            return syncCertificateExpiration(item);
          });
        }
      }
    } catch {
      // Fallback
    }
    return generateInitialCertificates(currentDoctor).map(syncCertificateExpiration);
  });

  // Auto-synchronize certificate expiration on mount and whenever certificates load
  useEffect(() => {
    setCertificates(prev => {
      let hasChanges = false;
      const updated = prev.map(c => {
        const synced = syncCertificateExpiration(c);
        if (synced.status !== c.status || synced.statusColor !== c.statusColor) {
          hasChanges = true;
          return synced;
        }
        return c;
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  // Filters & State
  const [activeTab, setActiveTab] = useState('All Certificates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [previewCertificate, setPreviewCertificate] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('elixir_doctor_certificates', JSON.stringify(certificates));
    } catch (e) {
      console.warn('Could not persist certificates', e);
    }
  }, [certificates]);

  // Unique patients for dropdown
  const uniquePatients = useMemo(() => {
    const map = new Map();
    certificates.forEach(c => {
      if (c.patient?.name && !map.has(c.patient.name)) {
        map.set(c.patient.name, c.patient);
      }
    });
    return Array.from(map.values());
  }, [certificates]);

  // Status badge styling
  const getStatusBadgeClasses = (color, status) => {
    if (status === 'Deleted' || color === 'red') {
      return 'bg-[#FEF2F2] text-[#DC2626] border border-rose-200';
    }
    switch (color) {
      case 'green': return 'bg-[#F0FDF4] text-[#16A34A] border border-emerald-200';
      case 'blue': return 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200';
      case 'red': return 'bg-[#FEF2F2] text-[#DC2626] border border-rose-200';
      case 'orange': return 'bg-[#FFF7ED] text-[#EA580C] border border-amber-200';
      case 'gray': return 'bg-[#F8FAFC] text-[#64748B] border border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const tabs = ['All Certificates', 'Draft', 'Issued', 'Expired', 'Deleted'];

  // Handle tab change and sync with status filter
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'All Certificates') {
      setSelectedStatusFilter('ALL');
    } else {
      setSelectedStatusFilter(tab);
    }
  };

  // Handle Status dropdown change and sync with tab
  const handleStatusFilterChange = (status) => {
    setSelectedStatusFilter(status);
    setCurrentPage(1);
    if (status === 'ALL') {
      setActiveTab('All Certificates');
    } else {
      setActiveTab(status);
    }
  };

  // Filter logic: Search by ID, Patient, Doctor Name, Doctor ID, Department, Type, Remarks
  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = cert.id?.toLowerCase().includes(q);
        const matchesPatient = cert.patient?.name?.toLowerCase().includes(q);
        const matchesDoctor = cert.doctor?.name?.toLowerCase().includes(q);
        const matchesDoctorId = cert.doctor?.id?.toLowerCase().includes(q);
        const matchesDoctorDept = cert.doctor?.department?.toLowerCase().includes(q);
        const matchesType = cert.type?.name?.toLowerCase().includes(q);
        const matchesSub = cert.type?.sub?.toLowerCase().includes(q);
        const matchesDiagnosis = cert.diagnosis?.toLowerCase().includes(q);
        const matchesReport = cert.clinicalReport?.toLowerCase().includes(q);
        const matchesRemarks = cert.remarks?.toLowerCase().includes(q);

        if (!matchesId && !matchesPatient && !matchesDoctor && !matchesDoctorId && !matchesDoctorDept && !matchesType && !matchesSub && !matchesDiagnosis && !matchesReport && !matchesRemarks) {
          return false;
        }
      }

      if (selectedPatientFilter !== 'ALL' && cert.patient?.name !== selectedPatientFilter) {
        return false;
      }

      if (selectedStatusFilter !== 'ALL' && cert.status !== selectedStatusFilter) {
        return false;
      }
      if (activeTab !== 'All Certificates' && cert.status !== activeTab) {
        return false;
      }

      return true;
    });
  }, [certificates, searchQuery, selectedPatientFilter, selectedStatusFilter, activeTab]);

  // Paginated slice
  const paginatedCertificates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCertificates.slice(start, start + pageSize);
  }, [filteredCertificates, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCertificates.length / pageSize) || 1;

  // Real-time Summary Statistics
  const summaryStats = useMemo(() => {
    const total = certificates.length;
    const issued = certificates.filter(c => c.status === 'Issued').length;
    const expired = certificates.filter(c => c.status === 'Expired').length;
    const draft = certificates.filter(c => c.status === 'Draft').length;
    const deleted = certificates.filter(c => c.status === 'Deleted').length;
    return { total, issued, expired, draft, deleted };
  }, [certificates]);

  // Add new certificate handler (with auto-expiration sync)
  const handleAddNewCertificate = (newCert) => {
    const synced = syncCertificateExpiration(newCert);
    setCertificates(prev => [synced, ...prev]);
  };

  // Open Edit Modal for Draft Certificate ONLY
  const handleOpenEditModal = (cert) => {
    setEditingCertificate(cert);
    setIsModalOpen(true);
  };

  // Update existing certificate handler (with auto-expiration sync)
  const handleUpdateCertificate = (updatedCert) => {
    const synced = syncCertificateExpiration(updatedCert);
    setCertificates(prev => prev.map(c => c.id === synced.id ? synced : c));
    if (previewCertificate && previewCertificate.id === synced.id) {
      setPreviewCertificate(synced);
    }
  };

  // Delete certificate handler: marks status as 'Deleted'
  const handleDeleteCertificate = (id) => {
    setCertificates(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: 'Deleted',
          statusColor: 'red'
        };
      }
      return c;
    }));
    if (previewCertificate && previewCertificate.id === id) {
      setPreviewCertificate(prev => prev ? { ...prev, status: 'Deleted', statusColor: 'red' } : null);
    }
    toast.success(`Certificate ${id} marked as Deleted`);
  };

  // Permanently delete certificate handler (removes from list if already Deleted)
  const handlePermanentlyDeleteCertificate = (id) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
    if (previewCertificate && previewCertificate.id === id) {
      setPreviewCertificate(null);
    }
    toast.success(`Certificate ${id} permanently removed`);
  };

  // Approve & Issue Handler (Applies Seal & Digital Signature, syncs expiration)
  const handleApproveAndIssue = (cert) => {
    const isExpired = isDateExpired(cert.validTill);
    const newStatus = isExpired ? 'Expired' : 'Issued';
    const newColor = isExpired ? 'orange' : 'green';

    setCertificates(prev => prev.map(c => {
      if (c.id === cert.id) {
        const updated = {
          ...c,
          status: newStatus,
          statusColor: newColor,
          issueDate: c.issueDate || formatDate(new Date()),
          issueTime: c.issueTime || formatTime(new Date())
        };
        if (previewCertificate && previewCertificate.id === cert.id) {
          setPreviewCertificate(updated);
        }
        return updated;
      }
      return c;
    }));
    toast.success(
      isExpired
        ? `Certificate ${cert.id} issued (marked as Expired due to validity date ${cert.validTill})`
        : `Official Clinic Seal & Doctor Digital Signature applied to ${cert.id}!`
    );
  };

  // Download PDF Handler with jsPDF
  const handleDownloadCertificate = async (cert) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const docName = cert.doctor?.name || 'Dr. Sarah Jenkins, MD';
      const docId = cert.doctor?.id || 'DOC-4829';
      const docDept = cert.doctor?.department || 'Department of General Medicine';
      const docReg = cert.doctor?.regNo || 'KMC-2024-884920';
      const isIssued = cert.status === 'Issued';

      // Top Clinic Branding Header
      doc.setFillColor(33, 96, 255); // #2160FF
      doc.rect(0, 0, 210, 28, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.text('ELIXIR HEALTH CARE CLINIC', 105, 11, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Center for Multi-Specialty Clinical Excellence & Rehabilitation', 105, 17, { align: 'center' });
      doc.text('Registration: MED-KA-2024-8842 · Tel: +91 98765 43210 · info@elixirhealth.com', 105, 22, { align: 'center' });

      // Certificate Title Box
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(15, 34, 180, 14, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 96, 255);
      doc.setFontSize(12);
      doc.text((cert.type?.name || 'MEDICAL CERTIFICATE').toUpperCase(), 105, 43, { align: 'center' });

      // Metadata Bar
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Certificate Ref: ${cert.id}`, 20, 55);
      doc.text(`Issue Date: ${cert.issueDate} ${cert.issueTime || ''}`, 105, 55, { align: 'center' });
      doc.text(`Valid Until: ${cert.validTill}`, 190, 55, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 59, 195, 59);

      // Two Column Cards: Patient Particulars & Issuing Doctor Details
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 63, 87, 27, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text('Patient Particulars', 20, 70);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Full Name: ${cert.patient?.name || 'N/A'}`, 20, 77);
      doc.text(`Demographics: ${cert.patient?.details || 'N/A'}`, 20, 83);
      doc.text(`Status: ${cert.status}`, 20, 88);

      // Issuing Doctor Box
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(107, 63, 88, 27, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(3, 105, 161);
      doc.setFontSize(10);
      doc.text('Issuing Physician / Department', 112, 70);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Physician: ${docName}`, 112, 77);
      doc.text(`Doctor ID: ${docId} | Reg: ${docReg}`, 112, 83);
      doc.text(`Section: ${docDept}`, 112, 88);

      // Section: Clinical Assessment & Medical Certification
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('CLINICAL ASSESSMENT & FORMAL CERTIFICATION', 20, 100);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const certificationStatement = `This is to formally certify that ${cert.patient?.name || 'the patient'} was clinically examined at Elixir Health Care Clinic on ${cert.issueDate} at ${cert.issueTime || 'OPD hours'} by ${docName} (${docId}) in the ${docDept}.`;
      const splitStatement = doc.splitTextToSize(certificationStatement, 170);
      doc.text(splitStatement, 20, 107);

      let currentY = 107 + (splitStatement.length * 5) + 3;

      // Certified Condition / Diagnosis
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Certified Diagnosis: ${cert.diagnosis || cert.type?.sub || 'General Medical Evaluation'}`, 20, currentY);
      currentY += 8;

      // Clinical Findings Box
      if (cert.clinicalReport) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, currentY, 180, 24, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Doctor\'s Written Clinical Examination Report:', 20, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitReport = doc.splitTextToSize(cert.clinicalReport, 170);
        doc.text(splitReport, 20, currentY + 12);
        currentY += 28;
      }

      // Medical Recommendations & Advice Box
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(15, currentY, 180, 22, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(29, 78, 216);
      doc.text('Medical Recommendations & Restrictions:', 20, currentY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      const splitRemarks = doc.splitTextToSize(cert.remarks || 'Certified fit for all routine physical, vocational, and occupational duties.', 170);
      doc.text(splitRemarks, 20, currentY + 12);
      currentY += 26;

      // Validity Notice
      doc.setFillColor(254, 252, 232); // light amber
      doc.roundedRect(15, currentY, 180, 11, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7);
      doc.setFontSize(9);
      doc.text(`Period of Medical Validity: From ${cert.issueDate} until ${cert.validTill}`, 20, currentY + 7);
      currentY += 20;

      // Doctor Signature & Seal Area
      doc.setDrawColor(203, 213, 225);

      if (isIssued) {
        // --- 1. ROUNDED CIRCLE CLINIC SEAL (ISSUED ONLY) ---
        doc.setDrawColor(30, 64, 175); // #1e40af rich blue
        doc.setLineWidth(0.9);
        doc.circle(41, currentY + 18, 16, 'S'); // Outer circle radius 16
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.4);
        doc.circle(41, currentY + 18, 14.5, 'S'); // Inner ring
        doc.circle(41, currentY + 18, 9.5, 'S'); // Center ring
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('ELIXIR CLINIC', 41, currentY + 13.5, { align: 'center' });
        doc.setFontSize(6);
        doc.text('OFFICIAL SEAL', 41, currentY + 18, { align: 'center' });
        doc.setFontSize(5);
        doc.text('MED-KA-8842', 41, currentY + 22, { align: 'center' });
        doc.text('★ VERIFIED ★', 41, currentY + 25.5, { align: 'center' });

        // --- 2. DOCTOR DIGITAL SIGNATURE (ISSUED ONLY) ---
        doc.setFont('times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(30, 64, 175); // Blue ink cursive signature
        doc.text(docName, 125, currentY + 11);
        doc.setDrawColor(30, 64, 175);
        doc.setLineWidth(0.4);
        doc.line(125, currentY + 13, 185, currentY + 13);

        // Signature line
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.5);
        doc.line(125, currentY + 16, 195, currentY + 16);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(docName, 125, currentY + 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(22, 163, 74); // green
        doc.text('✓ Digitally Signed & Verified', 125, currentY + 26);
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Doctor ID: ${docId} · Reg No: ${docReg}`, 125, currentY + 31);
        doc.text(docDept, 125, currentY + 36);
        doc.text('Elixir Health Care Clinic', 125, currentY + 41);
      } else {
        // --- DRAFT STATUS (NO SEAL, NO SIGNATURE) ---
        doc.setDrawColor(217, 119, 6); // amber
        doc.setLineWidth(0.5);
        doc.circle(41, currentY + 18, 15, 'S');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text('DRAFT', 41, currentY + 16, { align: 'center' });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('UNSEALED', 41, currentY + 20, { align: 'center' });

        doc.setDrawColor(148, 163, 184);
        doc.line(125, currentY + 16, 195, currentY + 16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.setFontSize(8.5);
        doc.text('[ SIGNATURE PENDING - DRAFT STATUS ]', 125, currentY + 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Doctor: ${docName} (${docId})`, 125, currentY + 27);
        doc.text(docDept, 125, currentY + 32);
      }

      // Bottom Authenticity Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        isIssued 
          ? 'This is an authentic verified medical document issued under healthcare regulations.' 
          : 'DRAFT RECORD - FOR CLINICAL REVIEW ONLY. NOT VALID FOR OFFICIAL USE UNTIL ISSUED.',
        105, 
        285, 
        { align: 'center' }
      );

      doc.save(`Medical_Certificate_${cert.id}.pdf`);
      toast.success(`Downloaded ${cert.id} PDF`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download certificate PDF');
    }
  };

  const renderTypeIcon = (iconName) => {
    switch (iconName) {
      case 'Activity': return <Activity size={14} />;
      case 'Briefcase': return <Briefcase size={14} />;
      case 'Plane': return <Plane size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen font-sans">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Medical Certificates & Clinical Reports</h1>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  {certificates.length} Total Issued
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
                Write clinical findings, issue verified medical leaves, fitness certifications, and print official reports with rounded clinic seal and digital signature.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              setEditingCertificate(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#2160FF] hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none shrink-0"
          >
            <Plus size={18} strokeWidth={2.5} /> Write & Issue Certificate
          </button>
        </div>

        {/* Tabs and Filters Row */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer border-none whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-[#2160FF] text-white shadow-sm' 
                    : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Bar & Dropdowns Filter Cluster */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Real-time Search */}
            <div className="relative w-full sm:w-64 md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search certificate, patient, doctor, diagnosis..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* All Status Dropdown */}
            <div className="relative w-full sm:w-40">
              <select 
                value={selectedStatusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full appearance-none px-3.5 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="Issued">Issued</option>
                <option value="Draft">Draft</option>
                <option value="Expired">Expired</option>
                <option value="Deleted">Deleted</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear All Filters Button */}
            {(searchQuery || selectedStatusFilter !== 'ALL' || activeTab !== 'All Certificates') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPatientFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setActiveTab('All Certificates');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer border-none"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* All Certificates Table (Full Width) */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Ref ID</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Patient</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type / Diagnosis</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Issued By (Doctor)</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Issue Date</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Valid Until</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCertificates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-16">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-base font-bold text-slate-700">No certificates match your criteria</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query, patient, or status filter.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCertificates.map((cert, index) => (
                      <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors bg-white group">
                        {/* Certificate ID */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 whitespace-nowrap inline-flex items-center font-mono">
                            {cert.id}
                          </span>
                        </td>

                        {/* Patient info (Avatar circle removed) */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors whitespace-nowrap">{cert.patient.name}</p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">{cert.patient.details}</p>
                          </div>
                        </td>

                        {/* Certificate Type & Diagnosis */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cert.type.iconColor}`}>
                              {renderTypeIcon(cert.type.iconName)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">{cert.type.name}</p>
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap line-clamp-1">{cert.diagnosis || cert.type.sub}</p>
                            </div>
                          </div>
                        </td>

                        {/* Issued By (Doctor details: Name, ID, Section) */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">
                                {cert.doctor?.name || 'Dr. Sarah Jenkins, MD'}
                              </span>
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0 whitespace-nowrap inline-flex items-center">
                                {cert.doctor?.id || 'DOC-4829'}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 line-clamp-1 whitespace-nowrap">
                              {cert.doctor?.department || 'General Medicine'}
                            </p>
                          </div>
                        </td>

                        {/* Issue Date & Time (Current Real Time) */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">{cert.issueDate}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5 whitespace-nowrap">{cert.issueTime || '09:00 AM'}</p>
                        </td>

                        {/* Valid Till */}
                        <td className="py-4 px-5 text-xs font-bold text-slate-800 whitespace-nowrap">
                          {cert.validTill}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg inline-block whitespace-nowrap ${getStatusBadgeClasses(cert.statusColor, cert.status)}`}>
                            {cert.status}
                          </span>
                        </td>

                        {/* Actions (Eye, Download, 3-Dot Dropdown) */}
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Eye Preview Button */}
                            <button 
                              type="button"
                              onClick={() => setPreviewCertificate(cert)}
                              title="Preview Official Certificate"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer border-none"
                            >
                              <Eye size={15} strokeWidth={2.5} />
                            </button>

                            {/* Download Button */}
                            <button 
                              type="button"
                              onClick={() => handleDownloadCertificate(cert)}
                              title="Download PDF"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer border-none"
                            >
                              <Download size={15} strokeWidth={2.5} />
                            </button>

                            {/* 3-Dot Options Menu */}
                            <Menu as="div" className="relative inline-block text-left">
                              {({ open }) => (
                                <>
                                  <Menu.Button 
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer border-none ${
                                      open 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-transparent'
                                    }`}
                                    title="More Options"
                                  >
                                    <MoreVertical size={16} />
                                  </Menu.Button>
                                  <Transition
                                    enter="transition duration-100 ease-out"
                                    enterFrom="transform scale-95 opacity-0"
                                    enterTo="transform scale-100 opacity-100"
                                    leave="transition duration-75 ease-out"
                                    leaveFrom="transform scale-100 opacity-100"
                                    leaveTo="transform scale-95 opacity-0"
                                  >
                                    <Menu.Items 
                                      anchor={{
                                        to: index >= Math.max(1, paginatedCertificates.length - 2) ? 'top end' : 'bottom end',
                                        gap: 6
                                      }}
                                      className="w-56 bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 p-1.5 z-50 focus:outline-none"
                                    >
                                      {/* Header with Cert Ref */}
                                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Actions</span>
                                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60">
                                          {cert.id}
                                        </span>
                                      </div>

                                      <div className="space-y-0.5">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewCertificate(cert)}
                                              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 bg-transparent'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5">
                                                <Eye size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                                                <span>Preview Certificate</span>
                                              </div>
                                            </button>
                                          )}
                                        </Menu.Item>

                                        {/* EDIT OPTION: EXCLUSIVELY AVAILABLE IN DRAFT STATUS */}
                                        {cert.status === 'Draft' && (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                onClick={() => handleOpenEditModal(cert)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                  active ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600 bg-transparent'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <PenTool size={15} className="text-indigo-600" />
                                                  <span>Edit Draft Report</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-700">
                                                  Draft
                                                </span>
                                              </button>
                                            )}
                                          </Menu.Item>
                                        )}

                                        {/* If Draft, also provide direct 'Issue & Affix Seal' action */}
                                        {cert.status === 'Draft' && (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                onClick={() => handleApproveAndIssue(cert)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                  active ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-700 bg-transparent'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <Award size={15} className="text-emerald-600" />
                                                  <span>Issue & Affix Seal</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-700">
                                                  Official
                                                </span>
                                              </button>
                                            )}
                                          </Menu.Item>
                                        )}

                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadCertificate(cert)}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 bg-transparent'
                                              }`}
                                            >
                                              <Download size={15} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                                              <span>Download PDF</span>
                                            </button>
                                          )}
                                        </Menu.Item>

                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setPreviewCertificate(cert);
                                                setTimeout(() => window.print(), 350);
                                              }}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 bg-transparent'
                                              }`}
                                            >
                                              <Printer size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                                              <span>Print Certificate</span>
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                      
                                      <div className="h-px bg-slate-100 my-1" />

                                      <div className="space-y-0.5">
                                        {/* If status is Deleted, offer restore option */}
                                        {cert.status === 'Deleted' && (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const restoredStatus = isDateExpired(cert.validTill) ? 'Expired' : 'Issued';
                                                  const restoredColor = restoredStatus === 'Expired' ? 'orange' : 'green';
                                                  setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, status: restoredStatus, statusColor: restoredColor } : c));
                                                  toast.success(`Certificate ${cert.id} restored to ${restoredStatus}`);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                  active ? 'bg-blue-50 text-blue-700' : 'text-blue-600 bg-transparent'
                                                }`}
                                              >
                                                <CheckCircle2 size={15} className="text-blue-600" />
                                                <span>Restore Record</span>
                                              </button>
                                            )}
                                          </Menu.Item>
                                        )}

                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (cert.status === 'Deleted') {
                                                  handlePermanentlyDeleteCertificate(cert.id);
                                                } else {
                                                  handleDeleteCertificate(cert.id);
                                                }
                                              }}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border-none transition-colors cursor-pointer text-left ${
                                                active ? 'bg-rose-50 text-rose-700' : 'text-rose-600 bg-transparent'
                                              }`}
                                            >
                                              <Trash2 size={15} className="text-rose-500" />
                                              <span>{cert.status === 'Deleted' ? 'Delete Permanently' : 'Delete Record'}</span>
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </>
                              )}
                            </Menu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50/70 border-t border-slate-200 gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredCertificates.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredCertificates.length)} of {filteredCertificates.length} certificates
              </span>
              
              <div className="flex items-center gap-1.5">
                <button 
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition font-bold text-xs cursor-pointer bg-white"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition cursor-pointer border-none ${
                      currentPage === i + 1 
                        ? 'bg-[#2160FF] text-white shadow-sm' 
                        : 'border border-slate-200 text-slate-600 hover:bg-white bg-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition font-bold text-xs cursor-pointer bg-white"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

        {/* Certificate Analytics & Compliance Row (Single Row below All Certificates) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* 1. Live Certificate Summary */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Live Certificate Summary</h3>
                <span className="text-xs font-bold text-slate-400">All-Time</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-2xl font-black text-[#16A34A] leading-none mb-1.5">{summaryStats.total}</span>
                  <span className="text-xs font-extrabold text-slate-800">Total Issued</span>
                  <span className="text-[10px] font-bold text-[#16A34A] mt-1 flex items-center gap-0.5">
                    <ArrowUp size={11} strokeWidth={3}/> Active Registry
                  </span>
                </div>
                
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-2xl font-black text-[#2563EB] leading-none mb-1.5">{summaryStats.issued}</span>
                  <span className="text-xs font-extrabold text-[#1D4ED8]">Valid / Active</span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">
                    ({summaryStats.total > 0 ? Math.round((summaryStats.issued / summaryStats.total) * 100) : 0}%)
                  </span>
                </div>
                
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-2xl font-black text-[#EA580C] leading-none mb-1.5">{summaryStats.expired}</span>
                  <span className="text-xs font-extrabold text-[#C2410C]">Expired</span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">
                    ({summaryStats.total > 0 ? Math.round((summaryStats.expired / summaryStats.total) * 100) : 0}%)
                  </span>
                </div>
                
                <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-2xl font-black text-[#9333EA] leading-none mb-1.5">{summaryStats.draft}</span>
                  <span className="text-xs font-extrabold text-[#7E22CE]">Draft Records</span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">
                    ({summaryStats.total > 0 ? Math.round((summaryStats.draft / summaryStats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Top Certificate Types */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Top Certificate Types</h3>
                <span className="text-xs text-slate-400 font-medium">Distribution</span>
              </div>

              <div className="space-y-3 mt-4">
                {[
                  { name: 'Fitness Certificate', icon: <FileText size={14} />, count: certificates.filter(c => c.type.name.includes('Fitness')).length, iconColor: 'text-[#2160FF]' },
                  { name: 'Sick Leave Certificate', icon: <Activity size={14} />, count: certificates.filter(c => c.type.name.includes('Sick')).length, iconColor: 'text-red-500' },
                  { name: 'Travel Certificate', icon: <Plane size={14} />, count: certificates.filter(c => c.type.name.includes('Travel')).length, iconColor: 'text-green-600' },
                  { name: 'Handicap & Others', icon: <Briefcase size={14} />, count: certificates.filter(c => !c.type.name.includes('Fitness') && !c.type.name.includes('Sick') && !c.type.name.includes('Travel')).length, iconColor: 'text-orange-500' }
                ].map((item, idx) => {
                  const pct = certificates.length > 0 ? Math.round((item.count / certificates.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center ${item.iconColor}`}>
                            {item.icon}
                          </div>
                          <span>{item.name}</span>
                        </div>
                        <span className="text-slate-500">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#2160FF] h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Statutory Compliance & Digital Signs */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span>Statutory Compliance & Digital Signs</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Verified</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mt-4 m-0">
                Medical certificates and clinical reports are issued under statutory medical council regulations. Every document is stamped with attending doctor credentials, registration number, and clinical department. Rounded official clinic seal and doctor digital signature are affixed exclusively upon issuance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-100/80 p-2.5 rounded-xl">
                <Stamp size={14} className="text-blue-600 shrink-0" />
                <span className="leading-tight">Official Circular Seal</span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/80 p-2.5 rounded-xl">
                <PenTool size={14} className="text-indigo-600 shrink-0" />
                <span className="leading-tight">Doctor e-Signature</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* New / Edit Certificate Modal */}
      <NewCertificateModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingCertificate(null);
        }}
        onAddCertificate={handleAddNewCertificate}
        editCertificate={editingCertificate}
        onUpdateCertificate={handleUpdateCertificate}
      />

      {/* Official Certificate Preview & Print Modal */}
      {previewCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 font-sans overflow-y-auto">
          {/* WIDER RESPONSIVE MODAL CONTAINER */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 m-0">Official Medical Certificate Preview</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      previewCertificate.status === 'Issued' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : previewCertificate.status === 'Deleted'
                          ? 'bg-rose-100 text-rose-800'
                          : previewCertificate.status === 'Expired'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                      {previewCertificate.status === 'Issued' 
                        ? '✓ Sealed & Signed' 
                        : previewCertificate.status === 'Deleted'
                          ? '✖ Record Deleted'
                          : previewCertificate.status === 'Expired'
                            ? '⚠ Expired'
                            : '⚠ Draft (Unsealed)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 m-0">Verified Medical Record · {previewCertificate.id}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewCertificate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Certificate Document View */}
            <div className="p-6 sm:p-8 md:p-10 overflow-y-auto space-y-6 bg-white" id="printable-medical-certificate">
              
              {/* Document Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase m-0">
                  ELIXIR HEALTH CARE CLINIC
                </h2>
                <p className="text-xs text-slate-500 font-semibold m-0">
                  Center for Multi-Specialty Clinical Excellence & Rehabilitation
                </p>
                <p className="text-[11px] text-slate-400 m-0">
                  Registration No: MED-KA-2024-8842 · Ph: +91 98765 43210 · info@elixirhealth.com
                </p>
              </div>

              {/* Certificate Title Badge */}
              <div className="text-center pt-1">
                <span className="inline-block px-6 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-extrabold text-sm uppercase tracking-widest shadow-sm">
                  {previewCertificate.type?.name || 'Medical Certificate'}
                </span>
              </div>

              {/* Certificate Metadata Bar: CURRENT LIVE DATES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span>Cert No: <strong className="text-blue-700">{previewCertificate.id}</strong></span>
                <span className="sm:text-center">Issue Date: <strong className="text-slate-900">{previewCertificate.issueDate} {previewCertificate.issueTime || ''}</strong></span>
                <span className="sm:text-right">Valid Until: <strong className="text-emerald-700">{previewCertificate.validTill}</strong></span>
              </div>

              {/* Two Column Section: Patient Particulars & Issuing Doctor Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Patient Particulars */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">Patient Information</p>
                  <p className="font-extrabold text-slate-800 text-sm m-0">{previewCertificate.patient?.name}</p>
                  <p className="text-slate-600 m-0">Demographics: {previewCertificate.patient?.details}</p>
                  <p className="text-slate-600 m-0">
                    Status: <strong className={
                      previewCertificate.status === 'Issued' 
                        ? 'text-emerald-600' 
                        : previewCertificate.status === 'Deleted'
                          ? 'text-rose-600'
                          : previewCertificate.status === 'Expired'
                            ? 'text-orange-600'
                            : 'text-amber-600'
                    }>{previewCertificate.status}</strong>
                  </p>
                </div>

                {/* Issuing Doctor Information */}
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1">
                  <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider m-0 flex items-center gap-1">
                    <Stethoscope size={13} /> Issuing Doctor & Section
                  </p>
                  <p className="font-extrabold text-blue-900 text-sm m-0">
                    {previewCertificate.doctor?.name || 'Dr. Sarah Jenkins, MD'}
                  </p>
                  <p className="text-blue-800 font-semibold m-0">
                    Doctor ID: <strong>{previewCertificate.doctor?.id || 'DOC-4829'}</strong> · Reg: {previewCertificate.doctor?.regNo || 'KMC-2024-884920'}
                  </p>
                  <p className="text-blue-700 text-[11px] m-0">
                    Section: <strong>{previewCertificate.doctor?.department || 'Department of General Medicine'}</strong>
                  </p>
                </div>

              </div>

              {/* Certificate Body Prose & Doctor's Written Report */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                <p>
                  This is to formally certify that <strong>{previewCertificate.patient?.name}</strong> was clinically examined at Elixir Health Care Clinic on <strong>{previewCertificate.issueDate}</strong> at <strong>{previewCertificate.issueTime || '09:30 AM'}</strong> by <strong>{previewCertificate.doctor?.name || 'Dr. Sarah Jenkins, MD'}</strong> (ID: {previewCertificate.doctor?.id || 'DOC-4829'}) in the <strong>{previewCertificate.doctor?.department || 'Department of General Medicine'}</strong>.
                </p>

                <p>
                  Upon clinical assessment and physical examination, the certified diagnosis is <strong>{previewCertificate.diagnosis || previewCertificate.type?.sub}</strong>.
                </p>

                {/* Doctor's Written Clinical Report Findings */}
                {previewCertificate.clinicalReport && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans text-xs space-y-1">
                    <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider m-0">Doctor's Clinical Examination Report:</p>
                    <p className="text-slate-600 italic m-0">{previewCertificate.clinicalReport}</p>
                  </div>
                )}

                {/* Medical Advice & Recommendations */}
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 font-sans text-xs text-blue-900 space-y-1">
                  <p className="font-bold text-blue-800 text-[11px] uppercase tracking-wider m-0">Medical Recommendations & Advice:</p>
                  <p className="m-0 font-medium">
                    {previewCertificate.remarks || 'Patient is clinically evaluated and found medically fit for all routine physical and professional duties without restriction.'}
                  </p>
                </div>

                <p>
                  This certificate is issued under statutory clinical protocol and remains medically valid until <strong>{previewCertificate.validTill}</strong>.
                </p>
              </div>

              {/* SIGNATURE & SEAL AREA: CONDITIONALLY RENDERED ONLY ON ISSUED CERTIFICATE */}
              <div className="pt-6 flex flex-col sm:flex-row items-center sm:items-end justify-between border-t border-slate-200 gap-6">
                
                {/* Left: Rounded Circle Clinic Seal */}
                <div>
                  <ClinicOfficialSeal 
                    isIssued={previewCertificate.status === 'Issued'} 
                    certNo={previewCertificate.id}
                    issueDate={previewCertificate.issueDate}
                  />
                </div>

                {/* Right: Doctor's Digital Signature (Personalized to Doctor Name) */}
                <div className="w-full sm:w-auto">
                  <DoctorDigitalSignature 
                    doctorName={previewCertificate.doctor?.name}
                    doctorId={previewCertificate.doctor?.id}
                    isIssued={previewCertificate.status === 'Issued'}
                    issueDate={previewCertificate.issueDate}
                    issueTime={previewCertificate.issueTime}
                    department={previewCertificate.doctor?.department}
                  />
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setPreviewCertificate(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors border-none bg-slate-100 cursor-pointer"
                >
                  Close Preview
                </button>

                {/* Edit Option directly from Preview Modal for Drafts */}
                {previewCertificate.status === 'Draft' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const target = previewCertificate;
                      setPreviewCertificate(null);
                      handleOpenEditModal(target);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer border border-indigo-200 flex items-center gap-1.5"
                  >
                    <PenTool size={14} /> Edit Draft
                  </button>
                )}

                {/* Instant "Approve & Issue" Button for Draft Certificates */}
                {previewCertificate.status === 'Draft' && (
                  <button 
                    type="button" 
                    onClick={() => handleApproveAndIssue(previewCertificate)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition cursor-pointer border-none flex items-center gap-1.5"
                  >
                    <Award size={15} /> Approve & Issue (Apply Seal & Signature)
                  </button>
                )}

                {/* Restore option if Certificate is Deleted */}
                {previewCertificate.status === 'Deleted' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const restoredStatus = isDateExpired(previewCertificate.validTill) ? 'Expired' : 'Issued';
                      const restoredColor = restoredStatus === 'Expired' ? 'orange' : 'green';
                      const restored = { ...previewCertificate, status: restoredStatus, statusColor: restoredColor };
                      setCertificates(prev => prev.map(c => c.id === restored.id ? restored : c));
                      setPreviewCertificate(restored);
                      toast.success(`Certificate ${restored.id} restored to ${restoredStatus}`);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer border border-blue-200 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Restore Record
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer size={15} /> Print
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDownloadCertificate(previewCertificate)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer border-none flex items-center gap-1.5"
                >
                  <Download size={15} /> Download PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
