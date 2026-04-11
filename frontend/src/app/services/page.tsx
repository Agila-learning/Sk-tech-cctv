"use client";
import React from 'react';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Hammer, ShieldCheck, Zap, Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const ServicesPage = () => {
  const services = [
    {
      title: 'Expert Consultation',
      desc: 'Strategic analysis of your sector to optimize node placement and coverage density.',
      icon: ShieldCheck,
      category: 'Intelligence',
      features: ['Site Survey', 'Security Audit', 'Technical Proposal']
    },
    {
      title: 'Professional Installation',
      desc: 'Seamless physical integration of 4K Technicians with high-speed uplink calibration.',
      icon: Hammer,
      category: 'Field Op',
      features: ['Wiring & Mounting', 'Configuration', 'Testing']
    },
    {
      title: 'Maintenance & Support',
      desc: 'Predictive maintenance protocols and AMC subscriptions for zero-downtime systems.',
      icon: Zap,
      category: 'Sustenance',
      features: ['24/7 Monitoring', 'Hardware Updates', 'Priority Support']
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-bg-muted to-background border-b border-border-base">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-fg-primary tracking-tighter uppercase leading-none">
              Strategic <span className="text-primary-blue">Services</span>
            </h1>
            <p className="text-lg md:text-xl text-fg-muted font-medium max-w-2xl font-manrope">
              We provide enterprise-grade surveillance solutions engineered for maximum security and operational efficiency.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div key={i} className="glass-card p-10 rounded-[3rem] border border-border-base hover:border-primary-blue/30 transition-all group flex flex-col justify-between h-full bg-white shadow-sm hover:shadow-xl">
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 bg-bg-muted rounded-2xl flex items-center justify-center text-primary-blue border border-border-subtle group-hover:scale-110 transition-transform">
                      <service.icon className="h-8 w-8" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue py-1 px-3 bg-primary-blue/10 rounded-full border border-primary-blue/20">
                      {service.category}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tight">{service.title}</h3>
                    <p className="text-fg-muted font-medium leading-relaxed">{service.desc}</p>
                  </div>
                  <ul className="space-y-3 pt-4">
                    {service.features.map((feature, j) => (
                      <li key={j} className="flex items-center space-x-3 text-sm font-bold text-fg-secondary">
                        <CheckCircle2 className="h-4 w-4 text-primary-teal" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/contact" className="mt-12 flex items-center justify-between p-5 bg-bg-muted rounded-2xl group/btn hover:bg-primary-blue hover:text-white transition-all">
                  <span className="text-xs font-black uppercase tracking-widest italic">Request Access</span>
                  <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 bg-bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-fg-primary uppercase tracking-tight">Ready to Secure Your <span className="text-primary-blue">Infrastructure?</span></h2>
            <p className="text-fg-muted font-medium text-lg">Connect with our strategic advisors for a comprehensive vulnerability assessment.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/contact" className="px-12 py-5 bg-primary-blue text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-blue/20 hover:scale-105 active:scale-95 transition-all">
              Initialize Protocol
            </Link>
            <Link href="/products" className="px-12 py-5 bg-white text-primary-blue border border-primary-blue/20 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-blue/5 transition-all">
              Inventory Access
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ServicesPage;
