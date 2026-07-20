"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Shield, Lightbulb, Zap, Smartphone, User, Thermometer, Video, ShieldCheck, Home, Star, Mic } from "lucide-react";
import Link from "next/link";
import NextImage from 'next/image';

const slides = [
  "/hd_cctv.png",
  "/hd_laptop.png",
  "/hd_smart_tv.png",
  "/hd_printer.png"
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative min-h-[700px] w-full bg-gradient-to-br from-[#ffffff] via-[#f0f7ff] to-[#e0f0ff] overflow-hidden flex items-center justify-center pt-28 pb-20">
      {/* Background Decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-80 pointer-events-none z-0"></div>
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 30, repeat: Infinity }} className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none z-0"></motion.div>
      <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} transition={{ duration: 40, repeat: Infinity }} className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-purple-400/10 rounded-full blur-[140px] pointer-events-none z-0"></motion.div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Content (45%) */}
        <div className="lg:col-span-5 flex flex-col space-y-8 z-20 text-center lg:text-left items-center lg:items-start">
          
          {/* Glass Badge */}
          <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-blue-100 shadow-[0_4px_20px_-10px_rgba(37,99,235,0.2)] rounded-full px-4 py-2 w-fit"
          >
            <Home className="w-4 h-4 text-blue-600" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Smart Living, Simplified</span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.1}} 
            className="text-[48px] sm:text-[64px] lg:text-[76px] font-[900] leading-[1.05] tracking-tight text-[#0F172A]"
          >
            Smart Home <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Automation</span>
          </motion.h1>
          
          <motion.p 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.2}} 
            className="text-lg lg:text-xl text-slate-500 font-medium max-w-[520px] leading-relaxed"
          >
            Control your security, lighting, entertainment, surveillance, and appliances from anywhere using intelligent AI-powered home automation.
          </motion.p>
          
          {/* Buttons */}
          <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.3}} 
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/services" className="group relative flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-bold shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] transition-all hover:-translate-y-1">
              Explore Automation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/contact" className="group flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200 shadow-sm text-slate-800 rounded-2xl font-bold transition-all hover:-translate-y-1">
              <User className="w-5 h-5 text-blue-600" />
              Contact Us
            </Link>
          </motion.div>
          
          {/* Feature Cards */}
          <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.4}} 
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 w-full max-w-[520px]"
          >
            {[
              { icon: Shield, text: "Advanced Security", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: Lightbulb, text: "Smart Lighting", color: "text-yellow-500", bg: "bg-yellow-50" },
              { icon: Zap, text: "Energy Saving", color: "text-green-500", bg: "bg-green-50" },
              { icon: Smartphone, text: "Remote Control", color: "text-purple-500", bg: "bg-purple-50" }
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/50 backdrop-blur-xl border border-white/80 rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group">
                <div className={`w-10 h-10 ${feat.bg} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <feat.icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{feat.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Right Carousel (55%) */}
        <div 
          className="lg:col-span-7 h-[400px] sm:h-[500px] lg:h-[680px] w-full relative rounded-[40px] border-[6px] border-white/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden bg-slate-900 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Fallback pattern */}
              <div className="absolute inset-0 bg-slate-800 -z-10"></div>
              <img 
                src={slides[current]}
                alt="Smart Home"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Subtle Dark Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>

          {/* Slide Counter (Top Left) */}
          <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-xl border border-white/30 text-white font-black text-sm px-5 py-2.5 rounded-full shadow-lg flex items-center z-20">
            {String(current + 1).padStart(2, '0')} <span className="text-white/50 mx-1">/</span> {String(slides.length).padStart(2, '0')}
          </div>
          
          {/* Live Stats Card (Top Right) */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-6 right-6 bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-3 shadow-2xl flex items-center gap-4 z-20 hidden sm:flex"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
              <Star className="w-6 h-6 text-white fill-current" />
            </div>
            <div className="pr-2">
              <p className="text-lg font-black text-slate-800 leading-tight">10K+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Installations</p>
            </div>
          </motion.div>
          
          {/* AI Assistant Card (Bottom Right) */}
          <motion.div 
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 right-6 bg-slate-900/60 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl flex items-center gap-4 z-20 hidden sm:flex"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative">
              <Mic className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
              <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping"></div>
            </div>
            <div className="pr-2">
              <p className="text-sm font-black text-white leading-tight">AI Assistant</p>
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Voice Ready</p>
            </div>
          </motion.div>

          {/* Center Large Glass Panel (Smart Widgets) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
            className="absolute right-10 lg:right-16 top-1/2 -translate-y-1/2 w-[280px] lg:w-[320px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[36px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-10 hidden md:block"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Security Widget */}
              <div className="col-span-1 bg-white/10 rounded-[20px] p-4 flex flex-col items-center justify-center border border-white/10 hover:bg-white/20 transition-colors shadow-inner">
                <ShieldCheck className="w-7 h-7 text-green-400 mb-2" />
                <span className="text-[10px] text-white/90 uppercase tracking-widest font-bold">Security</span>
              </div>
              
              {/* Lighting Widget */}
              <div className="col-span-1 bg-white/10 rounded-[20px] p-4 flex flex-col items-center justify-center border border-white/10 hover:bg-white/20 transition-colors shadow-inner">
                <Lightbulb className="w-7 h-7 text-yellow-400 mb-2" />
                <span className="text-[10px] text-white/90 uppercase tracking-widest font-bold">Lighting</span>
              </div>
              
              {/* Climate Widget */}
              <div className="col-span-2 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-[20px] p-5 flex items-center justify-between border border-white/20 shadow-inner">
                <div className="flex items-center gap-4">
                   <Thermometer className="w-8 h-8 text-blue-300" />
                   <div className="flex flex-col">
                     <span className="text-3xl font-black text-white">21°C</span>
                     <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mt-1">Climate</span>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500/80 flex items-center justify-center shadow-lg"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                </div>
              </div>
              
              {/* Camera Feed Widget */}
              <div className="col-span-2 bg-black/50 rounded-[20px] h-28 border border-white/10 overflow-hidden relative flex items-center justify-center group shadow-inner">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558002038-1055907df827?w=400')] bg-cover bg-center opacity-60 group-hover:scale-110 transition-transform duration-700"></div>
                 <div className="absolute top-3 left-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                   <span className="text-[10px] text-white font-black uppercase tracking-widest">REC</span>
                 </div>
                 <div className="absolute top-3 right-4">
                   <Video className="w-4 h-4 text-white/80" />
                 </div>
              </div>

              {/* Energy Graph Widget */}
              <div className="col-span-2 bg-white/10 rounded-[20px] pt-4 px-4 border border-white/10 h-24 flex flex-col justify-between overflow-hidden shadow-inner">
                 <div className="flex justify-between items-center z-10">
                   <span className="text-[10px] text-white/90 uppercase tracking-widest font-bold">Energy</span>
                   <span className="text-[10px] text-green-400 font-bold">2.8 kWh</span>
                 </div>
                 <svg className="w-full h-12 -mx-4 -mb-1" viewBox="0 0 100 40" preserveAspectRatio="none">
                   <path d="M0 30 Q 15 5, 30 25 T 50 15 T 75 30 T 100 10" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
                   <path d="M0 30 Q 15 5, 30 25 T 50 15 T 75 30 T 100 10 L 100 40 L 0 40 Z" fill="url(#grad)" stroke="none" opacity="0.4" />
                   <defs>
                     <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#4ade80" />
                       <stop offset="100%" stopColor="transparent" />
                     </linearGradient>
                   </defs>
                 </svg>
              </div>
            </div>
          </motion.div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={prevSlide} 
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-2xl z-30"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-2xl z-30"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
          
          {/* Bottom Progress Pills */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/20 backdrop-blur-md px-4 py-3 rounded-full border border-white/10">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full overflow-hidden cursor-pointer transition-all duration-500 ${current === idx ? 'w-16 bg-white/20' : 'w-4 bg-white/40 hover:bg-white'}`} 
                onClick={() => setCurrent(idx)}
              >
                {current === idx && (
                  <motion.div 
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={!isHovered ? { duration: 5, ease: "linear" } : { duration: 0 }}
                  />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
