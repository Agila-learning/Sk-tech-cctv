"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Server, Shield, Cpu, Globe, Lock, Workflow, Database, Cloud, Zap } from 'lucide-react';

const ArchitecturePage = () => {
  const specs = [
    {
      title: "Hybrid Cloud Infrastructure",
      description: "Our systems utilize a seamless hybrid cloud architecture, combining local edge processing with secure cloud backups for 99.9% availability.",
      icon: Cloud
    },
    {
      title: "End-to-End Encryption",
      description: "Every byte of video and telemetry data is encrypted using AES-256 standards from the source to your viewing device.",
      icon: Lock
    },
    {
      title: "Real-time AI Processing",
      description: "Dedicated neural processors at the edge provide instant motion detection and facial recognition without compromising bandwidth.",
      icon: Cpu
    },
    {
      title: "Scalable Data Pipeline",
      description: "Our backend handles thousands of concurrent streams with automated load balancing and intelligent storage management.",
      icon: Workflow
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <section className="text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-500"
          >
            Engineering Excellence
          </motion.div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">System <span className="text-fg-secondary italic opacity-70">Technology</span></h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            The foundation of SK TECHNOLOGY's reliability lies in our sophisticated security architecture.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {specs.map((spec, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-12 rounded-[3.5rem] border border-white/5 space-y-6"
            >
              <div className="p-4 bg-blue-600/10 rounded-2xl w-fit text-blue-500">
                <spec.icon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{spec.title}</h3>
              <p className="text-fg-secondary font-medium leading-relaxed">{spec.description}</p>
            </motion.div>
          ))}
        </section>

        <section className="glass-card p-16 rounded-[4rem] border border-white/5 relative overflow-hidden text-center space-y-12">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]"></div>
           <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Global Service Grid</h2>
              <p className="text-fg-secondary max-w-2xl mx-auto font-medium leading-relaxed">
                Our distributed network of data centers ensures low-latency access and redundant failover protection across all operational zones.
              </p>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Latency', value: '<50ms', icon: Zap },
                { label: 'Uptime', value: '99.9%', icon: Shield },
                { label: 'Encryption', value: 'AES-256', icon: Lock },
                { label: 'Compliance', value: 'SOC2', icon: Globe }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                   <p className="text-3xl font-black text-blue-500">{stat.value}</p>
                   <p className="text-[10px] font-black text-fg-secondary uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ArchitecturePage;
