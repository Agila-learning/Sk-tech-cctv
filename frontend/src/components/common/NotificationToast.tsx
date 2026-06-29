"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Zap } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string; titleColor: string }> = {
  technician_assigned: {
    bg: 'bg-blue-950/90',
    border: 'border-blue-500/40',
    icon: Zap,
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-300',
  },
  installation_update: {
    bg: 'bg-green-950/90',
    border: 'border-green-500/40',
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    titleColor: 'text-green-300',
  },
  order_update: {
    bg: 'bg-indigo-950/90',
    border: 'border-indigo-500/40',
    icon: Bell,
    iconColor: 'text-indigo-400',
    titleColor: 'text-indigo-300',
  },
  new_order: {
    bg: 'bg-violet-950/90',
    border: 'border-violet-500/40',
    icon: Bell,
    iconColor: 'text-violet-400',
    titleColor: 'text-violet-300',
  },
  default: {
    bg: 'bg-slate-900/90',
    border: 'border-slate-500/40',
    icon: Info,
    iconColor: 'text-slate-400',
    titleColor: 'text-slate-300',
  },
};

export const NotificationToast: React.FC = () => {
  const { socket } = useSocket();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((data: any) => {
    const toast: Toast = {
      id: `${Date.now()}-${Math.random()}`,
      title: data.title || 'Notification',
      message: data.message || '',
      type: data.type || 'default',
      priority: data.priority,
    };
    setToasts(prev => [toast, ...prev].slice(0, 5)); // max 5 toasts

    // Auto-dismiss after 6s (or 10s for high priority)
    const delay = data.priority === 'high' || data.priority === 'urgent' ? 10000 : 6000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, delay);
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      addToast(data);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, addToast]);

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = TYPE_STYLES[toast.type] || TYPE_STYLES.default;
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 120, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`pointer-events-auto w-[340px] max-w-[90vw] ${style.bg} backdrop-blur-xl border ${style.border} rounded-2xl shadow-2xl overflow-hidden`}
            >
              {/* Priority bar */}
              {toast.priority === 'high' || toast.priority === 'urgent' ? (
                <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />
              ) : (
                <div className={`h-0.5 w-full bg-gradient-to-r ${
                  toast.type === 'technician_assigned' ? 'from-blue-500 to-indigo-500' :
                  toast.type === 'installation_update' ? 'from-green-500 to-emerald-500' :
                  'from-violet-500 to-purple-500'
                }`} />
              )}
              <div className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl ${style.bg.replace('/90', '/60')} border ${style.border}`}>
                  <Icon className={`h-4 w-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-widest ${style.titleColor} mb-0.5`}>
                    {toast.title}
                  </p>
                  <p className="text-xs font-medium text-slate-300 leading-snug line-clamp-3">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
