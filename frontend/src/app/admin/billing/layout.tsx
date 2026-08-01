"use client";
import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, FileSignature, Receipt, PlusSquare, Wrench, Wallet, BookOpen, BookUser, FileMinus, BarChart, Settings, Menu, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const BILLING_NAV = [
  { name: 'Dashboard', href: '/admin/billing', icon: LayoutDashboard },
  { name: 'Quotations', href: '/admin/billing/quotations', icon: FileText },
  { name: 'Sales Invoice', href: '/admin/billing/sales-invoice', icon: Receipt },
  { name: 'Manual Invoice', href: '/admin/billing/manual-invoice', icon: PlusSquare },
  { name: 'Payment Collection', href: '/admin/billing/payment-collection', icon: Wallet },
  { name: 'Customer Ledger', href: '/admin/billing/customer-ledger', icon: BookUser },
];

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-bg-base text-fg-base overflow-hidden selection:bg-blue-500/30 font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden bg-[#f4f7fa] dark:bg-bg-base lg:ml-[280px] transition-all duration-500">
        {/* Dynamic Background matching ERP style */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] mix-blend-screen" />
        </div>

        {/* ERP Top Header */}
        <header className="relative z-20 shrink-0 bg-white dark:bg-bg-surface border-b border-border-base shadow-sm px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-bg-surface border border-border-base hover:bg-bg-hover text-fg-primary"
              >
                <Menu size={20} />
              </button>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-400">SK BILLING ERP</h1>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Search invoices, customers..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-bg-base border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-fg-base"
                />
              </div>
              <button className="p-2 rounded-full bg-gray-100 dark:bg-bg-base hover:bg-gray-200 dark:hover:bg-bg-hover text-fg-primary transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
           </div>
        </header>

        {/* ERP Module Navigation (Horizontal Scrollable Tabs) */}
        <div className="relative z-20 shrink-0 bg-white dark:bg-bg-surface border-b border-border-base px-6">
           <nav className="flex space-x-6 overflow-x-auto hide-scrollbar">
             {BILLING_NAV.map((item) => {
               const isActive = pathname === item.href;
               return (
                 <Link 
                   key={item.name} 
                   href={item.href}
                   className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-fg-muted hover:text-fg-primary hover:border-border-base'}`}
                 >
                   <item.icon size={16} />
                   {item.name}
                 </Link>
               );
             })}
           </nav>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
