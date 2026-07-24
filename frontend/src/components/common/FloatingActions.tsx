"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Phone, MapPin, Calculator, Gift, MessageCircle, X, ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import gsap from 'gsap';

const PromoPopup = ({ showSiteInspection }: { showSiteInspection: boolean }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true to prevent flash
  const popupRef = useRef<HTMLDivElement>(null);
  const giftRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check local storage on mount
    const dismissedAt = localStorage.getItem('sk_tech_promo_dismissed');
    if (dismissedAt) {
      const timePassed = Date.now() - parseInt(dismissedAt, 10);
      const hours24 = 24 * 60 * 60 * 1000;
      if (timePassed < hours24) {
        setIsMinimized(true);
      }
    }
    setIsDismissed(false); // Finished checking
  }, []);

  const handleClose = () => {
    // GSAP Exit Animation
    if (popupRef.current) {
      gsap.to(popupRef.current, {
        opacity: 0,
        y: 50,
        scale: 0.9,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setIsMinimized(true);
          localStorage.setItem('sk_tech_promo_dismissed', Date.now().toString());
        }
      });
    }
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  useEffect(() => {
    // GSAP Entry Animation for popup
    if (showSiteInspection && !isMinimized && popupRef.current) {
      gsap.fromTo(popupRef.current, 
        { opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: "back.out(1.5)" }
      );
    }
  }, [showSiteInspection, isMinimized]);

  useEffect(() => {
    // GSAP Floating & Pulse for Gift Icon
    if (isMinimized && showSiteInspection && giftRef.current) {
      gsap.to(giftRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      
      const pulseInterval = setInterval(() => {
        if (giftRef.current) {
          gsap.fromTo(giftRef.current,
            { scale: 1, boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.7)" },
            { scale: 1.1, boxShadow: "0 0 0 15px rgba(59, 130, 246, 0)", duration: 1.5, ease: "power2.out" }
          );
        }
      }, 10000);
      return () => clearInterval(pulseInterval);
    }
  }, [isMinimized, showSiteInspection]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMinimized && showSiteInspection) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMinimized, showSiteInspection]);

  if (isDismissed || !showSiteInspection) return null;

  return (
    <>
      {/* Minimized Gift Icon */}
      {isMinimized && (
        <button
          ref={giftRef}
          onClick={handleRestore}
          className="fixed bottom-28 md:bottom-28 right-6 md:right-28 z-40 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform group focus:outline-none focus:ring-4 focus:ring-blue-500/50"
          aria-label="Free Site Inspection"
          title="Free Site Inspection"
        >
          <Gift className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          {/* Gentle glow effect */}
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-40 blur-md transition-opacity" />
        </button>
      )}

      {/* Full Popup Widget */}
      {!isMinimized && (
        <div 
          ref={popupRef}
          className="fixed bottom-[110px] md:bottom-28 right-4 md:right-28 z-40 w-[calc(100vw-2rem)] md:w-[320px] bg-white/10 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] will-change-transform"
        >
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-fg-primary rounded-full transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close Promotional Popup"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          </button>

          <div className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6">
            <Gift className="w-7 h-7 text-white" />
          </div>
          
          <h4 className="text-xl font-black text-fg-primary ml-10 tracking-tight leading-tight mt-1">FREE Site<br/>Inspection</h4>
          <p className="text-sm text-fg-muted mt-3 font-medium">Book Today • No Charges</p>
          
          <Link href="/installation" className="mt-5 relative group overflow-hidden block w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-center shadow-lg hover:shadow-blue-500/25 transition-all">
            <span className="relative z-10 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Hover shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </Link>
        </div>
      )}
    </>
  );
};

const FloatingActions = () => {
   const pathname = usePathname();
   const [showScroll, setShowScroll] = useState(false);
   const [showSiteInspection, setShowSiteInspection] = useState(false);
   
   const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/technician');

   useEffect(() => {
     if (isDashboard) return;

     const handleScroll = () => {
       const scrollPosition = window.scrollY;
       const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
       const scrollPercentage = (scrollPosition / documentHeight) * 100;
       
       setShowScroll(scrollPosition > 300);
       
       // Show popup between 35% and 95% scroll to avoid footer
       if (scrollPercentage > 35 && scrollPercentage < 95) {
         setShowSiteInspection(true);
       } else {
         setShowSiteInspection(false);
       }
     };
     window.addEventListener('scroll', handleScroll, { passive: true });
     return () => window.removeEventListener('scroll', handleScroll);
   }, [isDashboard]);

   const scrollToTop = () => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   if (isDashboard) return null;

   return (
     <>
       {/* Slide-up Free Site Inspection CTA */}
       <PromoPopup showSiteInspection={showSiteInspection} />

       {/* Floating Emergency Bar (Bottom) */}
       <div className="fixed bottom-0 left-0 right-0 z-50 p-2 md:p-4 bg-transparent pointer-events-none flex justify-center">
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 1, duration: 0.8, type: 'spring' }}
           className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 flex items-center shadow-2xl pointer-events-auto w-[95%] md:w-auto max-w-[500px] overflow-x-auto overflow-y-hidden hide-scrollbar"
         >
            <div className="flex items-center gap-1 md:gap-2 mx-auto whitespace-nowrap">
              <a href="tel:+919600975483" className="flex flex-col items-center justify-center px-4 py-2 hover:bg-white/10 rounded-full transition-colors group">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 group-hover:bg-blue-500 flex items-center justify-center transition-colors mb-1">
                  <Phone className="w-4 h-4 text-blue-400 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase text-white/70 tracking-widest group-hover:text-white">Call</span>
              </a>
              
              <div className="w-px h-8 bg-white/10 hidden md:block"></div>
              
              <a href="https://wa.me/919600975483" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center px-4 py-2 hover:bg-white/10 rounded-full transition-colors group">
                <div className="w-8 h-8 rounded-full bg-green-500/20 group-hover:bg-green-500 flex items-center justify-center transition-colors mb-1">
                  <MessageCircle className="w-4 h-4 text-green-400 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase text-white/70 tracking-widest group-hover:text-white">WhatsApp</span>
              </a>

              <div className="w-px h-8 bg-white/10 hidden md:block"></div>

              <Link href="/installation" className="flex flex-col items-center justify-center px-4 py-2 hover:bg-white/10 rounded-full transition-colors group">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500 flex items-center justify-center transition-colors mb-1">
                  <MapPin className="w-4 h-4 text-cyan-400 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase text-white/70 tracking-widest group-hover:text-white">Book Visit</span>
              </Link>

              <div className="w-px h-8 bg-white/10 hidden md:block"></div>

              <Link href="/support" className="flex flex-col items-center justify-center px-4 py-2 hover:bg-white/10 rounded-full transition-colors group">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500 flex items-center justify-center transition-colors mb-1">
                  <Calculator className="w-4 h-4 text-yellow-400 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase text-white/70 tracking-widest group-hover:text-white">Get Quote</span>
              </Link>
            </div>
         </motion.div>
       </div>

       {/* Scroll To Top Button */}
       <AnimatePresence>
         {showScroll && (
           <motion.button 
             initial={{ opacity: 0, scale: 0 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0 }}
             onClick={scrollToTop}
             className="fixed bottom-20 md:bottom-24 left-4 md:left-6 z-[60] w-12 h-12 bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 rounded-full flex items-center justify-center shadow-2xl transition-all"
             aria-label="Scroll to Top"
           >
              <ArrowUp className="h-5 w-5" />
           </motion.button>
         )}
       </AnimatePresence>
     </>
   );
};

export default FloatingActions;
