"use client";
import React, { useRef } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/utils/api';
import ThemeToggle from '../layout/ThemeToggle';
// @ts-ignore
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const profileName = user?.name || 'Admin';

  const getIcon = (iconName: string): any => {
    return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  };

  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initial Sidebar Loading Animation
    gsap.from(sidebarRef.current, {
      x: -300,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    });

    // Green dot soft pulse
    if (pulseRef.current) {
      gsap.to(pulseRef.current, {
        scale: 1.6,
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: "power2.out"
      });
    }
  }, []);

  useGSAP(() => {
    // Dropdown animation for More menu
    if (isMoreOpen && moreMenuRef.current) {
      gsap.fromTo(moreMenuRef.current, 
        { height: 0, opacity: 0, y: 10 },
        { height: 'auto', opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isMoreOpen]);

  const menuItems = [
    { name: 'Dashboard', icon: 'LayoutDashboard', href: '/admin' },
    { name: 'Orders', icon: 'ShoppingBag', href: '/admin/orders' },
    { name: 'Cancelled Orders', icon: 'XOctagon', href: '/admin/cancelled-orders' },
    { name: 'Technicians', icon: 'Users', href: '/admin/technicians' },
    { name: 'Categories', icon: 'Folder', href: '/admin/categories' },
    { name: 'Products', icon: 'Package', href: '/admin/products' },
    { name: 'Tasks', icon: 'ClipboardList', href: '/admin/tasks' },
    { name: 'Communications', icon: 'MessageSquare', href: '/admin/chat', isBeta: false },
    { name: 'Chat Monitor', icon: 'Shield', href: '/admin/chat-monitoring', isBeta: true },
    { name: 'Notifications', icon: 'Bell', href: '/admin/notifications' },
    { name: 'Leave Requests', icon: 'Calendar', href: '/admin/leaves' },
    { name: 'Service Requests', icon: 'Hammer', href: '/admin/service-requests' },
    { name: 'Availability', icon: 'UserCheck', href: '/admin/availability' },
    { name: 'Billing', icon: 'IndianRupee', href: '/admin/billing' },
    { name: 'Salary', icon: 'CreditCard', href: '/admin/salary' },
    { name: 'Marketing Hub', icon: 'Layers', href: '/admin/marketing' },
    { name: 'Live Tracking', icon: 'Map', href: '/admin/tracking' },
    { name: 'Reviews', icon: 'Star', href: '/admin/reviews' },
    { name: 'Service Warranty', icon: 'ShieldCheck', href: '/admin/warranty' },
    { name: 'Product Warranty', icon: 'ShieldCheck', href: '/admin/product-warranty' },
    { name: 'Customer Contact', icon: 'Users', href: '/admin/customer-contact' },
    { name: 'Notes', icon: 'FileText', href: '/admin/notes' },
    { name: 'QR Code Center', icon: 'QrCode', href: '/admin/qrcodes' },
    { name: 'Inquiries', icon: 'Shield', href: '/admin/inquiries' },
    { name: 'Chatbot Leads', icon: 'Bot', href: '/admin/leads' },
    { name: 'Service Reports', icon: 'BarChart2', href: '/admin/reports' },
    { name: 'My Profile', icon: 'User', href: '/admin/profile' },
    { name: 'Expenses', icon: 'Clock', href: '/admin/expenses' },
  ];

  const secondaryItems = [
    { name: 'Service Pipeline', icon: 'Ticket', href: '/admin/tickets' },
    { name: 'Customers', icon: 'Users', href: '/admin/customers' },
    { name: 'Holiday Calendar', icon: 'CalendarDays', href: '/admin/holidays' },
    { name: 'Announcements', icon: 'Megaphone', href: '/admin/announcements' },
    { name: 'System Health', icon: 'Activity', href: '/admin/diagnostics' },
    { name: 'Settings', icon: 'Settings', href: '/admin/settings' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      <aside
        ref={sidebarRef}
        className={`
          ${collapsed ? 'w-20' : 'w-[280px]'} h-screen fixed left-0 top-0 z-[50] flex flex-col
          transition-all duration-500 ease-in-out overflow-hidden
          shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Top Navigation Section */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F7FC] dark:bg-[#14294D] transition-colors duration-500">
          
          {/* Header */}
          <div className="h-[85px] relative flex items-center space-x-3 px-5 border-b border-black/5 dark:border-white/5 flex-shrink-0">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-transparent">
              <img
                src="/logo.png"
                alt="SK Tech Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                  (e.target as any).parentElement.innerHTML = '<div class="text-[#0F172A] font-black text-xl">SK</div>';
                }}
              />
            </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {!collapsed && (
                  <>
                    <span className="text-[16px] font-black tracking-tight leading-none text-[#0F172A] dark:text-white transition-colors truncate">
                      SK <span className="text-[#2563EB]">TECHNOLOGY</span>
                    </span>
                    
                    {/* Status Indicator */}
                    <div className="relative flex items-center justify-center group shrink-0 ml-1 cursor-help">
                      <div className="relative w-2 h-2">
                        <div className="w-2 h-2 bg-[#22C55E] rounded-full relative z-10 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <div ref={pulseRef} className="absolute inset-0 w-2 h-2 bg-[#22C55E] rounded-full" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-max bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] text-[10px] font-bold px-2 py-1.5 rounded-md z-50 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        System Connected
                      </div>
                    </div>
                  </>
                )}
              </div>
            
            <div className="lg:hidden flex items-center space-x-2 ml-auto shrink-0 relative z-[70]">
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose?.(); }} 
                className="p-2 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center w-10 h-10 relative z-[100]"
              >
                <LucideIcons.X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
            {!collapsed && <p className="px-3 pt-2 pb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Main Menu</p>}

            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = getIcon(item.icon);
              return (
                <Link
                  key={item.name}
                  href={item.name === 'Attendance' ? 'https://mybillbook.in/' : item.href}
                  target={item.name === 'Attendance' ? '_blank' : undefined}
                  rel={item.name === 'Attendance' ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    onClose?.();
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`
                    flex items-center h-[50px] px-3 rounded-xl
                    transition-all duration-300 ease-out group relative overflow-hidden
                    ${isActive
                      ? 'bg-[#2563EB]/10 dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#3B82F6]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#2563EB] dark:hover:text-[#3B82F6]'}
                  `}
                >
                  {/* Left Accent Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#2563EB] dark:bg-[#3B82F6] rounded-r-md" />
                  )}

                  <div className="flex items-center space-x-3 w-full pl-1 relative z-10">
                    <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#2563EB] dark:text-[#3B82F6]' : 'text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]'}`} />
                    {!collapsed && (
                      <span className={`text-[13px] font-[600] tracking-wide transition-colors truncate ${isActive ? 'text-[#2563EB] dark:text-[#3B82F6]' : 'text-slate-600 dark:text-slate-300 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]'}`}>
                        {item.name}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Section */}
        <div className="bg-[#E8EEF7] dark:bg-[#10203A] transition-colors duration-500 px-4 py-5 flex-shrink-0 flex flex-col space-y-4 relative z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.2)] border-t border-black/5 dark:border-white/5">
          
          <div className="flex justify-end items-center mb-1">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all ${collapsed ? 'w-full flex justify-center' : ''}`}
            >
              {collapsed ? <LucideIcons.ChevronRight className="h-4 w-4" /> : <LucideIcons.ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* More Menu */}
          <div className="relative">
            {isMoreOpen && !collapsed && (
              <div ref={moreMenuRef} className="absolute bottom-full mb-3 left-0 w-full bg-white dark:bg-[#0F172A] rounded-2xl p-2 overflow-hidden border border-black/5 dark:border-white/10 shadow-2xl">
                <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">More</p>
                <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                  {secondaryItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = getIcon(item.icon);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => { onClose?.(); }}
                        className={`flex items-center space-x-3 px-3 h-10 rounded-xl transition-all text-[12px] font-[600] ${
                          isActive ? 'bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]' : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#2563EB] dark:hover:text-[#3B82F6]'
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Profile & Theme Card */}
            <div className="flex items-center gap-2">
              <div
                onClick={() => !collapsed && setIsMoreOpen(!isMoreOpen)}
                className={`flex-1 flex items-center space-x-3 py-3 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/5 transition-all duration-300 group ${collapsed ? 'px-1 justify-center cursor-default' : 'px-3 cursor-pointer hover:bg-white/70 dark:hover:bg-black/40 hover:shadow-lg'}`}
              >
                <div className="w-9 h-9 overflow-hidden bg-gradient-to-br from-[#2563EB] to-[#14B8A6] rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0 border border-white/20" title={collapsed ? profileName : undefined}>
                  {user?.profilePic ? (
                    <img src={getImageUrl(user.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profileName?.[0]?.toUpperCase() || 'A'
                  )}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-[700] text-[#0F172A] dark:text-white uppercase tracking-tight truncate">{profileName}</p>
                      <p className="text-[10px] font-[600] text-slate-500 dark:text-slate-400 mt-0.5">
                        Administrator
                      </p>
                    </div>
                    <LucideIcons.ChevronUp className={`h-4 w-4 text-slate-400 group-hover:text-[#2563EB] transition-transform duration-300 shrink-0 ${isMoreOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </>
                )}
              </div>
              
              {!collapsed && (
                <div className="shrink-0 bg-white/40 dark:bg-black/20 rounded-2xl border border-white/60 dark:border-white/5 p-1">
                  <ThemeToggle />
                </div>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => logout()}
            className={`
              relative overflow-hidden flex items-center justify-center w-full h-[46px] rounded-full
              bg-white dark:bg-[#0F172A] border border-red-200 dark:border-red-900/50 hover:border-red-500 dark:hover:border-red-500
              text-red-500 transition-all duration-300 group active:scale-95 shadow-sm hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)]
              ${collapsed ? 'px-0' : 'px-4 space-x-2'}
            `}
            title={collapsed ? "Sign Out" : undefined}
          >
            {/* Ripple effect overlay */}
            <span className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 scale-0 group-hover:scale-[2] transition-transform duration-500 rounded-full origin-center ease-out" />
            
            <LucideIcons.LogOut className="h-[18px] w-[18px] relative z-10 group-hover:-translate-x-1 transition-transform duration-300" />
            {!collapsed && <span className="text-[11px] font-[700] uppercase tracking-widest relative z-10">Sign Out</span>}
          </button>
        </div>
      </aside>
      
      {/* Dynamic Margin CSS Injection for main layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .lg\\:ml-\\[280px\\] {
            margin-left: ${collapsed ? '5rem' : '280px'} !important;
            transition: margin-left 0.5s ease-in-out !important;
          }
        }
      `}} />
    </>
  );
};

export default AdminSidebar;
