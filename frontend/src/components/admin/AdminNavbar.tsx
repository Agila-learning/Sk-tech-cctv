"use client";
import React from 'react';
import Link from 'next/link';
import { Home, Package, Hammer, ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../layout/ThemeToggle';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Services', href: '/services', icon: Hammer },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  ];

  return (
    <nav className="hidden lg:flex sticky top-0 z-40 w-full h-20 bg-bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border-base px-10 items-center justify-between">
      <div className="flex items-center space-x-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-all group ${isActive ? 'text-primary-blue' : 'text-fg-primary dark:text-slate-300 hover:text-primary-blue'}`}
            >
              <link.icon className={`h-4 w-4 ${isActive ? 'text-primary-blue' : 'text-fg-dim dark:text-slate-400 group-hover:text-primary-blue transition-colors'}`} />
              <span>{link.name}</span>
              {isActive && <span className="w-1 h-1 bg-primary-blue rounded-full"></span>}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center space-x-6">
        <ThemeToggle />
        <div className="h-8 w-px bg-border-base"></div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-black text-fg-primary uppercase tracking-tighter leading-none">{user?.name || 'Admin'}</p>
            <p className="text-[9px] font-bold text-fg-dim uppercase tracking-widest mt-1">{user?.role || 'Super Admin'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-blue to-primary-teal flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
            <User className="h-5 w-5" />
          </div>
        </div>

        <button 
          onClick={() => logout()}
          className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 group"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
