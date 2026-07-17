"use client";
import React from 'react';
import { ExternalLink, Home, Shield, Box, FileText, Phone, Settings, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function TechnicianLandingPages() {
  const router = useRouter();

  const landingPages = [
    { name: 'Main Home Page', path: '/', icon: Home, desc: 'Public SK Technology Website', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Products Catalog', path: '/products', icon: Box, desc: 'View all products', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Services', path: '/services', icon: Settings, desc: 'Available services list', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Installation Plans', path: '/installation', icon: Activity, desc: 'CCTV Installation details', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Warranty Claim', path: '/warranty', icon: Shield, desc: 'Warranty registration', color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Contact Us', path: '/contact', icon: Phone, desc: 'Public contact info', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { name: 'Terms & Conditions', path: '/privacy', icon: FileText, desc: 'Policies and privacy', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <div className="p-4 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-fg-primary uppercase tracking-tighter">
            Landing <span className="text-blue-600">Pages</span>
          </h1>
          <p className="text-fg-muted font-medium mt-2 max-w-xl">
            Quick links to access public pages of the website to assist customers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {landingPages.map((page, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => window.open(page.path, '_blank')}
            className="group p-6 bg-bg-surface border border-border-base rounded-[2rem] hover:border-blue-500 transition-all cursor-pointer shadow-lg shadow-black/5"
          >
            <div className="flex items-start justify-between">
              <div className={`p-4 rounded-2xl ${page.bg}`}>
                <page.icon className={`h-8 w-8 ${page.color}`} />
              </div>
              <ExternalLink className="h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-all" />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight">{page.name}</h3>
              <p className="text-xs text-fg-muted mt-2 font-medium">{page.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
