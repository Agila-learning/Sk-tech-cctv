"use client";
import React, { useState } from 'react';
import { MessageSquare, Users, QrCode, Plus, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const QuickActionsFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Only show on dashboard pages
  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/technician');
  if (!isDashboard) return null;

  const role = pathname?.startsWith('/admin') ? 'admin' : 'technician';

  const actions = [
    {
      icon: MessageSquare,
      label: 'Chat',
      color: 'bg-blue-500',
      onClick: () => {
        router.push(`/${role}/chat`);
        setIsOpen(false);
      }
    },
    {
      icon: Users,
      label: 'Customers',
      color: 'bg-green-500',
      onClick: () => {
        router.push(`/${role}/customer-contact`);
        setIsOpen(false);
      }
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[99]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="flex flex-col gap-3 mb-4 items-end"
          >
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={action.onClick}
                className="group flex items-center gap-3"
              >
                <span className="bg-bg-surface border border-border-base text-fg-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
                <div className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg shadow-${action.color.split('-')[1]}-500/30 hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 transition-transform ${isOpen ? 'rotate-45 bg-red-500 shadow-red-500/30' : 'hover:scale-110'}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default QuickActionsFAB;
