"use client";
import React, { useState, useEffect } from 'react';
import { Bell, Package, CheckSquare, AlertCircle, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const NotificationTray = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchWithAuth('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (error: any) {
      if (error.message !== 'Please authenticate.') {
        console.warn("Notification sync delayed.");
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      
      if (socket) {
        socket.on('notification', () => {
          loadNotifications();
        });
        return () => {
          socket.off('notification');
        };
      }
      
      const interval = setInterval(loadNotifications, 30000); // Fallback polling
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, socket]);

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await fetchWithAuth(`/notifications/${notif._id}/read`, { method: 'PATCH' });
        loadNotifications();
      }
      setIsOpen(false);
      
      if (notif.url) {
        router.push(notif.url);
        return;
      }
      
      const rolePrefix = user?.role === 'admin' || user?.role === 'sub-admin' ? '/admin' : `/${user?.role}`;
      
      switch (notif.type) {
        case 'new_order':
        case 'payment_confirmed':
          router.push(`${rolePrefix}/orders`);
          break;
        case 'technician_assigned':
        case 'work_started':
        case 'work_pending':
          router.push(`${rolePrefix}/tasks`);
          break;
        case 'new_chat_message':
          router.push(`${rolePrefix}/chat`);
          break;
        case 'leave_requested':
          router.push(`${rolePrefix}/attendance`);
          break;
        case 'emergency':
          router.push(`${rolePrefix}/tickets`);
          break;
      }
    } catch (e: any) { console.error(e); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <Package className="h-4 w-4 text-blue-500" />;
      case 'technician_assigned': return <Package className="h-4 w-4 text-cyan-500" />;
      case 'installation_update': return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'announcement': return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'emergency': return <AlertCircle className="h-4 w-4 text-danger-red animate-pulse" />;
      case 'cancelled': return <X className="h-4 w-4 text-danger-red" />;
      default: return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <Bell className="h-5 w-5 text-fg-muted group-hover:text-fg-primary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 z-40 pointer-events-auto" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 lg:right-auto mt-4 w-80 bg-bg-card border border-border-base rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl pointer-events-auto"
              style={{ top: '60px', right: '0' }}
            >
              <div className="p-4 border-b border-border-subtle flex justify-between items-center">
                 <h4 className="text-[10px] font-black text-fg-primary uppercase tracking-widest">Notifications</h4>
                 <button onClick={() => setIsOpen(false)} className="text-fg-muted hover:text-fg-primary"><X className="h-3 w-3" /></button>
              </div>

              <div className="max-h-96 overflow-y-auto scrollbar-hide py-2">
                 {notifications.length > 0 ? (
                   notifications.map((notif) => (
                     <div 
                       key={notif._id}
                       onClick={() => handleNotificationClick(notif)}
                       className={`flex items-start space-x-4 p-4 hover:bg-bg-muted transition-colors cursor-pointer border-l-2 ${notif.isRead ? 'border-transparent' : 'border-blue-600 bg-blue-600/5'}`}
                     >
                        <div className="mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1 space-y-1">
                           <p className={`text-[11px] leading-relaxed ${notif.isRead ? 'text-fg-muted' : 'text-fg-primary font-bold'}`}>{notif.message}</p>
                           <p className="text-[8px] font-black uppercase text-fg-dim tracking-wider">
                             {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                        <ChevronRight className="h-3 w-3 text-fg-dim" />
                     </div>
                   ))
                 ) : (
                   <div className="py-20 text-center space-y-4">
                      <Bell className="h-8 w-8 text-fg-dim mx-auto" />
                      <p className="text-[10px] font-black text-fg-dim uppercase tracking-widest leading-relaxed">No new <br/>notifications</p>
                   </div>
                 )}
              </div>

              <Link 
                href="/notifications" 
                onClick={() => setIsOpen(false)}
                className="block p-3 text-center border-t border-border-subtle text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] hover:bg-blue-600/10 transition-colors"
              >
                View All
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationTray;
