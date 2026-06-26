"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Users, Search, Filter, Mail, Phone, MapPin, 
  Calendar, ShieldAlert, ArrowRight, Menu, Loader2,
  ChevronRight, MoreVertical, RefreshCcw, ExternalLink, X, Navigation, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Edit/Delete State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', alternatePhone: '', address: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Add Customer State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', alternatePhone: '', address: '', notes: '', lat: '', lng: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer account?")) return;
    try {
      await fetchWithAuth(`/admin/customers/${id}`, { method: 'DELETE' });
      setToast({ message: "Customer account successfully purged.", type: 'success' });
      loadCustomers();
    } catch (err) {
      setToast({ message: "Failed to delete customer.", type: 'error' });
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    setActionLoading(true);
    try {
      await fetchWithAuth(`/admin/customers/${editingCustomer._id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      setToast({ message: "Customer profile updated successfully.", type: 'success' });
      setShowEditModal(false);
      loadCustomers();
    } catch (err) {
      setToast({ message: "Update failed.", type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await fetchWithAuth('/admin/customers', {
        method: 'POST',
        body: JSON.stringify(addForm)
      });
      setToast({ message: "New customer successfully registered.", type: 'success' });
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', alternatePhone: '', address: '', notes: '', lat: '', lng: '' });
      loadCustomers();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to add customer.", type: 'error' });
    } finally {
      setAddLoading(false);
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
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Customer Intelligence Hub</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">User <span className="text-blue-500 non-italic">Directory</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Manage Online, Offline & Manual Billing Clients</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
               <input 
                 type="text"
                 placeholder="Search by name, email, or signal..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-bg-muted border border-border-base rounded-[2.5rem] pl-16 pr-8 py-6 outline-none focus:border-blue-600 transition-all font-bold text-sm text-fg-primary placeholder:text-fg-dim shadow-inner"
               />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 whitespace-nowrap"
            >
              <Users className="h-5 w-5" />
              <span>Add Customer</span>
            </button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 mb-16 items-stretch">
           {filteredCustomers.map((customer, idx) => (
              <motion.div 
                key={customer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-10 rounded-[3.5rem] border border-border-base relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl bg-card flex flex-col h-full justify-between"
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
                                 <span className={`w-2 h-2 rounded-full ${customer.email ? 'bg-green-500' : 'bg-purple-500'}`}></span>
                                 {customer.customerType || 'Registered Customer'}
                              </p>
                           </div>
                           <div className="flex gap-2">
                              {customer.phone && (
                                <a 
                                  href={`tel:${customer.phone.replace(/\D/g, '')}`}
                                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500 hover:text-white text-green-500 transition-all shadow-sm flex items-center justify-center"
                                  title="Call Customer"
                                >
                                   <Phone className="h-5 w-5" />
                                </a>
                              )}
                              {customer.email && customer.customerType === 'Registered Customer' && (
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
                              )}
                              {customer.customerType === 'Registered Customer' && (
                                <button 
                                  onClick={() => {
                                    setEditingCustomer(customer);
                                    setEditForm({ 
                                      name: customer.name, 
                                      email: customer.email, 
                                      phone: customer.phone || '',
                                      alternatePhone: customer.alternatePhone || '',
                                      address: customer.address || '',
                                      notes: customer.notes || ''
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                  title="Edit Profile"
                                >
                                   <Users className="h-5 w-5" />
                                </button>
                              )}
                              {customer.customerType === 'Registered Customer' && (
                                <button 
                                  onClick={() => handleDeleteCustomer(customer._id)}
                                  className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                  title="Delete Customer"
                                >
                                   <X className="h-5 w-5" />
                                </button>
                              )}
                           </div>
                        </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-4 p-4 bg-bg-muted/50 rounded-2xl border border-border-base/50">
                             <Mail className="h-4 w-4 text-blue-500" />
                             <span className="text-xs font-bold text-fg-secondary truncate">{customer.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-bg-muted/50 rounded-2xl border border-border-base/50">
                             <Phone className="h-4 w-4 text-blue-500" />
                             <span className="text-xs font-bold text-fg-secondary">{customer.phone || 'NO_SIGNAL'}</span>
                          </div>
                       </div>
                       
                       {customer.address && (
                          <div className="flex items-center gap-4 p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                             <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                             <span className="text-xs font-bold text-fg-secondary truncate">{customer.address}</span>
                          </div>
                       )}

                       <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-border-subtle/30">
                          <div className="flex items-center gap-3">
                             <Calendar className="h-4 w-4 text-fg-dim" />
                             <span className="text-[10px] font-black text-fg-dim uppercase tracking-widest">Added {new Date(customer.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button 
                             onClick={() => { setSelectedCustomer(customer); setShowDetailsModal(true); }}
                             className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl transition-all group/details"
                          >
                             <span className="text-[10px] font-black uppercase tracking-widest">View Full Details</span>
                             <ArrowRight className="h-4 w-4 group-hover/details:translate-x-1 transition-all" />
                          </button>
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

        {/* View Full Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedCustomer && (
            <div 
               className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl text-left"
               onClick={() => setShowDetailsModal(false)}
            >
               <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 onClick={(e) => e.stopPropagation()}
                 className="relative w-full max-w-4xl bg-card border border-border-base rounded-[3.5rem] p-8 md:p-14 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh] space-y-10 custom-scrollbar"
               >
                 <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] -z-10"></div>
                 
                 <div className="flex justify-between items-start border-b border-border-base pb-8">
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                          <span className="px-4 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                             {selectedCustomer.customerType || 'Registered Customer'}
                          </span>
                       </div>
                       <h2 className="text-4xl md:text-5xl font-black text-fg-primary uppercase tracking-tighter">{selectedCustomer.name}</h2>
                       <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">Customer Intelligence Profile & Comprehensive Operations History</p>
                    </div>
                    <button 
                       onClick={() => setShowDetailsModal(false)} 
                       className="p-4 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all text-fg-dim hover:text-fg-primary shadow-sm"
                    >
                       <X className="h-6 w-6" />
                    </button>
                 </div>

                 {/* Key Contact Information */}
                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-fg-muted uppercase tracking-widest">Contact Signal Protocol</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Primary Phone</span>
                             {selectedCustomer.phone && (
                                <a href={`tel:${selectedCustomer.phone.replace(/\D/g, '')}`} className="px-3 py-1 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-400 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                   Call Direct
                                </a>
                             )}
                          </div>
                          <p className="text-lg font-bold text-fg-primary">{selectedCustomer.phone || 'N/A'}</p>
                       </div>

                       <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Alternate Phone</span>
                             {selectedCustomer.alternatePhone && (
                                <a href={`tel:${selectedCustomer.alternatePhone.replace(/\D/g, '')}`} className="px-3 py-1 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-400 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                   Call Direct
                                </a>
                             )}
                          </div>
                          <p className="text-lg font-bold text-fg-primary">{selectedCustomer.alternatePhone || 'N/A'}</p>
                       </div>

                       <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base space-y-3">
                          <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest block">Email Address</span>
                          <p className="text-lg font-bold text-fg-primary truncate">{selectedCustomer.email || 'N/A'}</p>
                       </div>
                    </div>
                 </div>

                 {/* Physical & Live Location */}
                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-fg-muted uppercase tracking-widest">Location & Address Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base space-y-3">
                          <div className="flex items-center gap-2 text-blue-500">
                             <MapPin className="h-5 w-5" />
                             <span className="text-xs font-black uppercase tracking-widest">Typed Physical Address</span>
                          </div>
                          <p className="text-sm font-bold text-fg-secondary leading-relaxed">{selectedCustomer.address || 'No physical address typed manually.'}</p>
                       </div>

                       <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 space-y-3">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-blue-500">
                                <Navigation className="h-5 w-5 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">Live GPS / Choosen Location</span>
                             </div>
                             {(selectedCustomer.liveLocation?.lat || selectedCustomer.locationDetails?.gpsLocation?.lat) && (
                                <a 
                                   href={`https://www.google.com/maps/search/?api=1&query=${selectedCustomer.liveLocation?.lat || selectedCustomer.locationDetails?.gpsLocation?.lat},${selectedCustomer.liveLocation?.lng || selectedCustomer.locationDetails?.gpsLocation?.lng}`} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="px-3 py-1 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-500 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                                >
                                   <span>Google Maps</span> <ExternalLink className="h-3 w-3" />
                                </a>
                             )}
                          </div>
                          {(selectedCustomer.liveLocation?.lat || selectedCustomer.locationDetails?.gpsLocation?.lat) ? (
                             <div className="space-y-1">
                                <p className="text-sm font-bold text-fg-secondary">
                                   Lat: {selectedCustomer.liveLocation?.lat || selectedCustomer.locationDetails?.gpsLocation?.lat}, Lng: {selectedCustomer.liveLocation?.lng || selectedCustomer.locationDetails?.gpsLocation?.lng}
                                </p>
                                <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">Accurate satellite transmission lock</p>
                             </div>
                          ) : (
                             <p className="text-sm font-bold text-fg-muted italic">No live location telemetry recorded.</p>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Administrative Notes */}
                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-fg-muted uppercase tracking-widest">Administrative Notes</h3>
                    <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base">
                       <p className="text-sm font-bold text-fg-secondary whitespace-pre-wrap leading-relaxed">{selectedCustomer.notes || 'No notes added for this customer profile.'}</p>
                    </div>
                 </div>

                 {/* Combined Order & Invoice History with Warranty Status */}
                 <div className="space-y-6">
                    <h3 className="text-xs font-black text-fg-muted uppercase tracking-widest">Combined Order, Service & Manual Billing History</h3>
                    
                    <div className="space-y-4">
                       {/* Orders */}
                       {selectedCustomer.orders?.map((order: any) => {
                          // Calculate warranty status dynamically
                          let warrantyStatusText = "Under Warranty (Free Rework)";
                          let isExpired = false;
                          if (order.createdAt) {
                             const monthsElapsed = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
                             if (monthsElapsed > 12) {
                                warrantyStatusText = "Warranty Expired (Chargeable Service)";
                                isExpired = true;
                             }
                          }

                          return (
                             <div key={order._id} className="p-6 bg-bg-muted/30 rounded-3xl border border-border-base space-y-4 hover:border-blue-500/20 transition-all">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                   <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                         <FileText className="h-4 w-4 text-blue-500" />
                                         <span className="text-sm font-black text-fg-primary uppercase tracking-wider">Order #{order.shortId || order._id.toString().slice(-6)}</span>
                                         <span className="px-3 py-1 bg-bg-surface border border-border-base rounded-xl text-[9px] font-black uppercase tracking-widest text-fg-muted">
                                            {order.orderType || 'Online'} Order
                                         </span>
                                      </div>
                                      <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Created {new Date(order.createdAt).toLocaleDateString()}</p>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                         isExpired 
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                                      }`}>
                                         {isExpired ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                         <span>{warrantyStatusText}</span>
                                      </span>
                                      <span className="text-xl font-black text-purple-500">₹{order.totalAmount || 0}</span>
                                   </div>
                                </div>
                                {order.notes && (
                                   <p className="text-xs font-bold text-fg-dim border-t border-border-subtle/20 pt-2">Notes: {order.notes}</p>
                                )}
                             </div>
                          );
                       })}

                       {/* Invoices */}
                       {selectedCustomer.invoices?.map((invoice: any) => {
                          let warrantyStatusText = "Under Warranty (Free Rework)";
                          let isExpired = false;
                          if (invoice.createdAt) {
                             const monthsElapsed = (new Date().getTime() - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
                             if (monthsElapsed > 12) {
                                warrantyStatusText = "Warranty Expired (Chargeable Service)";
                                isExpired = true;
                             }
                          }

                          return (
                             <div key={invoice._id} className="p-6 bg-bg-muted/30 rounded-3xl border border-border-base space-y-4 hover:border-purple-500/20 transition-all">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                   <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                         <FileText className="h-4 w-4 text-purple-500" />
                                         <span className="text-sm font-black text-fg-primary uppercase tracking-wider">Invoice #{invoice.invoiceNumber || invoice._id.toString().slice(-6)}</span>
                                         <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-purple-500">
                                            Manual Billing
                                         </span>
                                      </div>
                                      <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Created {new Date(invoice.createdAt).toLocaleDateString()}</p>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                         isExpired 
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                                      }`}>
                                         {isExpired ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                         <span>{warrantyStatusText}</span>
                                      </span>
                                      <span className="text-xl font-black text-purple-500">₹{invoice.totalAmount || 0}</span>
                                   </div>
                                </div>
                                {invoice.notes && (
                                   <p className="text-xs font-bold text-fg-dim border-t border-border-subtle/20 pt-2">Notes: {invoice.notes}</p>
                                )}
                             </div>
                          );
                       })}

                       {(!selectedCustomer.orders?.length && !selectedCustomer.invoices?.length) && (
                          <p className="text-xs font-bold text-fg-muted italic p-6 bg-bg-muted/30 rounded-3xl border border-border-base text-center">
                             No order or manual billing records associated with this profile.
                          </p>
                       )}
                    </div>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-card border border-border-base rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
              >
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-6 md:top-8 right-6 md:right-8 p-3 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                   <X className="h-5 w-5" />
                </button>

                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Add <span className="text-blue-500 italic">Customer</span></h2>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] mt-2">Manual client onboarding protocol</p>
                  </div>

                  <form onSubmit={handleAddCustomer} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Full Name *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Anand Kumar"
                            value={addForm.name}
                            onChange={e => setAddForm({...addForm, name: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Email Address</label>
                          <input 
                            type="email" 
                            placeholder="e.g. anand@example.com"
                            value={addForm.email}
                            onChange={e => setAddForm({...addForm, email: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Primary Phone *</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="10-digit mobile number"
                            value={addForm.phone}
                            onChange={e => setAddForm({...addForm, phone: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Alternate Phone</label>
                          <input 
                            type="tel" 
                            placeholder="Optional backup number"
                            value={addForm.alternatePhone}
                            onChange={e => setAddForm({...addForm, alternatePhone: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Live GPS Latitude</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 13.0827" 
                            value={addForm.lat}
                            onChange={e => setAddForm({...addForm, lat: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Live GPS Longitude</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 80.2707" 
                            value={addForm.lng}
                            onChange={e => setAddForm({...addForm, lng: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Physical Address</label>
                       <textarea 
                         placeholder="Complete billing / installation address..."
                         value={addForm.address}
                         onChange={e => setAddForm({...addForm, address: e.target.value})}
                         className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner h-20 custom-scrollbar"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Administrative Notes</label>
                       <textarea 
                         placeholder="Customer preferences, priority status, hardware specifics..."
                         value={addForm.notes}
                         onChange={e => setAddForm({...addForm, notes: e.target.value})}
                         className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner h-20 custom-scrollbar"
                       />
                    </div>

                    <button 
                      type="submit" 
                      disabled={addLoading}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                       <span>Register Customer</span>
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-card border border-border-base rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
              >
                <button
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-6 md:top-8 right-6 md:right-8 p-3 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                   <X className="h-5 w-5" />
                </button>

                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Edit <span className="text-blue-500 italic">Customer</span></h2>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] mt-2">Adjust personnel protocol details</p>
                  </div>

                  <form onSubmit={handleUpdateCustomer} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Full Name</label>
                          <input 
                            type="text" 
                            value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Email Address</label>
                          <input 
                            type="email" 
                            value={editForm.email}
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Primary Phone</label>
                          <input 
                            type="text" 
                            value={editForm.phone}
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Alternate Phone</label>
                          <input 
                            type="text" 
                            value={editForm.alternatePhone}
                            onChange={e => setEditForm({...editForm, alternatePhone: e.target.value})}
                            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Physical Address</label>
                       <textarea 
                         value={editForm.address}
                         onChange={e => setEditForm({...editForm, address: e.target.value})}
                         className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner h-20 custom-scrollbar"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Administrative Notes</label>
                       <textarea 
                         value={editForm.notes}
                         onChange={e => setEditForm({...editForm, notes: e.target.value})}
                         className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner h-20 custom-scrollbar"
                       />
                    </div>

                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                       <span>Commit Changes</span>
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CustomersPage;
