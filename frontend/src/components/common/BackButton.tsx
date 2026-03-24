"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface BackButtonProps {
  className?: string;
}

const BackButton = ({ className = "" }: BackButtonProps) => {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.back()}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`group flex items-center gap-2 px-6 py-3 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-surface transition-all shadow-lg hover:shadow-blue-500/10 ${className}`}
    >
      <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      <span>Navigate Back</span>
    </motion.button>
  );
};

export default BackButton;
