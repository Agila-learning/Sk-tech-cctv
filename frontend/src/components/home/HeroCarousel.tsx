"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Shield, Star, Mic } from "lucide-react";
import Link from "next/link";
import NextImage from 'next/image';

const slides = [
  {
    image: "/hd_cctv.png", // Replace with high quality CCTV Camera Installation
    title: "Complete Security",
    subtitle: "AI-Powered Surveillance"
  },
  {
    image: "/hd_smart_tv.png", // Replace with Smart TV
    title: "Smart Entertainment",
    subtitle: "Premium Displays"
  },
  {
    image: "/hd_laptop.png", // Replace with Laptop
    title: "Pro Workstations",
    subtitle: "High-Performance Computing"
  },
  {
    image: "/hd_printer.png", // Replace with Printer
    title: "Office Solutions",
    subtitle: "Enterprise Printing"
  }
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
    <section 
      className="relative w-full h-[100vh] min-h-[700px] overflow-hidden bg-background flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Full-Bleed Image Carousel */}
      <div className="absolute inset-0 w-full h-full z-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Using object-cover to naturally fill the viewport, simulating Apple/Tesla landing pages */}
            <NextImage 
              src={slides[current].image}
              alt={slides[current].title}
              fill
              priority
              className="object-cover object-center lg:object-right"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Soft Overlay Gradient for Text Readability */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Desktop Gradient (Left side solid, fading to transparent on right) */}
        <div className="hidden lg:block absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-background via-background/90 to-transparent"></div>
        
        {/* Mobile Gradient (Bottom solid, fading to top, plus overall darkening for text) */}
        <div className="lg:hidden absolute inset-0 bg-background/40"></div>
        <div className="lg:hidden absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>

      {/* Floating Navigation Arrows */}
      <div className="absolute right-4 lg:right-12 bottom-12 lg:bottom-1/2 lg:translate-y-1/2 flex lg:flex-col gap-4 z-30 pointer-events-auto">
        <button 
          onClick={(e) => { e.preventDefault(); prevSlide(); }} 
          className="w-12 h-12 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); nextSlide(); }} 
          className="w-12 h-12 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Widgets */}
      <div className="hidden md:flex flex-col absolute top-32 right-12 z-20 gap-6 pointer-events-none">
         <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 rounded-3xl p-3 shadow-2xl flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
              <Star className="w-5 h-5 text-white fill-current" />
            </div>
            <div className="pr-2">
              <p className="text-sm font-black text-white leading-tight">10K+</p>
              <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Installations</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl w-48 flex flex-col items-center justify-center"
          >
             <Shield className="w-12 h-12 text-blue-500 mb-2 animate-pulse" />
             <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest text-center mt-2">Active Security <br/> Scanning</p>
          </motion.div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 relative z-20 flex flex-col justify-center h-full pt-20">
        <div className="w-full lg:w-[42%] flex flex-col items-center lg:items-start text-center lg:text-left">
          
          <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6"
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Premium Technology</span>
          </motion.div>
          
          <motion.h1 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.1}} 
            className="text-5xl md:text-6xl lg:text-[72px] font-[900] leading-[1.05] tracking-tight text-fg-primary mb-6"
          >
            Complete Security & <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Technology Solutions</span>
          </motion.h1>
          
          <motion.p 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.2}} 
            className="text-lg text-fg-muted font-medium leading-relaxed max-w-xl mb-10"
          >
            Professional CCTV Installation, Smart TVs, Laptops, Printers, Networking, Smart Home Automation, and Complete IT Solutions under one trusted brand.
          </motion.p>
          
          <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay:0.3}} 
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/products" className="group relative flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto bg-fg-primary text-background rounded-full font-bold transition-all hover:scale-105 shadow-xl">
              Explore Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/contact" className="group flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto bg-white/10 dark:bg-black/20 backdrop-blur-md border border-border-strong text-fg-primary rounded-full font-bold transition-all hover:bg-bg-hover">
              Book Free Site Visit
            </Link>
          </motion.div>

        </div>
      </div>

    </section>
  );
};

export default HeroCarousel;
