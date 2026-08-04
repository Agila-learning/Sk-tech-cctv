"use client";
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShoppingCart, Package, User, Clock, CheckCircle, AlertCircle, IndianRupee, 
         ArrowRight, Trash2, X, MapPin, Activity, Menu, ChevronLeft, 
         UserCheck, AlertTriangle, RefreshCw, Zap, Plus, Ticket, Mic, Maximize2, XCircle, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineOrderModal from '@/components/admin/OfflineOrderModal';
import AdminNavbar from '@/components/admin/AdminNavbar';
import useAutoRefresh from '@/hooks/useAutoRefresh';

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
  const [adminNotes, setAdminNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Availability-aware assignment state
  const [availTechnicians, setAvailTechnicians] = useState<any[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignSlot, setAssignSlot] = useState(TIME_SLOTS[0]);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [assignWarning, setAssignWarning] = useState('');

  const router = useRouter();

  const loadOrders = useCallback(async () => {
    try {
      const [orderData] = await Promise.all([
        fetchWithAuth('/orders/all'),
      ]);
      // Ensure orderData is an array before sorting (prevents UI crashes if API returns an error object)
      const fetchedOrders = orderData?.orders || orderData || [];
      const validOrders = Array.isArray(fetchedOrders) ? fetchedOrders : [];
      const sortedOrders = validOrders.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedOrders);
    } catch (error: any) {
      console.error("Load Orders Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useAutoRefresh(loadOrders, 300000);

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

  const handleAutoAssign = async (orderId: string) => {
    try {
      await fetchWithAuth(`/orders/${orderId}/auto-assign`, {
        method: 'POST',
      });
      loadOrders();
      alert('Technician auto-assigned successfully!');
    } catch (error: any) {
      console.error('Error auto-assigning technician:', error);
      alert(error.message || 'Failed to auto-assign technician');
    }
  };

  const handleManualAssign = async (orderId: string, techId: string) => {
    try {
      await fetchWithAuth(`/availability/assign`, {
        method: 'POST',
        body: JSON.stringify({ 
          orderId, 
          technicianId: techId, 
          date: new Date().toISOString(),
          startTime: '09:00',
          endTime: '18:00',
          timeToComplete: 2 
        })
      });

      // Send global notifications for manual assignment
      await fetchWithAuth('/notifications', { method: 'POST', body: JSON.stringify({
        title: `New Order Assigned (Order #${orderId.slice(-6)})`,
        message: `You have been assigned a new service order #${orderId.slice(-6)}.`,
        role: 'technician', orderId, type: 'task_assigned', userId: techId
      })});

      await fetchWithAuth('/notifications', { method: 'POST', body: JSON.stringify({
        title: `Global Assignment Update`,
        message: `Technician assigned to order #${orderId.slice(-6)}.`,
        role: 'all', orderId, type: 'task_assigned'
      })});

      await fetchWithAuth('/notifications', { method: 'POST', body: JSON.stringify({
        title: `Technician Assigned`,
        message: `Technician assigned to order #${orderId.slice(-6)}.`,
        role: 'admin', orderId, type: 'task_assigned'
      })});

      await fetchWithAuth('/notifications', { method: 'POST', body: JSON.stringify({
        title: `Technician Assigned`,
        message: `A technician has been assigned to your order #${orderId.slice(-6)}.`,
        role: 'customer', orderId, type: 'task_assigned'
      })});

      loadOrders();
      alert('Technician assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning technician:', error);
      alert(error.message || 'Failed to assign technician');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await fetchWithAuth(`/orders/${selectedOrder._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadOrders();
      setIsModalOpen(false);
    } catch {
      alert("Status update failed.");
    }
  };


  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAdminNotes((prev) => prev ? prev + ' ' + transcript : transcript);
        setIsRecording(false);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
    }
  };

  const handleApproveCompletion = async () => {
    if (!confirm("Are you sure you want to approve this completion? This will make the technician available and auto-assign the next pending order if one exists.")) return;
    try {
      await fetchWithAuth(`/orders/${selectedOrder._id}/approve-completion`, { 
        method: 'PATCH',
        body: JSON.stringify({ adminNotes })
      });
      loadOrders();
      setIsModalOpen(false);
      setAdminNotes('');
      alert("Order completion approved and technician is now available.");
    } catch (e: any) {
      alert("Approval failed: " + e.message);
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
    if (!confirm("Are you sure you want to completely delete this order?")) return;
    try {
      await fetchWithAuth(`/orders/${id}`, { method: 'DELETE' });
      loadOrders();
      setIsModalOpen(false);
    } catch {
      alert("Deletion failed.");
    }
  };

  const handleApproveCancel = async (id: string) => {
    if (!confirm("Approve cancellation request? Technician will be released.")) return;
    try {
      await fetchWithAuth(`/orders/${id}/approve-cancel`, { method: 'PATCH' });
      loadOrders();
      setIsModalOpen(false);
      alert("Cancellation approved.");
    } catch(e: any) { alert(e.message); }
  };

  const handleRejectCancel = async (id: string) => {
    if (!confirm("Reject cancellation request? Technician must resume work.")) return;
    try {
      await fetchWithAuth(`/orders/${id}/reject-cancel`, { method: 'PATCH' });
      loadOrders();
      setIsModalOpen(false);
      alert("Cancellation rejected.");
    } catch(e: any) { alert(e.message); }
  };

  const handleForceCancel = async (id: string) => {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;
    try {
      await fetchWithAuth(`/orders/${id}/force-cancel`, { 
        method: 'PATCH', 
        body: JSON.stringify({ reason }) 
      });
      loadOrders();
      setIsModalOpen(false);
      alert("Order force cancelled.");
    } catch(e: any) { alert(e.message); }
  };

  const handleRestoreOrder = async (id: string) => {
    if (!confirm("Restore order? This will revert it to pending state.")) return;
    try {
      await fetchWithAuth(`/orders/${id}/restore`, { method: 'PATCH' });
      loadOrders();
      setIsModalOpen(false);
      alert("Order restored successfully.");
    } catch(e: any) { alert(e.message); }
  };

  const getWarrantyStatus = (item: any) => {
    const startDate = item.warrantyStartDate ? new Date(item.warrantyStartDate) : item.createdAt ? new Date(item.createdAt) : new Date();
    const diffMonths = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const isExpired = diffMonths > 12;
    return {
      text: isExpired ? 'Warranty Expired (Chargeable)' : 'Under Warranty (Free Rework)',
      isExpired
    };
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':   return 'bg-green-600 text-white border-green-700 font-bold';
      case 'delivered':   return 'bg-green-500 text-white border-green-600 font-bold';
      case 'in_progress': return 'bg-purple-600 text-white border-purple-700 font-bold';
      case 'assigned':    return 'bg-blue-600 text-white border-blue-700 font-bold';
      case 'confirmed':   return 'bg-cyan-600 text-white border-cyan-700 font-bold';
      case 'pending':     return 'bg-orange-500 text-white border-orange-600 font-bold';
      case 'cancelled':   return 'bg-red-600 text-white border-red-700 font-bold';
      case 'cancellation_requested': return 'bg-pink-600 text-white border-pink-700 font-bold';
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
      <main className="flex-1 min-w-0 lg:ml-[280px] flex flex-col min-h-screen bg-background">
        <AdminNavbar />
        
        <div className="min-w-0 w-full p-6 md:p-12 space-y-16">
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 gap-8 w-full">
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
              <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase leading-tight">Order <span className="text-primary-blue italic">History</span></h1>
              <p className="text-fg-muted text-lg font-bold uppercase tracking-widest mt-1">Global Order Monitor</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button 
              onClick={() => setIsOfflineModalOpen(true)}
              className="px-8 py-5 bg-blue-600 bg-gradient-to-r from-primary-blue to-deep-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary-blue/30 flex items-center gap-4 w-full sm:w-auto transition-all hover:scale-105 active:scale-95 border border-white/10"
            >
              <Plus className="h-5 w-5" />
              <span>Add Offline Order</span>
            </button>
            <Link 
              href="/admin/orders/cancelled"
              className="px-8 py-5 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-4 w-full sm:w-auto transition-all hover:bg-red-500/20 active:scale-95 border border-red-500/20"
            >
              <XCircle className="h-5 w-5" />
              <span>Cancelled Orders</span>
            </Link>
            <div className="w-full xl:w-auto min-w-[240px]">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 outline-none focus:border-blue-600 transition-all font-black text-[10px] text-fg-primary shadow-inner uppercase tracking-widest cursor-pointer appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                {['all', 'pending', 'pending_approval', 'rework_requested', 'confirmed', 'assigned', 'in_progress', 'completed', 'delivered', 'cancellation_requested', 'cancelled'].map((s) => (
                  <option key={s} value={s} className="uppercase font-black tracking-widest bg-bg-surface text-fg-primary py-2">
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(() => {
            const cancelledOrders = orders.filter(o => o.status === 'cancelled');
            const revenueLost = cancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            const today = new Date();
            const todayCancelled = cancelledOrders.filter(o => {
              const d = new Date(o.cancellationDate || o.createdAt);
              return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            }).length;
            
            return (
              <>
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Revenue Lost</p>
                    <h3 className="text-3xl font-black text-fg-primary">₹{revenueLost.toLocaleString()}</h3>
                  </div>
                  <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 text-white">
                    <span className="text-2xl">😔</span>
                  </div>
                </div>
                
                <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Cancelled Today</p>
                    <h3 className="text-3xl font-black text-fg-primary">{todayCancelled} Orders</h3>
                  </div>
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 text-white">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>

                <div className="p-6 bg-pink-500/10 border border-pink-500/20 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Total Cancelled</p>
                    <h3 className="text-3xl font-black text-fg-primary">{cancelledOrders.length} Orders</h3>
                  </div>
                  <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 text-white">
                    <XCircle className="h-6 w-6" />
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="glass-card w-full rounded-3xl md:rounded-[3.5rem] border border-border-base relative overflow-hidden">
          <div className="overflow-x-auto w-full custom-scrollbar pb-4">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-border-base bg-bg-muted/50">
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Order ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Customer Name</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Source</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Category</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Warranty Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] whitespace-nowrap">Total</th>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] text-right whitespace-nowrap pr-12">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-base">
                {orders.filter(o => filter === 'all' || o.status?.toLowerCase() === filter).map((order: any) => (
                  <tr key={order._id} className="hover:bg-bg-muted/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-fg-primary tracking-widest">#{order._id.toString().slice(-6).toUpperCase()}</span>
                      <p className="text-[10px] font-bold text-fg-muted mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-bg-muted rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-fg-muted" />
                        </div>
                        <span className="text-sm font-bold text-fg-primary">{order.customer?.name || order.customerName || 'Anonymous'}</span>
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
                    <td className="px-8 py-6">
                      {(() => {
                        const wStatus = getWarrantyStatus(order);
                        return (
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${wStatus.isExpired ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                            {wStatus.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-fg-primary tracking-tighter">
                      &#8377;{order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right pr-8 transition-colors">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewOrder(order)} 
                          title="View Details"
                          className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-blue-600 shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> View Details
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order._id)} 
                          title="Cancel Order"
                          className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all text-red-500 shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                        {order.status === 'pending' && !order.technician && (
                          <button
                            onClick={() => handleAutoAssign(order._id)}
                            title="Auto Assign Technician"
                            className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-emerald-600 shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                          >
                            <Zap className="h-3.5 w-3.5" /> Auto Assign
                          </button>
                        )}
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
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono mt-1">Order #{(selectedOrder?._id || '').toString().slice(-6).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-bg-muted rounded-xl hover:bg-bg-card transition-colors">
                      <X className="h-5 w-5 text-fg-muted" />
                    </button>
                  </div>

                  {/* Customer + Slot info */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-5 bg-bg-muted/50 rounded-2xl border border-border-base space-y-3">
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer</h4>
                      <p className="text-sm font-bold text-fg-primary">{selectedOrder.customer?.name || selectedOrder.customerName || 'Walk-in Customer'}</p>
                      <p className="text-xs font-medium text-fg-secondary">{selectedOrder.customer?.email || 'No email provided'}</p>
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

                  {/* Delivery Location */}
                  <div className="p-5 bg-bg-muted/50 rounded-2xl border border-border-base space-y-3 mb-8">
                    <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center justify-between">
                      <span>Delivery Address</span>
                      {selectedOrder.bookingFor === 'self' && <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">Self Booking</span>}
                      {selectedOrder.bookingFor === 'other' && <span className="text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">For Someone Else</span>}
                    </h4>
                    <div className="bg-bg-secondary p-4 rounded-xl shadow-inner col-span-2">
                      <div className="flex items-center gap-2 mb-2 text-fg-muted">
                        <MapPin size={16} />
                        <span>Delivery Address</span>
                      </div>
                      <p className="text-sm font-bold text-fg-primary leading-relaxed">{selectedOrder.deliveryAddress || 'Address not provided'}</p>
                    </div>
                    
                    {selectedOrder.liveLocation && (
                      <div className="bg-bg-secondary p-4 rounded-xl shadow-inner col-span-2 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2 text-blue-500">
                          <MapPin size={16} />
                          <span>Live Location (GPS Captured)</span>
                        </div>
                        <p className="text-sm font-bold text-fg-primary leading-relaxed">
                          {selectedOrder.liveLocation.address || 'GPS Coordinates Provided'}
                        </p>
                        {selectedOrder.liveLocation.lat && (
                          <p className="text-xs text-fg-muted mt-1">
                            {selectedOrder.liveLocation.lat.toFixed(6)}, {selectedOrder.liveLocation.lng.toFixed(6)}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedOrder.liveLocation?.lat && selectedOrder.liveLocation?.lng && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.liveLocation.lat},${selectedOrder.liveLocation.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1.5 mt-2"
                      >
                        <MapPin className="h-4 w-4" /> View Live Location on Map
                      </a>
                    )}
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
                      <>
                        <div className="p-5 bg-blue-600/5 border border-blue-600/20 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">
                              {selectedOrder.technician.name?.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-fg-primary">{selectedOrder.technician.name}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase">Primary Technician</p>
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
                        
                        {selectedOrder.supportingTechnicians && selectedOrder.supportingTechnicians.length > 0 && (
                          <div className="mt-3 space-y-2">
                             <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest pl-2 border-l-2 border-purple-500">
                               {selectedOrder.supportingTechnicians.length} Supporting Technician{selectedOrder.supportingTechnicians.length > 1 ? 's' : ''}
                             </p>
                             <div className="flex flex-wrap gap-2">
                                {selectedOrder.supportingTechnicians.map((t: any, idx: number) => (
                                   <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-bg-muted/50 border border-border-base rounded-xl">
                                      <div className="w-5 h-5 bg-purple-500/20 text-purple-500 rounded-full flex items-center justify-center text-[8px] font-black">
                                         {t.name?.slice(0, 1)}
                                      </div>
                                      <span className="text-[10px] font-bold text-fg-primary">{t.name}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                        )}
                      </>
                    ) : assignSuccess ? (
                      <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-2">
                        <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                        <p className="text-sm font-black text-green-400 uppercase tracking-tight">Assigned Successfully!</p>
                        <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest">Slot is now blocked.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="p-5 bg-bg-muted rounded-2xl border border-border-base text-center">
                          <p className="text-xs font-black text-fg-muted uppercase tracking-widest mb-4">Smart Auto-Assignment</p>
                          <p className="text-[10px] text-fg-secondary font-medium max-w-sm mx-auto mb-6">The system will automatically find the best available technician based on live schedule and zone mapping.</p>
                          <button
                            onClick={() => handleAutoAssign(selectedOrder._id)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3"
                          >
                            <Zap className="h-4 w-4" />
                            <span>Auto Assign</span>
                          </button>
                        </div>

                        <div className="pt-4 border-t border-border-base">
                          <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-3">Manual Assignment</h4>
                          {availLoading ? (
                            <p className="text-center text-xs text-fg-muted py-4">Loading technicians...</p>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                              {availTechnicians.map(t => (
                                <div key={t._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${t.status === 'busy' ? 'bg-orange-500/5 border-orange-500/20' : t.status === 'on_leave' ? 'bg-red-500/5 border-red-500/20 opacity-60' : 'bg-bg-surface hover:border-blue-500 border-border-base'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${t.status === 'busy' ? 'bg-orange-500/20 text-orange-500' : t.status === 'on_leave' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                      {t.name?.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-fg-primary">{t.name}</p>
                                      <p className={`text-[10px] font-black uppercase tracking-widest ${t.status === 'busy' ? 'text-orange-500' : t.status === 'on_leave' ? 'text-red-500' : 'text-green-500'}`}>
                                        {t.status === 'busy' ? 'Busy (Workload)' : t.status === 'on_leave' ? 'On Leave' : 'Available'}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (t.status === 'busy' || t.status === 'on_leave') {
                                        if (window.confirm(`This technician is ${t.status === 'busy' ? 'Busy' : 'On Leave'}. Are you sure you want to force assign?`)) {
                                          handleManualAssign(selectedOrder._id, t._id);
                                        }
                                      } else {
                                        handleManualAssign(selectedOrder._id, t._id);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'busy' ? 'bg-orange-500 text-white hover:bg-orange-600' : t.status === 'on_leave' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                  >
                                    Assign
                                  </button>
                                </div>
                              ))}
                              {availTechnicians.length === 0 && !availLoading && (
                                <p className="text-center text-xs text-fg-muted py-4">No technicians found.</p>
                              )}
                            </div>
                          )}
                          {showReassign && (
                            <button onClick={() => setShowReassign(false)} className="w-full mt-3 py-2 text-[10px] font-bold text-fg-muted uppercase tracking-widest hover:text-fg-primary">
                              Cancel Reassignment
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Multi-Day Execution Timeline ───────────────────────── */}
                  <div className="space-y-6 mt-12 pt-12 border-t border-border-base">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-black text-fg-primary uppercase tracking-tighter italic">
                          Multi-Day <span className="text-purple-500 non-italic">Timeline</span>
                        </h4>
                        <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mt-1">
                          Daily Reports & GPS Status History
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-bg-muted px-4 py-2 rounded-2xl border border-border-base">
                        <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Project Duration:</span>
                        <span className="text-xs font-black text-purple-500 uppercase tracking-widest">
                          {selectedOrder.totalDays || 1} Day{selectedOrder.totalDays > 1 ? 's' : ''} ({selectedOrder.dailyReports?.length || 0} Logged)
                        </span>
                      </div>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-1 before:bg-bg-muted before:rounded-full">
                      {selectedOrder.dailyReports && selectedOrder.dailyReports.length > 0 ? (
                        selectedOrder.dailyReports.map((report: any, idx: number) => (
                          <div key={idx} className="relative pl-16 space-y-4 group">
                            {/* Bullet */}
                            <div className="absolute left-3 top-2 w-7 h-7 rounded-2xl bg-purple-600 border-4 border-card flex items-center justify-center text-[10px] font-black text-white shadow-xl shadow-purple-600/30 group-hover:scale-110 transition-transform">
                              {report.dayNumber || idx + 1}
                            </div>
                            
                            {/* Card */}
                            <div className="bg-bg-muted/30 border border-border-base rounded-[2rem] p-6 lg:p-8 space-y-6 hover:bg-bg-muted/50 transition-all shadow-xl">
                              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-base pb-4">
                                <div className="space-y-1">
                                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                    Day {report.dayNumber || idx + 1} Progress Report
                                  </span>
                                  <p className="text-xs font-bold text-fg-primary">
                                    {new Date(report.workDate || report.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500">
                                    <Activity className="h-3.5 w-3.5" />
                                    <span>{report.progress || 25}% Total Progress</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Milestones Achieved</p>
                                  <p className="text-xs font-medium text-fg-primary leading-relaxed">{report.description || 'Routine CCTV check and routing completed.'}</p>
                                </div>

                                {report.remarks && (
                                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-1">
                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Issues & Remarks</p>
                                    <p className="text-[11px] font-medium text-fg-secondary italic">{report.remarks}</p>
                                  </div>
                                )}

                                {report.photos && report.photos.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Proof Photos ({report.photos.length})</p>
                                    <div className="flex flex-wrap gap-3">
                                      {report.photos.map((img: string, i: number) => (
                                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-2xl border border-border-base hover:border-purple-500 transition-all block group/img shadow-md">
                                          <img src={img} alt={`Proof ${i}`} className="w-24 h-24 object-cover group-hover/img:scale-105 transition-transform" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {report.location && (report.location.latitude || report.location.address) && (
                                  <div className="flex items-center justify-between pt-4 border-t border-border-base/50 text-[10px] text-fg-muted font-bold">
                                    <div className="flex items-center gap-2 text-blue-500">
                                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                                      <span>{report.location.address || 'GPS Confirmed'}</span>
                                    </div>
                                    <span className="font-mono text-[9px] text-fg-dim">
                                      {report.location.latitude?.toFixed(4)}, {report.location.longitude?.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="pl-16 py-8 text-center opacity-40 space-y-3">
                          <div className="p-4 bg-bg-muted rounded-full w-fit mx-auto">
                            <Clock className="h-6 w-6" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">No daily reports submitted yet for this project</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right panel — Status updates */}
                <div className="w-full md:w-80 bg-bg-muted/50 p-6 md:p-10 border-t md:border-t-0 md:border-l border-border-base space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Workflow Progress</h4>
                    
                    {/* Stepper Kanban */}
                    <div className="relative pl-4 border-l-2 border-border-base space-y-6">
                      {[
                        { label: 'Pending', val: 'pending' },
                        { label: 'Confirmed', val: 'confirmed' },
                        { label: 'Tech Assigned', val: 'assigned' },
                        { label: 'Travelling', val: 'accepted' },
                        { label: 'Work Started', val: 'in_progress' },
                        { label: 'Quality Check', val: 'completed' },
                        { label: 'Closed', val: 'delivered' }
                      ].map((step, idx) => {
                        const statusOrder = ['pending', 'confirmed', 'assigned', 'accepted', 'in_progress', 'completed', 'delivered'];
                        const currentIndex = statusOrder.indexOf(selectedOrder.status);
                        const isPast = currentIndex >= idx;
                        const isActive = selectedOrder.status === step.val;
                        
                        return (
                          <div key={step.val} className="relative group">
                            <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 transition-all ${isActive ? 'bg-blue-500 border-blue-200 scale-125' : isPast ? 'bg-green-500 border-green-200' : 'bg-bg-muted border-border-base group-hover:border-blue-300'}`} />
                            <button
                              onClick={() => handleUpdateStatus(step.val)}
                              className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-blue-600/10 text-blue-600 border border-blue-500/20' : 'hover:bg-bg-card text-fg-muted'}`}
                            >
                              {step.label}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Admin Actions */}
                    <div className="pt-6 border-t border-border-base space-y-3">
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Admin Actions</h4>
                      <button onClick={() => handleUpdateStatus('completed')} className="w-full py-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Approve Work
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus('rework')} className="flex-1 py-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                          Rework
                        </button>
                        <button onClick={() => handleUpdateStatus('rejected')} className="flex-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                          Reject
                        </button>
                      </div>
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
                                {proof.audioUrl && (
                                  <div className="mt-2">
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest block mb-1">Voice Note</span>
                                    <audio src={proof.audioUrl} controls className="w-full h-8" />
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
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" /> Workflow Progress
                      </h4>
                      {[
                        { label: 'Assigned', done: workflow.stages?.assigned?.status },
                        { label: 'Accepted', done: workflow.stages?.accepted?.status },
                        { label: 'In Progress', done: workflow.stages?.in_progress?.status || workflow.stages?.started?.status },
                        { label: 'Completed', done: workflow.stages?.completed?.status },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${step.done ? 'bg-green-500 border-green-500 text-white' : 'bg-bg-muted border-border-base text-fg-muted'}`}>
                            {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          </div>
                          <span className={`text-xs font-bold ${step.done ? 'text-fg-primary' : 'text-fg-muted'}`}>{step.label}</span>
                        </div>
                      ))}

                      {/* Display Completion Notes & Photo if available */}
                      {workflow.stages?.completed?.status && (
                        <div className="mt-6 p-5 bg-bg-muted/80 rounded-2xl border border-border-base space-y-4">
                          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-border-base pb-2">Technician Completion Report</h4>
                          
                          {workflow.stages.completed.photo?.url && (
                            <div className="space-y-2">
                              <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Final Work Photo</span>
                              <div className="relative group cursor-pointer" onClick={() => setFullScreenImage(workflow.stages.completed.photo.url)}>
                                <img src={workflow.stages.completed.photo.url} alt="Completion Proof" className="w-full h-40 object-cover rounded-xl shadow-md border border-border-base transition-transform group-hover:scale-[1.02]" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                  <Maximize2 className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            </div>
                          )}

                          {(workflow.stages.started?.notes || workflow.stages.completed?.notes) && (
                            <div className="space-y-4">
                              <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest border-b border-border-base pb-2 block">Technician Logs & Notes</span>
                              <div className="space-y-3">
                                {workflow.stages.started?.notes && (
                                  <div className="p-4 bg-blue-600/5 border-l-2 border-blue-500 rounded-r-xl">
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 block">Task Started</span>
                                    <p className="text-xs text-fg-primary italic font-medium">"{workflow.stages.started.notes}"</p>
                                  </div>
                                )}
                                {workflow.stages.completed?.notes && (
                                  <div className="p-4 bg-green-500/5 border-l-2 border-green-500 rounded-r-xl">
                                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1 block">Task Completed</span>
                                    <p className="text-xs text-fg-primary italic font-medium">"{workflow.stages.completed.notes}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedOrder.status === 'pending_approval' && (
                            <div className="mt-6 space-y-4 pt-4 border-t border-border-base">
                              <div className="space-y-2">
                                <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Admin Approval Notes</span>
                                <div className="flex gap-2">
                                  <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Enter review notes or use voice dictation..."
                                    className="premium-textarea flex-1 min-h-[80px]"
                                  />
                                  <button
                                    onClick={toggleRecording}
                                    className={`p-4 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                      isRecording 
                                        ? 'bg-red-500 text-white animate-pulse' 
                                        : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white'
                                    }`}
                                    title={isRecording ? 'Stop Recording' : 'Start Voice Dictation'}
                                  >
                                    <Mic className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-4 mt-2">
                                <button
                                  onClick={handleApproveCompletion}
                                  className="flex-1 py-4 px-6 rounded-xl text-xs font-black uppercase tracking-widest border transition-all bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/30 hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                  <CheckCircle className="h-5 w-5" /> Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await fetchWithAuth(`/orders/${selectedOrder._id}/status`, {
                                        method: 'PATCH',
                                        body: JSON.stringify({ status: 'in_progress', workflow: { ...selectedOrder.workflow, currentStage: 'started' } })
                                      });
                                      alert("Order rejected and sent back to technician.");
                                      loadOrders();
                                      setSelectedOrder(null);
                                    } catch (e) {
                                      alert("Failed to reject order.");
                                    }
                                  }}
                                  className="flex-1 py-4 px-6 rounded-xl text-xs font-black uppercase tracking-widest border transition-all bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2"
                                >
                                  <XCircle className="h-5 w-5" /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-border-base">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Operations</h4>
                    <button
                      onClick={async () => {
                        try {
                           await fetchWithAuth('/notifications', {
                             method: 'POST',
                             body: JSON.stringify({
                               title: 'Order Follow-up',
                               message: `Follow up required for Order #${selectedOrder._id.slice(-6)}`,
                               role: 'technician',
                               type: 'followup',
                               orderId: selectedOrder._id,
                               userId: selectedOrder.technician?._id || 'all'
                             })
                           });
                           alert("Follow-up notification sent to Technician.");
                        } catch (e) { alert("Failed to send follow-up."); }
                      }}
                      className="w-full py-4 mb-4 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center space-x-2"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Send Follow-up Reminder</span>
                    </button>
                    {selectedOrder.paymentStatus !== 'paid' && (
                      <button
                        onClick={async () => {
                          try {
                            await fetchWithAuth(`/orders/${selectedOrder._id}/payment`, {
                              method: 'PATCH',
                              body: JSON.stringify({ paymentStatus: 'paid' })
                            });
                            alert("Payment marked as Paid.");
                            loadOrders();
                            setSelectedOrder({...selectedOrder, paymentStatus: 'paid'});
                          } catch (e) { alert("Failed to mark as paid."); }
                        }}
                        className="w-full py-4 mb-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center space-x-2"
                      >
                        <IndianRupee className="h-4 w-4" />
                        <span>Mark as Paid</span>
                      </button>
                    )}

                    {(selectedOrder.cancellationReason || selectedOrder.cancellationFeedback) && (
                      <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Cancellation Details</h4>
                        {selectedOrder.cancellationReason && (
                          <p className="text-xs font-bold text-fg-primary mb-1">Reason: <span className="text-fg-muted font-medium">{selectedOrder.cancellationReason}</span></p>
                        )}
                        {selectedOrder.cancellationFeedback && (
                          <p className="text-xs font-bold text-fg-primary mb-1">Feedback: <span className="text-fg-muted font-medium italic">{selectedOrder.cancellationFeedback}</span></p>
                        )}
                        {selectedOrder.cancellationDate && (
                          <p className="text-[10px] text-fg-dim font-medium mt-2">Requested on: {new Date(selectedOrder.cancellationDate).toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                    
                    {selectedOrder.status === 'cancellation_requested' && (
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => handleApproveCancel(selectedOrder._id)}
                          className="flex-1 py-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve Cancel
                        </button>
                        <button
                          onClick={() => handleRejectCancel(selectedOrder._id)}
                          className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" /> Reject Cancel
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'cancelled' ? (
                      <button
                        onClick={() => handleRestoreOrder(selectedOrder._id)}
                        className="w-full py-4 mb-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Restore Order (30m limit)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleForceCancel(selectedOrder._id)}
                        className="w-full py-4 mb-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Force Cancel Order</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteOrder(selectedOrder._id)}
                      className="w-full py-4 bg-red-500 text-white border border-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center space-x-2"
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

        {/* Full Screen Image Viewer */}
        <AnimatePresence>
          {fullScreenImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
              onClick={() => setFullScreenImage(null)}
            >
              <button
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
              >
                <X className="h-6 w-6" />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={fullScreenImage}
                alt="Full Screen Evidence"
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
