"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle, AlertCircle, Package, ShieldCheck,
  Eye, Trash2, Megaphone, MessageCircle, Calendar, Wallet, Shield,
  MoreHorizontal, Archive, ArrowLeft, CheckCircle2, ListFilter
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
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

export default function NotificationsPage() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'today' | 'yesterday' | 'week' | 'tasks' | 'orders' | 'chats' | 'announcements'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    } catch (err) {}
    setOpenMenuId(null);
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetchWithAuth(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {}
    setOpenMenuId(null);
  };

  const markAllRead = async () => {
    try {
      await fetchWithAuth('/notifications/mark-all-read', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const handleNotificationClick = async (notif: Notification, e?: React.MouseEvent) => {
    if (!notif.isRead) await markAsRead(notif._id);
    if (notif.url) {
      router.push(notif.url);
      return;
    }
    const rolePrefix = user?.role === 'admin' || user?.role === 'sub-admin' ? '/admin' : `/${user?.role}`;
    if (notif.type.includes('order') || notif.type.includes('payment')) router.push(`${rolePrefix}/orders`);
    else if (notif.type.includes('technician') || notif.type.includes('work') || notif.type.includes('task')) router.push(`${rolePrefix}/tasks`);
    else if (notif.type.includes('chat')) router.push(`${rolePrefix}/chat`);
    else if (notif.type.includes('leave')) router.push(`${rolePrefix}/leaves`);
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
    const date = new Date(n.createdAt);
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    if (filter === 'today') return isToday(date);
    if (filter === 'yesterday') return isYesterday(date);
    if (filter === 'week') return isThisWeek(date);
    
    const t = n.type.toLowerCase();
    if (filter === 'tasks') return t.includes('task') || t.includes('assign') || t.includes('work');
    if (filter === 'chats') return t.includes('chat');
    if (filter === 'orders') return t.includes('order') || t.includes('payment');
    if (filter === 'announcements') return t.includes('announcement');
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
               <Link href="/technician" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                 <ArrowLeft className="w-6 h-6" />
               </Link>
               <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Notifications</h1>
                  <p className="text-sm font-semibold text-slate-500">All Operations Log</p>
               </div>
            </div>
            
            <button 
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors border border-blue-100"
            >
               <CheckCircle2 className="w-4 h-4" />
               <span className="hidden sm:inline">Mark All Read</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
           
           {/* Sidebar Filters */}
           <div className="w-full lg:w-64 shrink-0 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-28">
                 <div className="flex items-center gap-2 mb-6">
                    <ListFilter className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filters</h3>
                 </div>

                 <div className="space-y-1">
                    {[
                      { id: 'all', label: 'All Updates' },
                      { id: 'unread', label: 'Unread', badge: notifications.filter(n => !n.isRead).length },
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'week', label: 'This Week' },
                    ].map(f => (
                       <button
                         key={f.id}
                         onClick={() => setFilter(f.id as any)}
                         className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${filter === f.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                       >
                         {f.label}
                         {f.badge !== undefined && f.badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${filter === f.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                               {f.badge}
                            </span>
                         )}
                       </button>
                    ))}
                 </div>

                 <div className="h-px bg-slate-100 my-6" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Categories</h4>
                 <div className="space-y-1">
                    {[
                      { id: 'tasks', label: 'Tasks & Jobs', icon: Shield },
                      { id: 'orders', label: 'Orders & Payments', icon: Package },
                      { id: 'chats', label: 'Messages', icon: MessageCircle },
                      { id: 'announcements', label: 'Announcements', icon: Megaphone },
                    ].map(f => (
                       <button
                         key={f.id}
                         onClick={() => setFilter(f.id as any)}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${filter === f.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                       >
                         <f.icon className="w-4 h-4" />
                         {f.label}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Main Feed */}
           <div className="flex-1">
              <div className="space-y-4">
                 <AnimatePresence mode="popLayout">
                   {loading ? (
                     [1, 2, 3, 4, 5].map(i => (
                       <div key={i} className="h-[140px] bg-white rounded-[24px] border border-slate-200 animate-pulse" />
                     ))
                   ) : filteredNotifications.length === 0 ? (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                       className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-dashed border-slate-300"
                     >
                       <div className="p-6 bg-slate-50 rounded-full mb-4">
                         <Bell className="w-10 h-10 text-slate-300" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up</h3>
                       <p className="text-slate-500 font-medium text-sm max-w-xs text-center">There are no notifications matching this filter.</p>
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
                           transition={{ delay: idx * 0.05, ease: "easeOut" }}
                           onClick={(e) => handleNotificationClick(notif, e)}
                           className="group relative bg-white border border-slate-200 rounded-[24px] p-6 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300"
                         >
                           {!notif.isRead && (
                             <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                           )}
                           
                           {/* Icon Block */}
                           <div className={`w-[72px] h-[72px] shrink-0 rounded-2xl flex items-center justify-center ${bg}`}>
                             <Icon className={`w-8 h-8 ${color}`} strokeWidth={2.5} />
                           </div>

                           {/* Content Block */}
                           <div className="flex-1 min-w-0 w-full">
                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                <h4 className={`text-lg tracking-tight pr-4 ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                                   {notif.title || notif.type.replace(/_/g, ' ').toUpperCase()}
                                </h4>
                                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </span>
                             </div>
                             <p className="text-[15px] text-slate-500 font-medium leading-relaxed pr-12">
                               {notif.message}
                             </p>
                           </div>

                           {/* Priority / Actions */}
                           <div className="absolute bottom-6 right-6 flex items-center gap-3">
                              {!notif.isRead && (
                                 <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                                    New
                                 </div>
                              )}
                              
                              <div className="relative more-menu-container">
                                 <button 
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === notif._id ? null : notif._id);
                                   }}
                                   className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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
                                         className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden z-20 p-1.5"
                                       >
                                          <button onClick={(e) => handleNotificationClick(notif, e)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                             <Eye className="w-4 h-4" /> View Details
                                          </button>
                                          {!notif.isRead && (
                                            <button onClick={(e) => markAsRead(notif._id, e)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                               <CheckCircle className="w-4 h-4" /> Mark as Read
                                            </button>
                                          )}
                                          <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); markAsRead(notif._id, e); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                             <Archive className="w-4 h-4" /> Archive
                                          </button>
                                          <div className="h-px bg-slate-100 my-1 mx-2" />
                                          <button onClick={(e) => deleteNotification(notif._id, e)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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
           </div>
        </div>
      </div>
    </div>
  );
}
