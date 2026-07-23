"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, Users, ShieldCheck, 
  PackageCheck, QrCode, NotebookPen, Clock3, Wallet, 
  Settings2, Bell, LogOut, ChevronLeft, Plus, 
  MonitorSmartphone, TrendingUp, Calendar, Zap, MessageSquare,
  Megaphone
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NextImage from 'next/image';
import QuickActionModal from './QuickActionModal';

interface TechnicianSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onChatOpen?: () => void;
}

const menuGroups = [
  {
    title: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/technician', badge: 0 },
      { icon: ClipboardList, label: 'Tasks', path: '/technician/tasks', badge: 12 },
      { icon: Users, label: 'Customer Contact', path: '/technician/customer-contact', badge: 0 },
      { icon: MessageSquare, label: 'Chat', path: '/technician/chat', badge: 3 },
      { icon: Bell, label: 'Notifications', path: '/technician/notifications', badge: 5 },
    ]
  },
  {
    title: 'SERVICES',
    items: [
      { icon: ShieldCheck, label: 'Service Warranty', path: '/technician/warranty', badge: 0 },
      { icon: PackageCheck, label: 'Product Warranty', path: '/technician/product-warranty', badge: 0 },
      { icon: QrCode, label: 'QR Code Center', path: '/technician/qrcodes', badge: 0 },
      { icon: MonitorSmartphone, label: 'Landing Pages', path: '/technician/landing-pages', badge: 0 },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { icon: Clock3, label: 'Attendance', path: '/technician/attendance', badge: 0, external: true },
      { icon: NotebookPen, label: 'Notes', path: '/technician/notes', badge: 0 },
      { icon: TrendingUp, label: 'Earnings', path: '/technician/earnings', badge: 0 },
      { icon: Calendar, label: 'Leave Request', path: '/technician/leaves', badge: 0 },
      { icon: Megaphone, label: 'Announcement', path: '/technician/announcements', badge: 0 },
      { icon: Wallet, label: 'Expenses', path: '/technician/expenses', badge: 0 },
    ]
  }
];

const Tooltip = ({ text, children, collapsed }: { text: string, children: React.ReactNode, collapsed: boolean }) => {
  return (
    <div className="relative group/tooltip flex items-center">
      {children}
      {collapsed && (
        <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 bg-black/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-black text-xs font-semibold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl whitespace-nowrap z-50 transform translate-x-2 group-hover/tooltip:translate-x-0">
          {text}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-black/90 dark:border-r-white/90"></div>
        </div>
      )}
    </div>
  );
};

