"use client";
import React, { useState, useEffect } from 'react';
import { 
  Zap, IndianRupee, TrendingUp, Clock, Calendar, Plus, 
  ChevronLeft, LayoutDashboard, User as UserIcon, MessageSquare, LogOut, Menu,
  Edit2, Trash2, Save, X, FileText, Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TechnicianEarnings = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [techStats, setTechStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [salaryData, techData] = await Promise.all([
        fetchWithAuth('/salary/stats/my').catch(() => null),
        fetchWithAuth('/technician/stats').catch(() => null)
      ]);
      setStats(salaryData);
      setTechStats(techData);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const chartData = {
    labels: stats?.history?.map((h: any) => format(new Date(h.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'Daily Earnings (&#8377;)',
        data: stats?.history?.map((h: any) => h.earnings) || [],
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const lineData = {
    labels: stats?.history?.map((h: any) => format(new Date(h.date), 'dd/MM')) || [],
    datasets: [
      {
        label: 'Hours Worked',
        data: stats?.history?.map((h: any) => h.hours) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      }
    ]
  };

  return (
    <div className="p-6 lg:p-12 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">
               <TrendingUp className="h-4 w-4 animate-bounce" />
               <span>Enterprise Wage Matrix</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none italic text-fg-primary">Salary <span className="text-blue-500 non-italic">Report</span></h1>
            <p className="text-fg-muted text-lg font-medium uppercase tracking-widest leading-none">Automated Earnings & Incentives</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-6 py-5 border border-border-base rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:bg-bg-muted text-fg-primary">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Base Pay', val: `\u20B9${techStats?.basePay?.toLocaleString() || '0'}`, sub: 'Monthly Fixed', col: 'text-blue-500' },
            { label: 'Bonuses & Incentives', val: `\u20B9${((techStats?.bonus || 0) + (techStats?.incentives || 0)).toLocaleString()}`, sub: `${techStats?.jobsCompleted || 0} jobs done`, col: 'text-green-500' },
            { label: 'Deductions', val: `\u20B9${techStats?.deductions?.toLocaleString() || '0'}`, sub: 'Quality penalties', col: 'text-red-500' },
            { label: 'Net Earnings', val: `\u20B9${techStats?.totalEarnings?.toLocaleString() || '0'}`, sub: `Avg Rating: ${techStats?.avgRating || 'N/A'}`, col: 'text-purple-500' },
          ].map((s, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.1 }} key={i} className="bg-card p-8 rounded-[2.5rem] border border-card-border shadow-xl relative overflow-hidden group">
               <div className={`absolute top-0 right-0 w-32 h-32 ${s.col.replace('text', 'bg')}/5 blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
               <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.15em] mb-4">{s.label}</p>
               <div className="flex items-end justify-between">
                  <h3 className={`text-3xl font-black tracking-tighter ${s.col}`}>{s.val}</h3>
               </div>
               <span className="text-[10px] font-bold text-fg-dim mt-2 block">{s.sub}</span>
            </motion.div>
          ))}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-card p-10 rounded-[3rem] border border-card-border shadow-xl">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-fg-primary flex items-center gap-3">
                   <TrendingUp className="h-4 w-4 text-blue-500" />
                   Earnings Trend
                </h3>
             </div>
             <div className="h-[300px]">
                <Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }} />
             </div>
          </div>
          <div className="bg-card p-10 rounded-[3rem] border border-card-border shadow-xl">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-fg-primary flex items-center gap-3">
                   <Clock className="h-4 w-4 text-green-500" />
                   Workload Balance
                </h3>
             </div>
             <div className="h-[300px]">
                <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }} />
             </div>
          </div>
        </div>

        <div className="bg-card rounded-[3.5rem] overflow-hidden border border-card-border shadow-2xl relative">
           <div className="px-12 py-10 bg-bg-muted/30 border-b border-card-border flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-fg-primary">Operation Log History</h3>
              <span className="px-4 py-1 bg-blue-600/10 text-blue-600 rounded-full text-[9px] font-black uppercase">Last 30 cycles</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-card-border">
                    <tr>
                       <th className="px-12 py-8">Date</th>
                       <th className="px-12 py-8">Hours</th>
                       <th className="px-12 py-8">Earnings</th>
                       <th className="px-12 py-8">Type</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-card-border">
                    {stats?.history?.slice().reverse().map((log: any, i: number) => (
                      <tr key={i} className="hover:bg-bg-muted/20 transition-all group">
                         <td className="px-12 py-8">
                            <span className="font-black text-xs text-fg-primary uppercase">{format(new Date(log.date), 'MMMM dd, yyyy')}</span>
                         </td>
                         <td className="px-12 py-8">
                            <span className="text-xs font-bold text-fg-muted">{log.hours} hrs</span>
                         </td>
                         <td className="px-12 py-8">
                            <span className="text-sm font-black text-blue-500">&#8377;{log.earnings.toLocaleString()}</span>
                         </td>
                         <td className="px-12 py-8">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${log.type === 'manual' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                               {log.type}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianEarnings;
