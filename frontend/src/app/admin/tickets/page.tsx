"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Ticket as TicketIcon, Users, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, Inbox, Zap, Filter, Search,
  Menu, ChevronLeft, UserPlus, MessageSquare, Shield
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AdminTicketsPipeline = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, techsData] = await Promise.all([
        fetchWithAuth('/tickets/admin/all'),
        fetchWithAuth('/admin/technicians')
      ]);
      setTickets(ticketsData || []);
      setTechnicians(techsData || []);
    } catch (error) {
      console.error("Load Task Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateTicket = async (id: string, updates: any) => {
    try {
      await fetchWithAuth(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      loadData(); // Refresh to see changes and history logs
    } catch (error) {
      console.error("Update Ticket Error:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-fg-muted bg-bg-muted border-border-base';
    }
  };

  const columns = ['Open', 'In Progress', 'Resolved', 'Closed'];

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 overflow-x-hidden">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <button onClick={() => router.push('/admin')} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all">
              <ChevronLeft className="h-6 w-6 text-fg-primary" />
            </button>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">Support Grid: Level 04 Alpha</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic">Service <span className="non-italic text-fg-primary">Pipeline</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-80 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Intercept Protocol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-8 py-4 outline-none focus:border-blue-600 font-bold text-fg-primary"
                />
             </div>
             <button onClick={loadData} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20">
                <Zap className="h-6 w-6" />
             </button>
          </div>
        </header>

        {/* Pipeline Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 h-full">
          {columns.map(column => (
            <div key={column} className="flex flex-col h-full min-h-[70vh]">
              <div className="flex items-center justify-between mb-6 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    column === 'Open' ? 'bg-blue-500' :
                    column === 'In Progress' ? 'bg-yellow-500' :
                    column === 'Resolved' ? 'bg-green-500' : 'bg-fg-muted'
                  }`}></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-fg-primary">{column}</h3>
                </div>
                <span className="text-[10px] font-black text-fg-muted bg-bg-muted px-3 py-1 rounded-full border border-border-base">
                  {filteredTickets.filter(t => t.status === column).length}
                </span>
              </div>

              <div className="flex-1 bg-bg-muted/30 border border-dashed border-border-base rounded-[2.5rem] p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {filteredTickets.filter(t => t.status === column).map((ticket) => (
                  <motion.div 
                    key={ticket._id}
                    layoutId={ticket._id}
                    className="bg-card border border-border-base rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-muted rounded-lg transition-all">
                        <MoreVertical className="h-4 w-4 text-fg-muted" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-fg-primary uppercase tracking-tight mb-2 line-clamp-2">{ticket.subject}</h4>
                    <p className="text-[11px] text-fg-secondary font-medium mb-6 line-clamp-3 italic opacity-70">"{ticket.description}"</p>

                    <div className="space-y-4 pt-4 border-t border-border-base/50">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-blue-600/10 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-600">
                                {ticket.customer?.name?.[0] || 'U'}
                             </div>
                             <span className="text-[10px] font-bold text-fg-primary">{ticket.customer?.name || 'Anonymous User'}</span>
                          </div>
                          <span className="text-[8px] font-bold text-fg-muted uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                       </div>

                       <div className="space-y-3">
                          <div className="relative group/select">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted pointer-events-none" />
                            <select 
                              value={ticket.assignedTo?._id || ''}
                              onChange={(e) => updateTicket(ticket._id, { assignedTo: e.target.value })}
                              className="w-full bg-bg-muted border border-border-base rounded-xl pl-9 pr-6 py-2.5 text-[9px] font-black uppercase tracking-widest outline-none focus:border-blue-600 appearance-none cursor-pointer"
                            >
                               <option value="">Unassigned</option>
                               {technicians.map(tech => (
                                 <option key={tech._id} value={tech._id}>{tech.name}</option>
                               ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                             {columns.filter(c => c !== ticket.status).map(status => (
                               <button 
                                 key={status}
                                 onClick={() => updateTicket(ticket._id, { status })}
                                 className="py-2.5 bg-bg-muted hover:bg-blue-600 hover:text-white border border-border-base rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                               >
                                 Move to {status.split(' ')[0]}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}

                {filteredTickets.filter(t => t.status === column).length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center space-y-2 opacity-20">
                    <Inbox className="h-8 w-8 text-fg-muted" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Sector Clear</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// Add missing icon
const MoreVertical = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);

const AdminTicketsPage = () => {
  return (
    <ProtectedRoute allowedRoles={['admin', 'sub-admin']}>
      <AdminTicketsPipeline />
    </ProtectedRoute>
  );
};

export default AdminTicketsPage;
