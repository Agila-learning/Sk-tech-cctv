"use client";
import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { NotificationSection } from '@/components/NotificationSection';
import { Bell, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminNotificationsPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 lg:ml-80 p-8 lg:p-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <header className="space-y-4">
            <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Command Center Notifications</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic text-fg-primary">
              Global <span className="text-blue-500 non-italic">Alerts</span>
            </h1>
            <p className="text-fg-muted text-lg font-medium uppercase tracking-widest leading-none">
              Real-time System & Operational Updates
            </p>
          </header>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[3rem] border border-card-border overflow-hidden shadow-2xl"
          >
            <div className="p-1">
              <NotificationSection />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotificationsPage;
