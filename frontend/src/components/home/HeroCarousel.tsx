"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import NextImage from 'next/image';
import gsap from "gsap";

interface Slide {
  id: number;
  tagline: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  buttonText: string;
}

const slides: Slide[] = [
  {
    id: 1,
    tagline: "EST 2024 | PREMIUM SECURITY SOLUTIONS",
    title: "Securing What Matters Most",
    subtitle: "Professional surveillance systems with 4K clarity and AI-powered smart monitoring.",
    image: "/assets/products/ptz_recon.png",
    link: "/products",
    buttonText: "View Products",
  },
  {
    id: 2,
    tagline: "SMART SECURITY | READY TO SETUP",
    title: "Corporate Security Solutions",
    subtitle: "Install high-definition cameras and complete system kits at competitive prices.",
    image: "/assets/products/bullet_ultra.png",
    link: "/offers",
    buttonText: "View Offers",
  },
  {
    id: 3,
    tagline: "PROFESSIONAL | EXPERT INSTALLATION",
    title: "Certified Security Setup",
    subtitle: "Our certified technicians provide seamless installation and calibration for your property.",
    image: "/assets/products/dome_4k.png",
    link: "/installation",
    buttonText: "Book Installation",
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (headingRef.current) {
        gsap.fromTo(headingRef.current, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" }
        );
    }
    
    // Background parallax logic
    const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 40;
        const yPos = (clientY / window.innerHeight - 0.5) * 40;
        
        gsap.to(".parallax-bg", {
            x: xPos,
            y: yPos,
            duration: 1,
            ease: "power2.out"
        });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [current]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div ref={containerRef} className="relative h-screen min-h-[900px] w-full overflow-hidden bg-background">
      {/* Background Layer with Grid Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('/grid.svg')] parallax-bg"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-blue-600/5 via-transparent to-transparent z-0"></div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-10"
        >
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            {/* Massive Background Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none select-none z-0 hidden sm:block">
               <h2 className="text-[8vw] font-black leading-none uppercase tracking-tighter">SK_TECH</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center w-full relative z-10">
              {/* Content Column */}
              <div className="lg:col-span-12 xl:col-span-7 flex flex-col items-center xl:items-start text-center xl:text-left space-y-12">
                


                <div className="space-y-8">
                  <h1 
                    ref={headingRef}
                    className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.85] tracking-tighter uppercase text-fg-primary font-poppins"
                  >
                    {slides[current].title.split(" ").map((word, i) => (
                      <span key={i} className={i % 2 === 1 ? "text-blue-600 block" : "block"}>
                        {word}
                      </span>
                    ))}
                  </h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg md:text-xl text-fg-muted max-w-2xl leading-relaxed font-manrope font-medium lg:mx-0 mx-auto"
                  >
                    {slides[current].subtitle}
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap items-center justify-center xl:justify-start gap-6"
                >
                  <Link 
                    href={slides[current].link}
                    className="px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all transform hover:scale-105 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] flex items-center space-x-4 group"
                  >
                    <span>{slides[current].buttonText}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/support"
                    className="px-10 py-6 bg-bg-muted border border-border-base text-fg-primary rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-bg-surface transition-all flex items-center space-x-3"
                  >
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span>Contact Support</span>
                  </Link>
                </motion.div>
                

              </div>

              {/* Right Column: High-Res Asset */}
              <div className="lg:col-span-5 hidden xl:flex justify-center group perspective-1000">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-[500px] aspect-square flex items-center justify-center rounded-full bg-gradient-to-br from-bg-muted to-transparent border border-border-base overflow-hidden"
                  >
                    <NextImage 
                      src={slides[current].image} 
                      alt={slides[current].title}
                      fill
                      className="object-contain p-12 group-hover:scale-105 transition-transform duration-700 rounded-full"
                    />
                    
                    {/* Interior Glow */}
                    <div className="absolute inset-0 bg-blue-600/5 opacity-30 pointer-events-none"></div>
                  </motion.div>

                {/* Grid Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-blue-600/10 rounded-full blur-3xl -z-10 opacity-50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border-2 border-border-base rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controller Interface */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 lg:left-auto lg:right-16 lg:translate-x-0 w-full max-w-7xl px-8 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex items-center space-x-4 pointer-events-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 transition-all duration-700 rounded-full ${
                current === i ? "w-20 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "w-6 bg-border-strong opacity-30"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center space-x-4 pointer-events-auto">
          <button
            onClick={prevSlide}
            className="p-6 bg-bg-muted hover:bg-bg-surface text-fg-primary rounded-[1.5rem] border border-border-base transition-all group active:scale-95"
          >
            <ChevronLeft className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] border border-blue-500 shadow-2xl shadow-blue-600/20 transition-all group active:scale-95"
          >
            <ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
