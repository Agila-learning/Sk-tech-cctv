"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Home, Package, Hammer, ShoppingBag, Bell, User, LogOut, Sun, Moon, ChevronDown, Settings, Shield, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../layout/ThemeToggle';
import { getImageUrl } from '@/utils/api';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Services', href: '/services', icon: Hammer },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  ];

  return (
    <nav className="hidden lg:flex sticky top-0 z-40 w-full h-20 glass-navbar px-8 items-center justify-between">
      {/* Left — Nav links */}
      <div className="flex items-center space-x-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`
                flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest
                transition-all duration-300 group relative
                ${isActive
                  ? 'bg-gradient-to-r from-[#1E3A8A]/15 to-[#14B8A6]/15 text-[#1E3A8A] dark:text-[#60a5fa]'
                  : 'text-[#475569] dark:text-slate-300 hover:text-[#1E3A8A] dark:hover:text-[#60a5fa] hover:bg-[#1E3A8A]/08'}
              `}
            >
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6]" />
              )}
              <link.icon className={`h-3.5 w-3.5 transition-all duration-300 group-hover:scale-110 ${isActive ? 'text-[#1E3A8A] dark:text-[#60a5fa]' : ''}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Right — Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-6 bg-[#1E3A8A]/10 dark:bg-white/10" />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="navbar-notif-btn"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            className="relative p-2.5 rounded-xl hover:bg-[#1E3A8A]/08 dark:hover:bg-white/08 transition-all duration-300 group"
          >
            <Bell className="h-5 w-5 text-[#475569] dark:text-slate-300 group-hover:text-[#1E3A8A] dark:group-hover:text-[#60a5fa] transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f172a] animate-pulse" />
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 glass-card rounded-2xl border border-[#1E3A8A]/12 dark:border-white/08 shadow-2xl shadow-[#1E3A8A]/10 dark:shadow-black/40 z-50 p-5 animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-widest">Notifications</h4>
                <span className="text-[10px] font-bold text-[#1E3A8A] dark:text-[#60a5fa] cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { msg: 'New booking from Ramesh Kumar', time: '2m ago', dot: 'bg-blue-500' },
                  { msg: 'Technician Kumar assigned to job #A21', time: '15m ago', dot: 'bg-teal-500' },
                  { msg: 'Payment received ₹4,200', time: '1h ago', dot: 'bg-green-500' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-[#1E3A8A]/05 dark:hover:bg-white/05 transition-all cursor-pointer group">
                    <div className={`mt-1.5 w-2 h-2 rounded-full ${n.dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#1e293b] dark:text-slate-200 leading-snug">{n.msg}</p>
                      <p className="text-[9px] text-[#64748b] dark:text-slate-500 mt-0.5 uppercase tracking-wider">{n.time}</p>
                    </div>
                  </div>
                ))}
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
              <p className="text-[11px] font-black text-[#0f172a] dark:text-white uppercase tracking-tight leading-none">{user?.name || 'Admin'}</p>
              <p className="text-[9px] font-bold text-[#1E3A8A] dark:text-[#60a5fa] uppercase tracking-widest mt-0.5">{user?.role || 'Super Admin'}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#64748b] transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 glass-card rounded-2xl border border-[#1E3A8A]/12 dark:border-white/08 shadow-2xl shadow-[#1E3A8A]/10 dark:shadow-black/40 z-50 p-2 animate-slide-up">
              <Link href="/admin/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#1E3A8A]/08 dark:hover:bg-white/08 transition-all group">
                <Settings className="h-4 w-4 text-[#64748b] group-hover:text-[#1E3A8A] dark:group-hover:text-[#60a5fa]" />
                <span className="text-xs font-bold text-[#334155] dark:text-slate-200 group-hover:text-[#1E3A8A] dark:group-hover:text-[#60a5fa]">Settings</span>
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
