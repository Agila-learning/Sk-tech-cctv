"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Wallet, Calendar, Plus, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickActionModal = ({ isOpen, onClose }: QuickActionModalProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Manual Task / Lead',
      description: 'Create a new offline service task',
      icon: Briefcase,
      color: 'blue',
      route: '/technician/tasks?create=true'
    },
    {
      title: 'Log Expense',
      description: 'Record a new business expense',
      icon: Wallet,
      color: 'purple',
      route: '/technician/expenses'
    },
    {
      title: 'Request Leave',
      description: 'Submit an absence or leave request',
      icon: Calendar,
      color: 'orange',
      route: '/technician/leaves'
    },
    {
      title: 'Internal Notes',
      description: 'Jot down a quick team note',
      icon: NotebookPen,
      color: 'emerald',
      route: '/technician/notes'
    },
    {
      title: 'Create Order/Bill',
      description: 'Generate a new invoice or order',
      icon: Plus,
      color: 'pink',
      route: '/technician/billing'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-bg-surface border border-border-base rounded-[2rem] shadow-2xl p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-fg-primary tracking-tight flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-500" /> Quick Action
            </h3>
            <button onClick={onClose} className="p-2 bg-bg-muted rounded-full text-fg-muted hover:text-fg-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onClose();
                    router.push(action.route);
                  }}
                  className={`w-full flex items-center gap-5 p-5 rounded-2xl border border-border-subtle hover:border-${action.color}-500/30 bg-bg-muted/50 hover:bg-${action.color}-500/5 transition-all group text-left`}
                >
                  <div className={`p-4 rounded-xl bg-${action.color}-500/10 text-${action.color}-500 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-fg-primary text-base">{action.title}</h4>
                    <p className="text-xs text-fg-muted font-medium mt-1">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickActionModal;
