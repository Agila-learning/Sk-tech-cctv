"use client";
import React from 'react';
import { 
  Zap, LayoutDashboard, Briefcase, IndianRupee, TrendingUp, 
  User as UserIcon, MessageSquare, LogOut, Bell, Clock, Megaphone, FileText, ShieldCheck, Calendar, QrCode, Users
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useWebPush } from '@/hooks/useWebPush';

interface TechnicianSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onChatOpen?: () => void;
}

const TechnicianSidebar = ({ sidebarOpen, setSidebarOpen, onChatOpen }: TechnicianSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isSupported, permission, subscribeToWebPush } = useWebPush();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/technician' },
    { icon: Briefcase, label: 'Tasks', path: '/technician/tasks' },
    { icon: Users, label: 'Customer Contact', path: '/technician/customer-contact' },
    { icon: ShieldCheck, label: 'Service Warranty', path: '/technician/warranty' },
    { icon: ShieldCheck, label: 'Product Warranty', path: '/technician/product-warranty' },
    { icon: QrCode, label: 'QR Code Center', path: '/technician/qrcodes' },
    { icon: FileText, label: 'Notes', path: '/technician/notes' },
    { icon: Clock, label: 'Attendance', path: '/technician/attendance' },
    { icon: IndianRupee, label: 'Expenses', path: '/technician/expenses' },
    { icon: Bell, label: 'Notifications', path: '/technician/notifications' },
    { icon: MessageSquare, label: 'Chat', path: '/technician/chat' },
    { icon: FileText, label: 'Billing/Quotation', path: '/technician/billing' },
    { icon: Calendar, label: 'Leave Request', path: '/technician/leaves' },
    { icon: TrendingUp, label: 'Earnings', path: '/technician/earnings' },
    { icon: Megaphone, label: 'Announcement', path: '/technician/announcements' },
    { icon: UserIcon, label: 'My Profile', path: '/technician/profile' }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[50] lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-bg-surface border-r border-card-border transform transition-transform duration-500 ease-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:sticky lg:top-0 h-screen lg:translate-x-0`}>
        <div className="flex flex-col h-full p-8 overflow-y-auto scrollbar-hide bg-bg-surface">
        <div className="flex items-center justify-between mb-16 px-1">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black text-fg-primary uppercase tracking-tighter block leading-none">SK Team</span>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Dashboard</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <button 
              key={item.path}
              onClick={() => handleNavigation(item.path)} 
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border transition-all ${pathname === item.path ? 'bg-blue-600/10 text-blue-500 border-blue-600/20' : 'text-fg-muted hover:bg-bg-muted border-transparent'}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="pt-8 border-t border-card-border mt-auto space-y-4">
           <div className="p-6 bg-bg-muted rounded-[2rem] border border-border-base">
              <p className="text-[9px] font-black text-fg-muted uppercase tracking-[0.2em] mb-2">Authenticated User</p>
              <p className="text-xs font-black text-fg-primary truncate uppercase">{user?.name}</p>
           </div>
           
           {isSupported && permission !== 'granted' && permission !== 'denied' && (
             <button onClick={subscribeToWebPush} className="w-full flex items-center justify-between px-6 py-4 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all">
               <span className="flex items-center gap-3">
                 <Bell className="h-4 w-4" />
                 Enable Push Alerts
               </span>
             </button>
           )}
           
           <button onClick={logout} className="w-full flex items-center space-x-4 px-6 py-4 text-red-500 hover:bg-red-500/5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all">
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
           </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default TechnicianSidebar;
