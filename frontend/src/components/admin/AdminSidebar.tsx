"use client";
import React from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/utils/api';

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

  const menuItems = [
    { name: 'Dashboard', icon: 'LayoutDashboard', href: '/admin' },
    { name: 'Expenses', icon: 'Clock', href: '/admin/expenses' },
    { name: 'Orders', icon: 'ShoppingBag', href: '/admin/orders' },
    { name: 'Technicians', icon: 'Users', href: '/admin/technicians' },
    { name: 'Products', icon: 'Package', href: '/admin/products' },
    { name: 'Tasks', icon: 'ClipboardList', href: '/admin/tasks' },
    { name: 'Attendance', icon: 'Activity', href: '/admin/attendance' },
    { name: 'Leave Requests', icon: 'Calendar', href: '/admin/leaves' },
    { name: 'Service Requests', icon: 'Hammer', href: '/admin/service-requests' },
    { name: 'Availability', icon: 'UserCheck', href: '/admin/availability' },
    { name: 'Billing', icon: 'IndianRupee', href: '/admin/billing' },
    { name: 'Salary', icon: 'CreditCard', href: '/admin/salary' },
    { name: 'Marketing Hub', icon: 'Layers', href: '/admin/marketing' },
    { name: 'Live Tracking', icon: 'Map', href: '/admin/tracking' },
    { name: 'Reviews', icon: 'Star', href: '/admin/reviews' },
  ];

  const secondaryItems = [
    { name: 'Support Tickets', icon: 'Ticket', href: '/admin/tickets' },
    { name: 'Inquiries', icon: 'Shield', href: '/admin/inquiries' },
    { name: 'Customers', icon: 'Users', href: '/admin/customers' },
    { name: 'Holiday Calendar', icon: 'CalendarDays', href: '/admin/holidays' },
    { name: 'Announcements', icon: 'Megaphone', href: '/admin/announcements' },
    { name: 'Field Chat', icon: 'MessageSquare', href: '/admin/chat' },
    { name: 'Reports', icon: 'BarChart2', href: '/admin/reports' },
    { name: 'System Health', icon: 'Activity', href: '/admin/diagnostics' },
    { name: 'Newsletter', icon: 'Mail', href: '/admin/subscriptions' },
    { name: 'Settings', icon: 'Settings', href: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-80 h-screen fixed left-0 top-0 z-50 flex flex-col
          transition-transform duration-500 ease-in-out overflow-hidden
          sidebar-gradient shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-32 left-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center space-x-3 px-8 py-7 border-b border-white/08 flex-shrink-0">
          <div className="relative w-11 h-11 overflow-hidden rounded-xl border border-white/20 shadow-lg bg-white/05 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="SK Tech Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as any).style.display = 'none';
                (e.target as any).parentElement.innerHTML = '<div class="text-white font-black text-xl">SK</div>';
              }}
            />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight leading-none text-white">
              SK<span className="text-[#14B8A6]">TECH</span>
            </span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mt-0.5">Enterprise Admin</p>
          </div>
          {/* Live indicator */}
          <div className="ml-auto flex items-center space-x-1.5">
            <div className="relative w-2 h-2">
              <div className="w-2 h-2 bg-[#22C55E] rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-[#22C55E] rounded-full animate-ping opacity-50" />
            </div>
            <span className="text-[8px] font-bold text-[#22C55E] uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 scrollbar-hide">
          {/* Section label */}
          <p className="px-4 pt-2 pb-3 text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Main Menu</p>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = getIcon(item.icon);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'sidebar-item-active'
                    : 'hover:bg-white/07 text-white/60 hover:text-white border-l-3 border-transparent'}
                `}
              >
                <div className="flex items-center space-x-3 relative z-10">
                  <div className={`
                    p-1.5 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-white/15 shadow-inner'
                      : 'group-hover:bg-white/10'}
                  `}>
                    <Icon className={`h-4 w-4 transition-all ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white group-hover:scale-110'}`} />
                  </div>
                  <span className={`text-[13px] font-semibold tracking-wide transition-colors ${isActive ? 'text-white font-bold' : 'text-white/60 group-hover:text-white'}`}>
                    {item.name}
                  </span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)] flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="px-4 pb-4 pt-2 border-t border-white/08 flex-shrink-0 space-y-2">
          {/* More Menu */}
          {isMoreOpen && (
            <div className="mb-2 space-y-0.5 bg-white/05 rounded-2xl p-2 max-h-52 overflow-y-auto scrollbar-hide border border-white/08 animate-slide-up">
              <p className="px-3 pt-1 pb-2 text-[8px] font-black uppercase tracking-[0.25em] text-white/30">More</p>
              {secondaryItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = getIcon(item.icon);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => { onClose?.(); }}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/07 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Profile + Expand */}
          <div
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="flex items-center space-x-3 px-4 py-3.5 bg-white/06 backdrop-blur-sm rounded-2xl border border-white/08 cursor-pointer hover:bg-white/10 transition-all group"
          >
            <div className="w-9 h-9 overflow-hidden bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg border border-white/20 flex-shrink-0">
              {user?.profilePic ? (
                <img src={getImageUrl(user.profilePic)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profileName?.[0]?.toUpperCase() || 'A'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white uppercase tracking-tight truncate">{profileName}</p>
              <p className="text-[9px] font-bold text-[#14B8A6] uppercase tracking-widest mt-0.5">
                {user?.role === 'sub-admin' ? 'Sub-Admin' : 'Root Access'}
              </p>
            </div>
            <LucideIcons.ChevronUp className={`h-4 w-4 text-white/40 group-hover:text-white transition-all flex-shrink-0 ${isMoreOpen ? 'rotate-0' : 'rotate-180'}`} />
          </div>

          {/* Sign Out */}
          <button
            onClick={() => logout()}
            className="flex items-center justify-center space-x-2.5 w-full px-4 py-3.5 rounded-2xl
              bg-red-500/15 border border-red-500/25 hover:bg-red-500/25
              text-red-400 hover:text-red-300 transition-all group active:scale-98"
          >
            <LucideIcons.LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
