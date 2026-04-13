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
  const profileName = user?.name || 'Admin';

  // Safely get icons from LucideIcons object to prevent undefined component crashes
  const getIcon = (iconName: string): any => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return Icon;
  };

  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: 'LayoutDashboard', href: '/admin' },
    { name: 'Expenses', icon: 'Clock', href: '/admin/expenses' },
    { name: 'Orders', icon: 'ShoppingBag', href: '/admin/orders' },
    { name: 'Technicians', icon: 'Users', href: '/admin/technicians' },
    { name: 'Products', icon: 'Package', href: '/admin/products' },
    { name: 'Task', icon: 'ClipboardList', href: '/admin/tasks' },
    { name: 'Attendance', icon: 'Activity', href: '/admin/attendance' },
    { name: 'Leave Request', icon: 'Calendar', href: '/admin/leaves' },
    { name: 'Service Request', icon: 'Hammer', href: '/admin/service-requests' },
    { name: 'Availability', icon: 'UserCheck', href: '/admin/availability' },
    { name: 'Billing', icon: 'IndianRupee', href: '/admin/billing' },
    { name: 'Salary Management', icon: 'CreditCard', href: '/admin/salary' },
    { name: 'Marketing Hub', icon: 'Layers', href: '/admin/marketing' },
    { name: 'Live Tracking', icon: 'Map', href: '/admin/tracking' },
    { name: 'Customer Reviews', icon: 'Star', href: '/admin/reviews' },
  ];

  const secondaryItems = [
    { name: 'Support Tickets', icon: 'Ticket', href: '/admin/tickets' },
    { name: 'Inquiries', icon: 'Shield', href: '/admin/inquiries' },
    { name: 'Customers', icon: 'Users', href: '/admin/customers' },
    { name: 'Holiday Calendar', icon: 'CalendarDays', href: '/admin/holidays' },
    { name: 'Announcements', icon: 'Megaphone', href: '/admin/announcements' },
    { name: 'Field Chat', icon: 'MessageSquare', href: '/admin/chat' },
    { name: 'Service Reports', icon: 'Shield', href: '/admin/reports' },
    { name: 'System Health', icon: 'Activity', href: '/admin/diagnostics' },
    { name: 'Newsletter', icon: 'Megaphone', href: '/admin/subscriptions' },
    { name: 'Settings', icon: 'Settings', href: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 bg-opacity-60 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      <div className={`w-80 h-screen bg-bg-surface border-r border-border-base p-8 flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-hidden`}>
      <div className="flex items-center space-x-3 text-fg-primary mb-12 shrink-0">
        <div className="relative w-12 h-12 overflow-hidden rounded-xl border border-border-base shadow-sm bg-bg-muted">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain dark:brightness-0 dark:invert"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tighter leading-none text-fg-primary font-manrope">SK<span className="text-primary-blue">TECHNOLOGY</span></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-fg-muted ml-0.5 mt-1">Enterprise Admin</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 pb-4 scroll-smooth scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = getIcon(item.icon);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isActive ? 'bg-gradient-to-r from-[#0c4a6e] to-[#0284c7] text-white shadow-2xl shadow-blue-900/40 border-none' : 'text-fg-muted hover:bg-primary-blue/10 hover:text-primary-blue'}`}
            >
              <div className="flex items-center space-x-4 relative z-10">
                <Icon className={`h-5 w-5 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-fg-dim group-hover:text-primary-blue transition-colors'}`} />
                <span className={`text-sm tracking-wide font-manrope ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
              </div>
              {isActive && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] relative z-10"></div>}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/10 space-y-3">
        {/* Secondary Options Collapse */}
        {isMoreOpen && (
          <div className="mb-4 space-y-1 bg-white/5 backdrop-blur-md rounded-2xl p-2 max-h-60 overflow-y-auto scrollbar-hide border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = getIcon(item.icon);
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-xs font-black ${isActive ? 'bg-primary-blue text-white' : 'text-fg-muted hover:bg-primary-blue/5 hover:text-primary-blue'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div 
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="px-5 py-4 bg-bg-muted/80 backdrop-blur-sm rounded-2xl border border-border-base/50 flex items-center space-x-4 cursor-pointer hover:border-primary-blue transition-all group shadow-sm"
        >
           <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-teal text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg border border-white/20">
             {profileName?.[0] || 'AD'}
           </div>
           <div className="flex flex-col text-fg-primary">
              <span className="text-xs font-black uppercase tracking-wider">{profileName || 'Super Admin'}</span>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest drop-shadow-sm">{user?.role === 'sub-admin' ? 'Sub-Admin Access' : 'Root Access'}</span>
           </div>
           <LucideIcons.ChevronUp className={`h-4 w-4 text-fg-dim group-hover:text-primary-blue transition-all ml-auto ${isMoreOpen ? 'rotate-0' : 'rotate-180'}`} />
        </div>
        
        <button 
          onClick={() => logout()}
          className="flex items-center justify-center space-x-3 px-5 py-5 rounded-2xl bg-red-600 text-white w-full transition-all group shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 border-2 border-red-500/10"
        >
          <LucideIcons.LogOut className="h-5 w-5" />
          <span className="font-black text-xs uppercase tracking-[0.2em] text-white">Secure Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default AdminSidebar;
