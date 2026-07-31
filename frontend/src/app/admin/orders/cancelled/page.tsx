"use client";
import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { 
  XCircle, Clock, MapPin, Search, ChevronRight, User, Mail, Phone, Calendar, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function CancelledOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/orders/all');
      const allOrders = Array.isArray(data) ? data : (data?.orders || []);
      
      const cancelled = allOrders.filter((o: any) => o.status === 'cancelled').sort((a: any, b: any) => 
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
      setOrders(cancelled);
    } catch (error) {
      console.error("Failed to fetch cancelled orders", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filteredOrders = orders.filter((o: any) => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cancellationReason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-bg-primary text-fg-primary">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-red-500">Cancelled Orders & Lost Revenue</h1>
          <p className="text-fg-muted mt-1">Audit trail for all cancelled installations and product orders.</p>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between border border-white/5">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
          <input
            type="text"
            placeholder="Search by ID, Customer, or Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-primary border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
          />
        </div>
        <div className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold border border-red-500/20">
          {filteredOrders.length} Cancelled Orders
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-fg-muted bg-bg-secondary rounded-2xl border border-white/5">
          <XCircle className="w-12 h-12 mb-4 opacity-50" />
          <p>No cancelled orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order: any, idx) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedOrder(order)}
                className="bg-bg-secondary p-5 rounded-2xl border border-red-500/10 hover:border-red-500/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded-md">
                      Lost Revenue: ₹{order.totalAmount}
                    </span>
                    <h3 className="font-bold text-lg mt-2 truncate max-w-[200px]">{order.customer?.name || 'Unknown'}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-fg-muted group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                </div>
                
                <p className="text-sm text-fg-muted mb-4 line-clamp-2 italic">
                  "{order.cancellationReason || 'No reason provided'}"
                </p>

                <div className="space-y-2 text-xs text-fg-muted">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Cancelled by: {order.cancellationSource || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(order.updatedAt || order.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-bg-secondary w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl"
            >
              <div className="sticky top-0 bg-bg-secondary/90 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-start z-10">
                <div>
                  <h2 className="text-2xl font-black text-red-500 flex items-center gap-2">
                    <XCircle className="w-6 h-6" /> Order Cancelled
                  </h2>
                  <p className="text-fg-muted text-sm font-mono mt-1">#{selectedOrder._id}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-fg-primary" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Reason Block */}
                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Cancellation Reason</h3>
                  <p className="text-fg-primary text-lg">{selectedOrder.cancellationReason || 'No reason specified.'}</p>
                  <div className="mt-4 flex gap-4 text-sm text-fg-muted border-t border-red-500/10 pt-4">
                    <span>Source: <strong className="text-fg-primary">{selectedOrder.cancellationSource || 'N/A'}</strong></span>
                    <span>Date: <strong className="text-fg-primary">{new Date(selectedOrder.updatedAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <h3 className="text-sm font-bold text-fg-primary mb-3">Customer Profile</h3>
                  <div className="bg-bg-primary p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-fg-muted flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Name</span>
                      <p className="text-sm font-medium mt-1">{selectedOrder.customer?.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-fg-muted flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Phone</span>
                      <p className="text-sm font-medium mt-1">{selectedOrder.customer?.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-fg-muted flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Email</span>
                      <p className="text-sm font-medium mt-1">{selectedOrder.customer?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Lost Revenue */}
                <div>
                  <h3 className="text-sm font-bold text-fg-primary mb-3">Financial Impact (Lost Revenue)</h3>
                  <div className="bg-bg-primary p-4 rounded-xl border border-white/5">
                    <p className="text-3xl font-black text-red-500">₹{selectedOrder.totalAmount}</p>
                    <p className="text-sm text-fg-muted mt-1">Payment Method: {selectedOrder.paymentMethod?.toUpperCase()}</p>
                  </div>
                </div>

                {/* Technician Timeline */}
                <div>
                  <h3 className="text-sm font-bold text-fg-primary mb-3">Assignment History</h3>
                  <div className="space-y-3">
                    {selectedOrder.technician ? (
                      <div className="bg-bg-primary p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{selectedOrder.technician.name}</p>
                          <p className="text-xs text-fg-muted flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {selectedOrder.technician.phone}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
                          Primary Tech (Released)
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-fg-muted italic">No primary technician was assigned prior to cancellation.</p>
                    )}
                  </div>
                </div>
                
                {/* Audit Trail */}
                {selectedOrder.trackingTimeline && selectedOrder.trackingTimeline.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-fg-primary mb-3">Audit Trail</h3>
                    <div className="bg-bg-primary p-4 rounded-xl border border-white/5 space-y-4">
                      {selectedOrder.trackingTimeline.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'cancelled' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} />
                            {idx !== selectedOrder.trackingTimeline.length - 1 && (
                              <div className="w-0.5 h-full bg-white/10 my-1" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium text-fg-primary capitalize">{item.status.replace('_', ' ')}</p>
                            <p className="text-xs text-fg-muted mt-1">{item.remarks}</p>
                            <p className="text-[10px] text-fg-muted mt-2 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
