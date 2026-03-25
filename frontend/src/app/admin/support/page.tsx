"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  MessageSquare, User, Mail, Clock, Search, Filter, CheckCircle2, 
  Clock3, AlertCircle, ChevronRight, ShieldCheck, Send, MoreVertical, ChevronLeft, Menu
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const AdminSupportInquiries = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/support');
      setInquiries(data || []);
    } catch (error) {
      console.error("Load Inquiries Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      // Assuming a patch endpoint exists or we'll add one if needed
      // For now, we'll just simulate it or update the backend if it lacks patch
      setInquiries(inquiries.map(iq => iq._id === id ? { ...iq, status } : iq));
      // await fetchWithAuth(`/support/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const filteredInquiries = inquiries.filter(iq => {
    const matchesFilter = filter === 'all' || iq.status === filter;
    const matchesSearch = iq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          iq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          iq.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 overflow-y-auto w-full">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/admin')}
              className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
              title="Back to Command Center"
            >
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">Support Intel: Active Intercept</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Technical <span className="text-fg-primary non-italic">Inquiries</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest italic leading-none">User Support & Protocol Assistance</p>
            </div>
          </div>

          <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base">
             {['all', 'pending', 'in-progress', 'resolved'].map((s) => (
                <button 
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                >
                  {s}
                </button>
             ))}
          </div>
        </header>

        {/* Global Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           {[
             { label: 'Total Inquiries', value: inquiries.length, icon: MessageSquare, color: 'text-blue-500' },
             { label: 'Pending Response', value: inquiries.filter(i => i.status === 'pending').length, icon: AlertCircle, color: 'text-orange-500' },
             { label: 'Resolved Today', value: inquiries.filter(i => i.status === 'resolved').length, icon: ShieldCheck, color: 'text-green-500' }
           ].map((stat, i) => (
             <div key={i} className="glass-card p-8 rounded-[3rem] border border-border-base flex items-center space-x-6">
                <div className={`p-4 rounded-2xl bg-bg-muted ${stat.color}`}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-3xl font-black text-fg-primary tracking-tighter">{stat.value}</p>
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{stat.label}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Action Bar */}
        <div className="relative mb-12 group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Search by name, email, or subject..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-bg-muted border border-border-base rounded-[2rem] pl-16 pr-8 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
           />
        </div>

        {/* Inquiry Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-32">
           <AnimatePresence>
              {filteredInquiries.map((iq, i) => (
                 <motion.div 
                   key={iq._id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.05 }}
                   className="glass-card rounded-[3.5rem] border border-border-base p-10 hover:border-blue-500/30 transition-all duration-500 group"
                 >
                    <div className="flex justify-between items-start mb-8">
                       <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                             <span className={`px-4 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusBadge(iq.status)}`}>
                               {iq.status}
                             </span>
                             <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{iq.type || 'General'}</span>
                          </div>
                       </div>
                       <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{new Date(iq.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                       <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center font-black text-blue-600 text-xl">
                             {iq.name[0]}
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-fg-primary uppercase tracking-tighter">{iq.name}</h4>
                             <p className="text-sm font-medium text-fg-muted lowercase">{iq.email}</p>
                          </div>
                       </div>

                       <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base space-y-3">
                          <h5 className="text-[11px] font-black text-fg-primary uppercase tracking-widest">{iq.subject}</h5>
                          <p className="text-sm text-fg-secondary leading-relaxed font-medium italic">"{iq.message}"</p>
                       </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-border-base flex items-center justify-between">
                       <div className="flex space-x-2">
                          <button 
                            onClick={() => updateStatus(iq._id, 'in-progress')}
                            className="px-6 py-3 bg-bg-muted border border-border-base rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                          >
                             Mark In-Progress
                          </button>
                          <button 
                            onClick={() => updateStatus(iq._id, 'resolved')}
                            className="px-6 py-3 bg-bg-muted border border-border-base rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"
                          >
                             Mark Resolved
                          </button>
                       </div>
                       <button className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
                          <Send className="h-4 w-4" />
                       </button>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>

           {filteredInquiries.length === 0 && (
             <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-6 opacity-30">
                <MessageSquare className="h-20 w-20 text-fg-muted animate-bounce" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-fg-muted text-center">No Inquiries Detected in Sector</p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default AdminSupportInquiries;
