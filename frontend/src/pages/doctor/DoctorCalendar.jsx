import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { motion } from 'framer-motion';
import { pageTransition, fadeUp, staggerChildren, listStagger } from '../../components/ui/motion';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`); // 8 AM to 9 PM

const DoctorCalendar = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctorAppointments', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/appointments/doctor/${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id
  });

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const prev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  
  const next = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const isToday = (d) => {
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  // Process appointments to map them to the grid
  const getAppointmentForSlot = (dayDate, hourStr) => {
    return appointments.find(appt => {
      if (!appt.startTime) return false;
      const apptDate = new Date(appt.startTime);
      const isSameDate = apptDate.toDateString() === dayDate.toDateString();
      const hour = apptDate.getHours().toString().padStart(2, '0');
      // Just match on the hour for the simple grid
      return isSameDate && hour === hourStr.substring(0, 2);
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'destructive';
      case 'BOOKED': return 'default';
      default: return 'outline';
    }
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Calendar" 
          subtitle="Manage your scheduled appointments and availability"
          icon={<Clock className="w-8 h-8 text-primary" />}
        />
        
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border border-surface-border shadow-sm">
          <button onClick={prev} className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary transition-colors"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-text-primary text-sm min-w-[200px] text-center">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={next} className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary transition-colors"><ChevronRight size={18} /></button>
          <button onClick={() => navigate('/doctor/schedule-settings')} style={{ background: 'var(--color-info)', color: 'var(--color-surface)', border: 'none', padding: '7px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
            <Plus size={14} /> Block Time
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-surface rounded-xl border border-surface-border shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-surface-border bg-surface-hover/50">
          <div className="p-3"></div>
          {weekDays.map((d, i) => (
            <div key={i} className={`p-3 text-center border-l border-surface-border ${isToday(d) ? 'bg-primary/5' : ''}`}>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{DAYS[d.getDay()]}</p>
              <p className={`text-xl font-bold ${isToday(d) ? 'text-primary' : 'text-text-primary'}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="overflow-y-auto max-h-[600px] relative">
          {isLoading && <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center font-medium text-text-secondary">Loading schedule...</div>}
          
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-surface-border/50 min-h-[80px]">
              <div className="p-3 text-xs font-medium text-text-secondary border-r border-surface-border/50">{hour}</div>
              {weekDays.map((d, di) => {
                const appt = getAppointmentForSlot(d, hour);
                return (
                  <div key={di} className={`border-l border-surface-border/50 p-1.5 transition-colors ${isToday(d) ? 'bg-primary/5' : 'hover:bg-surface-hover/30'}`}>
                    {appt && (
                      <div className="bg-surface border border-surface-border shadow-sm rounded-md p-2 h-full flex flex-col gap-1 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                        <p className="font-semibold text-text-primary text-xs truncate">{appt.patientName}</p>
                        <Badge variant={getStatusVariant(appt.status)} className="text-[10px] py-0 px-1.5 w-fit">{appt.status}</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorCalendar;
