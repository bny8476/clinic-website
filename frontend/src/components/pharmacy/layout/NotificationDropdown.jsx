import { useState, useEffect, useRef } from 'react';

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Low Stock Alert',
    message: 'Paracetamol 500mg is below the minimum reorder level (15 strips remaining).',
    type: 'warning',
    time: '10 mins ago',
    isRead: false
  },
  {
    id: 2,
    title: 'PO Approved',
    message: 'Purchase Order #PO-2023-1192 has been approved by Admin.',
    type: 'success',
    time: '1 hour ago',
    isRead: false
  },
  {
    id: 3,
    title: 'New GRN Generated',
    message: 'Goods Receipt Note #GRN-8822 generated for MedPlus Suppliers.',
    type: 'info',
    time: '2 hours ago',
    isRead: false
  },
  {
    id: 4,
    title: 'Expiring Medicines',
    message: '3 batches are expiring within the next 30 days.',
    type: 'warning',
    time: '1 day ago',
    isRead: true
  },
  {
    id: 5,
    title: 'Stock Transfer',
    message: 'Stock transfer request from Branch A has been completed.',
    type: 'success',
    time: '2 days ago',
    isRead: true
  }
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Package className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute 1 top-1.5 right-1.5 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 text-[14px]">Notifications</h3>
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
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-[13px]">
                No notifications to display.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 cursor-pointer ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => {
                      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                    }}
                  >
                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-[13px] leading-tight truncate ${!notification.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{notification.time}</span>
                      </div>
                      <p className={`text-[12px] mt-1 line-clamp-2 ${!notification.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 bg-slate-50">
            <button className="w-full py-2 text-center text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
