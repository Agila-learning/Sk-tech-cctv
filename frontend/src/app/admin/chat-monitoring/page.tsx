"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { fetchWithAuth } from '@/utils/api';
import { Search, Shield, Filter, Download, Paperclip, Clock, CheckCircle, Menu, User, UserCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatMonitoringPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'technician', 'customer'

  useEffect(() => {
    const loadAllChats = async () => {
      try {
        const data = await fetchWithAuth('/chat/admin/all');
        setMessages(data || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAllChats();
  }, []);

  const filteredMessages = messages.filter(m => {
    const sName = typeof m.sender === 'object' ? m.sender?.name?.toLowerCase() || '' : '';
    const rName = typeof m.receiver === 'object' ? m.receiver?.name?.toLowerCase() || '' : '';
    const orderId = typeof m.orderId === 'object' ? m.orderId?._id?.toLowerCase() || '' : '';
    const txt = (m.content || '').toLowerCase();
    
    const matchesSearch = sName.includes(search.toLowerCase()) || rName.includes(search.toLowerCase()) || txt.includes(search.toLowerCase()) || orderId.includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterRole !== 'all') {
      const sRole = typeof m.sender === 'object' ? m.sender?.role : null;
      const rRole = typeof m.receiver === 'object' ? m.receiver?.role : m.receiverRole;
      if (sRole !== filterRole && rRole !== filterRole) return false;
    }
    
    return true;
  });

  const exportChat = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Sender,Receiver,Order ID,Message\n" + 
      filteredMessages.map(m => {
         const sender = typeof m.sender === 'object' ? m.sender?.name : 'System';
         const receiver = typeof m.receiver === 'object' ? m.receiver?.name : (m.receiverRole || 'System');
         const date = new Date(m.createdAt).toLocaleString();
         const order = m.orderId ? (typeof m.orderId === 'object' ? m.orderId._id : m.orderId) : 'N/A';
         const content = `"${(m.content || '').replace(/"/g, '""')}"`;
         return `${date},${sender},${receiver},${order},${content}`;
      }).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chat_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'sub-admin']}>
      <div className="min-h-screen bg-bg-base flex">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative lg:ml-[280px]">
          <AdminNavbar />
          
          <main className="flex-1 overflow-hidden flex flex-col p-6">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h1 className="text-2xl font-black text-fg-primary uppercase tracking-tighter flex items-center gap-2">
                     <Shield className="h-6 w-6 text-red-500" /> Global Chat Monitor
                  </h1>
                  <p className="text-xs font-bold text-fg-muted uppercase tracking-widest mt-1">Supervise all communications across the platform</p>
               </div>
               <button 
                 onClick={exportChat}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center gap-2"
               >
                 <Download className="w-4 h-4" /> Export CSV
               </button>
            </div>

            <div className="glass-card flex-1 rounded-3xl border border-border-base flex flex-col overflow-hidden bg-bg-surface">
               <div className="p-4 border-b border-border-base bg-bg-muted/50 flex flex-wrap gap-4 items-center">
                  <div className="flex-1 relative min-w-[200px]">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                     <input 
                       type="text" 
                       placeholder="Search messages, names, or order ID..." 
                       value={search}
                       onChange={e => setSearch(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-colors"
                     />
                  </div>
                  <div className="flex items-center gap-2">
                     <Filter className="w-4 h-4 text-fg-muted" />
                     <select 
                       value={filterRole} 
                       onChange={e => setFilterRole(e.target.value)}
                       className="bg-bg-base border border-border-base rounded-xl px-4 py-2.5 text-xs font-bold text-fg-primary outline-none focus:border-indigo-500"
                     >
                        <option value="all">All Roles</option>
                        <option value="technician">Technicians</option>
                        <option value="customer">Customers</option>
                     </select>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {loading ? (
                     <div className="h-full flex items-center justify-center">
                        <span className="text-xs font-black text-fg-muted uppercase tracking-widest animate-pulse">Loading Communications...</span>
                     </div>
                  ) : filteredMessages.length === 0 ? (
                     <div className="h-full flex items-center justify-center flex-col text-fg-muted">
                        <Shield className="w-12 h-12 mb-4 opacity-20" />
                        <span className="text-xs font-black uppercase tracking-widest">No communications found</span>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {filteredMessages.map((msg: any) => (
                           <div key={msg._id} className="p-4 bg-bg-base rounded-2xl border border-border-base flex flex-col gap-2 relative group hover:border-indigo-500/50 transition-colors">
                              <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-indigo-500 flex items-center gap-1">
                                       <UserCheck className="w-3 h-3" /> {typeof msg.sender === 'object' ? msg.sender?.name : 'System'} ({typeof msg.sender === 'object' ? msg.sender?.role : 'system'})
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-fg-muted" />
                                    <span className="text-teal-500 flex items-center gap-1">
                                       <User className="w-3 h-3" /> {typeof msg.receiver === 'object' ? msg.receiver?.name : (msg.receiverRole || 'System')}
                                    </span>
                                 </div>
                                 <span className="text-[9px] font-bold text-fg-muted tracking-widest">{new Date(msg.createdAt).toLocaleString()}</span>
                              </div>
                              
                              <p className="text-sm font-medium text-fg-primary mt-1">{msg.content}</p>

                              {msg.orderId && (
                                 <div className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-500/10 px-2 py-1 rounded-md mt-2 w-fit">
                                    Order #{typeof msg.orderId === 'object' ? msg.orderId._id.slice(-6) : msg.orderId.slice(-6)}
                                 </div>
                              )}

                              {msg.attachments && msg.attachments.length > 0 && (
                                 <div className="flex gap-2 mt-2">
                                    {msg.attachments.map((att: any, i: number) => (
                                       <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg text-[9px] font-black hover:bg-indigo-500/20 transition-colors">
                                          <Paperclip className="w-3 h-3" /> {att.filename}
                                       </a>
                                    ))}
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ChatMonitoringPage;
