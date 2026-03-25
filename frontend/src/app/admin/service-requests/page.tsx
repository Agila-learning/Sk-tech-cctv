"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Calendar, MapPin, User, Clock, Search, Filter, ArrowRight, Hammer, 
  MoreHorizontal, CheckCircle2, AlertCircle, Phone, ChevronLeft, Menu, Zap
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const ServiceRequestsPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const router = useRouter();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [reqData, techData] = await Promise.all([
        fetchWithAuth('/bookings/admin/all'),
        fetchWithAuth('/admin/technicians')
      ]);
      setRequests(reqData || []);
      setTechnicians(techData || []);
    } catch (error) {
      console.error("Load Requests Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAssignTechnician = async (technicianId: string) => {
    if (!selectedRequest) return;
    try {
      setIsAssigning(true);
      await fetchWithAuth(`/admin/orders/${selectedRequest._id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId })
      });
      setIsAssignModalOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      alert("Failed to assign technician");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/admin/auto-assign', { method: 'POST' });
      alert(res.message);
      loadRequests();
    } catch (error) {
      alert("Auto-assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'assigned': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status?.toLowerCase() === filter;
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
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-fg-primary group-hover:scale-110 transition-transform" />
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
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,1)] animate-pulse"></div>
                <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Service Division: Monitoring</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Service <span className="text-fg-primary non-italic">Requests</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest italic leading-none">Installation & Maintenance Logistics</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <button onClick={handleAutoAssign} className="flex items-center space-x-3 px-8 py-4 bg-blue-600/10 border border-blue-500/20 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">
               <Zap className="h-4 w-4" />
               <span>Optimized Assignment</span>
            </button>
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
          </div>
        </header>

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
           <div className="lg:col-span-4 flex items-center justify-between p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 shadow-lg">
              <div className="flex items-center space-x-4">
                 <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                    <Hammer className="h-5 w-5 text-white" />
                 </div>
                 <div>
                    <p className="text-xl font-black text-fg-primary leading-none tabular-nums italic tracking-tighter">{requests.length}</p>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Grid Pipeline</p>
                 </div>
              </div>
              <button onClick={loadRequests} className="p-3.5 bg-bg-muted border border-border-base rounded-xl hover:bg-bg-surface transition-all hover:rotate-180 duration-700">
                 <Clock className="h-4 w-4 text-fg-muted" />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
           <AnimatePresence>
              {filteredRequests.map((request, i) => (
                 <motion.div 
                   key={request._id}
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="glass-card rounded-[3.5rem] border border-border-base p-8 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden flex flex-col shadow-xl"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                       <span className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(request.status)} shadow-sm`}>
                          {request.status}
                       </span>
                       <button 
                         onClick={() => { setSelectedRequest(request); setIsAssignModalOpen(true); }}
                         className="p-4 bg-bg-muted rounded-2xl border border-border-base transition-all hover:bg-blue-600 hover:text-white shadow-lg active:scale-95"
                         title="Specialist Control"
                       >
                          <MoreHorizontal className="h-5 w-5" />
                       </button>
                    </div>

                    <div className="space-y-6 flex-1 relative z-10">
                       <div className="space-y-2">
                          <h4 className="text-2xl font-black text-fg-primary tracking-tighter uppercase italic leading-tight">{request.customer?.name || "Unidentified Personnel"}</h4>
                          <div className="flex items-center space-x-3 text-fg-muted">
                             <Phone className="h-3.5 w-3.5 text-blue-500/50" />
                             <span className="text-[11px] font-bold tracking-widest">{request.customer?.phone || "OFFLINE"}</span>
                          </div>
                       </div>

                       <div className="space-y-5 pt-8 border-t border-border-base/50">
                          <div className="flex items-start space-x-5">
                             <div className="p-2.5 bg-bg-muted rounded-[1.2rem] border border-border-base group-hover:border-blue-500/30 transition-all shadow-sm">
                                <MapPin className="h-4 w-4 text-red-500" />
                             </div>
                             <p className="text-[11px] font-black text-fg-muted uppercase tracking-tight leading-relaxed">{request.address}</p>
                          </div>
                          <div className="flex items-center space-x-5">
                             <div className="p-2.5 bg-bg-muted rounded-[1.2rem] border border-border-base group-hover:border-blue-500/30 transition-all shadow-sm">
                                <Calendar className="h-4 w-4 text-blue-500" />
                             </div>
                             <p className="text-[11px] font-black text-fg-primary uppercase tracking-[0.2em]">
                                {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending Schedule'}
                             </p>
                          </div>
                       </div>

                       {request.notes && (
                         <div className="p-5 bg-blue-600/5 rounded-[2rem] border border-blue-500/20 border-dashed">
                             <div className="flex items-center space-x-3 mb-2">
                                <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Protocol Brief</span>
                             </div>
                             <p className="text-[10px] font-medium text-fg-muted italic leading-relaxed">{request.notes}</p>
                         </div>
                       )}
                    </div>

                    <div className="mt-10 pt-10 border-t border-border-base relative z-10">
                       <button 
                         onClick={() => { setSelectedRequest(request); setIsAssignModalOpen(true); }}
                         className="w-full py-5 bg-bg-muted border border-border-base rounded-[1.5rem] flex items-center justify-center space-x-4 group/btn hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-2xl shadow-black/5 active:scale-95"
                       >
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Deploy Specialist</span>
                          <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>
      </main>

      {/* Assignment Modal */}
      <AnimatePresence>
         {isAssignModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 30 }}
                 className="relative w-full max-w-lg bg-card border border-card-border rounded-[3.5rem] p-12 lg:p-16 shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10"></div>
                  
                  <h3 className="text-4xl font-black text-fg-primary uppercase tracking-tighter italic mb-2">Deploy <span className="text-blue-500 non-italic">Specialist</span></h3>
                  <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest mb-12">Target Node: #{selectedRequest?._id.slice(-6)}</p>
                  
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] ml-2">Available Personnel</label>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                           {technicians.length > 0 ? technicians.map((tech) => (
                              <button 
                                key={tech._id}
                                onClick={() => handleAssignTechnician(tech._id)}
                                disabled={isAssigning}
                                className="w-full flex items-center justify-between p-6 bg-bg-muted/50 border border-border-base rounded-[2rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group"
                              >
                                 <div className="flex items-center space-x-5">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg group-hover:scale-110 transition-transform">{tech.name[0]}</div>
                                    <div className="text-left">
                                       <p className="text-sm font-black text-fg-primary uppercase tracking-tight">{tech.name}</p>
                                       <p className="text-[9px] font-bold text-fg-muted uppercase tracking-widest">{tech.location || 'Remote Grid'}</p>
                                    </div>
                                 </div>
                                 <ArrowRight className="h-5 w-5 text-fg-dim group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                              </button>
                           )) : (
                             <div className="py-10 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">No Specialists Logged</div>
                           )}
                        </div>
                     </div>
                     
                     <div className="pt-6 flex gap-6">
                        <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-5 border border-border-base rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-bg-muted transition-all">Abort Deployment</button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceRequestsPage;
