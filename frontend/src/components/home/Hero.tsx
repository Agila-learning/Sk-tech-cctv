"use strict";
import React from 'react';
import { Shield, Truck, Settings, Clock, Zap, Cpu, Scan, ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-background">
      {/* Augmented Reality Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: `radial-gradient(var(--accent-cyan) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
      </div>

      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[150px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]"></span>
              </span>
              <span className="text-cyan-400 text-xs font-black uppercase tracking-[0.2em]">Next-Gen Monitoring Online</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-fg-primary leading-[0.9] tracking-tighter">
              ADVANCED <br />
              <span className="animate-vibrant-text font-black italic">
                SECURITY SYSTEMS
              </span>
            </h1>
            
            <p className="text-xl text-fg-secondary max-w-xl leading-relaxed font-medium">
              SK Technology provides smart security for your home and business. We offer high-quality CCTV systems with professional installation and 24/7 technical support.
            </p>
            
            <div className="flex flex-wrap gap-5">
              <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center space-x-3 group">
                <span>View Products</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all backdrop-blur-xl">
                Book Service
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10">
              {[
                { icon: Shield, label: 'Military Grade', color: 'text-blue-500' },
                { icon: Cpu, label: 'AI Powered', color: 'text-cyan-400' },
                { icon: Scan, label: '4K Optics', color: 'text-indigo-400' },
                { icon: Zap, label: 'Zero Latency', color: 'text-yellow-400' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center space-y-3 group">
                  <div className="p-4 bg-bg-muted rounded-2xl border border-border-base group-hover:border-blue-500/20 transition-all">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <span className="text-[10px] text-fg-muted font-black uppercase tracking-widest text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative block">
            <div className="relative z-10">
              <div className="aspect-square rounded-[4rem] overflow-hidden glass-card p-10 rotate-3 hover:rotate-0 transition-transform duration-700">
                <div className="w-full h-full rounded-[3rem] bg-bg-muted flex items-center justify-center relative overflow-hidden">
                  {/* Digital HUD Overlay */}
                  <div className="absolute inset-0 border border-cyan-500/20 rounded-[3rem] pointer-events-none"></div>
                  <div className="absolute top-10 left-10 w-20 h-0.5 bg-cyan-500/50"></div>
                  <div className="absolute top-10 left-10 w-0.5 h-20 bg-cyan-500/50"></div>
                  <div className="absolute bottom-10 right-10 w-20 h-0.5 bg-cyan-500/50"></div>
                  <div className="absolute bottom-10 right-10 w-0.5 h-20 bg-cyan-500/50"></div>

                  <div className="text-center">
                     <div className="w-80 h-80 mx-auto bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-10 border border-border-base shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                        <Scan className="h-40 w-40 text-cyan-400 animate-pulse" />
                     </div>
                     <h3 className="text-3xl font-black text-fg-primary mb-2 uppercase tracking-tighter">Ultra-HD Smart Pro</h3>
                     <p className="text-cyan-400 font-black text-sm tracking-[0.3em]">PRO SERIES</p>
                  </div>

                  {/* Scanning Line Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-scan"></div>
                </div>
              </div>
            </div>
            
            {/* Floating Data UI */}
            <div className="absolute -top-5 lg:-top-10 -right-5 lg:-right-10 z-20 glass-card p-4 lg:p-6 rounded-3xl animate-float">
               <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                     <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Signal: Optimal</span>
                  </div>
                  <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full w-4/5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                  </div>
               </div>
            </div>

            <div className="absolute -bottom-5 lg:-bottom-10 -left-5 lg:-left-10 z-20 glass-card p-4 lg:p-6 rounded-3xl animate-float-delayed">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                     <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-fg-muted uppercase">Encryption</p>
                     <p className="text-xs text-fg-primary font-bold">AES-256 ACTIVE</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
