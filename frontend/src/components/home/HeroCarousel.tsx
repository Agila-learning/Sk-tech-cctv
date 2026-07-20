"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Shield, Lightbulb, Zap, Smartphone, User, Home, Star, Mic } from "lucide-react";
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
    <div className="relative min-h-[700px] w-full bg-background overflow-hidden flex items-center pt-28 pb-20">
      {/* Background Decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/50 dark:bg-black/50 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Soft radial blue glow behind carousel specifically */}
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[150px] pointer-events-none z-0"></motion.div>

      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 pl-4 sm:pl-6 lg:pl-8">
        
        {/* Left Content (45%) */}
        <div className="lg:col-span-5 flex flex-col space-y-8 z-20 text-center lg:text-left items-center lg:items-start pr-4 sm:pr-6 lg:pr-0">
          
          {/* Glass Badge */}
          <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            className="inline-flex items-center gap-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-blue-100/20 shadow-[0_4px_20px_-10px_rgba(37,99,235,0.2)] rounded-full px-4 py-2 w-fit"
          >
            <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide">Smart Living, Simplified</span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.1}} 
            className="text-[48px] sm:text-[64px] lg:text-[76px] font-[900] leading-[1.05] tracking-tight text-fg-primary"
          >
            Smart Home <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Automation</span>
          </motion.h1>
          
          <motion.p 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.2}} 
            className="text-lg lg:text-xl text-fg-muted font-medium max-w-[520px] leading-relaxed"
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
            <Link href="/services" className="group relative flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-bold shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] transition-all hover:-translate-y-1">
              Explore Automation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/contact" className="group flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto bg-white/70 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm text-fg-primary rounded-2xl font-bold transition-all hover:-translate-y-1">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              { icon: Shield, text: "Advanced Security", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { icon: Lightbulb, text: "Smart Lighting", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
              { icon: Zap, text: "Energy Saving", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
              { icon: Smartphone, text: "Remote Control", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" }
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group">
                <div className={`w-10 h-10 ${feat.bg} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <feat.icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <span className="text-[11px] font-bold text-fg-primary text-center leading-tight">{feat.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Right Carousel (Full Bleed to Right) */}
        <div 
          className="lg:col-span-7 h-[400px] sm:h-[500px] lg:h-[700px] w-full relative group overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Extended full bleed mask */}
          <div className="absolute inset-0 right-[-100px] sm:right-[-200px] lg:right-[-500px]">
            <AnimatePresence mode="sync">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 1.1, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 1.05, x: -20 }}
                transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }} // Cinematic easing
                className="absolute inset-0 w-full h-full"
              >
                {/* Parallax Image */}
                <motion.img 
                  animate={{ x: ["0%", "-2%"] }}
                  transition={{ duration: 5, ease: "linear" }}
                  src={slides[current]}
                  alt="Smart Home"
                  className="w-full h-full object-contain origin-center"
                />
              </motion.div>
            </AnimatePresence>

            {/* Seamless gradient mask blending into the background on the left side */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          </div>

          {/* Floating UI Elements over the image */}
          <div className="absolute inset-0 z-20 pointer-events-none pr-4 sm:pr-6 lg:pr-8">
            
            {/* Slide Counter (Top Left overlay) */}
            <div className="absolute top-8 left-12 bg-black/30 backdrop-blur-md border border-white/20 text-white font-black text-sm px-5 py-2.5 rounded-full shadow-lg flex items-center pointer-events-auto">
              {String(current + 1).padStart(2, '0')} <span className="text-white/50 mx-1">/</span> {String(slides.length).padStart(2, '0')}
            </div>
            
            {/* Live Stats Card (Top Right) */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-8 right-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3 shadow-2xl flex items-center gap-4 hidden sm:flex pointer-events-auto"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
                <Star className="w-6 h-6 text-white fill-current" />
              </div>
              <div className="pr-2">
                <p className="text-lg font-black text-white leading-tight">10K+</p>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Installations</p>
              </div>
            </motion.div>
            
            {/* AI Assistant Card (Bottom Right) */}
            <motion.div 
              animate={{ y: [5, -5, 5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-24 right-6 bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl flex items-center gap-4 hidden sm:flex pointer-events-auto"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative">
                <Mic className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping"></div>
              </div>
              <div className="pr-2">
                <p className="text-sm font-black text-white leading-tight">AI Assistant</p>
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Voice Ready</p>
              </div>
            </motion.div>

            {/* Navigation Arrows */}
            <button 
              onClick={(e) => { e.preventDefault(); prevSlide(); }} 
              className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all opacity-0 group-hover:opacity-100 shadow-2xl pointer-events-auto"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); nextSlide(); }} 
              className="absolute right-8 lg:right-12 xl:right-16 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all opacity-0 group-hover:opacity-100 shadow-2xl pointer-events-auto"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
            
            {/* Bottom Progress Pills */}
            <div className="absolute bottom-8 left-1/2 lg:left-[40%] -translate-x-1/2 flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-3 rounded-full border border-white/10 pointer-events-auto shadow-xl">
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
    </div>
  );
};

export default HeroCarousel;
