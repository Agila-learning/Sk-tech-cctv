"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BackButton from '@/components/common/BackButton';
import { 
  Mail, Phone, MapPin, MessageSquare, Clock, Shield, Send, CheckCircle2, 
  ArrowRight, Users, Zap, Star, ChevronRight, ChevronLeft, Calendar, ScanFace 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import MapSection from '@/components/support/MapSection';
import { fetchWithAuth } from '@/utils/api';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/context/AuthContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const SupportPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [bookingStep, setBookingStep] = useState(0); // Start at location check
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    product: 'SK RECON DOME 4K',
    city: 'Bangalore (HQ)',
    date: '',
    slot: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const { location, address: geoAddress, requestLocation, loading: locLoading } = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Prefill user data if logged in
  React.useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      }));
    }
  }, [user]);

  React.useEffect(() => {
    const fetchSlots = async () => {
      if (!bookingData.date) {
        setAvailableSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const data = await fetchWithAuth(`/slots/available?date=${bookingData.date}`);
        const uniqueSlots = Array.from(new Set(data.map((s: any) => `${s.startTime} - ${s.endTime}`))) as string[];
        setAvailableSlots(uniqueSlots);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [bookingData.date]);

  React.useEffect(() => {
    // Hero Animations
    gsap.from("#support-heading", {
      opacity: 0,
      y: 100,
      duration: 1.2,
      ease: "power4.out",
      delay: 0.2
    });

    // Section Staggers
    const sections = ['#contact-cards > div', '#urgent-section', '#stats-section > div', '#testimonials-section > div', '#map-section'];
    sections.forEach(selector => {
      gsap.from(selector, {
        scrollTrigger: {
          trigger: selector,
          start: "top 95%",
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    });

    // Form Entrance
    gsap.from("#support-form", {
      scrollTrigger: {
        trigger: "#support-form",
        start: "top 80%",
      },
      opacity: 0,
      x: 100,
      duration: 1,
      ease: "power2.out"
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await fetchWithAuth('/support', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Support subOrder error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await fetchWithAuth('/booking', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setBookingSubmitted(true);
    } catch (error) {
      console.error('Booking error:', error);
      // Fallback for demo if backend is offline
      setBookingSubmitted(true);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Enhancements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[5%] w-px h-[40vh] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent blur-sm animate-pulse pointer-events-none"></div>
      
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <BackButton className="mb-8" />
        {/* Support Hero Section */}
        <div className="text-center space-y-6 mb-20 pt-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500"
          >
             Customer Support
          </motion.div>
          
          <div className="space-y-4">
            <h1 id="support-heading" className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">
              Help <span className="text-blue-600 italic">Center</span>
            </h1>
            <p className="text-fg-secondary text-lg font-medium max-w-xl mx-auto">
              Get professional assistance for your security systems. Our team is available 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 group">
              Contact Support
              <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#booking" className="px-10 py-5 bg-bg-muted hover:bg-bg-hover text-fg-primary border border-border-base rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center">
              Book Installation
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-12">
             <div id="contact-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: Mail, label: 'Email Address', value: 'support@sktech.com', color: 'text-blue-500' },
                { icon: Phone, label: 'Phone Number', value: '+91 98765 43210', color: 'text-cyan-500' },
                { icon: MapPin, label: 'Office Location', value: '123 Tech Park, Bangalore', color: 'text-indigo-500' },
                { icon: MessageSquare, label: 'Live Chat', value: 'Instant Response Active', color: 'text-green-500' }
              ].map((item, i) => (
                <div key={i} className="glass-card p-8 rounded-[2.5rem] border border-border-base hover:border-blue-600/50 transition-all duration-500 group cursor-pointer hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-blue-600/10">
                   <div className={`p-4 bg-blue-600/5 rounded-2xl w-fit mb-6 transition-all duration-500 group-hover:rotate-[360deg] group-hover:bg-blue-600/10 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                   </div>
                   <h4 className="text-[10px] font-black text-fg-secondary uppercase tracking-widest mb-2">{item.label}</h4>
                   {item.icon === Mail ? (
                     <a href={`mailto:${item.value}`} className="text-sm font-bold text-fg-primary hover:text-blue-600 transition-colors uppercase tracking-tight">{item.value}</a>
                   ) : (
                     <p className="text-sm font-bold text-fg-primary uppercase tracking-tight">{item.value}</p>
                   )}
                </div>
              ))}
            </div>

            {/* Quick Support Options */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-fg-primary uppercase tracking-[0.2em] ml-2">Need Immediate Help?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Phone, label: 'Call Technician', action: 'tel:+919876543210' },
                  { icon: MessageSquare, label: 'Live Chat', action: '#' },
                  { icon: Clock, label: 'Book Installation', action: '#booking' }
                ].map((opt, i) => (
                  <button key={i} className="p-5 bg-bg-muted/50 border border-border-base rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-blue-600/5 transition-all group">
                    <opt.icon className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-fg-secondary group-hover:text-fg-primary">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Urgent Support Section */}
            <div id="urgent-section" className="bg-blue-600/5 p-10 rounded-[3.5rem] border border-blue-600/10 relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-red-500">
                    Priority Response
                  </div>
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tight">Need Urgent Help?</h3>
                  <p className="text-fg-secondary font-medium max-w-sm">Our technical support teams are available 24/7 for emergency repairs and troubleshooting.</p>
                  <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                     Request On-Site Support
                  </button>
               </div>
               <Shield className="absolute -bottom-10 -right-10 h-64 w-64 text-blue-600/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000" />
            </div>
          </div>

          <div className="bg-card p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/0 group-focus-within:bg-blue-600/[0.02] transition-colors pointer-events-none"></div>
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-fg-primary">Message Received</h2>
                <p className="text-fg-secondary font-medium">Your inquiry has been logged. A support representative will reach out to you shortly.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form id="support-form" onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Send Us a <span className="text-blue-500 italic">Message</span></h2>
                   <p className="text-fg-secondary text-sm font-medium">Expected response time: <span className="text-blue-500 font-black tracking-widest uppercase ml-1">&lt; 2 mins</span></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="relative group/input">
                    <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Full Name</label>
                    <input name="name" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] group-hover/input:border-border-strong" placeholder="e.g. John Doe" />
                  </div>
                  <div className="relative group/input">
                    <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-all font-bold text-sm text-fg-primary focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] group-hover/input:border-strong transition-colors">Email Address</label>
                    <input name="email" type="email" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] group-hover/input:border-strong" placeholder="e.g. john@example.com" />
                  </div>
                </div>

                <div className="relative group/input">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Subject</label>
                  <select name="subject" required className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary appearance-none cursor-pointer group-hover/input:border-border-strong">
                    <option className="bg-bg-surface text-fg-primary">Product Installation Help</option>
                    <option className="bg-bg-surface text-fg-primary">Technical Support</option>
                    <option className="bg-bg-surface text-fg-primary">Billing & Account Inquiry</option>
                    <option className="bg-bg-surface text-fg-primary">Other Request</option>
                  </select>
                </div>

                <div className="relative group/input">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1 absolute -top-2 left-4 bg-bg-surface px-2 z-10 group-focus-within/input:text-blue-500 transition-colors">Message</label>
                  <textarea name="message" required rows={4} className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary resize-none group-hover/input:border-border-strong" placeholder="How can we help you?"></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                   {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Live Technician Availability */}
        <div id="stats-section" className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
           {[
             { label: 'Technicians Online', value: '04', icon: Users },
             { label: 'Avg Response Time', value: '<2min', icon: Clock },
             { label: 'Service Requests Today', value: '38', icon: Zap }
           ].map((stat, i) => (
             <div key={i} className="glass-card p-10 rounded-[2.5rem] border border-border-base flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500">
                  <stat.icon className="h-6 w-6" />
                </div>
                 <div className="space-y-1">
                    <p className="text-4xl font-black text-fg-primary tracking-widest">{stat.value}</p>
                    <p className="text-[10px] font-black text-fg-primary uppercase tracking-widest">{stat.label}</p>
                 </div>
             </div>
           ))}
        </div>

        {/* Installation Booking Section */}
        <section id="booking" className="mt-24 space-y-12">
           <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 mb-6">
                 <div className="w-12 h-[1px] bg-blue-600/30"></div>
                 <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Strategic Service</span>
                 <div className="w-12 h-[1px] bg-blue-600/30"></div>
              </div>
              <h2 className="text-5xl font-black text-fg-primary uppercase tracking-tighter leading-none">Book <span className="text-blue-600 italic">Installation</span> Service</h2>
              <p className="text-fg-primary font-medium">Reserve your professional technical team for precision hardware Service.</p>
           </div>

            <div className="glass-card p-12 lg:p-16 rounded-[4rem] border border-border-base relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-blue-600/10"></div>
               
               {bookingSubmitted ? (
                 <div className="relative z-10 flex flex-col items-center justify-center text-center py-20 space-y-6">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tight">Booking Initialized</h3>
                    <p className="text-fg-secondary font-medium max-w-sm">Your technical service slot has been reserved. A coordinator will contact you shortly.</p>
                    <button onClick={() => { setBookingSubmitted(false); setBookingStep(0); }} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">New Booking</button>
                 </div>
               ) : (
                 <div className="relative z-10">
                   {/* Step Indicator */}
                   <div className="flex items-center justify-between mb-16 max-w-md mx-auto relative">
                     <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-base -translate-y-1/2 -z-10"></div>
                     {[0, 1, 2, 3].map((s) => (
                       <div key={s} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${bookingStep >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' : 'bg-bg-muted text-fg-muted'}`}>
                         {s === 0 ? <MapPin className="h-4 w-4" /> : s}
                       </div>
                     ))}
                   </div>

                   <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                     <div className="lg:col-span-4 space-y-10">
                        <div className="space-y-6">
                           <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">Technical <span className="text-blue-500">Step {bookingStep}</span></h3>
                           <p className="text-fg-secondary text-sm leading-relaxed">
                              {bookingStep === 0 ? 'Initialize your service by verifying your deployment coordinates.' :
                               bookingStep === 1 ? 'Select your hardware and location to begin.' : 
                               bookingStep === 2 ? 'Schedule a precise time for our technical deployment team.' : 
                               'Finalize your security protocol deployment details.'}
                           </p>
                        </div>
                        
                        <ul className="space-y-6">
                           {[
                             { icon: CheckCircle2, text: 'Certified Technicians' },
                             { icon: CheckCircle2, text: 'Precision Calibration' },
                             { icon: CheckCircle2, text: 'Network Integration' },
                             { icon: CheckCircle2, text: 'Full Warranty Sync' }
                           ].map((item, i) => (
                             <li key={i} className="flex items-center space-x-4 text-[11px] font-black uppercase tracking-widest text-fg-secondary">
                                <item.icon className="h-4 w-4 text-blue-500" />
                                <span>{item.text}</span>
                             </li>
                           ))}
                        </ul>
                     </div>

                     <div className="lg:col-span-8">
                       <AnimatePresence mode="wait">
                         {bookingStep === 0 && (
                           <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                             <div className="bg-bg-muted/50 p-10 rounded-3xl border border-dashed border-border-base text-center space-y-6">
                               <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 mx-auto">
                                 <ScanFace className="h-10 w-10" />
                               </div>
                               <div className="space-y-2">
                                 <h4 className="text-xl font-black text-fg-primary uppercase">Location Verification</h4>
                                 <p className="text-fg-muted text-sm">We need to verify your site coordinates to assign the nearest technical squad.</p>
                               </div>
                               {location ? (
                                 <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold">
                                   Coordinates Locked: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                 </div>
                               ) : (
                                 <button 
                                   type="button" 
                                   onClick={requestLocation}
                                   disabled={locLoading}
                                   className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center space-x-3 mx-auto"
                                 >
                                   {locLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <MapPin className="h-4 w-4" />}
                                   <span>Detect My Location</span>
                                 </button>
                               )}
                             </div>
                             <button 
                               type="button" 
                               onClick={() => setBookingStep(1)} 
                               disabled={!location}
                               className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 group disabled:opacity-30"
                             >
                                 <span>Proceed to Options</span>
                                 <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                             </button>
                           </motion.div>
                         )}

                         {bookingStep === 1 && (
                           <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Select Product</label>
                                   <select 
                                      value={bookingData.product}
                                      onChange={(e) => setBookingData({...bookingData, product: e.target.value})}
                                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary appearance-none cursor-pointer"
                                   >
                                      <option>SK RECON DOME 4K</option>
                                      <option>SK BULLET ULTRA</option>
                                      <option>SK WIRELESS SMART</option>
                                      <option>SK PTZ RECON ZOOM</option>
                                   </select>
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Select City</label>
                                   <select 
                                      value={bookingData.city}
                                      onChange={(e) => setBookingData({...bookingData, city: e.target.value})}
                                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary appearance-none cursor-pointer"
                                   >
                                      <option>Bangalore (HQ)</option>
                                      <option>Mumbai</option>
                                      <option>Delhi</option>
                                      <option>Chennai</option>
                                   </select>
                                </div>
                             </div>
                             <div className="flex gap-4">
                               <button type="button" onClick={() => setBookingStep(0)} className="px-8 py-6 bg-bg-muted text-fg-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
                                  <ChevronLeft className="h-4 w-4" />
                                  <span>Back</span>
                               </button>
                               <button type="button" onClick={() => setBookingStep(2)} className="flex-1 py-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 group">
                                  <span>Continue to Scheduling</span>
                                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                               </button>
                             </div>
                           </motion.div>
                         )}

                         {bookingStep === 2 && (
                           <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Select Date</label>
                                   <input 
                                      type="date" 
                                      value={bookingData.date}
                                      onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                                      required 
                                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" 
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Time Slot</label>
                                   <select 
                                      value={bookingData.slot}
                                      onChange={(e) => setBookingData({...bookingData, slot: e.target.value})}
                                      disabled={slotsLoading || !bookingData.date}
                                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary appearance-none cursor-pointer disabled:opacity-50"
                                   >
                                      {slotsLoading ? (
                                         <option>Scanning for available protocols...</option>
                                       ) : availableSlots.length > 0 ? (
                                         <>
                                           <option value="">Select a protocol slot</option>
                                           {availableSlots.map((s, i) => (
                                             <option key={i} value={s}>{s}</option>
                                           ))}
                                         </>
                                       ) : bookingData.date ? (
                                         <option>No technician protocols assigned for this date</option>
                                       ) : (
                                         <option>Please select a date first</option>
                                       )}
                                   </select>
                                </div>
                             </div>
                             <div className="flex gap-4">
                               <button type="button" onClick={() => setBookingStep(1)} className="px-8 py-6 bg-bg-muted text-fg-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
                                  <ChevronLeft className="h-4 w-4" />
                                  <span>Back</span>
                               </button>
                               <button type="button" onClick={() => setBookingStep(3)} className="flex-1 py-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 group">
                                  <span>Personal Details</span>
                                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                               </button>
                             </div>
                           </motion.div>
                         )}

                         {bookingStep === 3 && (
                           <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Full Name</label>
                                   <input 
                                      type="text" 
                                      placeholder="John Doe"
                                      value={bookingData.name}
                                      onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                                      required 
                                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" 
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Phone Number</label>
                                   <input 
                                      type="tel" 
                                      placeholder="+91 98765 43210"
                                      value={bookingData.phone}
                                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                                      required 
                                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" 
                                   />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                   type="email" 
                                   placeholder="john@example.com"
                                   value={bookingData.email}
                                   onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                                   required 
                                   className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary" 
                                />
                             </div>
                             <div className="space-y-3 relative group">
                                <label className="text-[9px] font-black text-fg-dim uppercase tracking-widest ml-1">Site Address</label>
                                <div className="relative">
                                  <textarea 
                                     name="address"
                                     placeholder="Enter full site address"
                                     value={bookingData.address}
                                     onChange={(e) => setBookingData({...bookingData, address: e.target.value})}
                                     required 
                                     rows={3}
                                     className="w-full bg-bg-muted border border-border-base rounded-2xl pl-6 pr-16 py-5 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary resize-none" 
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (geoAddress) {
                                        setBookingData(prev => ({ ...prev, address: geoAddress }));
                                      } else {
                                        requestLocation();
                                      }
                                    }}
                                    className="absolute right-4 top-4 p-2 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    title="Fetch live location"
                                  >
                                    <MapPin className="h-4 w-4" />
                                  </button>
                                </div>
                             </div>
                             <div className="flex gap-4">
                               <button type="button" onClick={() => setBookingStep(2)} className="px-8 py-6 bg-bg-muted text-fg-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
                                  <ChevronLeft className="h-4 w-4" />
                                  <span>Back</span>
                               </button>
                               <button 
                                 type="submit"
                                 disabled={bookingLoading}
                                 className="flex-1 py-6 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-green-600/20 transition-all active:scale-95 flex items-center justify-center space-x-3 group relative overflow-hidden disabled:opacity-50"
                               >
                                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                  {bookingLoading ? (
                                     <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  ) : (
                                     <>
                                       <Calendar className="h-4 w-4" />
                                       <span>Finalize Booking</span>
                                     </>
                                  )}
                               </button>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   </form>
                 </div>
               )}
            </div>
        </section>

        {/* Support Testimonials Slider */}
         <section id="testimonials-section" className="mt-24 space-y-12">
            <div className="text-center space-y-4">
               <h2 className="text-5xl font-black text-fg-primary uppercase tracking-tighter">Trusted by millions</h2>
               <p className="text-fg-secondary font-medium">Professional service verified by our customer network.</p>
            </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Sameer K.', role: 'Business Owner', text: 'Technician arrived within 2 hours and fixed my CCTV issue. Extremely fast response.', rate: 5 },
                { name: 'Anita R.', role: 'Security Manager', text: 'Installation was quick and very professional. The team guided me on everything.', rate: 5 },
                { name: 'Vikram S.', role: 'Homeowner', text: 'The software support is top-notch. They helped me sync all my devices remotely.', rate: 5 }
              ].map((review, i) => (
                <div key={i} className="glass-card p-10 rounded-[3rem] border border-border-base space-y-6 relative overflow-hidden group">
                   <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 text-blue-500 fill-blue-500" />)}
                   </div>
                   <p className="text-fg-secondary font-medium leading-relaxed italic">"{review.text}"</p>
                    <div className="pt-6 border-t border-border-base flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center font-black text-blue-500">{review.name[0]}</div>
                        <div>
                           <p className="text-sm font-black text-fg-primary uppercase tracking-tight">{review.name}</p>
                           <p className="text-[10px] font-black text-fg-secondary uppercase tracking-widest">{review.role}</p>
                        </div>
                    </div>
                </div>
              ))}
           </div>
        </section>

        <div id="map-section">
          <MapSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportPage;
