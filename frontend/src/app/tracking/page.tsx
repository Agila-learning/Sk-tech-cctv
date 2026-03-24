"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TrackingTimeline from '@/components/product/TrackingTimeline';
import { Search, MapPin, Phone, ShieldCheck, Box, Loader2, ChevronLeft } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import BackButton from '@/components/common/BackButton';

const TrackingContent = () => {
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  const loadTrackingData = async () => {
    try {
      if (orderId) {
        // Fetch specific order if ID is provided
        const orders = await fetchWithAuth('/orders/my-orders');
        const specificOrder = orders.find((o: any) => o._id === orderId);
        if (specificOrder) {
          setLatestOrder(specificOrder);
          setLoading(false);
          return;
        }
      }

      const orders = await fetchWithAuth('/orders/my-orders');
      if (orders && orders.length > 0) {
        const sorted = orders.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLatestOrder(sorted[0]);
      }
    } catch (error) {
      console.error("Tracking Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    // Poll for updates every 60 seconds
    const interval = setInterval(loadTrackingData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      <p className="text-fg-muted font-black uppercase tracking-widest text-xs">Syncing Service Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
               <BackButton className="mb-8" />
               <div className="text-center space-y-4">
                  <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-full mb-4">
                 <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Order Status</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-fg-primary tracking-tighter uppercase">Service <span className="text-fg-muted italic">Tracking</span></h1>
              <p className="text-fg-secondary font-medium max-w-lg mx-auto">Monitor your security infrastructure Service in real-time. Our technical Technicians are on the move.</p>
           </div>

           {!latestOrder ? (
             <div className="glass-card p-20 rounded-[3.5rem] border border-border-base text-center">
                <Box className="h-16 w-16 text-fg-muted mx-auto mb-8 opacity-20" />
                <h3 className="text-2xl font-black text-fg-primary uppercase mb-4">No Active Orders</h3>
                <p className="text-fg-secondary font-medium max-w-xs mx-auto mb-10">You haven't initiated any product orders or service requests yet.</p>
                <Link href="/products" className="inline-block px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20">Browse Products</Link>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-2">
                    <TrackingTimeline 
                      status={latestOrder.status} 
                      orderId={latestOrder._id}
                      technician={latestOrder.technician?.name ? { 
                        name: latestOrder.technician.name, 
                        id: latestOrder.technician._id 
                      } : null}
                    />
                </div>

                <div className="space-y-8">
                   <div className="glass-card p-8 rounded-[2.5rem] border border-border-base space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Service Address</h4>
                      <div className="flex items-start space-x-4">
                         <div className="p-3 bg-bg-muted rounded-xl">
                            <MapPin className="h-4 w-4 text-fg-muted" />
                         </div>
                         <p className="text-xs font-bold text-fg-primary leading-relaxed">{latestOrder.deliveryAddress || 'Office HQ, MG Road, Bangalore'}</p>
                      </div>
                      <div className="flex items-center space-x-4 pt-6 border-t border-border-base">
                         <div className="p-3 bg-bg-muted rounded-xl">
                            <Phone className="h-4 w-4 text-fg-muted" />
                         </div>
                         <p className="text-xs font-black text-fg-primary tracking-widest">+91 {user?.phone || 'SECRET'}</p>
                      </div>
                   </div>

                   <div className="glass-card p-8 rounded-[2.5rem] bg-blue-600/5 border-blue-600/10">
                      <div className="flex items-center space-x-4 mb-6">
                         <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                            <ShieldCheck className="h-6 w-6" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-fg-muted uppercase">Clearance</p>
                            <p className="text-sm text-fg-primary font-black uppercase tracking-widest">Active Guard</p>
                         </div>
                      </div>
                      <p className="text-[11px] text-fg-secondary font-medium leading-relaxed italic border-l-2 border-blue-600/30 pl-4">
                        "Secure installation in progress. Our certified field agents are neutralizing blind spots for maximum coverage."
                      </p>
                   </div>
                   
                   <div className="glass-card p-8 rounded-[2.5rem] border border-border-base">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted mb-6">Order Details</h4>
                      <div className="space-y-4">
                         {latestOrder.products?.map((p: any, i: number) => (
                           <div key={i} className="flex justify-between items-center pb-4 border-b border-border-base last:border-0 last:pb-0">
                              <span className="text-[10px] font-bold text-fg-secondary uppercase tracking-widest">{p.product?.name || 'Security Product'}</span>
                              <span className="text-[10px] font-black text-blue-600 tracking-tighter">x{p.quantity}</span>
                           </div>
                         ))}
                         <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] font-black text-fg-primary uppercase tracking-widest">Total Amount</span>
                            <span className="text-sm font-black text-fg-primary tracking-tighter">₹{latestOrder.totalAmount?.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const TrackingPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-fg-muted font-black uppercase tracking-widest text-xs">Initializing Order Tracking...</p>
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
};

export default TrackingPage;
