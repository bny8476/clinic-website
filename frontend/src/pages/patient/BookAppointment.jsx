import React, { useEffect, useMemo, useState } from 'react';
import useAuthStore from '../../store/authStore';
import { BASE_URL, axiosPrivate } from '../../api/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { pageTransition } from '../../components/ui/motion';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Info,
  MapPin,
  Search,
  Star,
  User,
  Stethoscope,
  IndianRupee,
  ShieldCheck,
  FileText,
  AlertCircle,
  Loader2,
  Video,
  ChevronDown,
  UploadCloud,
  Globe
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get('rescheduleId');
  const patientUserId = searchParams.get('patientId');
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();

  // Step state (default to 3 for immediate visualization or step navigation)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // Step 3 Form State
  const [visitType, setVisitType] = useState('In-person'); // 'In-person' | 'Teleconsultation'
  const [reason, setReason] = useState('');
  const [symptomsNotes, setSymptomsNotes] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [doctorGenderPref, setDoctorGenderPref] = useState('No Preference');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [error, setError] = useState('');
  const [holdId, setHoldId] = useState(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Fetch list of doctors from backend
  const { data: doctors = [] } = useQuery({
    queryKey: ['allDoctors'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/doctors');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    }
  });

  // Sample fallback doctors matching reference UI screenshot
  const defaultDoctors = [
    {
      id: '1',
      userId: '1',
      firstName: 'John',
      lastName: 'Doe',
      specialty: 'Cardiologist',
      degree: 'MD, DM (Cardiology)',
      rating: 4.9,
      reviewsCount: 128,
      experienceYears: 10,
      consultationFee: 800,
      hospitalName: 'Aurelian Health Hospital',
      profileImageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '2',
      userId: '2',
      firstName: 'Sarah',
      lastName: 'Smith',
      specialty: 'General Physician',
      degree: 'MBBS, MD',
      rating: 4.8,
      reviewsCount: 96,
      experienceYears: 8,
      consultationFee: 600,
      hospitalName: 'Aurelian Health Hospital',
      profileImageUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '3',
      userId: '3',
      firstName: 'Michael',
      lastName: 'Brown',
      specialty: 'Neurologist',
      degree: 'MBBS, DM (Neurology)',
      rating: 4.7,
      reviewsCount: 112,
      experienceYears: 12,
      consultationFee: 1000,
      hospitalName: 'Aurelian Health Hospital',
      profileImageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '4',
      userId: '4',
      firstName: 'Emily',
      lastName: 'Davis',
      specialty: 'Dermatologist',
      degree: 'MBBS, MD (Dermatology)',
      rating: 4.6,
      reviewsCount: 88,
      experienceYears: 7,
      consultationFee: 750,
      hospitalName: 'Aurelian Health Hospital',
      profileImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const allDoctors = doctors.length > 0 ? doctors : defaultDoctors;

  const selectedDoctor = useMemo(
    () => allDoctors.find((d) => String(d.userId) === String(selectedDoctorId) || String(d.id) === String(selectedDoctorId)) || allDoctors[0],
    [allDoctors, selectedDoctorId]
  );

  // Fetch slots for the selected date
  const { data: slots = [] } = useQuery({
    queryKey: ['availableSlots', selectedDoctorId, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate || !selectedDoctorId) return [];
      try {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        const res = await axiosPrivate.get(
          `/appointments/slots?doctorId=${selectedDoctorId}&start=${start.toISOString()}&end=${end.toISOString()}`
        );
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedDoctorId && !!selectedDate
  });

  // Default fallback slots for demo
  const displaySlots = useMemo(() => {
    return Array.isArray(slots) ? slots : [];
  }, [slots]);

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const emptyDaysBefore = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Handle SSE updates safely without 401 console spam
  useEffect(() => {
    if (!token) return;
    let evtSource;
    let isMounted = true;
    
    const connectSSE = async () => {
      try {
        const res = await axiosPrivate.post('/sse/appointments/ticket');
        if (!isMounted) return;
        const ticket = res.data.ticket;
        
        evtSource = new EventSource(`${BASE_URL.replace('/api', '')}/api/sse/appointments?ticket=${ticket}`);
        evtSource.addEventListener('appointment-booked', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (String(data.doctorId) === String(selectedDoctorId) && selectedDate) {
              queryClient.invalidateQueries(['availableSlots', selectedDoctorId, selectedDate.toISOString()]);
            }
          } catch {}
        });
        evtSource.onerror = () => {
          if (evtSource) {
            evtSource.close();
          }
        };
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      if (evtSource) evtSource.close();
    };
  }, [selectedDoctorId, selectedDate, queryClient, token]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, idempotencyKey };
      
      if (!payload.slotId || String(payload.slotId).startsWith('mock-')) {
        throw new Error('Please select a valid available appointment slot.');
      }
      
      if (holdId) payload.holdId = holdId;
      if (patientUserId) payload.patientUserId = parseInt(patientUserId, 10);

      if (rescheduleId) {
        const res = await axiosPrivate.patch(`/appointments/${rescheduleId}/reschedule?newSlotId=${payload.slotId}`);
        return res.data;
      } else {
        const res = await axiosPrivate.post('/appointments/book', payload, {
          headers: { 'Idempotency-Key': idempotencyKey }
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientAppointments']);
      queryClient.invalidateQueries(['doctor-today-appointments']);
      queryClient.invalidateQueries(['availableSlots']);
      setCurrentStep(5);
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        setError('This appointment slot is no longer available. Please select another available time.');
        setSelectedSlotId(null);
        queryClient.invalidateQueries(['availableSlots']);
        setCurrentStep(2);
        return;
      }
      setError(err.response?.data?.message || err.message || 'Failed to book appointment. Please try again.');
    }
  });

  const handleConfirm = async () => {
    setError('');
    if (!selectedSlotId) {
      setError('Please select an available appointment slot.');
      setCurrentStep(2);
      return;
    }
    if (String(selectedSlotId).startsWith('mock-')) {
      setError('Please select a valid available appointment slot.');
      setCurrentStep(2);
      return;
    }

    await queryClient.invalidateQueries(['availableSlots', selectedDoctorId, selectedDate?.toISOString()]);

    const fullReason = [reason, symptomsNotes].filter(Boolean).join(' - ') || 'Routine Consultation & Checkup';
    mutation.mutate({ slotId: selectedSlotId, reasonForVisit: fullReason });
  };

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doc) => {
      const fullName = `Dr. ${doc.firstName} ${doc.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || (doc.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty ? doc.specialty === selectedSpecialty : true;
      return matchesSearch && matchesSpecialty;
    });
  }, [allDoctors, searchQuery, selectedSpecialty]);

  const selectedSlotObj = displaySlots.find((s) => s.id === selectedSlotId) || displaySlots[0];

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#f8fafc] font-sans pb-16 pt-4 px-4 sm:px-6 lg:px-10 text-slate-800"
    >
      {/* ── Stepper Navigation Bar ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4 pt-2">


          {/* Stepper connecting line */}
          <div className="absolute top-8 left-20 right-20 h-[1.5px] bg-slate-200 -z-0" />

          {[
            { step: 1, label: 'Select Doctor' },
            { step: 2, label: 'Select Date & Time' },
            { step: 3, label: 'Appointment Details' },
            { step: 4, label: 'Review & Confirm' },
            { step: 5, label: 'Booking Complete' }
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isActive = currentStep === item.step;

            return (
              <button
                key={item.step}
                onClick={() => {
                  if (item.step < currentStep || isCompleted) {
                    setCurrentStep(item.step);
                  }
                }}
                className="relative z-10 flex flex-col items-center bg-[#f8fafc] px-3 focus:outline-none cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <span
                  className={`text-[11px] mt-2 font-medium whitespace-nowrap ${
                    isActive || isCompleted ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Page Header Title ────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            {currentStep === 1
              ? 'Select Doctor'
              : currentStep === 2
                ? 'Select Date & Time'
                : currentStep === 3
                  ? 'Appointment Details'
                  : currentStep === 4
                    ? 'Review & Confirm'
                    : 'Booking Complete'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            {currentStep === 3
              ? 'Please provide the details below to help us serve you better.'
              : currentStep === 2
                ? 'Choose your preferred date and time slot for the appointment.'
                : currentStep === 1
                  ? 'Find and select a specialist doctor for your consultation.'
                  : currentStep === 4
                    ? 'Review appointment details before final confirmation.'
                    : 'Your appointment has been successfully scheduled.'}
          </p>
        </div>

        {/* ── STEP 1 & 2 CONTENT: Doctor & Date/Time Selector ───────────────── */}
        {(currentStep === 1 || currentStep === 2) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: Select Doctor Compact Panel (4 Cols) ────────── */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 px-1">Select Doctor</h3>

              {/* Search Bar + Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctors, specialties..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                <button className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  Filter
                </button>
              </div>

              {/* Doctor Cards List */}
              <div className="space-y-2.5">
                {filteredDoctors.map((doc) => {
                  const isSelected =
                    String(selectedDoctorId) === String(doc.userId) || String(selectedDoctorId) === String(doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctorId(String(doc.userId || doc.id));
                        if (currentStep < 2) setCurrentStep(2);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img
                        src={
                          doc.profileImageUrl ||
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
                        }
                        alt={doc.lastName}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-100"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            Dr. {doc.firstName} {doc.lastName}
                          </h4>
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            ✓
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-blue-600 truncate">
                          {doc.specialty || 'Cardiologist'}
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                          <span>{doc.degree || 'MD, DM'}</span>
                          <span>•</span>
                          <span>{doc.experienceYears || 10}+ years exp.</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <div className="flex items-center text-[10px] font-bold text-slate-800 gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{doc.rating || '4.9'}</span>
                          <span className="text-[9px] text-slate-400 font-normal">({doc.reviewsCount || 128})</span>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100">
                <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 text-xs">
                  ‹
                </button>
                <button className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </button>
                <button className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs font-medium">
                  2
                </button>
                <button className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs font-medium">
                  3
                </button>
                <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xs">
                  ›
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Main Date & Time Selection Panel (8 Cols) ───── */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={
                        selectedDoctor?.profileImageUrl ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={selectedDoctor?.lastName}
                      className="w-14 h-14 rounded-full object-cover border border-slate-100"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-base font-bold text-slate-900">
                        Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                      </h3>
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {selectedDoctor?.specialty || 'Cardiologist'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{selectedDoctor?.degree || 'MD, DM (Cardiology)'}</span>
                      <span>•</span>
                      <span>{selectedDoctor?.experienceYears || 10}+ years experience</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedDoctor?.rating || '4.9'}</span>
                      <span className="text-slate-400 font-normal">({selectedDoctor?.reviewsCount || 128} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-600 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Hospital</div>
                      <div className="font-semibold text-slate-800 text-xs">
                        {selectedDoctor?.hospitalName || 'Aurelian Health Hospital'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Consultation Fee</div>
                      <div className="font-bold text-slate-900 text-sm">
                        ₹ {selectedDoctor?.consultationFee || 800}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Consultation Type</div>
                      <div className="font-semibold text-slate-800 text-xs">In-person</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-6 border-r-0 md:border-r border-slate-100 pr-0 md:pr-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Select Date</h4>

                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      onClick={prevMonth}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-xs text-slate-900">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                      onClick={nextMonth}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 mb-2">
                    {DAYS.map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 text-center gap-y-1.5">
                    {emptyDaysBefore.map((i) => (
                      <div key={`empty-${i}`} className="text-[11px] text-slate-300">
                        {25 + i}
                      </div>
                    ))}

                    {daysInMonth.map((day) => {
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div key={day.toString()} className="flex justify-center">
                          <button
                            onClick={() => setSelectedDate(day)}
                            className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50/60 rounded-xl p-2.5 text-[11px] text-blue-700 flex items-center gap-2 mt-4 font-medium">
                    <Info className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>All times are shown in your local time (IST)</span>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Available Time Slots</h4>

                  <div className="text-xs font-semibold text-blue-600 mb-2">
                    {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : 'Monday, 17 August 2026'}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {displaySlots.length === 0 && (
                      <div className="col-span-3 p-4 text-center text-sm text-slate-500">
                        No appointment slots are currently available for this date.
                      </div>
                    )}
                    {displaySlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;

                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            if (slot.isBooked) return;
                            setSelectedSlotId(slot.id);
                            setError('');
                          }}
                          className={`py-2 px-1.5 rounded-xl text-xs font-semibold transition-all text-center border ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          } ${
                            slot.isBooked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          {slot.label || (slot.startTime ? format(new Date(slot.startTime), 'hh:mm a') : '')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50/60 rounded-xl p-2.5 text-[11px] text-blue-700 flex items-center gap-2 mt-4 font-medium">
                    <Info className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>Morning slots are usually less crowded.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex-1 px-1">
                  {error && (
                    <div className="text-red-600 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {error}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!selectedDoctorId) {
                      setError('Please select a doctor.');
                      return;
                    }
                    if (!selectedDate) {
                      setError('Please select a date.');
                      return;
                    }
                    if (!selectedSlotId || String(selectedSlotId).startsWith('mock-')) {
                      setError('Please select an available time slot.');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 CONTENT: 100% Exact Replica of Appointment Details ─────── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── Left Column: Form Fields (7 Cols) ──────────────────────── */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                {/* 1. Visit Type */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800">Visit Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* In-person Visit Card */}
                    <div
                      onClick={() => setVisitType('In-person')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 relative ${
                        visitType === 'In-person'
                          ? 'border-blue-600 bg-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          {/* Radio icon */}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              visitType === 'In-person' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {visitType === 'In-person' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-900">In-person Visit</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Visit the clinic for a face-to-face consultation.
                        </p>
                      </div>
                    </div>

                    {/* Teleconsultation Card */}
                    <div
                      onClick={() => setVisitType('Teleconsultation')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 relative ${
                        visitType === 'Teleconsultation'
                          ? 'border-2 border-blue-600 bg-white shadow-xs'
                          : 'border border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          {/* Radio icon */}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              visitType === 'Teleconsultation' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {visitType === 'Teleconsultation' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-800">Teleconsultation</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Consult with the doctor online via video call.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Reason for Visit * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Reason for Visit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-700 outline-none appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="" disabled hidden>
                        Select or type the reason for your visit
                      </option>
                      <option value="General Checkup">General Checkup & Routine Consultation</option>
                      <option value="Chest Pain / Heart Palpitations">Chest Pain / Heart Palpitations</option>
                      <option value="High Blood Pressure Follow-up">High Blood Pressure Follow-up</option>
                      <option value="ECG & Cardiovascular Assessment">ECG & Cardiovascular Assessment</option>
                      <option value="Shortness of Breath">Shortness of Breath</option>
                      <option value="Other Medical Symptoms">Other Medical Symptoms</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Symptoms / Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">Symptoms / Notes</label>
                  <div className="relative">
                    <textarea
                      value={symptomsNotes}
                      onChange={(e) => setSymptomsNotes(e.target.value.slice(0, 500))}
                      rows={3}
                      placeholder="Describe your symptoms, concerns or any other details (optional)"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                    />
                    <div className="absolute right-3 bottom-2.5 text-[11px] text-slate-400 font-medium">
                      {symptomsNotes.length}/500
                    </div>
                  </div>
                </div>

                {/* 4. Upload Medical Reports (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">Upload Medical Reports (Optional)</label>
                  <div className="border-dashed border border-slate-200 bg-slate-50/50 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                      <UploadCloud className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Drag & drop files here or <span className="text-blue-600 font-bold hover:underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-normal">PDF, JPG, PNG up to 10MB each</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5 font-medium">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Previous medical reports help the doctor understand your condition better.</span>
                  </div>
                </div>

                {/* 5. Additional Preferences */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-800">Additional Preferences</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Preferred Consultation Language */}
                    <div className="relative border border-slate-200 rounded-xl px-3 py-2 bg-white">
                      <span className="block text-[10px] text-slate-400 font-medium">Preferred Consultation Language</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <select
                            value={preferredLanguage}
                            onChange={(e) => setPreferredLanguage(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-4"
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                          </select>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Preferred Gender of Doctor */}
                    <div className="relative border border-slate-200 rounded-xl px-3 py-2 bg-white">
                      <span className="block text-[10px] text-slate-400 font-medium">Preferred Gender of Doctor (Optional)</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <select
                            value={doctorGenderPref}
                            onChange={(e) => setDoctorGenderPref(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-4"
                          >
                            <option value="No Preference">No Preference</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Appointment Summary (5 Cols) ──────────────── */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-900">Appointment Summary</h3>

                {/* Doctor Details Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="relative shrink-0">
                    <img
                      src={
                        selectedDoctor?.profileImageUrl ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={selectedDoctor?.lastName}
                      className="w-14 h-14 rounded-full object-cover border border-slate-100"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900">
                        Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                      </h4>
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-blue-600 mb-0.5">
                      {selectedDoctor?.specialty || 'Cardiologist'}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {selectedDoctor?.degree || 'MD, DM (Cardiology)'} • {selectedDoctor?.experienceYears || 10}+ years exp.
                    </p>

                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedDoctor?.rating || '4.9'}</span>
                      <span className="text-slate-400 font-normal">({selectedDoctor?.reviewsCount || 128} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Key-Value Appointment Details Grid */}
                <div className="space-y-4 text-xs">
                  {/* Date & Time */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Date & Time</span>
                    </div>
                    <div className="text-right font-bold text-slate-900">
                      <div>{selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : 'Monday, 17 August 2026'}</div>
                      <div>{selectedSlotObj?.label || '09:00 AM'}</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Location</span>
                    </div>
                    <div className="text-right font-bold text-slate-900">
                      <div>{selectedDoctor?.hospitalName || 'Aurelian Health Hospital'}</div>
                      <div className="text-[11px] text-slate-400 font-normal">Main Branch</div>
                    </div>
                  </div>

                  {/* Consultation Type */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Consultation Type</span>
                    </div>
                    <div className="font-bold text-slate-900">{visitType === 'In-person' ? 'In-person Visit' : 'Teleconsultation'}</div>
                  </div>

                  {/* Consultation Fee */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Consultation Fee</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">₹ {selectedDoctor?.consultationFee || 800}</div>
                  </div>
                </div>

                {/* Light Blue Please Note Alert Box */}
                <div className="bg-blue-50/70 border border-blue-100/60 rounded-xl p-4 flex items-start gap-2.5 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-blue-900">Please Note</span>
                    <p className="text-[11px] text-blue-800 leading-snug">
                      You can reschedule or cancel your appointment up to 2 hours before the scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bottom Action Navigation Bar ─────────────────────────────── */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl px-5 py-3 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>← Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!reason.trim()) {
                    setReason('General Checkup');
                  }
                  setCurrentStep(4);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl px-8 py-3.5 shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 CONTENT: Review & Confirm ─────────────────────────────── */}
        {currentStep === 4 && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Review & Confirm</h3>
              <p className="text-xs text-slate-500">
                Please verify all appointment details before finalizing your booking.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs font-medium border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Detailed Appointment Card */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-500">Doctor</span>
                <span className="text-xs font-bold text-slate-900">
                  Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName} ({selectedDoctor?.specialty || 'Cardiologist'})
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-500">Date & Time</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedDate && format(selectedDate, 'EEEE, d MMMM yyyy')} at {selectedSlotObj?.label || '09:00 AM'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-500">Location</span>
                <span className="text-xs font-bold text-slate-900">{selectedDoctor?.hospitalName || 'Aurelian Health Hospital'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-500">Consultation Type</span>
                <span className="text-xs font-bold text-slate-900">{visitType === 'In-person' ? 'In-person Visit' : 'Teleconsultation'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-500">Reason for Visit</span>
                <span className="text-xs font-semibold text-slate-800 max-w-xs text-right">
                  {reason || 'General Checkup & Routine Consultation'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-500">Total Consultation Fee</span>
                <span className="text-base font-extrabold text-blue-600">
                  ₹ {selectedDoctor?.consultationFee || 800}
                </span>
              </div>
            </div>

            {/* Navigation & Submit Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                ← Back to Details
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking Appointment...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Book Appointment</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5 CONTENT: 100% Exact Replica of Booking Complete ──────────── */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-5xl mx-auto py-2">
            {/* Hero Celebration Banner */}
            <div className="text-center space-y-3 py-4 relative">
              {/* Confetti Particles */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
                <span className="absolute top-2 left-1/3 text-lg opacity-60">✨</span>
                <span className="absolute top-6 right-1/3 text-sm text-purple-400 opacity-60">•</span>
                <span className="absolute bottom-2 left-1/4 text-xs text-amber-400 opacity-60">✦</span>
                <span className="absolute top-4 right-1/4 text-sm text-blue-400 opacity-60">♦</span>
              </div>

              {/* Large Green Checkmark */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-200/60">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Booking Complete!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                Your appointment has been successfully scheduled.
              </p>
            </div>

            {/* Horizontal Appointment Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Appointment Summary</h3>
                <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Confirmed
                </span>
              </div>

              {/* 5-Section Horizontal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2 border-t border-slate-100 items-center">
                {/* 1. Doctor Profile */}
                <div className="flex items-center gap-3 md:col-span-1">
                  <div className="relative shrink-0">
                    <img
                      src={
                        selectedDoctor?.profileImageUrl ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={selectedDoctor?.lastName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                      </h4>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        ✓
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-600 truncate">
                      {selectedDoctor?.specialty || 'Cardiologist'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {selectedDoctor?.degree || 'MD, DM (Cardiology)'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{selectedDoctor?.rating || '4.9'}</span>
                      <span className="text-slate-400 font-normal">({selectedDoctor?.reviewsCount || 128} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Date & Time */}
                <div className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Date & Time</span>
                    <span className="block text-xs font-bold text-slate-900">
                      {selectedDate ? format(selectedDate, 'EEE, d MMM yyyy') : 'Mon, 17 Aug 2026'}
                    </span>
                    <span className="block text-[11px] font-semibold text-slate-700">
                      {selectedSlotObj?.label || '09:00 AM'}
                    </span>
                  </div>
                </div>

                {/* 3. Location */}
                <div className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 font-medium">Location</span>
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {selectedDoctor?.hospitalName || 'Aurelian Health Hospital'}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">Main Branch</span>
                  </div>
                </div>

                {/* 4. Consultation Type */}
                <div className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Consultation Type</span>
                    <span className="block text-xs font-bold text-slate-900">
                      {visitType === 'In-person' ? 'In-person Visit' : 'Teleconsultation'}
                    </span>
                  </div>
                </div>

                {/* 5. Fee */}
                <div className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Consultation Fee</span>
                    <span className="block text-xs font-bold text-slate-900">
                      ₹ {selectedDoctor?.consultationFee || 800}
                    </span>
                    <span className="block text-[10px] font-bold text-emerald-600">Paid</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Light Blue Confirmation Notice Banner */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-900 font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>A confirmation has been sent to your email and SMS with appointment details.</span>
            </div>

            {/* 2-Column Action & Support Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Box: What's Next? (4 Action Columns) */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900">What's Next?</h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Action 1: Add to Calendar */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Add to Calendar</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Add this appointment to your calendar
                      </span>
                    </div>
                    <button className="w-full mt-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs py-1.5 px-3 rounded-xl transition-colors cursor-pointer">
                      Add
                    </button>
                  </div>

                  {/* Action 2: Set Reminder */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Set Reminder</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Get reminded before your appointment
                      </span>
                    </div>
                    <button className="w-full mt-1 border border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold text-xs py-1.5 px-2 rounded-xl transition-colors cursor-pointer">
                      Set Reminder
                    </button>
                  </div>

                  {/* Action 3: Prepare for Visit */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Prepare for Visit</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">
                        View instructions and things to carry
                      </span>
                    </div>
                    <button className="w-full mt-1 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold text-xs py-1.5 px-2 rounded-xl transition-colors cursor-pointer">
                      View Guide
                    </button>
                  </div>

                  {/* Action 4: Reschedule */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Reschedule</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Change appointment date or time
                      </span>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full mt-1 border border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold text-xs py-1.5 px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Box: Need Help? (2 Options) */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Need Help?</h4>

                <div className="space-y-2.5">
                  {/* Option 1: Contact Support */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Contact Support</span>
                        <span className="block text-[10px] text-slate-400">We're here to help you</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Option 2: Chat with Assistant */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Chat with Assistant</span>
                        <span className="block text-[10px] text-slate-400">Get quick answers to your questions</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Center Bottom CTA */}
            <div className="pt-4 text-center">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl px-8 py-3.5 shadow-md flex items-center gap-2 mx-auto cursor-pointer transition-all"
              >
                <span>Back to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
