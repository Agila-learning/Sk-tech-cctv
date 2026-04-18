"use client";
import React, { useState, useEffect } from 'react';
import { X, Gift, ArrowRight, Zap, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/utils/api';
import Link from 'next/link';

interface OfferPopupProps {
  offers: any[];
}

const OfferPopup = ({ offers }: OfferPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<any>(null);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('sk_offer_popup_seen');
    if (!hasSeenPopup && offers.length > 0) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setCurrentOffer(offers[0]);
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [offers]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('sk_offer_popup_seen', 'true');
  };

  if (!currentOffer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-card border border-card-border rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full"></div>
            
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-3 bg-bg-surface/50 hover:bg-red-500 hover:text-white transition-all rounded-2xl z-10 border border-border-base"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-[4/3] relative overflow-hidden bg-bg-muted">
               <img 
                 src={getImageUrl(currentOffer.image)} 
                 alt={currentOffer.title}
                 className="w-full h-full object-contain"
                 onError={(e: any) => e.target.src = '/placeholder.png'}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent"></div>
               
               <div className="absolute bottom-8 left-10">
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                        <Gift className="h-4 w-4 text-white" />
                     </div>
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Exclusive Intel</span>
                  </div>
                  <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter leading-none italic">{currentOffer.title}</h2>
               </div>
            </div>

            <div className="p-10 pt-4 space-y-8 overflow-y-auto custom-scrollbar">
               <p className="text-fg-muted text-sm font-medium leading-relaxed">
                  {currentOffer.description}
               </p>

               <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base flex items-center justify-between">
                  <div>
                     <p className="text-[8px] font-black text-fg-dim uppercase tracking-widest mb-1">Use Credentials</p>
                     <p className="text-xl font-black text-blue-500 tracking-widest uppercase">{currentOffer.code}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-fg-dim uppercase tracking-widest mb-1">Impact</p>
                     <p className="text-xl font-black text-fg-primary tracking-tighter">-{currentOffer.discountPercentage}%</p>
                  </div>
               </div>

               <Link 
                 href="/products" 
                 onClick={handleClose}
                 className="w-full py-6 bg-fg-primary text-bg-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all group"
               >
                  Authorize Purchase
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </Link>

               <p className="text-center text-[8px] font-black text-fg-dim uppercase tracking-widest italic flex items-center justify-center gap-2">
                  <Bell className="h-3 w-3" /> Secure Transaction Protocol Active
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OfferPopup;
