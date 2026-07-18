"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import NextImage from 'next/image';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  primaryLink: string;
  primaryButtonText: string;
  secondaryLink: string;
  secondaryButtonText: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Smart CCTV Solutions",
    subtitle: "Secure your home and business with AI-powered surveillance.",
    image: "/assets/products/ptz_recon.png",
    primaryLink: "/services",
    primaryButtonText: "Book a Service",
    secondaryLink: "/products",
    secondaryButtonText: "Explore Products",
  },
  {
    id: 2,
    title: "Professional Installation",
    subtitle: "Expert technicians for fast, reliable and hassle-free installation.",
    image: "/assets/products/bullet_ultra.png",
    primaryLink: "/installation",
    primaryButtonText: "Schedule Installation",
    secondaryLink: "/about",
    secondaryButtonText: "Learn More",
  },
  {
    id: 3,
    title: "24×7 Support & AMC",
    subtitle: "Reliable maintenance and instant service whenever you need it.",
    image: "/assets/products/dome_4k.png",
    primaryLink: "/support",
    primaryButtonText: "Request Support",
    secondaryLink: "/amc",
    secondaryButtonText: "View AMC Plans",
  },
  {
    id: 4,
    title: "Smart Home Automation",
    subtitle: "Control security, lighting and devices from anywhere.",
    image: "/assets/products/slide4.png",
    primaryLink: "/automation",
    primaryButtonText: "Explore Automation",
    secondaryLink: "/contact",
    secondaryButtonText: "Contact Us",
  },
  {
    id: 5,
    title: "Your Trusted Security Partner",
    subtitle: "Complete CCTV, networking and security solutions for every space.",
    image: "/assets/products/slide5.png",
    primaryLink: "/about",
    primaryButtonText: "Get Started",
    secondaryLink: "/contact",
    secondaryButtonText: "Contact Team",
  },
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
    <div 
      className="relative h-screen min-h-[900px] w-full overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E0F2FE] to-[#F5F3FF]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-10"
        >
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center w-full relative z-10">
              
              {/* Content Column */}
              <div className="lg:col-span-12 xl:col-span-7 flex flex-col items-center xl:items-start text-center xl:text-left">
                
                {/* Glass Card Container */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-white/20 backdrop-blur-[18px] border border-white/30 rounded-[24px] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] w-full flex flex-col space-y-8"
                >
                  <h1 className="text-[34px] md:text-[46px] lg:text-[60px] font-[800] leading-[1.1] tracking-tight text-[#0F172A]">
                    {slides[current].title}
                  </h1>

                  <p className="text-[20px] font-[400] text-[#475569] max-w-2xl leading-relaxed">
                    {slides[current].subtitle}
                  </p>

                  <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4 pt-4">
                    <Link 
                      href={slides[current].primaryLink}
                      className="h-[54px] px-8 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[14px] font-[600] flex items-center justify-center transition-all shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)]"
                    >
                      {slides[current].primaryButtonText}
                    </Link>
                    <Link 
                      href={slides[current].secondaryLink}
                      className="h-[54px] px-8 bg-transparent border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/5 rounded-[14px] font-[600] flex items-center justify-center transition-all"
                    >
                      {slides[current].secondaryButtonText}
                    </Link>
                  </div>
                </motion.div>
                
              </div>

              {/* Right Column: High-Res Asset */}
              <div className="lg:col-span-5 hidden xl:flex justify-center group">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-[500px] aspect-square flex items-center justify-center rounded-[3rem] overflow-hidden"
                  >
                    <NextImage 
                      src={slides[current].image} 
                      alt={slides[current].title}
                      fill
                      className="object-contain p-12 transition-transform duration-[5000ms] ease-out hover:scale-110"
                    />
                  </motion.div>
              </div>

            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controller Interface */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 lg:left-auto lg:right-16 lg:translate-x-0 w-full max-w-7xl px-8 z-30 flex justify-between items-center pointer-events-none">
        
        <div className="flex items-center space-x-3 pointer-events-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 transition-all duration-700 rounded-full ${
                current === i ? "w-12 bg-[#2563EB]" : "w-3 bg-[#475569]/30 hover:bg-[#475569]/50"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            onClick={prevSlide}
            className="w-12 h-12 flex items-center justify-center bg-white/50 backdrop-blur-md hover:bg-white text-[#0F172A] rounded-full border border-white/60 transition-all shadow-sm"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="w-12 h-12 flex items-center justify-center bg-white/50 backdrop-blur-md hover:bg-white text-[#0F172A] rounded-full border border-white/60 transition-all shadow-sm"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default HeroCarousel;
