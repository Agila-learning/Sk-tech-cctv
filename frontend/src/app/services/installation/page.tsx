"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  Hammer, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Phone,
  User,
  Zap
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/components/providers/LocationProvider';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';

const InstallationPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { address: geoAddress } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [details, setDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    serviceType: 'Installation',
    notes: ''
  });

  // Scheduling State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    if (geoAddress && !details.address) {
      setDetails(prev => ({ ...prev, address: geoAddress }));
    }
  }, [geoAddress, details.address]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchSlots = async () => {
    try {
      setFetchingSlots(true);
      const data = await fetchWithAuth(`/slots/available?date=${selectedDate}`);
      setAvailableSlots(data);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.name || !details.phone || !details.address || !selectedDate || !selectedSlot) {
      setError("Please complete all required fields and select a slot.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const bookingData = {
        customer: user?._id,
        serviceType: details.serviceType,
        address: details.address,
        scheduledDate: selectedDate,
        slot: selectedSlot._id,
        notes: details.notes,
        status: 'pending'
      };

      await fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to schedule installation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Navbar />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-16 rounded-[4rem] border border-green-500/20 text-center space-y-8 max-w-2xl"
        >
          <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-fg-primary tracking-tighter uppercase">Request <span className="text-green-500 italic">Received</span></h2>
            <p className="text-fg-muted font-medium">Our sales team will contact you shortly to confirm your installation slot at <span className="text-fg-primary font-bold">{details.address}</span>.</p>
          </div>
          <div className="pt-8 text-[10px] font-black text-fg-dim uppercase tracking-[0.4em]">Redirecting to command center...</div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 pt-48 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Header & Form Side */}
          <div className="lg:col-span-7">
            <div className="mb-16 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(37,99,235,1)]"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Service Division: active</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-fg-primary tracking-tighter uppercase leading-[0.8] italic">Only <span className="text-blue-500 non-italic">Setup</span></h1>
              <p className="text-fg-muted text-xl font-medium uppercase tracking-widest max-w-xl">Professional CCTV deployment for your existing assets. Expert calibration included.</p>
            </div>

            <form onSubmit={handleBooking} className="glass-card p-12 rounded-[3.5rem] border border-border-base space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5">
                  <Hammer className="h-40 w-40" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={details.name}
                        onChange={e => setDetails({...details, name: e.target.value})}
                        placeholder="Authorized Personnel" 
                        className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="tel" 
                        required
                        value={details.phone}
                        onChange={e => setDetails({...details, phone: e.target.value})}
                        placeholder="+91 00000 00000" 
                        className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Deployment Coordinates (Address)</label>
                  <div className="relative group">
                    <MapPin className="absolute left-6 top-6 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                    <textarea 
                      required
                      value={details.address}
                      onChange={e => setDetails({...details, address: e.target.value})}
                      placeholder="Street, Building, Flat No..." 
                      className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary h-32"
                    />
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Select Deployment Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
                      <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary appearance-none"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedDate && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                         <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Available Time Slots</label>
                         {fetchingSlots ? (
                           <div className="flex justify-center py-10">
                             <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                           </div>
                         ) : availableSlots.length === 0 ? (
                           <div className="p-10 text-center bg-red-500/5 rounded-2xl border border-dashed border-red-500/20">
                             <p className="text-red-500 font-bold text-xs uppercase tracking-widest">No slots available for this period.</p>
                           </div>
                         ) : (
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                             {availableSlots.map((slot) => (
                               <button
                                 key={slot._id}
                                 type="button"
                                 onClick={() => setSelectedSlot(slot)}
                                 className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                                   selectedSlot?._id === slot._id 
                                     ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                     : 'bg-bg-muted border-border-base text-fg-primary hover:border-blue-600/30'
                                 }`}
                               >
                                 <Clock className="h-4 w-4" />
                                 <span className="text-xs font-black tracking-tight">{slot.startTime} - {slot.endTime}</span>
                               </button>
                             ))}
                           </div>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {error && (
                 <div className="p-4 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl text-center border border-red-500/20">
                   {error}
                 </div>
               )}

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[1.4rem] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
               >
                 {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                   <>
                     <span>Initialize Booking</span>
                     <Zap className="h-4 w-4 fill-white" />
                   </>
                 )}
               </button>
            </form>
          </div>

          {/* Info Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-card p-12 rounded-[4rem] border border-border-base space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">Service <span className="text-blue-500 italic">Protocols</span></h3>
               
               <div className="space-y-8">
                  {[
                    { title: "Site Survey", desc: "Optimal angle and coverage analysis for maximum security.", icon: Shield },
                    { title: "24/7 Deployment", icon: Clock, desc: "Our rapid response team handles setup within 24 hours of booking." },
                    { title: "Cloud Integration", icon: Zap, desc: "Mobile-first access configuration for remote monitoring." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="w-14 h-14 bg-bg-muted rounded-2xl flex items-center justify-center border border-border-base group-hover:border-blue-500/30 transition-all shrink-0">
                         <item.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-fg-primary uppercase tracking-tight mb-2">{item.title}</p>
                        <p className="text-xs text-fg-muted font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="pt-8 border-t border-border-base mt-auto">
                  <div className="p-6 bg-blue-600 text-white rounded-3xl space-y-4 shadow-xl shadow-blue-600/20">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Support Hotline</p>
                     <p className="text-3xl font-black tracking-tighter italic">+91 SKTECH-SAFE</p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-bg-muted/50 rounded-[2.5rem] border border-border-base flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-primary">Verified Experts Only</span>
               </div>
               <ArrowRight className="h-4 w-4 text-fg-muted" />
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
};

export default InstallationPage;
