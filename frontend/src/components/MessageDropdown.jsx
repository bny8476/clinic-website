import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from './ui/motion';

const DUMMY_MESSAGES = [
  {
    id: 1,
    sender: 'Dr. Michael Lee',
    role: 'Pharmacy Admin',
    message: 'Can you please check the stock for Amoxicillin 500mg? We need it for the afternoon OPD.',
    time: '20 mins ago',
    isRead: false,
    avatar: 'https://ui-avatars.com/api/?name=Michael+Lee&background=e0e7ff&color=2563eb&rounded=true&bold=true'
  },
  {
    id: 2,
    sender: 'Nurse Sarah',
    role: 'ICU Ward',
    message: 'We are sending down a return for 2 vials of Insulin. Patient was discharged early.',
    time: '1 hour ago',
    isRead: false,
    avatar: 'https://ui-avatars.com/api/?name=Nurse+Sarah&background=fee2e2&color=dc2626&rounded=true&bold=true'
  },
  {
    id: 3,
    sender: 'Dr. James Smith',
    role: 'Cardiology',
    message: 'Please substitute the brand for the latest prescription I sent if the original is unavailable.',
    time: '3 hours ago',
    isRead: true,
    avatar: 'https://ui-avatars.com/api/?name=James+Smith&background=dcfce7&color=16a34a&rounded=true&bold=true'
  },
  {
    id: 4,
    sender: 'System Admin',
    role: 'IT Department',
    message: 'The pharmacy billing module will be down for maintenance tonight at 2 AM.',
    time: '1 day ago',
    isRead: true,
    avatar: 'https://ui-avatars.com/api/?name=System+Admin&background=f3f4f6&color=4b5563&rounded=true&bold=true'
  }
];

export default function MessageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const dropdownRef = useRef(null);

  const unreadCount = messages.filter(m => !m.isRead).length;

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
    setMessages(messages.map(m => ({ ...m, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer"
      >
        <MessageSquare size={22} className="text-slate-600 hover:text-slate-800 transition" />
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
              <h3 className="font-semibold text-slate-900 text-[14px]">Messages</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">
                  No messages to display.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 cursor-pointer ${!msg.isRead ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => {
                        setMessages(messages.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
                      }}
                    >
                      <img src={msg.avatar} alt={msg.sender} className="w-9 h-9 rounded-full mt-0.5 shadow-sm border border-slate-100" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-[13px] leading-tight truncate ${!msg.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {msg.sender}
                          </p>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">{msg.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-1">{msg.role}</p>
                        <p className={`text-[12px] line-clamp-2 ${!msg.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                          {msg.message}
                        </p>
                      </div>
                      {!msg.isRead && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-3"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <button className="w-full py-2 text-center text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Open Messenger
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
