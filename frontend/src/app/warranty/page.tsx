"use client";
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Calendar, FileCheck, CheckCircle2, Search, Smartphone, ClipboardCheck } from 'lucide-react';

const WarrantyPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <section className="text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-500"
          >
            Product Lifetime Support
          </motion.div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">Warranty <span className="text-fg-secondary italic opacity-70">Registration</span></h1>
          <p className="text-fg-secondary text-lg font-medium max-w-2xl mx-auto">
            Protect your investment. Register your SK TECHNOLOGY hardware to activate full warranty coverage and priority service.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter leading-none">Why <span className="text-blue-500 italic">Register?</span></h2>
              <p className="text-fg-secondary font-medium">Registration unlocks our elite support ecosystem for your specific deployment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: 'Full Coverage', desc: '1-5 years hardware warranty', icon: ShieldCheck },
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
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
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
              {['24M Replacement', 'Zero-Cost Labor', 'Free Diagnosis', 'On-Site Fix'].map(tag => (
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
