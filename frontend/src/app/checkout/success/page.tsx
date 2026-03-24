"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  FileText, 
  ArrowRight, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Printer,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

import { Suspense } from 'react';

const SuccessPageContent = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const orders = await fetchWithAuth('/orders/my-orders');
      const currentOrder = orders.find((o: any) => o._id === orderId);
      setOrder(currentOrder);
    } catch (err) {
      console.error("Failed to fetch order details", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-48 pb-32">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20"
          >
            <CheckCircle2 className="h-12 w-12 text-white" />
          </motion.div>
          <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase mb-4">Deployment <span className="text-blue-600 italic">Confirmed</span></h1>
          <p className="text-fg-muted font-medium text-lg">Your SK Technology security protocol has been initialized.</p>
          <p className="mt-2 text-blue-600 font-bold uppercase tracking-widest text-xs">Order ID: #{orderId?.slice(-8).toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Order Snapshot */}
          <div className="p-10 glass-card rounded-[3rem] border border-border-base relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Installation Date</p>
                   <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <p className="text-lg font-black text-fg-primary">
                        {order?.installationSlot ? new Date(order.installationSlot).toLocaleDateString() : 'To be assigned'}
                      </p>
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Delivery Address</p>
                   <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <p className="text-sm font-bold text-fg-primary truncate max-w-[200px]">{order?.deliveryAddress}</p>
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Payment Status</p>
                   <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-black text-fg-primary uppercase tracking-tight">{order?.paymentStatus}</p>
                   </div>
                </div>
             </div>

             <div className="mt-10 pt-10 border-t border-border-base">
                <h4 className="text-xs font-black text-fg-primary uppercase tracking-widest mb-6">Asset List</h4>
                <div className="space-y-4">
                   {order?.products.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                         <span className="font-bold text-fg-muted uppercase tracking-tighter">{p.product?.name || 'Security Asset'} × {p.quantity}</span>
                         <span className="font-black text-fg-primary">₹{(p.price * p.quantity).toLocaleString()}</span>
                      </div>
                   ))}
                   <div className="flex justify-between items-center pt-4 border-t border-dashed border-border-base">
                      <span className="text-sm font-black text-fg-primary uppercase">Total Value</span>
                      <span className="text-xl font-black text-blue-600">₹{order?.totalAmount.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button 
                onClick={() => router.push(`/tracking/${orderId}`)}
                className="group flex items-center justify-between p-8 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
             >
                <div className="flex items-center gap-4">
                   <Truck className="h-6 w-6" />
                   <div className="text-left">
                      <p className="font-black uppercase tracking-tight">Track Progress</p>
                      <p className="text-[10px] text-blue-100 uppercase tracking-widest">Real-time status updates</p>
                   </div>
                </div>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
             </button>

             <button 
                onClick={handlePrint}
                className="group flex items-center justify-between p-8 bg-bg-muted hover:bg-bg-surface text-fg-primary rounded-3xl border border-border-base transition-all active:scale-95"
             >
                <div className="flex items-center gap-4">
                   <FileText className="h-6 w-6 text-blue-500" />
                   <div className="text-left">
                      <p className="font-black uppercase tracking-tight">Invoice Details</p>
                      <p className="text-[10px] text-fg-muted uppercase tracking-widest">Print / View Transaction</p>
                   </div>
                </div>
                <Printer className="h-5 w-5 text-fg-muted group-hover:scale-110 transition-transform" />
             </button>
          </div>

          <div className="text-center mt-8">
             <button 
                onClick={() => router.push('/')}
                className="text-xs font-black text-fg-muted hover:text-blue-500 uppercase tracking-[0.3em] transition-colors"
             >
                Back to Command Center
             </button>
          </div>
        </div>
      </div>

      {/* Invoice Printable Section (Hidden in Screen) */}
      <div className="hidden print:block print:p-20 fixed inset-0 bg-white z-[9999]">
         <div className="flex justify-between items-start mb-20">
            <div>
               <h1 className="text-4xl font-black tracking-tighter text-black uppercase">SK TECHNOLOGY</h1>
               <p className="text-sm text-gray-500 uppercase tracking-widest">Security Deployment Invoice</p>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold text-black uppercase">ORDER ID: #{orderId}</p>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Date: {new Date().toLocaleDateString()}</p>
            </div>
         </div>
         <div className="mb-20">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Client Details</h2>
            <p className="text-lg font-black text-black">{user?.name}</p>
            <p className="text-sm text-gray-600">{order?.deliveryAddress}</p>
            <p className="text-sm text-gray-600">Phone: {user?.phone}</p>
         </div>
         <table className="w-full text-left border-collapse mb-20 text-black">
            <thead>
               <tr className="border-b-2 border-black">
                  <th className="py-4 text-[10px] uppercase tracking-widest font-black">Description</th>
                  <th className="py-4 text-center text-[10px] uppercase tracking-widest font-black">Qty</th>
                  <th className="py-4 text-right text-[10px] uppercase tracking-widest font-black">Price</th>
                  <th className="py-4 text-right text-[10px] uppercase tracking-widest font-black">Subtotal</th>
               </tr>
            </thead>
            <tbody>
               {order?.products.map((p: any, idx: number) => (
                  <tr key={idx} className="border-b">
                     <td className="py-4 font-bold text-sm uppercase tracking-tight">{p.product?.name || 'Security Asset'}</td>
                     <td className="py-4 text-center text-sm">{p.quantity}</td>
                     <td className="py-4 text-right text-sm">₹{p.price.toLocaleString()}</td>
                     <td className="py-4 text-right text-sm font-black">₹{(p.price * p.quantity).toLocaleString()}</td>
                  </tr>
               ))}
            </tbody>
            <tfoot>
               <tr>
                  <td colSpan={3} className="py-10 text-right font-black uppercase text-xs">Total Payable Value</td>
                  <td className="py-10 text-right text-2xl font-black">₹{order?.totalAmount.toLocaleString()}</td>
               </tr>
            </tfoot>
         </table>
         <div className="text-center pt-20 border-t">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Thank you for securing with SK Technology</p>
            <p className="text-[8px] font-bold text-gray-300">This is a system generated document. No signature required.</p>
         </div>
      </div>

      <Footer />
    </main>
  );
};

const SuccessPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
};

export default SuccessPage;
