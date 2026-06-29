"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceCardPrSystems {
  index: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  category?: string;
}

const ServiceCard = ({ index, title, desc, icon: Icon, href, category = "Service" }: ServiceCardPrSystems) => {
  const number = (index + 1).toString().padStart(2, '0');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card/30 backdrop-blur-md rounded-[3rem] border border-white/5 p-12 hover:border-blue-600/50 transition-all duration-500 group relative flex flex-col h-full hover:-translate-y-2 hover-glow"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Icon className="w-32 h-32" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Number Badge */}
        <div className="flex justify-between items-center mb-12">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-600/5 group-hover:shadow-blue-600/20">
            <Icon className="h-7 w-7" />
          </div>
          <span className="text-5xl font-black text-slate-800 group-hover:text-blue-600/20 transition-colors font-mono tracking-tighter">
            {number}
          </span>
        </div>

        <div className="space-y-4 mb-12">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{category}</p>
          <h3 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-blue-500 transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 font-manrope font-medium leading-relaxed">
            {desc}
          </p>
        </div>

        <div className="mt-auto pt-8 border-t border-white/5">
           <Link 
             href={href}
             className="flex items-center justify-between group/link"
           >
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white group-hover/link:text-blue-500 transition-colors">Initialize Protocol</span>
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/link:bg-blue-600 group-hover/link:text-white transition-all">
                <ArrowRight className="h-4 w-4 transform group-hover/link:translate-x-1 transition-transform" />
             </div>
           </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
