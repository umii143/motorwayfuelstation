import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Example static notification type
export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Super Petrol is below minimum threshold (1500L remaining).',
    time: '10 mins ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'alert',
    title: 'Shift Reconciliation Failed',
    message: 'Morning shift reported a cash shortage of Rs 5,400.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Supplier Delivery Verified',
    message: 'PSO Tanker (40,000L) delivery confirmed via QR.',
    time: '2 hours ago',
    read: true,
  },
  {
    id: 'n4',
    type: 'info',
    title: 'System Update',
    message: 'FuelPro v2.4 has been installed successfully.',
    time: '1 day ago',
    read: true,
  }
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'info':
      default: return <Info className="h-4 w-4 text-sky-500" />;
    }
  };

  const getBgForType = (type: string, read: boolean) => {
    if (read) return 'bg-white';
    switch (type) {
      case 'warning': return 'bg-amber-50/50';
      case 'alert': return 'bg-red-50/50';
      case 'success': return 'bg-emerald-50/50';
      case 'info':
      default: return 'bg-sky-50/50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${getBgForType(notification.type, notification.read)}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getIconForType(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm font-semibold truncate pr-2 ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 ${notification.read ? 'text-slate-500' : 'text-slate-700'}`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 flex items-center ml-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
              <button className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
                View All Activity
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
