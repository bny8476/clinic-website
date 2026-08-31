import React, { useMemo, useState } from 'react';
import useAuthStore from '../../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Laptop,
  Loader2,
  Pill,
  Scan,
  Shield,
  Stethoscope,
  Upload,
  Users,
  Heart,
  Activity,
  User,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import { AnimatePresence, motion } from 'framer-motion';

export default function PatientDashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [timelineView, setTimelineView] = useState('Day');
  const [medicationTaken, setMedicationTaken] = useState(false);
  const queryClient = useQueryClient();

  const tabs = [
    { label: 'Dashboard', icon: LayoutGridIcon, path: '/patient/dashboard' },
    { label: 'Appointments', icon: CalendarIcon, path: '/patient/appointments' },
    { label: 'Prescriptions', icon: FileText, path: '/patient/prescriptions' },
    { label: 'Lab Reports', icon: FlaskConical, path: '/patient/lab-reports' },
    { label: 'Invoices', icon: ClipboardList, path: '/patient/billing' },
    { label: 'Health Summary', icon: Stethoscope, path: '/patient/records' }
  ];

  const topActions = [
    { icon: CalendarIcon, label: 'Book\nAppointment', path: '/patient/book' },
    { icon: Pill, label: 'Order\nMedicine', path: '/patient/order-medicine' },
    { icon: Users, label: 'Family\nMembers', path: '/patient/dependents' },
    { icon: Upload, label: 'Upload\nVitals', path: '/patient/timeline' },
    { icon: Laptop, label: 'Tele\nConsult', path: '/patient/teleconsultations' },
    { icon: FileText, label: 'Medical\nRecords', path: '/patient/records' },
    { icon: Scan, label: 'Radiology', path: '/patient/radiology' },
    { icon: Shield, label: 'Insurance', path: '/patient/insurance' }
  ];

  /* ── API Queries ─────────────────────────────────────────────────── */
  const { data: profile } = useQuery({
    queryKey: ['patientProfile', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/patients/profile/${user?.id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id
  });

  const { data: rawAppointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['patientAppointments', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/appointments/patient/${user?.id}`);
        const data = res.data;
        return Array.isArray(data) ? data : data?.content || data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: rawPrescriptions = [] } = useQuery({
    queryKey: ['patientPrescriptions', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/prescriptions/patient/${user?.id}`);
        const data = res.data;
        return Array.isArray(data) ? data : data?.content || data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: rawLabReports = [] } = useQuery({
    queryKey: ['patientLabReports', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/lab/patient/lab-reports');
        const data = res.data;
        return Array.isArray(data) ? data : data?.content || data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const appointments = useMemo(() => (Array.isArray(rawAppointments) ? rawAppointments : []), [rawAppointments]);
  const prescriptions = useMemo(() => (Array.isArray(rawPrescriptions) ? rawPrescriptions : []), [rawPrescriptions]);
  const labReports = useMemo(() => (Array.isArray(rawLabReports) ? rawLabReports : []), [rawLabReports]);

  // Next appointment derived
  const nextAppt = useMemo(() => {
    if (!Array.isArray(appointments) || !appointments.length) return null;
    const future = appointments.filter((a) => a && a.startTime && new Date(a.startTime) > new Date());
    return future[0] || appointments[0];
  }, [appointments]);

  const latestRxItem = useMemo(() => {
    if (!Array.isArray(prescriptions) || !prescriptions.length) return null;
    const signed = prescriptions.find((rx) => rx && ['Signed', 'SIGNED'].includes(rx.status));
    if (!signed?.items?.length) return null;
    return { ...signed.items[0], rxDate: signed.createdAt };
  }, [prescriptions]);

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#f8fafc] font-sans pb-16 pt-3 px-4 sm:px-6 lg:px-8 text-slate-800 space-y-5"
    >
      {/* ── Top Action Cards Grid (8 Cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {topActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => navigate(action.path)}
            className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {action.label.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line} {i === 1 && <span className="text-slate-400 font-normal">›</span>}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </span>
          </button>
        ))}
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.label;

          return (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(tab.label);
                if (tab.path && tab.path !== '/patient/dashboard') {
                  navigate(tab.path);
                }
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Dashboard 3-Column Content Layout ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN (3 Cols): My Appointments & Next Appointment ──────── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card 1: My Appointments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">My Appointments</h3>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            {/* Doctor Card */}
            <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"
                  alt="Doctor"
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Dr. John Doe</h4>
                  <p className="text-[11px] text-slate-500 truncate">Cardiologist</p>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-right shrink-0">
                <div className="text-[10px] font-bold">09:00 AM</div>
                <div className="text-[9px] font-semibold text-blue-600">Mon, 19 Aug 2026</div>
              </div>
            </div>

            {/* View All Appointments Button */}
            <button
              onClick={() => navigate('/patient/appointments')}
              className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View All Appointments</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Next Appointment */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Next Appointment</h3>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                DETAILS
              </button>
            </div>

            <div className="flex items-start gap-3">
              {/* Date Square */}
              <div className="w-13 bg-blue-600 text-white rounded-xl p-2 text-center shrink-0 shadow-xs">
                <span className="block text-[9px] font-bold tracking-wider uppercase opacity-90">AUG</span>
                <span className="block text-base font-extrabold leading-tight">19</span>
                <span className="block text-[9px] font-bold uppercase opacity-90">MON</span>
              </div>

              <div className="min-w-0 space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">Dr. John Doe</h4>
                <p className="text-[11px] text-slate-500">Cardiologist</p>
                <p className="text-[11px] font-semibold text-slate-700 pt-0.5">09:00 AM - 09:30 AM</p>
                <p className="text-[10px] text-slate-400">Aurelian Health Hospital</p>
              </div>
            </div>

            {/* View Details Button */}
            <button
              onClick={() => navigate('/patient/appointments')}
              className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── CENTER COLUMN (6 Cols): Health Journey Timeline ───────────────── */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          {/* Timeline Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold text-slate-900">Health Journey</h2>
              <span className="bg-blue-50 text-blue-600 rounded-full px-3 py-0.5 text-xs font-bold flex items-center gap-1 ml-1">
                <CalendarIcon className="w-3 h-3" />
                Today
              </span>
            </div>

            {/* Day / Week / Month Segmented Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500 self-start sm:self-auto">
              {['Day', 'Week', 'Month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setTimelineView(v)}
                  className={`px-4 py-1 rounded-lg transition-all cursor-pointer ${
                    timelineView === v ? 'bg-blue-600 text-white shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Events List */}
          <div className="relative pl-14 space-y-6 before:absolute before:left-11 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Event 1: 08:00 AM */}
            <div className="relative flex items-start gap-4">
              <span className="absolute -left-14 top-1 text-[11px] font-semibold text-slate-400 w-10 text-right">
                08:00 AM
              </span>
              <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-blue-600 text-blue-600 flex items-center justify-center z-10 shrink-0 shadow-2xs">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Blood Pressure Stabilized</h4>
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                </div>
                <p className="text-xs text-slate-600">
                  Average: <span className="font-bold text-emerald-600">120/80</span> mmHg
                </p>
              </div>
            </div>

            {/* Event 2: 10:30 AM */}
            <div className="relative flex items-start gap-4">
              <span className="absolute -left-14 top-1 text-[11px] font-semibold text-slate-400 w-10 text-right">
                10:30 AM
              </span>
              <div className="w-7 h-7 rounded-full bg-amber-50 border-2 border-amber-500 text-amber-500 flex items-center justify-center z-10 shrink-0 shadow-2xs">
                <Heart className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Annual Cardiac Screening</h4>
                <p className="text-xs text-slate-500">Dr. Michael Lee • Cardiology Unit 4</p>
              </div>
            </div>

            {/* Event 3: 01:00 PM */}
            <div className="relative flex items-start gap-4">
              <span className="absolute -left-14 top-1 text-[11px] font-semibold text-slate-400 w-10 text-right">
                01:00 PM
              </span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center z-10 shrink-0 shadow-2xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Physical Therapy Session</h4>
                <p className="text-xs text-slate-500">Lower Back Recovery • Day 12</p>
              </div>
            </div>

            {/* Event 4: 03:30 PM */}
            <div className="relative flex items-start gap-4">
              <span className="absolute -left-14 top-1 text-[11px] font-semibold text-slate-400 w-10 text-right">
                03:30 PM
              </span>
              <div className="w-7 h-7 rounded-full bg-purple-50 border-2 border-purple-600 text-purple-600 flex items-center justify-center z-10 shrink-0 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Mental Wellness Check</h4>
                <p className="text-xs text-slate-500">Guided Meditation • Focus: Stress Relief</p>
              </div>
            </div>
          </div>

          {/* Bottom Encouragement Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-4 flex items-center gap-2.5 text-xs font-bold text-blue-700 border border-blue-100/80">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Keep it up! You're on track for a healthier tomorrow.</span>
          </div>
        </div>

        {/* ── RIGHT COLUMN (3 Cols): My Medications & Lab Reports ─────────── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card 1: My Medications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">My Medications</h3>
              <button
                onClick={() => navigate('/patient/prescriptions')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            {/* Medication Details Card */}
            <div className="bg-blue-50/60 border border-blue-100/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Pill className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-blue-700 truncate">
                  {latestRxItem ? latestRxItem.medicationName : 'Lipitor (Atorvastatin)'}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {latestRxItem ? `${latestRxItem.dosage} • ${latestRxItem.frequency}` : '10mg Tablet • After Breakfast'}
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setMedicationTaken(!medicationTaken)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                medicationTaken
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{medicationTaken ? 'Dose Taken ✓' : 'Mark as Taken'}</span>
            </button>
          </div>

          {/* Card 2: Lab Reports */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between text-left">
              <h3 className="text-xs font-bold text-slate-900">Lab Reports</h3>
              <button
                onClick={() => navigate('/patient/lab-reports')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            {/* Empty Illustration Graphic */}
            <div className="py-4 space-y-2">
              <div className="w-14 h-14 rounded-full bg-blue-50/70 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-2xs">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">No new lab reports</h4>
              <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto">
                Your recent lab results will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper icon component for Dashboard tab
function LayoutGridIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
