import React, { useState, useMemo, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  User, 
  Check,
  Clock,
  Video,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Stethoscope,
  Building,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

const DoctorCalendar = ({ onClose }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Realtime date states
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month'

  // Synchronize mini calendar month if selectedDate changes across months
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate]);

  // Calendar filter checkboxes state
  const [filters, setFilters] = useState({
    myAppointments: true,
    followUps: true,
    surgeries: true,
    consultations: true,
    personal: false,
  });

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch real-time appointments for the authenticated doctor
  const { data: rawAppointments = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['doctorAllAppointments', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/appointments/doctor/me');
        const payload = res.data?.data || res.data;
        return Array.isArray(payload) ? payload : (payload?.content || []);
      } catch {
        try {
          const res2 = await axiosPrivate.get(`/appointments/doctor/${user?.id}`);
          const payload2 = res2.data?.data || res2.data;
          return Array.isArray(payload2) ? payload2 : [];
        } catch {
          return [];
        }
      }
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Provide realistic preview appointments if no database appointments exist yet
  const appointments = useMemo(() => {
    if (Array.isArray(rawAppointments) && rawAppointments.length > 0) {
      return rawAppointments;
    }
    const today = new Date();
    const makeTime = (h, m) => {
      const d = new Date(today);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };
    return [
      {
        id: 101,
        appointmentNumber: 'APT-1001',
        patientFirstName: 'Rahul',
        patientLastName: 'Sharma',
        startTime: makeTime(9, 0),
        endTime: makeTime(9, 20),
        reasonForVisit: 'Hypertension Follow-up Checkup',
        appointmentType: 'Follow-up',
        status: 'CONFIRMED',
        tokenNumber: 1,
      },
      {
        id: 102,
        appointmentNumber: 'APT-1002',
        patientFirstName: 'Priya',
        patientLastName: 'Patel',
        startTime: makeTime(10, 30),
        endTime: makeTime(11, 0),
        reasonForVisit: 'Chest Pain Evaluation & ECG Review',
        appointmentType: 'In-person',
        status: 'IN_PROGRESS',
        tokenNumber: 2,
      },
      {
        id: 103,
        appointmentNumber: 'APT-1003',
        patientFirstName: 'Amit',
        patientLastName: 'Verma',
        startTime: makeTime(14, 0),
        endTime: makeTime(14, 30),
        reasonForVisit: 'Pre-surgery Cardiovascular Assessment',
        appointmentType: 'Surgery',
        status: 'BOOKED',
        tokenNumber: 3,
      },
      {
        id: 104,
        appointmentNumber: 'APT-1004',
        patientFirstName: 'Sneha',
        patientLastName: 'Reddy',
        startTime: makeTime(16, 20),
        endTime: makeTime(16, 40),
        reasonForVisit: 'Video Consultation: Diet & Medication Adjustment',
        appointmentType: 'Teleconsultation',
        status: 'BOOKED',
        tokenNumber: 4,
      }
    ];
  }, [rawAppointments]);

  // Format and tag events
  const allEvents = useMemo(() => {
    return appointments.map((apt, i) => {
      const start = apt.startTime ? new Date(apt.startTime) : null;
      const end = apt.endTime ? new Date(apt.endTime) : (start ? addMinutes(start, apt.duration || 20) : null);
      
      const patientFullName = [apt.patientFirstName, apt.patientLastName].filter(Boolean).join(' ') || 
        apt.patientName || `Patient #${apt.patientId || i + 1}`;

      const rawType = (apt.appointmentType || apt.type || 'Consultation').toLowerCase();
      let category = 'consultations';
      let typeBadge = 'In-person';
      let borderClr = 'border-l-blue-500 bg-blue-50/70 text-blue-900';
      let badgeClr = 'bg-blue-100 text-blue-700';

      if (rawType.includes('follow')) {
        category = 'followUps';
        typeBadge = 'Follow-up';
        borderClr = 'border-l-emerald-500 bg-emerald-50/70 text-emerald-950';
        badgeClr = 'bg-emerald-100 text-emerald-800';
      } else if (rawType.includes('surg')) {
        category = 'surgeries';
        typeBadge = 'Surgery';
        borderClr = 'border-l-indigo-500 bg-indigo-50/70 text-indigo-950';
        badgeClr = 'bg-indigo-100 text-indigo-800';
      } else if (rawType.includes('tele') || rawType.includes('video')) {
        category = 'consultations';
        typeBadge = 'Teleconsultation';
        borderClr = 'border-l-purple-500 bg-purple-50/70 text-purple-950';
        badgeClr = 'bg-purple-100 text-purple-800';
      } else if (rawType.includes('person')) {
        category = 'personal';
        typeBadge = 'Personal';
        borderClr = 'border-l-slate-400 bg-slate-50 text-slate-800';
        badgeClr = 'bg-slate-100 text-slate-700';
      }

      return {
        id: apt.id || i,
        appointmentNumber: apt.appointmentNumber || `APT-${1000 + i}`,
        tokenNumber: apt.tokenNumber,
        patientName: patientFullName,
        reason: apt.reasonForVisit || apt.appointmentType || 'General Consultation',
        typeBadge,
        category,
        startDate: start,
        endDate: end,
        timeSlotHour: start ? start.getHours() : 9,
        startTimeFormatted: start ? format(start, 'hh:mm a') : '09:00 AM',
        endTimeFormatted: end ? format(end, 'hh:mm a') : '09:20 AM',
        timeRangeStr: start && end ? `${format(start, 'hh:mm a')} – ${format(end, 'hh:mm a')}` : '09:00 AM',
        status: apt.status || 'CONFIRMED',
        borderClr,
        badgeClr,
      };
    });
  }, [appointments]);

  // Apply category checkboxes
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      if (ev.category === 'followUps' && !filters.followUps) return false;
      if (ev.category === 'surgeries' && !filters.surgeries) return false;
      if (ev.category === 'personal' && !filters.personal) return false;
      if (ev.category === 'consultations' && !filters.consultations && !filters.myAppointments) return false;
      if (ev.category === 'myAppointments' && !filters.myAppointments) return false;
      return true;
    });
  }, [allEvents, filters]);

  // Events on the currently selected date
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter(ev => ev.startDate && isSameDay(ev.startDate, selectedDate));
  }, [filteredEvents, selectedDate]);

  // Mini calendar calculation
  const miniCalDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Working timeline hours for Day view
  const timeSlots = [
    { label: '08:00 AM', hour: 8 },
    { label: '09:00 AM', hour: 9 },
    { label: '10:00 AM', hour: 10 },
    { label: '11:00 AM', hour: 11 },
    { label: '12:00 PM', hour: 12 },
    { label: '01:00 PM', hour: 13 },
    { label: '02:00 PM', hour: 14 },
    { label: '03:00 PM', hour: 15 },
    { label: '04:00 PM', hour: 16 },
    { label: '05:00 PM', hour: 17 },
    { label: '06:00 PM', hour: 18 },
  ];

  // Week days calculation
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setSelectedDate(prev => subDays(prev, 1));
    else if (viewMode === 'week') setSelectedDate(prev => subWeeks(prev, 1));
    else if (viewMode === 'month') setSelectedDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setSelectedDate(prev => addDays(prev, 1));
    else if (viewMode === 'week') setSelectedDate(prev => addWeeks(prev, 1));
    else if (viewMode === 'month') setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(startOfMonth(now));
  };

  return (
    <div className="w-full bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100/90 font-sans">
      
      {/* ─── Main Grid Layout (Left Mini Calendar + Right Main Schedule) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT SIDEBAR (4 of 12 columns on large screens) ── */}
        <div className="lg:col-span-4 xl:col-span-3.5 space-y-4">
          
          {/* Mini Month Picker Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <button 
                type="button"
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button 
                type="button"
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Names Row */}
            <div className="grid grid-cols-7 text-center mb-1.5">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <span key={day} className="text-[10px] font-bold text-slate-400">
                  {day}
                </span>
              ))}
            </div>

            {/* Real Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {miniCalDays.map((day) => {
                const inCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);
                const isCurDay = isToday(day);
                const hasApt = allEvents.some(e => e.startDate && isSameDay(e.startDate, day));

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`h-8 rounded-xl font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : isCurDay
                          ? 'border border-blue-500 text-blue-600 font-bold bg-blue-50/50 hover:bg-blue-100/50'
                          : inCurrentMonth
                            ? 'text-slate-700 hover:bg-white hover:shadow-2xs'
                            : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    <span className="text-xs leading-none">{format(day, 'd')}</span>
                    {hasApt && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendars Checklist Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">Calendars & Tags</h4>
              <span className="text-[10px] font-semibold text-slate-400">Active Filters</span>
            </div>
            
            <div className="space-y-2.5 text-xs">
              {/* My Appointments */}
              <label 
                onClick={() => toggleFilter('myAppointments')} 
                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/80 transition"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                      filters.myAppointments ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {filters.myAppointments && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span>My Appointments</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {allEvents.filter(e => e.category === 'myAppointments' || e.category === 'consultations').length}
                </span>
              </label>

              {/* Follow Ups */}
              <label 
                onClick={() => toggleFilter('followUps')} 
                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/80 transition"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                      filters.followUps ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {filters.followUps && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Follow Ups</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {allEvents.filter(e => e.category === 'followUps').length}
                </span>
              </label>

              {/* Surgeries */}
              <label 
                onClick={() => toggleFilter('surgeries')} 
                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/80 transition"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                      filters.surgeries ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {filters.surgeries && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>Surgeries</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {allEvents.filter(e => e.category === 'surgeries').length}
                </span>
              </label>

              {/* Consultations */}
              <label 
                onClick={() => toggleFilter('consultations')} 
                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/80 transition"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                      filters.consultations ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {filters.consultations && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Consultations</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {allEvents.filter(e => e.typeBadge === 'In-person' || e.typeBadge === 'Teleconsultation').length}
                </span>
              </label>

              {/* Personal */}
              <label 
                onClick={() => toggleFilter('personal')} 
                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/80 transition"
              >
                <div className="flex items-center gap-2.5 font-medium text-slate-600">
                  <div 
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                      filters.personal ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {filters.personal && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span>Personal / Blocked</span>
                </div>
              </label>
            </div>

            <button 
              type="button"
              onClick={() => {
                if (onClose) onClose();
                navigate('/doctor/schedule-settings');
              }} 
              className="w-full mt-2 py-2.5 bg-white border border-slate-200 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Manage Doctor Schedule
            </button>
          </div>

          {/* Quick Doctor Daily Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Today's Total</p>
              <p className="text-xl font-extrabold text-blue-950 mt-0.5">
                {allEvents.filter(e => e.startDate && isToday(e.startDate)).length} Appointments
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* ── RIGHT SCHEDULE VIEW (8 of 12 columns on large screens) ── */}
        <div className="lg:col-span-8 xl:col-span-8.5 space-y-4">
          
          {/* Top View Controls & Date Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button 
                type="button"
                onClick={handleToday}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-3.5 py-2 rounded-xl border border-blue-200/80 transition cursor-pointer"
              >
                Today
              </button>

              <button 
                type="button"
                onClick={handleNext}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 ml-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  {viewMode === 'month' 
                    ? format(selectedDate, 'MMMM yyyy')
                    : format(selectedDate, 'EEEE, d MMMM yyyy')}
                </h3>
                {isToday(selectedDate) && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Today
                  </span>
                )}
              </div>
            </div>

            {/* Right Controls: View Switcher + Actions */}
            <div className="flex items-center gap-2 justify-end">
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl">
                {['Day', 'Week', 'Month'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode.toLowerCase())}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === mode.toLowerCase() 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => refetch()}
                className={`p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer ${isFetching ? 'animate-spin text-blue-600' : ''}`}
                title="Refresh calendar appointments"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button 
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  navigate('/doctor/schedule-settings');
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Block Time
              </button>
            </div>
          </div>

          {/* ── VIEW MODE 1: DAY TIMELINE VIEW ───────────────────────────────── */}
          {viewMode === 'day' && (
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-2">
              {timeSlots.map((slot) => {
                const slotEvents = selectedDateEvents.filter(e => e.timeSlotHour === slot.hour);

                return (
                  <div key={slot.label} className="flex items-start gap-3 sm:gap-4 min-h-[56px] group">
                    {/* Slot Time Label */}
                    <div className="w-16 sm:w-20 text-xs font-bold text-slate-400 pt-2 text-right shrink-0">
                      {slot.label}
                    </div>

                    {/* Slot Content Area */}
                    <div className="flex-1 border-t border-slate-100 pt-1">
                      {slotEvents.length > 0 ? (
                        <div className="space-y-2">
                          {slotEvents.map((event) => (
                            <div 
                              key={event.id}
                              onClick={() => {
                                if (onClose) onClose();
                                navigate(`/doctor/consultation/${event.id}`);
                              }} 
                              className={`${event.borderClr} rounded-xl p-3.5 shadow-xs hover:shadow-md cursor-pointer transition border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                    {event.patientName}
                                  </span>
                                  {event.tokenNumber && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-md">
                                      Token #{event.tokenNumber}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.badgeClr}`}>
                                    {event.typeBadge}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{event.timeRangeStr}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-xs">{event.reason}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                  {event.status}
                                </span>
                                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                                  Start Consultation
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-9 rounded-lg border border-transparent group-hover:border-slate-200/60 group-hover:bg-slate-50/50 transition flex items-center px-3 text-[11px] text-slate-300 group-hover:text-slate-400">
                          <span>Open slot</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VIEW MODE 2: WEEK VIEW ────────────────────────────────────────── */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-2 max-h-[560px] overflow-y-auto">
              {weekDays.map((wDay) => {
                const isSelected = isSameDay(wDay, selectedDate);
                const isCur = isToday(wDay);
                const dayEvs = filteredEvents.filter(e => e.startDate && isSameDay(e.startDate, wDay));

                return (
                  <div 
                    key={wDay.toISOString()} 
                    onClick={() => setSelectedDate(wDay)}
                    className={`rounded-2xl border p-2.5 flex flex-col transition cursor-pointer min-h-[400px] ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/20 shadow-xs' 
                        : 'border-slate-200/80 bg-slate-50/40 hover:bg-white'
                    }`}
                  >
                    {/* Column Day Header */}
                    <div className={`text-center pb-2 border-b border-slate-100 ${isCur ? 'text-blue-600' : 'text-slate-700'}`}>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {format(wDay, 'EEE')}
                      </div>
                      <div className={`text-sm font-extrabold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        isCur ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800'
                      }`}>
                        {format(wDay, 'd')}
                      </div>
                    </div>

                    {/* Day Events Stack */}
                    <div className="space-y-1.5 pt-2 flex-1 overflow-y-auto">
                      {dayEvs.length > 0 ? (
                        dayEvs.map((ev) => (
                          <div 
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onClose) onClose();
                              navigate(`/doctor/consultation/${ev.id}`);
                            }}
                            className={`p-2 rounded-xl text-left border ${ev.borderClr} shadow-2xs hover:shadow-xs transition`}
                          >
                            <p className="text-[11px] font-bold truncate text-slate-900">{ev.patientName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{ev.startTimeFormatted}</p>
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-white/80 border border-slate-200/70 mt-1">
                              {ev.typeBadge}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-300 font-medium">
                          No slots
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VIEW MODE 3: MONTH VIEW ───────────────────────────────────────── */}
          {viewMode === 'month' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-400 pb-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 max-h-[540px] overflow-y-auto">
                {eachDayOfInterval({
                  start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 }),
                  end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 })
                }).map((day) => {
                  const inMonth = isSameMonth(day, selectedDate);
                  const isCur = isToday(day);
                  const isSel = isSameDay(day, selectedDate);
                  const dayEvs = filteredEvents.filter(e => e.startDate && isSameDay(e.startDate, day));

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode('day');
                      }}
                      className={`min-h-[72px] sm:min-h-[85px] p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                          : inMonth
                            ? 'border-slate-200/80 bg-white hover:bg-slate-50'
                            : 'border-slate-100 bg-slate-50/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          isCur ? 'bg-blue-600 text-white' : inMonth ? 'text-slate-800' : 'text-slate-300'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayEvs.length > 0 && (
                          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded-full">
                            {dayEvs.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 mt-1 overflow-hidden">
                        {dayEvs.slice(0, 2).map((ev) => (
                          <div key={ev.id} className="text-[9px] font-semibold truncate bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                            {ev.startTimeFormatted} {ev.patientName}
                          </div>
                        ))}
                        {dayEvs.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-bold px-1">
                            +{dayEvs.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default DoctorCalendar;
