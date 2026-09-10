import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, User, Phone, Mail, Stethoscope, Building, 
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ShieldCheck,
  FileText, Lock, Printer, LogIn, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { axiosPublic } from '../../api/axios';
import { usePublicDepartments, usePublicDoctors } from '../../api/publicApi';

export default function QuickBookingModal({ isOpen, onClose, initialDoctorId = null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1); // 1: Patient Info, 2: Dept & Doctor, 3: Date & Slot, 4: Review, 5: Confirmation

  // Patient Info State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [reason, setReason] = useState('');

  // Booking Selection State
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Status & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Slots State
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Public Data
  const { data: departments = [], isLoading: isLoadingDepts } = usePublicDepartments();
  const { data: doctors = [], isLoading: isLoadingDoctors } = usePublicDoctors();

  // Reset form when opening modal
  useEffect(() => {
    if (isOpen) {
      if (initialDoctorId) {
        setSelectedDoctorId(initialDoctorId);
        const doc = doctors.find(d => String(d.id) === String(initialDoctorId));
        if (doc && doc.departmentId) {
          setSelectedDepartmentId(String(doc.departmentId));
        }
      }
    } else {
      setStep(1);
      setErrorMessage('');
      setAccountExists(false);
      setConfirmedAppointment(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialDoctorId, doctors]);

  // Filter Doctors by selected department
  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    if (!selectedDepartmentId) return doctors;
    return doctors.filter(doc => String(doc.departmentId) === String(selectedDepartmentId) || String(doc.department?.id) === String(selectedDepartmentId));
  }, [doctors, selectedDepartmentId]);

  // Fetch real available slots when doctor and date change
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setErrorMessage('');
      try {
        const res = await axiosPublic.get('/appointments/available-slots', {
          params: { doctorId: selectedDoctorId, date: selectedDate }
        });
        const slotsData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setAvailableSlots(slotsData);
      } catch (err) {
        console.error('Failed to load slots:', err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  if (!isOpen) return null;

  const selectedDoctorObj = doctors.find(d => String(d.id) === String(selectedDoctorId));
  const selectedDeptObj = departments.find(d => String(d.id) === String(selectedDepartmentId));

  // Handle Step 1 Validation
  const handleNextFromStep1 = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMessage('Please enter the patient name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 7) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    if (!patientEmail.trim() || !patientEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  // Handle Step 2 Validation
  const handleNextFromStep2 = () => {
    if (!selectedDoctorId) {
      setErrorMessage('Please select a doctor to proceed.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  // Handle Step 3 Validation
  const handleNextFromStep3 = () => {
    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }
    setErrorMessage('');
    setStep(4);
  };

  // Handle Login when account exists
  const handleAccountExistsLogin = () => {
    const pendingBooking = {
      doctorId: selectedDoctorId,
      departmentId: selectedDepartmentId,
      date: selectedDate,
      slotId: selectedSlot?.id,
      patientName,
      patientEmail,
      patientPhone
    };
    localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
    onClose();
    navigate('/login?redirect=/patient/book');
  };

  // Submit Guest Booking
  const handleConfirmBooking = async () => {
    if (isSubmitting) return; // Prevent duplicate submission

    setIsSubmitting(true);
    setErrorMessage('');
    setAccountExists(false);

    const nameParts = patientName.trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      slotId: selectedSlot?.id,
      doctorId: Number(selectedDoctorId),
      appointmentDate: selectedDate,
      startTime: selectedSlot?.startTime,
      patientFirstName: firstName,
      patientLastName: lastName,
      patientEmail: patientEmail.trim(),
      patientPhone: patientPhone.trim(),
      reasonForVisit: reason.trim() || 'General Consultation',
      type: 'In-person'
    };

    try {
      const response = await axiosPublic.post('/appointments/guest', payload);
      const data = response.data?.data || response.data;
      
      setConfirmedAppointment(data);
      setStep(5);

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['public-doctors'] });
    } catch (err) {
      console.error('Guest booking error:', err);
      const status = err.response?.status;
      const responseMessage = err.response?.data?.message || err.response?.data?.error || '';

      if (status === 409) {
        if (responseMessage.includes('account already exists') || err.response?.data?.code === 'ACCOUNT_EXISTS') {
          setAccountExists(true);
          setErrorMessage('An account already exists with this phone or email. Please log in to complete your booking.');
        } else {
          // Slot Conflict Error
          setErrorMessage('This appointment slot has just been booked by another patient. Please select another available time.');
          setSelectedSlot(null);
          // Refresh slots
          try {
            const res = await axiosPublic.get('/appointments/available-slots', {
              params: { doctorId: selectedDoctorId, date: selectedDate }
            });
            setAvailableSlots(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          } catch (e) {
            console.error('Slot refresh error:', e);
          }
          setStep(3); // Send back to slot selection step
        }
      } else {
        setErrorMessage(responseMessage || 'Failed to book appointment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintConfirmation = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8"
        >
          {/* Top Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-white/10 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Elixir Health Care</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Quick Appointment Booking</h2>
            <p className="text-sm text-blue-100 mt-1">Book a doctor consultation in a few simple steps</p>

            {/* Stepper Dots */}
            {step < 5 && (
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-blue-300' : 'w-4 bg-white/30'
                    }`}
                  />
                ))}
                <span className="ml-auto text-xs text-blue-200 font-medium">Step {step} of 4</span>
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">
            {/* Global Error Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
                  accountExists 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${accountExists ? 'text-amber-600' : 'text-red-600'}`} />
                <div className="flex-1 text-sm font-medium">
                  {errorMessage}
                  {accountExists && (
                    <div className="mt-3">
                      <button
                        onClick={handleAccountExistsLogin}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        <LogIn size={14} /> Log In to Continue Booking
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 1: PATIENT INFORMATION */}
            {step === 1 && (
              <form onSubmit={handleNextFromStep1} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Patient Information
                </h3>
                <p className="text-xs text-gray-500 mb-4">Please provide minimal details for your appointment booking.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +1 555-0199"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. john@example.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={(e) => setGender(e.target.value)}
                          className="text-blue-600 focus:ring-blue-600"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Visit (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe symptoms or reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Next: Select Doctor <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: DEPARTMENT & DOCTOR SELECTION */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" /> Select Department & Doctor
                </h3>

                {/* Department Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedDoctorId('');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctors List / Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Available Doctors *</label>
                  {isLoadingDoctors ? (
                    <div className="p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading doctors...
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                      No doctors available for this department.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {filteredDoctors.map((doc) => {
                        const isSelected = String(doc.id) === String(selectedDoctorId);
                        return (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDoctorId(String(doc.id))}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-600/20'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <img
                              src={doc.photoUrl || doc.imageUrl || `https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150`}
                              alt={doc.firstName}
                              className="w-12 h-12 rounded-full object-cover shrink-0 border border-white shadow-sm"
                            />
                            <div className="overflow-hidden">
                              <h4 className="text-xs font-bold text-gray-900 truncate">
                                Dr. {doc.firstName} {doc.lastName}
                              </h4>
                              <p className="text-[11px] text-blue-600 font-semibold truncate">{doc.specialty || 'Specialist'}</p>
                              <p className="text-[10px] text-gray-400 truncate">{doc.departmentName || 'General Clinic'}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Next: Select Slot <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DATE & TIME SLOT SELECTION */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Select Date & Time Slot
                </h3>

                {selectedDoctorObj && (
                  <div className="p-3 bg-blue-50/60 rounded-xl flex items-center gap-3 border border-blue-100">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Dr. {selectedDoctorObj.firstName} {selectedDoctorObj.lastName}</p>
                      <p className="text-[11px] text-blue-600 font-medium">{selectedDoctorObj.specialty}</p>
                    </div>
                  </div>
                )}

                {/* Date Selection Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Real Time Slots */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Available Time Slots *</label>
                  {isLoadingSlots ? (
                    <div className="p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Checking availability...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                      No available slots found for this date. Please pick another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            <Clock size={13} />
                            {slot.label || slot.startTime?.split('T')[1]?.substring(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep3}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Next: Review <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRMATION */}
            {step === 4 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> Review & Confirm Appointment
                </h3>

                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-xs text-gray-500 font-medium">Patient</span>
                    <span className="text-xs font-bold text-gray-900">{patientName} ({patientPhone})</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-xs text-gray-500 font-medium">Doctor</span>
                    <span className="text-xs font-bold text-blue-600">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-xs text-gray-500 font-medium">Department</span>
                    <span className="text-xs font-bold text-gray-900">{selectedDeptObj?.name || selectedDoctorObj?.specialty}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-xs text-gray-500 font-medium">Date</span>
                    <span className="text-xs font-bold text-gray-900">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">Time Slot</span>
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                      {selectedSlot?.label || selectedSlot?.startTime}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmBooking}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Booking appointment...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Confirm Appointment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SUCCESSFUL BOOKING CONFIRMATION */}
            {step === 5 && (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Appointment Booked!</h3>
                  <p className="text-xs text-gray-500 mt-1">Your appointment has been successfully scheduled.</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl p-5 border border-blue-100 text-left space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-blue-900 border-b border-blue-100 pb-2">
                    <span>Appointment Number:</span>
                    <span className="text-blue-700">#{confirmedAppointment?.id || confirmedAppointment?.appointmentNumber || 'APT-' + Math.floor(1000 + Math.random()*9000)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Patient Name:</span>
                    <span className="font-semibold">{patientName}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Doctor:</span>
                    <span className="font-semibold">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Date & Time:</span>
                    <span className="font-semibold">{selectedDate} ({selectedSlot?.label || 'Scheduled'})</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Status:</span>
                    <span className="font-bold text-green-600 uppercase">Confirmed</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handlePrintConfirmation}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Printer size={15} /> Print Confirmation
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/register');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
                  >
                    <User size={15} /> Create Patient Account
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
