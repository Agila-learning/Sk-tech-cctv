"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Search, LayoutDashboard, Menu, X, Users, Settings, Wrench, FileText, FileSearch, LogOut, Home, Package, Hammer, ShoppingBag, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import AnimatedSearchBar from '@/components/common/AnimatedSearchBar';
import { useSocket } from '@/context/SocketContext';
import { getImageUrl, fetchWithAuth } from '@/utils/api';
import { useWebPush } from '@/hooks/useWebPush';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const { socket } = useSocket();
  const { isSupported, permission, subscribeToWebPush } = useWebPush();
  
  // TV Mode state
  const [tvMode, setTvMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setTvMode(localStorage.getItem('sk_tv_mode') === 'true');
    const updateTime = () => {
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    
    const handleStorageChange = (e: any) => {
      if (e.type === 'tvModeChange' || e.key === 'sk_tv_mode') {
        setTvMode(localStorage.getItem('sk_tv_mode') === 'true');
        updateTime();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tvModeChange', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tvModeChange', handleStorageChange);
    };
  }, []);

  const toggleTvMode = () => {
    const newVal = !tvMode;
    setTvMode(newVal);
    localStorage.setItem('sk_tv_mode', String(newVal));
    window.dispatchEvent(new Event('tvModeChange'));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await fetchWithAuth('/notifications');
        setNotifications(data || []);
      } catch (err: any) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    if (user?.role === 'admin' || user?.role === 'sub-admin') {
       fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif: any) => {
      setNotifications(prev => [{
        _id: notif._id || Math.random().toString(),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: false,
        createdAt: new Date().toISOString()
      }, ...prev]);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Services', href: '/services', icon: Hammer },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  ];

  return (
    <nav className="hidden lg:flex sticky top-4 z-40 w-[calc(100%-4rem)] mx-auto h-16 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-full px-6 items-center justify-between shadow-2xl shadow-blue-500/5 transition-all">
      {/* Left — Nav links */}
      <div className="flex items-center space-x-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`
                flex items-center space-x-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest
                transition-all duration-300 group relative
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-fg-secondary hover:text-fg-primary hover:bg-black/5 dark:hover:bg-white/5'}
              `}
            >
              <link.icon className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

        {/* Center — Global Search */}
      <div className="flex-1 max-w-md min-w-[200px] mx-8 relative hidden xl:block">
        <AnimatedSearchBar 
          onSearch={(val) => {
            if(val.trim()) router.push(`/admin/search?q=${encodeURIComponent(val)}`);
          }} 
          suggestions={['Latest Warranty Claims', 'Overdue AMC', 'Unassigned Tickets', 'Pending Technician Notes']} 
          onSuggestionClick={(val) => {
            if(val.trim()) router.push(`/admin/search?q=${encodeURIComponent(val)}`);
          }}
        />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center space-x-2">
        {/* TV Mode Toggle */}
        <div className="hidden lg:flex items-center gap-3 bg-bg-muted/50 p-1.5 pr-3 rounded-full border border-border-base transition-all">
          <button 
            onClick={toggleTvMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${tvMode ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/20 ring-offset-1 ring-offset-bg-surface' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tvMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <div className="flex flex-col">
            <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${tvMode ? 'text-indigo-500' : 'text-fg-muted'}`}>TV Mode</span>
            {tvMode && <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1 leading-none animate-pulse">Live: {lastUpdated}</span>}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border-base mx-2" />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="navbar-notif-btn"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            className="relative p-2.5 rounded-xl hover:bg-[#1E3A8A]/08 dark:hover:bg-white/08 transition-all duration-300 group"
          >
            <Bell className="h-5 w-5 text-fg-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            {notifications.some(n => !n.isRead) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f172a] animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 glass-card rounded-2xl border border-[#1E3A8A]/12 dark:border-white/08 shadow-2xl shadow-[#1E3A8A]/10 dark:shadow-black/40 z-50 p-5 animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-fg-primary uppercase tracking-widest">Notifications</h4>
                <span 
                   className="text-[10px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                   onClick={async () => {
                     setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                     try {
                       await fetchWithAuth('/notifications/mark-all-read', { method: 'PATCH' });
                     } catch (e: any) {
                       // Revert or ignore on error, usually ignore is fine for notifications
                     }
                   }}
                >
                   Mark all read
                </span>
              </div>
              
              {isSupported && permission !== 'granted' && permission !== 'denied' && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Desktop Alerts</p>
                    <p className="text-[9px] text-fg-muted mt-0.5 leading-tight">Get notified even when closed.</p>
                  </div>
                  <button onClick={subscribeToWebPush} className="px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-2">
                    Enable
                  </button>
                </div>
              )}

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n._id} onClick={async () => {
                      if (!n.isRead) {
                          setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, isRead: true } : notif));
                          try {
                              await fetchWithAuth(`/notifications/${n._id}/read`, { method: 'PATCH' });
                          } catch (e: any) {}
                      }
                      setNotifOpen(false);
                      if (n.type === 'daily_report_submitted' || n.message.includes('COMPLETED')) {
                          router.push('/admin/notes');
                      } else if (n.orderId || n.message.includes('Order')) {
                          router.push('/admin/orders');
                      } else {
                          router.push('/admin/notifications');
                      }
                  }} className={`flex items-start space-x-3 p-3 rounded-xl transition-all cursor-pointer group ${n.isRead ? 'opacity-60 hover:bg-[#1E3A8A]/05 dark:hover:bg-white/05' : 'bg-blue-500/5 hover:bg-blue-500/10'}`}>
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-400' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-fg-primary leading-snug">{n.message}</p>
                      <p className="text-[9px] text-fg-muted mt-0.5 uppercase tracking-wider">
                         {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-xs text-center text-fg-muted py-4">No alerts active.</p>
                )}
              </div>
              <Link
                href="/admin/notifications"
                onClick={() => setNotifOpen(false)}
                className="mt-4 w-full flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-[#1E3A8A]/30"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="navbar-profile-btn"
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
            className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#1E3A8A]/06 dark:hover:bg-white/06 transition-all duration-300 group"
          >
            <div className="w-9 h-9 overflow-hidden rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center text-white text-xs font-black shadow-lg shadow-[#1E3A8A]/25 border border-white/20">
              {user?.profilePic ? (
                <img src={getImageUrl(user.profilePic)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'A'
              )}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black text-fg-primary uppercase tracking-tight leading-none">{user?.name || 'Admin'}</p>
              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">{user?.role || 'Super Admin'}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#64748b] transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 glass-card rounded-2xl border border-[#1E3A8A]/12 dark:border-white/08 shadow-2xl shadow-[#1E3A8A]/10 dark:shadow-black/40 z-50 p-2 animate-slide-up">
              <Link href="/admin/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#1E3A8A]/08 dark:hover:bg-white/08 transition-all group">
                <Settings className="h-4 w-4 text-fg-muted group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                <span className="text-xs font-bold text-fg-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400">Settings</span>
              </Link>
              <Link href="/admin/diagnostics" onClick={() => setProfileOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#1E3A8A]/08 dark:hover:bg-white/08 transition-all group">
                <Shield className="h-4 w-4 text-[#64748b] group-hover:text-[#1E3A8A] dark:group-hover:text-[#60a5fa]" />
                <span className="text-xs font-bold text-[#334155] dark:text-slate-200 group-hover:text-[#1E3A8A] dark:group-hover:text-[#60a5fa]">System Health</span>
              </Link>
              <div className="h-px bg-[#1E3A8A]/08 dark:bg-white/06 my-1.5" />
              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-red-500">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
