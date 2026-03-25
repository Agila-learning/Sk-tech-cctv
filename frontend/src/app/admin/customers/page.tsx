"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Users, Search, Filter, Mail, Phone, MapPin, 
  Calendar, ShieldAlert, ArrowRight, Menu, Loader2,
  ChevronRight, MoreVertical, RefreshCcw, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/customers');
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleTriggerReset = async (email: string, id: string) => {
    try {
      setResetLoading(id);
      await fetchWithAuth('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setToast({ message: `Security: Reset link dispatched to ${email}`, type: 'success' });
      setTimeout(() => setToast(null), 5000);
    } catch (err: any) {
      setToast({ message: "System: Failed to trigger recovery flow.", type: 'error' });
    } finally {
      setResetLoading(null);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base group">
              <Menu className="h-6 w-6 text-fg-primary group-hover:text-blue-500 transition-colors" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Customer Intelligence</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">User <span className="text-blue-500 non-italic">Directory</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Manage and Audit Platform Registered Personnel</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96 group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
             <input 
               type="text"
               placeholder="Search by name, email, or signal..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-bg-muted border border-border-base rounded-[2.5rem] pl-16 pr-8 py-6 outline-none focus:border-blue-600 transition-all font-bold text-sm text-fg-primary placeholder:text-fg-dim shadow-inner"
             />
          </div>
        </header>

        {/* Success Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-12 right-12 z-[100] px-8 py-5 rounded-2xl shadow-2xl border flex items-center gap-4 ${
                toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
              } backdrop-blur-xl`}
            >
               <ShieldAlert className="h-5 w-5" />
               <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
           {filteredCustomers.map((customer, idx) => (
              <motion.div 
                key={customer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-10 rounded-[3.5rem] border border-border-base relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl bg-card"
              >
                 <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-all"></div>
                 
                 <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="w-24 h-24 bg-bg-muted rounded-[2rem] border border-border-base flex items-center justify-center text-4xl font-black text-blue-500 shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500 uppercase">
                       {customer.name?.charAt(0) || 'U'}
                    </div>
                    
                    <div className="flex-1 space-y-6 w-full">
                       <div className="flex justify-between items-start">
                          <div className="space-y-1">
                             <h3 className="text-2xl font-black text-fg-primary tracking-tight uppercase leading-none">{customer.name}</h3>
                             <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${customer.email ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                Registered Customer
                             </p>
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleTriggerReset(customer.email, customer._id)}
                               disabled={resetLoading === customer._id}
                               className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group/btn relative"
                             >
                                {resetLoading === customer._id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <RefreshCcw className="h-5 w-5 group-hover/btn:rotate-180 transition-transform duration-700" />
                                )}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-bg-surface border border-border-base rounded-lg text-[8px] font-black uppercase text-fg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                                   Reset Password
                                </div>
                             </button>
                             <button className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-fg-primary hover:text-bg-background transition-all shadow-sm">
                                <MoreVertical className="h-5 w-5" />
                             </button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-4 p-4 bg-bg-muted/50 rounded-2xl border border-border-base/50">
                             <Mail className="h-4 w-4 text-blue-500" />
                             <span className="text-xs font-bold text-fg-secondary truncate">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-bg-muted/50 rounded-2xl border border-border-base/50">
                             <Phone className="h-4 w-4 text-blue-500" />
                             <span className="text-xs font-bold text-fg-secondary">{customer.phone || 'NO_SIGNAL'}</span>
                          </div>
                       </div>

                       <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-border-subtle/30">
                          <div className="flex items-center gap-3">
                             <Calendar className="h-4 w-4 text-fg-dim" />
                             <span className="text-[10px] font-black text-fg-dim uppercase tracking-widest">Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col items-end">
                                <p className="text-[8px] font-black text-fg-muted uppercase tracking-widest">Active Status</p>
                                <p className="text-xs font-black text-green-500 uppercase tracking-tight">Verified Alpha</p>
                             </div>
                             <ArrowRight className="h-4 w-4 text-fg-muted group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           ))}
        </div>

        {filteredCustomers.length === 0 && !loading && (
           <div className="flex flex-col items-center justify-center py-40 space-y-8 opacity-40">
              <div className="w-24 h-24 bg-bg-muted rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-border-base">
                 <Users className="h-10 w-10 text-fg-muted" />
              </div>
              <div className="text-center space-y-2">
                 <p className="text-sm font-black text-fg-primary uppercase tracking-widest">No Intelligence Matches</p>
                 <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest leading-relaxed">Adjust your frequency to find matching personnel</p>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default CustomersPage;
