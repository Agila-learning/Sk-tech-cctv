"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, FileText, Globe, Bell, UserCheck, ShieldAlert } from 'lucide-react';

const PrivacyPage = () => {
  const policies = [
    {
      title: "Data Encryption",
      description: "All sensitive data, including login credentials and personal information, is encrypted using industry-standard protocols before storage or transmission.",
      icon: Lock
    },
    {
      title: "Privacy Control",
      description: "You have complete control over your privacy settings. We never share your personal data with third parties without your explicit consent.",
      icon: Eye
    },
    {
      title: "Security Monitoring",
      description: "Our systems are continuously monitored for potential security threats to ensure the integrity of your information and video feeds.",
      icon: Shield
    },
    {
      title: "Information Transparency",
      description: "We believe in complete transparency. You can request a summary of the data we hold about you at any time through our support portal.",
      icon: FileText
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
            Digital Safety
          </motion.div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">Privacy <span className="text-fg-secondary italic opacity-70">Policy</span></h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Your trust is our most important asset. We are committed to protecting your privacy and securing your data.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {policies.map((policy, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-12 rounded-[3.5rem] border border-white/5 space-y-6"
            >
              <div className="p-4 bg-blue-600/10 rounded-2xl w-fit text-blue-500">
                <policy.icon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{policy.title}</h3>
              <p className="text-fg-secondary font-medium leading-relaxed">{policy.description}</p>
            </motion.div>
          ))}
        </section>

        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Information Tracking</h2>
            <p className="text-fg-secondary max-w-xl mx-auto font-medium">To provide our services, we collect necessary operational data that helps improve your security experience.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Login History', desc: 'Secure access logging', icon: UserCheck },
              { label: 'System Logs', desc: 'Hardware performance data', icon: Bell },
              { label: 'Location Hub', desc: 'Service area optimization', icon: Globe },
              { label: 'Threat Data', desc: 'Global security analysis', icon: ShieldAlert }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-center space-y-4 hover:bg-blue-600/5 transition-all">
                <div className="p-3 bg-blue-600/10 rounded-xl w-fit mx-auto text-blue-500">
                  <item.icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-fg-primary uppercase tracking-widest">{item.label}</h4>
                <p className="text-[10px] text-fg-secondary font-bold uppercase tracking-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
