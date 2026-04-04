"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { User, Package, Calendar, ChevronRight, Activity, MapPin, Phone, Home, Mail, Star, Clock, MessageSquare, Shield, CheckCircle2, FileText, Download, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { NotificationSection } from '@/components/NotificationSection';

const statusColor: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
  delivered:  'bg-green-500/10 text-green-400 border border-green-500/20',
  pending:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  assigned:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  accepted:   'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  in_progress:'bg-purple-500/10 text-purple-400 border border-purple-500/20',
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleOrder, setRescheduleOrder] = useState<any>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', reason: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) loadOrders();
    // Auto-dismiss LocationPrompt if it's annoying in dashboard
    localStorage.setItem('locationPromptDismissed', 'true');
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, bookingsData, inquiriesData, reportsData] = await Promise.all([
        fetchWithAuth('/orders/my-orders'),
        fetchWithAuth('/bookings/my'),
        fetchWithAuth('/support/my'),
        fetchWithAuth('/orders/my-reports')
      ]);
      
      const combined = [
        ...(Array.isArray(ordersData) ? ordersData.map(o => ({ ...o, dashType: 'order' })) : []),
        ...(Array.isArray(bookingsData) ? bookingsData.map(b => ({ ...b, dashType: 'booking' })) : [])
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(combined);
      setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderProfile = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-2xl sm:text-3xl font-black text-white shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{user.name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            <span className="inline-flex items-center mt-2 gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Star className="h-3 w-3" /> Member
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Phone, label: 'Phone', value: user.phone || 'Not provided' },
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Home, label: 'Address', value: user.address || 'Not provided' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/5">
              <Icon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-white font-bold text-sm mt-0.5 break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-blue-400' },
          { label: 'Completed', value: orders.filter(o => ['completed','delivered'].includes(o.status)).length, icon: Star, color: 'text-green-400' },
          { label: 'Active', value: orders.filter(o => ['pending','assigned','accepted','in_progress'].includes(o.status)).length, icon: Activity, color: 'text-yellow-400' },
          { label: 'Installation', value: orders.filter(o => o.installationRequired).length, icon: Clock, color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center">
            <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Recent Bookings</p>
          <button onClick={() => setActiveTab('bookings')} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center">
            <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-bold">No orders yet.</p>
            <Link href="/products" className="mt-3 inline-block text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300">Browse Products →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => (
              <div key={order._id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-slate-400 text-xs font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor[order.status] || statusColor.pending}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderBookings = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xl font-black text-white uppercase tracking-tighter">All Bookings</p>
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{orders.length} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-12 text-center">
          <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-white mb-2">No Bookings Found</h4>
          <p className="text-slate-400 text-sm">You haven't placed any orders yet.</p>
          <Link href="/products" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">
            Shop Now
          </Link>
        </div>
      ) : (
        orders.map(order => (
          <div key={order._id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 hover:border-blue-500/30 transition-colors">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Booking</span>
                  <span className="text-sm font-black text-blue-400">#{order._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor[order.status] || statusColor.pending}`}>
                {order.status?.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Products</p>
                {order.products?.map((item: any, idx: number) => (
                  <p key={idx} className="text-sm font-bold text-white">{item.quantity}× {item.product?.name || 'Product'}</p>
                ))}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount</p>
                <p className="text-lg font-black text-white">₹{order.totalAmount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Technician</p>
                <p className="text-sm font-bold text-white">{order.technician?.name || 'Not assigned yet'}</p>
                {order.technician?.phone && <p className="text-xs text-slate-500 font-bold">{order.technician.phone}</p>}
              </div>
            </div>

            {order.installationRequired && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-blue-400 text-xs font-black uppercase tracking-widest">
                  <Activity className="h-3 w-3" /> Installation Active
                </span>
                <div className="flex gap-4">
                  {['pending', 'assigned', 'accepted'].includes(order.status) && (
                    <button 
                      onClick={() => setRescheduleOrder(order)}
                      className="text-[10px] font-black text-yellow-500 uppercase tracking-widest hover:text-yellow-400 flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" /> Reschedule
                    </button>
                  )}
                  <Link href={`/tracking?order=${order._id}`} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Track <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Page Content – pushed down below fixed navbar via padding */}
      <div className="relative z-10 min-h-screen pt-48 pb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10">

          {/* Page heading */}
          <h2 className="text-2xl font-black tracking-tight uppercase mb-8 text-fg-primary">
            Customer <span className="text-blue-500">Dashboard</span>
          </h2>

          {/* Main two-column layout */}
          <div className="flex flex-col md:flex-row gap-12 items-start text-fg-primary">

            {/* Sidebar nav */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="flex flex-col gap-3">
                {[
                  { key: 'profile',   label: 'My Profile',  icon: User    },
                  { key: 'bookings',  label: 'Orders',   icon: Package },
                  { key: 'reports',   label: 'Professional Reports', icon: FileText },
                  { key: 'security',  label: 'Security', icon: Lock },
                  { key: 'notifications', label: 'Operations Center', icon: Activity },
                  { key: 'support',   label: 'Help & Support', icon: MessageSquare },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all w-full text-left ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                        : 'bg-bg-muted text-fg-muted hover:bg-bg-surface hover:text-fg-primary border border-border-base'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Content area */}
            <div className="flex-1 min-w-0 w-full">
              {activeTab === 'profile'  && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Profile Header */}
                  <div className="rounded-3xl border border-border-base bg-bg-surface p-5 md:p-8 shadow-sm">
                    <div className="flex flex-wrap items-center gap-6 mb-8">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-2xl sm:text-3xl font-black text-white shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-fg-primary">{user.name}</h2>
                        <p className="text-fg-muted text-sm mt-0.5">{user.email}</p>
                        <span className="inline-flex items-center mt-2 gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-widest">
                          <Star className="h-3 w-3" /> Member
                        </span>
                      </div>
                    </div>
            
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon: Phone, label: 'Phone', value: user.phone || 'Not provided' },
                        { icon: Mail, label: 'Email', value: user.email },
                        { icon: Home, label: 'Address', value: user.address || 'Not provided' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-4 p-5 rounded-2xl bg-bg-muted/50 border border-border-base">
                          <Icon className="h-4 w-4 text-blue-500 mt-1 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-fg-primary font-bold text-sm break-words">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
            
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-blue-500' },
                      { label: 'Completed', value: orders.filter(o => ['completed','delivered'].includes(o.status)).length, icon: Star, color: 'text-green-500' },
                      { label: 'Active', value: orders.filter(o => ['pending','assigned','accepted','in_progress'].includes(o.status)).length, icon: Activity, color: 'text-yellow-500' },
                      { label: 'Installation', value: orders.filter(o => o.installationRequired).length, icon: Clock, color: 'text-purple-500' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-2xl border border-border-base bg-bg-surface p-6 text-center shadow-sm">
                        <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                        <p className="text-2xl font-black text-fg-primary">{stat.value}</p>
                        <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
            
                  {/* Recent bookings preview */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-sm font-black text-fg-muted uppercase tracking-widest">Recent Bookings</p>
                      <button onClick={() => setActiveTab('bookings')} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                        View All <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-2xl border border-border-base bg-bg-muted/30 p-12 text-center">
                        <Package className="h-10 w-10 text-fg-dim mx-auto mb-4" />
                        <p className="text-fg-muted text-sm font-bold">No orders yet.</p>
                        <Link href="/products" className="mt-4 inline-block text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700">Browse Products →</Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map(order => (
                          <div key={order._id} className="rounded-2xl border border-border-base bg-bg-surface p-6 flex items-center justify-between gap-4 shadow-sm hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-fg-primary font-black text-sm uppercase tracking-tight">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-fg-muted text-xs font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor[order.status] || statusColor.pending}`}>
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'reports' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Professional <span className="text-blue-500 non-italic">Reports</span></h3>
                       <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] mt-2">Certified Site Service Records</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                     {reports.length > 0 ? (
                       reports.map((report) => (
                         <div key={report._id} className="p-5 md:p-8 bg-bg-surface rounded-[2.5rem] lg:rounded-[3rem] border border-border-base hover:border-blue-600/30 transition-all shadow-sm group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                               <FileText className="h-16 w-16" />
                            </div>
                            <div className="flex justify-between items-start mb-6">
                               <div>
                                  <div className="flex items-center gap-3 mb-2">
                                     <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Protocol ID</span>
                                     <span className="text-sm font-black text-blue-600">#{report._id.slice(-6).toUpperCase()}</span>
                                  </div>
                                  <p className="text-xl font-black text-fg-primary uppercase tracking-tight">{report.serviceType}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{new Date(report.createdAt).toLocaleDateString()}</p>
                                  <span className="inline-block mt-2 px-4 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">Official Record</span>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border-subtle">
                               <div className="space-y-4">
                                  <div>
                                     <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-2">Subject Action</p>
                                     <p className="text-sm text-fg-primary font-bold italic">"{report.problemIdentified}"</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-2">Tactical Execution</p>
                                     <p className="text-sm text-fg-primary font-bold">{report.workPerformed}</p>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <div className="p-4 bg-bg-muted/50 rounded-2xl border border-border-base flex items-center gap-4">
                                     <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                                        {report.technicianId?.name?.[0] || 'T'}
                                     </div>
                                     <div>
                                        <p className="text-[8px] font-black text-fg-muted uppercase tracking-widest">Assigned Tech</p>
                                        <p className="text-sm font-black text-fg-primary uppercase tracking-tight">{report.technicianId?.name || 'Authorized Personnel'}</p>
                                     </div>
                                  </div>
                                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                     <Download className="h-4 w-4" /> Download Certificate
                                  </button>
                                </div>
                             </div>
                          </div>
                       ))
                     ) : (
                       <div className="p-20 text-center bg-bg-muted/30 rounded-[4rem] border border-dashed border-border-base group">
                          <FileText className="h-12 w-12 text-fg-dim mx-auto mb-6 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                          <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] italic mb-6 leading-loose">No professional service reports have been <br/> generated for your sector yet.</p>
                          <Link href="/support" className="inline-block px-8 py-3 bg-bg-surface border border-border-base rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-blue-500 transition-all">Request Assistance</Link>
                       </div>
                     )}
                   </div>
                </motion.div>
              )}
              {activeTab === 'bookings' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xl font-black text-fg-primary uppercase tracking-tighter">All Bookings</p>
                    <span className="text-[10px] text-fg-muted font-black uppercase tracking-widest">{orders.length} total</span>
                  </div>
            
                  {loading ? (
                    <div className="flex justify-center py-20">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-3xl border border-border-base bg-bg-muted/30 p-16 text-center">
                      <Package className="h-12 w-12 text-fg-dim mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-fg-primary mb-2">No Bookings Found</h4>
                      <p className="text-fg-muted text-sm">You haven't placed any orders yet.</p>
                      <Link href="/products" className="mt-6 inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        Shop Now
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order._id} className="rounded-[2.5rem] lg:rounded-3xl border border-border-base bg-bg-surface p-5 md:p-8 shadow-sm hover:border-blue-500/30 transition-all group">
                          <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Booking ID</span>
                                <span className="text-lg font-black text-blue-600 italic">#{order._id.slice(-6).toUpperCase()}</span>
                              </div>
                              <div className="text-sm font-bold text-fg-muted flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusColor[order.status] || statusColor.pending}`}>
                              {order.status?.replace('_', ' ')}
                            </span>
                          </div>
            
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-border-subtle">
                            <div className="space-y-3">
                              <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Inventory</p>
                              {order.products?.map((item: any, idx: number) => (
                                <p key={idx} className="text-sm font-black text-fg-primary">{item.quantity}× {item.product?.name || 'Product'}</p>
                              ))}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-3">Total Value</p>
                              <p className="text-2xl font-black text-fg-primary tracking-tighter">₹{order.totalAmount?.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-3">Service Agent</p>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center text-blue-600 border border-border-base font-black text-xs">
                                  {order.technician?.name?.[0] || 'A'}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-fg-primary leading-tight">{order.technician?.name || 'Waiting for Technician'}</p>
                                  {order.technician?.phone && <p className="text-[10px] text-fg-muted font-bold tracking-widest uppercase">{order.technician.phone}</p>}
                                </div>
                              </div>
                            </div>
                          </div>
            
                          {order.installationRequired && (
                            <div className="mt-8 pt-6 border-t border-border-subtle flex flex-wrap items-center justify-between gap-4">
                              <span className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10">
                                <Activity className="h-3.5 w-3.5 animate-pulse" /> Installation Support Active
                              </span>
                              <Link href={`/tracking?order=${order._id}`} className="px-6 py-3 bg-bg-muted border border-border-base text-fg-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-bg-surface hover:border-blue-500 transition-all flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Live Tracking <ChevronRight className="h-4 w-4" />
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
               {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Security <span className="text-blue-500 non-italic">Protocol</span></h3>
                       <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] mt-2">Manage your access credentials</p>
                     </div>
                   </div>

                   <div className="p-8 md:p-12 bg-bg-surface rounded-[2.5rem] lg:rounded-[3rem] border border-border-base shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Lock className="h-32 w-32" />
                     </div>
                     
                     <div className="max-w-md space-y-8 relative z-10">
                       <div className="space-y-2">
                         <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight">Update Password</h4>
                         <p className="text-sm text-fg-muted font-medium">Ensure your account is protected with a strong, unique password.</p>
                       </div>

                       <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">Current Password</label>
                            <input 
                              type="password" 
                              value={passwordData.currentPassword}
                              onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-500 font-bold text-fg-primary" 
                              placeholder="••••••••"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">New Password</label>
                            <input 
                              type="password" 
                              value={passwordData.newPassword}
                              onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-500 font-bold text-fg-primary" 
                              placeholder="••••••••"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={passwordData.confirmPassword}
                              onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-500 font-bold text-fg-primary" 
                              placeholder="••••••••"
                            />
                         </div>

                         <button 
                           disabled={passwordLoading}
                           onClick={async () => {
                             if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) return alert("All fields required");
                             if (passwordData.newPassword !== passwordData.confirmPassword) return alert("Passwords do not match");
                             if (passwordData.newPassword.length < 6) return alert("Password must be at least 6 characters");
                             
                             try {
                               setPasswordLoading(true);
                               await fetchWithAuth('/auth/change-password', {
                                 method: 'POST',
                                 body: JSON.stringify({
                                   currentPassword: passwordData.currentPassword,
                                   newPassword: passwordData.newPassword
                                 })
                               });
                               alert('Security: Password update successful');
                               setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                             } catch (e: any) {
                               alert(e.message || 'Failed to update password');
                             } finally {
                               setPasswordLoading(false);
                             }
                           }}
                           className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                         >
                           {passwordLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Shield className="h-4 w-4" />}
                           Update Password
                         </button>
                       </div>
                     </div>
                   </div>
                </motion.div>
              )}
              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                   <div className="p-8 md:p-12 bg-bg-surface rounded-[2.5rem] lg:rounded-[3rem] border border-border-base shadow-sm">
                      <NotificationSection />
                   </div>
                </motion.div>
              )}
              {activeTab === 'support' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Technical <span className="text-blue-500 non-italic">Support</span></h3>
                    <Link href="/support" className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-6 py-2.5 rounded-full uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all">New Support Ticket</Link>
                  </div>
                  
                  <div className="space-y-4">
                    {inquiries.length > 0 ? (
                      inquiries.map((iq) => (
                        <div key={iq._id} className="p-5 md:p-8 bg-bg-surface rounded-[2.5rem] lg:rounded-[3rem] border border-border-base hover:border-blue-600/30 transition-all group overflow-hidden relative shadow-sm">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Shield className="h-16 w-16" />
                           </div>
                           <div className="flex justify-between items-start mb-6">
                              <span className={`px-5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                                 iq.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                 iq.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              }`}>
                                 {iq.status}
                              </span>
                              <p className="text-[10px] font-bold text-fg-muted uppercase tracking-[0.2em]">{new Date(iq.createdAt).toLocaleDateString()}</p>
                           </div>
                           <div className="space-y-2">
                             <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight">{iq.subject}</h4>
                             <p className="text-sm text-fg-secondary font-medium italic opacity-80 leading-relaxed">"{iq.message}"</p>
                           </div>
                           {iq.status === 'resolved' && (
                              <div className="mt-6 pt-6 border-t border-border-subtle flex items-center space-x-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                                 <CheckCircle2 className="h-4 w-4" />
                                  <span>Request Resolved</span>
                              </div>
                           )}
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center bg-bg-muted/30 rounded-[4rem] border border-dashed border-border-base group">
                         <MessageSquare className="h-12 w-12 text-fg-dim mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
                         <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] italic mb-6">No technical inquiries logged in your sector</p>
                         <Link href="/support" className="inline-block px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                            Create Support Ticket
                         </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </div>


      <Footer />
      
      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleOrder && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setRescheduleOrder(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 30 }} 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-bg-surface border border-border-base rounded-[2.5rem] lg:rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8 overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/[0.03] blur-[100px] pointer-events-none" />
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-yellow-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                     <Clock className="h-10 w-10 text-yellow-500" />
                  </div>
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Schedule <span className="text-yellow-500 non-italic">Update</span></h3>
                  <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest italic">Requesting installation update</p>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">New Date</label>
                     <input 
                        type="date" 
                        value={rescheduleData.date}
                        onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})}
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-yellow-500 font-bold text-fg-primary" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">Reason for Update</label>
                     <textarea 
                        rows={3}
                        value={rescheduleData.reason}
                        placeholder="Provide reason for rescheduling..."
                        onChange={e => setRescheduleData({...rescheduleData, reason: e.target.value})}
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-yellow-500 font-bold text-fg-primary resize-none" 
                     />
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button onClick={() => setRescheduleOrder(null)} className="flex-1 py-5 bg-bg-muted border border-border-base rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-hover transition-all">Abort</button>
                  <button 
                    onClick={async () => {
                      if (!rescheduleData.date || !rescheduleData.reason) return alert("All fields required");
                      try {
                        await fetchWithAuth(`/orders/reschedule/${rescheduleOrder._id}`, {
                          method: 'POST',
                          body: JSON.stringify(rescheduleData)
                        });
                        alert('Reschedule request submitted to Command Center');
                        setRescheduleOrder(null);
                        loadOrders();
                      } catch (e: any) { alert(e.message); }
                    }}
                    className="flex-1 py-5 bg-yellow-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-600/20 hover:bg-yellow-700 transition-all"
                  >
                    Submit Request
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
