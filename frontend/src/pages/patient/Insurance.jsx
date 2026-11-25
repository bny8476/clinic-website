import React, { useState, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Shield,
  ShieldCheck,
  FileText,
  Calendar,
  IndianRupee,
  Plus,
  Search,
  Filter,
  RotateCw,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Download,
  Upload,
  User,
  Users,
  Stethoscope,
  X,
  ChevronDown,
  Printer,
  Sparkles,
  FileCheck,
  FileUp,
  Receipt,
  HelpCircle,
  Loader2,
  Building2,
  CreditCard,
  ArrowRight,
  ExternalLink,
  QrCode,
  Building,
  PhoneCall,
  Info
} from 'lucide-react';

import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import Modal from '../../components/ui/Modal';
import { fadeUp, staggerChildren, pageTransition } from '../../components/ui/motion';

// Common Indian & Global Health Insurance Providers & TPAs
const POPULAR_PROVIDERS = [
  'Star Health & Allied Insurance',
  'Care Health Insurance (Religare)',
  'HDFC ERGO Health Insurance',
  'ICICI Lombard General Insurance',
  'Niva Bupa Health Insurance (Max Bupa)',
  'Bajaj Allianz General Insurance',
  'Tata AIG General Insurance',
  'Medi Assist TPA',
  'Paramount Health Services (TPA)',
  'Vidal Health TPA',
  'United India Insurance',
  'National Insurance Company',
  'New India Assurance',
  'Oriental Insurance',
  'Blue Cross Blue Shield',
  'Other / Corporate TPA'
];

// Realistic fallback demo claims when patient has zero recorded claims
const DEMO_FALLBACK_CLAIMS = [
  {
    id: 101,
    isDemo: true,
    provider: 'Star Health & Allied Insurance',
    providerName: 'Star Health & Allied Insurance',
    policyNumber: 'STAR-IND-8849201',
    memberId: 'STAR-MEM-99214',
    claimType: 'INPATIENT_HOSPITALIZATION',
    claimCategory: 'REIMBURSEMENT',
    claimAmount: 24500.00,
    estimatedCost: 24500.00,
    approvedAmount: 22800.00,
    deductibleAmount: 1700.00,
    status: 'APPROVED',
    procedureName: 'Post-Operative Orthopedic Rehabilitation & Physical Therapy',
    diagnosis: 'Post-ACL Reconstruction Knee Stiffness',
    serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dischargeDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    treatingDoctor: 'Dr. Emily Watson',
    hospitalName: 'Metropolitan Surgical Specialty Hospital',
    billNumber: 'BILL-MET-2026-8910',
    beneficiaryName: 'John Smith (Self)',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '•••• •••• 4091',
    notes: 'Inpatient rehabilitation package covering physiotherapy and nursing care. Co-pay of 7% applied per policy schedule.',
    denialReason: null
  },
  {
    id: 102,
    isDemo: true,
    provider: 'HDFC ERGO Health Insurance',
    providerName: 'HDFC ERGO Health Insurance',
    policyNumber: 'HDFC-OPT-772194',
    memberId: 'HDFC-CORP-4501',
    claimType: 'DIAGNOSTIC_IMAGING',
    claimCategory: 'CASHLESS_PREAUTH',
    claimAmount: 11200.00,
    estimatedCost: 11200.00,
    approvedAmount: null,
    deductibleAmount: null,
    status: 'SUBMITTED',
    procedureName: 'Lumbar Spine MRI & Digital Radiography Protocol',
    diagnosis: 'L4-L5 Lumbar Radiculopathy & Disc Herniation',
    serviceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    treatingDoctor: 'Dr. Marcus Vance',
    hospitalName: 'Metropolitan Imaging Center',
    billNumber: 'RAD-INV-2026-302',
    beneficiaryName: 'John Smith (Self)',
    notes: 'Diagnostic imaging for radiculopathy evaluation. Awaiting cashless TPA adjudication.',
    denialReason: null
  },
  {
    id: 103,
    isDemo: true,
    provider: 'Care Health Insurance (Religare)',
    providerName: 'Care Health Insurance (Religare)',
    policyNumber: 'CARE-FLT-443912',
    memberId: 'CARE-IND-8812',
    claimType: 'OUTPATIENT_CONSULT',
    claimCategory: 'REIMBURSEMENT',
    claimAmount: 3800.00,
    estimatedCost: 3800.00,
    approvedAmount: 3800.00,
    deductibleAmount: 0.00,
    status: 'APPROVED',
    procedureName: 'Comprehensive Cardiovascular Consultation & Biomarker Screen',
    diagnosis: 'Primary Essential Hypertension Assessment',
    serviceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    treatingDoctor: 'Dr. Sarah Jenkins',
    hospitalName: 'Metropolitan Health Clinic OPD',
    billNumber: 'OPD-BILL-88391',
    beneficiaryName: 'Mary Smith (Spouse)',
    bankName: 'State Bank of India',
    accountNumber: '•••• •••• 9920',
    notes: 'Annual executive preventive health checkup. Settled in full under preventive OPD wellness rider.',
    denialReason: null
  }
];

