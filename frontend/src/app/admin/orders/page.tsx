"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShoppingCart, Package, User, Clock, CheckCircle, AlertCircle, IndianRupee, Search, Filter, Eye, ArrowRight, Trash2, X, MapPin, Activity, Menu, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const router = useRouter();

  const loadOrders = async () => {
    try {
      const [orderData, techData] = await Promise.all([
        fetchWithAuth('/orders/all'),
        fetchWithAuth('/admin/technicians') // Assuming this exists or using general users fetch
      ]);
      setOrders(orderData);
      setTechnicians(techData.filter((t: any) => t.role === 'technician'));
    } catch (error) {
      console.error("Load Orders Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    try {
      const wf = await fetchWithAuth(`/orders/workflow/${order._id}`);
      setWorkflow(wf);
    } catch (e) {
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
    } catch (e) {
      alert("Status update failed.");
    }
  };

  const handleAssignTechnician = async (techId: string) => {
    setIsAssigning(true);
    try {
      await fetchWithAuth(`/admin/orders/${selectedOrder._id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: techId })
      });
      loadOrders();
      setIsModalOpen(false);
    } catch (e) {
      alert("Assignment failed.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order? Data will be permanently deleted.")) return;
    try {
      await fetchWithAuth(`/orders/${id}`, { method: 'DELETE' });
      loadOrders();
      setIsModalOpen(false);
    } catch (e) {
      alert("Deletion failed.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-green-600/10 text-green-600 border-green-600/20';
      case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'assigned': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'accepted': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'in_progress': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'confirmed': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
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
            <div className="space-y-3">
               <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full w-fit">
                  <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Order Logistics</span>
               </div>
              <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase">Order <span className="text-fg-muted italic">History</span></h1>
              <p className="text-fg-muted text-lg font-medium">Monitor all service Services and product orders.</p>
            </div>
          </div>
          <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base">
             {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((s) => (
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

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50">
                    <tr className="border-b border-border-base">
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Order ID</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Customer Name</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Details (Products)</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Status</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Total Amount</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-base">
                    {orders.filter(o => filter === 'all' || o.status.toLowerCase() === filter).map((order: any) => (
                      <tr key={order._id} className="hover:bg-bg-muted/30 transition-colors group">
                        <td className="px-8 py-6">
                           <span className="text-xs font-black text-fg-primary tracking-widest">#{order._id.toString().slice(-8).toUpperCase()}</span>
                           <p className="text-[10px] font-bold text-fg-muted mt-1 uppercase tracking-widest">
                             {new Date(order.createdAt).toLocaleDateString()}
                           </p>
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
                           <div className="flex flex-col space-y-1">
                              {order.products?.map((p: any, i: number) => (
                                <span key={i} className="text-xs font-medium text-fg-secondary">
                                  {p.product?.name} <span className="text-fg-muted ml-1">x{p.quantity}</span>
                                </span>
                              ))}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                              {order.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-black text-fg-primary tracking-tighter">
                          ₹{order.totalAmount?.toLocaleString()}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleViewOrder(order)}
                                className="p-3 bg-bg-muted border border-border-base rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-fg-muted hover:text-blue-500"
                              >
                                 <ArrowRight className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteOrder(order._id)}
                                className="p-3 bg-bg-muted border border-border-base rounded-2xl hover:border-red-500/50 hover:bg-red-500/5 transition-all text-fg-muted hover:text-red-500"
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
                 className="glass-card w-full max-w-4xl rounded-[3rem] border border-border-base overflow-hidden relative z-10 flex flex-col md:flex-row shadow-2xl"
               >
                  <div className="flex-1 p-12 overflow-y-auto max-h-[80vh]">
                     <div className="flex justify-between items-start mb-10">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-fg-primary tracking-tight uppercase">Service Details</h3>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Order ID: {selectedOrder._id}</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 bg-bg-muted rounded-xl hover:bg-bg-card transition-colors">
                           <X className="h-5 w-5 text-fg-muted" />
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="space-y-4 p-6 bg-bg-muted/50 rounded-2xl border border-border-base">
                           <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer Details</h4>
                           <div className="flex items-center space-x-3">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-bold text-fg-primary">{selectedOrder.customer?.name}</span>
                           </div>
                           <p className="text-xs font-medium text-fg-secondary">{selectedOrder.customer?.email}</p>
                        </div>
                        <div className="space-y-4 p-6 bg-bg-muted/50 rounded-2xl border border-border-base">
                           <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Installation Slot</h4>
                           <div className="flex items-center space-x-3">
                              <Clock className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-bold text-fg-primary">
                                {selectedOrder.installationSlot ? new Date(selectedOrder.installationSlot).toLocaleString() : 'Not Scheduled'}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6 mb-12">
                        <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Purchased Products</h4>
                        <div className="space-y-4">
                           {selectedOrder.products?.map((p: any, i: number) => (
                             <div key={i} className="flex justify-between items-center p-4 bg-bg-card border border-border-base rounded-2xl">
                                <div className="flex items-center space-x-4">
                                   <Package className="h-5 w-5 text-fg-muted" />
                                   <span className="text-sm font-bold text-fg-primary">{p.product?.name}</span>
                                </div>
                                <span className="text-sm font-black text-blue-600 tracking-widest">x{p.quantity}</span>
                             </div>
                           ))}
                        </div>
                     </div>                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Technician & Workflow</h4>
                        <div className="flex flex-col gap-4">
                           {selectedOrder.technician ? (
                             <div className="flex items-center justify-between p-4 bg-blue-600/5 border border-blue-600/20 rounded-2xl">
                                <div className="flex items-center space-x-3">
                                   <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black uppercase">{selectedOrder.technician.name?.slice(0,1)}</div>
                                   <div>
                                      <p className="text-sm font-bold text-fg-primary">{selectedOrder.technician.name}</p>
                                      <p className="text-[10px] font-black text-blue-600 uppercase">Assigned Technician</p>
                                   </div>
                                </div>
                                <button className="text-[10px] font-black text-fg-muted uppercase hover:text-red-500" onClick={() => handleAssignTechnician('')}>Retract</button>
                             </div>
                           ) : (
                             <div className="space-y-4">
                                <p className="text-xs text-orange-500 italic font-bold">Awaiting Technician Assignment</p>
                                <select 
                                  className="w-full p-4 bg-bg-muted border border-border-base rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-blue-600"
                                  onChange={(e) => handleAssignTechnician(e.target.value)}
                                  defaultValue=""
                                >
                                   <option value="" disabled>Select Technician for Assignment</option>
                                   {technicians.map(t => (
                                     <option key={t._id} value={t._id}>{t.name} (Service Zone: {t.zone || 'Global'})</option>
                                   ))}
                                </select>
                             </div>
                           )}

                           {workflow && (
                            <div className="space-y-4 mt-4">
                                {[
                                  { label: 'Booking Confirmed', stage: workflow.stage1?.confirmed },
                                  { label: 'Service Started', stage: workflow.stage2?.started },
                                  { label: 'Service Completed', stage: workflow.stage3?.completed },
                                ].map((step, i) => (
                                  <div key={i} className="flex items-center space-x-4">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step.stage ? 'bg-green-500 border-green-500 text-white' : 'bg-bg-muted border-border-base text-fg-muted'}`}>
                                        {step.stage ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                     </div>
                                     <span className={`text-sm font-bold ${step.stage ? 'text-fg-primary' : 'text-fg-muted'}`}>{step.label}</span>
                                  </div>
                                ))}
                            </div>
                           )}
                        </div>
                      </div>
                  </div>

                  <div className="w-full md:w-80 bg-bg-muted/50 p-12 border-l border-border-base space-y-10">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Update Lifecycle</h4>
                        <div className="space-y-3">
                           {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((val) => (
                              <button 
                                key={val}
                                onClick={() => handleUpdateStatus(val)}
                                className={`w-full py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedOrder.status === val ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-bg-card border-border-base text-fg-muted hover:border-blue-500'}`}
                              >
                                {val}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4 pt-10 border-t border-border-base">
                        <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest text-red-500">Danger Zone</h4>
                        <button 
                          onClick={() => handleDeleteOrder(selectedOrder._id)}
                          className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center space-x-2"
                        >
                           <Trash2 className="h-4 w-4" />
                           <span>Purge Data</span>
                        </button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default OrdersPage;
