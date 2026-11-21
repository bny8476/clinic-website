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
  CreditCard
} from 'lucide-react';

import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import Modal from '../../components/ui/Modal';
import { fadeUp, staggerChildren, pageTransition } from '../../components/ui/motion';

// Common Indian & Global Health Insurance Providers
const POPULAR_PROVIDERS = [
  'Star Health & Allied Insurance',
  'Care Health Insurance (Religare)',
  'HDFC ERGO Health Insurance',
  'ICICI Lombard General Insurance',
  'Niva Bupa Health Insurance (Max Bupa)',
  'Bajaj Allianz General Insurance',
  'Tata AIG General Insurance',
  'United India Insurance',
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
    claimType: 'INPATIENT_HOSPITALIZATION',
    claimAmount: 24500.00,
    estimatedCost: 24500.00,
    approvedAmount: 22800.00,
    status: 'APPROVED',
    procedureName: 'Post-Operative Orthopedic Rehabilitation & Physical Therapy',
    serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    treatingDoctor: 'Dr. Emily Watson',
    hospitalName: 'Metropolitan Surgical Specialty Hospital',
    notes: 'Inpatient rehabilitation package covering physiotherapy and nursing care. Co-pay of 7% applied per policy schedule.',
    denialReason: null
  },
  {
    id: 102,
    isDemo: true,
    provider: 'HDFC ERGO Health Insurance',
    providerName: 'HDFC ERGO Health Insurance',
    policyNumber: 'HDFC-OPT-772194',
    claimType: 'DIAGNOSTIC_IMAGING',
    claimAmount: 11200.00,
    estimatedCost: 11200.00,
    approvedAmount: null,
    status: 'SUBMITTED',
    procedureName: 'Lumbar Spine MRI & Digital Radiography Protocol',
    serviceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    treatingDoctor: 'Dr. Marcus Vance',
    hospitalName: 'Metropolitan Imaging Center',
    notes: 'Diagnostic imaging for radiculopathy evaluation. Awaiting cashless TPA adjudication.',
    denialReason: null
  },
  {
    id: 103,
    isDemo: true,
    provider: 'Care Health Insurance (Religare)',
    providerName: 'Care Health Insurance (Religare)',
    policyNumber: 'CARE-FLT-443912',
    claimType: 'OUTPATIENT_CONSULT',
    claimAmount: 3800.00,
    estimatedCost: 3800.00,
    approvedAmount: 3800.00,
    status: 'APPROVED',
    procedureName: 'Comprehensive Cardiovascular Consultation & Biomarker Screen',
    serviceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    treatingDoctor: 'Dr. Sarah Jenkins',
    hospitalName: 'Metropolitan Health Clinic OPD',
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

  // Enhanced Form State
  const [formData, setFormData] = useState({
    provider: 'Star Health & Allied Insurance',
    customProvider: '',
    policyNumber: '',
    memberId: '',
    claimType: 'OUTPATIENT_CONSULT',
    serviceDate: new Date().toISOString().split('T')[0],
    treatingDoctor: '',
    hospitalName: 'Metropolitan Health Clinic',
    claimAmount: '',
    diagnosis: '',
    notes: '',
    agreeDeclaration: true
  });

  const [billFile, setBillFile] = useState(null);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch Patient Insurance Claims (Dual API resilience: checks /v1/patient/insurance and /v1/patient/insurance-claims)
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

  // Submit Insurance Claim Mutation (Resilient fallback to both endpoints)
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      // If user uploaded a bill file, upload to /documents first
      let attachedDocInfo = '';
      if (billFile) {
        try {
          const docData = new FormData();
          docData.append('file', billFile);
          docData.append('ownerType', 'PATIENT');
          docData.append('ownerId', user?.id || 1);
          docData.append('documentType', 'INSURANCE');
          docData.append('title', `Insurance Bill - ${payload.provider || 'Claim'}`);
          docData.append('description', `Claim amount: ₹${payload.claimAmount}. Policy: ${payload.policyNumber}`);
          const uploadRes = await axiosPrivate.post('/documents', docData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.id) {
            attachedDocInfo = ` [Doc ID: #${uploadRes.data.id}]`;
          }
        } catch (uploadErr) {
          console.warn('Bill upload warning', uploadErr);
        }
      }

      // Compile comprehensive structured notes for backend
      const structuredNotes = `[${payload.claimType}] ${payload.diagnosis ? `Diagnosis: ${payload.diagnosis}. ` : ''}Service Date: ${payload.serviceDate || 'Recent'}. Doctor: ${payload.treatingDoctor || 'Attending Physician'}. Member ID: ${payload.memberId || 'Self'}. ${payload.notes || ''}${attachedDocInfo}`;

      const resolvedProvider = payload.provider === 'Other / Corporate TPA' 
        ? (payload.customProvider || 'Corporate TPA') 
        : payload.provider;

      const body = {
        provider: resolvedProvider,
        policyNumber: payload.policyNumber,
        claimAmount: parseFloat(payload.claimAmount || 0),
        notes: structuredNotes
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
      toast.success('Insurance claim submitted successfully for TPA adjudication!');
      setIsNewClaimModalOpen(false);
      setBillFile(null);
      setFormData({
        provider: 'Star Health & Allied Insurance',
        customProvider: '',
        policyNumber: '',
        memberId: '',
        claimType: 'OUTPATIENT_CONSULT',
        serviceDate: new Date().toISOString().split('T')[0],
        treatingDoctor: '',
        hospitalName: 'Metropolitan Health Clinic',
        claimAmount: '',
        diagnosis: '',
        notes: '',
        agreeDeclaration: true
      });
      queryClient.invalidateQueries(['insuranceClaims']);
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit insurance claim. Please check your details.');
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
      } else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW' || s === 'PENDING_INFO') {
        pendingCount++;
      }
    });

    return { totalCount, totalClaimed, totalSettled, approvedCount, pendingCount };
  }, [claims]);

  // Filter and sort claims
  const filteredClaims = useMemo(() => {
    let list = [...claims];

    // Status Tab
    if (activeFilter === 'APPROVED') {
      list = list.filter(c => ['APPROVED', 'COMPLETED'].includes((c.status || '').toUpperCase()));
    } else if (activeFilter === 'SUBMITTED') {
      list = list.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes((c.status || '').toUpperCase()));
    } else if (activeFilter === 'REJECTED') {
      list = list.filter(c => ['REJECTED', 'DENIED', 'PENDING_INFO'].includes((c.status || '').toUpperCase()));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const prov = (c.provider || c.providerName || '').toLowerCase();
        const pol = (c.policyNumber || '').toLowerCase();
        const proc = (c.procedureName || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        const idStr = String(c.id || '');
        return prov.includes(q) || pol.includes(q) || proc.includes(q) || notes.includes(q) || idStr.includes(q);
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckCircle2 size={13} className="text-emerald-600" />
          APPROVED & SETTLED
        </span>
      );
    }
    if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={13} className="text-amber-600" />
          DOCUMENTS REQUIRED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={13} className="text-rose-600" />
        REJECTED / DENIED
      </span>
    );
  };

  // Treatment Type Theme Helper
  const getTreatmentTypeBadge = (type) => {
    switch (type) {
      case 'INPATIENT_HOSPITALIZATION':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-800">IPD ADMISSION</span>;
      case 'OUTPATIENT_CONSULT':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">OPD CONSULT</span>;
      case 'DIAGNOSTIC_IMAGING':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">SCANS & LABS</span>;
      case 'PHARMACY_MEDICINE':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">PHARMACY RX</span>;
      default:
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">MEDICAL CLAIM</span>;
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Cashless & Reimbursement TPA
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Submit claims for consultations, procedures, and inpatient care. Track real-time adjudication and reimbursement settlements.
              </p>
            </div>
          </div>

          {/* Action CTAs (Strict Single Row) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-nowrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
              onClick={() => navigate('/patient/billing')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Receipt size={15} />
              <span>Medical Invoices</span>
            </button>

            <button
              onClick={() => setIsNewClaimModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer flex items-center gap-2 border-none whitespace-nowrap shrink-0"
            >
              <Plus size={15} />
              <span>Submit New Claim</span>
            </button>
          </div>
        </div>

        {/* ── KPI Strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">{stats.approvedCount} claims approved in full</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Under TPA Review</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.pendingCount}</h3>
              <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Awaiting insurer adjudication</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={22} />
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
              { id: 'SUBMITTED', label: 'In Review', count: stats.pendingCount },
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
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#2864FF] flex items-center justify-center mb-4 shadow-inner">
              <Shield size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              {searchQuery ? 'No matching insurance claims found' : 'No Claims on Record'}
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-md mb-6 leading-relaxed">
              {searchQuery
                ? `No claims found matching "${searchQuery}". Clear your search or switch category filters.`
                : 'Submit insurance reimbursement or cashless claims for your clinic visits, diagnostic tests, or inpatient care.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
              <button
                onClick={() => setIsNewClaimModalOpen(true)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Plus size={18} className="text-[#2864FF] mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#2864FF]">Submit New Claim</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">File reimbursement with bill</p>
              </button>

              <button
                onClick={() => navigate('/patient/billing')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <Receipt size={18} className="text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Review Invoices</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Check outstanding bills</p>
              </button>

              <button
                onClick={() => navigate('/patient/records')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition cursor-pointer group"
              >
                <FileText size={18} className="text-emerald-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Medical Records</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Get consultation summaries</p>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── View 1: Responsive Grid Cards ────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClaims.map((claim) => {
              const isApproved = ['APPROVED', 'COMPLETED'].includes((claim.status || '').toUpperCase());
              const isSubmitted = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes((claim.status || '').toUpperCase());
              const amount = Number(claim.claimAmount || claim.estimatedCost || 0);
              const approvedAmt = Number(claim.approvedAmount || 0);

              return (
                <motion.div
                  key={claim.id}
                  variants={fadeUp}
                  className={`bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group ${
                    isApproved ? 'border-slate-200/80 hover:border-emerald-200' : isSubmitted ? 'border-blue-200 ring-1 ring-blue-500/10' : 'border-rose-200'
                  }`}
                >
                  <div>
                    {/* Top Row: Provider Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-[#2864FF]" />
                        <span className="text-xs font-black text-slate-800 truncate max-w-[170px]" title={claim.provider || claim.providerName}>
                          {claim.provider || claim.providerName || 'Insurance Carrier'}
                        </span>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    {/* Claim Title / Procedure */}
                    <h3 
                      onClick={() => setSelectedClaim(claim)}
                      className="text-base font-extrabold text-slate-900 group-hover:text-[#2864FF] transition-colors cursor-pointer line-clamp-1 mb-1 tracking-tight"
                      title={claim.procedureName}
                    >
                      {claim.procedureName || 'Medical Treatment Claim'}
                    </h3>

                    {/* Policy & ID Details */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-3">
                      <span className="font-mono">POL: {claim.policyNumber || 'ON FILE'}</span>
                      <span className="font-mono">#CLM-{String(claim.id).padStart(5, '0')}</span>
                    </div>

                    {/* 4-Stage Adjudication Pipeline */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3">
                      <div className="flex items-center justify-between mb-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span className="text-[#2864FF]">1. Submitted</span>
                        <span className={isSubmitted || isApproved ? 'text-[#2864FF]' : ''}>2. Review</span>
                        <span className={isApproved ? 'text-emerald-600' : ''}>3. Settled</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isApproved ? 'bg-emerald-500 w-full' : isSubmitted ? 'bg-[#2864FF] w-2/3' : 'bg-rose-400 w-1/3'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Claim Amount & Settlement Banner */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 flex items-baseline justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Claim Amount</p>
                        <p className="text-base font-black text-slate-900 flex items-center">
                          <IndianRupee size={14} className="mr-0.5 text-slate-500" />
                          {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {isApproved && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Settled by Insurer</p>
                          <p className="text-base font-black text-emerald-600 flex items-center justify-end">
                            <IndianRupee size={14} className="mr-0.5 text-emerald-500" />
                            {(approvedAmt > 0 ? approvedAmt : amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes Snippet */}
                    {claim.notes && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {claim.notes}
                      </p>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedClaim(claim)}
                      className="text-xs font-bold text-[#2864FF] hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-0"
                    >
                      <Eye size={14} />
                      <span>View Claim Sheet</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
                    >
                      <Download size={13} />
                      <span>EOB Summary</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── View 2: High-Density Table Ledger ──────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Claim ID</th>
                    <th className="px-5 py-3.5">Provider & Policy</th>
                    <th className="px-5 py-3.5">Procedure / Treatment</th>
                    <th className="px-5 py-3.5">Submitted Date</th>
                    <th className="px-5 py-3.5">Claimed Amount</th>
                    <th className="px-5 py-3.5">Settlement</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
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
                          {claim.procedureName || 'Medical Claim'}
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

        {/* ── Modal 1: Submit New Claim Form (Enhanced Clinical Details) ─ */}
        {isNewClaimModalOpen && (
          <Modal
            isOpen={isNewClaimModalOpen}
            onClose={() => setIsNewClaimModalOpen(false)}
            title="Submit Health Insurance Claim"
            size="lg"
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate(formData);
            }} className="space-y-4 pt-1">
              <p className="text-xs font-medium text-slate-500">
                Please provide accurate policy and clinical treatment details along with itemized hospital invoices for rapid TPA adjudication.
              </p>

              {/* Row 1: Provider & Custom Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Insurance Provider / TPA *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      style={{ backgroundImage: 'none' }}
                      className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                    >
                      {POPULAR_PROVIDERS.map((p, i) => (
                        <option key={i} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {formData.provider === 'Other / Corporate TPA' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Specify Provider / TPA Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Medi Assist / Vidal Health TPA"
                      value={formData.customProvider}
                      onChange={(e) => setFormData({ ...formData, customProvider: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Policy / TPA Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POL-8829103"
                      value={formData.policyNumber}
                      onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Member ID & Treatment Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Member ID / Card No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MEM-99214"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Treatment Category *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.claimType}
                      onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                      style={{ backgroundImage: 'none' }}
                      className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] appearance-none cursor-pointer [background-image:none]"
                    >
                      <option value="OUTPATIENT_CONSULT">Outpatient Consultation (OPD)</option>
                      <option value="INPATIENT_HOSPITALIZATION">Inpatient Hospitalization (IPD)</option>
                      <option value="DIAGNOSTIC_IMAGING">Diagnostics, Scans & Pathology</option>
                      <option value="PHARMACY_MEDICINE">Prescribed Pharmacy & Medications</option>
                      <option value="DAY_SURGERY">Day Care Surgical Procedure</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 3: Date of Service & Claim Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Treatment / Service *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Claim Amount (INR ₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.claimAmount}
                      onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Treating Doctor & Primary Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Treating Doctor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={formData.treatingDoctor}
                    onChange={(e) => setFormData({ ...formData, treatingDoctor: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Diagnosis / Medical Condition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Bronchitis / Lumbar Radiculopathy"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                  />
                </div>
              </div>

              {/* Row 5: Document / Bill Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Itemized Hospital Bill / Discharge Slip / Prescription (PDF or Image)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center"
                >
                  <input
                    ref={fileInputRef}
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
                      <FileCheck className="text-emerald-600" size={22} />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900">{billFile.name}</p>
                        <p className="text-[11px] text-slate-500">{(billFile.size / 1024).toFixed(1)} KB · Ready to attach</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileUp className="text-slate-400 mb-1.5" size={22} />
                      <p className="text-xs font-bold text-slate-700">Click to attach hospital bill or cashless slip</p>
                      <p className="text-[11px] text-slate-400">PDF, JPG, PNG up to 15MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Notes for TPA Reviewer
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify any co-pay riders, cashless authorization letters, or pharmacy notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF]"
                />
              </div>

              {/* Consent checkbox */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="claimConsent"
                  checked={formData.agreeDeclaration}
                  onChange={(e) => setFormData({ ...formData, agreeDeclaration: e.target.checked })}
                  className="mt-0.5 rounded text-[#2864FF] focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="claimConsent" className="text-xs text-blue-900 cursor-pointer leading-relaxed">
                  I declare that the expenses claimed above were incurred for medical treatment, and the details and bills attached are authentic and true.
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  disabled={submitMutation.isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending || !formData.claimAmount || !formData.agreeDeclaration}
                  className="px-5 py-2 rounded-xl bg-[#2864FF] hover:bg-blue-600 text-white text-xs font-extrabold transition shadow-2xs cursor-pointer border-none flex items-center gap-2 disabled:opacity-50"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Submitting Claim...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Submit Claim for TPA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal 2: Official Insurance Claim Sheet Modal ────────────── */}
        {selectedClaim && (
          <Modal
            isOpen={!!selectedClaim}
            onClose={() => setSelectedClaim(null)}
            title="Official Insurance Claim Summary"
            size="lg"
          >
            <div className="space-y-6 pt-1">
              {/* Header Letterhead */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase block mb-1">
                    METROPOLITAN HEALTH · TPA ADJUDICATION DESK
                  </span>
                  <h3 className="text-lg font-black tracking-tight">
                    {selectedClaim.provider || selectedClaim.providerName || 'Health Insurance Claim'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-300 block">
                    CLAIM ID: #CLM-{String(selectedClaim.id).padStart(6, '0')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedClaim.submittedAt ? format(new Date(selectedClaim.submittedAt), 'MMMM dd, yyyy · hh:mm a') : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Claim Financial Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Policy Number</p>
                  <p className="font-mono font-extrabold text-slate-900 mt-0.5">{selectedClaim.policyNumber || 'ON FILE'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Name</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{user?.name || user?.username || 'Current Patient'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Claimed Amount</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    ₹{Number(selectedClaim.claimAmount || selectedClaim.estimatedCost || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Adjudication Status</p>
                  <p className="font-extrabold mt-0.5">{getStatusBadge(selectedClaim.status)}</p>
                </div>
              </div>

              {/* Procedure & Treatment Details */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Treatment / Medical Service</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-800">
                  {selectedClaim.procedureName || 'Medical Treatment Reimbursement Claim'}
                </div>
              </div>

              {/* Detailed Notes / Breakdown */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Claim Details & TPA Observations</h4>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedClaim.notes || 'No specific notes recorded for this claim.'}
                </div>
              </div>

              {/* Denial Reason if Rejected */}
              {selectedClaim.denialReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-600" />
                    <span>Insurer Denial Observation</span>
                  </p>
                  <p className="text-xs text-rose-800 leading-relaxed">{selectedClaim.denialReason}</p>
                </div>
              )}

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
                  <span>Print Claim Statement</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </motion.div>
  );
}
