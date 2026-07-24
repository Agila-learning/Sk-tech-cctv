"use client";
import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { NotificationSection } from '@/components/NotificationSection';
import { ShieldCheck } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen bg-bg-body text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen transition-all duration-300">
          <AdminNavbar />
          
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl">
                  <ShieldCheck className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight">Notification Center</h1>
                  <p className="text-xs font-bold text-fg-muted uppercase tracking-widest mt-1">Review All System Alerts</p>
                </div>
              </div>
            </header>

            <div className="w-full">
               <NotificationSection />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