const TechnicianSidebar = ({ sidebarOpen, setSidebarOpen }: TechnicianSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [mounted, setMounted] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('techSidebarCollapsed');
    if (saved) setCollapsed(JSON.parse(saved));
    
    // Fetch dynamic badge counts
    fetchWithAuth('/technician/my-tasks').then(tasks => {
      if (Array.isArray(tasks)) {
        // Count active/open tasks
        const activeTasks = tasks.filter(t => !t.status?.includes('completed') && !t.status?.includes('closed'));
        setTaskCount(activeTasks.length);
      }
    }).catch(e => console.error("Error fetching tasks for sidebar:", e));

    fetchWithAuth('/notifications').then(notifs => {
      if (Array.isArray(notifs)) {
        setNotifCount(notifs.filter(n => !n.isRead).length);
      }
    }).catch(e => console.error("Error fetching notifs for sidebar:", e));
    
    fetchWithAuth('/chat/conversations').then(convs => {
      if (Array.isArray(convs)) {
        setChatCount(convs.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0));
      }
    }).catch(e => console.error("Error fetching chats for sidebar:", e));
  }, []);

  const toggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem('techSidebarCollapsed', JSON.stringify(newVal));
  };

  const handleNavigation = (path: string, external?: boolean) => {
    if (external && path === '/technician/attendance') {
      window.open('https://mybillbook.in/', '_blank');
      setSidebarOpen(false);
      return;
    }
    router.push(path);
    setSidebarOpen(false);
  };

  if (!mounted) return <div className="w-[280px] hidden lg:block h-screen border-r border-border-subtle bg-bg-surface" />;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: collapsed ? 80 : 280,
          x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={`
          fixed inset-y-0 left-0 z-[60] h-screen flex flex-col 
          bg-bg-surface 
          border-r border-border-base
          shadow-lg
          lg:sticky lg:top-0
          backdrop-blur-xl
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 h-20 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <NextImage src="/logo.png" alt="SK Technology" width={40} height={40} className="object-contain w-full h-full p-1" />
            </div>
            <AnimatePresence mode="popLayout">
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <span className="text-[15px] font-bold text-fg-primary leading-tight font-inter">SK Tech</span>
                  <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest">Technician</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={toggleCollapse}
            className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-fg-muted hover:text-fg-primary hover:bg-bg-hover transition-colors"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft className="h-5 w-5" />
            </motion.div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 overflow-x-hidden scrollbar-thin scrollbar-thumb-fg-muted hover:scrollbar-thumb-fg-secondary scrollbar-track-transparent">
          
          {menuGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.h4 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="px-4 text-[11px] font-bold text-fg-muted uppercase tracking-[0.15em] mb-1 font-inter"
                  >
                    {group.title}
                  </motion.h4>
                )}
              </AnimatePresence>
              
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Tooltip key={item.path} text={item.label} collapsed={collapsed}>
                    <button
                      onClick={() => handleNavigation(item.path, item.external)}
                      className={`
                        group relative w-full flex items-center h-[52px] px-4 rounded-2xl
                        font-inter text-[15px] tracking-[0.3px] font-medium transition-all duration-250 ease-in-out
                        ${isActive 
                          ? 'bg-blue-500/10 text-blue-500 scale-[1.02] shadow-sm' 
                          : 'text-fg-secondary hover:bg-bg-hover hover:text-fg-primary hover:-translate-y-[1px]'}
                      `}
                    >
                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        />
                      )}

                      <div className="relative flex items-center justify-center w-6 shrink-0">
                        <item.icon 
                          className={`h-6 w-6 stroke-2 transition-transform duration-250 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-blue-500'}`} 
                        />
                        {/* Soft Glow on active */}
                        {isActive && <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full -z-10" />}
                      </div>

                      <AnimatePresence mode="popLayout">
                        {!collapsed && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            className={`ml-4 truncate ${isActive ? 'font-semibold' : 'group-hover:text-blue-500'}`}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {!collapsed && (item.path === '/technician/tasks' ? taskCount : item.path === '/technician/notifications' ? notifCount : item.path === '/technician/chat' ? chatCount : item.badge) > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                          >
                            {item.path === '/technician/tasks' ? taskCount : item.path === '/technician/notifications' ? notifCount : item.path === '/technician/chat' ? chatCount : item.badge}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Collapsed Badge Dot */}
                      {collapsed && (item.path === '/technician/tasks' ? taskCount : item.path === '/technician/notifications' ? notifCount : item.path === '/technician/chat' ? chatCount : item.badge) > 0 && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-[#0F172A]"></div>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200/50 dark:border-white/5 space-y-3 shrink-0 bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-md">
          
          <Tooltip text="Create New Task" collapsed={collapsed}>
            <button 
              onClick={() => setQuickActionOpen(true)}
              className={`
                w-full h-[52px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 
                text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 
                transition-all duration-300 hover:shadow-blue-600/40 hover:-translate-y-1 active:scale-95
                ${collapsed ? 'px-0' : 'px-4'}
              `}>
              <Plus className="h-5 w-5 stroke-2" />
              {!collapsed && <span className="font-semibold font-inter text-[14px]">Create New</span>}
            </button>
          </Tooltip>

          <Tooltip text={isOnline ? 'Go Offline' : 'Go Online'} collapsed={collapsed}>
            <button 
              onClick={async () => {
                try {
                  const res = await fetchWithAuth('/technician/toggle-online', { method: 'POST', body: JSON.stringify({ isOnline: !isOnline }) });
                  if (res) setIsOnline(res.isOnline);
                } catch (err) {}
              }}
              className={`
                w-full h-[52px] rounded-2xl flex items-center transition-all duration-250 border
                ${collapsed ? 'justify-center px-0' : 'px-4'}
                ${isOnline 
                  ? 'bg-green-50/50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20' 
                  : 'bg-red-50/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20'}
              `}
            >
              <div className="relative flex items-center justify-center w-6 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                {isOnline && <div className="absolute inset-0 bg-green-500/30 blur-sm rounded-full animate-ping" />}
              </div>
              
              {!collapsed && (
                <div className="ml-3 flex flex-col items-start overflow-hidden">
                  <span className="text-[13px] font-bold leading-tight font-inter">{isOnline ? 'Online' : 'Offline'}</span>
                  <span className="text-[10px] opacity-70 font-medium truncate w-full">{isOnline ? 'Receiving Jobs' : 'Not Available'}</span>
                </div>
              )}
            </button>
          </Tooltip>

          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start px-2'} py-2`}>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-2xl p-2 border border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 group cursor-pointer relative overflow-hidden">
             <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
               {user?.name?.charAt(0)?.toUpperCase() || 'T'}
             </div>
             
             {!collapsed && (
               <div className="flex-1 min-w-0 flex flex-col justify-center">
                 <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate font-inter">{user?.name || 'Technician'}</p>
                 <button onClick={logout} className="text-[11px] text-gray-500 hover:text-red-500 font-medium text-left transition-colors flex items-center gap-1 mt-0.5">
                   <LogOut className="h-3 w-3" /> Sign Out
                 </button>
               </div>
             )}
             
             {collapsed && (
                <div className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={logout}>
                   <LogOut className="h-5 w-5" />
                </div>
             )}
          </div>
        </div>
      </motion.aside>

      <QuickActionModal 
        isOpen={quickActionOpen} 
        onClose={() => setQuickActionOpen(false)} 
      />
    </>
  );
};

export default TechnicianSidebar;
