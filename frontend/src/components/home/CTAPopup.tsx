"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Phone, Send, Loader2 } from 'lucide-react';

export default function CTAPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 2 Minutes delay (120000ms). For testing, we could lower it, but requirement says 2 minutes.
    const timer = setTimeout(() => {
      if (!hasOpened) {
        setIsOpen(true);
        setHasOpened(true);
      }
    }, 120000); 
    
    return () => clearTimeout(timer);
  }, [hasOpened]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      serviceRequired: formData.get('serviceRequired'),
      message: formData.get('message'),
      source: 'CTA_Popup'
    };

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, subject: 'CTA Lead: Site Visit Request' })
      });
      
      if (response.ok) {
        alert("Thank you! We'll contact you shortly for your free site visit.");
        setIsOpen(false);
      } else {
        alert("Failed to submit request.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-bg-surface border border-blue-500/20 rounded-[2rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 md:p-8 text-white relative shrink-0">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="h-8 w-8 text-white animate-pulse" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Don't Wait!</h3>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Secure Your Property Today.</h2>
              <p className="text-sm font-medium text-white/90">Book a FREE Site Visit & Get Expert CCTV Consultation.</p>
            </div>

            {/* Form */}
            <div className="p-6 md:p-8 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Name</label>
                    <input name="name" required className="w-full bg-bg-muted border border-border-base rounded-xl p-3 text-sm font-medium text-fg-primary outline-none focus:border-blue-500 transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Phone</label>
                    <input name="phone" required type="tel" className="w-full bg-bg-muted border border-border-base rounded-xl p-3 text-sm font-medium text-fg-primary outline-none focus:border-blue-500 transition-all" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Location</label>
                  <input name="location" required className="w-full bg-bg-muted border border-border-base rounded-xl p-3 text-sm font-medium text-fg-primary outline-none focus:border-blue-500 transition-all" placeholder="City, Area" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Service Required</label>
                  <select name="serviceRequired" required className="w-full bg-bg-muted border border-border-base rounded-xl p-3 text-sm font-medium text-fg-primary outline-none focus:border-blue-500 transition-all">
                    <option value="CCTV Installation">CCTV Installation</option>
                    <option value="Biometric System">Biometric System</option>
                    <option value="Networking setup">Networking Setup</option>
                    <option value="AMC Renewal">AMC / Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Message (Optional)</label>
                  <textarea name="message" rows={2} className="w-full bg-bg-muted border border-border-base rounded-xl p-3 text-sm font-medium text-fg-primary outline-none focus:border-blue-500 transition-all resize-none" placeholder="Any specific requirements..."></textarea>
                </div>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="submit" disabled={submitting} className="sm:col-span-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    {submitting ? 'Booking...' : 'Book Free Visit'}
                  </button>
                  <button type="button" onClick={() => window.open('tel:+919600975483')} className="py-4 bg-bg-muted border border-border-base text-fg-primary hover:border-blue-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" /> Call Now
                  </button>
                  <button type="button" onClick={() => window.open('https://wa.me/919600975483')} className="py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
