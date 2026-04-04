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

        <main className="flex-1 overflow-y-auto bg-background relative scroll-smooth selection:bg-blue-600/30">
          {/* Mobile Header Overlay */}
          <div className="lg:hidden flex items-center justify-between p-5 m-5 bg-card rounded-[2rem] border border-card-border shadow-xl">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl active:scale-95 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter">SK Staff</h1>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">
              {user?.name?.[0]}
            </div>
          </div>

          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
