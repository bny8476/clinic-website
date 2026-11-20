import EMRChart from './emr/EMRChart';
import CarePlan from './emr/CarePlan';
import ClinicalTimeline from './ClinicalTimeline';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Activity, AlertCircle, ArrowLeft, Calendar, ChevronLeft, ChevronRight, ClipboardList, CreditCard, Droplet, FileText, FlaskConical, FolderOpen, HeartPulse, Info, List, Loader2, Mail, MapPin, Phone, Pill, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import DoctorMedicineSales from '../../components/doctor/DoctorMedicineSales';

const TABS = [
  'Overview', 'Timeline', 'Appointments', 'Prescriptions', 'Medicine Sales', 'Lab Reports',
  'Medical History', 'Care Plans', 'Documents', 'Billing & Payments'
];

const EmptyState = ({ icon: Icon, title, desc }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
      <Icon className="text-slate-300" size={22} />
    </div>
    <p className="text-sm font-semibold text-slate-600">{title}</p>
    {desc && <p className="text-xs text-slate-400 mt-1">{desc}</p>}
  </motion.div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="animate-spin text-indigo-500" size={24} />
  </div>
);

/* ── Appointments Tab ─────────────────────────────────────────────── */
const AppointmentsTab = ({ patientUserId }) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['patientAppointmentsForDoctor', patientUserId],
    queryFn: async () => (await axiosPrivate.get(`/appointments/patient/${patientUserId}`)).data,
    enabled: !!patientUserId,
  });

  if (isLoading) return <LoadingState />;
  if (!data.length) return <EmptyState icon={Calendar} title="No appointments" desc="No appointment records found for this patient." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(a => (
            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-slate-800">
                {a.startTime ? new Date(a.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{a.reasonForVisit || '—'}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  a.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>{a.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Prescriptions Tab ────────────────────────────────────────────── */
const PrescriptionsTab = ({ patientUserId }) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['patientPrescriptionsForDoctor', patientUserId],
    queryFn: async () => (await axiosPrivate.get(`/prescriptions/patient/${patientUserId}`)).data,
    enabled: !!patientUserId,
  });

  if (isLoading) return <LoadingState />;
  if (!data.length) return <EmptyState icon={Pill} title="No prescriptions" desc="No prescriptions on record for this patient." />;

  return (
    <div className="space-y-3">
      {data.map(rx => (
        <div key={rx.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">
              Prescription #{rx.id} · {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : '—'}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              rx.status === 'Signed' ? 'bg-emerald-100 text-emerald-800' :
              rx.status === 'Void' ? 'bg-red-100 text-red-800' :
              'bg-slate-200 text-slate-600'
            }`}>{rx.status}</span>
          </div>
          {rx.items?.length > 0 ? (
            <ul className="space-y-1">
              {rx.items.map((item, i) => (
                <li key={i} className="text-sm text-slate-800 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  {item.medicationName} {item.dosage && `· ${item.dosage}`}
                  {item.frequency && ` · ${item.frequency}`}
                  {item.duration && ` · ${item.duration}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No items</p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Lab Reports Tab ──────────────────────────────────────────────── */
const LabReportsTab = ({ patientUserId }) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['patientLabReportsForDoctor', patientUserId],
    queryFn: async () => (await axiosPrivate.get(`/lab/doctor/patient-reports/${patientUserId}`)).data,
    enabled: !!patientUserId,
  });

  if (isLoading) return <LoadingState />;
  if (!data.length) return <EmptyState icon={FlaskConical} title="No lab reports" desc="No lab reports found for this patient." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Test Name</th>
            <th className="px-4 py-3">Requested</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(lab => (
            <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-slate-800">{lab.testCatalog?.testName || lab.testName || '—'}</td>
              <td className="px-4 py-3 text-slate-600">
                {lab.requestedAt ? new Date(lab.requestedAt).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  lab.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                  lab.status === 'PROCESSING' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-600'
                }`}>{lab.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Documents Tab ────────────────────────────────────────────────── */
const DocumentsTab = ({ patientId }) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['patientDocumentsForDoctor', patientId],
    queryFn: async () => {
      try {
        return (await axiosPrivate.get(`/doctor/patients/${patientId}/documents`)).data;
      } catch {
        return [];
      }
    },
    enabled: !!patientId,
  });

  if (isLoading) return <LoadingState />;
  if (!data.length) return <EmptyState icon={FolderOpen} title="No documents" desc="No documents uploaded for this patient." />;

  return (
    <div className="space-y-2">
      {data.map(doc => (
        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{doc.fileName || doc.name || 'Document'}</p>
              <p className="text-xs text-slate-400">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</p>
            </div>
          </div>
          {doc.fileUrl && (
            <a href={doc.fileUrl} target="_blank" rel="noreferrer"
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
              View
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Billing Tab ──────────────────────────────────────────────────── */
const BillingTab = ({ patientUserId }) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['patientBillingForDoctor', patientUserId],
    queryFn: async () => {
      try {
        return (await axiosPrivate.get(`/billing/patient/${patientUserId}`)).data;
      } catch {
        return [];
      }
    },
    enabled: !!patientUserId,
  });

  if (isLoading) return <LoadingState />;
  if (!data.length) return <EmptyState icon={CreditCard} title="No billing records" desc="No billing or payment records found." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Invoice #</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(bill => (
            <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-slate-800">#{bill.invoiceNumber || bill.id}</td>
              <td className="px-4 py-3 text-slate-600">
                {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 font-bold text-slate-800">
                {bill.currency || '$'}{bill.totalAmount ?? bill.amount ?? '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  bill.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>{bill.status || 'PENDING'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Helper to parse clinical fields (JSON string, array, or comma-separated) ── */
const parseClinicalArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s || s === '[]' || s === '""' || s === "''" || s === '"[]"') return [];
    try {
      let p = JSON.parse(s);
      if (typeof p === 'string') {
        try { p = JSON.parse(p); } catch { /* ignore */ }
      }
      if (Array.isArray(p)) return p.filter(Boolean);
      if (p && typeof p === 'object') return Object.values(p).filter(Boolean);
      if (typeof p === 'string' && p.trim() && p !== '[]') return [p.trim()];
    } catch {
      // not JSON
    }
    const cleaned = s.replace(/[[\]"\\]/g, '').trim();
    return cleaned ? cleaned.split(',').map(x => x.trim()).filter(Boolean) : [];
  }
  return [];
};

/* ── Main Component ───────────────────────────────────────────────── */
const PatientDetail = ({ patientIdOverride }) => {
  const { patientId: paramPatientId } = useParams();
  const patientId = patientIdOverride || paramPatientId;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const tabsContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    checkTabScroll();
    const handleResize = () => checkTabScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = 260;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkTabScroll, 320);
    }
  };

  // Main patient detail query — returns real data including counts
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: async () => (await axiosPrivate.get(`/doctor/patients/${patientId}`)).data,
  });

  // Parsed clinical arrays to prevent raw JSON strings like "[\"Hypertension\"]" or "[]"
  const chronicList = useMemo(() => parseClinicalArray(patient?.chronicConditions), [patient?.chronicConditions]);
  const surgeryList = useMemo(() => parseClinicalArray(patient?.pastSurgeries), [patient?.pastSurgeries]);
  const familyList = useMemo(() => parseClinicalArray(patient?.familyHistory), [patient?.familyHistory]);
  const allergyList = useMemo(() => parseClinicalArray(patient?.allergies), [patient?.allergies]);
  const medicationList = useMemo(() => parseClinicalArray(patient?.currentMedications || patient?.medications), [patient?.currentMedications, patient?.medications]);

  const displayMedicalHistory = useMemo(() => {
    if (!patient?.medicalHistorySummary) return null;
    const raw = String(patient.medicalHistorySummary).trim();
    if (!raw || raw === '[]' || raw === '""' || raw === "''" || raw === '"[]"') return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join('. ');
      if (typeof parsed === 'string') return parsed;
    } catch {
      // plain text
    }
    return raw.replace(/^[["']+|[["']+$/g, '').trim();
  }, [patient?.medicalHistorySummary]);

  if (isLoading) return (
    <div className="p-10 flex items-center justify-center gap-3 text-slate-500 font-medium">
      <Loader2 className="animate-spin text-indigo-500" size={20} />
      Loading patient details...
    </div>
  );
  if (!patient) return (
    <div className="p-10 text-center text-red-500 font-medium flex flex-col items-center gap-2">
      <AlertCircle size={32} />
      Patient not found or access denied.
    </div>
  );

  // patientId in URL = patientUserId (the user's system ID)
  // patient.profileId = the profile-level ID
  const patientUserId = patient.patientId; // from /doctor/patients/:userId — patientId field = userId
  const profileId = patient.profileId;

  const generateDisplayId = (id) => id ? `PAT-${String(id).padStart(5, '0')}` : '—';

  // Compute real stats from data already returned by the API
  const apptCount = patient.appointmentHistory?.length ?? '—';
  const rxCount = patient.previousPrescriptions?.length ?? '—';

  return (
    <div className={`${patientIdOverride ? 'p-1 sm:p-3' : 'p-6'} bg-[#F8FAFC] min-h-full font-sans`}>
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* Breadcrumb Header - Only shown on standalone page, hidden in modal panel */}
        {!patientIdOverride && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span className="cursor-pointer hover:text-slate-800" onClick={() => navigate('/doctor/patients')}>Patients</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="text-slate-800">Patient Details</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/patients')}
              className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} strokeWidth={2.5} /> Back to Patients
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-[320px] xl:w-[340px] flex-shrink-0 flex flex-col gap-4">

            {/* Profile Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col items-center">
              <div className="flex items-center gap-4 w-full mb-5">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Patient')}&background=ede9fe&color=5b21b6&bold=true`}
                  alt={patient.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight truncate">{patient.name || '—'}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-1.5 font-mono">ID: {generateDisplayId(profileId)}</p>
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase tracking-wide">
                    Active Patient
                  </span>
                </div>
              </div>

              {/* Detail List */}
              <div className="w-full flex flex-col gap-3.5 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <User size={14} className="text-indigo-600" /> Age / Gender
                  </span>
                  <span className="text-slate-800 font-bold">
                    {patient.age ? `${patient.age} yrs` : '—'} / {patient.gender || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Phone size={14} className="text-indigo-600" /> Phone
                  </span>
                  <span className="text-slate-800 font-bold">{patient.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Mail size={14} className="text-indigo-600" /> Email
                  </span>
                  <span className="text-slate-800 font-bold truncate max-w-[170px]" title={patient.email}>{patient.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Droplet size={14} className="text-rose-500" /> Blood Group
                  </span>
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-extrabold rounded border border-rose-100">
                    {patient.bloodGroup || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} className="text-indigo-600" /> Date of Birth
                  </span>
                  <span className="text-slate-800 font-bold">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="flex items-start justify-between pt-1">
                  <span className="flex items-center gap-2 text-slate-400 shrink-0">
                    <MapPin size={14} className="text-indigo-600 mt-0.5" /> Address
                  </span>
                  <span className="text-slate-800 font-medium text-right text-[11px] max-w-[170px] leading-tight">
                    {patient.address || '—'}
                  </span>
                </div>
              </div>

              {/* Stats Boxes */}
              <div className="w-full grid grid-cols-3 gap-2 mt-5 border-t border-slate-100 pt-5">
                <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-black text-emerald-600">{apptCount}</span>
                  <span className="text-[10px] font-bold text-emerald-800 mt-0.5">Appointments</span>
                </div>
                <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-black text-blue-600">{rxCount}</span>
                  <span className="text-[10px] font-bold text-blue-800 mt-0.5">Prescriptions</span>
                </div>
                <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                  <HeartPulse size={16} className="text-amber-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-amber-800">Records</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 m-0">Emergency Contact</h3>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">Priority</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 m-0">{patient.emergencyContactName || '—'}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 m-0">{patient.emergencyContactPhone || '—'}</p>
                  </div>
                  {patient.emergencyContactPhone && (
                    <a 
                      href={`tel:${patient.emergencyContactPhone}`}
                      className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
                      title={`Call ${patient.emergencyContactPhone}`}
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Allergies */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 m-0">Known Allergies</h3>
                {allergyList.length > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    {allergyList.length} Active
                  </span>
                )}
              </div>
              {allergyList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergyList.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200/80 flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-amber-600 shrink-0" />
                      {typeof a === 'string' ? a : (a.allergen || JSON.stringify(a))}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic m-0">No known allergies on record</p>
              )}
            </div>

            {/* Chronic Conditions (Left Sidebar Tags) */}
            {chronicList.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 m-0">Chronic Conditions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {chronicList.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-100 flex items-center gap-1.5">
                      <Activity size={12} className="text-rose-500 shrink-0" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col min-w-0 gap-4">

            {/* Tabs Navigation Bar with Scroll Controls on Both Ends */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs flex items-center gap-1.5">
              {/* Left Scroll Button */}
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                disabled={!canScrollLeft}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all border border-transparent ${
                  canScrollLeft 
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 cursor-pointer shadow-2xs' 
                    : 'text-slate-300 bg-transparent cursor-not-allowed opacity-35'
                }`}
                title="Scroll Left"
                aria-label="Scroll tabs left"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              {/* Tabs Scroll Container */}
              <div 
                ref={tabsContainerRef}
                onScroll={checkTabScroll}
                className="flex-1 flex gap-1.5 overflow-x-auto py-0.5 scroll-smooth [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {TABS.map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-none shrink-0 ${
                      activeTab === tab 
                        ? 'bg-[#2160FF] text-white shadow-sm font-extrabold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Right Scroll Button */}
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                disabled={!canScrollRight}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all border border-transparent ${
                  canScrollRight 
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 cursor-pointer shadow-2xs' 
                    : 'text-slate-300 bg-transparent cursor-not-allowed opacity-35'
                }`}
                title="Scroll Right"
                aria-label="Scroll tabs right"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col gap-6 relative min-h-[450px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1"
                >

              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  {/* Summary Cards — 4 Columns on desktop panels, perfectly balanced */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                    
                    {/* 1. Last Appointment */}
                    <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between min-h-[118px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Last Visit</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Calendar size={16} />
                        </div>
                      </div>
                      <div className="my-1">
                        {patient.appointmentHistory?.length > 0 ? (
                          <p className="text-base font-black text-slate-900 m-0">
                            {new Date(patient.appointmentHistory[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        ) : (
                          <p className="text-sm font-extrabold text-slate-700 m-0">No visits recorded</p>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 truncate m-0">
                        {patient.appointmentHistory?.[0]?.reason || 'Consultation history'}
                      </p>
                    </div>

                    {/* 2. Chronic Conditions */}
                    <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 flex flex-col justify-between min-h-[118px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#15803D] uppercase tracking-wider">Chronic Conditions</span>
                        <div className="w-8 h-8 rounded-xl bg-green-100 text-[#16A34A] flex items-center justify-center shrink-0">
                          <Activity size={16} />
                        </div>
                      </div>
                      <div className="my-1">
                        {chronicList.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {chronicList.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white text-emerald-800 text-xs font-bold rounded-md border border-emerald-200">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-extrabold text-emerald-800 m-0">None Reported</p>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-emerald-600 truncate m-0">
                        {chronicList.length > 0 ? `${chronicList.length} Active Condition${chronicList.length > 1 ? 's' : ''}` : 'Routine monitoring'}
                      </p>
                    </div>

                    {/* 3. Total Prescriptions */}
                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 flex flex-col justify-between min-h-[118px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#C2410C] uppercase tracking-wider">Total Prescriptions</span>
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                      </div>
                      <div className="my-1">
                        <p className="text-2xl font-black text-slate-900 leading-none m-0">{rxCount}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Prescriptions')}
                        className="text-[11px] font-bold text-[#EA580C] hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                      >
                        View all prescriptions →
                      </button>
                    </div>

                    {/* 4. Total Appointments */}
                    <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-4 flex flex-col justify-between min-h-[118px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#1D4ED8] uppercase tracking-wider">Total Appointments</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                          <ClipboardList size={16} />
                        </div>
                      </div>
                      <div className="my-1">
                        <p className="text-2xl font-black text-slate-900 leading-none m-0">{apptCount}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Appointments')}
                        className="text-[11px] font-bold text-[#2563EB] hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                      >
                        View all appointments →
                      </button>
                    </div>
                  </div>

                  {/* Clinical & Medical Summary */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider m-0 flex items-center gap-2">
                        <HeartPulse size={16} className="text-rose-500" />
                        Clinical & Medical Summary
                      </h3>
                      <div className="flex items-center gap-2">
                        {patient.bloodGroup && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                            <Droplet size={11} className="text-rose-500" />
                            Blood: {patient.bloodGroup}
                          </span>
                        )}
                        <span className="text-[11px] font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {patient.gender || 'Unknown'} · {patient.age ? `${patient.age} yrs` : 'Age N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Medical History Summary (Clinical Note) */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <FileText size={12} className="text-indigo-500" /> Medical History Notes
                      </p>
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-medium leading-relaxed shadow-2xs">
                        {displayMedicalHistory || 'No significant prior medical conditions or clinical notes recorded.'}
                      </div>
                    </div>

                    {/* 3 Structured Clinical Cards: Chronic Conditions | Past Surgeries | Family History */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      
                      {/* 1. Chronic Conditions */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <Activity size={12} className="text-rose-500" /> Chronic Conditions
                          </p>
                          {chronicList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {chronicList.map((c, i) => (
                                <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100 flex items-center gap-1">
                                  <Activity size={11} className="text-rose-500" />
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-medium italic m-0">None reported</p>
                          )}
                        </div>
                      </div>

                      {/* 2. Past Surgeries */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <ClipboardList size={12} className="text-blue-500" /> Past Surgeries
                          </p>
                          {surgeryList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {surgeryList.map((s, i) => (
                                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-medium italic m-0">No past surgeries recorded</p>
                          )}
                        </div>
                      </div>

                      {/* 3. Family History */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <User size={12} className="text-emerald-500" /> Family History
                          </p>
                          {familyList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {familyList.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                                  {f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-medium italic m-0">No significant family history</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Recent Appointments & Current Medications — 2 Separate Balanced Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    
                    {/* Card 1: Recent Appointments */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <Calendar size={15} className="text-blue-600" />
                            <h3 className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-wider">Recent Appointments</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('Appointments')}
                            className="text-[#2160FF] text-[11px] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                          >
                            View All
                          </button>
                        </div>

                        {patient.appointmentHistory?.length > 0 ? (
                          <div className="flex flex-col gap-3 relative before:absolute before:left-[45px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                            {patient.appointmentHistory.slice(0, 4).map((event, i) => {
                              const d = event.date ? new Date(event.date) : null;
                              return (
                                <div key={i} className="flex gap-4 relative z-10">
                                  <div className="w-[45px] pt-0.5 shrink-0 flex flex-col items-center">
                                    <span className="text-[14px] font-black text-slate-800 leading-none">{d ? d.getDate() : '—'}</span>
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-0.5">
                                      {d ? d.toLocaleString('en', { month: 'short', year: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-[#2160FF] absolute left-[41.5px] top-1.5 ring-4 ring-white" />
                                  <div className="flex-1 pl-3 pb-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                      <p className="text-xs font-bold text-slate-800 truncate m-0">{event.reason || 'Consultation'}</p>
                                      <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded shrink-0 ${
                                        event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                      }`}>{event.status}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                              <Calendar size={18} />
                            </div>
                            <p className="text-xs font-semibold text-slate-500 m-0">No appointment history available</p>
                            <p className="text-[11px] text-slate-400 m-0 mt-0.5">Past consultations will appear here</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Current Medications */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <Pill size={15} className="text-orange-600" />
                            <h3 className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-wider">Current Medications</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('Prescriptions')}
                            className="text-[#2160FF] text-[11px] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                          >
                            View All
                          </button>
                        </div>

                        {medicationList.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {medicationList.map((med, i) => {
                              const medName = typeof med === 'string' ? med : (med.name || med.medicationName || JSON.stringify(med));
                              return (
                                <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl hover:border-orange-200 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#EA580C] flex items-center justify-center font-serif italic font-black text-xs shrink-0">
                                      Rx
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 truncate">{medName}</span>
                                  </div>
                                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                                    Active
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : patient.previousPrescriptions?.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {patient.previousPrescriptions.slice(0, 3).map((rx) => (
                              <div key={rx.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#EA580C] flex items-center justify-center font-serif italic font-black text-xs shrink-0">
                                    Rx
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">{rx.summary || 'Prescription'}</span>
                                    <p className="text-[10px] text-slate-400 m-0">{rx.date}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                              <Pill size={18} />
                            </div>
                            <p className="text-xs font-semibold text-slate-500 m-0">No active medications on record</p>
                            <p className="text-[11px] text-slate-400 m-0 mt-0.5">Active prescriptions will appear here</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'Timeline' && (
                <ClinicalTimeline patientId={patientId} />
              )}

              {activeTab === 'Appointments' && (
                <AppointmentsTab patientUserId={patientUserId} />
              )}

              {activeTab === 'Prescriptions' && (
                <PrescriptionsTab patientUserId={patientUserId} />
              )}

              {activeTab === 'Medicine Sales' && (
                <DoctorMedicineSales 
                  patientId={patientUserId || patientId} 
                  patientName={patient.fullName} 
                  onOrderCreated={() => setActiveTab('Prescriptions')}
                />
              )}

              {activeTab === 'Lab Reports' && (
                <LabReportsTab patientUserId={patientUserId} />
              )}

              {activeTab === 'Medical History' && (
                <div className="p-2">
                  <h3 className="text-[15px] font-bold text-slate-800 mb-6">Complete Medical History</h3>
                  <EMRChart patientId={patientId} />
                </div>
              )}

              {activeTab === 'Care Plans' && (
                <div className="p-2">
                  <CarePlan patientId={patientId} />
                </div>
              )}

              {activeTab === 'Documents' && (
                <DocumentsTab patientId={patientId} />
              )}

              {activeTab === 'Billing & Payments' && (
                <BillingTab patientUserId={patientUserId} />
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
