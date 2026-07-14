"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
  return <Footer />;
}