export default function Insurance() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State management
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | APPROVED | SUBMITTED | REJECTED
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | amount-high | amount-low
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  // Modals state
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Form Section Active Tab (for clean multi-part claim submission)
  const [formStep, setFormStep] = useState(1);

  // Enhanced Form State with Full Clinical & Financial Details
  const [formData, setFormData] = useState({
    // 1. Claimant & Beneficiary
    beneficiaryType: 'SELF', // SELF | DEPENDENT
    dependentId: '',
    beneficiaryName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Primary Insured',
    
    // 2. Policy & Insurer Details
    provider: 'Star Health & Allied Insurance',
    customProvider: '',
    policyNumber: '',
    memberId: '',
    corporateGroup: '',

    // 3. Claim & Hospitalization Details
    claimCategory: 'REIMBURSEMENT', // REIMBURSEMENT | CASHLESS_PREAUTH
    claimType: 'OUTPATIENT_CONSULT', // OUTPATIENT_CONSULT | INPATIENT_HOSPITALIZATION | DIAGNOSTIC_IMAGING | PHARMACY_MEDICINE | DAY_SURGERY
    serviceDate: new Date().toISOString().split('T')[0],
    dischargeDate: '',
    hospitalName: 'Metropolitan Health Clinic',
    billNumber: '',
    treatingDoctor: '',
    doctorRegNumber: '',

    // 4. Clinical Diagnosis & Treatment
    diagnosis: '',
    procedureName: '',
    notes: '',

    // 5. Itemized Financial Breakdown (INR)
    consultationFee: '',
    diagnosticsFee: '',
    pharmacyFee: '',
    hospitalRoomFee: '',
    claimAmount: '',

    // 6. Direct Bank Settlement Info (For Reimbursement)
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',

    // 7. Declaration
    agreeDeclaration: true
  });

  // Attached files state
  const [billFile, setBillFile] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const billInputRef = useRef(null);
  const prescriptionInputRef = useRef(null);
  const reportInputRef = useRef(null);

  // Auto-calculate Total Claim Amount if itemized breakdown is filled
  const handleItemizedFeeChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    const cFee = parseFloat(updated.consultationFee) || 0;
    const dFee = parseFloat(updated.diagnosticsFee) || 0;
    const pFee = parseFloat(updated.pharmacyFee) || 0;
    const hFee = parseFloat(updated.hospitalRoomFee) || 0;
    const autoSum = cFee + dFee + pFee + hFee;

    if (autoSum > 0) {
      updated.claimAmount = autoSum.toFixed(2);
    }
    setFormData(updated);
  };

  // 1. Fetch Patient Dependents (Dual fallback: /v1/patient/dependents & /v1/patient/settings/dependents)
  const { data: dependents = [] } = useQuery({
    queryKey: ['patientDependents'],
    queryFn: async () => {
      try {
        try {
          const res = await axiosPrivate.get('/v1/patient/dependents');
          if (Array.isArray(res.data)) return res.data;
        } catch (e1) {
          // Fallback to canonical settings endpoint
        }
        const res2 = await axiosPrivate.get('/v1/patient/settings/dependents');
        return Array.isArray(res2.data) ? res2.data : [];
      } catch (e) {
        return [];
      }
    },
    retry: false
  });

  // 2. Fetch Patient Insurance Claims (Dual API resilience: checks /v1/patient/insurance and /v1/patient/insurance-claims)
  const { 
    data: rawClaims = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['insuranceClaims'],
    queryFn: async () => {
      try {
        let claimsList = [];
        try {
          const res = await axiosPrivate.get('/v1/patient/insurance');
          if (Array.isArray(res.data) && res.data.length > 0) {
            claimsList = res.data;
          }
        } catch (e) {
          console.debug('Endpoint /v1/patient/insurance returned empty/error, trying insurance-claims', e);
        }

        if (claimsList.length === 0) {
          try {
            const res2 = await axiosPrivate.get('/v1/patient/insurance-claims');
            if (Array.isArray(res2.data) && res2.data.length > 0) {
              claimsList = res2.data;
            }
          } catch (e2) {
            console.debug('Endpoint /v1/patient/insurance-claims check completed', e2);
          }
        }

        return claimsList;
      } catch (err) {
        console.warn('Could not load insurance claims', err);
        return [];
      }
    },
    retry: 1
  });

  // Submit Insurance Claim Mutation (Resilient fallback to both endpoints with document links)
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      let docIds = [];

      // Upload Bill File if attached
      if (billFile) {
        try {
          const docData = new FormData();
          docData.append('file', billFile);
          docData.append('ownerType', 'PATIENT');
          docData.append('ownerId', user?.id || 1);
          docData.append('documentType', 'INSURANCE');
          docData.append('title', `Final Bill - ${payload.provider || 'Claim'}`);
          docData.append('description', `Bill: ${payload.billNumber || 'N/A'}. Claim: ₹${payload.claimAmount}`);
          const uploadRes = await axiosPrivate.post('/documents', docData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.id) docIds.push(`Bill Doc #${uploadRes.data.id}`);
        } catch (uploadErr) {
          console.warn('Bill upload warning', uploadErr);
        }
      }

      // Upload Prescription File if attached
      if (prescriptionFile) {
        try {
          const docData = new FormData();
          docData.append('file', prescriptionFile);
          docData.append('ownerType', 'PATIENT');
          docData.append('ownerId', user?.id || 1);
          docData.append('documentType', 'PRESCRIPTION');
          docData.append('title', `Doctor Prescription - ${payload.treatingDoctor || 'Attending Physician'}`);
          const uploadRes = await axiosPrivate.post('/documents', docData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.id) docIds.push(`Rx Doc #${uploadRes.data.id}`);
        } catch (e) {
          console.warn('Rx upload warning', e);
        }
      }

      // Compile comprehensive structured notes for backend
      const resolvedBeneficiary = payload.beneficiaryType === 'SELF' 
        ? (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Primary Insured')
        : (payload.beneficiaryName || 'Family Dependent');

      const resolvedProcedure = payload.procedureName || `${payload.claimType} Treatment`;

      const structuredNotes = JSON.stringify({
        category: payload.claimCategory,
        treatmentType: payload.claimType,
        beneficiary: resolvedBeneficiary,
        memberId: payload.memberId,
        serviceDate: payload.serviceDate,
        dischargeDate: payload.dischargeDate || null,
        doctor: payload.treatingDoctor,
        doctorReg: payload.doctorRegNumber,
        hospital: payload.hospitalName,
        billNo: payload.billNumber,
        diagnosis: payload.diagnosis,
        procedure: resolvedProcedure,
        breakdown: {
          consultation: payload.consultationFee,
          diagnostics: payload.diagnosticsFee,
          pharmacy: payload.pharmacyFee,
          hospitalRoom: payload.hospitalRoomFee,
          total: payload.claimAmount
        },
        bank: payload.bankName ? {
          bank: payload.bankName,
          accountNumber: payload.accountNumber,
          ifsc: payload.ifscCode,
          holder: payload.accountHolderName
        } : null,
        documents: docIds,
        userNotes: payload.notes
      });

      const resolvedProvider = payload.provider === 'Other / Corporate TPA' 
        ? (payload.customProvider || 'Corporate TPA') 
        : payload.provider;

      const body = {
        provider: resolvedProvider,
        policyNumber: payload.policyNumber,
        claimAmount: parseFloat(payload.claimAmount || 0),
        notes: structuredNotes,
        procedureName: resolvedProcedure,
        estimatedCost: parseFloat(payload.claimAmount || 0)
      };

      try {
        const res = await axiosPrivate.post('/v1/patient/insurance', body);
        return res.data;
      } catch (postErr) {
        // Fallback to insurance-claims endpoint if main one fails
        const res2 = await axiosPrivate.post('/v1/patient/insurance-claims', body);
        return res2.data;
      }
    },
    onSuccess: () => {
      toast.success('Health insurance claim submitted successfully for TPA adjudication!');
      setIsNewClaimModalOpen(false);
      setBillFile(null);
      setPrescriptionFile(null);
      setReportFile(null);
      setFormStep(1);
      setFormData({
        beneficiaryType: 'SELF',
        dependentId: '',
        beneficiaryName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Primary Insured',
        provider: 'Star Health & Allied Insurance',
        customProvider: '',
        policyNumber: '',
        memberId: '',
        corporateGroup: '',
        claimCategory: 'REIMBURSEMENT',
        claimType: 'OUTPATIENT_CONSULT',
        serviceDate: new Date().toISOString().split('T')[0],
        dischargeDate: '',
        hospitalName: 'Metropolitan Health Clinic',
        billNumber: '',
        treatingDoctor: '',
        doctorRegNumber: '',
        diagnosis: '',
        procedureName: '',
        notes: '',
        consultationFee: '',
        diagnosticsFee: '',
        pharmacyFee: '',
        hospitalRoomFee: '',
        claimAmount: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
        agreeDeclaration: true
      });
      queryClient.invalidateQueries({ queryKey: ['insuranceClaims'] });
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit insurance claim. Please verify your details.');
    }
  });

  // Combine real backend claims with fallback demo claims
  const claims = useMemo(() => {
    if (Array.isArray(rawClaims) && rawClaims.length > 0) {
      return rawClaims;
    }
    return DEMO_FALLBACK_CLAIMS;
  }, [rawClaims]);

  // Executive KPI stats
  const stats = useMemo(() => {
    const totalCount = claims.length;
    let totalClaimed = 0;
    let totalSettled = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    claims.forEach(c => {
      const amt = Number(c.claimAmount || c.estimatedCost || 0);
      const appAmt = Number(c.approvedAmount || 0);
      totalClaimed += amt;

      const s = (c.status || '').toUpperCase();
      if (s === 'APPROVED' || s === 'COMPLETED') {
        approvedCount++;
        totalSettled += (appAmt > 0 ? appAmt : amt);
      } else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW' || s === 'PENDING' || s === 'PENDING_INFO') {
        pendingCount++;
      }
    });

    const settlementRate = totalClaimed > 0 ? Math.round((totalSettled / totalClaimed) * 100) : 100;

    return { totalCount, totalClaimed, totalSettled, approvedCount, pendingCount, settlementRate };
  }, [claims]);

  // Filter and sort claims
  const filteredClaims = useMemo(() => {
    let list = [...claims];

    // Status Tab Filter
    if (activeFilter === 'APPROVED') {
      list = list.filter(c => ['APPROVED', 'COMPLETED'].includes((c.status || '').toUpperCase()));
    } else if (activeFilter === 'SUBMITTED') {
      list = list.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes((c.status || '').toUpperCase()));
    } else if (activeFilter === 'REJECTED') {
      list = list.filter(c => ['REJECTED', 'DENIED', 'PENDING_INFO'].includes((c.status || '').toUpperCase()));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const prov = (c.provider || c.providerName || '').toLowerCase();
        const pol = (c.policyNumber || '').toLowerCase();
        const proc = (c.procedureName || '').toLowerCase();
        const diag = (c.diagnosis || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        const doc = (c.treatingDoctor || '').toLowerCase();
        const idStr = String(c.id || '');
        return prov.includes(q) || pol.includes(q) || proc.includes(q) || diag.includes(q) || notes.includes(q) || doc.includes(q) || idStr.includes(q);
      });
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.submittedAt || a.createdAt || 0) - new Date(b.submittedAt || b.createdAt || 0);
      }
      if (sortBy === 'amount-high') {
        return Number(b.claimAmount || b.estimatedCost || 0) - Number(a.claimAmount || a.estimatedCost || 0);
      }
      if (sortBy === 'amount-low') {
        return Number(a.claimAmount || a.estimatedCost || 0) - Number(b.claimAmount || b.estimatedCost || 0);
      }
      return 0;
    });

    return list;
  }, [claims, activeFilter, searchQuery, sortBy]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckCircle2 size={13} className="text-emerald-600" />
          APPROVED & SETTLED
        </span>
      );
    }
    if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          IN TPA ADJUDICATION
        </span>
      );
    }
    if (s === 'PENDING_INFO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={13} className="text-amber-600" />
          DOCUMENTS REQUIRED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={13} className="text-rose-600" />
        REJECTED / DENIED
      </span>
    );
  };

  // Treatment Type Theme Helper
  const getTreatmentTypeBadge = (type) => {
    switch (type) {
      case 'INPATIENT_HOSPITALIZATION':
        return <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800">IPD ADMISSION</span>;
      case 'OUTPATIENT_CONSULT':
        return <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">OPD CONSULT</span>;
      case 'DIAGNOSTIC_IMAGING':
        return <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">SCANS & LABS</span>;
      case 'PHARMACY_MEDICINE':
        return <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">PHARMACY RX</span>;
      case 'DAY_SURGERY':
        return <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800">DAY CARE SURGERY</span>;
      default:
        return <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">MEDICAL CLAIM</span>;
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const patientFullName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim() 
    : 'John Smith';

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      {/* ── Ultra-Wide Layout Container ────────────────────────────────── */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Shield className="w-7 h-7 text-[#2864FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Health Insurance Claims & Pre-Auth
                </h1>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Manage your health insurance policies, pre-authorizations, and cashless reimbursements with automated TPA adjudication.
              </p>
            </div>
          </div>

          {/* Action CTAs in Header */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <button
              onClick={() => {
                refetch();
                toast.success('Insurance claims updated');
              }}
              title="Refresh Claims"
              disabled={isFetching}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            >
              <RotateCw size={17} className={isFetching ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={() => setIsCardModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <CreditCard size={15} className="text-blue-600" />
              <span>Digital Health Card</span>
            </button>

            <button
              onClick={() => navigate('/patient/billing')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Receipt size={15} />
              <span>Medical Invoices</span>
            </button>

            <button
              onClick={() => {
                setFormStep(1);
                setIsNewClaimModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer flex items-center gap-2 border-none whitespace-nowrap shrink-0"
            >
              <Plus size={16} />
              <span>Submit New Claim</span>
            </button>
          </div>
        </div>

        {/* ── Hero Grid: Digital Insurance Card & Financial KPIs ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Virtual Digital Health Insurance Card Preview (Col 1 to 5) */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white shadow-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 border border-slate-800 flex flex-col justify-between min-h-[240px]">
            {/* Background Hologram Mesh */}
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 shadow-inner flex items-center justify-center border border-amber-200/40">
                  <span className="w-5 h-3.5 border-b border-t border-amber-900/40 block rounded-2xs" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-amber-200/90">
                    Comprehensive Health Pass
                  </h3>
                  <p className="text-[11px] font-medium text-slate-300">Star Health & Allied Insurance</p>
                </div>
              </div>
            </div>

            {/* Card Middle: Policy & Holder */}
            <div className="my-4 relative z-10">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Policy Number</p>
              <p className="text-lg sm:text-xl font-mono font-black tracking-wider text-white">
                STAR-IND-8849201
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Policyholder</p>
                  <p className="font-extrabold text-slate-100">{patientFullName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Member UHID</p>
                  <p className="font-mono font-bold text-slate-200">MH-PAT-2026-9041</p>
                </div>
              </div>
            </div>

            {/* Card Footer: Limits & Action */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between relative z-10 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Sum Insured Limit</span>
                <span className="text-sm font-black text-emerald-400">₹5,00,000</span>
                <span className="text-[10px] text-slate-400 ml-1.5">(₹4,75,500 Available)</span>
              </div>
              <button
                onClick={() => setIsCardModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/15 cursor-pointer flex items-center gap-1.5"
              >
                <QrCode size={13} />
                <span>View Card</span>
              </button>
            </div>
          </div>

          {/* KPI Strip (Col 6 to 12) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Claims Filed</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalCount}</h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Insurance requests on record</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Claimed Value</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{stats.totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Submitted across all policies</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <IndianRupee size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Settled & Approved</p>
                <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
                  ₹{stats.totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {stats.approvedCount} settled ({stats.settlementRate}% settlement rate)
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Under TPA Adjudication</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.pendingCount}</h3>
                <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Awaiting insurer clearance</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={22} />
              </div>
            </div>

          </div>
        </div>

        {/* ── Search, Filters & View Mode Controls ──────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Claims', count: stats.totalCount },
              { id: 'APPROVED', label: 'Settled & Approved', count: stats.approvedCount },
              { id: 'SUBMITTED', label: 'In TPA Review', count: stats.pendingCount },
              { id: 'REJECTED', label: 'Requires Action', count: stats.totalCount - (stats.approvedCount + stats.pendingCount) }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-none flex items-center gap-2 ${
                  activeFilter === tab.id
                    ? 'bg-[#2864FF] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeFilter === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Sort & View Mode */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search provider, policy #, procedure..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ backgroundImage: 'none' }}
                className="text-xs font-bold border border-slate-200 bg-white rounded-xl px-3 py-2 pr-7 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer shadow-2xs [background-image:none]"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#2864FF] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 bg-transparent'
                }`}
              >
                <LayoutGrid size={15} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table Ledger View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none flex items-center justify-center ${
                  viewMode === 'table'
                    ? 'bg-white text-[#2864FF] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 bg-transparent'
                }`}
              >
                <List size={15} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content View (Cards Grid / Table Ledger / Empty State) ───── */}
        {filteredClaims.length === 0 ? (
          /* ── Wide, Informative Zero-State & Educational Guide ─────────── */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2864FF] flex items-center justify-center mb-5 border border-blue-100 shadow-inner">
              <Shield size={38} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              {searchQuery ? 'No matching insurance claims found' : 'No Insurance Claims Submitted Yet'}
            </h3>
            <p className="text-sm font-medium text-slate-500 max-w-xl mb-8 leading-relaxed">
              {searchQuery
                ? `No claims found matching "${searchQuery}". Clear your search query or switch category filters.`
                : 'Experience cashless approvals and fast-track reimbursement settlements for consultations, diagnostic scans, medications, and hospitalization.'}
            </p>

            {/* 3-Step Guided Workflow Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-8 text-left">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center mb-2.5">
                  1
                </div>
                <h4 className="text-xs font-black text-slate-800">Upload Hospital Invoices</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Attach your doctor consultation slip, diagnostic report, or discharge bill.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center mb-2.5">
                  2
                </div>
                <h4 className="text-xs font-black text-slate-800">TPA Adjudication</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Our front desk & TPA partners verify claims against policy limits within 24 hours.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center mb-2.5">
                  3
                </div>
                <h4 className="text-xs font-black text-slate-800">Settlement & Payout</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Receive cashless hospital clearance or direct NEFT reimbursement to your bank account.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => {
                  setFormStep(1);
                  setIsNewClaimModalOpen(true);
                }}
                className="px-6 py-3 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 border-none"
              >
                <Plus size={16} />
                <span>Submit Your First Claim</span>
              </button>
              <button
                onClick={() => navigate('/patient/billing')}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <Receipt size={16} />
                <span>Review Medical Invoices</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Responsive Multi-Column Cards Grid ──────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredClaims.map((claim) => {
              const amount = Number(claim.claimAmount || claim.estimatedCost || 0);
              const approvedAmt = Number(claim.approvedAmount || 0);

              return (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: Provider & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mb-0.5">
                          #CLM-{String(claim.id).padStart(5, '0')}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2864FF] transition leading-snug">
                          {claim.provider || claim.providerName || 'Insurance Provider'}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Pol: {claim.policyNumber || 'N/A'}
                        </p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(claim.status)}</div>
                    </div>

                    {/* Procedure & Treatment Details */}
                    <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        {getTreatmentTypeBadge(claim.claimType)}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {claim.submittedAt ? format(new Date(claim.submittedAt), 'dd MMM yyyy') : 'Recent'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 line-clamp-2">
                        {claim.procedureName || claim.diagnosis || 'Clinical Treatment Claim'}
                      </p>
                      {claim.treatingDoctor && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Stethoscope size={12} className="text-blue-500" />
                          <span>{claim.treatingDoctor}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Financials & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Claimed Amount
                        </span>
                        <span className="text-base font-black text-slate-900">
                          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {approvedAmt > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                            Approved Amount
                          </span>
                          <span className="text-base font-black text-emerald-600">
                            ₹{approvedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-[#2864FF] text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>View Claim & EOB</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setTimeout(() => window.print(), 300);
                        }}
                        title="Download Statement"
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Table Ledger View ────────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Claim ID</th>
                    <th className="px-5 py-3.5">Provider & Policy</th>
                    <th className="px-5 py-3.5">Treatment / Service</th>
                    <th className="px-5 py-3.5">Service Date</th>
                    <th className="px-5 py-3.5">Claim Amount</th>
                    <th className="px-5 py-3.5">Approved Amount</th>
                    <th className="px-5 py-3.5">Adjudication Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((claim) => {
                    const amount = Number(claim.claimAmount || claim.estimatedCost || 0);
                    const approvedAmt = Number(claim.approvedAmount || 0);

                    return (
                      <tr key={claim.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-5 py-4 font-mono font-bold text-slate-400">
                          #CLM-{String(claim.id).padStart(5, '0')}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-slate-900 truncate max-w-[200px]" title={claim.provider || claim.providerName}>
                            {claim.provider || claim.providerName || 'Insurance Provider'}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">Pol: {claim.policyNumber}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs truncate text-slate-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            {getTreatmentTypeBadge(claim.claimType)}
                            <span className="truncate">{claim.procedureName || claim.diagnosis || 'Medical Treatment'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                          {claim.submittedAt ? format(new Date(claim.submittedAt), 'MMM dd, yyyy') : 'Recent'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-extrabold text-slate-900">
                          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-extrabold text-emerald-600">
                          {approvedAmt > 0 ? `₹${approvedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getStatusBadge(claim.status)}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedClaim(claim)}
                              title="View Full Claim"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-[#2864FF] transition cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClaim(claim);
                                setTimeout(() => window.print(), 300);
                              }}
                              title="Download EOB"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Modal 1: Submit New Claim Form (Comprehensive Clinical & Financial Upgrade) ── */}
        {isNewClaimModalOpen && (
          <Modal
            isOpen={isNewClaimModalOpen}
            onClose={() => setIsNewClaimModalOpen(false)}
            title="Submit Health Insurance Claim"
            size="xl"
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate(formData);
            }} className="space-y-5 pt-1">
              
              {/* Form Step Indicator */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {[
                    { step: 1, label: 'Policy & Patient' },
                    { step: 2, label: 'Treatment & Hospital' },
                    { step: 3, label: 'Expenses & Bank' },
                    { step: 4, label: 'Documents & Submit' }
                  ].map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setFormStep(s.step)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none ${
                        formStep === s.step
                          ? 'bg-[#2864FF] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                        formStep === s.step ? 'bg-white text-[#2864FF]' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {s.step}
                      </span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Step {formStep} of 4</span>
              </div>

              {/* ── STEP 1: Policy & Patient Identification ─────────────────── */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Select the insured beneficiary and insurance provider details as listed on your health insurance e-card or policy certificate.
                    </span>
                  </div>

                  {/* Beneficiary Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Claimant / Beneficiary *
                      </label>
                      <select
                        value={formData.beneficiaryType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            beneficiaryType: val,
                            beneficiaryName: val === 'SELF' ? patientFullName : ''
                          });
                        }}
                        style={{ backgroundImage: 'none' }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                      >
                        <option value="SELF">Primary Policyholder - {patientFullName} (Self)</option>
                        {dependents.map((dep) => (
                          <option key={dep.id} value={`DEP_${dep.id}`}>
                            {dep.fullName} ({dep.relationship || 'Dependent'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Claim Settlement Route *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, claimCategory: 'REIMBURSEMENT' })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                            formData.claimCategory === 'REIMBURSEMENT'
                              ? 'bg-blue-50 border-[#2864FF] text-[#2864FF]'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Reimbursement
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, claimCategory: 'CASHLESS_PREAUTH' })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                            formData.claimCategory === 'CASHLESS_PREAUTH'
                              ? 'bg-blue-50 border-[#2864FF] text-[#2864FF]'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Cashless Pre-Auth
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Provider & Policy Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Insurance Provider / TPA *
                      </label>
                      <select
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        style={{ backgroundImage: 'none' }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                      >
                        {POPULAR_PROVIDERS.map((p, i) => (
                          <option key={i} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {formData.provider === 'Other / Corporate TPA' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Specify Provider / TPA Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vidal Health / Paramount TPA"
                          value={formData.customProvider}
                          onChange={(e) => setFormData({ ...formData, customProvider: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Policy / TPA Contract Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. STAR-IND-8849201"
                          value={formData.policyNumber}
                          onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Member ID & Corporate Group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Member ID / Health Card ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MEM-99214 / UHID-881"
                        value={formData.memberId}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Corporate Employer / Group ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CORP-EMP-2026"
                        value={formData.corporateGroup}
                        onChange={(e) => setFormData({ ...formData, corporateGroup: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-[#2864FF] text-white text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <span>Continue to Treatment Details</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Treatment & Hospitalization Details ─────────────── */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Treatment Category *
                      </label>
                      <select
                        value={formData.claimType}
                        onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                        style={{ backgroundImage: 'none' }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                      >
                        <option value="OUTPATIENT_CONSULT">Outpatient Consultation (OPD)</option>
                        <option value="INPATIENT_HOSPITALIZATION">Inpatient Hospitalization (IPD)</option>
                        <option value="DIAGNOSTIC_IMAGING">Diagnostics, Scans & Pathology</option>
                        <option value="PHARMACY_MEDICINE">Prescribed Pharmacy & Medications</option>
                        <option value="DAY_SURGERY">Day Care Surgical Procedure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Hospital Invoice / Bill Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BILL-MET-2026-8910"
                        value={formData.billNumber}
                        onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Date of Treatment / Admission *
                      </label>
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.serviceDate}
                        onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Discharge Date (For Inpatient IPD)
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dischargeDate}
                        onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Treating Doctor Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Emily Watson"
                        value={formData.treatingDoctor}
                        onChange={(e) => setFormData({ ...formData, treatingDoctor: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Doctor Registration / Council No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MCI-2015-8831"
                        value={formData.doctorRegNumber}
                        onChange={(e) => setFormData({ ...formData, doctorRegNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary Diagnosis / Condition *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acute Bronchitis / Lumbar Disc Herniation"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Procedure / Clinical Service Performed *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lumbar Spine MRI & Digital Radiography Protocol"
                        value={formData.procedureName}
                        onChange={(e) => setFormData({ ...formData, procedureName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-[#2864FF] text-white text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <span>Continue to Expenses & Bank</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Financial Breakdown & Bank Settlement ──────────── */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <p className="font-bold text-slate-900 mb-1">Itemized Expense Breakdown (INR ₹)</p>
                    <p className="text-[11px] text-slate-500">
                      Enter the itemized charges from your bill. The total claim amount is automatically computed.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Doctor Fee (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.consultationFee}
                        onChange={(e) => handleItemizedFeeChange('consultationFee', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Scans & Labs (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.diagnosticsFee}
                        onChange={(e) => handleItemizedFeeChange('diagnosticsFee', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Pharmacy (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.pharmacyFee}
                        onChange={(e) => handleItemizedFeeChange('pharmacyFee', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Room & Others (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.hospitalRoomFee}
                        onChange={(e) => handleItemizedFeeChange('hospitalRoomFee', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                      />
                    </div>
                  </div>

                  {/* Total Claim Amount */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Total Claim Amount (INR ₹) *
                      </span>
                      <span className="text-[11px] text-slate-500">Auto-summed or enter total figure</span>
                    </div>
                    <div className="relative w-48">
                      <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.claimAmount}
                        onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/30"
                      />
                    </div>
                  </div>

                  {/* Direct Bank Settlement (For Reimbursement Route) */}
                  {formData.claimCategory === 'REIMBURSEMENT' && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Direct Bank Settlement Account (For NEFT Payout)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Holder Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John Smith"
                            value={formData.accountHolderName}
                            onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Name</label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC Bank Ltd"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 50100492817291"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC0001234"
                            value={formData.ifscCode}
                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(4)}
                      className="px-5 py-2.5 rounded-xl bg-[#2864FF] text-white text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <span>Continue to Document Uploads</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Document Uploads & TPA Declaration ─────────────── */}
              {formStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      1. Itemized Hospital Bill / Invoices (PDF or JPG) *
                    </label>
                    <div
                      onClick={() => billInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center"
                    >
                      <input
                        ref={billInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setBillFile(e.target.files[0]);
                          }
                        }}
                      />
                      {billFile ? (
                        <div className="flex items-center gap-3">
                          <FileCheck className="text-emerald-600" size={24} />
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-900">{billFile.name}</p>
                            <p className="text-[11px] text-slate-500">{(billFile.size / 1024).toFixed(1)} KB · Ready to attach</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <FileUp className="text-slate-400 mb-1" size={24} />
                          <p className="text-xs font-bold text-slate-700">Click to upload Final Hospital Bill</p>
                          <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Prescription / Consultation Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        2. Doctor Prescription / Summary
                      </label>
                      <div
                        onClick={() => prescriptionInputRef.current?.click()}
                        className="border border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-3 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/20 transition flex items-center justify-center gap-2"
                      >
                        <input
                          ref={prescriptionInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPrescriptionFile(e.target.files[0]);
                            }
                          }}
                        />
                        <FileText size={18} className={prescriptionFile ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                          {prescriptionFile ? prescriptionFile.name : 'Upload Doctor Rx'}
                        </span>
                      </div>
                    </div>

                    {/* Diagnostic Report Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        3. Diagnostic / Lab Reports (Optional)
                      </label>
                      <div
                        onClick={() => reportInputRef.current?.click()}
                        className="border border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-3 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/20 transition flex items-center justify-center gap-2"
                      >
                        <input
                          ref={reportInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setReportFile(e.target.files[0]);
                            }
                          }}
                        />
                        <FileText size={18} className={reportFile ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                          {reportFile ? reportFile.name : 'Upload Lab / Scans Report'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Clinical Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Additional Clinical Notes / TPA Observations
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Specify any relevant pre-existing condition, surgery details, or specific TPA instructions..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20"
                    />
                  </div>

                  {/* Legal TPA Declaration */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="insuranceDeclaration"
                      checked={formData.agreeDeclaration}
                      onChange={(e) => setFormData({ ...formData, agreeDeclaration: e.target.checked })}
                      className="mt-0.5 rounded text-[#2864FF] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="insuranceDeclaration" className="text-[11px] text-slate-600 leading-snug cursor-pointer">
                      I hereby declare that the medical information, consultation records, and hospital invoices submitted are authentic and accurate. I authorize Metropolitan Clinic and the designated TPA / Insurer to review medical records for claim settlement.
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitMutation.isPending || !formData.agreeDeclaration || !formData.claimAmount || !formData.policyNumber}
                      className="px-6 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer border-none shadow-md disabled:opacity-50"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Submitting to Insurer TPA...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Submit Claim for Adjudication</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </Modal>
        )}

        {/* ── Modal 2: View Full Claim Details & Explanation of Benefits (EOB) ── */}
        {selectedClaim && (
          <Modal
            isOpen={Boolean(selectedClaim)}
            onClose={() => setSelectedClaim(null)}
            title={`Claim #${String(selectedClaim.id).padStart(5, '0')} - Explanation of Benefits`}
            size="lg"
          >
            <div className="space-y-5 pt-1">
              
              {/* Top Banner: Status & Provider */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Insurance Provider / TPA</span>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedClaim.provider || selectedClaim.providerName || 'General Health Insurance'}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">Policy: {selectedClaim.policyNumber}</p>
                </div>
                <div>{getStatusBadge(selectedClaim.status)}</div>
              </div>

              {/* Live Adjudication Stepper */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Adjudication Progression
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Submitted
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Documents Verified
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    ['APPROVED', 'COMPLETED'].includes((selectedClaim.status || '').toUpperCase())
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                  }`}>
                    {['APPROVED', 'COMPLETED'].includes((selectedClaim.status || '').toUpperCase()) ? '✓ TPA Adjudicated' : '⏳ TPA Review'}
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    ['APPROVED', 'COMPLETED'].includes((selectedClaim.status || '').toUpperCase())
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {['APPROVED', 'COMPLETED'].includes((selectedClaim.status || '').toUpperCase()) ? '✓ Direct Disbursed' : 'Payment Clearance'}
                  </div>
                </div>
              </div>

              {/* Financial Ledger Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Claimed</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    ₹{Number(selectedClaim.claimAmount || selectedClaim.estimatedCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Settled Amount</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">
                    {selectedClaim.approvedAmount 
                      ? `₹${Number(selectedClaim.approvedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                      : 'Awaiting Settlement'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Treatment Type</p>
                  <p className="font-extrabold mt-1">{getTreatmentTypeBadge(selectedClaim.claimType)}</p>
                </div>
              </div>

              {/* Procedure & Doctor */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Clinical Procedure</h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-800">
                  {selectedClaim.procedureName || selectedClaim.diagnosis || 'Medical Consultation & Reimbursement Claim'}
                </div>
              </div>

              {/* Observations & Notes */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">TPA Settlement Notes</h4>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedClaim.notes || 'Routine health insurance reimbursement claim submitted for TPA cashless adjudication.'}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-2xs"
                >
                  <Printer size={14} />
                  <span>Print Claim Statement / EOB</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal 3: Digital Health Insurance Card Full Modal ─────────── */}
        {isCardModalOpen && (
          <Modal
            isOpen={isCardModalOpen}
            onClose={() => setIsCardModalOpen(false)}
            title="Digital Health Insurance E-Card"
            size="md"
          >
            <div className="space-y-4 pt-1">
              <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 border border-slate-800 flex flex-col justify-between min-h-[260px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="text-amber-400" size={24} />
                    <div>
                      <h4 className="text-xs font-black tracking-wider uppercase text-amber-200">Health E-Card</h4>
                      <p className="text-[11px] text-slate-300">Star Health & Allied Insurance</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    CASHLESS ACTIVE
                  </span>
                </div>

                <div className="my-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Policy Number</p>
                  <p className="text-xl font-mono font-black tracking-wider text-white">STAR-IND-8849201</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Policyholder Name</p>
                      <p className="font-extrabold text-slate-100">{patientFullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Member UHID</p>
                      <p className="font-mono font-bold text-slate-200">MH-PAT-2026-9041</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Annual Coverage</span>
                    <span className="text-base font-black text-emerald-400">₹5,00,000</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Valid Thru</span>
                    <span className="font-mono font-bold text-slate-200">12 / 2027</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Hospital Cashless Helpdesk</p>
                  <p className="text-[11px] text-slate-500">Toll-free 24/7 TPA Support: 1800-425-2255</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </motion.div>
  );
}
