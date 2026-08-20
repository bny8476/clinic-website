import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, FileText, Pill, Users,
  Shield, Scan, Upload, Laptop, ChevronLeft, ChevronRight, Check, Stethoscope, Loader2
} from 'lucide-react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerChildren, listStagger, fadeUp } from '../../components/ui/motion';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const PatientDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const queryClient = useQueryClient();

  const [medicationTaken, setMedicationTaken] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentPanel = searchParams.get('panel');
  const closePanel = () => setSearchParams(new URLSearchParams());

  const tabs = ['Dashboard', 'Appointments', 'Prescriptions', 'Lab Reports'];

  const topActions = [
    { icon: CalendarIcon, label: 'Book\nAppointment', action: () => navigate('/patient/book') },
    { icon: Pill, label: 'Order\nMedicine', action: () => navigate('/patient/order-medicine') },
    { icon: Users, label: 'Family\nMembers', action: () => navigate('/patient/dependents') },
    { icon: Upload, label: 'Upload\nVitals', action: () => navigate('/patient/timeline') },
    { icon: Laptop, label: 'Tele\nConsult', action: () => navigate('/patient/teleconsultations') },
    { icon: FileText, label: 'Medical\nRecords', action: () => navigate('/patient/records') },
    { icon: Scan, label: 'Radiology', action: () => navigate('/patient/radiology') },
    { icon: Shield, label: 'Insurance', action: () => navigate('/patient/insurance') },
  ];

  /* ── API Queries ─────────────────────────────────────────────────── */
  const { data: profile } = useQuery({
    queryKey: ['patientProfile', user?.id],
    queryFn: async () => (await axiosPrivate.get(`/patients/profile/${user.id}`)).data,
    enabled: !!user?.id,
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['patientAppointments', user?.id],
    queryFn: async () => (await axiosPrivate.get(`/appointments/patient/${user.id}`)).data,
    enabled: !!user?.id,
  });

  const { data: prescriptions = [], isLoading: loadingRx } = useQuery({
    queryKey: ['patientPrescriptions', user?.id],
    queryFn: async () => (await axiosPrivate.get(`/prescriptions/patient/${user.id}`)).data,
    enabled: !!user?.id,
  });

  const { data: labReports = [] } = useQuery({
    queryKey: ['patientLabReports'],
    queryFn: async () => (await axiosPrivate.get('/lab/patient/lab-reports')).data,
    enabled: !!user?.id,
  });

  /* ── Derived data ─────────────────────────────────────────────────── */
  const upcomingConsultations = useMemo(() => {
    if (!appointments.length) return [];
    return appointments.slice(0, 3).map((apt) => ({
      id:     apt.id,
      doctor: apt.doctorFirstName ? `Dr. ${apt.doctorFirstName} ${apt.doctorLastName || ''}` : '—',
      time:   apt.startTime
        ? new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—',
      status: apt.status || 'Confirmed'
    }));
  }, [appointments]);

  const nextAppt = useMemo(() => {
    const future = appointments.filter(a => a.startTime && new Date(a.startTime) > new Date());
    if (!future.length) return null;
    const a = future[0];
    return a;
  }, [appointments]);

  const latestRxItem = useMemo(() => {
    const signed = prescriptions.find(rx => ['Signed', 'SIGNED'].includes(rx.status));
    if (!signed?.items?.length) return null;
    return { ...signed.items[0], rxDate: signed.createdAt };
  }, [prescriptions]);

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const todayDate = now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <motion.div 
      className="h-full flex flex-col font-sans overflow-y-auto bg-[var(--color-bg-app)]"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      
      {/* Top Action Cards */}
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="flex gap-4 p-6 shrink-0 bg-[var(--color-bg-app)] overflow-x-auto"
      >
        {topActions.map((action, idx) => (
          <motion.button 
            key={idx} 
            variants={listStagger}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action} 
            className="min-w-[120px] flex-1 flex flex-col items-center justify-center gap-3 bg-white border border-[var(--color-border)] rounded-xl py-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center text-[var(--color-navy-600)]">
              <action.icon size={24} strokeWidth={2} />
            </div>
            <span className="font-bold text-[13px] text-[var(--color-text)] text-center leading-tight">
              {action.label.split('\n').map((word, i) => (
                <React.Fragment key={i}>{word}<br/></React.Fragment>
              ))}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="px-6 flex gap-3 shrink-0 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg font-bold text-[14px] transition-colors border ${
                isActive 
                  ? 'bg-[var(--color-navy-800)] text-white border-[var(--color-navy-800)] shadow-sm shadow-blue-200' 
                  : 'bg-white text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="px-6 pb-6 space-y-6">
        
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex flex-col items-center flex-1 h-[250px] shadow-card">
              <div className="w-full flex justify-between items-center mb-6">
                <h3 className="font-bold text-[15px] text-[var(--color-text)]">My Appointments</h3>
                <span onClick={() => navigate('/patient/appointments')} className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer hover:underline">VIEW ALL</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
                {loadingAppts ? <Loader2 className="animate-spin text-[var(--color-navy-600)]" /> : appointments.length === 0 ? (
                  <>
                    <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                      <CalendarIcon className="text-[var(--color-navy-600)]" size={24} />
                    </div>
                    <p className="text-[14px] text-[var(--color-text-muted)]">No appointments scheduled</p>
                    <button onClick={() => navigate('/patient/book')} className="mt-2 w-full max-w-[200px] py-2.5 rounded-full border border-[var(--color-navy-600)]/20 text-[var(--color-navy-800)] font-bold text-[14px] hover:bg-[var(--color-info-bg)] transition-colors">
                      Book Now
                    </button>
                  </>
                ) : (
                  <div className="w-full space-y-2 flex-1 overflow-auto">
                    {upcomingConsultations.map(apt => (
                      <div key={apt.id} className="flex justify-between items-center p-2 rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                        <span className="text-[12px] font-bold text-[var(--color-text)]">{apt.doctor}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] bg-white px-2 rounded border border-[var(--color-border)]">{apt.time}</span>
                      </div>
                    ))}
                    <button onClick={() => navigate('/patient/appointments')} className="mt-4 w-full py-2 rounded-full border border-[var(--color-navy-600)]/20 text-[var(--color-navy-800)] font-bold text-[12px] hover:bg-[var(--color-info-bg)]">View All</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex flex-col items-center flex-1 h-[250px] shadow-card">
              <div className="w-full flex justify-between items-center mb-6">
                <h3 className="font-bold text-[15px] text-[var(--color-text)]">Next Appointment</h3>
                <span onClick={() => navigate('/patient/appointments')} className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer hover:underline">DETAILS</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
                {loadingAppts ? <Loader2 className="animate-spin text-[var(--color-navy-600)]" /> : !nextAppt ? (
                  <>
                    <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                      <Stethoscope className="text-[var(--color-navy-600)]" size={24} />
                    </div>
                    <p className="text-[14px] text-[var(--color-text-muted)]">No upcoming appointments</p>
                  </>
                ) : (
                  <div className="w-full text-center">
                    <p className="text-[18px] font-black text-[var(--color-text)]">{formatTime(nextAppt.startTime)}</p>
                    <p className="text-[14px] font-bold text-[var(--color-navy-800)] mt-1">Dr. {nextAppt.doctorFirstName} {nextAppt.doctorLastName}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)] mt-2">{nextAppt.reasonForVisit || 'Consultation'}</p>
                    <button className="mt-4 w-full py-2.5 bg-[var(--color-navy-800)] text-white rounded-full font-bold text-[13px] hover:bg-blue-700 transition flex justify-center items-center gap-2">
                      <CalendarIcon size={16} /> Reschedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Column - Health Journey */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-[var(--color-border)] p-5 flex flex-col shadow-card">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button className="p-1 text-[var(--color-text-muted)] hover:text-slate-600"><ChevronLeft size={20} /></button>
                <h2 className="font-bold text-[16px] text-[var(--color-text)]">Health Journey</h2>
                <button className="p-1 text-[var(--color-text-muted)] hover:text-slate-600"><ChevronRight size={20} /></button>
                <span className="px-3 py-1 bg-[var(--color-info-bg)] text-[var(--color-navy-800)] text-[12px] font-bold rounded-full ml-2">Today</span>
              </div>
              <div className="flex items-center border border-[var(--color-border)] rounded-full p-1 bg-white">
                <button className="px-4 py-1 text-[13px] font-bold text-[var(--color-navy-800)] rounded-full">Day</button>
                <button className="px-4 py-1 text-[13px] font-bold text-[var(--color-text-muted)] rounded-full hover:bg-[var(--color-surface-alt)]">Week</button>
                <button className="px-4 py-1 text-[13px] font-bold text-[var(--color-text-muted)] rounded-full hover:bg-[var(--color-surface-alt)]">Month</button>
              </div>
            </div>

            <motion.div 
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="flex-1 relative border-l border-[var(--color-border)] ml-12 pb-6 min-h-[400px]"
            >
              {['08:00 AM','10:30 AM','01:00 PM','03:30 PM'].map((time, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-center h-[80px] relative group">
                  <span className="absolute -left-16 text-[11px] text-[var(--color-text-muted)] w-12 text-right top-2">{time}</span>
                  <div className="absolute left-6 right-4 top-2 bg-[var(--color-info-bg)] border-l-4 border-[var(--color-navy-500)] rounded p-3 shadow-sm z-10 transition-colors group-hover:bg-[var(--color-surface-hover)]">
                    <p className="text-[13px] font-bold text-[var(--color-navy-900)] leading-tight">
                      {i === 0 ? 'Blood Pressure Stabilized' : i === 1 ? 'Annual Cardiac Screening' : i === 2 ? 'Physical Therapy Session' : 'Mental Wellness Check'}
                    </p>
                    <p className="text-[11px] text-[var(--color-navy-700)] mt-1">
                      {i === 0 ? 'Average: 120/80 mmHg' : i === 1 ? 'Dr. Michael Lee • Cardiology Unit 4' : i === 2 ? 'Lower Back Recovery • Day 12' : 'Guided Meditation • Focus: Stress Relief'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex flex-col items-center flex-1 h-[250px] shadow-card">
              <div className="w-full flex justify-between items-center mb-6">
                <h3 className="font-bold text-[15px] text-[var(--color-text)]">My Medications</h3>
                <span onClick={() => navigate('/patient/prescriptions')} className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer hover:underline">VIEW ALL</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
                {latestRxItem ? (
                  <div className="w-full text-center">
                    <p className="text-[14px] font-bold text-[var(--color-navy-800)] mb-1">{latestRxItem.medicationName}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)] mb-4">{latestRxItem.dosage} • {latestRxItem.frequency}</p>
                    <button
                      onClick={() => setMedicationTaken(!medicationTaken)}
                      className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 bg-[var(--color-navy-800)] text-white"
                    >
                      <Check className="w-4 h-4"/>
                      {medicationTaken ? 'Dose Taken ✓' : 'Mark as Taken'}
                    </button>
                  </div>
                ) : (
                   <div className="w-full text-center">
                    <p className="text-[14px] font-bold text-[var(--color-navy-800)] mb-1">Lipitor (Atorvastatin)</p>
                    <p className="text-[12px] text-[var(--color-text-muted)] mb-4">10mg Tablet • After Breakfast</p>
                    <button
                      onClick={() => setMedicationTaken(!medicationTaken)}
                      className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 bg-[var(--color-navy-800)] text-white"
                    >
                      <Check className="w-4 h-4"/>
                      {medicationTaken ? 'Dose Taken ✓' : 'Mark as Taken'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex flex-col items-center flex-1 h-[250px] shadow-card">
              <div className="w-full flex justify-between items-center mb-6">
                <h3 className="font-bold text-[15px] text-[var(--color-text)]">Lab Reports</h3>
                <span onClick={() => navigate('/patient/lab-reports')} className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer hover:underline">VIEW ALL</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
                <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                  <FlaskConical className="text-[var(--color-navy-600)]" size={24} />
                </div>
                <p className="text-[14px] text-[var(--color-text-muted)]">No new lab reports</p>
                <button onClick={() => navigate('/patient/lab-reports')} className="mt-2 w-full max-w-[200px] py-2.5 rounded-full border border-[var(--color-navy-600)]/20 text-[var(--color-navy-800)] font-bold text-[14px] hover:bg-[var(--color-info-bg)] transition-colors">
                  View History
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Action Tasks */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-card">
          <h3 className="font-bold text-[15px] text-[var(--color-text)] mb-4">Daily Health Tasks</h3>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {[
              { label: 'Log morning vitals', time: '08:00 AM' },
              { label: 'Take Lipitor (10mg)', time: '10:30 AM' },
              { label: 'Drink 2L Water', time: 'Ongoing' },
              { label: 'Evening walk (30 mins)', time: '06:00 PM' },
            ].map((task, i) => (
              <div key={i} className="flex-1 min-w-[200px] flex items-center justify-between border-r border-[var(--color-border)] last:border-0 pr-4">
                <div className="flex items-center gap-3">
                  <Circle className="text-[var(--color-navy-800)]" size={16} />
                  <span className="text-[13px] font-medium text-slate-700">{task.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[var(--color-text-muted)]">{task.time}</span>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant */}
        <button
          onClick={() => navigate('/patient/assistant')}
          className="w-full flex items-center gap-4 p-5 rounded-xl text-white transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, #165DFF 0%, #1D4ED8 100%)`,
            boxShadow: `0 6px 24px rgba(22, 93, 255, 0.25)`,
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-white"/>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-bold text-white leading-tight mb-1">AI Assistant</p>
            <p className="text-[13px] text-white/80">Get instant answers to your health questions, analyze symptoms, and manage your wellness journey.</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70"/>
        </button>

      </div>
    </motion.div>
  );
};

export default PatientDashboard;
