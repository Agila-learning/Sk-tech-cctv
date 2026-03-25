"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Activity, Shield, Cpu, Database, Zap, Clock, User, AlertTriangle, CheckCircle, Search, Terminal, HardDrive, Menu } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const DiagnosticsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    cpu: 12,
    ram: 45,
    dbStatus: 'Optimal',
    uptime: '14d 06h 12m'
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadLogs = async () => {
    try {
      const data = await fetchWithAuth('/admin/logs');
      setLogs(data);
    } catch (error) {
      console.error("Load Logs Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // Refresh logs periodically for "Live" feel
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="mb-16 flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base">
            <Menu className="h-6 w-6 text-fg-primary" />
          </button>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase leading-none italic">System <span className="text-blue-500 non-italic">Health</span></h1>
            <p className="text-fg-muted text-lg font-medium tracking-tight">Real-time audit trails and infrastructure diagnostics.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
           {[
             { label: 'CPU Usage', value: `${systemStats.cpu}%`, icon: Cpu, color: 'blue' },
             { label: 'RAM Usage', value: `${systemStats.ram}%`, icon: HardDrive, color: 'cyan' },
             { label: 'Database Status', value: systemStats.dbStatus, icon: Database, color: 'green' },
             { label: 'System Uptime', value: systemStats.uptime, icon: Zap, color: 'indigo' },
           ].map((stat, i) => (
             <div key={i} className="glass-card p-8 rounded-[2.5rem] border border-border-base flex items-center space-x-6">
                <div className={`p-4 bg-${stat.color}-500/10 rounded-2xl`}>
                   <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                </div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                    <h3 className="text-xl font-black text-fg-primary tracking-tighter truncate">{stat.value}</h3>
                 </div>
             </div>
           ))}
        </div>

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base">
           <div className="p-10 border-b border-border-base flex justify-between items-center bg-bg-muted/30">
              <div className="flex items-center space-x-4">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                 <h3 className="text-fg-primary font-black uppercase tracking-widest text-sm">Central Audit Trail</h3>
              </div>
              <button className="px-6 py-2.5 bg-bg-muted border border-border-base rounded-xl text-[10px] font-black uppercase tracking-widest text-fg-muted hover:text-fg-primary transition-all">Clear Logs</button>
           </div>

           <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left">
                 <thead className="sticky top-0 bg-bg-surface z-10">
                    <tr className="border-b border-border-base">
                       <th className="px-10 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Operational Pulse (Time)</th>
                       <th className="px-10 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Admin ID</th>
                       <th className="px-10 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Professional Action</th>
                       <th className="px-10 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Protocol Details</th>
                       <th className="px-10 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Source IP</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-base">
                    {logs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-bg-muted/20 transition-colors group">
                        <td className="px-10 py-6">
                           <div className="flex items-center text-xs font-bold text-fg-secondary">
                              <Clock className="h-3.5 w-3.5 mr-2 text-fg-muted" />
                              {new Date(log.createdAt).toLocaleString()}
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-black text-white">AD</div>
                              <span className="text-xs font-bold text-fg-primary">{log.admin?.name || 'ROOT'}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${log.action.includes('Delete') || log.action.includes('Revoke') ? 'bg-red-500/10 text-red-500' : 'bg-blue-600/10 text-blue-500'}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-xs font-medium text-fg-secondary italic">
                          "{log.details || 'Standard operational procedure logs.'}"
                        </td>
                        <td className="px-10 py-6 font-mono text-[10px] text-fg-muted font-bold tracking-widest">{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
};

export default DiagnosticsPage;
