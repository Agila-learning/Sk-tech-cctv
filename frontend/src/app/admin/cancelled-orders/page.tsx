"use client";
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Search, X, XOctagon, User, Clock, Calendar, CheckCircle2, AlertCircle, FileText, Download, IndianRupee, MessageSquare, History } from 'lucide-react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { fetchWithAuth } from '@/utils/api';

const CancelledOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '100',
        status: 'cancelled'
      });
      if (search) queryParams.append('search', search);

      const [orderData] = await Promise.all([
        fetchWithAuth(`/orders/all?${queryParams.toString()}`),
      ]);
      const fetchedOrders = orderData?.orders || orderData || [];
      const sorted = fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Also fetch cancellation_requested if needed
      const [pendingCancelData] = await Promise.all([
        fetchWithAuth(`/orders/all?status=cancellation_requested&page=1&limit=50`),
      ]);
      const pendingOrders = pendingCancelData?.orders || pendingCancelData || [];
      
      setOrders([...pendingOrders, ...sorted]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleApproveCancellation = async (orderId: string) => {
    try {
      await fetchWithAuth(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled', notes: 'Approved via Cancelled Orders Dashboard' })
      });
      loadOrders();
      setIsModalOpen(false);
    } catch(e: any) { alert(e.message); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-white font-sans selection:bg-red-500/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AdminNavbar />
        
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-[#1E293B]/50 p-6 rounded-3xl backdrop-blur-xl border border-red-500/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <XOctagon className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">Cancelled Orders</h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Complete audit and history of all cancelled tasks</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 overflow-hidden">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Cancelled Orders</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">It looks like all orders are proceeding smoothly.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-4 font-semibold">Order ID</th>
                        <th className="py-4 px-4 font-semibold">Customer</th>
                        <th className="py-4 px-4 font-semibold">Technician</th>
                        <th className="py-4 px-4 font-semibold">Status</th>
                        <th className="py-4 px-4 font-semibold">Date</th>
                        <th className="py-4 px-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="py-4 px-4">
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">#{order._id.toString().slice(-6)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{order.customer?.name || 'Guest'}</div>
                            <div className="text-xs text-slate-500">{order.customer?.phone}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{order.technician?.name || 'Unassigned'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${order.status === 'cancellation_requested' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                              {order.status === 'cancellation_requested' ? 'Pending Approval' : 'Cancelled'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <button onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">
                              View History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* History Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0F172A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <XOctagon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cancellation Details</h2>
                  <p className="text-sm text-slate-500">Order #{selectedOrder._id.slice(-6)}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><User className="w-4 h-4" /> Customer Details</div>
                  <div className="font-semibold text-lg">{selectedOrder.customer?.name}</div>
                  <div className="text-sm">{selectedOrder.customer?.phone} | {selectedOrder.customer?.email}</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><Clock className="w-4 h-4" /> Technician Details</div>
                  <div className="font-semibold text-lg">{selectedOrder.technician?.name || 'Unassigned'}</div>
                  <div className="text-sm">{selectedOrder.technician?.phone}</div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><History className="w-5 h-5 text-blue-500" /> Complete Audit Timeline</h3>
                <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  {selectedOrder.trackingTimeline?.map((evt: any, i: number) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-[#1E293B]" />
                      <div className="font-semibold text-slate-900 dark:text-white capitalize">{evt.status.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-slate-500">{evt.remarks}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(evt.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                  {/* Cancellation specific details if not in timeline */}
                  {selectedOrder.status === 'cancellation_requested' && (
                     <div className="relative pl-6 mt-4">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-white dark:ring-[#1E293B]" />
                      <div className="font-semibold text-orange-500">Cancellation Requested</div>
                      <div className="text-sm text-slate-500">Awaiting Admin Approval</div>
                     </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            {selectedOrder.status === 'cancellation_requested' && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A] flex justify-end gap-3">
                <button onClick={() => handleApproveCancellation(selectedOrder._id)} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">
                  Approve Cancellation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelledOrdersPage;
