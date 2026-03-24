"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Target, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';

const LocationPrompt = () => {
   const [isOpen, setIsOpen] = useState(false);
   const { requestLocation, loading, location } = useLocation();

   useEffect(() => {
      const dismissed = localStorage.getItem('locationPromptDismissed');
      if (!dismissed) {
         const timer = setTimeout(() => setIsOpen(true), 6000);
         return () => clearTimeout(timer);
      }
   }, []);

   const handleDismiss = () => {
      setIsOpen(false);
      localStorage.setItem('locationPromptDismissed', 'true');
   };

   const handleFetchLocation = async () => {
      try {
         await requestLocation();
         localStorage.setItem('sk_location_granted', 'true');
         setTimeout(handleDismiss, 1500);
      } catch (e) {
         console.error(e);
      }
   };

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/50 backdrop-blur-md"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="glass-card max-w-lg w-full p-8 rounded-[3rem] border border-blue-600/20 shadow-2xl relative"
               >
                  <button 
                     onClick={handleDismiss}
                     className="absolute top-6 right-6 p-2 text-fg-muted hover:text-fg-primary bg-white/5 rounded-full transition-colors"
                  >
                     <X className="h-5 w-5" />
                  </button>
                  
                  <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                     <MapPin className="h-8 w-8 text-blue-500" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-fg-primary tracking-tighter uppercase mb-2">Initialize Deployment Sector</h3>
                  <p className="text-fg-secondary font-medium text-sm mb-8 leading-relaxed">
                     Allow location access to sync live coverage areas, verify technician availability, and load sector-specific equipment protocols.
                  </p>
                  
                  <div className="flex flex-col space-y-3">
                     <button 
                        onClick={handleFetchLocation}
                        disabled={status !== 'idle'}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex justify-center items-center"
                     >
                        {status === 'idle' ? (
                           <>
                              <Target className="h-4 w-4 mr-2" />
                              Auto-Fetch Location
                           </>
                        ) : status === 'locating' ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full mr-2"></div>
                              Establishing Signal...
                           </>
                        ) : (
                           'Sector Confirmed'
                        )}
                     </button>
                     <button 
                        onClick={handleDismiss}
                        className="w-full py-4 bg-bg-muted border border-border-base text-fg-primary hover:bg-bg-surface rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                     >
                        Select Region Manually
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default LocationPrompt;
