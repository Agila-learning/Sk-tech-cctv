"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  Hammer, 
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Phone
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const ServiceRequestsPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/bookings/admin/all');
      setRequests(data || []);
    } catch (error) {
      console.error("Load Requests Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'assigned': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status.toLowerCase() === filter;
    const matchesSearch = r.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 overflow-y-auto w-full">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,1)] animate-pulse"></div>
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Service Division: Monitoring</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Service <span className="text-fg-primary non-italic">Requests</span></h1>
            <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest italic">Installation & Maintenance Logistics</p>
          </div>

          <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base shadow-sm">
             {['all', 'pending', 'assigned', 'completed'].map((s) => (
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

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
           <div className="lg:col-span-8 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by client or deployment zone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-[2rem] pl-16 pr-8 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary shadow-sm"
              />
           </div>
           <div className="lg:col-span-4 flex items-center justify-between p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10">
              <div className="flex items-center space-x-4">
                 <div className="p-3 bg-blue-600 rounded-xl">
                    <Hammer className="h-5 w-5 text-white" />
                 </div>
                 <div>
                    <p className="text-lg font-black text-fg-primary leading-none tabular-nums">{requests.length}</p>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">Global Pipeline</p>
                 </div>
              </div>
              <button onClick={loadRequests} className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-bg-surface transition-all">
                 <Clock className="h-4 w-4 text-fg-muted" />
              </button>
           </div>
        </div>

        {/* Request Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
           <AnimatePresence>
              {filteredRequests.map((request, i) => (
                 <motion.div 
                   key={request._id}
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="glass-card rounded-[3.5rem] border border-border-base p-8 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden flex flex-col"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                       <span className={`px-4 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusStyle(request.status)}`}>
                          {request.status}
                       </span>
                       <button className="p-2 bg-bg-muted rounded-xl border border-border-base opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-fg-dim" />
                       </button>
                    </div>

                    <div className="space-y-6 flex-1 relative z-10">
                       <div className="space-y-2">
                          <h4 className="text-xl font-black text-fg-primary tracking-tighter uppercase italic">{request.customer?.name || "Unidentified Personnel"}</h4>
                          <div className="flex items-center space-x-2 text-fg-muted">
                             <Phone className="h-3 w-3" />
                             <span className="text-[10px] font-bold tracking-widest">{request.customer?.phone || "NO-SIGNAL"}</span>
                          </div>
                       </div>

                       <div className="space-y-4 pt-6 border-t border-border-subtle">
                          <div className="flex items-start space-x-4">
                             <div className="p-2 bg-bg-muted rounded-lg border border-border-base group-hover:border-blue-500/30 transition-all">
                                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                             </div>
                             <p className="text-[10px] font-bold text-fg-muted uppercase tracking-tight leading-relaxed">{request.address}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                             <div className="p-2 bg-bg-muted rounded-lg border border-border-base group-hover:border-blue-500/30 transition-all">
                                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                             </div>
                             <p className="text-[10px] font-black text-fg-primary uppercase tracking-[0.1em]">{new Date(request.scheduledDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                       </div>

                       {request.notes && (
                         <div className="p-4 bg-bg-muted/50 rounded-2xl border border-border-base border-dashed">
                             <div className="flex items-center space-x-2 mb-1">
                                <AlertCircle className="h-3 w-3 text-fg-dim" />
                                <span className="text-[8px] font-black text-fg-dim uppercase tracking-widest">Client Brief</span>
                             </div>
                             <p className="text-[10px] font-medium text-fg-muted italic leading-relaxed">{request.notes}</p>
                         </div>
                       )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-border-base relative z-10">
                       <button className="w-full py-4 bg-bg-muted border border-border-base rounded-[1.2rem] flex items-center justify-center space-x-3 group/btn hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-lg active:scale-95">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Specialist</span>
                          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>

           {filteredRequests.length === 0 && (
             <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-6 opacity-40">
                <Hammer className="h-20 w-20 text-fg-muted animate-bounce" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-fg-muted">Pipeline Empty: All Systems Go</p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default ServiceRequestsPage;
