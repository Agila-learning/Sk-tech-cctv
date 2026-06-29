"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Bell, Package, CheckSquare, AlertCircle, X, ChevronRight, Clock } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchWithAuth('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <Package className="h-6 w-6 text-blue-500" />;
      case 'technician_assigned': return <Package className="h-6 w-6 text-cyan-500" />;
      case 'installation_update': return <CheckSquare className="h-6 w-6 text-green-500" />;
      case 'announcement': return <Bell className="h-6 w-6 text-yellow-500" />;
      case 'emergency': return <AlertCircle className="h-6 w-6 text-danger-red animate-pulse" />;
      case 'cancelled': return <X className="h-6 w-6 text-danger-red" />;
      default: return <AlertCircle className="h-6 w-6 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-fg-primary transition-colors">
      <Navbar />
      <div className="h-20"></div>
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <header className="flex justify-between items-end mb-12">
           <div className="space-y-4">
              <div className="flex items-center space-x-3">
                 <Bell className="h-5 w-5 text-blue-600" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">User Updates</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase">Notifications <span className="text-fg-muted italic text-3xl">Archive</span></h1>
           </div>
           <button 
             onClick={() => notifications.forEach(n => !n.isRead && markAsRead(n._id))}
             className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors"
           >
             Mark all as read
           </button>
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-20">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif._id}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
                className={`flex items-center space-x-6 p-8 rounded-[2.5rem] border border-border-base transition-all group ${notif.isRead ? 'bg-bg-surface/50 opacity-80' : 'bg-bg-surface border-blue-600/30 shadow-xl shadow-blue-600/5'}`}
              >
                 <div className={`p-4 rounded-2xl ${notif.isRead ? 'bg-bg-muted' : 'bg-blue-600/10'} transition-colors group-hover:scale-110 duration-500`}>
                    {getIcon(notif.type)}
                 </div>
                 <div className="flex-1 space-y-2">
                    <p className={`text-lg font-medium leading-relaxed ${notif.isRead ? 'text-fg-muted' : 'text-fg-primary font-bold'}`}>
                       {notif.message}
                    </p>
                    <div className="flex items-center space-x-4 text-[10px] font-black uppercase text-fg-dim tracking-wider">
                       <span className="flex items-center space-x-1.5 font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(notif.createdAt).toLocaleString()}</span>
                       </span>
                       {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                       )}
                    </div>
                 </div>
                 <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-2 ${notif.isRead ? 'text-fg-dim' : 'text-blue-500'}`} />
              </div>
            ))
          ) : (
            <div className="py-32 text-center space-y-6 glass-card rounded-[4rem]">
               <div className="w-24 h-24 bg-bg-muted rounded-full flex items-center justify-center mx-auto">
                 <Bell className="h-10 w-10 text-fg-dim" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Transmission Clear</h2>
                 <p className="text-fg-muted font-medium">You don't have any notifications at the moment.</p>
               </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
