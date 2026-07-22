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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Collect form data
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      
      const payload = {
        customerName: data.customerName,
        customerMobile: data.customerMobile,
        customerEmail: data.customerEmail,
        productName: data.productType, // using productName for type
        issueDescription: `Serial: ${data.serialNumber} | Vendor: ${data.vendorName} | Purchase Date: ${data.purchaseDate}`,
        status: 'Created'
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/product-warranty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to register');
      
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Registration failed. Please make sure you are logged in.");
    } finally {
      setLoading(false);
    }
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/internal/warranty-check?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch warranty details');
      }
      
      const data = await res.json();
      
      setWarrantyResult({
        orderId: data.orderId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        productName: data.productName,
        startDate: new Date(data.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        endDate: new Date(data.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        isExpired: data.isExpired,
        statusText: data.isExpired ? 'Warranty Expired (Paid Service Required)' : 'Active (Free Warranty Service Available)',
      });

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

            <div className="relative mx-auto w-full max-w-[640px] rounded-[32px] p-6 md:p-8 overflow-hidden shadow-[0_25px_60px_rgba(15,23,42,0.08)] transition-all duration-300" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.6)' }}>
              {/* Subtle background gradients */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 -right-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <span className="text-[120px] font-black tracking-tighter text-blue-900 rotate-[-15deg] uppercase">SK TECH</span>
              </div>

              {isSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 relative z-10">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-[28px] md:text-[32px] font-black uppercase tracking-tight text-[#0f172a]">Warranty Activated Successfully</h2>
                  <p className="text-[#64748B] font-medium">Your warranty has been successfully activated. An email confirmation has been sent to your registered address.</p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="w-full mt-4 h-[64px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:scale-[1.02] active:scale-[0.99] text-white rounded-[20px] font-bold text-sm tracking-[0.08em] uppercase transition-all shadow-[0_15px_35px_rgba(37,99,235,0.35)]"
                  >
                    Register Another Product
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-[24px] relative z-10">
                  <div className="space-y-2 text-center mb-6">
                     <h2 className="text-[32px] md:text-[42px] font-black text-[#0f172a] tracking-tight leading-tight">Activate Your Warranty</h2>
                     <p className="text-[#64748B] text-sm md:text-base font-medium">Register your product to receive official warranty coverage and support.</p>
                  </div>

                  <style dangerouslySetInnerHTML={{__html: `
                    .saas-input {
                      width: 100%;
                      background: #FFFFFF;
                      border: 1.5px solid #D7DFEA;
                      border-radius: 16px;
                      height: 56px;
                      padding: 16px;
                      color: #0f172a;
                      font-weight: 600;
                      transition: all 0.2s ease;
                      outline: none;
                    }
                    .saas-input::placeholder { color: #94A3B8; font-weight: 500; }
                    .saas-input:focus {
                      border-color: #2563EB;
                      box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
                      transform: translateY(-1px);
                    }
                    .saas-label {
                      display: block;
                      font-size: 13px;
                      font-weight: 700;
                      color: #334155;
                      margin-bottom: 8px;
                    }
                  `}} />

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="saas-label">👤 Customer Name</label>
                      <input name="customerName" required className="saas-input" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="saas-label">📱 Mobile Number</label>
                      <input name="customerMobile" type="tel" required className="saas-input" placeholder="+91 98765 43210" />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="saas-label">✉️ Email Address</label>
                    <input name="customerEmail" type="email" required className="saas-input" placeholder="john@example.com" />
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="saas-label">🔢 Serial Number</label>
                    <div className="relative">
                      <input name="serialNumber" required className="saas-input pr-12" placeholder="e.g. SK-8902-XJ" />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div>
                    <label className="saas-label">📦 Product Type</label>
                    <select name="productType" required className="saas-input appearance-none bg-no-repeat cursor-pointer" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundPosition: "right 16px center", backgroundSize: "16px" }}>
                      <option value="">Select a product</option>
                      <option>CCTV Camera (DOME/BULLET)</option>
                      <option>NVR / DVR System</option>
                      <option>Accessories & Cables</option>
                      <option>Other Security Gear</option>
                    </select>
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="saas-label">📅 Purchase Date</label>
                      <input name="purchaseDate" type="date" required className="saas-input text-[#64748B] focus:text-[#0f172a]" />
                    </div>
                    <div>
                      <label className="saas-label">🏢 Vendor Name</label>
                      <input name="vendorName" required className="saas-input" placeholder="e.g. SK TECH Official" />
                    </div>
                  </div>

                  {/* Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-[64px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:scale-[1.02] active:scale-[0.99] text-white rounded-[20px] font-bold text-[15px] tracking-[0.08em] uppercase transition-all shadow-[0_15px_35px_rgba(37,99,235,0.35)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100 mt-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Activating Warranty...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5" />
                        <span>Activate Warranty</span>
                      </>
                    )}
                  </button>

                  {/* Trust Row */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider pt-2">
                    <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Secure Registration</span>
                    <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Instant Warranty Activation</span>
                    <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Official Support</span>
                  </div>
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
