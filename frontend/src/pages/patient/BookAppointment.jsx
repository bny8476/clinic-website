import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransition } from '../../components/ui/motion';
import Button from '../../components/ui/Button';
import { 
  ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, 
  ChevronDown, ChevronLeft, ChevronRight, Filter, Headphones, 
  MapPin, Search, Shield, Zap 
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookAppointment() {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rescheduleId = searchParams.get('rescheduleId');
    const patientUserId = searchParams.get('patientId');
    const patientName = searchParams.get('patientName');
    const queryClient = useQueryClient();
    const { user, token } = useAuthStore();
    
    // State
    const [currentStep, setCurrentStep] = useState(1); 
    const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || '');
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [holdId, setHoldId] = useState(null);
    const [idempotencyKey] = useState(() => crypto.randomUUID());
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');

    // Fetch list of doctors
    const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
        queryKey: ['allDoctors'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/doctors');
            return res.data;
        }
    });

    const selectedDoctor = useMemo(() => doctors.find(d => String(d.userId) === String(selectedDoctorId)), [doctors, selectedDoctorId]);

    // Fetch doctor's working hours
    const { data: workingHours = [] } = useQuery({
        queryKey: ['doctorWorkingHours', selectedDoctorId],
        queryFn: async () => {
            try {
                const res = await axiosPrivate.get(`/doctors/${selectedDoctorId}/working-hours`);
                return res.data;
            } catch (err) {
                return []; 
            }
        },
        enabled: !!selectedDoctorId
    });

    // Fetch slots for the selected date only
    const { data: slots = [], isLoading: slotsLoading } = useQuery({
        queryKey: ['availableSlots', selectedDoctorId, selectedDate?.toISOString()],
        queryFn: async () => {
            if (!selectedDate) return [];
            const start = new Date(selectedDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(selectedDate);
            end.setHours(23, 59, 59, 999);
            const res = await axiosPrivate.get(`/appointments/slots?doctorId=${selectedDoctorId}&start=${start.toISOString()}&end=${end.toISOString()}`);
            return res.data;
        },
        enabled: !!selectedDoctorId && !!selectedDate
    });

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;
    const dateFormat = "MMMM yyyy";
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    const startDayOfWeek = monthStart.getDay();
    const emptyDaysBefore = Array.from({ length: startDayOfWeek }).map((_, i) => i);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Handle slot real-time updates
    useEffect(() => {
        if (!token) return;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        const evtSource = new EventSource(`${baseUrl.replace('/api', '')}/api/sse/appointments?token=${token}`);
        
        evtSource.addEventListener('appointment-booked', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (String(data.doctorId) === String(selectedDoctorId) && selectedDate) {
                    queryClient.invalidateQueries(['availableSlots', selectedDoctorId, selectedDate.toISOString()]);
                }
            } catch (err) {}
        });

        return () => evtSource.close();
    }, [selectedDoctorId, selectedDate, queryClient, token]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data, idempotencyKey };
            if (holdId) payload.holdId = holdId;
            if (patientUserId) payload.patientUserId = parseInt(patientUserId);
            
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
            setCurrentStep(5);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to book appointment');
            if (err.response?.status === 409 && selectedDate) {
                queryClient.invalidateQueries(['availableSlots', selectedDoctorId, selectedDate.toISOString()]);
                setSelectedSlotId('');
            }
        }
    });

    const handleConfirm = () => {
        setError('');
        if (!selectedSlotId) return setError('Please select a time slot.');
        if (!reason) return setError('Please provide a reason for the visit.');
        mutation.mutate({ slotId: selectedSlotId, reasonForVisit: reason });
    };

    const handleSlotSelection = async (slotId, slotStartTime) => {
        if (slotId === selectedSlotId) return;
        setError('');

        if (holdId) {
            try {
                await axiosPrivate.delete(`/appointments/hold/${holdId}?doctorId=${selectedDoctorId}&slotStart=${slotStartTime}`);
                setHoldId(null);
            } catch (err) {
                console.error("Failed to release old hold", err);
            }
        }

        setSelectedSlotId(slotId);

        try {
            const res = await axiosPrivate.post('/appointments/hold', {
                doctorId: selectedDoctorId,
                slotStart: slotStartTime
            });
            setHoldId(res.data.holdId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to hold slot. It might have just been taken.');
            setSelectedSlotId('');
            queryClient.invalidateQueries(['availableSlots', selectedDoctorId, selectedDate.toISOString()]);
        }
    };

    const clearSelection = async () => {
        if (holdId && selectedSlotId) {
            const slot = slots.find(s => s.id === selectedSlotId);
            if (slot) {
                try {
                    await axiosPrivate.delete(`/appointments/hold/${holdId}?doctorId=${selectedDoctorId}&slotStart=${slot.startTime}`);
                } catch (err) {
                    console.error("Failed to release hold", err);
                }
            }
        }
        setHoldId(null);
        setSelectedDoctorId('');
        setSelectedDate(null);
        setSelectedSlotId('');
        setCurrentStep(1);
    };

    // Release hold on unmount
    useEffect(() => {
        return () => {
            if (holdId && selectedSlotId) {
                const slot = slots.find(s => s.id === selectedSlotId);
                if (slot) {
                    axiosPrivate.delete(`/appointments/hold/${holdId}?doctorId=${selectedDoctorId}&slotStart=${slot.startTime}`).catch(() => {});
                }
            }
        };
    }, [holdId, selectedDoctorId, selectedSlotId, slots]);

    const filteredDoctors = doctors.filter(doc => {
        const fullName = `${doc.firstName} ${doc.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || (doc.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = selectedSpecialty ? (doc.specialty === selectedSpecialty) : true;
        return matchesSearch && matchesSpecialty;
    });

    const uniqueSpecialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));

    const selectedSlot = slots.find(s => s.id === selectedSlotId);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gray-50 min-h-screen">
            
            {/* Stepper */}
            <div className="relative mb-12">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
                    <Link to="/patient/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                </div>
                
                <div className="hidden md:flex justify-center items-center relative max-w-4xl mx-auto">
                    <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-gray-300 -z-10 -translate-y-1/2"></div>
                    
                    {[
                        { num: 1, label: 'Select Doctor' },
                        { num: 2, label: 'Select Date & Time' },
                        { num: 3, label: 'Appointment Details' },
                        { num: 4, label: 'Review & Confirm' },
                        { num: 5, label: 'Booking Complete' }
                    ].map(step => (
                        <div key={step.num} className="flex flex-col items-center relative z-10 bg-gray-50 px-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 
                                ${currentStep > step.num ? 'bg-indigo-600 border-indigo-600 text-white' : 
                                  currentStep === step.num ? 'bg-indigo-600 border-indigo-600 text-white' : 
                                  'bg-white border-gray-300 text-gray-400'}`}>
                                {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${currentStep === step.num ? 'text-indigo-600' : 'text-gray-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
            {currentStep === 5 ? (
                <motion.div 
                    key="step5"
                    variants={pageTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-2xl mx-auto"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking {rescheduleId ? 'Rescheduled' : 'Confirmed'}!</h2>
                    <p className="text-gray-600 mb-8">
                        Your appointment with Dr. {selectedDoctor?.lastName} is scheduled for {selectedDate && format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot && format(new Date(selectedSlot.startTime), 'h:mm a')}.
                    </p>
                    <button 
                        onClick={() => navigate('/patient/dashboard')}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>
            ) : (
                <motion.div 
                    key="booking"
                    variants={pageTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                    
                    {/* LEFT COLUMN */}
                    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 mt-16 sm:mt-0">
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Appointment</h1>
                            <p className="text-gray-500 mt-1">
                                {patientName ? `Booking for patient: ${patientName}` : 'Schedule a consultation with our specialists'}
                            </p>
                        </div>

                        {currentStep === 1 || currentStep === 2 ? (
                            <>
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="relative flex-[2]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input 
                                            type="text" 
                                            placeholder="Search doctors by name, specialty or keyword" 
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <select 
                                            value={selectedSpecialty}
                                            onChange={e => setSelectedSpecialty(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Specialties</option>
                                            {uniqueSpecialties.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>
                                    <div className="relative flex-1">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer">
                                            <option>All Locations</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>
                                    <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                                        <Filter className="w-4 h-4" /> Filter
                                    </button>
                                </div>

                                {/* Doctor List */}
                                <div className="space-y-4">
                                    {doctorsLoading ? (
                                        <div className="text-center py-12 text-gray-500">Loading doctors...</div>
                                    ) : filteredDoctors.map(doc => {
                                        const isSelected = selectedDoctorId === String(doc.userId);
                                        const specialties = (doc.specialty || '').split(',').map(s => s.trim()).filter(Boolean);
                                        const fee = doc.consultationFee || 50; 
                                        
                                        return (
                                            <div 
                                                key={doc.id} 
                                                className={`bg-white rounded-2xl border transition-all ${isSelected ? 'border-indigo-200 shadow-sm' : 'border-gray-200 shadow-sm'}`}
                                            >
                                                <div className="p-6">
                                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                                        {/* Left section: Avatar & Details */}
                                                        <div className="flex items-start gap-5">
                                                            <div className="relative">
                                                                <div className="w-[84px] h-[84px] rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0 text-indigo-700 text-2xl font-bold">
                                                                    {doc.profileImageUrl ? (
                                                                        <img loading="lazy" src={doc.profileImageUrl} alt={`Dr. ${doc.lastName}`} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <>{doc.firstName?.[0]}{doc.lastName?.[0]}</>
                                                                    )}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                            </div>
                                                            
                                                            <div>
                                                                <h3 className="text-[22px] font-bold text-gray-900 leading-none mb-2">Dr. {doc.firstName} {doc.lastName}</h3>
                                                                <p className="text-gray-500 text-sm mb-3">MBBS, MD ({doc.specialty || 'General'}) &bull; 12 Years Experience</p>
                                                                <div className="flex items-center text-yellow-400 text-sm mb-3">
                                                                    {'★'.repeat(5)} <span className="text-gray-500 ml-2 font-medium">4.9 (120 Reviews)</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                                        {doc.specialty || 'General'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right section: Location, Fee, Button */}
                                                        <div className="flex flex-row lg:flex-col justify-between lg:justify-center items-start lg:items-end w-full lg:w-auto gap-4 lg:gap-3 lg:pl-6 border-t lg:border-t-0 border-gray-100 pt-5 lg:pt-0">
                                                            <div className="flex flex-col items-start lg:items-end">
                                                                <div className="flex items-start text-sm text-gray-500 mb-4 lg:mb-3">
                                                                    <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                                                    <div className="text-left lg:text-right">
                                                                        <p className="text-gray-700 font-medium">Aurelian Health Hospital</p>
                                                                        <p className="text-xs">Main Branch, New York</p>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    if (!isSelected) {
                                                                        clearSelection();
                                                                        setSelectedDoctorId(String(doc.userId));
                                                                    }
                                                                }}
                                                                className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                                            >
                                                                Book Appointment
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Details (only shown if selected) */}
                                                {isSelected && (
                                                    <div className="border-t border-gray-100 p-6 bg-gray-50/50 rounded-b-2xl">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-900 mb-2">About Doctor</h4>
                                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                                    Dr. {doc.firstName} {doc.lastName} is a highly experienced {doc.specialty || 'physician'} with expertise in interventional cardiology, preventive cardiology and heart failure management.
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-900 mb-2">Available On</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                                        <span key={day} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${day === 'Tue' || day === 'Wed' || day === 'Thu' || day === 'Fri' ? 'bg-indigo-50 text-indigo-700' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                                                            {day}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Time Slots Area */}
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900 mb-4">Available Time Slots</h4>
                                                            {!selectedDate ? (
                                                                <div className="text-sm text-gray-500 p-4 border border-dashed border-gray-300 rounded-xl text-center bg-white">
                                                                    Please select a date from the calendar on the right to view available slots.
                                                                </div>
                                                            ) : slotsLoading ? (
                                                                <div className="text-sm text-gray-500 p-4 text-center">Loading slots...</div>
                                                            ) : slots.length === 0 ? (
                                                                <div className="text-sm text-gray-500 p-4 text-center border border-dashed border-gray-300 rounded-xl bg-white">No available slots for {format(selectedDate, 'MMM d, yyyy')}.</div>
                                                            ) : (
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                                    {slots.map(slot => {
                                                                        const isSlotSelected = selectedSlotId === slot.id;
                                                                        return (
                                                                            <button 
                                                                                key={slot.id}
                                                                                onClick={() => handleSlotSelection(slot.id, slot.startTime)}
                                                                                className={`py-2.5 px-2 text-sm rounded-xl border font-bold transition-all
                                                                                    ${isSlotSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'}`}
                                                                            >
                                                                                {format(new Date(slot.startTime), 'hh:mm a')}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Next Step Footer */}
                                                        {selectedDate && selectedSlotId && (
                                                            <div className="mt-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                                                        <Check className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-gray-900">Next Step: Appointment Details</h4>
                                                                        <p className="text-xs text-gray-500">Please provide reason for visit to complete booking.</p>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => setCurrentStep(3)}
                                                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center shadow-md shadow-indigo-200"
                                                                >
                                                                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Features Footer */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 pb-6 border-t border-gray-200 mt-8">
                                    <div className="flex items-start gap-3">
                                        <CalendarIcon className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 mb-1">Easy Booking</h5>
                                            <p className="text-[10px] text-gray-500 leading-tight">Book appointments in just a few clicks</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 mb-1">Secure & Private</h5>
                                            <p className="text-[10px] text-gray-500 leading-tight">Your information is safe with us</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Headphones className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 mb-1">24/7 Support</h5>
                                            <p className="text-[10px] text-gray-500 leading-tight">We're here to help you anytime</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 mb-1">Instant Confirmation</h5>
                                            <p className="text-[10px] text-gray-500 leading-tight">Get immediate booking confirmation</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : currentStep === 3 || currentStep === 4 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Appointment Details</h3>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit {rescheduleId ? '' : '*'}</label>
                                        <textarea
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            rows="4"
                                            className="w-full rounded-xl border border-gray-300 p-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y transition-shadow"
                                            placeholder={rescheduleId ? "Reason for visit (optional for rescheduling)..." : "Please describe your symptoms or reason for visit..."}
                                        />
                                    </div>
                                    
                                    {error && (
                                        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                                        <button 
                                            onClick={() => setCurrentStep(1)}
                                            className="text-gray-500 hover:text-gray-900 font-medium"
                                        >
                                            Back to Doctor & Time
                                        </button>
                                        <Button 
                                            variant="primary"
                                            onClick={handleConfirm}
                                            disabled={!rescheduleId && !reason.trim()}
                                            isLoading={mutation.isPending}
                                            className="px-8 py-3 text-base"
                                        >
                                            Review & Confirm <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Summary Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-extrabold text-gray-900 text-[15px]">Appointment Summary</h3>
                                <button onClick={clearSelection} className="text-indigo-600 font-semibold text-xs hover:underline">Clear All</button>
                            </div>
                            
                            <div className="space-y-4 text-[13px]">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center font-medium"><span className="w-5 mr-3 text-gray-400">👤</span> Doctor</span>
                                    <span className={selectedDoctor ? 'font-semibold text-gray-900' : 'text-gray-400 font-medium'}>
                                        {selectedDoctor ? `Dr. ${selectedDoctor.lastName} (${selectedDoctor.specialty || 'General'})` : 'Not selected'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center font-medium"><span className="w-5 mr-3 text-gray-400">📅</span> Date</span>
                                    <span className={selectedDate ? 'font-semibold text-gray-900' : 'text-gray-400 font-medium'}>
                                        {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Not selected'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center font-medium"><span className="w-5 mr-3 text-gray-400">🕒</span> Time</span>
                                    <span className={selectedSlot ? 'font-semibold text-gray-900' : 'text-gray-400 font-medium'}>
                                        {selectedSlot ? format(new Date(selectedSlot.startTime), 'hh:mm a') : 'Not selected'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center font-medium"><MapPin className="w-[18px] h-[18px] mr-[14px] text-gray-400" /> Location</span>
                                    <span className="font-semibold text-gray-900 text-right">Aurelian Health Hospital</span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-gray-500 flex items-center font-medium"><span className="w-5 mr-3 text-gray-400">👤</span> Consultation Type</span>
                                    <span className="font-semibold text-gray-900">In-person</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Card (Only visible/active if doctor is selected and we are on step 1 or 2) */}
                        {(currentStep === 1 || currentStep === 2) && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 transition-opacity">
                                <h3 className="font-extrabold text-gray-900 mb-4 text-[14px]">Select Date</h3>
                                
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                                        <span className="font-bold text-[13px] text-gray-900">{format(currentMonth, dateFormat)}</span>
                                        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-7 text-center text-[10px] text-gray-500 font-bold mb-2">
                                        {DAYS.map(d => <div key={d}>{d}</div>)}
                                    </div>
                                    
                                    <div className="grid grid-cols-7 text-center gap-y-1">
                                        {emptyDaysBefore.map(i => <div key={`empty-${i}`} />)}
                                        
                                        {daysInMonth.map(day => {
                                            const isPast = day < new Date(new Date().setHours(0,0,0,0));
                                            const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
                                            const isWorkingDay = selectedDoctorId 
                                                ? workingHours.some(wh => wh.dayOfWeek === day.getDay() && wh.isActive)
                                                : true;
                                            const isDisabled = isPast || !isWorkingDay;
                                            
                                            return (
                                                <div key={day.toString()} className="flex justify-center relative">
                                                    <button
                                                        onClick={() => { 
                                                            if (selectedDate && isSameDay(day, selectedDate)) return;
                                                            if (holdId && selectedSlotId) {
                                                                const slot = slots.find(s => s.id === selectedSlotId);
                                                                if (slot) {
                                                                    axiosPrivate.delete(`/appointments/hold/${holdId}?doctorId=${selectedDoctorId}&slotStart=${slot.startTime}`).catch(() => {});
                                                                }
                                                                setHoldId(null);
                                                            }
                                                            setSelectedDate(day); 
                                                            setSelectedSlotId(''); 
                                                        }}
                                                        disabled={isDisabled}
                                                        className={`w-[26px] h-[26px] flex items-center justify-center rounded-full text-[11px] font-bold transition-colors
                                                            ${isSelectedDay ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 
                                                              isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}
                                                    >
                                                        {format(day, 'd')}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mt-4 text-center border-t border-gray-100 pt-3">
                                    <span className="text-indigo-600 font-semibold text-[12px]">Today: {format(new Date(), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
