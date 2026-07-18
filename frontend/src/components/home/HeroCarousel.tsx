"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
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
  
  // 3D Mouse Tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });
  
  // Apply rotation transforms (max 5deg X, 8deg Y)
  const rotateX = useTransform(springY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || window.innerWidth < 768) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;
    mouseX.set(normX);
    mouseY.set(normY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  // Generate random particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.25 + 0.15
  }));

  return (
    <div className="relative min-h-screen lg:min-h-[900px] w-full overflow-hidden flex flex-col justify-between"
         style={{
           background: "linear-gradient(135deg, #F8FBFF 0%, #EEF5FF 40%, #E8F1FF 70%, #F5F9FF 100%)"
         }}
    >
      {/* Background Abstract Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute top-[30%] -right-[10%] w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-[120px]" 
      />

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center w-full z-10 py-24"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center w-full h-full"
          >
            <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">
              
              {/* Left Content Column */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-20 pt-16 lg:pt-0">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-[40px] md:text-[54px] lg:text-[68px] font-black leading-[1.05] tracking-tight text-slate-900 mb-6"
                >
                  {slides[current].title}
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-lg md:text-xl font-medium text-slate-600 max-w-xl mb-10"
                >
                  {slides[current].subtitle}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
                >
                  <Link 
                    href={slides[current].primaryLink}
                    className="group relative h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center transition-all overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {slides[current].primaryButtonText}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link 
                    href={slides[current].secondaryLink}
                    className="h-14 px-8 bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 rounded-2xl font-bold flex items-center justify-center transition-all shadow-sm"
                  >
                    {slides[current].secondaryButtonText}
                  </Link>
                </motion.div>
              </div>

              {/* Right Column: 3D Circular Showcase */}
              <div className="relative flex justify-center items-center h-[400px] md:h-[500px] lg:h-full z-10 perspective-1000">
                <motion.div
                  style={{ rotateX, rotateY }}
                  className="relative flex items-center justify-center w-[320px] h-[320px] md:w-[430px] md:h-[430px] lg:w-[560px] lg:h-[560px]"
                >
                  {/* Glow Effects */}
                  <div className="absolute inset-0 bg-[#2563EB] rounded-full blur-[120px] opacity-25 mix-blend-screen transition-opacity duration-500 hover:opacity-40"></div>
                  <div className="absolute inset-4 bg-[#8B5CF6] rounded-full blur-[100px] opacity-20 mix-blend-screen"></div>

                  {/* Outer Circle */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 to-blue-200/20 border border-blue-200/30"></div>
                  
                  {/* Middle Circle (Glassmorphism) */}
                  <div className="absolute inset-8 rounded-full bg-white/20 backdrop-blur-[30px] border border-white/50 shadow-[0_8px_32px_rgba(31,38,135,0.07)]"></div>

                  {/* Inner Circle (White Radial) */}
                  <div className="absolute inset-16 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white/90 to-blue-50/50 shadow-inner"></div>

                  {/* Orbital Ring */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 rounded-full border-[2px] border-transparent"
                    style={{ background: "linear-gradient(to right, #3b82f6, #06b6d4, #8b5cf6) border-box", WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }}
                  />

                  {/* Floating Particles */}
                  {particles.map(p => (
                    <motion.div
                      key={p.id}
                      animate={{ 
                        y: ["-20px", "20px", "-20px"], 
                        x: ["-10px", "10px", "-10px"],
                        opacity: [p.opacity, p.opacity + 0.3, p.opacity]
                      }}
                      transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute rounded-full bg-blue-400 blur-[1px]"
                      style={{
                        width: p.size,
                        height: p.size,
                        top: p.top,
                        left: p.left,
                      }}
                    />
                  ))}

                  {/* Product Shadow */}
                  <div className="absolute bottom-10 w-[60%] h-10 bg-black/20 rounded-full blur-xl translate-y-12"></div>

                  {/* Floating Product Image */}
                  <motion.div
                    animate={{ y: ["-15px", "15px", "-15px"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-[95%] h-[95%] flex items-center justify-center z-20 group"
                  >
                    <NextImage 
                      src={slides[current].image} 
                      alt={slides[current].title}
                      fill
                      className="object-contain drop-shadow-[0_40px_80px_rgba(37,99,235,0.25)] transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3"
                    />
                    
                    {/* Moving Light Sweep */}
                    <motion.div 
                      animate={{ left: ["-100%", "200%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] z-30 pointer-events-none"
                    />
                  </motion.div>

                  {/* Glass Badge */}
                  <motion.div 
                    animate={{ y: ["-5px", "5px", "-5px"] }}
                    transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-4 -right-4 md:top-4 md:-right-12 z-40 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-4 shadow-xl flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">10K+</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Installations</p>
                    </div>
                  </motion.div>

                </motion.div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controller Interface */}
      <div className="absolute bottom-32 md:bottom-24 left-0 w-full z-40 flex justify-center pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto bg-white/30 backdrop-blur-md border border-white/50 rounded-full p-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 transition-all duration-700 rounded-full ${
                current === i ? "w-10 bg-blue-600" : "w-3 bg-white/80 hover:bg-white shadow-sm"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Curved SVG Wave Divider */}
      <div className="absolute bottom-0 w-full translate-y-px z-30 pointer-events-none">
        <svg viewBox="0 0 1440 120" className="w-full h-auto text-background fill-current drop-shadow-[0_-10px_20px_rgba(0,0,0,0.03)]" preserveAspectRatio="none">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroCarousel;
