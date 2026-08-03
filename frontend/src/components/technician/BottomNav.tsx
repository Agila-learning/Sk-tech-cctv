"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, MessageSquare, Bell, User } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  const [taskCount, setTaskCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    fetchWithAuth('/technician/my-tasks').then(tasks => {
      if (Array.isArray(tasks)) {
        const activeTasks = tasks.filter(t => !t.status?.includes('completed') && !t.status?.includes('closed'));
        setTaskCount(activeTasks.length);
      }
    }).catch(() => {});

    fetchWithAuth('/notifications').then(notifs => {
      if (Array.isArray(notifs)) {
        setNotifCount(notifs.filter(n => !n.isRead).length);
      }
    }).catch(() => {});
    
    fetchWithAuth('/chat').then(chats => {
      if (Array.isArray(chats)) {
        const unread = chats.filter(c => c.isRead === false && c.receiver?._id === user?.id);
        setChatCount(unread.length);
      }
    }).catch(() => {});
  }, [user?.id]);

  const navItems = [
    { icon: Home, label: 'Home', path: '/technician', badge: 0 },
    { icon: ClipboardList, label: 'Tasks', path: '/technician/tasks', badge: taskCount },
    { icon: MessageSquare, label: 'Chat', path: '/technician/chat', badge: chatCount },
    { icon: Bell, label: 'Alerts', path: '/technician/notifications', badge: notifCount },
    { icon: User, label: 'Profile', path: '/technician/profile', badge: 0 },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-bg-surface border-t border-border-base px-2 pb-safe pt-2 z-50 flex items-center justify-between shadow-[0_-4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="relative flex flex-col items-center justify-center w-full py-1 h-14"
          >
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-active" 
                className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="relative">
                <Icon size={22} className={isActive ? 'text-blue-600' : 'text-slate-500'} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-sm border-[1.5px] border-white dark:border-bg-surface">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
