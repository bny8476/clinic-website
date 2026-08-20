import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';
import { staggerContainer, fadeIn } from '../../components/ui/motion';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';



const Attendance = () => {
  const { user } = useAuthStore();
  const [clockedIn, setClockedIn] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, date: new Date().toLocaleDateString(), in: '09:00 AM', out: '05:00 PM', status: 'Present' }
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
    
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="flex justify-between items-center mb-6"
      >
        <h2 className="text-2xl font-bold text-slate-800">HR Attendance &amp; Time Tracking</h2>
        
        <motion.button 
          onClick={handleClockInOut}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`px-6 py-2 rounded-full font-bold text-white shadow-md transition-colors ${clockedIn ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
        >
          {clockedIn ? 'Clock Out' : 'Clock In'}
        </motion.button>
      </motion.div>
      
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Clock In</th>
              <th className="px-6 py-3">Clock Out</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100"
          >
            {logs.map(log => (
              <motion.tr key={log.id} variants={fadeIn} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">{log.date}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">{log.in}</td>
                <td className="px-6 py-4 text-orange-600 font-medium">{log.out || '--'}</td>
                <td className="px-6 py-4">
                  <Badge variant="success">{log.status}</Badge>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </motion.div>
    </div>
    
  );
};

export default Attendance;
