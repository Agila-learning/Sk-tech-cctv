"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, Users, ShieldCheck, 
  PackageCheck, QrCode, NotebookPen, Clock3, Wallet, 
  Settings2, Bell, LogOut, ChevronLeft, Plus, 
  MonitorSmartphone, TrendingUp, Calendar, Zap, MessageSquare,
  Megaphone, HelpCircle, X
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
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
    hideOnMobile: true,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/technician', badge: 0 },
      { icon: ClipboardList, label: 'Orders / Tasks', path: '/technician/tasks', badge: 12 },
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
      { icon: HelpCircle, label: 'Help & FAQ', path: '/technician/help', badge: 0 },
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
    
    fetchWithAuth('/technician/my-tasks').then(tasks => {
      if (Array.isArray(tasks)) {
        const activeTasks = tasks.filter(t => !t.status?.includes('completed') && !t.status?.includes('closed'));
        setTaskCount(activeTasks.length);
      }
    }).catch(e => console.error("Error fetching tasks for sidebar:", e));

    fetchWithAuth('/notifications').then(notifs => {
      if (Array.isArray(notifs)) {
        setNotifCount(notifs.filter(n => !n.isRead).length);
      }
    }).catch(e => console.error("Error fetching notifs for sidebar:", e));
    
    fetchWithAuth('/chat').then(chats => {
      if (Array.isArray(chats)) {
        const unread = chats.filter(c => c.isRead === false && c.receiver?._id === user?.id);
        setChatCount(unread.length);
      }
    }).catch(e => console.error("Error fetching chats for sidebar:", e));

    const handleSync = (e: any) => setIsOnline(e.detail);
    window.addEventListener('tech_online_changed', handleSync);
    return () => window.removeEventListener('tech_online_changed', handleSync);
  }, []);

  const toggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem('techSidebarCollapsed', JSON.stringify(newVal));
  };

  const handleNavigation = (path: string, external?: boolean) => {
    if (external && path === '/technician/attendance') {
      router.push('/technician/attendance');
      setSidebarOpen(false);
      return;
    }
    router.push(path);
    setSidebarOpen(false);
  };

  if (!mounted) return <div className="w-[260px] hidden lg:block h-screen border-r border-border-subtle bg-bg-surface" />;

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: collapsed ? 80 : 260,
          x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0)
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={`
          fixed inset-y-0 left-0 z-[100] h-screen flex flex-col 
          bg-bg-surface border-r border-border-base
          shadow-2xl lg:shadow-none
          lg:sticky lg:top-0
          backdrop-blur-xl
        `}
      >
        <div className="flex items-center justify-between px-[16px] h-[60px] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-[32px] h-[32px] shrink-0 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <NextImage src="/logo.png" alt="SK Technology" width={32} height={32} className="object-contain w-full h-full p-1" />
            </div>
            <AnimatePresence mode="popLayout">
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col justify-center"
                >
                  <span className="text-[15px] font-bold text-fg-primary leading-tight font-inter">SK Tech</span>
                  <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest mt-px">Technician</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-1 relative z-[110]">
            <button 
              onClick={toggleCollapse}
              className="hidden lg:flex w-[28px] h-[28px] rounded-md items-center justify-center text-fg-muted hover:text-fg-primary hover:bg-bg-hover transition-colors"
            >
              <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronLeft className="h-[18px] w-[18px]" />
              </motion.div>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-[36px] h-[36px] flex rounded-md items-center justify-center text-fg-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <X className="h-[20px] w-[20px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 overflow-x-hidden scrollbar-thin scrollbar-thumb-fg-muted hover:scrollbar-thumb-fg-secondary scrollbar-track-transparent">
          {menuGroups.map((group, idx) => (
            <div key={idx} className={`flex flex-col gap-[2px] ${group.hideOnMobile ? 'hidden lg:flex' : 'flex'}`}>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.h4 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="px-[12px] py-[2px] mb-[2px] text-[10px] font-semibold text-fg-muted uppercase tracking-wider font-inter"
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
                        group relative w-full flex items-center h-[44px] px-[12px] rounded-[10px]
                        font-inter text-[14px] transition-all duration-200 ease-in-out
                        ${isActive 
                          ? 'bg-blue-500/10 text-blue-600 font-semibold shadow-sm' 
                          : 'text-fg-secondary hover:bg-bg-hover hover:text-fg-primary font-medium'}
                      `}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-blue-600 rounded-r-full"
                        />
                      )}

                      <div className="relative flex items-center justify-center w-[20px] shrink-0">
                        <item.icon 
                          className={`h-[18px] w-[18px] transition-colors duration-200 ${isActive ? 'text-blue-600 stroke-[2.5px]' : 'group-hover:text-blue-500 stroke-2'}`} 
                        />
                      </div>

                      <AnimatePresence mode="popLayout">
                        {!collapsed && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            className="ml-[12px] truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {!collapsed && (item.path === '/technician/tasks' ? taskCount : item.path === '/technician/notifications' ? notifCount : item.path === '/technician/chat' ? chatCount : item.badge) > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            className="ml-auto bg-blue-600 text-white text-[11px] font-bold px-[6px] py-[1px] rounded-full"
                          >
                            {item.path === '/technician/tasks' ? taskCount : item.path === '/technician/notifications' ? notifCount : item.path === '/technician/chat' ? chatCount : item.badge}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {collapsed && (item.path === '/technician/tasks' ? taskCount : item.path === '/technician/notifications' ? notifCount : item.path === '/technician/chat' ? chatCount : item.badge) > 0 && (
                        <div className="absolute top-[10px] right-[10px] w-[6px] h-[6px] bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-200/50 dark:border-white/5 space-y-2 shrink-0 bg-bg-surface">
          <div className="flex gap-2">
            <Tooltip text="Create New Task" collapsed={collapsed}>
              <button 
                onClick={() => setQuickActionOpen(true)}
                className={`
                  h-[36px] bg-blue-600 hover:bg-blue-700 
                  text-white rounded-[10px] flex items-center justify-center gap-2 shadow-sm
                  transition-all active:scale-95 flex-1
                  ${collapsed ? 'px-0' : 'px-3'}
                `}>
                <Plus className="h-[18px] w-[18px] stroke-[2.5px]" />
                {!collapsed && <span className="font-semibold text-[13px]">Create</span>}
              </button>
            </Tooltip>

            <Tooltip text={isOnline ? 'Go Offline' : 'Go Online'} collapsed={collapsed}>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetchWithAuth('/technician/toggle-online', { method: 'POST', body: JSON.stringify({ isOnline: !isOnline }) });
                    if (res) {
                       setIsOnline(res.isOnline);
                       window.dispatchEvent(new CustomEvent('tech_online_changed', { detail: res.isOnline }));
                    }
                  } catch (err) {}
                }}
                className={`
                  h-[36px] rounded-[10px] flex items-center justify-center transition-all border
                  ${collapsed ? 'w-[36px] px-0' : 'flex-1 px-3'}
                  ${isOnline 
                    ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-500/10 dark:border-green-500/20' 
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/20'}
                `}
              >
                <div className={`w-[8px] h-[8px] rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                {!collapsed && (
                  <span className="ml-[6px] text-[13px] font-bold">{isOnline ? 'Online' : 'Offline'}</span>
                )}
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-[10px] p-[6px] border border-gray-100 dark:border-white/5 relative group">
             <div className="flex items-center gap-[8px] overflow-hidden w-full">
               <div className="w-[32px] h-[32px] rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0 text-[14px]">
                 {user?.name?.charAt(0)?.toUpperCase() || 'T'}
               </div>
               
               {!collapsed && (
                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                   <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Technician'}</p>
                   <button onClick={logout} className="text-[11px] text-gray-500 hover:text-red-500 font-medium text-left flex items-center gap-[4px]">
                     Sign Out
                   </button>
                 </div>
               )}
             </div>

             {!collapsed && (
               <div className="shrink-0 flex items-center ml-2">
                 <ThemeToggle />
               </div>
             )}
             
             {collapsed && (
                <div className="absolute inset-0 bg-red-500/90 rounded-[10px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={logout}>
                   <LogOut className="h-[18px] w-[18px]" />
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
