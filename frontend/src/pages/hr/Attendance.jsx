import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import { Clock, Calendar, LogIn, LogOut, CheckCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const Attendance = () => {
  const { user } = useAuthStore();
  const [clockedIn, setClockedIn] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, date: '8/31/2026', in: '09:00 AM', out: '05:00 PM', status: 'Present' }
  ]);

  const handleClockInOut = () => {
    if (clockedIn) {
      toast.success('Clocked out successfully!');
      setClockedIn(false);
    } else {
      toast.success('Clocked in successfully!');
      setClockedIn(true);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full max-w-full px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 font-sans">
      
      {/* Custom Header matching mockup */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] bg-[#EEF2FF] rounded-[16px] flex items-center justify-center shrink-0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="11" r="7" stroke="#2160FF" strokeWidth="2" />
              <path d="M10 7V11L12.5 13.5" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 20C14 17.5 16.5 16 19 16C21.5 16 24 17.5 24 20" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="19" cy="12" r="2.5" stroke="#2160FF" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 m-0 leading-tight tracking-tight">
              HR Attendance & Time Tracking
            </h1>
            <p className="text-[15px] text-slate-500 m-0 mt-1">
              Track employee attendance, clock in/out times, and daily work status.
            </p>
          </div>
        </div>
        <button 
          onClick={handleClockInOut}
          className={`px-6 py-3 rounded-[12px] font-semibold text-[15px] text-white flex items-center gap-2 transition-all shadow-sm ${clockedIn ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#2160FF] hover:bg-[#1A4CE6]'}`}
        >
          <Clock size={18} strokeWidth={2.5} /> {clockedIn ? 'Clock Out' : 'Clock In'}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFCFF] border-b border-slate-100">
                <th className="px-8 py-6 border-r border-slate-100 last:border-0 w-1/4">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <Calendar size={20} strokeWidth={2} /> Date
                  </div>
                </th>
                <th className="px-8 py-6 border-r border-slate-100 last:border-0 w-1/4">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <LogIn size={20} strokeWidth={2} /> Clock In
                  </div>
                </th>
                <th className="px-8 py-6 border-r border-slate-100 last:border-0 w-1/4">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <LogOut size={20} strokeWidth={2} /> Clock Out
                  </div>
                </th>
                <th className="px-8 py-6 border-r border-slate-100 last:border-0 w-1/4">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <CheckCircle size={20} strokeWidth={2} /> Status
                  </div>
                </th>
              </tr>
            </thead>
            <motion.tbody
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="divide-y divide-slate-100"
            >
              {logs.map(log => (
                <motion.tr key={log.id} variants={fadeIn} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-8 py-6 border-r border-slate-100 last:border-0">
                    <div className="flex items-center gap-3 text-[15px] font-medium text-slate-700">
                      <Calendar size={20} strokeWidth={2} className="text-[#2160FF]" /> {log.date}
                    </div>
                  </td>
                  <td className="px-8 py-6 border-r border-slate-100 last:border-0">
                    <div className="flex items-center gap-3 text-[15px] font-bold text-[#00B661]">
                      <div className="w-2 h-2 rounded-full bg-[#00B661]"></div> {log.in}
                    </div>
                  </td>
                  <td className="px-8 py-6 border-r border-slate-100 last:border-0">
                    <div className="flex items-center gap-3 text-[15px] font-bold text-[#FF6D00]">
                      <div className="w-2 h-2 rounded-full bg-[#FF6D00]"></div> {log.out || '--'}
                    </div>
                  </td>
                  <td className="px-8 py-6 border-r border-slate-100 last:border-0">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F7ED] text-[#00B661] text-[13px] font-bold border border-[#00B661]/20">
                      <CheckCircle size={15} strokeWidth={2.5} /> {log.status}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Attendance;
