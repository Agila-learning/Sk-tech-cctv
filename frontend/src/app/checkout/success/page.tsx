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
      <div className="hidden print:block print:p-0 absolute top-0 left-0 w-full bg-white z-[9999] font-sans text-black overflow-hidden h-[98vh]">
         <style>{`
           @media print {
             @page { size: A4 portrait; margin: 0; }
             body { overflow: hidden !important; height: 100vh !important; }
             nav, footer, .non-print { display: none !important; }
             * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
           }
         `}</style>
         {/* Internal Container for Bordering */}
         <div className="border-2 border-black p-8 m-4 relative h-full box-border">
            
            {/* Header section with Logo and Company Info */}
            <div className="flex border-b-2 border-black pb-6 mb-6">
               {/* Left Logo - In a real scenario this maps to the static logo.png */}
               <div className="w-1/4 flex flex-col items-center justify-center border-r-2 border-black pr-6">
                  <img src="/logo.png" alt="SK Technology" className="w-24 h-24 object-contain mb-2" />
               </div>
               
               {/* Center Company Info */}
               <div className="w-3/4 pl-6 flex flex-col justify-center text-center">
                  <h1 className="text-3xl font-black tracking-tighter text-blue-800 uppercase m-0 leading-tight">SK TECHNOLOGY</h1>
                  <p className="text-sm font-bold text-red-600 uppercase tracking-widest italic mb-1">Your life is in your hands</p>
                  <p className="text-xs font-semibold text-gray-800">CCTV | BIOMETRIC | VIDEO DOOR PHONE | NETWORKING</p>
                  <p className="text-xs font-semibold text-gray-800">BURGLAR ALARM | UPS | DESKTOP & LAPTOP SERVICES</p>
                   <p className="text-[10px] text-gray-700 mt-2 font-medium">2/222 A, Down Street, Berigai Road, Shoolagiri, Krishnagiri, Tamil Nadu – 635117</p>
                   <p className="text-[10px] text-gray-700 font-medium">Mobile: 9600975483 | GSTIN: 33BWOPN1889F1Z4 | PAN: BWOPN1889F</p>
                   <p className="text-[10px] text-gray-700 font-medium">Email: sktechnologycctv@gmail.com</p>
               </div>
            </div>

            {/* Bill Title */}
            <div className="bg-blue-800 text-white text-center py-2 mb-6 border border-black">
               <h2 className="text-sm font-bold uppercase tracking-[0.3em]">BILL OF SUPPLY</h2>
            </div>

            {/* Customer & Invoice Details */}
            <div className="flex justify-between items-start mb-6">
               <div className="w-2/3 pr-4">
                  <p className="text-xs font-black uppercase text-gray-500 mb-1 border-b border-gray-300 pb-1 w-max">Billed To</p>
                  <p className="text-base font-bold text-black">{user?.name || 'Customer Name'}</p>
                  <p className="text-xs text-black w-3/4 leading-relaxed">{order?.deliveryAddress || 'No Address Provided'}</p>
                  <p className="text-xs text-black font-semibold mt-1">Ph: {user?.phone || 'N/A'}</p>
               </div>
               <div className="w-1/3 border border-black p-3 space-y-2 bg-gray-50">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                     <span className="text-xs font-bold text-gray-600">INVOICE NO:</span>
                     <span className="text-xs font-black text-black">#{orderId?.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-xs font-bold text-gray-600">DATE:</span>
                     <span className="text-xs font-black text-black">{new Date().toLocaleDateString('en-IN')}</span>
                  </div>
               </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse border border-black mb-6">
               <thead>
                  <tr className="bg-gray-100 border-b border-black">
                     <th className="py-2 px-3 text-[10px] font-bold uppercase border-r border-black w-12 text-center">S.No</th>
                     <th className="py-2 px-3 text-[10px] font-bold uppercase border-r border-black">Particulars</th>
                     <th className="py-2 px-3 text-[10px] font-bold uppercase border-r border-black w-20 text-center">Qty</th>
                     <th className="py-2 px-3 text-[10px] font-bold uppercase border-r border-black w-24 text-right">Rate (₹)</th>
                     <th className="py-2 px-3 text-[10px] font-bold uppercase w-28 text-right">Amount (₹)</th>
                  </tr>
               </thead>
               <tbody>
                  {order?.products?.map((p: any, idx: number) => (
                     <tr key={idx} className="border-b border-gray-300">
                        <td className="py-2 px-3 text-xs text-center border-r border-black">{idx + 1}</td>
                        <td className="py-2 px-3 text-sm font-semibold text-black border-r border-black">{p.product?.name || 'Security Component'}</td>
                        <td className="py-2 px-3 text-xs text-center font-bold border-r border-black">{p.quantity}</td>
                        <td className="py-2 px-3 text-xs text-right border-r border-black">{p.price.toLocaleString()}</td>
                        <td className="py-2 px-3 text-sm font-black text-right border-black">{Number(p.price * p.quantity).toLocaleString()}</td>
                     </tr>
                  ))}
                  {/* Empty rows filler if needed */}
                  {[...Array(Math.max(0, 5 - (order?.products?.length || 0)))].map((_, i) => (
                     <tr key={`fill-${i}`}>
                        <td className="py-4 px-3 border-r border-black"></td><td className="py-4 px-3 border-r border-black"></td>
                        <td className="py-4 px-3 border-r border-black"></td><td className="py-4 px-3 border-r border-black"></td>
                        <td className="py-4 px-3"></td>
                     </tr>
                  ))}
               </tbody>
               <tfoot>
                  <tr className="border-t-2 border-black bg-gray-50">
                     <td colSpan={4} className="py-3 px-3 text-right text-xs font-black uppercase text-gray-700 border-r border-black tracking-widest">
                        Total Amount Payable
                     </td>
                     <td className="py-3 px-3 text-lg font-black text-right text-black">
                        ₹{order?.totalAmount?.toLocaleString() || '0'}
                     </td>
                  </tr>
               </tfoot>
            </table>

            {/* Total In Words */}
            <div className="mb-6">
               <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Total Value (In Words):</p>
               <p className="text-xs font-black text-black capitalize italic">
                  Indian Rupees {order?.totalAmount?.toLocaleString()} Only
               </p>
            </div>

            {/* Footer / Bank / Signatures */}
            <div className="flex border-t-2 border-black mt-10">
               {/* Bank Details */}
               <div className="w-1/2 flex flex-col justify-center border-r border-black pr-4 py-4">
                  <h3 className="text-[10px] font-black uppercase text-blue-800 tracking-widest mb-3 underline">Bank Account Details</h3>
                  <p className="text-[11px] font-bold text-black mb-1"><span className="text-gray-600">Bank:</span> HDFC BANK LTD</p>
                  <p className="text-[11px] font-bold text-black mb-1"><span className="text-gray-600">A/c Name:</span> SK TECHNOLOGY</p>
                  <p className="text-[11px] font-bold text-black mb-1"><span className="text-gray-600">A/c No:</span> 50200062751489</p>
                  <p className="text-[11px] font-bold text-black"><span className="text-gray-600">IFSC Code:</span> HDFC0001866</p>
               </div>
               
               {/* UPI QR & Authorization */}
               <div className="w-1/2 pl-4 py-4 flex flex-col justify-between relative">
                   <div className="flex justify-between items-start">
                      <div className="flex flex-col items-center">
                         <img src="/assets/payment-qr.png" alt="Payment QR" className="w-24 h-24 object-contain mb-1 border border-gray-300" />
                         <p className="text-[8px] font-bold text-blue-800 uppercase tracking-wider">Scan to Pay</p>
                         <div className="flex flex-wrap gap-1 mt-1 justify-center">
                           {['GPay', 'PhonePe', 'Paytm', 'UPI'].map(method => (
                             <span key={method} className="text-[7px] font-black bg-blue-800 text-white px-1.5 py-0.5 rounded">{method}</span>
                           ))}
                         </div>
                         <p className="text-[7px] font-bold text-gray-600 mt-1">NetBanking also accepted</p>
                      </div>
                     <div className="text-right flex flex-col justify-end items-end h-full mt-10">
                        <div className="text-center">
                           <p className="text-[10px] font-black mt-12 pt-2 border-t border-black text-black uppercase tracking-widest w-40 inline-block">Authorised Signatory</p>
                           <p className="text-[8px] font-bold text-blue-800 mt-1 uppercase">For SK Technology</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Computer Generated Disclaimer */}
            <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 bg-white px-2">
                           </div>
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
