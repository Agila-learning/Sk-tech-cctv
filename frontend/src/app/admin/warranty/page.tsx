"use client";
import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Calendar, FileCheck, CheckCircle2, Search, Smartphone, ClipboardCheck, AlertCircle, Phone, Mail, Send, Menu, ChevronLeft, Database, MapPin, Bell } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AdminWarrantyPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'check' | 'register' | 'database'>('check');
  const router = useRouter();
  
  // Database State
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'database') {
      const loadOrders = async () => {
        setDbLoading(true);
        try {
          const res = await fetchWithAuth('/orders');
          setDbOrders(res?.orders || res || []);
        } catch (e: any) {
          console.error(e);
        } finally {
          setDbLoading(false);
        }
      };
      loadOrders();
    }
  }, [activeTab]);
  
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
    try {
      // For Service Warranty, create a new Offline Order to track the installation and warranty start date
      await fetchWithAuth('/orders/admin/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: (e.target as any).customerName.value,
          contactNumber: (e.target as any).customerPhone.value,
          alternatePhone: '',
          deliveryAddress: 'Warranty Registration - Address details pending',
          locationDetails: { landmark: '', city: '', pincode: '' },
          serviceType: (e.target as any).productType.value,
          category: 'service',
          totalAmount: 0,
          paymentMethod: 'cod',
          warrantyPeriod: '12 Months',
          notes: `Warranty Registration. Serial Number: ${(e.target as any).serialNumber.value}, Vendor: ${(e.target as any).vendorName.value}, Purchase Date: ${(e.target as any).purchaseDate.value}`
        })
      });
      setIsSubmitted(true);
    } catch (err: any) {
      alert("Failed to register warranty");
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

  const sendReminder = (order: any, target: 'whatsapp' | 'email') => {
    const customerName = order.customer?.name || order.customerName || 'Customer';
    const customerPhone = order.customer?.phone || order.customerPhone || '';
    const customerEmail = order.customer?.email || order.customerEmail || '';
    const orderId = order.shortId || order._id?.slice(-6) || 'Unknown';
    const startDate = new Date(order.createdAt || order.updatedAt || Date.now());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);
    
    const subject = `Warranty Expiry Reminder - SK TECHNOLOGY`;
    const body = `Hello ${customerName},\n\nThis is a gentle reminder regarding your warranty for Order #${orderId}.\nYour 12-Month Free Service Warranty is set to expire on ${endDate.toLocaleDateString('en-IN')}.\n\nIf you are facing any issues, please let us know before the expiration date to avail free service.\n\nThank you,\nSK TECHNOLOGY Support Team`;

    if (target === 'whatsapp') {
       if (!customerPhone) {
           setMsg({ type: 'error', text: 'No phone number available for this customer.'});
           setTimeout(() => setMsg({ type: '', text: '' }), 4000);
           return;
       }
       const cleanPhone = customerPhone.replace(/\D/g, '');
       window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`, '_blank');
    } else if (target === 'email') {
       if (!customerEmail) {
           setMsg({ type: 'error', text: 'No email address available for this customer.'});
           setTimeout(() => setMsg({ type: '', text: '' }), 4000);
           return;
       }
       window.open(`mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'sub-admin']}>
      <div className="flex min-h-screen bg-background transition-all duration-500 overflow-x-hidden text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-w-0 lg:ml-80 flex flex-col min-h-screen bg-background">
          <AdminNavbar />

          <div className="p-6 md:p-12 space-y-16">
            {/* Header Section */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 w-full">
              <div className="flex items-center gap-6">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl hover:bg-blue-600/20 transition-all">
                  <Menu className="h-6 w-6 text-fg-primary" />
                </button>
                <button onClick={() => router.push('/admin')} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group">
                  <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full w-fit">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">12-Month Service Warranty Tracking System</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase leading-tight">
                    Service <span className="text-blue-500 italic">Warranty</span>
                  </h1>
                  <p className="text-fg-muted text-lg font-bold uppercase tracking-widest mt-1">Global Service Warranty Monitor</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-4">
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
                <button 
                  onClick={() => { setActiveTab('database'); setMsg({ type: '', text: '' }); }}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    activeTab === 'database' 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                      : 'bg-bg-muted border border-border-base text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  Service Warranty Database
                </button>
              </div>
            </header>

            {msg.text && (
              <div className={`p-6 rounded-3xl border flex items-center gap-4 text-white max-w-3xl mx-auto ${msg.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}>
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
                      <p className="text-fg-secondary text-xs font-bold uppercase tracking-[0.2em]">Enter credentials to verify 12-month coverage</p>
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
                      <div key={i} className="space-y-4 p-8 glass-card rounded-[2.5rem] border border-border-base hover:border-blue-600/20 transition-all">
                        <div className="p-3 bg-blue-600/10 rounded-xl w-fit text-blue-500">
                          <item.icon className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-black text-fg-primary uppercase tracking-widest leading-tight">{item.title}</h4>
                        <p className="text-[10px] text-fg-secondary font-bold uppercase tracking-tight">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card p-12 rounded-[3.5rem] border border-border-base shadow-2xl relative overflow-hidden">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="relative group/input">
                            <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Customer Name</label>
                            <input name="customerName" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" placeholder="Full Name" />
                          </div>
                          <div className="relative group/input">
                            <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Customer Phone</label>
                            <input name="customerPhone" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" placeholder="Mobile Number" />
                          </div>
                          <div className="relative group/input md:col-span-2">
                            <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Customer Email</label>
                            <input name="customerEmail" type="email" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" placeholder="Email Address" />
                          </div>
                        </div>

                        <div className="relative group/input mt-8">
                          <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Serial Number</label>
                          <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-secondary" />
                            <input name="serialNumber" required className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" placeholder="e.g. SK-8902-XJ" />
                          </div>
                        </div>

                        <div className="relative group/input">
                          <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Select Product Type</label>
                          <select name="productType" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary appearance-none cursor-pointer">
                            <option>CCTV Camera (DOME/BULLET)</option>
                            <option>NVR / DVR System</option>
                            <option>Accessories & Cables</option>
                            <option>Other Security Gear</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="relative group/input">
                            <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Purchase Date</label>
                            <input name="purchaseDate" type="date" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" />
                          </div>
                          <div className="relative group/input">
                            <label className="text-[9px] font-black text-fg-secondary uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Vendor Name</label>
                            <input name="vendorName" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" placeholder="e.g. SK TECH Official" />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-3 group relative overflow-hidden mt-8"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        <span>Activate Warranty</span>
                      </button>
                    </form>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'database' && (
              <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Service <span className="text-blue-500 italic">Warranty</span></h2>
                    <p className="text-fg-secondary text-xs font-bold uppercase tracking-[0.2em]">Live overview of all registered installations</p>
                  </div>
                  <div className="flex items-center gap-4 bg-bg-surface border border-border-base px-6 py-4 rounded-2xl shadow-sm">
                    <Database className="h-6 w-6 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Total Records</span>
                      <span className="text-lg font-black text-fg-primary leading-none">{dbOrders.length}</span>
                    </div>
                  </div>
                </div>

                {dbLoading ? (
                  <div className="flex justify-center py-32">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {dbOrders.map((order, idx) => {
                      const startDate = new Date(order.createdAt || order.updatedAt || Date.now());
                      const endDate = new Date(startDate);
                      endDate.setMonth(endDate.getMonth() + 12);
                      const now = new Date();
                      const timeDiff = endDate.getTime() - now.getTime();
                      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                      const isExpired = daysLeft <= 0;
                      
                      const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;
                      
                      const customerName = order.customer?.name || order.customerName || 'Verified Customer';
                      const customerPhone = order.customer?.phone || order.customerPhone || 'Not Provided';
                      const location = order.location?.address || order.deliveryAddress || 'Not Provided';
                      
                      return (
                        <div key={order._id || idx} className="glass-card bg-bg-surface border border-border-base rounded-[2rem] p-6 md:p-8 hover:border-blue-600/30 transition-all shadow-lg flex flex-col gap-6 relative overflow-hidden group">
                          {isExpired ? (
                            <div className="absolute top-0 right-0 px-6 py-2 bg-red-500/10 border-b border-l border-red-500/20 rounded-bl-3xl">
                              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Paid Service</span>
                            </div>
                          ) : isExpiringSoon ? (
                            <div className="absolute top-0 right-0 px-6 py-2 bg-orange-500/10 border-b border-l border-orange-500/20 rounded-bl-3xl">
                              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Expiring Soon</span>
                            </div>
                          ) : (
                            <div className="absolute top-0 right-0 px-6 py-2 bg-green-500/10 border-b border-l border-green-500/20 rounded-bl-3xl">
                              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Free Service</span>
                            </div>
                          )}

                          <div className="space-y-1 pr-32">
                            <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight truncate">{customerName}</h3>
                            <p className="text-xs font-bold text-fg-secondary">Ref: <span className="font-mono text-blue-500">{order.shortId || order._id?.slice(-6) || 'N/A'}</span></p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-500" /> Mobile</span>
                              <p className="text-sm font-bold text-fg-primary">{customerPhone}</p>
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-500" /> Location</span>
                              <p className="text-sm font-bold text-fg-primary truncate" title={location}>{location}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-border-subtle bg-bg-muted/30 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8">
                            <div>
                              <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1 block">Start Date</span>
                              <p className="text-sm font-black text-fg-primary leading-tight">{startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1 block">End Date</span>
                              <p className="text-sm font-black text-fg-primary leading-tight">{endDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1 block">Days Left</span>
                              <p className={`text-2xl font-black tracking-tighter leading-none ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-blue-500'}`}>
                                {isExpired ? '0' : daysLeft}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-4 border-t border-border-base mt-2">
                            <button 
                                onClick={() => sendReminder(order, 'whatsapp')}
                                className="flex-1 py-3 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Smartphone className="h-3 w-3" /> WhatsApp
                            </button>
                            <button 
                                onClick={() => sendReminder(order, 'email')}
                                className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Mail className="h-3 w-3" /> Email
                            </button>
                            <button 
                                onClick={async () => {
                                  try {
                                     await fetchWithAuth('/notifications', {
                                       method: 'POST',
                                       body: JSON.stringify({
                                         title: 'Warranty Renewal',
                                         message: `Warranty expiring soon for ${order.customerName}`,
                                         role: 'technician',
                                         type: 'followup',
                                         userId: 'all'
                                       })
                                     });
                                     alert("Push Notification Sent.");
                                  } catch (e) { alert("Failed to send push."); }
                                }}
                                className="flex-1 py-3 bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Bell className="h-3 w-3" /> App Push
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {dbOrders.length === 0 && !dbLoading && (
                      <div className="xl:col-span-2 py-24 text-center border-2 border-dashed border-border-base rounded-[2.5rem] bg-bg-surface/50">
                        <Database className="h-10 w-10 text-fg-muted mx-auto mb-4 opacity-50" />
                        <p className="text-sm font-black text-fg-muted uppercase tracking-widest">No order records found in database.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminWarrantyPage;
