"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchWithAuth } from '@/utils/api';
import { 
  Megaphone, Calendar, Clock, ChevronRight, 
  Search, Shield, Bell, Pin, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TechnicianAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadAnnouncements = async () => {
    try {
      const data = await fetchWithAuth('/internal/announcements');
      setAnnouncements(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const markRead = async (id: string) => {
    try {
      await fetchWithAuth(`/internal/announcements/${id}/read`, { method: 'PATCH' });
      setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch (e) { console.error(e); }
  };

  const filtered = announcements.filter(a => 
    a.title.toLowerCase().includes(filter.toLowerCase()) || 
    a.content.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-bg-muted/10 h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">
              <Megaphone className="h-4 w-4 animate-pulse" />
              <span>Broadcast Protocol Active</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">
              Strategic <span className="text-blue-500 non-italic">Announcements</span>
            </h1>
            <p className="text-fg-muted font-medium text-sm lg:text-base uppercase tracking-widest leading-none">Internal Operations & Command Updates</p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-5 top-5 h-4 w-4 text-fg-dim group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter Protocols..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 pl-14 text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all text-fg-primary"
            />
          </div>
        </header>

        {/* Announcements List */}
        <div className="space-y-8">
           <AnimatePresence>
              {filtered.map((ann, i) => (
                 <motion.div 
                   key={ann._id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   onClick={() => !ann.isRead && markRead(ann._id)}
                   className={`glass-card rounded-[3rem] p-8 lg:p-12 border transition-all cursor-pointer group relative overflow-hidden ${ann.isRead ? 'border-border-base opacity-80' : 'border-blue-500/30 bg-blue-600/5 shadow-2xl shadow-blue-500/10'}`}
                 >
                    {ann.isPinned && (
                       <div className="absolute top-0 right-0 p-8">
                          <Pin className="h-5 w-5 text-blue-500 rotate-45" />
                       </div>
                    )}
                    
                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                       <div className="shrink-0 space-y-4 text-center lg:text-left min-w-[120px]">
                          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all ${ann.isRead ? 'bg-bg-muted border-border-base text-fg-muted' : 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-500/20'}`}>
                             {ann.priority === 'urgent' ? <AlertCircle className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                             <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric' })}</p>
                          </div>
                       </div>

                       <div className="flex-1 space-y-6">
                          <div className="space-y-2">
                             <div className="flex items-center space-x-3">
                                <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight italic group-hover:text-blue-500 transition-colors">{ann.title}</h3>
                                {!ann.isRead && <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase animate-pulse">New Protocol</span>}
                             </div>
                             <p className="text-fg-primary text-sm font-medium leading-relaxed max-w-3xl">{ann.content}</p>
                          </div>
                          
                          <div className="flex items-center gap-6 pt-6 border-t border-border-base/50">
                             <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Verified Command</span>
                             </div>
                             {ann.readBy?.length > 0 && (
                                <div className="flex items-center space-x-2">
                                   <Bell className="h-4 w-4 text-blue-500" />
                                   <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{ann.readBy.length} Operatives Synced</span>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>

           {filtered.length === 0 && (
              <div className="py-40 text-center opacity-20 filter grayscale space-y-4">
                 <Megaphone className="h-20 w-20 mx-auto" />
                 <p className="text-xs font-black uppercase tracking-[0.4em]">No Active Transmissions Found</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default function AnnouncementsPage() {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianAnnouncements />
    </ProtectedRoute>
  );
}
