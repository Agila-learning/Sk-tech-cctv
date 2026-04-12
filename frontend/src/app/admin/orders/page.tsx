"use client";
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShoppingCart, Package, User, Clock, CheckCircle, AlertCircle, IndianRupee, 
         ArrowRight, Trash2, X, MapPin, Activity, Menu, ChevronLeft, 
         UserCheck, AlertTriangle, RefreshCw, Zap, Plus, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineOrderModal from '@/components/admin/OfflineOrderModal';
import AdminNavbar from '@/components/admin/AdminNavbar';

// ─── Time slots for scheduling ────────────────────────────────────────────────
const TIME_SLOTS = [
  { label: '9:00 AM – 11:00 AM', start: '09:00', end: '11:00' },
  { label: '11:00 AM – 1:00 PM', start: '11:00', end: '13:00' },
  { label: '1:00 PM – 3:00 PM',  start: '13:00', end: '15:00' },
  { label: '3:00 PM – 5:00 PM',  start: '15:00', end: '17:00' },
  { label: '5:00 PM – 7:00 PM',  start: '17:00', end: '19:00' },
];

const STATUS_DOT: Record<string, string> = {
  available: '🟢', busy: '🟠', booked: '🔴', on_leave: '⚫',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  // Availability-aware assignment state
  const [availTechnicians, setAvailTechnicians] = useState<any[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignSlot, setAssignSlot] = useState(TIME_SLOTS[0]);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [assignWarning, setAssignWarning] = useState('');

  const router = useRouter();

  const loadOrders = async () => {
    try {
      const [orderData] = await Promise.all([
        fetchWithAuth('/orders/all'),
      ]);
      setOrders(orderData);
    } catch (error) {
      console.error("Load Orders Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  // Auto-load availability when date or slot changes in the modal
  const loadAvailability = useCallback(async () => {
    if (!isModalOpen) return;
    setAvailLoading(true);
    setSelectedTech(null);
    setAssignWarning('');
    try {
      const data = await fetchWithAuth(`/availability/technicians?date=${assignDate}&startTime=${assignSlot.start}&endTime=${assignSlot.end}`);
      setAvailTechnicians(data || []);
    } catch {
      setAvailTechnicians([]);
    } finally {
      setAvailLoading(false);
    }
  }, [isModalOpen, assignDate, assignSlot]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setAssignSuccess(false);
    setShowReassign(false);
    setSelectedTech(null);
    setAssignWarning('');
    try {
      const wf = await fetchWithAuth(`/orders/workflow/${order._id}`);
      setWorkflow(wf);
    } catch {
      setWorkflow(null);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await fetchWithAuth(`/admin/orders/${selectedOrder._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadOrders();
      setIsModalOpen(false);
    } catch {
      alert("Status update failed.");
    }
  };

  // Availability-aware assignment
  const handleAssignTechnician = async () => {
    if (!selectedTech) { setAssignWarning('Please select a technician.'); return; }
    if (selectedTech.status === 'on_leave') {
      setAssignWarning(`⚠️ This technician is on leave. Please select another.`);
      return;
    }
    setIsAssigning(true);
    setAssignWarning('');
    try {
      await fetchWithAuth('/availability/assign', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder._id,
          technicianId: selectedTech._id,
          date: assignDate,
          startTime: assignSlot.start,
          endTime: assignSlot.end,
        }),
      });
      setAssignSuccess(true);
      setTimeout(() => { loadOrders(); setIsModalOpen(false); setAssignSuccess(false); }, 2000);
    } catch (err: any) {
      setAssignWarning(err.message || 'Assignment failed. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await fetchWithAuth(`/orders/${id}`, { method: 'DELETE' });
      loadOrders();
      setIsModalOpen(false);
    } catch {
      alert("Deletion failed.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':   return 'bg-green-600 text-white border-green-700 font-bold';
      case 'delivered':   return 'bg-green-500 text-white border-green-600 font-bold';
      case 'in_progress': return 'bg-purple-600 text-white border-purple-700 font-bold';
      case 'assigned':    return 'bg-blue-600 text-white border-blue-700 font-bold';
      case 'confirmed':   return 'bg-cyan-600 text-white border-cyan-700 font-bold';
      case 'pending':     return 'bg-orange-500 text-white border-orange-600 font-bold';
      case 'cancelled':   return 'bg-red-600 text-white border-red-700 font-bold';
      case 'on_hold':     return 'bg-yellow-500 text-slate-900 border-yellow-600 font-bold';
      default:            return 'bg-slate-500 text-white border-slate-600 font-bold';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen bg-background">
        <AdminNavbar />
        
        <div className="p-6 md:p-12 space-y-16">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-primary-blue/10 border border-primary-blue/20 rounded-2xl hover:bg-primary-blue/20 transition-all">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <button onClick={() => router.push('/admin')} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group">
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-primary-blue/10 border border-primary-blue/20 rounded-full w-fit">
                <div className="w-1 h-1 bg-primary-blue rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-primary-blue uppercase tracking-widest">Order Logistics</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Order <span className="text-primary-blue">History</span></h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-bold uppercase tracking-widest">Global Order Monitor</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => setIsOfflineModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-primary-blue to-primary-teal text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary-blue/20 flex items-center gap-3 w-full sm:w-auto transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Offline Order
            </button>
            <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base overflow-x-auto whitespace-nowrap status-scroll-container max-w-[calc(100vw-3rem)] scrollbar-hide">
              {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all status-scroll-item whitespace-nowrap ${filter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="glass-card rounded-3xl md:rounded-[3.5rem] border border-border-base relative overflow-hidden">
          <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-blue-600/20 scrollbar-track-transparent">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-border-base bg-bg-muted/50">
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Order ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Customer Name</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Source</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Category</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Total</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] text-right whitespace-nowrap pr-12">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-base">
                {orders.filter(o => filter === 'all' || o.status.toLowerCase() === filter).map((order: any) => (
                  <tr key={order._id} className="hover:bg-bg-muted/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-fg-primary tracking-widest">#{order._id.toString().slice(-8).toUpperCase()}</span>
                      <p className="text-[10px] font-bold text-fg-muted mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-bg-muted rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-fg-muted" />
                        </div>
                        <span className="text-sm font-bold text-fg-primary">{order.customer?.name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.orderType === 'offline' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                        {order.orderType || 'Online'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-secondary">
                        {order.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-fg-primary tracking-tighter">
                      ₹{order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right pr-8 sticky right-0 bg-bg-card/95 backdrop-blur-xl border-l-[3px] border-border-base/80 group-hover:bg-bg-muted/95 transition-colors z-20">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewOrder(order)} 
                          title="View Details"
                          className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-blue-600 shadow-sm"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order._id)} 
                          title="Delete Order"
                          className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all text-red-600 shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Order Detail & Assignment Modal ────────────────────────── */}
        <AnimatePresence>
          {isModalOpen && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card w-full max-w-4xl rounded-[3rem] border border-border-base overflow-hidden relative z-10 flex flex-col md:flex-row shadow-2xl max-h-[90vh]"
              >
                {/* Left panel — Order details */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-fg-primary tracking-tight uppercase">Task Assignment & Evidence</h3>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono mt-1">Order #{(selectedOrder?._id || '').toString().slice(-8).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-bg-muted rounded-xl hover:bg-bg-card transition-colors">
                      <X className="h-5 w-5 text-fg-muted" />
                    </button>
                  </div>

                  {/* Customer + Slot info */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-5 bg-bg-muted/50 rounded-2xl border border-border-base space-y-3">
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer</h4>
                      <p className="text-sm font-bold text-fg-primary">{selectedOrder.customer?.name}</p>
                      <p className="text-xs font-medium text-fg-secondary">{selectedOrder.customer?.email}</p>
                    </div>
                    <div className="p-5 bg-bg-muted/50 rounded-2xl border border-border-base space-y-3">
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Installation Slot</h4>
                      <p className="text-sm font-bold text-fg-primary">
                        {selectedOrder.scheduledDate 
                          ? new Date(selectedOrder.scheduledDate).toLocaleDateString('en-IN')
                          : 'Not scheduled'}
                      </p>
                      {selectedOrder.scheduledSlot && (
                        <p className="text-xs font-black text-blue-500">{selectedOrder.scheduledSlot}</p>
                      )}
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-3 mb-8">
                    <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Products</h4>
                    {selectedOrder.products?.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-bg-card border border-border-base rounded-2xl">
                        <div className="flex items-center space-x-4">
                          <Package className="h-5 w-5 text-fg-muted" />
                          <span className="text-sm font-bold text-fg-primary">{p.product?.name}</span>
                        </div>
                        <span className="text-sm font-black text-blue-600">×{p.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Assign Technician Section ───────────────────────── */}
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      Technician Assignment
                    </h4>

                    {selectedOrder.technician && !showReassign ? (
                      // Already assigned
                      <div className="p-5 bg-blue-600/5 border border-blue-600/20 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">
                            {selectedOrder.technician.name?.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-fg-primary">{selectedOrder.technician.name}</p>
                            <p className="text-[10px] font-black text-blue-600 uppercase">Assigned Technician</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowReassign(true)}
                          className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Change
                        </button>
                      </div>
                    ) : assignSuccess ? (
                      <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-2">
                        <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                        <p className="text-sm font-black text-green-400 uppercase tracking-tight">Assigned Successfully!</p>
                        <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest">Slot is now blocked.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Date + Slot selectors */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Date</label>
                            <input
                              type="date"
                              value={assignDate}
                              onChange={e => setAssignDate(e.target.value)}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl px-4 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Time Slot</label>
                            <select
                              value={assignSlot.label}
                              onChange={e => setAssignSlot(TIME_SLOTS.find(s => s.label === e.target.value) || TIME_SLOTS[0])}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl px-4 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
                            >
                              {TIME_SLOTS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Technician list */}
                        {availLoading ? (
                          <div className="flex items-center gap-3 p-5 bg-bg-muted rounded-2xl border border-border-base">
                            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-xs font-black text-fg-muted uppercase tracking-widest">Checking availability...</span>
                          </div>
                        ) : availTechnicians.length === 0 ? (
                          <div className="p-5 bg-bg-muted rounded-2xl border border-border-base text-center">
                            <p className="text-xs font-black text-fg-muted uppercase tracking-widest">No technicians found</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {availTechnicians.map(tech => (
                              <button
                                key={tech._id}
                                onClick={() => { setSelectedTech(tech); setAssignWarning(''); }}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                                  selectedTech?._id === tech._id
                                    ? 'border-blue-500 bg-blue-600/10'
                                    : 'border-border-base bg-bg-muted/50 hover:border-blue-500/30'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{STATUS_DOT[tech.status] || '🟢'}</span>
                                    <div>
                                      <p className="text-sm font-bold text-fg-primary">{tech.name}</p>
                                      <p className="text-[10px] font-bold text-fg-muted">{tech.zone || 'No zone'} • {tech.todayJobCount} job{tech.todayJobCount !== 1 ? 's' : ''} today</p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                    tech.status === 'available' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    tech.status === 'busy'     ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    tech.status === 'booked'   ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  }`}>
                                    {tech.status === 'on_leave' ? 'On Leave' : tech.status.charAt(0).toUpperCase() + tech.status.slice(1)}
                                  </span>
                                </div>
                                {tech.reason && (
                                  <p className="text-[9px] text-fg-muted mt-2 pl-9">{tech.reason}</p>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Warning message */}
                        {assignWarning && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-red-400">{assignWarning}</p>
                          </div>
                        )}

                        {/* Assign button */}
                        <button
                          onClick={handleAssignTechnician}
                          disabled={isAssigning || !selectedTech}
                          className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isAssigning
                            ? <><RefreshCw className="h-4 w-4 animate-spin" /><span>Assigning...</span></>
                            : <><Zap className="h-4 w-4" /><span>Assign Technician</span></>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right panel — Status updates */}
                <div className="w-full md:w-80 bg-bg-muted/50 p-6 md:p-10 border-t md:border-t-0 md:border-l border-border-base space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Update Status</h4>
                    <div className="space-y-3">
                      {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleUpdateStatus(val)}
                          className={`w-full py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            selectedOrder.status === val
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                              : 'bg-bg-card border-border-base text-fg-muted hover:border-blue-500'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Work Evidence ────────────────────────── */}
                  <div className="space-y-4 pt-6 border-t border-border-base">
                    <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                       <Activity className="h-4 w-4 text-blue-500" />
                       Work Evidence
                    </h4>
                    <div className="space-y-4">
                      {['start', 'inProgress', 'completion'].map((stage) => {
                        const proof = selectedOrder.workProofs?.[stage];
                        return (
                          <div key={stage} className="p-4 bg-bg-muted/50 rounded-2xl border border-border-base space-y-3">
                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-fg-muted">
                              <span>{stage} Proof</span>
                              {proof?.timestamp && <span>{new Date(proof.timestamp).toLocaleTimeString()}</span>}
                            </div>
                            {proof?.url ? (
                              <div className="space-y-2">
                                <img src={proof.url} className="w-full h-32 object-cover rounded-xl" alt={`${stage} proof`} />
                                {proof.location && (
                                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-fg-muted">
                                    <MapPin className="h-2.5 w-2.5 text-blue-500" />
                                    <span>{proof.location.lat.toFixed(4)}, {proof.location.lng.toFixed(4)}</span>
                                  </div>
                                )}
                                {proof.remarks && (
                                  <p className="text-[10px] text-fg-secondary italic font-medium">"{proof.remarks}"</p>
                                )}
                              </div>
                            ) : (
                              <div className="h-20 flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-xl text-fg-muted/30">
                                <CheckCircle className="h-6 w-6 opacity-20 mb-2" />
                                <span className="text-[10px] font-bold">AWAITING UPLOAD</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {workflow && (
                    <div className="space-y-4 pt-6 border-t border-border-base">
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Workflow Progress</h4>
                      {[
                        { label: 'Assigned', done: workflow.stages?.assigned?.status },
                        { label: 'Accepted', done: workflow.stages?.accepted?.status },
                        { label: 'In Progress', done: workflow.stages?.in_progress?.status },
                        { label: 'Completed', done: workflow.stages?.completed?.status },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${step.done ? 'bg-green-500 border-green-500 text-white' : 'bg-bg-muted border-border-base text-fg-muted'}`}>
                            {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          </div>
                          <span className={`text-xs font-bold ${step.done ? 'text-fg-primary' : 'text-fg-muted'}`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-border-base">
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                    <button
                      onClick={() => handleDeleteOrder(selectedOrder._id)}
                      className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Order</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <OfflineOrderModal 
          isOpen={isOfflineModalOpen}
          onClose={() => setIsOfflineModalOpen(false)}
          onSuccess={loadOrders}
        />
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
