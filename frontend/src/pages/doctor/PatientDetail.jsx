import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Calendar, Pill, FlaskConical, CreditCard,
  FolderOpen, Loader2, AlertCircle, ChevronRight, ArrowLeft,
  User, Phone, Mail, Droplet, MapPin, HeartPulse, Activity, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  'Overview', 'Appointments', 'Prescriptions', 'Lab Reports',
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

/* ── Main Component ───────────────────────────────────────────────── */
const PatientDetail = ({ patientIdOverride }) => {
  const { patientId: paramPatientId } = useParams();
  const patientId = patientIdOverride || paramPatientId;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  // Main patient detail query — returns real data including counts
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: async () => (await axiosPrivate.get(`/doctor/patients/${patientId}`)).data,
  });

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
    <div className="p-6 bg-[#F8FAFC] min-h-full font-sans">
      <div className="max-w-[1400px] mx-auto">

        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="cursor-pointer hover:text-slate-800" onClick={() => navigate('/doctor/patients')}>Patients</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-800">Patient Details</span>
          </div>
          <button
            onClick={() => navigate('/doctor/patients')}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.5} /> Back to Patients
          </button>
        </div>

        <ChartBanner patientId={patientId} />

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-6">

            {/* Profile Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 flex flex-col items-center">
              <div className="flex items-center gap-4 w-full mb-6">
                <img
                  src={`https://i.pravatar.cc/150?u=${profileId || patientId}`}
                  alt={patient.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-800 leading-tight">{patient.name || '—'}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-1.5">ID: {generateDisplayId(profileId)}</p>
                  <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-[#5B21B6] text-[10px] font-bold rounded-md uppercase tracking-wide">
                    Active Patient
                  </span>
                </div>
              </div>

              {/* Detail List */}
              <div className="w-full flex flex-col gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-5">
                <div className="grid grid-cols-[32px_90px_1fr] items-center">
                  <User size={15} className="text-[#5B21B6] justify-self-center" />
                  <span className="text-slate-400">Age / Gender</span>
                  <span className="text-slate-800">
                    {patient.age ? `${patient.age} yrs` : '—'} / {patient.gender || '—'}
                  </span>
                </div>
                <div className="grid grid-cols-[32px_90px_1fr] items-center">
                  <Phone size={15} className="text-[#5B21B6] justify-self-center" />
                  <span className="text-slate-400">Phone</span>
                  <span className="text-slate-800">{patient.phone || '—'}</span>
                </div>
                <div className="grid grid-cols-[32px_90px_1fr] items-center">
                  <Mail size={15} className="text-[#5B21B6] justify-self-center" />
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-800 break-all">{patient.email || '—'}</span>
                </div>
                <div className="grid grid-cols-[32px_90px_1fr] items-center">
                  <Droplet size={15} className="text-[#5B21B6] justify-self-center" />
                  <span className="text-slate-400">Blood Group</span>
                  <span className="text-slate-800">{patient.bloodGroup || '—'}</span>
                </div>
                <div className="grid grid-cols-[32px_90px_1fr] items-center">
                  <Calendar size={15} className="text-[#5B21B6] justify-self-center" />
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="text-slate-800">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-[32px_90px_1fr] items-start mt-1">
                  <MapPin size={15} className="text-[#5B21B6] justify-self-center mt-0.5" />
                  <span className="text-slate-400">Address</span>
                  <span className="text-slate-800 leading-tight">
                    {patient.address || '—'}
                  </span>
                </div>
              </div>

              {/* Stats Boxes — derived from real data */}
              <div className="w-full grid grid-cols-3 gap-3 mt-6 border-t border-slate-100 pt-6">
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold text-[#16A34A]">{apptCount}</span>
                  <span className="text-[10px] font-bold text-[#15803D] mt-0.5">Appointments</span>
                </div>
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold text-[#2563EB]">{rxCount}</span>
                  <span className="text-[10px] font-bold text-[#1D4ED8] mt-0.5">Prescriptions</span>
                </div>
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                  <HeartPulse size={18} className="text-[#EA580C] mx-auto" />
                  <span className="text-[10px] font-bold text-[#C2410C] mt-0.5">Records</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 relative">
                <h3 className="text-[13px] font-bold text-slate-800 mb-4">Emergency Contact</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{patient.emergencyContactName || '—'}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">{patient.emergencyContactPhone || '—'}</p>
                  </div>
                  {patient.emergencyContactPhone && (
                    <a href={`tel:${patient.emergencyContactPhone}`}
                      className="w-8 h-8 rounded-full bg-indigo-50 text-[#5B21B6] flex items-center justify-center hover:bg-indigo-100 transition-colors">
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Allergies */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 relative">
              <h3 className="text-[13px] font-bold text-slate-800 mb-4">Allergies</h3>
              {patient.allergies && patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(patient.allergies) ? patient.allergies : [patient.allergies]).map((a, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-[#EA580C] text-[11px] font-bold rounded-md">
                      {typeof a === 'string' ? a : (a.allergen || JSON.stringify(a))}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No known allergies on record</p>
              )}
            </div>

            {/* Chronic Conditions */}
            {patient.chronicConditions && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 relative">
                <h3 className="text-[13px] font-bold text-slate-800 mb-4">Chronic Conditions</h3>
                <p className="text-xs text-slate-700">{patient.chronicConditions}</p>
              </div>
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Tabs */}
            <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 px-6 pt-4 flex gap-6 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3 text-sm font-bold whitespace-nowrap transition-colors ${
                    activeTab === tab ? 'text-[#5B21B6]' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="patientTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B21B6] rounded-t-md"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div className="bg-white rounded-b-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6 relative min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >

              {activeTab === 'Overview' && (
                <>
                  {/* Summary Cards — real data from API response */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-[#5B21B6] flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Last Appointment</p>
                        {patient.appointmentHistory?.length > 0 ? (
                          <>
                            <p className="text-[15px] font-bold text-slate-800">
                              {new Date(patient.appointmentHistory[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate max-w-[130px]">
                              {patient.appointmentHistory[0].reason || patient.appointmentHistory[0].status}
                            </p>
                          </>
                        ) : (
                          <p className="text-[13px] font-semibold text-slate-400">No visits yet</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 text-[#16A34A] flex items-center justify-center shrink-0">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Chronic Conditions</p>
                        <p className="text-[13px] font-bold text-slate-800 leading-snug">
                          {patient.chronicConditions || 'None reported'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Total Prescriptions</p>
                        <p className="text-[17px] font-bold text-slate-800 mb-1">{rxCount}</p>
                        <button
                          onClick={() => setActiveTab('Prescriptions')}
                          className="text-[11px] font-bold text-[#EA580C] hover:underline"
                        >
                          View all prescriptions
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Total Appointments</p>
                        <p className="text-[17px] font-bold text-slate-800 mb-1">{apptCount}</p>
                        <button
                          onClick={() => setActiveTab('Appointments')}
                          className="text-[11px] font-bold text-[#2563EB] hover:underline"
                        >
                          View all appointments
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Medical Summary — real fields */}
                  <div className="w-full">
                    <h3 className="text-[15px] font-bold text-slate-800 mb-4">Medical Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Blood Group</p>
                        <p className="text-[13px] font-bold text-slate-800">{patient.bloodGroup || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Age</p>
                        <p className="text-[13px] font-bold text-slate-800">{patient.age ? `${patient.age} years` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Gender</p>
                        <p className="text-[13px] font-bold text-slate-800">{patient.gender || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Phone</p>
                        <p className="text-[13px] font-bold text-slate-800">{patient.phone || '—'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Chronic Conditions</p>
                        <p className="text-[13px] font-bold text-slate-800">{patient.chronicConditions || 'None reported'}</p>
                      </div>
                      {patient.medicalHistorySummary && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1">Medical History Summary</p>
                          <p className="text-[13px] font-semibold text-slate-800 leading-relaxed">{patient.medicalHistorySummary}</p>
                        </div>
                      )}
                      {patient.pastSurgeries && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1">Past Surgeries</p>
                          <p className="text-[13px] font-semibold text-slate-800">{patient.pastSurgeries}</p>
                        </div>
                      )}
                      {patient.familyHistory && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1">Family History</p>
                          <p className="text-[13px] font-semibold text-slate-800">{patient.familyHistory}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Recent Appointment History from real API data */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[14px] font-bold text-slate-800">Recent Appointment History</h3>
                        <button
                          onClick={() => setActiveTab('Appointments')}
                          className="text-[#5B21B6] text-[11px] font-bold hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {patient.appointmentHistory?.length > 0 ? (
                        <div className="flex flex-col gap-4 relative before:absolute before:left-[45px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                          {patient.appointmentHistory.slice(0, 4).map((event, i) => {
                            const d = event.date ? new Date(event.date) : null;
                            return (
                              <div key={i} className="flex gap-4 relative z-10">
                                <div className="w-[45px] pt-0.5 shrink-0 flex flex-col items-center">
                                  <span className="text-[15px] font-bold text-slate-800 leading-none">{d ? d.getDate() : '—'}</span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                                    {d ? d.toLocaleString('en', { month: 'short', year: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-[#5B21B6] absolute left-[41.5px] top-1.5 ring-4 ring-white" />
                                <div className="flex-1 pl-3 pb-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[12px] font-bold text-slate-800">{event.reason || 'Consultation'}</p>
                                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                      event.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                    }`}>{event.status}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No appointment history available.</p>
                      )}
                    </div>

                    {/* Current Medications — from API data */}
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[14px] font-bold text-slate-800">Current Medications</h3>
                        <button
                          onClick={() => setActiveTab('Prescriptions')}
                          className="text-[#5B21B6] text-[11px] font-bold hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {patient.currentMedications ? (
                        <div className="flex flex-col gap-3">
                          {(Array.isArray(patient.currentMedications)
                            ? patient.currentMedications
                            : patient.currentMedications.split(',').map(m => m.trim())
                          ).map((med, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-serif italic font-bold shrink-0">Rx</div>
                              <span className="text-[12px] font-bold text-slate-800">
                                {typeof med === 'string' ? med : med.name || JSON.stringify(med)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : patient.previousPrescriptions?.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {patient.previousPrescriptions.slice(0, 3).map((rx) => (
                            <div key={rx.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-serif italic font-bold shrink-0">Rx</div>
                                <div>
                                  <span className="text-[12px] font-bold text-slate-800">{rx.summary || 'Prescription'}</span>
                                  <p className="text-[10px] text-slate-400">{rx.date}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No current medications on record.</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Appointments' && (
                <AppointmentsTab patientUserId={patientUserId} />
              )}

              {activeTab === 'Prescriptions' && (
                <PrescriptionsTab patientUserId={patientUserId} />
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
