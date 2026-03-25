"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Download, Search, UserCheck, Trash2, Filter, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await fetchWithAuth('/subscription');
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Failed to load subscriptions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Email", "Subscribed At"].join(",") + "\n"
      + subscriptions.map(s => [s.email, new Date(s.subscribedAt).toLocaleString()].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = subscriptions.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <UserCheck className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Growth Matrix</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
            Subscriber <span className="text-blue-500 non-italic">Hub</span>
          </h1>
          <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">
            Manage Newsletter & Marketing Leads
          </p>
        </div>

        <button 
          onClick={handleExport}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: 'Total Operatives', value: subscriptions.length, icon: Mail, color: 'text-blue-500' },
          { label: 'Growth Rating', value: '+12%', icon: Filter, color: 'text-indigo-500' },
          { label: 'Verified Nodes', value: filtered.length, icon: Calendar, color: 'text-green-500' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
             <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">{stat.label}</p>
             <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-fg-primary tracking-tighter tabular-nums italic">{stat.value}</h3>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
             </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-[3.5rem] border border-border-base overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="p-10 border-b border-border-base flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-muted/50 border border-border-base rounded-2xl pl-16 pr-6 py-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-base bg-bg-muted/30">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Operative Email</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Signup Date</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-10 py-20 text-center">
                      <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((sub, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={sub._id} 
                      className="border-b border-border-base/50 hover:bg-bg-muted/20 transition-colors group"
                    >
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Mail className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-fg-primary">{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 font-medium text-fg-muted italic">
                        {new Date(sub.subscribedAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </td>
                      <td className="px-10 py-8">
                        <span className="px-4 py-2 bg-green-500/10 text-green-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-green-500/20">
                          Active
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-10 py-20 text-center text-fg-muted font-bold">
                      No matching operatives found.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
