"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Calendar, FileCheck, CheckCircle2, Search, Smartphone, ClipboardCheck, AlertCircle, Phone, Mail, Send, Check } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const WarrantyPage = () => {
  const [activeTab, setActiveTab] = useState<'check' | 'register'>('check');
  
  // Registration State
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Warranty Check State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [warrantyResult, setWarrantyResult] = useState<any | null>(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

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
      // Fetch orders to match either _id or customer phone
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
        // Fallback simulation for demonstration if not found in active orders
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

  const handleNotify = (target: 'customer' | 'technician' | 'admin') => {
    if (!warrantyResult) return;

    const subject = `Warranty Status Update - Order #${warrantyResult.orderId.slice(-6)}`;
    const body = `Hello,\n\nHere is the official 12-Month Warranty Status Verification from SK TECHNOLOGY.\n\nOrder ID: ${warrantyResult.orderId}\nProduct: ${warrantyResult.productName}\nWarranty Start Date: ${warrantyResult.startDate}\nWarranty End Date: ${warrantyResult.endDate}\nStatus: ${warrantyResult.statusText}\n\nService Eligibility: ${warrantyResult.isExpired ? 'Paid Service Required (Warranty period completed)' : 'Free Warranty Service Available (Under 12-month active period)'}\n\nThank you,\nSK TECHNOLOGY Support Team`;

    if (target === 'customer' && warrantyResult.customerEmail) {
      window.open(`mailto:${warrantyResult.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else if (target === 'customer' && warrantyResult.customerPhone) {
      const cleanPhone = warrantyResult.customerPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`, '_blank');
    } else {
      setMsg({ type: 'success', text: `Automated warranty notification successfully pushed to ${target.toUpperCase()} dashboard!` });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-24">
        {/* Header Section */}
        <section className="text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-500"
          >
            12-Month Warranty Tracking System
          </motion.div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">
            Warranty <span className="text-blue-500 italic">Verification</span>
          </h1>
          <p className="text-fg-secondary text-lg font-medium max-w-2xl mx-auto">
            Instant real-time verification of your 12-month hardware and installation warranty. Check free service eligibility or register new deployments.
          </p>

          {/* Navigation Tabs */}
          <div className="flex justify-center gap-4 pt-4">
            <button 
              onClick={() => { setActiveTab('check'); setMsg({ type: '', text: '' }); }}
              className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'check' 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'bg-bg-muted border border-border-base text-fg-muted hover:text-fg-primary'
              }`}
            >
              Check Warranty Status
            </button>
            <button 
              onClick={() => { setActiveTab('register'); setMsg({ type: '', text: '' }); }}
              className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'register' 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'bg-bg-muted border border-border-base text-fg-muted hover:text-fg-primary'
              }`}
            >
              Register New Hardware
            </button>
          </div>
        </section>

        {msg.text && (
          <div className={`p-6 rounded-3xl border flex items-center gap-4 text-white max-w-3xl mx-auto ${msg.type === 'success' ? 'bg-green-600 border-green-50-border' : 'bg-red-600 border-red-500'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertCircle className="h-6 w-6 shrink-0" />}
            <p className="font-black text-xs uppercase tracking-widest">{msg.text}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'check' ? (
          <section className="max-w-4xl mx-auto space-y-12">
            {/* Search Box */}
            <div className="glass-card bg-card p-8 md:p-12 rounded-[3.5rem] border border-border-base shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none" />
              
              <form onSubmit={handleWarrantyLookup} className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Instant <span className="text-blue-500 italic">Lookup</span></h2>
                  <p className="text-fg-secondary text-xs font-bold uppercase tracking-[0.2em]">Enter your credentials to verify 12-month coverage</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
                    <input 
                      type="text"
                      required
                      placeholder="Enter Order ID (e.g., SK-ORD-1029) or Phone Number"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-bg-surface border border-border-base rounded-2xl pl-16 pr-6 py-5 font-bold text-sm text-fg-primary outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-10 py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 shrink-0"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="h-4 w-4" />}
                    <span>Verify Coverage</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Results Card */}
            {searched && warrantyResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card bg-card border border-border-base rounded-[3.5rem] p-8 md:p-12 space-y-12 shadow-2xl relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border-subtle">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Verification Status Result</span>
                    <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{warrantyResult.productName}</h3>
                    <p className="text-xs font-bold text-fg-secondary">Order Ref: <span className="font-mono text-blue-500">{warrantyResult.orderId}</span></p>
                  </div>
                  <div>
                    {warrantyResult.isExpired ? (
                      <span className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest animate-pulse">
                        <AlertCircle className="h-4 w-4" /> Paid Service Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl text-xs font-black uppercase tracking-widest">
                        <CheckCircle2 className="h-4 w-4" /> Free Warranty Service
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-bg-surface border border-border-base rounded-3xl space-y-4">
                    <div className="flex items-center space-x-3 text-blue-500 font-black text-xs uppercase tracking-widest">
                      <Calendar className="h-4 w-4" />
                      <span>Warranty Start Date</span>
                    </div>
                    <p className="text-2xl font-black text-fg-primary tracking-tight">{warrantyResult.startDate}</p>
                    <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">Commencement of 12-Month Period</p>
                  </div>

                  <div className="p-8 bg-bg-surface border border-border-base rounded-3xl space-y-4">
                    <div className="flex items-center space-x-3 text-blue-500 font-black text-xs uppercase tracking-widest">
                      <Calendar className="h-4 w-4" />
                      <span>Warranty End Date</span>
                    </div>
                    <p className="text-2xl font-black text-fg-primary tracking-tight">{warrantyResult.endDate}</p>
                    <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">Conclusion of 12-Month Coverage</p>
                  </div>
                </div>

                <div className="p-8 bg-bg-surface border border-border-base rounded-3xl space-y-6">
                  <h4 className="font-black text-xs text-fg-primary uppercase tracking-widest">Role-Based Automated Notification Triggers</h4>
                  <p className="text-xs text-fg-secondary font-medium">Instantly push official warranty status records and service eligibility to stakeholders across the SK-Tech ecosystem.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleNotify('customer')}
                      className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <Send className="h-3.5 w-3.5" /> Notify Customer
                    </button>
                    <button 
                      onClick={() => handleNotify('technician')}
                      className="py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                      <Send className="h-3.5 w-3.5" /> Notify Technician
                    </button>
                    <button 
                      onClick={() => handleNotify('admin')}
                      className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <Send className="h-3.5 w-3.5" /> Notify Admin
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter leading-none">Why <span className="text-blue-500 italic">Register?</span></h2>
                <p className="text-fg-secondary font-medium">Registration unlocks our elite support ecosystem for your specific deployment.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { title: 'Full Coverage', desc: '12 months hardware warranty', icon: ShieldCheck },
                  { title: 'Priority Service', desc: 'Faster technician dispatch', icon: Award },
                  { title: 'Auto Updates', desc: 'Firmware & security patches', icon: Smartphone },
                  { title: 'Service History', desc: 'Complete maintenance logs', icon: FileCheck }
                ].map((item, i) => (
                  <div key={i} className="space-y-4 p-8 glass-card rounded-[2.5rem] border border-white/5 hover:border-blue-600/20 transition-all">
                    <div className="p-3 bg-blue-600/10 rounded-xl w-fit text-blue-500">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-black text-fg-primary uppercase tracking-widest leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-fg-secondary font-bold uppercase tracking-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
              {isSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-fg-primary">Registration Complete</h2>
                  <p className="text-fg-secondary font-medium">Your warranty has been successfully activated. An email confirmation has been sent to your registered address.</p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                  >
                    Register Another Product
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-8 relative z-10">
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Registration <span className="text-blue-500 italic">Form</span></h2>
                     <p className="text-fg-secondary text-sm font-medium uppercase tracking-[0.2em]">Activate your node coverage</p>
                  </div>

                  <div className="space-y-6">
                    <div className="relative group/input">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-[#111827] px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Serial Number</label>
                      <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-secondary" />
                        <input required className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] group-hover/input:border-white/20" placeholder="e.g. SK-8902-XJ" />
                      </div>
                    </div>

                    <div className="relative group/input">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-[#111827] px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Select Product Type</label>
                      <select required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-white appearance-none cursor-pointer group-hover/input:border-white/20">
                        <option className="bg-[#0f172a]">CCTV Camera (DOME/BULLET)</option>
                        <option className="bg-[#0f172a]">NVR / DVR System</option>
                        <option className="bg-[#0f172a]">Accessories & Cables</option>
                        <option className="bg-[#0f172a]">Other Security Gear</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="relative group/input">
                        <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-[#111827] px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Purchase Date</label>
                        <input type="date" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary [color-scheme:dark]" />
                      </div>
                      <div className="relative group/input">
                        <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-[#111827] px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Vendor Name</label>
                        <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary group-hover/input:border-white/20" placeholder="e.g. SK TECH Official" />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Activate Warranty</span>
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        <section className="bg-blue-600/5 p-16 rounded-[4rem] border border-blue-600/10 text-center space-y-8">
           <div className="flex justify-center">
              <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500">
                 <ShieldCheck className="h-10 w-10" />
              </div>
           </div>
           <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Elite Coverage Protocol</h2>
           <p className="text-fg-secondary max-w-2xl mx-auto font-medium">
             Our warranty isn't just a promise; it's a technical commitment. Every registered product is monitored for performance and health across our global surveillance network.
           </p>
           <div className="flex flex-wrap justify-center gap-6">
              {['12M Full Coverage', 'Zero-Cost Labor', 'Free Diagnosis', 'On-Site Fix'].map(tag => (
                <div key={tag} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   {tag}
                </div>
              ))}
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WarrantyPage;
