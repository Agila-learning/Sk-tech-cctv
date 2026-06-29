"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Calendar, Clock, Shield, CheckCircle2, Zap, Wrench, User, Info } from 'lucide-react';
import SlotBooking from '@/components/product/SlotBooking';

const InstallationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-1 bg-blue-600"></div>
                <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">Expert Service</span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter uppercase">Professional <span className="text-slate-500 italic">Installation</span></h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">
                Our expert technicians manage everything from site surveying to final setup. Ensure your security system is installed correctly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: Shield, title: 'Certified Technicians', desc: 'All technicians are Professional security certified.' },
                { icon: Zap, title: 'Rapid Service', desc: 'Active response Technicians dispatched within 24 hours.' },
                { icon: Wrench, title: 'Calibration', desc: 'Full lens and sensor calibration included.' },
                { icon: User, title: 'Field Briefing', desc: 'On-site training for mobile monitoring protocols.' }
              ].map((feature, i) => (
                <div key={i} className="flex space-x-5 group">
                   <div className="p-4 bg-white/5 border border-border rounded-2xl h-fit group-hover:border-blue-600 transition-colors">
                      <feature.icon className="h-5 w-5 text-blue-500" />
                   </div>
                   <div>
                      <h4 className="text-white font-black text-sm uppercase mb-1">{feature.title}</h4>
                      <p className="text-slate-500 text-xs font-medium">{feature.desc}</p>
                   </div>
                </div>
              ))}
            </div>

            <div className="bg-card p-10 rounded-[3rem] border border-border relative overflow-hidden">
               <div className="flex items-start space-x-6 relative z-10">
                  <div className="p-4 bg-cyan-500/10 rounded-2xl">
                     <Info className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black mb-3 uppercase tracking-tight">Installation Protocol</h3>
                     <ul className="space-y-3">
                        {[
                          'Pre-Service site reconnaissance',
                          'Strategic placement & wiring',
                          'Network integration & encryption',
                          'Mobile app synchronization'
                        ].map((step, i) => (
                          <li key={i} className="flex items-center text-xs font-bold text-slate-400">
                             <CheckCircle2 className="h-3 w-3 mr-3 text-green-500" />
                             {step}
                          </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-blue-600/10 blur-[120px] -z-10 rounded-full"></div>
             <SlotBooking />
          </div>
        </div>
        
        <div className="mt-32">
           <div className="bg-blue-600 p-16 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="space-y-4 max-w-xl relative z-10">
                 <h2 className="text-4xl font-black uppercase tracking-tighter">Already Purchased a Kit?</h2>
                 <p className="text-blue-100/80 font-medium">Book your separate installation slot if you already have the hardware. We support hardware from all major strategic brands.</p>
              </div>
              <button className="px-12 py-5 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 relative z-10">
                 Connect to Field Technician
              </button>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InstallationPage;
