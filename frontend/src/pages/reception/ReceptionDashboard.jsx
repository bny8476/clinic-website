import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, Monitor, FileText, DollarSign, Shield, Ticket,
  UserCheck, UserPlus, ClipboardList, TrendingUp, AlertCircle, ArrowRight, Loader2, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import useAuthStore from '../../store/authStore';



const BRANCH_ID = 1;

const QUICK_ACTIONS = [
  { label: 'Register\nPatient', icon: UserPlus, path: '/reception/register' },
  { label: 'Walk-In\nCheck-In', icon: UserCheck, path: '/reception/walk-in' },
  { label: 'Queue\nManagement', icon: Users, path: '/reception/queue' },
  { label: 'Token\nGeneration', icon: Ticket, path: '/reception/tokens' },
  { label: 'Billing &\nPayments', icon: DollarSign, path: '/reception/billing' },
  { label: 'Insurance\nVerify', icon: Shield, path: '/reception/insurance' },
  { label: 'Document\nScanning', icon: FileText, path: '/reception/documents' },
  { label: 'Kiosk\nCheck-In', icon: Monitor, path: '/reception/kiosk' },
];

const StatCard = ({ label, value, icon: Icon, isLoading }) => (
  <motion.div variants={fadeIn} className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center flex-shrink-0 text-[var(--color-navy-600)]">
      <Icon size={24} strokeWidth={2} />
    </div>
    <div className="min-w-0">
      <p className="text-[13px] font-bold text-[var(--color-text-muted)] truncate">{label}</p>
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-navy-600)] mt-1" />
      ) : (
        <p className="text-[24px] font-black text-[var(--color-text)]">{value ?? '—'}</p>
      )}
    </div>
  </motion.div>
);

const ReceptionDashboard = () => {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, refetch, isFetching } = useQuery({
    queryKey: ['receptionDashboardStats', BRANCH_ID],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/kiosk/branch/${BRANCH_ID}/stats`);
      return res.data;
    },
    refetchInterval: 30000
  });

  const { data: kioskToday = [], isLoading: kioskLoading } = useQuery({
    queryKey: ['kioskToday', BRANCH_ID],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/kiosk/branch/${BRANCH_ID}/today`);
      return res.data;
    },
    refetchInterval: 15000
  });

  const statusVariant = (status) => {
    if (status === 'CHECKED_IN') return 'bg-green-100 text-green-700';
    if (status === 'NO_SHOW') return 'bg-red-100 text-red-700';
    if (status === 'VERIFIED') return 'bg-[var(--color-info-bg)] text-[var(--color-navy-800)]';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    
    <div className="h-full flex flex-col font-sans overflow-y-auto bg-[var(--color-bg-app)]">
      
      {/* Top Action Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex gap-4 p-6 shrink-0 bg-[var(--color-bg-app)] overflow-x-auto">
        {QUICK_ACTIONS.map((action, idx) => (
          <motion.button variants={fadeIn} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={idx} onClick={() => navigate(action.path)} className="min-w-[120px] flex-1 flex flex-col items-center justify-center gap-3 bg-white border border-[var(--color-border)] rounded-xl py-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center text-[var(--color-navy-600)]">
              <action.icon size={24} strokeWidth={2} />
            </div>
            <span className="font-bold text-[13px] text-[var(--color-text)] text-center leading-tight whitespace-pre-line">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Main Content Area */}
      <div className="px-6 pb-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[var(--color-text)]">
              Reception Desk
            </h1>
            <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
              Welcome back, {user?.firstName || 'Staff'}.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-[13px] font-bold text-[var(--color-navy-800)] hover:text-white hover:bg-[var(--color-navy-800)] bg-white px-4 py-2 rounded-lg border border-[var(--color-border)] shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Live Stats */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Queue Waiting"
            value={stats?.queueWaiting}
            icon={ClipboardList}
            isLoading={statsLoading}
          />
          <StatCard
            label="Walk-ins Today"
            value={stats?.walkInsToday}
            icon={UserCheck}
            isLoading={statsLoading}
          />
          <StatCard
            label="Kiosk Pending"
            value={stats?.kioskPending}
            icon={AlertCircle}
            isLoading={statsLoading}
          />
          <StatCard
            label="Verified Today"
            value={stats?.kioskVerified}
            icon={UserPlus}
            isLoading={statsLoading}
          />
          <StatCard
            label="Checked In"
            value={stats?.kioskCheckedIn}
            icon={TrendingUp}
            isLoading={statsLoading}
          />
        </motion.div>
        
        {/* Today's Kiosk Check-ins */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-[16px] text-[var(--color-text)] flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[var(--color-navy-600)]" />
              Today's Kiosk Check-ins
            </h2>
            <button
              onClick={() => navigate('/reception/queue')}
              className="text-[12px] font-bold text-[var(--color-navy-800)] hover:underline flex items-center gap-1"
            >
              Full Queue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            {kioskLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-navy-600)]" />
              </div>
            ) : kioskToday.length === 0 ? (
              <div className="text-center py-6 text-[14px] text-[var(--color-text-muted)]">
                No kiosk check-ins yet today.
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                {kioskToday.slice(0, 8).map(k => (
                  <motion.div
                    variants={fadeIn}
                    key={k.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-[var(--color-navy-600)]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--color-text)]">
                          Check-In #{k.id}
                          {k.kioskStation && <span className="text-[12px] text-[var(--color-text-muted)] ml-2">— {k.kioskStation}</span>}
                        </p>
                        <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                          {k.createdAt ? new Date(k.createdAt).toLocaleTimeString() : ''}
                          {k.appointmentId ? ` · Appointment #${k.appointmentId}` : ' · Walk-In'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${statusVariant(k.status)}`}>
                      {k.status}
                    </span>
                  </motion.div>
                ))}
                {kioskToday.length > 8 && (
                  <p className="text-[12px] text-center text-[var(--color-text-muted)] pt-2 font-bold">
                    +{kioskToday.length - 8} more check-ins today
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
    
  );
};

export default ReceptionDashboard;
