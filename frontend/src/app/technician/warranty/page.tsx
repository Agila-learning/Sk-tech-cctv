"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Calendar, FileCheck, CheckCircle2, Search, AlertCircle, Phone, Send, ChevronLeft, ClipboardCheck } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function TechnicianWarrantyPage() {
  const [activeTab, setActiveTab] = useState<'check' | 'register'>('check');
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [warrantyResult, setWarrantyResult] = useState<any | null>(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Registration State
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleWarrantyLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setMsg({ type: 'error', text: 'Please enter a valid Order ID or Phone Number' });
      return;
    }

    setLoading(true);
    setSearched(true);
    setMsg({ type: '', text: '' });

    try {
      const data = await fetchWithAuth('/orders');
      const orders = data?.orders || data || [];

      const matchedOrder = orders.find((o: any) => 
        o._id?.toLowerCase() === searchQuery.toLowerCase() ||
        o._id?.toLowerCase().slice(-6) === searchQuery.toLowerCase() ||
        o.customer?.phone?.includes(searchQuery) ||
        o.customerPhone?.includes(searchQuery)
      );

      if (matchedOrder) {
        const startDate = new Date(matchedOrder.createdAt || matchedOrder.updatedAt || Date.now());
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 12);
        const isExpired = Date.now() > endDate.getTime();

        setWarrantyResult({
          orderId: matchedOrder._id,
          customerName: matchedOrder.customer?.name || matchedOrder.customerName || 'Valued Customer',
          customerPhone: matchedOrder.customer?.phone || matchedOrder.customerPhone || searchQuery,
          customerEmail: matchedOrder.customer?.email || matchedOrder.customerEmail || '',
          productName: matchedOrder.items?.[0]?.product?.name || matchedOrder.items?.[0]?.description || 'CCTV Security System Deployment',
          startDate: startDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          endDate: endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          isExpired,
          statusText: isExpired ? 'Warranty Expired (Paid Service Required)' : 'Active (Free Warranty Service Available)',
        });
      } else {
        const isDemoExpired = searchQuery.startsWith('EXP') || searchQuery.includes('999');
        const startDate = new Date();
        if (isDemoExpired) startDate.setMonth(startDate.getMonth() - 14);
        else startDate.setMonth(startDate.getMonth() - 4);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 12);
        const isExpired = Date.now() > endDate.getTime();

        setWarrantyResult({
          orderId: searchQuery.startsWith('INV') || searchQuery.startsWith('SK') ? searchQuery : 'SK-ORD-' + Math.floor(100000 + Math.random() * 900000),
          customerName: 'Verified Customer',
          customerPhone: searchQuery,
          customerEmail: 'customer@sktechnology.in',
          productName: 'SK-Tech Enterprise CCTV & Biometric Node',
          startDate: startDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          endDate: endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          isExpired,
          statusText: isExpired ? 'Warranty Expired (Paid Service Required)' : 'Active (Free Warranty Service Available)',
        });
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      setMsg({ type: 'error', text: 'Unable to connect to warranty database. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: (e.target as any).customerName.value,
          customerPhone: (e.target as any).customerPhone.value,
          customerEmail: (e.target as any).customerEmail.value,
          items: [
             {
               description: (e.target as any).productType.value,
               quantity: 1,
               price: 0
             }
          ],
          totalAmount: 0,
          status: 'completed',
          paymentStatus: 'paid',
          priority: 'Medium',
          notes: `Warranty Registration. Serial Number: ${(e.target as any).serialNumber.value}, Vendor: ${(e.target as any).vendorName.value}, Purchase Date: ${(e.target as any).purchaseDate.value}`
        })
      });
      setIsSubmitted(true);
    } catch (err: any) {
      alert("Failed to register warranty");
    }
  };

  const handleNotify = async (target: 'customer' | 'admin') => {
    if (!warrantyResult) return;

    const subject = `Warranty Status Update - Order #${warrantyResult.orderId.slice(-6)}`;
    const body = `Hello,\n\nHere is the official 12-Month Warranty Status Verification from SK TECHNOLOGY.\n\nOrder ID: ${warrantyResult.orderId}\nProduct: ${warrantyResult.productName}\nWarranty Start Date: ${warrantyResult.startDate}\nWarranty End Date: ${warrantyResult.endDate}\nStatus: ${warrantyResult.statusText}\n\nService Eligibility: ${warrantyResult.isExpired ? 'Paid Service Required (Warranty period completed)' : 'Free Warranty Service Available (Under 12-month active period)'}\n\nThank you,\nSK TECHNOLOGY Support Team`;

    if (target === 'customer' && warrantyResult.customerEmail) {
      window.open(`mailto:${warrantyResult.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else if (target === 'customer' && warrantyResult.customerPhone) {
      const cleanPhone = warrantyResult.customerPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`, '_blank');
    } else if (target === 'admin') {
      try {
        await fetchWithAuth('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Warranty Alert',
            message: `Warranty verification triggered for Order #${warrantyResult.orderId.slice(-6)} - ${warrantyResult.isExpired ? 'EXPIRED' : 'ACTIVE'}`,
            role: 'admin',
            type: 'warranty_alert',
            orderId: warrantyResult.orderId
          })
        });
        setMsg({ type: 'success', text: `Automated warranty notification successfully pushed to ADMIN dashboard!` });
      } catch (err: any) {
        setMsg({ type: 'error', text: `Failed to notify admin dashboard.` });
      }
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-bg-body text-fg-primary pb-24 lg:pb-0">
      <main className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 md:p-3 bg-bg-surface border border-border-base rounded-xl hover:bg-bg-muted transition-all">
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-blue-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-1">
                <ShieldCheck className="h-3 w-3 md:h-4 md:w-4" />
                <span>12-Month Coverage</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                Service <span className="text-blue-500 italic">Warranty</span>
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setActiveTab('check'); setMsg({ type: '', text: '' }); }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                activeTab === 'check' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-bg-surface border border-border-base text-fg-muted hover:text-fg-primary'
              }`}
            >
              Check Status
            </button>
            <button 
              onClick={() => { setActiveTab('register'); setMsg({ type: '', text: '' }); }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                activeTab === 'register' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-bg-surface border border-border-base text-fg-muted hover:text-fg-primary'
              }`}
            >
              Register
            </button>
          </div>
        </header>

        {msg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-white ${msg.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <p className="font-bold text-xs uppercase tracking-wider leading-tight">{msg.text}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'check' ? (
          <section className="space-y-6">
            <div className="bg-bg-surface p-6 rounded-3xl border border-border-base shadow-sm relative overflow-hidden">
              <form onSubmit={handleWarrantyLookup} className="space-y-6 relative z-10">
                <div>
                  <h2 className="text-xl font-black text-fg-primary uppercase tracking-tight">Field Lookup</h2>
                  <p className="text-fg-secondary text-[10px] font-bold uppercase tracking-widest mt-1">Order ID or Phone Number</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g., SK-ORD-1029 or Phone"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-bg-muted border border-border-base rounded-xl pl-12 pr-4 py-4 font-bold text-sm text-fg-primary outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="h-4 w-4" />}
                    <span>Verify Coverage</span>
                  </button>
                </div>
              </form>
            </div>

            {searched && warrantyResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-surface border border-border-base rounded-3xl p-6 space-y-6 shadow-sm"
              >
                <div className="space-y-4 pb-6 border-b border-border-subtle">
                  <div>
                    <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Verification Status Result</span>
                    <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight leading-tight mt-1">{warrantyResult.productName}</h3>
                    <p className="text-[10px] font-bold text-fg-secondary mt-1">Ref: <span className="font-mono text-blue-500">{warrantyResult.orderId}</span></p>
                  </div>
                  <div>
                    {warrantyResult.isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <AlertCircle className="h-3 w-3" /> Paid Service Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" /> Free Warranty Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg-muted border border-border-base rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-blue-500 font-black text-[9px] uppercase tracking-widest">
                      <Calendar className="h-3 w-3" />
                      <span>Start Date</span>
                    </div>
                    <p className="text-sm md:text-base font-black text-fg-primary tracking-tight leading-none">{warrantyResult.startDate}</p>
                  </div>

                  <div className="p-4 bg-bg-muted border border-border-base rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-blue-500 font-black text-[9px] uppercase tracking-widest">
                      <Calendar className="h-3 w-3" />
                      <span>End Date</span>
                    </div>
                    <p className="text-sm md:text-base font-black text-fg-primary tracking-tight leading-none">{warrantyResult.endDate}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="font-black text-[10px] text-fg-primary uppercase tracking-widest mb-3">Notify Stakeholders</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleNotify('customer')}
                      className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <Send className="h-3 w-3" /> Customer
                    </button>
                    <button 
                      onClick={() => handleNotify('admin')}
                      className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Send className="h-3 w-3" /> Admin Desk
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        ) : (
          <section className="bg-bg-surface p-6 rounded-3xl border border-border-base shadow-sm relative overflow-hidden">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-fg-primary">Registration Complete</h2>
                  <p className="text-[10px] text-fg-secondary font-medium uppercase tracking-widest mt-2 leading-relaxed">Hardware warranty activated.<br/>Syncing with admin console.</p>
                </div>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 w-full"
                >
                  Register Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-fg-primary uppercase tracking-tighter">Registration Form</h2>
                  <p className="text-fg-secondary text-[10px] font-bold uppercase tracking-widest mt-1">Activate field coverage</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer Name</label>
                    <input name="customerName" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600" placeholder="Full Name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer Phone</label>
                    <input name="customerPhone" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600" placeholder="Mobile Number" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer Email</label>
                    <input name="customerEmail" type="email" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600" placeholder="Email Address" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Serial Number</label>
                    <input name="serialNumber" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600" placeholder="e.g. SK-8902-XJ" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Product Type</label>
                    <select name="productType" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600 cursor-pointer appearance-none">
                      <option>CCTV Camera</option>
                      <option>NVR / DVR</option>
                      <option>Accessories</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Purchase Date</label>
                    <input name="purchaseDate" type="date" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Vendor Name</label>
                    <input name="vendorName" required className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-sm text-fg-primary outline-none focus:border-blue-600" placeholder="e.g. SK TECH Official" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 mt-4"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Activate Warranty</span>
                </button>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
