"use client";
import React, { useState, useEffect } from 'react';
import { ArrowUp, Phone, MapPin, Calculator, Gift, MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
       // Show site inspection slide-up if past 50%
       setShowSiteInspection(scrollPercentage > 50);
     };
     window.addEventListener('scroll', handleScroll);
     return () => window.removeEventListener('scroll', handleScroll);
   }, [isDashboard]);

   const scrollToTop = () => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   if (isDashboard) return null;

   return (
     <>
       {/* Slide-up Free Site Inspection CTA */}
       <AnimatePresence>
         {showSiteInspection && (
           <motion.div 
             initial={{ opacity: 0, y: 100, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 100, scale: 0.9 }}
             transition={{ type: 'spring', stiffness: 400, damping: 30 }}
             className="fixed bottom-24 right-6 z-[60] w-[300px] bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] hidden md:block"
           >
             <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                <Gift className="w-6 h-6 text-white" />
             </div>
             <h4 className="text-xl font-black text-white ml-8 tracking-tight leading-tight">FREE Site<br/>Inspection</h4>
             <p className="text-xs text-blue-200 mt-2 font-medium">Book Today • No Charges</p>
             <Link href="/installation" className="mt-4 block w-full py-3 bg-white text-blue-600 rounded-xl text-center font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg">
               Get Started
             </Link>
           </motion.div>
         )}
       </AnimatePresence>

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
             className="fixed bottom-24 left-6 z-[60] w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-blue-600 hover:border-blue-600 rounded-full flex items-center justify-center shadow-2xl transition-all"
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
