import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import { useSearchParams } from 'react-router-dom';
import { 
  User, HeartPulse, Pill, CloudUpload, Clipboard, FlaskConical, ChevronRight,
  UserPlus, CalendarIcon, ChevronLeft, Circle, Phone, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell, DashboardGrid, BottomRow } from '../../components/dashboard/shared/DashboardShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';



const NurseDashboard = () => {
  const { user, token } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get('panel') === 'supplies') {
      setActiveTab('Inventory');
    }
  }, [searchParams]);

  const tabs = ['Dashboard', 'OP Queue', 'IP Wards', 'Inventory'];

  const quickActions = [
    { icon: User, label: 'View Patients', color: 'text-[var(--color-navy-600)]', bg: 'bg-[var(--color-info-bg)]', action: () => {} },
    { icon: HeartPulse, label: 'Record Vitals', color: 'text-[var(--color-navy-600)]', bg: 'bg-[var(--color-info-bg)]', action: () => {} },
    { icon: Pill, label: 'Medication Administration', color: 'text-[var(--color-navy-600)]', bg: 'bg-[var(--color-info-bg)]', action: () => {} },
    { icon: CloudUpload, label: 'Upload Reports', color: 'text-[var(--color-navy-600)]', bg: 'bg-[var(--color-info-bg)]', action: () => {} },
    { icon: Clipboard, label: 'Patient Care', color: 'text-[var(--color-navy-600)]', bg: 'bg-[var(--color-info-bg)]', action: () => {} },
    { icon: FlaskConical, label: 'Lab Collection', color: 'text-[var(--color-navy-600)]', bg: 'bg-[var(--color-info-bg)]', action: () => {} },
  ];

  return (
    
    <DashboardShell 
      tabs={tabs} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      quickActions={quickActions}
    >
      <div className="space-y-6">
        
        {/* 3 Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column */}
          <motion.div className="col-span-12 lg:col-span-3 flex flex-col gap-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="flex flex-col flex-1 h-[250px] transition-all hover:shadow-md hover:-translate-y-1 duration-200">
              <Card.Header className="flex justify-between items-center w-full border-b-0 pb-0">
                <h3 className="font-bold text-[15px] text-[var(--color-text)] m-0">Nurse OP Patients</h3>
                <span className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer">VIEW ALL</span>
              </Card.Header>
              <Card.Body className="flex flex-col items-center justify-center gap-4 pt-0">
                <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                  <UserPlus className="text-[var(--color-navy-600)]" size={24} />
                </div>
                <p className="text-[14px] text-[var(--color-text-muted)] m-0">No patients today</p>
                <Button variant="ghost" className="mt-2 w-full max-w-[200px] border border-[var(--color-border)] text-[var(--color-navy-800)] hover:bg-[var(--color-surface-alt)]">
                  Go to OP Queue
                </Button>
              </Card.Body>
            </Card>

            <Card className="flex flex-col flex-1 h-[250px] transition-all hover:shadow-md hover:-translate-y-1 duration-200">
              <Card.Header className="flex justify-between items-center w-full border-b-0 pb-0">
                <h3 className="font-bold text-[15px] text-[var(--color-text)] m-0">Next Appointment</h3>
                <span className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer">VIEW CALENDAR</span>
              </Card.Header>
              <Card.Body className="flex flex-col items-center justify-center gap-4 pt-0">
                <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                  <CalendarIcon className="text-[var(--color-navy-600)]" size={24} />
                </div>
                <p className="text-[14px] text-[var(--color-text-muted)] m-0">No upcoming appointments</p>
                <Button variant="ghost" className="mt-2 w-full max-w-[200px] border border-[var(--color-border)] text-[var(--color-navy-800)] hover:bg-[var(--color-surface-alt)]">
                  View All Appointments
                </Button>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Center Column */}
          <motion.div className="col-span-12 lg:col-span-6 flex flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
              <Card.Body>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><ChevronLeft size={20} /></button>
                    <h2 className="font-bold text-[16px] text-[var(--color-text)] m-0">18 August 2026</h2>
                    <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><ChevronRight size={20} /></button>
                    <span className="px-3 py-1 bg-[var(--color-info-bg)] text-[var(--color-navy-800)] text-[12px] font-bold rounded-full ml-2">Today</span>
                  </div>
                  <div className="flex items-center border border-[var(--color-border)] rounded-full p-1 bg-[var(--color-surface)]">
                    <button className="px-4 py-1 text-[13px] font-bold text-[var(--color-navy-800)] rounded-full bg-[var(--color-surface-alt)]">Day</button>
                    <button className="px-4 py-1 text-[13px] font-bold text-[var(--color-text-muted)] rounded-full hover:bg-[var(--color-surface-alt)] transition-colors">Week</button>
                    <button className="px-4 py-1 text-[13px] font-bold text-[var(--color-text-muted)] rounded-full hover:bg-[var(--color-surface-alt)] transition-colors">Month</button>
                  </div>
                </div>

                <motion.div 
                  className="flex-1 relative border-l border-[var(--color-border)] ml-12 pb-6 min-h-[400px]"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map((time, i) => (
                    <motion.div key={i} className="flex items-center h-12 relative group" variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
                      <span className="absolute -left-16 text-[11px] text-[var(--color-text-muted)] w-12 text-right">{time}</span>
                      <div className="w-full h-[1px] bg-[var(--color-surface-alt)] group-hover:bg-[var(--color-border)] ml-4 transition-colors"></div>
                    </motion.div>
                  ))}
                  
                  {/* Current Time Indicator */}
                  <motion.div className="absolute top-[35%] left-0 right-0 flex items-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                    <span className="absolute -left-16 bg-[var(--color-navy-800)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-[52px] text-center shadow-sm">11:29 AM</span>
                    <div className="w-full h-[2px] bg-[var(--color-navy-800)] ml-4 relative">
                      <div className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-navy-800)] shadow-sm"></div>
                    </div>
                  </motion.div>

                  <motion.div className="absolute inset-0 flex flex-col items-center justify-center mt-12 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <CalendarIcon className="text-[var(--color-text-muted)] mb-3 opacity-50" size={32} />
                    <p className="text-[14px] text-[var(--color-text-muted)] m-0">No appointments today</p>
                  </motion.div>
                </motion.div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Right Column */}
          <motion.div className="col-span-12 lg:col-span-3 flex flex-col gap-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="flex flex-col flex-1 h-[250px] transition-all hover:shadow-md hover:-translate-y-1 duration-200">
              <Card.Header className="flex justify-between items-center w-full border-b-0 pb-0">
                <h3 className="font-bold text-[15px] text-[var(--color-text)] m-0">New Walk-in Patients</h3>
                <span className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer">VIEW ALL</span>
              </Card.Header>
              <Card.Body className="flex flex-col items-center justify-center gap-4 pt-0">
                <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                  <UserPlus className="text-[var(--color-navy-600)]" size={24} />
                </div>
                <p className="text-[14px] text-[var(--color-text-muted)] m-0">No new walk-in patients</p>
                <Button variant="ghost" className="mt-2 w-full max-w-[200px] border border-[var(--color-border)] text-[var(--color-navy-800)] hover:bg-[var(--color-surface-alt)]">
                  Register Walk-in
                </Button>
              </Card.Body>
            </Card>

            <Card className="flex flex-col flex-1 h-[250px] transition-all hover:shadow-md hover:-translate-y-1 duration-200">
              <Card.Header className="flex justify-between items-center w-full border-b-0 pb-0">
                <h3 className="font-bold text-[15px] text-[var(--color-text)] m-0">Recent Shift Activities</h3>
                <span className="text-[var(--color-navy-800)] text-[12px] font-bold cursor-pointer">VIEW ALL</span>
              </Card.Header>
              <Card.Body className="flex flex-col items-center justify-center gap-4 pt-0">
                <div className="w-14 h-14 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center">
                  <Clipboard className="text-[var(--color-navy-600)]" size={24} />
                </div>
                <p className="text-[14px] text-[var(--color-text-muted)] m-0">No shift activities</p>
                <Button variant="ghost" className="mt-2 w-full max-w-[200px] border border-[var(--color-border)] text-[var(--color-navy-800)] hover:bg-[var(--color-surface-alt)]">
                  View Shift Log
                </Button>
              </Card.Body>
            </Card>
          </motion.div>

        </div>

        {/* Nurse Tasks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <Card.Body>
              <h3 className="font-bold text-[15px] text-[var(--color-text)] mb-4 mt-0">Nurse Tasks</h3>
              <div className="flex flex-wrap items-center justify-between gap-4">
                {[
                  { label: 'Record patient vitals (0 pending)', time: '08:00 AM' },
                  { label: 'Administer medications (0 pending)', time: '10:00 AM' },
                  { label: 'Collect lab samples (0 pending)', time: '11:30 AM' },
                  { label: 'Update patient records (0 pending)', time: '02:00 PM' },
                ].map((task, i) => (
                  <div key={i} className="flex-1 min-w-[200px] flex items-center justify-between border-r border-[var(--color-border)] last:border-0 pr-4 hover:bg-[var(--color-surface-alt)] p-2 rounded-md transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Circle className="text-[var(--color-navy-800)]" size={16} />
                      <span className="text-[13px] font-medium text-[var(--color-text)]">{task.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[var(--color-text-muted)]">{task.time}</span>
                      <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Need Help? */}
        <Card>
          <Card.Body className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300" 
                alt="Nurse" 
                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-border)]"
              />
              <div>
                <h3 className="font-bold text-[16px] text-[var(--color-text)] m-0">Need Help?</h3>
                <p className="text-[13px] text-[var(--color-text-muted)] m-0 mt-1 mb-3">Contact the nursing station for immediate assistance.</p>
                <Button variant="primary" icon={ChevronRight} iconPosition="right" size="sm">
                  Contact Nursing Station
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center">
                  <Phone className="text-[var(--color-navy-800)]" size={18} />
                </div>
                <div>
                  <p className="text-[12px] text-[var(--color-text)] font-bold m-0">Call Us</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] m-0">+1 123 456 7890</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center">
                  <MessageSquare className="text-[var(--color-success)]" size={18} />
                </div>
                <div>
                  <p className="text-[12px] text-[var(--color-text)] font-bold m-0">WhatsApp</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] m-0">+1 123 456 7890</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center">
                  <MessageSquare className="text-[var(--color-navy-800)]" size={18} />
                </div>
                <div>
                  <p className="text-[12px] text-[var(--color-text)] font-bold m-0">Live Chat</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] m-0">Available 24/7</p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

      </div>
    </DashboardShell>
    
  );
};

export default NurseDashboard;
