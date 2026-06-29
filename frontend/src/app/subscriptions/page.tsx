"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, Settings, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const SubscriptionPage = () => {
  const plans = [
    {
      id: 'monthly',
      name: 'Essential Maintenance',
      price: '₹499',
      period: '/month',
      description: 'Monthly preventive maintenance and priority support for peace of mind.',
      features: [
        '1 Monthly Physical Inspection',
        'Lens Cleaning & Alignment Check',
        '24/7 Priority Phone Support',
        '10% Off on Replacement Parts'
      ],
      popular: false,
      buttonText: 'Start Monthly Plan'
    },
    {
      id: 'yearly',
      name: 'Comprehensive Shield',
      price: '₹4,999',
      period: '/year',
      description: 'Complete annual coverage with maximum savings and premium benefits.',
      features: [
        '12 Monthly Physical Inspections',
        'Bi-Annual Firmware Updates',
        'Free Replacement Devices (if under warranty)',
        'Zero Labor Charges on Repairs',
        '24/7 Priority Tech Dispatch'
      ],
      popular: true,
      buttonText: 'Get Annual Shield'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500"
          >
             <Settings className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Maintenance Plans</span>
          </motion.div>
          <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]"
          >
            Protect Your <span className="text-muted-foreground/30 italic">Investment</span>
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="text-muted-foreground text-lg font-medium"
          >
            Ensure your security systems operate at peak performance 24/7 with our professional maintenance and support plans.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 + 0.3 }}
              key={plan.id}
              className={`relative rounded-[3rem] p-10 md:p-12 border ${plan.popular ? 'bg-blue-600/5 border-blue-600 shadow-2xl shadow-blue-600/20' : 'bg-card border-border'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-10 -translate-y-1/2">
                   <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-blue-600/30 flex items-center space-x-2">
                      <Zap className="w-3 h-3" />
                      <span>Most Popular</span>
                   </div>
                </div>
              )}

              <div className="space-y-6 mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed min-h-[40px]">{plan.description}</p>
                <div className="flex items-baseline space-x-2">
                   <span className="text-5xl font-black tracking-tighter text-foreground">{plan.price}</span>
                   <span className="text-muted-foreground font-bold">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-5 mb-12">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-4">
                     <div className="mt-1 w-5 h-5 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                     </div>
                     <span className="text-sm font-medium text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => alert(`Starting enrollment for: ${plan.name}. Our team will contact you for payment details.`)}
                className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30' : 'bg-muted hover:bg-slate-200 text-foreground'}`}
              >
                 {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="mt-24 text-center"
        >
           <p className="text-muted-foreground font-medium mb-6">Need a custom enterprise maintenance plan?</p>
           <Link href="/contact" className="text-blue-600 font-black uppercase tracking-widest hover:underline text-sm">
             Contact Sales Team
           </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionPage;
