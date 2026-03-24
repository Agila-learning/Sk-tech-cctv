"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Camera, Search, Heart, Bell } from 'lucide-react';
import NotificationTray from './NotificationTray';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { logout, isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();

  if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
  if (user && (user.role === 'admin' || user.role === 'technician')) return null;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Support', href: '/support' },
    { name: 'Subscriptions', href: '/subscriptions' },
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
    <nav className="fixed top-0 inset-x-0 z-[100] flex justify-center px-4">
      <div className={`transition-all duration-700 w-full max-w-7xl pointer-events-auto rounded-b-[2rem] ${scrolled ? 'glass-navbar py-2 px-8 shadow-2xl border-x border-b border-white/10' : 'bg-transparent py-4 px-4'}`}>
        <div className="flex justify-between items-center gap-6">
          <Link href="/" className="flex items-center space-x-3 group shrink-0">
            <div className="p-2.5 bg-blue-600 rounded-2xl group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-blue-600/30">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter transition-colors hidden sm:inline-block">
              <span className="text-fg-primary">SK</span><span className="text-blue-500">TECH</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className={`flex space-x-1 xl:space-x-4 px-2 py-2 rounded-full transition-all duration-700 ${scrolled ? 'bg-white/5' : ''}`}>
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-[10px] xl:text-[11px] font-black uppercase tracking-widest transition-all relative group px-3 py-1.5 text-fg-secondary hover:text-fg-primary"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-1 bg-blue-600 rounded-full transition-all duration-300 group-hover:w-4"></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            <div className="hidden lg:flex items-center space-x-2 md:space-x-4 mr-2 md:mr-4 pr-2 md:pr-4 border-r border-border-base">
              <Link href="/products?focus=search" className="text-slate-500 dark:text-slate-300 hover:text-blue-500 transition-colors p-2">
                <Search className="h-4 w-4" />
              </Link>
              <Link href="/wishlist" className="transition-colors relative p-2 text-slate-500 dark:text-slate-300 hover:text-red-400">
                <Heart className="h-4 w-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-bg-surface"></span>
              </Link>
              <NotificationTray />
              <ThemeToggle />
              {(!user || user.role === 'customer') && (
                <Link href="/cart" className="p-2 text-slate-500 dark:text-slate-300 hover:text-blue-500 transition-colors relative">
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
            
            {isAuthenticated ? (
              <button 
                onClick={() => logout()}
                className="px-6 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 whitespace-nowrap"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap">
                Login
              </Link>
            )}

            {/* Mobile Toggle inside the bar */}
            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="text-fg-primary p-2 bg-bg-muted rounded-xl border border-border-base transition-colors">
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
            className="lg:hidden glass-pill absolute w-full top-[120%] left-0 p-8 space-y-6 border border-white/10 shadow-2xl"
          >
            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-6 py-4 text-xs font-black uppercase tracking-widest text-fg-muted hover:text-blue-600 hover:bg-bg-muted rounded-2xl transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 flex flex-col gap-4 border-t border-white/5">
              {isAuthenticated ? (
                <button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20"
                >
                  SECURE SIGN OUT
                </button>
              ) : (
                <>
                  <Link href="/login" className="w-full py-5 bg-blue-600 text-white text-center rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20">Sign In</Link>
                  <Link href="/register" className="w-full py-5 bg-bg-muted border border-border-base text-fg-primary text-center rounded-2xl font-black text-[10px] uppercase tracking-widest">Create Account</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
