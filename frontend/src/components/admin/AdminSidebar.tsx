"use client";
import React from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  // Safely get icons from LucideIcons object to prevent undefined component crashes
  const getIcon = (iconName: string): any => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return Icon;
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'LayoutDashboard', href: '/admin' },
    { name: 'Notifications', icon: 'Bell', href: '/admin/notifications' },
    { name: 'Support Tickets', icon: 'Ticket', href: '/admin/tickets' },
    { name: 'Inquiries', icon: 'Shield', href: '/admin/inquiries' },
    { name: 'Products', icon: 'Package', href: '/admin/products' },
    { name: 'Orders', icon: 'ShoppingBag', href: '/admin/orders' },
    { name: 'Customers', icon: 'Users', href: '/admin/customers' },
    { name: 'Task Allocation', icon: 'Target', href: '/admin/tasks' },
    { name: 'Technicians', icon: 'Users', href: '/admin/technicians' },
    { name: 'Salary Management', icon: 'CreditCard', href: '/admin/salary' },
    { name: 'Availability', icon: 'UserCheck', href: '/admin/availability' },
    { name: 'Live Tracking', icon: 'Map', href: '/admin/tracking' },
    { name: 'Service Requests', icon: 'Hammer', href: '/admin/service-requests' },
    { name: 'Attendance', icon: 'Activity', href: '/admin/attendance' },
    { name: 'Holiday Calendar', icon: 'CalendarDays', href: '/admin/holidays' },
    { name: 'Announcements', icon: 'Megaphone', href: '/admin/announcements' },
    { name: 'Field Chat', icon: 'MessageSquare', href: '/admin/chat' },
    { name: 'Service Reports', icon: 'Shield', href: '/admin/reports' },
    { name: 'Customer Reviews', icon: 'Star', href: '/admin/reviews' },
    { name: 'Newsletter', icon: 'Megaphone', href: '/admin/subscriptions' },
    { name: 'Leave Requests', icon: 'Calendar', href: '/admin/leaves' },
    { name: 'System Health', icon: 'Activity', href: '/admin/diagnostics' },
    { name: 'Billing', icon: 'IndianRupee', href: '/admin/billing' },
    { name: 'Marketing Hub', icon: 'Layers', href: '/admin/marketing' },
    { name: 'Expenses', icon: 'Clock', href: '/admin/expenses' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      <div className={`w-80 bg-background h-screen text-fg-secondary p-8 flex flex-col fixed left-0 top-0 z-50 border-r border-border-base transition-all duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center space-x-3 text-fg-primary mb-16 shrink-0">
        <div className="relative w-12 h-12 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.4)] bg-white">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tighter leading-none">SK<span className="text-blue-500 italic">TECHNOLOGY</span></span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fg-dim ml-0.5 mt-1">Enterprise Admin</span>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4 scroll-smooth scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = getIcon(item.icon);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-blue-600 text-white shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)]' : 'hover:bg-bg-muted text-fg-primary'}`}
            >
              <div className="flex items-center space-x-4">
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-fg-dim group-hover:text-blue-500 transition-colors'}`} />
                <span className="font-bold text-sm tracking-wide">{item.name}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,1)]"></div>}
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-border-subtle space-y-4">
        <div className="px-5 py-4 bg-bg-muted rounded-2xl border border-border-subtle flex items-center space-x-4">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xs">
             {user?.name?.[0] || 'AD'}
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-black text-fg-primary uppercase tracking-wider">{user?.name || 'Super Admin'}</span>
              <span className="text-[10px] font-bold text-fg-muted uppercase">{user?.role === 'sub-admin' ? 'Sub-Admin Access' : 'Root Access'}</span>
           </div>
           <Link href="/admin/settings">
             <LucideIcons.Settings className="h-4 w-4 text-fg-dim hover:text-fg-primary transition-colors cursor-pointer ml-auto" />
           </Link>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center justify-center space-x-3 px-5 py-5 rounded-2xl bg-[#EF4444] text-white w-full transition-all group shadow-lg shadow-[#EF4444]/20 hover:bg-red-600 active:scale-95 z-10"
        >
          <LucideIcons.LogOut className="h-5 w-5 text-white" />
          <span className="font-black text-xs uppercase tracking-widest text-white !opacity-100">Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default AdminSidebar;
