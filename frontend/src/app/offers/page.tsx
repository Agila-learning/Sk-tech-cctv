"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tag, Clock, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { fetchWithAuth } from '@/utils/api';

const OffersPage = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    try {
      const data = await fetchWithAuth('/offers');
      setOffers(data);
    } catch (error) {
      console.error('Fetch offers error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // Mock offers if DB is empty for initial visual
  const displayOffers = offers.length > 0 ? offers : [
    {
      id: 1,
      title: 'Professional Service Special',
      description: 'Get 25% OFF on full home security kits including installation.',
      code: 'Professional25',
      discountPercentage: 25,
      expiryDate: '2026-03-31',
      image: '/products/ptz_recon.png',
      category: 'Package Deal'
    },
    {
      id: 2,
      title: 'Infrastructure Upgrade',
      description: 'Exchange your old analog cameras for 15% discount on 4K Technicians.',
      code: 'UPGRADE15',
      discountPercentage: 15,
      expiryDate: '2026-04-15',
      image: '/products/bullet_ultra.png',
      category: 'Trade-in'
    },
    {
        id: 3,
        title: 'Service Subscription Deal',
        description: 'First 3 months of maintenance service free for new business accounts.',
        code: 'FREE3SERVICE',
        discountPercentage: 100,
        expiryDate: '2026-05-01',
        image: '/products/dome_4k.png',
        category: 'Service'
      }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
          <div className="space-y-4">
             <div className="flex items-center space-x-3">
                <div className="w-8 h-1 bg-blue-600"></div>
                <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">Strategic Savings</span>
             </div>
             <h1 className="text-6xl font-black tracking-tighter uppercase">Professional <span className="text-slate-500 italic">Offers</span></h1>
             <p className="text-slate-500 font-medium max-w-md">Access premium infrastructure with architecturally optimized pricing modules.</p>
          </div>
          
          <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center space-x-4 shadow-xl shadow-blue-600/20">
             <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles className="h-6 w-6" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Current Intel</p>
                <p className="text-sm font-bold">{displayOffers.length} Active Modules</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {displayOffers.map((offer, i) => (
            <div key={offer.id || i} className="bg-card rounded-[3rem] border border-border overflow-hidden hover:border-cyan-500/50 transition-all group flex flex-col h-full shadow-2xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                <NextImage src={offer.image} alt={offer.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                <div className="absolute top-6 left-6 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                   {offer.category || 'Limited Time'}
                </div>
              </div>

              <div className="p-10 space-y-6 flex-1 flex flex-col">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight uppercase leading-none group-hover:text-blue-500 transition-colors">{offer.title}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2">{offer.description}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border">
                   <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-cyan-500" />
                      <div>
                         <p className="text-[8px] font-black text-slate-600 uppercase">Ends On</p>
                         <p className="text-xs font-bold">{offer.expiryDate}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Discount</p>
                      <p className="text-xl font-black text-green-500">{offer.discountPercentage}% OFF</p>
                   </div>
                </div>

                <div className="pt-6 mt-auto">
                   <div className="bg-white/5 border border-dashed border-border p-4 rounded-2xl flex items-center justify-between mb-6 group/code">
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-slate-500 uppercase">Professional Code</p>
                         <p className="text-sm font-black tracking-widest text-cyan-500">{offer.code}</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Copy
                      </button>
                   </div>
                   
                   <Link href="/products" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 group/btn shadow-lg shadow-blue-600/10">
                      <span>Apply Intel</span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-32 bg-indigo-600/10 rounded-[4rem] p-16 border border-indigo-600/20 text-center relative overflow-hidden">
           <Zap className="absolute -top-10 -right-10 h-64 w-64 text-indigo-600/5 rotate-45" />
           <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">Institutional Pricing Technician</h2>
              <p className="text-slate-500 font-medium">Looking for enterprise-wide surveillance architecture? Our bulk Service specialists can configure a custom pricing module for your specific strategic needs.</p>
              <Link href="/support" className="inline-flex px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all">
                Connect with Enterprise Technician
              </Link>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OffersPage;
