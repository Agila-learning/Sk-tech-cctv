"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Camera, Heart, Bell } from 'lucide-react';
import NotificationTray from './NotificationTray';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import AnimatedLogo from './AnimatedLogo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { logout, isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
    return (
      <nav className="fixed top-0 inset-x-0 z-[100] flex justify-center">
        <div className="bg-transparent py-4 px-6 w-full max-w-[1600px]">
           <div className="flex justify-between items-center opacity-0">Skeleton...</div>
        </div>
      </nav>
    );
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
  // Removed role check to allow staff to see navbar on public pages

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Support', href: '/support' },

  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Dashboard', href: '/admin' });
  } else if (user?.role === 'technician') {
    navLinks.push({ name: 'Dashboard', href: '/technician' });
  } else if (user) {
    navLinks.push({ name: 'Dashboard', href: '/customer' });
  } else {
    navLinks.push({ name: 'Checkout', href: '/cart' });
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-[100]">
      <div className={`transition-all duration-700 w-full pointer-events-auto ${scrolled ? 'bg-white/70 dark:bg-[#0B1220]/70 backdrop-blur-2xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)] border-b border-black/5 dark:border-white/5 py-3' : 'bg-transparent py-5'} px-4 sm:px-8`}>
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-6">
          <AnimatedLogo forceWhite={pathname === '/' && !scrolled} />

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className={`flex space-x-2 xl:space-x-6 px-4 py-2 rounded-full transition-all duration-700 ${scrolled ? 'bg-black/5 dark:bg-white/5' : ''}`}>
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`text-[11px] xl:text-xs font-bold uppercase tracking-widest transition-all relative group px-3 py-1.5 ${pathname === '/' && !scrolled ? 'text-white/90 hover:text-white' : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'}`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100 ${pathname === '/' && !scrolled ? 'bg-white' : 'bg-blue-600'}`}></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            <div className="hidden lg:flex items-center space-x-2 md:space-x-4 mr-2 md:mr-4 pr-2 md:pr-4 border-r border-border-base">
              <Link href="/wishlist" className={`transition-colors relative p-2 ${pathname === '/' && !scrolled ? 'text-white/80 hover:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-red-400'}`}>
                <Heart className="h-4 w-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-bg-surface"></span>
              </Link>
              <NotificationTray />
              <ThemeToggle />
              {(!user || user.role === 'customer') && (
                <Link href="/cart" className={`p-2 transition-colors relative ${pathname === '/' && !scrolled ? 'text-white/80 hover:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-blue-500'}`}>
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
            
            <div className="hidden lg:flex items-center space-x-2 md:space-x-4">
              {isAuthenticated ? (
                <button 
                  onClick={() => logout()}
                  className="px-6 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 whitespace-nowrap"
                >
                  Sign Out
                </button>
              ) : (
                <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap animate-vibrant-text">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center space-x-3">
              <ThemeToggle />
              <button onClick={() => setIsOpen(!isOpen)} className={`p-2.5 rounded-xl border transition-colors ${pathname === '/' && !scrolled ? 'text-white bg-white/10 border-white/20 hover:bg-white/20' : 'text-fg-primary bg-bg-muted border-border-base'}`}>
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="lg:hidden absolute w-[calc(100%-2rem)] max-w-sm top-[110%] left-1/2 -translate-x-1/2 bg-bg-surface p-6 space-y-6 border border-border-strong rounded-3xl shadow-2xl"
          >
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-6 py-4 text-xs font-black uppercase tracking-widest text-fg-primary hover:text-blue-600 hover:bg-bg-muted rounded-2xl transition-all text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="pt-4 flex flex-col gap-4 border-t border-border-subtle">
              {isAuthenticated ? (
                <button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                >
                  SIGN OUT
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setIsOpen(false)} className="w-full py-4 bg-blue-600 text-white text-center rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Sign In</Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="w-full py-4 bg-bg-muted border border-border-base text-fg-primary text-center rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Create Account</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
