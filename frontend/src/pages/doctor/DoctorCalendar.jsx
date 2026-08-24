import useAuthStore from '../../store/authStore';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  User, 
  X,
  Check
} from 'lucide-react';

const DoctorCalendar = ({ onClose }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 7, 24)); // Default to Aug 24, 2026
  const [viewMode, setViewMode] = useState('day');

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

  const { data: rawAppointments = [] } = useQuery({
    queryKey: ['doctorAppointments', user?.id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/appointments/doctor/${user?.id}`);
        return Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const appointments = useMemo(() => Array.isArray(rawAppointments) ? rawAppointments : [], [rawAppointments]);

  // Mock appointments matching 1:1 reference screenshot
  const defaultEvents = [
    {
      id: 14,
      patientName: 'Patient #14',
      reason: 'Fever',
      timeRange: '09:00 - 09:20 AM',
      status: 'BOOKED',
      statusColor: 'bg-blue-100 text-blue-700',
      bgColor: 'bg-blue-50/70 border-l-4 border-blue-500',
      timeSlot: '09:00 AM',
    },
    {
      id: 21,
      patientName: 'Patient #21',
      reason: 'Chest Pain',
      timeRange: '10:30 - 11:00 AM',
      status: 'CONFIRMED',
      statusColor: 'bg-emerald-100 text-emerald-700',
      bgColor: 'bg-emerald-50/70 border-l-4 border-emerald-500',
      timeSlot: '11:00 AM',
    },
    {
      id: 32,
      patientName: 'Patient #32',
      reason: 'Follow-up Consultation',
      timeRange: '12:00 - 12:30 PM',
      status: 'PENDING',
      statusColor: 'bg-amber-100 text-amber-700',
      bgColor: 'bg-amber-50/70 border-l-4 border-amber-500',
      timeSlot: '01:00 PM',
    },
    {
      id: 45,
      patientName: 'Patient #45',
      reason: 'ECG Review',
      timeRange: '02:30 - 03:00 PM',
      status: 'BOOKED',
      statusColor: 'bg-purple-100 text-purple-700',
      bgColor: 'bg-purple-50/70 border-l-4 border-purple-500',
      timeSlot: '03:00 PM',
    },
    {
      id: 99,
      patientName: 'Team Meeting',
      reason: '',
      timeRange: '04:00 - 05:00 PM',
      status: 'BLOCKED',
      statusColor: 'bg-slate-200 text-slate-700',
      bgColor: 'bg-slate-100/80 border-l-4 border-slate-400',
      timeSlot: '05:00 PM',
    },
  ];

  const displayEvents = useMemo(() => {
    if (appointments.length > 0) {
      return appointments.map((apt, i) => ({
        id: apt.id || i,
        patientName: apt.patientFirstName ? `Patient #${apt.patientId || i+1}` : (apt.patientName || `Patient #${i+1}`),
        reason: apt.reasonForVisit || 'Consultation',
        timeRange: `${apt.startTime ? new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM'}`,
        status: apt.status || 'BOOKED',
        statusColor: apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700',
        bgColor: 'bg-blue-50/70 border-l-4 border-blue-500',
        timeSlot: apt.startTime ? new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '00' }) : '09:00 AM',
      }));
    }
    return defaultEvents;
  }, [appointments]);

  const timeSlots = [
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
  ];

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl p-6 relative font-sans">
      
      {/* ─── Modal Header ─── */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Calendar</h2>
            <p className="text-xs text-slate-500 font-medium">View and manage your schedule</p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ─── Modal Body Grid (Left Mini Calendar + Right Main Schedule) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        
        {/* ── LEFT SIDEBAR (4/12) ── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Mini Month Picker Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-slate-900 text-sm">August 2026</h3>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Names Row */}
            <div className="grid grid-cols-7 text-center mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <span key={day} className="text-[9px] font-extrabold text-slate-400">
                  {day}
                </span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Row 1 */}
              {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                <span key={`prev-${d}`} className="py-1.5 text-slate-300 font-medium">
                  {d}
                </span>
              ))}
              {/* Row 2 */}
              {[23, 24, 25, 26, 27, 28, 29].map((d) => (
                <button
                  key={`cur-${d}`}
                  onClick={() => setSelectedDate(new Date(2026, 7, d))}
                  className={`py-1.5 rounded-xl font-bold flex items-center justify-center transition ${
                    d === 24 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {d}
                </button>
              ))}
              {/* Row 3 */}
              {[30, 31, 1, 2, 3, 4, 5].map((d, i) => (
                <span key={`next-${d}`} className={`py-1.5 font-medium ${i < 2 ? 'text-slate-700' : 'text-slate-300'}`}>
                  {d}
                </span>
              ))}
              {/* Row 4 */}
              {[6, 7, 8, 9, 10, 11, 12].map((d) => (
                <span key={`row4-${d}`} className="py-1.5 text-slate-700 font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Calendars Checklist Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs tracking-wide">Calendars</h4>
            
            <div className="space-y-2 text-xs">
              {/* My Appointments */}
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                <div 
                  onClick={() => toggleFilter('myAppointments')} 
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                    filters.myAppointments ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {filters.myAppointments && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>My Appointments</span>
              </label>

              {/* Follow Ups */}
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                <div 
                  onClick={() => toggleFilter('followUps')} 
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                    filters.followUps ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {filters.followUps && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Follow Ups</span>
              </label>

              {/* Surgeries */}
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                <div 
                  onClick={() => toggleFilter('surgeries')} 
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                    filters.surgeries ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {filters.surgeries && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Surgeries</span>
              </label>

              {/* Consultations */}
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                <div 
                  onClick={() => toggleFilter('consultations')} 
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                    filters.consultations ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {filters.consultations && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Consultations</span>
              </label>

              {/* Personal */}
              <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-500">
                <div 
                  onClick={() => toggleFilter('personal')} 
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                    filters.personal ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {filters.personal && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Personal</span>
              </label>
            </div>

            <button 
              onClick={() => navigate('/doctor/schedule-settings')} 
              className="w-full mt-2 py-2.5 bg-white border border-slate-200 text-blue-600 font-bold text-xs rounded-2xl hover:bg-blue-50 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Calendar
            </button>
          </div>

        </div>

        {/* ── RIGHT SCHEDULE VIEW (8/12) ── */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Top View Controls */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedDate(new Date(2026, 7, 24))} 
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-4 py-2 rounded-xl border border-blue-100 transition"
            >
              Today
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {['Day', 'Week', 'Month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode.toLowerCase())}
                  className={`px-4 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === mode.toLowerCase() 
                      ? 'bg-white text-blue-600 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button 
              onClick={() => navigate('/doctor/schedule-settings')} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-200 transition"
            >
              <Plus className="w-4 h-4" /> Block Time
            </button>
          </div>

          {/* Date Heading */}
          <h3 className="text-base font-black text-slate-900 pt-2">
            Monday, 24 August 2026
          </h3>

          {/* Time Slots Timeline */}
          <div className="space-y-3 pt-1 max-h-[480px] overflow-y-auto pr-1">
            {timeSlots.map((slot) => {
              const matchedEvent = displayEvents.find(e => e.timeSlot === slot);

              return (
                <div key={slot} className="flex items-start gap-4 min-h-[50px]">
                  {/* Slot Time Label */}
                  <span className="w-16 text-xs font-bold text-slate-400 pt-3 text-right flex-shrink-0">
                    {slot}
                  </span>

                  {/* Slot Content */}
                  <div className="flex-1 border-t border-slate-100 pt-1">
                    {matchedEvent ? (
                      <div 
                        onClick={() => navigate(`/doctor/consultation/${matchedEvent.id}`)} 
                        className={`${matchedEvent.bgColor} rounded-r-2xl p-3.5 shadow-2xs hover:shadow-sm cursor-pointer transition flex items-center justify-between`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {matchedEvent.patientName}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {matchedEvent.reason} {matchedEvent.reason && '•'} {matchedEvent.timeRange}
                          </p>
                        </div>

                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${matchedEvent.statusColor}`}>
                          {matchedEvent.status}
                        </span>
                      </div>
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};

export default DoctorCalendar;
