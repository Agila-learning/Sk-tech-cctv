"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// @ts-ignore
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SIDEBAR_CATEGORIES = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    items: [
      { name: 'Dashboard', icon: 'LayoutDashboard', href: '/admin' }
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Services',
    icon: 'ShoppingBag',
    items: [
      { name: 'Orders', icon: 'ShoppingBag', href: '/admin/orders' },
      { name: 'Cancelled Orders', icon: 'XOctagon', href: '/admin/cancelled-orders' },
      { name: 'Service Requests', icon: 'Hammer', href: '/admin/service-requests' },
      { name: 'Service Pipeline', icon: 'Ticket', href: '/admin/tickets' },
      { name: 'Tasks', icon: 'ClipboardList', href: '/admin/tasks' },
      { name: 'Service Reports', icon: 'BarChart2', href: '/admin/reports' }
    ]
  },
  {
    id: 'workforce',
    title: 'Workforce',
    icon: 'Users',
    items: [
      { name: 'Technicians', icon: 'Users', href: '/admin/technicians' },
      { name: 'Attendance', icon: 'Clock', href: '/admin/attendance' },
      { name: 'Availability', icon: 'UserCheck', href: '/admin/availability' },
      { name: 'Leave Requests', icon: 'Calendar', href: '/admin/leaves' },
      { name: 'Salary', icon: 'CreditCard', href: '/admin/salary' },
      { name: 'Holiday Calendar', icon: 'CalendarDays', href: '/admin/holidays' }
    ]
  },
  {
    id: 'customers',
    title: 'Customer Management',
    icon: 'UserPlus',
    items: [
      { name: 'Customers', icon: 'Users', href: '/admin/customers' },
      { name: 'Customer Contact', icon: 'Phone', href: '/admin/customer-contact' },
      { name: 'Communications', icon: 'MessageSquare', href: '/admin/chat', isBeta: false },
      { name: 'Chat Monitor', icon: 'Shield', href: '/admin/chat-monitoring', isBeta: true },
      { name: 'Reviews', icon: 'Star', href: '/admin/reviews' }
    ]
  },
  {
    id: 'chatbot',
    title: 'Chatbot & Inquiries',
    icon: 'Bot',
    items: [
      { name: 'Inquiries', icon: 'MessageCircle', href: '/admin/inquiries' },
      { name: 'Chatbot Leads', icon: 'Bot', href: '/admin/leads' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory & Products',
    icon: 'Package',
    items: [
      { name: 'Categories', icon: 'Folder', href: '/admin/categories' },
      { name: 'Products', icon: 'Package', href: '/admin/products' }
    ]
  },
  {
    id: 'warranty',
    title: 'Warranty & Compliance',
    icon: 'ShieldCheck',
    items: [
      { name: 'Product Warranty', icon: 'ShieldCheck', href: '/admin/product-warranty' },
      { name: 'Service Warranty', icon: 'ShieldCheck', href: '/admin/warranty' }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Finance',
    icon: 'IndianRupee',
    items: [
      { name: 'Billing', icon: 'IndianRupee', href: '/admin/billing' },
      { name: 'Quotation Pipeline', icon: 'FileText', href: '/admin/quotations' },
      { name: 'Expenses', icon: 'Clock', href: '/admin/expenses' },
      { name: 'QR Code Center', icon: 'QrCode', href: '/admin/qrcodes' }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing & CRM',
    icon: 'Layers',
    items: [
      { name: 'Marketing Hub', icon: 'Layers', href: '/admin/marketing' },
      { name: 'Engagement', icon: 'Sparkles', href: '/admin/marketing/engagement' },
      { name: 'Live Tracking', icon: 'Map', href: '/admin/tracking' },
      { name: 'Notifications', icon: 'Bell', href: '/admin/notifications' },
      { name: 'Announcements', icon: 'Megaphone', href: '/admin/announcements' },
      { name: 'Notes', icon: 'FileText', href: '/admin/notes' }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: 'Settings',
    items: [
      { name: 'My Profile', icon: 'User', href: '/admin/profile' },
      { name: 'System Health', icon: 'Activity', href: '/admin/diagnostics' },
      { name: 'Settings', icon: 'Settings', href: '/admin/settings' }
    ]
  }
];

// Provide predefined favorites so they have immediate value
const DEFAULT_FAVORITES = [
  { name: 'Orders', icon: 'ShoppingBag', href: '/admin/orders' },
  { name: 'Billing', icon: 'IndianRupee', href: '/admin/billing' },
  { name: 'Attendance', icon: 'Clock', href: '/admin/attendance' },
  { name: 'Technicians', icon: 'Users', href: '/admin/technicians' }
];

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  const getIcon = (iconName: string): any => {
    return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  };

  // Find active category on mount/route change
  useEffect(() => {
    const activeCat = SIDEBAR_CATEGORIES.find(cat => 
      cat.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    );
    if (activeCat && !searchQuery) {
      setExpandedCategory(activeCat.id);
    }
  }, [pathname]);

  // Initial animation
  useGSAP(() => {
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

  const handleCategoryClick = (id: string) => {
    setExpandedCategory(prev => prev === id ? null : id);
  };

  // Filter items if searching
  const isSearching = searchQuery.trim().length > 0;
  
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
          ${collapsed ? 'w-[280px] lg:w-20' : 'w-[280px]'} h-screen fixed left-0 top-0 z-[50] flex flex-col
          transition-all duration-500 ease-in-out overflow-hidden
          shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
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
                    <div className="relative flex items-center justify-center group shrink-0 ml-1 cursor-help">
                      <div className="relative w-2 h-2">
                        <div className="w-2 h-2 bg-[#22C55E] rounded-full relative z-10 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <div ref={pulseRef} className="absolute inset-0 w-2 h-2 bg-[#22C55E] rounded-full" />
                      </div>
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
                onClick={onClose}
                className="p-2 bg-black/10 dark:bg-white/10 rounded-xl hover:bg-black/20 dark:hover:bg-white/20 text-slate-900 dark:text-white transition-all flex items-center justify-center w-10 h-10 relative z-[100]"
              >
                <LucideIcons.X className="h-6 w-6" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {!collapsed && (
            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search modules..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <LucideIcons.X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 pb-20 space-y-1 custom-scrollbar">
            
            {/* Favorites Section (Only show if not searching) */}
            {!isSearching && !collapsed && (
              <div className="mb-4">
                <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <LucideIcons.Star className="w-3 h-3 text-yellow-500" fill="currentColor" /> Favorites
                </p>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {DEFAULT_FAVORITES.map(fav => {
                    const Icon = getIcon(fav.icon);
                    const isActive = pathname === fav.href;
                    return (
                      <Link key={fav.name} href={fav.href} onClick={onClose}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
                            : 'bg-white dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-bold text-center leading-tight">{fav.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {!collapsed && <p className="px-3 pt-4 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">All Modules</p>}

            {/* Accordion Categories */}
            {SIDEBAR_CATEGORIES.map(category => {
              const CategoryIcon = getIcon(category.icon);
              
              // Filter items if searching
              const filteredItems = isSearching 
                ? category.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : category.items;

              if (filteredItems.length === 0) return null;

              const isExpanded = expandedCategory === category.id || isSearching;
              const hasActiveChild = category.items.some(item => pathname === item.href);

              return (
                <div key={category.id} className="mb-1">
                  {/* Category Header */}
                  {!collapsed ? (
                    <button 
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                        hasActiveChild && !isExpanded 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon size={18} strokeWidth={2.5} className={hasActiveChild && !isExpanded ? 'text-blue-600' : 'text-slate-400'} />
                        <span className="text-[13px]">{category.title}</span>
                      </div>
                      <LucideIcons.ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <div className="flex justify-center py-3 group relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded-xl" title={category.title}>
                      <CategoryIcon size={22} className={hasActiveChild ? 'text-blue-600' : 'text-slate-400'} />
                      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50">
                        {category.title}
                      </div>
                    </div>
                  )}

                  {/* Children Items */}
                  {(!collapsed && isExpanded) && (
                    <div className="mt-1 ml-4 border-l-2 border-slate-200 dark:border-white/10 pl-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {filteredItems.map(item => {
                        const ItemIcon = getIcon(item.icon);
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-semibold
                              ${isActive 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}
                            `}
                          >
                            <ItemIcon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'opacity-70'} />
                            <span className="truncate">{item.name}</span>
                            {(item as any).isBeta && (
                              <span className={`ml-auto text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'}`}>Beta</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer User Area */}
          <div className="h-[80px] p-4 border-t border-black/5 dark:border-white/5 bg-[#F4F7FC]/80 dark:bg-[#14294D]/80 backdrop-blur-md flex items-center justify-between shrink-0 absolute bottom-0 left-0 w-full z-10">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0 border-2 border-white dark:border-slate-800 relative">
                <span className="text-white font-black text-sm">{user?.name?.charAt(0) || 'A'}</span>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#F4F7FC] dark:border-[#14294D]" />
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-black text-[#0F172A] dark:text-white truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                    {user?.role || 'System Admin'}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button 
                onClick={logout}
                title="Logout"
                className="p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 text-slate-400 transition-all group"
              >
                <LucideIcons.LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
            )}
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-500 hover:text-blue-600 shadow-md z-[60] transition-colors"
          >
            <LucideIcons.ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
