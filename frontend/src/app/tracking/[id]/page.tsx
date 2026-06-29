"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Calendar, 
  User, 
  Smartphone, 
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  Box,
  Wrench,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { fetchWithAuth } from '@/utils/api';

const statusConfig: any = {
  'pending': { label: 'Order Confirmed', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'confirmed': { label: 'Order Confirmed', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'assigned': { label: 'Technician Assigned', icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'accepted': { label: 'Technician Confirmed', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'in_progress': { label: 'Out for Installation', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'completed': { label: 'Installation Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  'cancelled': { label: 'Order Cancelled', icon: Package, color: 'text-red-500', bg: 'bg-red-500/10' }
};

const stages = ['confirmed', 'assigned', 'in_progress', 'completed'];

const TrackingPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrder();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchOrder, 30000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const orders = await fetchWithAuth('/orders/my-orders');
      const currentOrder = orders.find((o: any) => o._id === id);
      setOrder(currentOrder);
    } catch (err) {
      console.error("Failed to fetch order", err);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = stages.findIndex(s => {
    if (order?.status === 'completed') return s === 'completed';
    if (order?.status === 'in_progress') return s === 'in_progress';
    if (['assigned', 'accepted'].includes(order?.status)) return s === 'assigned';
    if (['pending', 'confirmed'].includes(order?.status)) return s === 'confirmed';
    return false;
  });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 pt-48 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Status Timeline */}
          <div className="lg:col-span-8 space-y-8">
            <div className="mb-12">
              <span className="px-4 py-2 bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Deployment Tracking</span>
              <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase mt-4 mb-2">Order <span className="text-blue-600 italic">Status</span></h1>
              <p className="text-fg-muted font-medium">Real-time telemetric feed of your installation assignment.</p>
            </div>

            <div className="glass-card p-12 rounded-[3.5rem] border border-border-base relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap className="h-40 w-40" />
               </div>

               <div className="flex flex-col space-y-12 relative z-10">
                  {stages.map((stage, idx) => {
                    const config = statusConfig[stage];
                    const Icon = config.icon;
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    
                    return (
                      <div key={stage} className="flex gap-8 group">
                        <div className="flex flex-col items-center">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                             isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-bg-muted border-border-base text-fg-muted'
                           } ${isCurrent ? 'scale-110 ring-4 ring-blue-600/10' : ''}`}>
                              <Icon className="h-6 w-6" />
                           </div>
                           {idx !== stages.length - 1 && (
                              <div className={`w-0.5 h-16 my-2 transition-colors duration-500 ${isCompleted && idx < currentStatusIndex ? 'bg-blue-600' : 'bg-border-base'}`} />
                           )}
                        </div>
                        <div className="pt-2 flex-1">
                           <div className="flex items-center gap-3 mb-1">
                              <p className={`text-lg font-black uppercase tracking-tight transition-colors ${isCompleted ? 'text-fg-primary' : 'text-fg-muted'}`}>
                                {config.label}
                              </p>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest rounded animate-pulse">Live</span>
                              )}
                           </div>
                           <p className="text-sm font-medium text-fg-muted">
                              {isCompleted ? `Assignment cleared on ${new Date(order?.createdAt).toLocaleDateString()}` : `Awaiting protocol initialization.`}
                           </p>
                           {isCurrent && order?.trackingTimeline?.slice(-1)[0]?.remarks && (
                             <div className="mt-4 p-4 bg-bg-muted rounded-xl border border-border-base italic text-xs text-fg-primary/80">
                                " {order.trackingTimeline.slice(-1)[0].remarks} "
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-32 space-y-8">
              
              {/* Technician Info */}
              {order?.technician && (
                <div className="glass-card p-10 rounded-[3rem] border border-blue-600/20 bg-blue-600/[0.02] overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                   <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-8">Assigned <span className="text-blue-500 italic">Agent</span></h3>
                   
                   <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border-2 border-blue-600/20 overflow-hidden shrink-0">
                         <img src={order.technician.profilePic || "/placeholder.png"} className="w-full h-full object-cover" alt="Agent" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-xl font-black text-fg-primary uppercase tracking-tighter truncate">{order.technician.name}</p>
                         <div className="flex items-center gap-2 mt-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className="h-2 w-2 text-yellow-500 fill-yellow-500" />)}
                            <span className="text-[10px] font-black text-fg-muted uppercase ml-1">Elite Tech</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 pt-8 border-t border-border-base">
                      <div className="flex items-center gap-4 text-xs font-black text-fg-primary uppercase tracking-widest group cursor-pointer hover:text-blue-600 transition-colors">
                         <Smartphone className="h-4 w-4 text-blue-500" />
                         <span>{order.technician.phone || "Encrypted Line"}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-black text-fg-primary uppercase tracking-widest">
                         <Clock className="h-4 w-4 text-blue-500" />
                         <span>ETA: {order?.installationSlot ? new Date(order.installationSlot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Calculating...'}</span>
                      </div>
                   </div>

                   <button className="w-full mt-8 py-4 bg-fg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-600 transition-all">
                      Secure Message Tech
                   </button>
                </div>
              )}

              {/* Order Info */}
              <div className="glass-card p-10 rounded-[3rem] border border-border-base relative">
                 <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-8">Order <span className="text-fg-muted italic">Specs</span></h3>
                 <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Address</span>
                       <p className="text-right text-xs font-black text-fg-primary uppercase max-w-[150px] leading-relaxed">{order?.deliveryAddress}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Asset Count</span>
                       <p className="text-xs font-black text-fg-primary uppercase">{order?.products?.length} Layers</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Subtotal</span>
                       <p className="text-lg font-black text-blue-600 uppercase tracking-tighter">₹{order?.totalAmount?.toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              {/* Need Help */}
              <div className="p-8 bg-black rounded-3xl text-center space-y-4">
                 <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Deployment issues?</p>
                 <button className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest">
                    Open Tactical Support <ArrowRight className="h-3 w-3" />
                 </button>
              </div>

            </div>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
};

export default TrackingPage;
