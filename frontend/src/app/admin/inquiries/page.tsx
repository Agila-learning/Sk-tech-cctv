"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { 
  Shield, Mail, Phone, Calendar, 
  MessageSquare, ChevronRight, Search,
  Filter, AlertCircle, CheckCircle2, Clock,
  Activity, ArrowRight, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminInquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/inquiries');
      setInquiries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInquiries = inquiries.filter(iq => {
    const matchesSearch = 
      iq.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      iq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iq.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || iq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-background transition-all duration-300 overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 flex flex-col h-screen relative bg-bg-muted/10 w-full overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-border-base bg-bg-primary flex items-center justify-between shadow-sm z-10 shrink-0">
           <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-bg-muted border border-border-base rounded-xl">
                 <Menu className="h-5 w-5 text-fg-primary" />
              </button>
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                 <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-fg-primary uppercase tracking-tight">Deployment <span className="text-blue-500">Inquiries</span></h2>
                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mt-0.5 italic">Help Center Intelligence Stream</p>
              </div>
           </div>

           <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest leading-none mb-1">Signal Strength</span>
                <div className="flex items-center gap-1">
                   <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                   <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                   <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                   <div className="w-1 h-3 bg-blue-600/30 rounded-full"></div>
                </div>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Inquiry List */}
          <div className="w-full lg:w-[450px] border-r border-border-base bg-bg-primary flex flex-col shrink-0">
             <div className="p-8 space-y-6">
                <div className="relative group">
                   <Search className="absolute top-5 left-6 h-4 w-4 text-fg-dim group-focus-within:text-blue-500 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Scan Intelligence..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-5 pl-14 text-[10px] font-black uppercase outline-none focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all text-fg-primary"
                   />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                   {['all', 'pending', 'in-progress', 'resolved'].map((s) => (
                      <button 
                         key={s}
                         onClick={() => setFilterStatus(s)}
                         className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                            filterStatus === s 
                               ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                               : 'bg-bg-muted text-fg-muted border-border-base hover:border-blue-600/30'
                         }`}
                      >
                         {s}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {loading ? (
                   Array(5).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse bg-bg-muted/50 h-32 rounded-[2rem]"></div>
                   ))
                ) : filteredInquiries.length === 0 ? (
                   <div className="py-20 text-center space-y-4 opacity-30">
                      <AlertCircle className="h-10 w-10 mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-widest italic">No Data Intercepted</p>
                   </div>
                ) : (
                   filteredInquiries.map((iq) => (
                      <button 
                         key={iq._id}
                         onClick={() => setSelectedInquiry(iq)}
                         className={`w-full p-6 text-left rounded-[2rem] border transition-all duration-300 group relative overflow-hidden ${
                            selectedInquiry?._id === iq._id 
                               ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-600/30' 
                               : 'bg-bg-muted/30 border-border-base hover:border-blue-600/30 text-fg-primary hover:bg-bg-muted'
                         }`}
                      >
                         <div className="flex justify-between items-start mb-4">
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
                               iq.status === 'resolved' ? 'bg-green-500/20 border-green-500/20' : 
                               iq.status === 'in-progress' ? 'bg-blue-500/20 border-blue-500/20' : 'bg-orange-500/20 border-orange-500/20'
                            }`}>
                               {iq.status}
                            </span>
                            <p className="text-[8px] font-bold opacity-60 uppercase">{new Date(iq.createdAt).toLocaleDateString()}</p>
                         </div>
                         <h4 className="text-xs font-black uppercase tracking-tight mb-2 line-clamp-1">{iq.subject || 'Standard Support Request'}</h4>
                         <p className={`text-[10px] font-medium line-clamp-2 leading-relaxed ${selectedInquiry?._id === iq._id ? 'text-white/80' : 'text-fg-muted'}`}>
                            {iq.message || 'No mission details provided.'}
                         </p>
                      </button>
                   ))
                )}
             </div>
          </div>

          {/* Details Pane */}
          <div className="flex-1 bg-bg-muted/20 relative overflow-hidden hidden lg:flex flex-col">
             {selectedInquiry ? (
                <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
                   <div className="max-w-3xl mx-auto w-full space-y-12">
                      {/* Detailed Header */}
                      <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20 text-white">
                               <MessageSquare className="h-8 w-8" />
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] mb-1">Status Code</p>
                               <span className={`text-xs font-black uppercase tracking-tighter italic ${
                                  selectedInquiry.status === 'resolved' ? 'text-green-500' : 'text-orange-500'
                               }`}>{selectedInquiry.status}</span>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <h1 className="text-4xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">
                               {selectedInquiry.subject || 'Support Mission'}
                            </h1>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[.3em]">ID: {selectedInquiry._id}</p>
                         </div>
                      </div>

                      {/* Contact Interface */}
                      <div className="grid grid-cols-2 gap-8">
                         {[
                            { icon: Mail, label: 'Origin Email', value: selectedInquiry.email },
                            { icon: Phone, label: 'Comms Link', value: selectedInquiry.phone || 'N/A' },
                            { icon: Calendar, label: 'Intercepted At', value: new Date(selectedInquiry.createdAt).toLocaleString() },
                            { icon: AlertCircle, label: 'Department', value: 'Technical Ops' }
                         ].map((item, i) => (
                            <div key={i} className="bg-bg-primary p-6 rounded-[2rem] border border-border-base shadow-sm group hover:scale-[1.02] transition-all">
                               <div className="flex items-center gap-4 mb-4">
                                  <div className="p-3 bg-bg-muted rounded-xl text-blue-500 border border-border-subtle group-hover:bg-blue-600 group-hover:text-white transition-all">
                                     <item.icon className="h-4 w-4" />
                                  </div>
                                  <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">{item.label}</p>
                               </div>
                               <p className="text-xs font-black text-fg-primary truncate">{item.value}</p>
                            </div>
                         ))}
                      </div>

                      {/* Directive Details */}
                      <div className="bg-bg-primary p-12 rounded-[3.5rem] border border-border-base shadow-lg relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/[0.03] blur-[100px] -z-10"></div>
                         <h3 className="text-sm font-black text-fg-primary uppercase tracking-widest mb-8 pb-4 border-b border-border-base flex items-center gap-3">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Mission Protocol Details
                         </h3>
                         <div className="prose prose-invert max-w-none">
                            <p className="text-base font-medium text-fg-muted leading-loose italic">
                               "{selectedInquiry.message}"
                            </p>
                         </div>
                      </div>

                      {/* Response Protocol */}
                      <div className="p-8 bg-blue-600 rounded-[3rem] shadow-2xl shadow-blue-600/30 flex items-center justify-between group cursor-pointer hover:translate-y-[-5px] transition-all">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner">
                               <Mail className="h-7 w-7 text-white" />
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-white uppercase tracking-tighter">Initiate Reply Protocol</h4>
                               <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Connect with user via secure channel</p>
                            </div>
                         </div>
                         <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all">
                            <ArrowRight className="h-6 w-6 text-white" />
                         </div>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                   <div className="p-10 bg-bg-muted rounded-[3.5rem] border border-border-subtle shadow-xl hover:scale-105 transition-all">
                      <Shield className="h-24 w-24 text-fg-dim opacity-10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight italic">Waiting for <span className="text-blue-500">Node Selection</span></h3>
                      <p className="text-fg-muted font-medium text-sm">Select an intelligence report from the left roster to view full mission parameters.</p>
                   </div>
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminInquiriesPage = () => {
   return (
     <ProtectedRoute allowedRoles={['admin']}>
       <AdminInquiries />
     </ProtectedRoute>
   );
};

export default AdminInquiriesPage;
