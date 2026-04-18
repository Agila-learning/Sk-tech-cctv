"use client";
import React, { useState } from 'react';
import TechnicianSidebar from '@/components/technician/TechnicianSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <div className="flex h-screen bg-background overflow-hidden relative">
        <TechnicianSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        <main className="flex-1 overflow-y-auto bg-background relative scroll-smooth selection:bg-blue-600/30 w-full">
          {/* Mobile Header Overlay */}
          <div className="lg:hidden flex items-center justify-between p-4 m-4 bg-bg-surface rounded-2xl border border-card-border shadow-xl sticky top-4 z-40">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl active:scale-95 transition-all group"
            >
              <Menu className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
            </button>
            <h1 className="text-lg font-black uppercase tracking-tighter text-fg-primary">SK Staff</h1>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20 border border-white/10">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
