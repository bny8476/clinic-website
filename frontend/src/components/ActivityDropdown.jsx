import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, LogIn, CheckCircle, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from './ui/motion';

const DUMMY_ACTIVITIES = [
  {
    id: 1,
    title: 'System Health Check Passed',
    description: 'All services are operating normally.',
    time: '5 mins ago',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    isUnread: true
  },
  {
    id: 2,
    title: 'Database Backup Complete',
    description: 'Automated backup completed successfully.',
    time: '1 hour ago',
    icon: Clock,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    isUnread: true
  },
  {
    id: 3,
    title: 'New Login Detected',
    description: 'Login from new IP address: 192.168.1.45',
    time: '3 hours ago',
    icon: LogIn,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    isUnread: false
  },
  {
    id: 4,
    title: 'Server Update Scheduled',
    description: 'Maintenance scheduled for tonight at 2 AM.',
    time: '1 day ago',
    icon: ShieldAlert,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    isUnread: false
  }
];

export default function ActivityDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState(DUMMY_ACTIVITIES);
  const dropdownRef = useRef(null);

  const unreadCount = activities.filter(a => a.isUnread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setActivities(activities.map(a => ({ ...a, isUnread: false })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer"
      >
        <Activity size={22} className="text-slate-600 hover:text-slate-800 transition" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
            {unreadCount}
          </span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-[14px]">Recent Activity</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">
                  No recent activity.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {activities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div 
                        key={activity.id} 
                        className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 cursor-pointer ${activity.isUnread ? 'bg-indigo-50/30' : ''}`}
                        onClick={() => {
                          setActivities(activities.map(a => a.id === activity.id ? { ...a, isUnread: false } : a));
                        }}
                      >
                        <div className={`w-9 h-9 rounded-full flex flex-col items-center justify-center shrink-0 mt-0.5 ${activity.bg} ${activity.color}`}>
                          <Icon size={18} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-[13px] leading-tight truncate ${activity.isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {activity.title}
                            </p>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">{activity.time}</span>
                          </div>
                          <p className={`text-[12px] mt-1 line-clamp-2 ${activity.isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                            {activity.description}
                          </p>
                        </div>
                        {activity.isUnread && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-3"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <button className="w-full py-2 text-center text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                View Full Log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
