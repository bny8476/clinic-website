import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { UserRound, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '../../components/ui/EmptyState';


const NurseAssignedPatients = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['nurse-assigned-patients'],
    queryFn: async () => (await axiosPrivate.get('/nursing/assignments/op')).data,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] m-0">Assigned Patients</h1>
          <p className="m-0 text-sm text-[var(--color-text-muted)] mt-1">Patients currently assigned to your shift</p>
        </div>
        <span className="text-sm font-semibold text-[var(--color-navy-800)] bg-[var(--color-info-bg)] px-3 py-1.5 rounded-md whitespace-nowrap">Shift: Morning (08:00 - 16:00)</span>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        {patients.length === 0 ? (
          <div className="py-10">
            <EmptyState 
              icon={UserRound}
              title="No Patients Assigned" 
              description="There are currently no OP patients assigned to your nursing queue." 
            />
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {patients.map(p => (
              <motion.div key={p.id} variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors last:border-b-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center text-[var(--color-navy-800)] font-bold shrink-0">
                    {p.patientName ? p.patientName[0] : '?'}
                  </div>
                  <div>
                    <h3 className="m-0 text-[15px] font-bold text-[var(--color-text)]">{p.patientName} ({p.age}y)</h3>
                    <p className="m-0 mt-1 text-xs text-[var(--color-text-muted)]">
                      {p.tokenNumber ? `Token #${p.tokenNumber} · ` : ''}Reason: {p.appointmentReason} · Attending: {p.attendingDoctorName}
                    </p>
                    <p className="m-0 mt-1 text-xs font-medium text-[var(--color-navy-600)]">Vitals: {p.lastVitalsSummary}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button onClick={() => navigate(`/nurse/workspace/${p.patientId}`)} className="bg-[var(--color-navy-800)] hover:bg-[var(--color-navy-900)] text-white border-none px-3 py-1.5 rounded-md text-xs cursor-pointer font-semibold flex items-center gap-1.5 transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 transform duration-200">
                    <HeartPulse size={14} /> Workspace
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
    
  );
};

export default NurseAssignedPatients;
