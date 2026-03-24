"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { Mail, Phone, MapPin, MessageSquare, Send, Globe, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactPage = () => {
  return (
    <main className="min-h-screen bg-bg-primary pt-32 pb-20 overflow-hidden">
      <Navbar />
      
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 text-fg-primary">
              Get in <span className="text-blue-500">Touch</span>
            </h1>
            <p className="text-fg-muted text-lg max-w-2xl mx-auto font-medium">
              Elite technical support and consultation for your security infrastructure. Our specialists are standing by 24/7.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-10 rounded-[3rem] border border-border-base space-y-12"
            >
              <div className="flex gap-6">
                <div className="p-4 bg-blue-600/10 rounded-2xl">
                  <Mail className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-fg-muted mb-1">Direct Signal</h3>
                  <p className="text-xl font-bold text-fg-primary">support@sktech.com</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="p-4 bg-blue-600/10 rounded-2xl">
                  <Phone className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-fg-muted mb-1">Hotline</h3>
                  <p className="text-xl font-bold text-fg-primary">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="p-4 bg-blue-600/10 rounded-2xl">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-fg-muted mb-1">Nerve Center</h3>
                  <p className="text-xl font-bold text-fg-primary">
                    Sector 42, Cyber Hub<br />
                    Gurugram, HR 122002
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-border-base">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-bg-surface bg-bg-muted" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-fg-muted">
                    <span className="text-green-500 font-bold">● Active</span> 12 Specialists Online
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-6 bg-bg-muted rounded-[2rem] border border-border-base text-center">
                <Clock className="h-6 w-6 text-blue-500 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Availability</p>
                <p className="text-sm font-bold text-fg-primary">24/7/365</p>
              </div>
              <div className="p-6 bg-bg-muted rounded-[2rem] border border-border-base text-center">
                <Shield className="h-6 w-6 text-blue-500 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Security</p>
                <p className="text-sm font-bold text-fg-primary">Encrypted</p>
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-12 rounded-[3.5rem] border border-border-base"
            >
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Full Identity</label>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Communication Line</label>
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Objective</label>
                  <select className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer">
                    <option>Technical Consultation</option>
                    <option>Support Request</option>
                    <option>Project Inquiry</option>
                    <option>Partnership</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Intelligence Report</label>
                  <textarea 
                    placeholder="How can we assist your Service?"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all h-40 resize-none"
                  />
                </div>

                <button className="group w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all transform active:scale-95 shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4">
                  Transmit Message
                  <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
