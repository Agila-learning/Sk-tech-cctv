"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Clock,
  Package,
  ShieldCheck,
  Eye,
  Trash2,
  Megaphone,
  MessageCircle,
  Calendar,
  Wallet,
  Shield,
  MoreHorizontal,
  Archive,
  ArrowRight,
  X
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
  _id: string;
  title?: string;
  message: string;
  type: string;
  url?: string;
  orderId?: any;
  isRead: boolean;
  createdAt: string;
}

export const NotificationSection = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tasks' | 'chats' | 'orders' | 'announcements'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.more-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif: any) => {
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
      if ("Notification" in window && Notification.permission === "granted") {
        new window.Notification(notif.title || "New Update", { body: notif.message });
      }
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const data = await fetchWithAuth('/notifications');
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
    setOpenMenuId(null);
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetchWithAuth(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (selectedNotif?._id === id) setSelectedNotif(null);
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    }
    setOpenMenuId(null);
  };

  const archiveNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    // Placeholder for archive if backend supports it
    markAsRead(id, e);
  };

  const handleNotificationClick = async (notif: Notification, e?: React.MouseEvent) => {
    // If the click is inside the menu, it's handled by individual actions
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setSelectedNotif(notif);
  };

  const handleNavigateToSource = (notif: Notification) => {
    if (notif.url) {
      router.push(notif.url);
      return;
    }
    const rolePrefix = user?.role === 'admin' || user?.role === 'sub-admin' ? '/admin' : `/${user?.role}`;
    
    if (notif.type.includes('order') || notif.type.includes('payment')) {
      router.push(`${rolePrefix}/orders`);
    } else if (notif.type.includes('technician') || notif.type.includes('work') || notif.type.includes('task')) {
      router.push(`${rolePrefix}/tasks`);
    } else if (notif.type.includes('chat')) {
      router.push(`${rolePrefix}/chat`);
    } else if (notif.type.includes('leave')) {
      router.push(`${rolePrefix}/leaves`);
    }
    setSelectedNotif(null);
  };

  const getStyleForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('assign') || t.includes('task')) return { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (t.includes('order')) return { icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (t.includes('chat')) return { icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (t.includes('announcement')) return { icon: Megaphone, color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (t.includes('leave')) return { icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    if (t.includes('payment')) return { icon: Wallet, color: 'text-teal-500', bg: 'bg-teal-500/10' };
    if (t.includes('complete')) return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
    if (t.includes('error') || t.includes('urgent')) return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
    if (t.includes('warranty')) return { icon: ShieldCheck, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    return { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-500/10' };
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    const t = n.type.toLowerCase();
    if (filter === 'tasks') return t.includes('task') || t.includes('assign') || t.includes('work');
    if (filter === 'chats') return t.includes('chat');
    if (filter === 'orders') return t.includes('order') || t.includes('payment');
    if (filter === 'announcements') return t.includes('announcement');
    return true;
  }).slice(0, 5); // STRICTLY MAX 5 NOTIFICATIONS

  const filterOptions: Array<'all' | 'tasks' | 'chats' | 'orders' | 'announcements'> = ['all', 'tasks', 'chats', 'orders', 'announcements'];

  return (
    <div className="space-y-6">
      {/* SaaS Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Bell className="w-5 h-5" />
          </div>
          <div>
             <div className="flex items-center gap-3">
               <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-none uppercase">Center Command</h3>
               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                 <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Live Signal</span>
               </div>
             </div>
             <p className="text-[13px] text-slate-500 font-semibold mt-1">Real-time Operations Log</p>
          </div>
        </div>

        {/* Pill Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {filterOptions.map((f) => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`h-[36px] px-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${filter === f ? 'text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
             >
               {filter === f && (
                 <motion.div layoutId="activeFilter" className="absolute inset-0 bg-blue-600" style={{ borderRadius: 999 }} />
               )}
               <span className="relative z-10">{f}</span>
             </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-[140px] bg-white rounded-[22px] border border-[#E8EEF7] animate-pulse" />
            ))
          ) : filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 bg-white rounded-[22px] border border-dashed border-slate-300"
            >
              <div className="p-5 bg-slate-50 rounded-full mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold text-sm">No new operational logs.</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif, idx) => {
              const { icon: Icon, color, bg } = getStyleForType(notif.type);
              
              return (
                <motion.div
                  key={notif._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.08, ease: "easeOut" }}
                  onClick={(e) => handleNotificationClick(notif, e)}
                  className="group relative bg-white border border-[#E8EEF7] rounded-[22px] p-5 cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(0,0,0,0.06)]"
                >
                  {!notif.isRead && (
                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                  
                  {/* Icon Block */}
                  <div className={`w-[72px] h-[72px] shrink-0 rounded-2xl flex items-center justify-center ${bg}`}>
                    <Icon className={`w-8 h-8 ${color}`} strokeWidth={2} />
                  </div>

                  {/* Content Block */}
                  <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
                    <div className="flex items-start justify-between mb-1.5">
                       <h4 className={`text-[15px] sm:text-[18px] tracking-tight pr-4 ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                          {notif.title || notif.type.replace(/_/g, ' ').toUpperCase()}
                       </h4>
                       <span className="text-[13px] text-[#6B7280] font-medium whitespace-nowrap shrink-0">
                         {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                       </span>
                    </div>
                    <p className="text-[15px] text-slate-500 font-medium leading-[1.7] line-clamp-2 pr-12">
                      {notif.message}
                    </p>
                  </div>

                  {/* Priority / Actions */}
                  <div className="absolute bottom-5 right-5 flex items-center gap-3">
                     {!notif.isRead && (
                        <div className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                           New
                        </div>
                     )}
                     
                     <div className="relative more-menu-container">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setOpenMenuId(openMenuId === notif._id ? null : notif._id);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                           <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                           {openMenuId === notif._id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-20 p-1"
                              >
                                 <button onClick={(e) => handleNotificationClick(notif, e)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                    <Eye className="w-4 h-4" /> View Details
                                 </button>
                                 {!notif.isRead && (
                                   <button onClick={(e) => markAsRead(notif._id, e)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                      <CheckCircle className="w-4 h-4" /> Mark as Read
                                   </button>
                                 )}
                                 <button onClick={(e) => archiveNotification(notif._id, e)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                    <Archive className="w-4 h-4" /> Archive
                                 </button>
                                 <div className="h-px bg-slate-100 my-1 mx-2" />
                                 <button onClick={(e) => deleteNotification(notif._id, e)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 className="w-4 h-4" /> Delete
                                 </button>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer Link */}
      {!loading && notifications.length > 0 && (
         <div className="pt-4 flex justify-center border-t border-dashed border-slate-200">
            <Link 
              href="/technician/notifications"
              className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full hover:border-blue-500 hover:shadow-lg transition-all"
            >
               <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                  View All Notifications
               </span>
               <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>
         </div>
      )}

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedNotif(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${getStyleForType(selectedNotif.type).bg}`}>
                    {React.createElement(getStyleForType(selectedNotif.type).icon, {
                      className: `w-5 h-5 ${getStyleForType(selectedNotif.type).color}`
                    })}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedNotif.type.replace(/_/g, ' ').toUpperCase()}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteNotification(selectedNotif._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedNotif(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedNotif.title || 'Notification Details'}</h2>
                <div className="prose prose-sm prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedNotif.message}</p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => handleNavigateToSource(selectedNotif)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-md"
                >
                  View Related Source
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
