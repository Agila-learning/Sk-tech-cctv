"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  MapPin, 
  Clock,
  Package,
  ShieldCheck,
  Eye,
  Trash2
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  title?: string;
  message: string;
  type: string;
  orderId?: any;
  isRead: boolean;
  createdAt: string;
}

export const NotificationSection = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: any) => {
      // If it's a simple object from socket, wrap it or ensure it matches interface
      const newNotif: Notification = {
        _id: notif._id || Math.random().toString(),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        orderId: notif.orderId,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
      
      // Optional: Browser notification or sound
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notif.title || "New Update", { body: notif.message });
      }
    };

    socket.on('notification', handleNewNotification);
    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const data = await fetchWithAuth('/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetchWithAuth('/notifications/mark-all-read', {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
       console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetchWithAuth(`/notifications/${id}`, {
        method: 'DELETE'
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <Package className="w-5 h-5 text-blue-500" />;
      case 'technician_assigned': return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      case 'technician_update': return <MapPin className="w-5 h-5 text-orange-500" />;
      case 'order_update': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rescheduled': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Bell className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-fg-primary tracking-tight uppercase">Center Command</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live Signal</span>
              </div>
            </div>
            <p className="text-sm text-fg-muted font-medium">Real-time Operations Log</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-card text-fg-muted border border-card-border hover:border-blue-500/30'}`}
           >
             All
           </button>
           <button 
             onClick={() => setFilter('unread')}
             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'unread' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-card text-fg-muted border border-card-border hover:border-blue-500/30'}`}
           >
             Unread ({notifications.filter(n => !n.isRead).length})
           </button>
           {notifications.some(n => !n.isRead) && (
             <button 
               onClick={markAllRead}
               className="ml-2 p-2 text-fg-muted hover:text-blue-500 transition-colors"
               title="Mark all as read"
             >
               <CheckCircle2 className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card/50 animate-pulse rounded-[2rem] border border-card-border" />
            ))
          ) : filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-[3rem] border border-dashed border-card-border"
            >
              <div className="p-4 bg-fg-muted/5 rounded-full mb-4">
                <Bell className="w-8 h-8 text-fg-muted/30" />
              </div>
              <p className="text-fg-muted font-medium">No operational logs found</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif) => (
              <motion.div
                key={notif._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative overflow-hidden bg-card p-5 rounded-[2rem] border transition-all duration-300 ${notif.isRead ? 'border-card-border opacity-80' : 'border-blue-500/30 shadow-xl shadow-blue-500/5'}`}
              >
                {!notif.isRead && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                )}
                
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-[1.25rem] transition-colors ${notif.isRead ? 'bg-fg-muted/5' : 'bg-blue-500/10'}`}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                        {notif.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-medium text-fg-muted">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {notif.title && (
                      <h4 className="font-bold text-fg-primary leading-tight">{notif.title}</h4>
                    )}
                    <p className="text-sm font-medium text-fg-muted leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif._id)}
                        className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notif._id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
