"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Megaphone, Mail, Trash2, Calendar, Search } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadSubscriptions = async () => {
    try {
      const data = await fetchWithAuth('/subscription');
      setSubscriptions(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSubscriptions(); }, []);

  return (
    <div className="flex min-h-screen bg-background text-fg-primary">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
        <header className="mb-16 flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-blue-500">
               <Megaphone className="h-5 w-5" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Intel</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter italic">News <span className="text-blue-600 non-italic">Dispatch</span></h1>
            <p className="text-fg-muted font-medium text-lg lg:text-xl italic">"Stay Connected" Operative Database</p>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl"><Megaphone className="h-6 w-6" /></button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-12">
              <div className="bg-card border border-card-border rounded-[3rem] overflow-hidden shadow-2xl">
                 <div className="p-10 border-b border-card-border flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-fg-muted">Subscribed Entities</h3>
                    <div className="flex items-center space-x-4">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-dim" />
                          <input type="text" placeholder="Filter emails..." className="bg-bg-muted border border-border-base rounded-xl pl-12 pr-6 py-3 text-[10px] font-black uppercase outline-none focus:border-blue-600 w-64" />
                       </div>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-bg-muted/50">
                          <tr className="border-b border-card-border">
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Identity (Email)</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Deployment Date</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Status</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-card-border">
                          {subscriptions.map((sub, i) => (
                             <tr key={i} className="hover:bg-bg-muted/30 transition-all group">
                                <td className="px-10 py-8">
                                   <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                         <Mail className="h-5 w-5 text-blue-500" />
                                      </div>
                                      <span className="font-bold text-sm">{sub.email}</span>
                                   </div>
                                </td>
                                <td className="px-10 py-8">
                                   <div className="flex items-center space-x-3 text-fg-muted font-bold text-xs">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(sub.subscribedAt).toLocaleDateString()}
                                   </div>
                                </td>
                                <td className="px-10 py-8">
                                   <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Active Link</span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                   <button className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                      <Trash2 className="h-4 w-4" />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {subscriptions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-20 text-center opacity-30 font-black uppercase text-xs tracking-[0.2em]">No Subscribers found in grid.</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionsPage;
