import React, { useEffect, useState, useMemo } from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  CalendarOff, 
  Clock, 
  Plus, 
  Save, 
  Settings, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Calendar, 
  ArrowRight, 
  Sun, 
  Moon, 
  CalendarDays,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

export default function DoctorScheduleSettings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('weekly');
  
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 20,
      isActive: idx !== 0 && idx !== 6 // default off on weekends (Sunday & Saturday)
    }))
  );

  // Overrides form state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overridesList, setOverridesList] = useState([]);
  const [overrideForm, setOverrideForm] = useState({
    overrideDate: '',
    isUnavailable: true,
    startTime: '09:00',
    endTime: '13:00',
    reason: ''
  });

  // Today string for min date
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch Working Hours
  const { data: dbWorkingHours, isLoading } = useQuery({
    queryKey: ['doctorWorkingHours', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/doctors/${user?.id}/working-hours`);
      return res.data;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (dbWorkingHours && dbWorkingHours.length > 0) {
      const updated = [...workingHours];
      dbWorkingHours.forEach(wh => {
        if (wh.dayOfWeek >= 0 && wh.dayOfWeek < 7) {
          updated[wh.dayOfWeek] = {
            ...updated[wh.dayOfWeek],
            startTime: wh.startTime ? wh.startTime.substring(0, 5) : '09:00',
            endTime: wh.endTime ? wh.endTime.substring(0, 5) : '17:00',
            slotDurationMinutes: wh.slotDurationMinutes || 20,
            isActive: Boolean(wh.isActive)
          };
        }
      });
      setWorkingHours(updated);
    }
  }, [dbWorkingHours]);

  // Mutations
  const saveHoursMutation = useMutation({
    mutationFn: async (data) => {
      await axiosPrivate.put(`/doctors/${user?.id}/working-hours`, data);
      const generateRes = await axiosPrivate.post(`/doctors/${user?.id}/generate-slots`);
      return generateRes.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['doctorWorkingHours']);
      toast.success(`Schedule saved! Generated ${data.slotsGenerated || 'all'} slots for the next 14 days.`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save working hours');
    }
  });

  const addOverrideMutation = useMutation({
    mutationFn: async (data) => {
      await axiosPrivate.post(`/doctors/${user?.id}/schedule-overrides`, data);
      const generateRes = await axiosPrivate.post(`/doctors/${user?.id}/generate-slots`);
      return { ...generateRes.data, data };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['doctorWorkingHours']);
      setOverridesList(prev => [...prev.filter(o => o.overrideDate !== res.data.overrideDate), res.data]);
      setShowOverrideForm(false);
      setOverrideForm({
        overrideDate: '',
        isUnavailable: true,
        startTime: '09:00',
        endTime: '13:00',
        reason: ''
      });
      toast.success('Date override saved and slots regenerated.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save date override');
    }
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: async (date) => {
      await axiosPrivate.delete(`/doctors/${user?.id}/schedule-overrides/${date}`);
      await axiosPrivate.post(`/doctors/${user?.id}/generate-slots`);
      return date;
    },
    onSuccess: (deletedDate) => {
      queryClient.invalidateQueries(['doctorWorkingHours']);
      setOverridesList(prev => prev.filter(o => o.overrideDate !== deletedDate));
      toast.success(`Override for ${deletedDate} deleted successfully.`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete date override');
    }
  });

  const handleWorkingHourChange = (idx, field, value) => {
    const updated = [...workingHours];
    updated[idx] = { ...updated[idx], [field]: value };
    setWorkingHours(updated);
  };

  const handleSaveHours = () => {
    const dataToSave = workingHours.map(wh => ({
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime + ":00",
      endTime: wh.endTime + ":00",
      slotDurationMinutes: parseInt(wh.slotDurationMinutes, 10),
      isActive: wh.isActive
    }));
    saveHoursMutation.mutate(dataToSave);
  };

  const handleAddOverride = (e) => {
    e.preventDefault();
    if (!overrideForm.overrideDate) {
      toast.error('Please choose a valid date');
      return;
    }
    const data = {
      ...overrideForm,
      startTime: overrideForm.isUnavailable ? null : overrideForm.startTime + ":00",
      endTime: overrideForm.isUnavailable ? null : overrideForm.endTime + ":00"
    };
    addOverrideMutation.mutate(data);
  };

  // Helper to calculate slots per day
  const calculateDaySlots = (wh) => {
    if (!wh.isActive || !wh.startTime || !wh.endTime) return 0;
    const [sh, sm] = wh.startTime.split(':').map(Number);
    const [eh, em] = wh.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    if (diff <= 0) return 0;
    return Math.floor(diff / (parseInt(wh.slotDurationMinutes, 10) || 20));
  };

  // KPI metrics
  const activeDaysCount = useMemo(() => workingHours.filter(wh => wh.isActive).length, [workingHours]);
  const totalWeeklySlots = useMemo(() => {
    return workingHours.reduce((acc, wh) => acc + calculateDaySlots(wh), 0);
  }, [workingHours]);
  const averageSlotsPerDay = useMemo(() => {
    return activeDaysCount > 0 ? Math.round(totalWeeklySlots / activeDaysCount) : 0;
  }, [totalWeeklySlots, activeDaysCount]);

  // Preset Handlers
  const applyPreset = (presetType) => {
    let updated = [...workingHours];
    if (presetType === 'mon-fri-standard') {
      updated = updated.map((wh, idx) => ({
        ...wh,
        isActive: idx >= 1 && idx <= 5, // Mon-Fri
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 20
      }));
      toast.success('Applied Standard 9:00 AM - 5:00 PM (Mon-Fri)');
    } else if (presetType === 'morning-clinics') {
      updated = updated.map((wh, idx) => ({
        ...wh,
        isActive: idx >= 1 && idx <= 6, // Mon-Sat
        startTime: '08:00',
        endTime: '14:00',
        slotDurationMinutes: 15
      }));
      toast.success('Applied Morning Shifts 8:00 AM - 2:00 PM (Mon-Sat)');
    } else if (presetType === 'evening-clinics') {
      updated = updated.map((wh, idx) => ({
        ...wh,
        isActive: idx >= 1 && idx <= 5,
        startTime: '16:00',
        endTime: '21:00',
        slotDurationMinutes: 15
      }));
      toast.success('Applied Evening Clinics 4:00 PM - 9:00 PM (Mon-Fri)');
    } else if (presetType === 'all-week') {
      updated = updated.map((wh) => ({
        ...wh,
        isActive: true,
        startTime: '09:00',
        endTime: '18:00',
        slotDurationMinutes: 30
      }));
      toast.success('Applied 7-Day Clinic Coverage (9:00 AM - 6:00 PM)');
    }
    setWorkingHours(updated);
  };

  // Copy Monday's hours to all weekdays
  const copyMondayToWeekdays = () => {
    const monday = workingHours[1];
    const updated = workingHours.map((wh, idx) => {
      if (idx >= 1 && idx <= 5) {
        return {
          ...wh,
          isActive: true,
          startTime: monday.startTime,
          endTime: monday.endTime,
          slotDurationMinutes: monday.slotDurationMinutes
        };
      }
      return wh;
    });
    setWorkingHours(updated);
    toast.success("Copied Monday's hours to Tuesday through Friday!");
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1720px] mx-auto p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold text-base">Loading schedule settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Expansive Top Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Schedule Settings</h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-blue-600" />
                Live Slot Engine Active
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
              Configure your weekly consultation availability, appointment slot duration, and date overrides.
            </p>
          </div>
        </div>

        {/* Global Save Action Button */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSaveHours} 
            isLoading={saveHoursMutation.isPending}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Save className="w-4 h-4" />
            Save & Regenerate Slots
          </Button>
        </div>
      </div>

      {/* 4-Card Responsive KPI Metric Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Working Days</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeDaysCount} / 7 <span className="text-sm font-semibold text-slate-500">Days</span></h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {activeDaysCount >= 5 ? 'Standard Workweek' : 'Custom Schedule'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Duration</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{workingHours[1]?.slotDurationMinutes || 20} <span className="text-sm font-semibold text-slate-500">min / slot</span></h3>
            <p className="text-xs text-blue-600 font-semibold mt-1">
              Customizable per day
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Daily Capacity</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">~{averageSlotsPerDay} <span className="text-sm font-semibold text-slate-500">slots</span></h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Based on active hours
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sun className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Weekly Capacity</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">~{totalWeeklySlots} <span className="text-sm font-semibold text-slate-500">slots / wk</span></h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Rolling 14-day slot coverage
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm inline-flex w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer border-none ${
            activeTab === 'weekly'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 bg-transparent'
          }`}
        >
          <Clock className="w-4 h-4" /> 
          Weekly Consultation Schedule
        </button>
        <button
          onClick={() => setActiveTab('overrides')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer border-none ${
            activeTab === 'overrides'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 bg-transparent'
          }`}
        >
          <CalendarOff className="w-4 h-4" /> 
          Date Overrides & Leaves
          {overridesList.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'overrides' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              {overridesList.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Weekly Schedule (Wide Responsive 2-Column Grid on Desktop) */}
      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          
          {/* Main 7-Day Configuration Panel (Col 8/12 on large screens) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
              
              {/* Card Header with Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Standard Weekly Hours</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Toggle days on/off and configure shift timings & slot durations.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={copyMondayToWeekdays}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200/60"
                    title="Copies Monday's start time, end time, and slot duration to Tue - Fri"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Mon to All Weekdays
                  </button>
                </div>
              </div>

              {/* Day-by-day rows */}
              <div className="divide-y divide-slate-100 pt-2">
                {workingHours.map((wh, idx) => {
                  const daySlots = calculateDaySlots(wh);
                  return (
                    <div 
                      key={idx} 
                      className={`py-4 sm:py-5 px-3 sm:px-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 my-2 ${
                        wh.isActive 
                          ? 'bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-blue-300 hover:shadow-sm' 
                          : 'bg-slate-50/30 border border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Left: Checkbox & Day Name */}
                      <div className="flex items-center gap-4 min-w-[180px]">
                        <input 
                          type="checkbox" 
                          id={`day-checkbox-${idx}`}
                          checked={wh.isActive} 
                          onChange={(e) => handleWorkingHourChange(idx, 'isActive', e.target.checked)}
                          className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor={`day-checkbox-${idx}`} className="cursor-pointer select-none">
                          <span className="font-extrabold text-base text-slate-900 block">{DAYS[idx]}</span>
                          {wh.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Consulting
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">Day Off / Unavailable</span>
                          )}
                        </label>
                      </div>

                      {/* Middle: Controls (From, To, Duration) */}
                      <div className="flex-1 flex flex-wrap items-center gap-3 sm:gap-4">
                        {/* Start Time */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">From</span>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={wh.startTime} 
                              onChange={(e) => handleWorkingHourChange(idx, 'startTime', e.target.value)}
                              disabled={!wh.isActive}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                            />
                          </div>
                        </div>

                        {/* End Time */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">To</span>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={wh.endTime} 
                              onChange={(e) => handleWorkingHourChange(idx, 'endTime', e.target.value)}
                              disabled={!wh.isActive}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Slot Duration */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Duration</span>
                          <select 
                            value={wh.slotDurationMinutes}
                            onChange={(e) => handleWorkingHourChange(idx, 'slotDurationMinutes', e.target.value)}
                            disabled={!wh.isActive}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm cursor-pointer"
                          >
                            {SLOT_DURATIONS.map(d => (
                              <option key={d} value={d}>{d} min</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Right: Calculated Day Capacity Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {wh.isActive ? (
                          <div className="px-3 py-1.5 bg-blue-50/80 border border-blue-200/60 rounded-xl text-right">
                            <span className="text-xs font-extrabold text-blue-700 block">
                              ~{daySlots} slots
                            </span>
                            <span className="text-[10px] text-blue-500 font-medium">available / day</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200/50 rounded-xl text-right">
                            <span className="text-xs font-bold text-slate-400 block">0 slots</span>
                            <span className="text-[10px] text-slate-400 font-medium">closed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  Saving working hours will automatically regenerate live appointment slots for the next 14 days.
                </p>
                <Button 
                  onClick={handleSaveHours} 
                  isLoading={saveHoursMutation.isPending}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Regenerate Slots
                </Button>
              </div>

            </div>
          </div>

          {/* Side Helper & Quick Actions Column (Col 4/12 on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Shift Presets Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 m-0">Shift Quick Presets</h3>
              </div>
              <p className="text-xs text-slate-500">
                Click any preset to automatically populate your weekly schedule:
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => applyPreset('mon-fri-standard')}
                  className="w-full p-3.5 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-700">Mon - Fri Standard</h4>
                    <p className="text-xs text-slate-400 mt-0.5">09:00 AM – 05:00 PM · 20 min slots</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('morning-clinics')}
                  className="w-full p-3.5 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-700">Morning Shift (Mon–Sat)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">08:00 AM – 02:00 PM · 15 min slots</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('evening-clinics')}
                  className="w-full p-3.5 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-700">Evening Clinics</h4>
                    <p className="text-xs text-slate-400 mt-0.5">04:00 PM – 09:00 PM · 15 min slots</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('all-week')}
                  className="w-full p-3.5 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-700">Full Week Coverage (7 Days)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">09:00 AM – 06:00 PM · 30 min slots</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>

            {/* How Slots Work Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl sm:rounded-3xl border border-blue-200/70 p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-extrabold text-sm text-blue-900 m-0">Live Slot Engine Rules</h4>
              </div>
              <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
                <li>Slots are automatically generated across a rolling <strong>14-day</strong> window.</li>
                <li>Patients booking via the portal see open slots reflecting your current active hours.</li>
                <li>Past dates and completed time slots are automatically locked and disabled.</li>
                <li>Changes take effect immediately upon clicking <strong>Save & Regenerate Slots</strong>.</li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Date Overrides & Leaves */}
      {activeTab === 'overrides' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Custom Date Overrides & Leaves</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Set specific dates where your availability differs from your standard weekly hours (e.g., conferences, vacations, or custom hours).
                </p>
              </div>
              <Button 
                onClick={() => setShowOverrideForm(!showOverrideForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" /> 
                {showOverrideForm ? 'Hide Form' : 'Add Date Override'}
              </Button>
            </div>

            {/* Form */}
            {showOverrideForm && (
              <form onSubmit={handleAddOverride} className="mt-6 p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-5">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2">Configure Override</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Override Date *</label>
                    <input 
                      type="date" 
                      required
                      min={todayStr}
                      value={overrideForm.overrideDate}
                      onChange={e => setOverrideForm({...overrideForm, overrideDate: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Availability Status *</label>
                    <select 
                      value={overrideForm.isUnavailable ? 'true' : 'false'}
                      onChange={e => setOverrideForm({...overrideForm, isUnavailable: e.target.value === 'true'})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="true">Unavailable (Full Day Off / Leave)</option>
                      <option value="false">Custom Working Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Notes (Optional)</label>
                    <input 
                      type="text" 
                      value={overrideForm.reason}
                      onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})}
                      placeholder="e.g. Medical Conference, Personal Leave"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {!overrideForm.isUnavailable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custom Start Time *</label>
                      <input 
                        type="time" 
                        required
                        value={overrideForm.startTime}
                        onChange={e => setOverrideForm({...overrideForm, startTime: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custom End Time *</label>
                      <input 
                        type="time" 
                        required
                        value={overrideForm.endTime}
                        onChange={e => setOverrideForm({...overrideForm, endTime: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <Button type="button" variant="secondary" onClick={() => setShowOverrideForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={addOverrideMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Save Override & Update Slots
                  </Button>
                </div>
              </form>
            )}

            {/* Overrides List */}
            <div className="mt-6">
              {overridesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overridesList.map((ov, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-extrabold text-sm text-slate-900">{ov.overrideDate}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-1">
                          {ov.isUnavailable ? (
                            <span className="text-rose-600 font-bold">Full Day Off</span>
                          ) : (
                            <span>Custom: {ov.startTime?.substring(0, 5)} - {ov.endTime?.substring(0, 5)}</span>
                          )}
                        </p>
                        {ov.reason && <p className="text-[11px] text-slate-400 italic mt-0.5">{ov.reason}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteOverrideMutation.mutate(ov.overrideDate)}
                        disabled={deleteOverrideMutation.isPending}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer border-none bg-transparent"
                        title="Remove override"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <CalendarOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700 text-base">No active date overrides</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Your availability follows the standard weekly schedule. Click &ldquo;Add Date Override&rdquo; to block out holidays, leaves, or set custom shift timings for specific dates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
