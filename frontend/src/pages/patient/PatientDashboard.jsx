import React, { useMemo, useState } from 'react';
import useAuthStore from '../../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
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
  ClipboardList,
  HeartPulse,
  Droplets,
  Dna,
  TestTubes,
  Home,
  Video,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  LifeBuoy,
  Headphones,
  ShoppingBag,
  Truck,
  Package,
  MapPin,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { fadeUp, listStagger, pageTransition } from '../../components/ui/motion';
import { AnimatePresence, motion } from 'framer-motion';
import MedicineOrderInvoiceModal from '../../components/patient/MedicineOrderInvoiceModal';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [timelineView, setTimelineView] = useState('Day'); // 'Day' | 'Week' | 'Month'
  const [storageTick, setStorageTick] = useState(0);

  React.useEffect(() => {
    const handleStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const tabs = [
    { label: 'Dashboard', icon: LayoutGrid, path: '/patient/dashboard' },
    { label: 'Appointments', icon: CalendarIcon, path: '/patient/appointments' },
    { label: 'Prescriptions', icon: FileText, path: '/patient/prescriptions' },
    { label: 'Orders & Tracking', icon: ShoppingBag, path: '/patient/orders' },
    { label: 'Lab Reports', icon: FlaskConical, path: '/patient/lab-reports' },
    { label: 'Invoices', icon: ClipboardList, path: '/patient/billing' },
    { label: 'Health Summary', icon: Stethoscope, path: '/patient/records' },
    { label: 'Help & Support', icon: LifeBuoy, path: '/patient/support' }
  ];

  const topActions = [
    { icon: CalendarIcon, label: 'Book\nAppointment', path: '/patient/book' },
    { icon: Pill, label: 'Order\nMedicine', path: '/patient/order-medicine' },
    { icon: Users, label: 'Family\nMembers', path: '/patient/dependents' },
    { icon: Upload, label: 'Upload\nVitals', path: '/patient/timeline' },
    { icon: Laptop, label: 'Tele\nConsult', path: '/patient/teleconsultations' },
    { icon: FileText, label: 'Medical\nRecords', path: '/patient/records' },
    { icon: Scan, label: 'Radiology', path: '/patient/radiology' },
    { icon: Shield, label: 'Insurance', path: '/patient/insurance' },
    { icon: LifeBuoy, label: 'Help &\nSupport', path: '/patient/support' }
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

  const { data: rawAppointments = [] } = useQuery({
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

  // Query real timeline events
  const { data: rawTimeline = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ['patientDashboardTimeline', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/v1/patient/timeline');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.warn('Failed to fetch patient timeline', err);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Realtime Live Medicine Orders (polling every 3 seconds for instant pharmacy fulfillment updates)
  const { data: rawMedicineOrders = [] } = useQuery({
    queryKey: ['patientMedicineOrdersLive', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/patient/medicines/my-orders');
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch (err) {
        try {
          const fallbackRes = await axiosPrivate.get('/patient/medicine-orders');
          return Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.content || []);
        } catch {
          return [];
        }
      }
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
    staleTime: 1000
  });

  const activeMedicineOrder = useMemo(() => {
    if (Array.isArray(rawMedicineOrders) && rawMedicineOrders.length) {
      const active = rawMedicineOrders.find((o) =>
        !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes((o.orderStatus || o.status || '').toUpperCase())
      );
      return active || rawMedicineOrders[0];
    }
    try {
      const saved = localStorage.getItem('latest_patient_medicine_order');
      if (saved) return JSON.parse(saved);
    } catch {}
    try {
      const listRaw = localStorage.getItem('clinic_patient_medicine_orders');
      if (listRaw) {
        const list = JSON.parse(listRaw);
        if (Array.isArray(list) && list.length > 0) {
          const active = list.find((o) =>
            !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes((o.orderStatus || o.status || '').toUpperCase())
          );
          return active || list[0];
        }
      }
    } catch {}
    return null;
  }, [rawMedicineOrders, storageTick]);

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

  /* ── Health Journey Date Navigation & Computations ───────────────── */
  const handlePrevDate = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      if (timelineView === 'Day') d.setDate(d.getDate() - 1);
      else if (timelineView === 'Week') d.setDate(d.getDate() - 7);
      else if (timelineView === 'Month') d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextDate = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      if (timelineView === 'Day') d.setDate(d.getDate() + 1);
      else if (timelineView === 'Week') d.setDate(d.getDate() + 7);
      else if (timelineView === 'Month') d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
    setTimelineView('Day');
  };

  const journeyDateBadge = useMemo(() => {
    const today = new Date();
    const isSameDay = (d1, d2) => (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );

    if (timelineView === 'Day') {
      if (isSameDay(selectedDate, today)) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (isSameDay(selectedDate, yesterday)) return 'Yesterday';
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow';
      return format(selectedDate, 'MMM d, yyyy');
    }

    if (timelineView === 'Week') {
      const start = new Date(selectedDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }

    if (timelineView === 'Month') {
      if (selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() === today.getMonth()) {
        return 'This Month';
      }
      return format(selectedDate, 'MMMM yyyy');
    }

    return 'Today';
  }, [selectedDate, timelineView]);

  // Starter sample events for Today if database timeline has zero records
  const samplePatientEvents = useMemo(() => {
    const now = new Date();
    const makeTime = (hours, mins) => {
      const d = new Date(now);
      d.setHours(hours, mins, 0, 0);
      return d.toISOString();
    };

    return [
      {
        id: 'VIT-101',
        type: 'VITALS',
        title: 'Blood Pressure & Vitals Stabilized',
        description: 'Vitals: 120/80 mmHg • Heart Rate: 72 bpm (Normal Range)',
        status: 'COMPLETED',
        eventDate: makeTime(8, 0),
      },
      {
        id: 'LAB-108',
        type: 'LAB_REPORT',
        title: 'Complete Blood Count (CBC) with Differential',
        description: 'Specimen verified in Hematology analyzer. Evaluation normal.',
        status: 'VERIFIED',
        eventDate: makeTime(10, 30),
      },
      {
        id: 'APPT-402',
        type: 'APPOINTMENT',
        title: 'Cardiology Follow-Up Consultation',
        description: 'Dr. Michael Lee • Cardiology Unit 4 • ECG review',
        status: 'SCHEDULED',
        eventDate: makeTime(13, 0),
      },
      {
        id: 'PRES-204',
        type: 'PRESCRIPTION',
        title: 'Prescription: Atorvastatin 20mg & Metformin',
        description: 'Prescribed for 30 days. Fasting morning dose.',
        status: 'ACTIVE',
        eventDate: makeTime(15, 30),
      }
    ];
  }, []);

  // Filtered health journey events for the selected date & timeframe
  const healthJourneyEvents = useMemo(() => {
    const isSameDay = (d1, d2) => (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );

    const baseList = rawTimeline.length > 0 ? rawTimeline : samplePatientEvents;

    const matched = baseList.filter(item => {
      const dateVal = item.eventDate ? new Date(item.eventDate) : null;
      if (!dateVal || isNaN(dateVal.getTime())) return false;

      if (timelineView === 'Day') {
        return isSameDay(dateVal, selectedDate);
      } else if (timelineView === 'Week') {
        const start = new Date(selectedDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return dateVal >= start && dateVal <= end;
      } else if (timelineView === 'Month') {
        return (
          dateVal.getFullYear() === selectedDate.getFullYear() &&
          dateVal.getMonth() === selectedDate.getMonth()
        );
      }
      return false;
    });

    return matched.map((event, idx) => {
      const date = new Date(event.eventDate);
      const timeStr = format(date, 'hh:mm a');
      const dateStr = format(date, 'MMM d');
      const title = event.title || 'Medical Event';
      const type = event.type || '';
      const desc = event.description || '';

      // Intelligent clinical categorizer
      let category = 'Medical';
      let nodeClass = 'bg-blue-50 text-blue-600 border border-blue-200';
      let icon = <Activity className="w-4 h-4 text-blue-600" />;
      let actionPath = '/patient/timeline';

      const titleLower = title.toLowerCase();

      if (titleLower.includes('blood') || titleLower.includes('cbc') || titleLower.includes('differential')) {
        category = 'Hematology';
        nodeClass = 'bg-rose-50 text-rose-600 border border-rose-200';
        icon = <Droplets className="w-4 h-4 text-rose-600" />;
        actionPath = '/patient/lab-reports';
      } else if (titleLower.includes('troponin') || titleLower.includes('cardiac') || titleLower.includes('heart') || titleLower.includes('blood pressure')) {
        category = 'Cardiology';
        nodeClass = 'bg-red-50 text-red-600 border border-red-200';
        icon = <HeartPulse className="w-4 h-4 text-red-600" />;
        actionPath = '/patient/timeline';
      } else if (titleLower.includes('urine') || titleLower.includes('urinalysis') || titleLower.includes('renal')) {
        category = 'Urinalysis';
        nodeClass = 'bg-amber-50 text-amber-600 border border-amber-200';
        icon = <FlaskConical className="w-4 h-4 text-amber-600" />;
        actionPath = '/patient/lab-reports';
      } else if (titleLower.includes('lipid') || titleLower.includes('cholesterol') || titleLower.includes('glucose')) {
        category = 'Biochemistry';
        nodeClass = 'bg-cyan-50 text-cyan-600 border border-cyan-200';
        icon = <Dna className="w-4 h-4 text-cyan-600" />;
        actionPath = '/patient/lab-reports';
      } else if (type === 'APPOINTMENT') {
        category = 'Consultation';
        nodeClass = 'bg-indigo-50 text-indigo-600 border border-indigo-200';
        icon = <Stethoscope className="w-4 h-4 text-indigo-600" />;
        actionPath = '/patient/appointments';
      } else if (type === 'PRESCRIPTION') {
        category = 'Pharmacy';
        nodeClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
        icon = <Pill className="w-4 h-4 text-emerald-600" />;
        actionPath = '/patient/prescriptions';
      } else if (type === 'HOME_VISIT') {
        category = 'Home Care';
        nodeClass = 'bg-orange-50 text-orange-600 border border-orange-200';
        icon = <Home className="w-4 h-4 text-orange-600" />;
        actionPath = '/patient/timeline';
      } else if (type === 'TELECONSULTATION') {
        category = 'Telehealth';
        nodeClass = 'bg-purple-50 text-purple-600 border border-purple-200';
        icon = <Video className="w-4 h-4 text-purple-600" />;
        actionPath = '/patient/teleconsultations';
      }

      // Urgency Pill
      let urgencyBadge = null;
      if (desc.includes('CRITICAL')) {
        urgencyBadge = (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            CRITICAL
          </span>
        );
      } else if (desc.includes('ABNORMAL')) {
        urgencyBadge = (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
            ABNORMAL
          </span>
        );
      }

      // Status Badge
      let statusBadge = (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
          {(event.status || 'Active').replace(/_/g, ' ')}
        </span>
      );
      if (['COMPLETED', 'VERIFIED', 'RELEASED', 'DONE'].includes((event.status || '').toUpperCase())) {
        statusBadge = (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            COMPLETED
          </span>
        );
      } else if (['REQUESTED', 'SCHEDULED'].includes((event.status || '').toUpperCase())) {
        statusBadge = (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            {(event.status || '').toUpperCase()}
          </span>
        );
      }

      return {
        id: event.id || `evt-${idx}`,
        time: timeStr,
        dateDisplay: timelineView !== 'Day' ? dateStr : null,
        title,
        subtitle: desc || `${category} interaction`,
        category,
        nodeClass,
        icon,
        urgencyBadge,
        statusBadge,
        actionPath
      };
    });
  }, [rawTimeline, samplePatientEvents, timelineView, selectedDate]);

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#f8fafc] font-sans pb-16 pt-3 px-4 sm:px-6 lg:px-8 text-slate-800 space-y-5"
    >
      {/* ── Top Action Cards Grid (9 Cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
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

      {/* ── Realtime Active Medicine Order Live Tracker ───────────────────────── */}
      {activeMedicineOrder ? (
        (() => {
          const status = (activeMedicineOrder.orderStatus || activeMedicineOrder.status || 'PAID').toUpperCase();
          let step = 1;
          let stepTitle = 'Order Placed';
          let stepDesc = 'Payment confirmed. Sent to clinic pharmacy.';
          
          if (['PHARMACY_PROCESSING', 'PROCESSING', 'VERIFIED', 'PACKED', 'CONFIRMED'].includes(status)) {
            step = 2;
            stepTitle = 'Pharmacy Verification & Packaging';
            stepDesc = 'Pharmacist is assembling your prescription medicines.';
          } else if (['DISPATCHED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'SHIPPED'].includes(status)) {
            step = 3;
            stepTitle = status === 'READY_FOR_PICKUP' ? 'Ready for Pharmacy Pickup' : 'Out for Delivery';
            stepDesc = status === 'READY_FOR_PICKUP' ? 'Package is waiting at the clinic pharmacy counter.' : 'Courier is on the way to your address.';
          } else if (['DELIVERED', 'COMPLETED'].includes(status)) {
            step = 4;
            stepTitle = 'Delivered & Completed';
            stepDesc = 'Medicines delivered safely to your location.';
          }

          const steps = [
            { num: 1, label: 'Order Placed' },
            { num: 2, label: 'Rx Verified & Packed' },
            { num: 3, label: 'Dispatched' },
            { num: 4, label: 'Delivered' }
          ];

          return (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 rounded-2xl p-5 border border-emerald-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Active Medicine Order</span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {activeMedicineOrder.orderNumber || activeMedicineOrder.orderId || `ORD-${activeMedicineOrder.id}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stepDesc} • Total ₹{(activeMedicineOrder.totalAmount || activeMedicineOrder.grandTotal || activeMedicineOrder.total || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedInvoiceOrder(activeMedicineOrder)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Invoice</span>
                  </button>
                  <button
                    onClick={() => navigate('/patient/orders')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Track Full Order</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => navigate('/patient/order-medicine')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Order More</span>
                  </button>
                </div>
              </div>

              {/* Stepper Progress */}
              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-emerald-100/80">
                <div className="grid grid-cols-4 gap-2 relative">
                  {steps.map((s) => {
                    const isDone = s.num <= step;
                    const isCurrent = s.num === step;
                    return (
                      <div key={s.num} className="flex flex-col items-center text-center space-y-1.5 relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                        </div>
                        <span className={`text-[11px] font-bold ${isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(10, ((step - 1) / 3) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2864FF] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Pharmacy Order Live Tracker</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                  Ready for Orders
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Pharmacy Sync Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Order medicines prescribed by your doctor or browse clinic pharmacy. Live tracking and digital tax invoice will display here.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/patient/orders')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>View Orders</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => navigate('/patient/order-medicine')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Order Medicine</span>
            </button>
          </div>
        </div>
      )}

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
                <p className="text-[10px] text-slate-400">Elixir Health Care Hospital</p>
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
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
          {/* Timeline Header with Real Interactive Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevDate}
                title="Previous Date"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextDate}
                title="Next Date"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <h2 className="text-base font-extrabold text-slate-900 ml-1">Health Journey</h2>
              
              <button
                onClick={resetToToday}
                title="Reset to Today"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-full px-3 py-0.5 text-xs font-bold flex items-center gap-1 transition cursor-pointer ml-1"
              >
                <CalendarIcon className="w-3 h-3 text-blue-600" />
                <span>{journeyDateBadge}</span>
              </button>
            </div>

            {/* Day / Week / Month Segmented Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500 self-start sm:self-auto border border-slate-200/60">
              {['Day', 'Week', 'Month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setTimelineView(v)}
                  className={`px-3.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timelineView === v ? 'bg-blue-600 text-white shadow-2xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* ── Timeline Events List with Center-Anchored Spine ── */}
          {loadingTimeline ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider">Syncing Health Journey...</p>
            </div>
          ) : healthJourneyEvents.length > 0 ? (
            <div className="space-y-4 pt-1">
              {healthJourneyEvents.map((evt, idx) => {
                const isLast = idx === healthJourneyEvents.length - 1;
                return (
                  <div key={evt.id || idx} className="relative flex items-stretch gap-3 sm:gap-4 group">
                    {/* Time Column (Left): 56px wide, right-aligned, exact time */}
                    <div className="w-14 sm:w-16 text-right shrink-0 pt-2">
                      <span className="block text-xs font-black text-slate-800 tracking-tight">{evt.time}</span>
                      {evt.dateDisplay && (
                        <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{evt.dateDisplay}</span>
                      )}
                    </div>

                    {/* Dedicated Center-Anchored Spine Column */}
                    <div className="relative flex flex-col items-center shrink-0 w-8 sm:w-9">
                      {/* Vertical continuous spine line: passes dead-center through node */}
                      <div className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-100 to-slate-200 ${
                        isLast ? 'h-5' : 'h-full'
                      }`} />
                      
                      {/* Centered Themed Node Pin */}
                      <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center ring-4 ring-white shadow-2xs group-hover:scale-110 transition-transform ${evt.nodeClass}`}>
                        {evt.icon}
                      </div>
                    </div>

                    {/* Creative Interactive Health Card */}
                    <div 
                      onClick={() => evt.actionPath && navigate(evt.actionPath)}
                      className="flex-1 min-w-0 bg-white hover:bg-blue-50/30 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {evt.title}
                          </h4>
                          {evt.urgencyBadge}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {evt.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {evt.statusBadge}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No Journey Events Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No medical records or consultations scheduled for {journeyDateBadge.toLowerCase() === 'today' ? 'today' : journeyDateBadge}.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={resetToToday}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Return to Today
                </button>
                <button
                  onClick={() => navigate('/patient/timeline')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  View Full Timeline
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Encouragement & Timeline Link Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl p-3.5 flex items-center justify-between gap-2.5 border border-blue-100/80">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800 min-w-0">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">Keep it up! Track all clinical milestones in your timeline.</span>
            </div>
            <button
              onClick={() => navigate('/patient/timeline')}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline shrink-0 flex items-center gap-1"
            >
              <span>Full Journey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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

            {/* Empty or Content Graphic */}
            <div className="py-4 space-y-2">
              <div className="w-14 h-14 rounded-full bg-blue-50/70 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-2xs">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                {labReports.length > 0 ? `${labReports.length} Lab Reports Available` : 'No new lab reports'}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto">
                {labReports.length > 0 ? 'Diagnostic test results ready for review.' : 'Your recent lab results will appear here.'}
              </p>
            </div>
          </div>

          {/* Card 3: Help & Support Center */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-white rounded-2xl p-5 border border-indigo-100/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Patient Support</h3>
                  <p className="text-[11px] text-slate-500">24/7 Concierge Desk</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed text-left">
              Have questions regarding appointments, medical records, or bills? Reach our care desk anytime.
            </p>
            <button
              onClick={() => navigate('/patient/support')}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Help & Support Center</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Official Pharmacy Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <MedicineOrderInvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
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