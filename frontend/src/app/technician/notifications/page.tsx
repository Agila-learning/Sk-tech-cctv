"use client";
import React from 'react';
import { NotificationSection } from '@/components/NotificationSection';
import { Bell, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const TechnicianNotificationsPage = () => {
  return (
    <div className="flex min-h-screen bg-background text-fg-primary italic selection:bg-blue-600/30">
      <main className="flex-1 p-6 lg:p-12 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Operational Command Matrix</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic text-fg-primary">
              Mission <span className="text-blue-500 non-italic">Alerts</span>
            </h1>
            <p className="text-fg-muted text-lg font-medium uppercase tracking-widest leading-none">
              Real-time Field Updates & Assignments
            </p>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-[3.5rem] border border-card-border overflow-hidden shadow-2xl"
        >
          <div className="p-8">
            <NotificationSection />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TechnicianNotificationsPage;
