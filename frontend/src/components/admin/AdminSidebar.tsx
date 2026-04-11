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
    { name: 'Task Allocation', icon: 'Target', href: '/admin/tasks-allocation' }, // Fixed href to match logical context
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
      <div className={`w-80 h-screen bg-white dark:bg-slate-900 p-8 flex flex-col fixed left-0 top-0 z-50 border-r border-border-base transition-all duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-hidden`}>
      <div className="flex items-center space-x-3 text-slate-800 dark:text-white mb-12 shrink-0">
        <div className="relative w-12 h-12 overflow-hidden rounded-xl border border-border-base shadow-sm bg-white">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tighter leading-none">SK<span className="text-primary-blue">TECHNOLOGY</span></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 ml-0.5 mt-1">Enterprise Admin</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 pb-4 scroll-smooth scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = getIcon(item.icon);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-gradient-to-r from-primary-blue to-primary-teal text-white shadow-lg shadow-primary-blue/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <div className="flex items-center space-x-4">
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-blue transition-colors'}`} />
                <span className={`text-sm tracking-wide ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border-subtle space-y-3">
        {/* Secondary Options Collapse */}
        {isMoreOpen && (
          <div className="mb-4 space-y-1 bg-bg-muted/50 rounded-2xl p-2 max-h-60 overflow-y-auto scrollbar-hide border border-border-subtle animate-in fade-in slide-in-from-bottom-2 duration-300">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = getIcon(item.icon);
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-xs font-bold ${isActive ? 'bg-primary-teal text-white' : 'text-fg-muted hover:bg-white hover:text-fg-primary'}`}
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
          className="px-5 py-4 bg-bg-muted rounded-2xl border border-border-subtle flex items-center space-x-4 cursor-pointer hover:border-primary-blue/30 transition-all group"
        >
           <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-teal rounded-xl flex items-center justify-center text-white font-black text-xs">
             {user?.name?.[0] || 'AD'}
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-black text-fg-primary uppercase tracking-wider">{user?.name || 'Super Admin'}</span>
              <span className="text-[10px] font-bold text-fg-muted uppercase">{user?.role === 'sub-admin' ? 'Sub-Admin Access' : 'Root Access'}</span>
           </div>
           <LucideIcons.ChevronUp className={`h-4 w-4 text-fg-dim group-hover:text-fg-primary transition-all ml-auto ${isMoreOpen ? 'rotate-0' : 'rotate-180'}`} />
        </div>
        
        <button 
          onClick={() => logout()}
          className="flex items-center justify-center space-x-3 px-5 py-4 rounded-2xl bg-danger-red text-white w-full transition-all group shadow-lg shadow-danger-red/10 hover:bg-red-600 active:scale-95"
        >
          <LucideIcons.LogOut className="h-5 w-5 text-white" />
          <span className="font-bold text-xs uppercase tracking-widest text-white">Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default AdminSidebar;
