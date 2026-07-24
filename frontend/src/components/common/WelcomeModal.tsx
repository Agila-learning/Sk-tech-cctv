"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Briefcase, Zap } from 'lucide-react';

export const WelcomeModal = ({
  tasksCount = 0,
  followupsCount = 0,
  userName = "Technician",
}: {
  tasksCount?: number;
  followupsCount?: number;
  userName?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check local storage for last seen date
    const lastSeen = localStorage.getItem('welcome_modal_last_seen');
    const today = new Date().toISOString().split('T')[0];

    if (lastSeen !== today) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('welcome_modal_last_seen', today);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-bg-surface border border-border-base rounded-[2.5rem] p-8 md:p-12 shadow-2xl w-full max-w-lg flex flex-col items-center text-center z-10"
          >
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 bg-bg-muted hover:bg-bg-hover rounded-full transition-colors text-fg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-6 border border-blue-500/20">
              <Zap className="h-10 w-10 text-blue-600" />
            </div>
            
            <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter mb-2">
              Good Morning, <span className="text-blue-600">{userName}</span>
            </h2>
            <p className="text-sm font-medium text-fg-muted mb-8 leading-relaxed">
              Here is your quick summary for today. Let's get things moving!
            </p>
            
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-bg-muted border border-border-base rounded-2xl p-6 flex flex-col items-center shadow-sm">
                <ClipboardList className="h-6 w-6 text-indigo-500 mb-2" />
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Today's Tasks</p>
                <p className="text-3xl font-black text-fg-primary">{tasksCount}</p>
              </div>
              <div className="bg-bg-muted border border-border-base rounded-2xl p-6 flex flex-col items-center shadow-sm">
                <Briefcase className="h-6 w-6 text-orange-500 mb-2" />
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Follow-ups</p>
                <p className="text-3xl font-black text-fg-primary">{followupsCount}</p>
              </div>
            </div>
            
            <button 
              onClick={handleClose}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
            >
              Start My Day
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
