"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, FileCheck, CheckCircle, Globe, Verified, Shield, Building } from 'lucide-react';

const CompliancePage = () => {
  const certifications = [
    {
      title: "ISO 27001 Certified",
      description: "Our information security management systems are audited and certified to meet global ISO standards for data integrity and protection.",
      icon: ShieldCheck
    },
    {
      title: "SOC2 Type II Compliant",
      description: "SK TECHNOLOGY maintains rigorous internal controls for managing customer data based on the five trust service principles.",
      icon: Award
    },
    {
      title: "GDPR Alignment",
      description: "We strictly adhere to General Data Protection Regulation (GDPR) standards for our global operations and customer data handling.",
      icon: Globe
    },
    {
      title: "Industry Standards",
      description: "Our surveillance hardware and software meet all regional and international regulatory requirements for security equipment.",
      icon: FileCheck
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <section className="text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-500"
          >
            Verified Trust
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">Professional <span className="text-fg-secondary italic opacity-70">Compliance</span></h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            We maintain the highest levels of security and operational certifications to ensure your protection.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {certifications.map((cert, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-12 rounded-[3.5rem] border border-white/5 space-y-6"
            >
              <div className="p-4 bg-blue-600/10 rounded-2xl w-fit text-blue-500">
                <cert.icon className="h-8 w-8" />
              </div>
               <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{cert.title}</h3>
               <p className="text-fg-secondary font-medium leading-relaxed">{cert.description}</p>
            </motion.div>
          ))}
        </section>

        <section className="glass-card p-20 rounded-[4rem] border border-white/5 relative overflow-hidden group">
           <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
               <div className="space-y-8">
                  <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Regulatory Framework</h2>
                  <p className="text-fg-secondary font-medium leading-relaxed">
                    Our compliance team ensures that all SK TECHNOLOGY products and service protocols are updated in real-time to match evolving international security laws and technical standards.
                  </p>
                 <div className="flex flex-wrap gap-4">
                    {['PSARA Compliant', 'CE Certified', 'FCC Approved', 'RoHS Ready'].map(item => (
                      <div key={item} className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                         <CheckCircle className="h-3 w-3 text-green-500" />
                         <span>{item}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 {[
                   { label: 'Security Audits', count: 'Weekly', icon: Shield },
                   { label: 'Certifications', count: '12+', icon: Verified },
                   { label: 'Law Alignment', count: 'Global', icon: Building },
                   { label: 'Data Safety', count: 'Elite', icon: ShieldCheck }
                 ].map((stat, i) => (
                   <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center space-y-2">
                       <div className="p-3 bg-blue-600/10 rounded-xl w-fit mx-auto text-blue-500 mb-4">
                         <stat.icon className="h-5 w-5" />
                       </div>
                       <p className="text-2xl font-black text-fg-primary">{stat.count}</p>
                       <p className="text-[10px] font-black text-fg-secondary uppercase tracking-widest leading-none">{stat.label}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CompliancePage;
