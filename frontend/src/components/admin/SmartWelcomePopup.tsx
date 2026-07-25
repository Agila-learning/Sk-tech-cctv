"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, Wrench, FileText, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';

export default function SmartWelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAndShowPopup = async () => {
      const lastShown = localStorage.getItem('smart_welcome_shown_timestamp');
      const now = new Date().getTime();

      // Only show once per hour (3600000 ms)
      if (lastShown && now - parseInt(lastShown) < 3600000) return;

      try {
        const [warranties, invoices] = await Promise.all([
           fetchWithAuth('/product-warranty'),
           fetchWithAuth('/billing') // Adjust based on your API route
        ]);

        const dueWarranties = Array.isArray(warranties) ? warranties.filter((w: any) => {
           if (!w.nextFollowUpDate) return false;
           const d = new Date(w.nextFollowUpDate);
           d.setHours(0,0,0,0);
           const t = new Date();
           t.setHours(0,0,0,0);
           return d.getTime() <= t.getTime() && w.status !== 'Closed';
        }) : [];

        // Assuming billing returns invoices array
        const quotationsList = Array.isArray(invoices) ? invoices : (invoices?.invoices || []);
        
        const dueQuotations = quotationsList.filter((q: any) => {
           if (q.type !== 'quotation') return false;
           if (!q.nextFollowUpDate) return false;
           const d = new Date(q.nextFollowUpDate);
           d.setHours(0,0,0,0);
           const t = new Date();
           t.setHours(0,0,0,0);
           return d.getTime() <= t.getTime() && ['Pending', 'Waiting', 'Draft', 'Called'].includes(q.followUpStatus);
        });

        if (dueWarranties.length > 0 || dueQuotations.length > 0) {
           setData({ warranties: dueWarranties, quotations: dueQuotations });
           setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to load followup data for popup", err);
      }
    };
    
    checkAndShowPopup();
  }, []);

  if (!isOpen || !data) return null;

  const handleDismiss = () => {
    localStorage.setItem('smart_welcome_shown_timestamp', new Date().getTime().toString());
    setIsOpen(false);
  };

  const handleAction = (path: string) => {
    localStorage.setItem('smart_welcome_shown_timestamp', new Date().getTime().toString());
    setIsOpen(false);
    router.push(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-bg-surface border border-border-strong rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
          >
            <button onClick={handleDismiss} className="absolute top-6 right-6 p-2 bg-bg-muted rounded-full text-fg-muted hover:text-white hover:bg-red-500 transition-all z-10">
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-4 mb-8 relative z-10">
               <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                  <Bell className="h-8 w-8 text-white relative z-10" />
               </div>
               <div>
                  <h3 className="text-2xl md:text-3xl font-black text-fg-primary uppercase tracking-tighter">Are these tasks done? 🤔</h3>
                  <p className="text-sm font-bold text-fg-muted uppercase tracking-widest mt-2">Action Required Items</p>
               </div>
            </div>

            <div className="space-y-4 relative z-10">
              {data.quotations?.length > 0 && (
                 <div className="p-5 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-500/20 rounded-xl">
                          <FileText className="h-5 w-5 text-blue-500" />
                       </div>
                       <div>
                          <h4 className="font-bold text-fg-primary">{data.quotations.length} Pending Quotations</h4>
                          <p className="text-[10px] uppercase font-black tracking-widest text-fg-muted mt-1">Follow-up due today</p>
                       </div>
                    </div>
                    <button onClick={() => handleAction('/admin/billing')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">
                       View
                    </button>
                 </div>
              )}

              {data.warranties?.length > 0 && (
                 <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-purple-500/20 rounded-xl">
                          <Wrench className="h-5 w-5 text-purple-500" />
                       </div>
                       <div>
                          <h4 className="font-bold text-fg-primary">{data.warranties.length} Warranty Requests</h4>
                          <p className="text-[10px] uppercase font-black tracking-widest text-fg-muted mt-1">Action required</p>
                       </div>
                    </div>
                    <button onClick={() => handleAction('/admin/product-warranty')} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">
                       View
                    </button>
                 </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-border-base relative z-10 flex gap-4">
               <button onClick={handleDismiss} className="w-full py-4 bg-bg-muted hover:bg-bg-card border border-border-base rounded-2xl text-xs font-black text-fg-primary uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-fg-muted" /> Not Yet / Remind in 1 Hour
               </button>
            </div>
            
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
