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
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logData, setLogData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '8',
    remarks: ''
  });

  const loadStats = async () => {
    try {
      const data = await fetchWithAuth('/salary/stats/my');
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/attendance/${editingId}` : '/attendance/manual-log';
      const method = editingId ? 'PATCH' : 'POST';
      
      await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...logData, 
          hoursWorked: parseFloat(logData.hours), // for PATCH
          hours: parseFloat(logData.hours) // for POST
        })
      });
      
      setShowLogForm(false);
      setEditingId(null);
      setLogData({ date: format(new Date(), 'yyyy-MM-dd'), hours: '8', remarks: '' });
      loadStats();
    } catch (err) {
      alert(editingId ? "Failed to update record." : "Attendance record already exists for this date.");
    }
  };

  const handleEdit = (log: any) => {
    setEditingId(log._id);
    setLogData({
      date: format(new Date(log.date), 'yyyy-MM-dd'),
      hours: log.hours.toString(),
      remarks: log.remarks || ''
    });
    setShowLogForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await fetchWithAuth(`/attendance/${id}`, { method: 'DELETE' });
      loadStats();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const chartData = {
    labels: stats?.history?.map((h: any) => format(new Date(h.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'Daily Earnings (₹)',
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
            <p className="text-fg-muted text-lg font-medium uppercase tracking-widest leading-none">Automated Daily Earnings Tracking</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-6 py-5 border border-border-base rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:bg-bg-muted text-fg-primary">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button 
              onClick={() => setShowLogForm(!showLogForm)}
              className="px-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Log Hours
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Today', val: `₹${stats?.today?.earnings.toLocaleString() || '0'}`, sub: `${stats?.today?.hours || 0} hrs`, col: 'text-blue-500' },
            { label: 'This Week', val: `₹${stats?.week?.earnings.toLocaleString() || '0'}`, sub: `${stats?.week?.hours || 0} hrs`, col: 'text-green-500' },
            { label: 'This Month', val: `₹${stats?.month?.earnings.toLocaleString() || '0'}`, sub: `${stats?.month?.hours || 0} hrs`, col: 'text-purple-500' },
          ].map((s, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.1 }} key={i} className="bg-card p-10 rounded-[3rem] border border-card-border shadow-xl relative overflow-hidden group">
               <div className={`absolute top-0 right-0 w-32 h-32 ${s.col.replace('text', 'bg')}/5 blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
               <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mb-4">{s.label}</p>
               <div className="flex items-end justify-between">
                  <h3 className={`text-4xl font-black tracking-tighter ${s.col}`}>{s.val}</h3>
                  <span className="text-xs font-bold text-fg-dim mb-1">{s.sub}</span>
               </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showLogForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-12 overflow-hidden">
              <div className="glass-card p-10 rounded-[3rem] border border-blue-500/30 bg-blue-600/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-fg-primary mb-8 border-l-4 border-blue-600 pl-4">{editingId ? 'Edit Operation Log' : 'Operation Log Input'}</h3>
                <form onSubmit={handleLogSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Mission Date</label>
                      <div className="relative">
                         <Calendar className="absolute left-5 top-5 h-4 w-4 text-fg-dim" />
                         <input type="date" required value={logData.date} onChange={e => setLogData({...logData, date: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 pl-14 outline-none focus:border-blue-600 text-fg-primary font-bold" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Duty Hours</label>
                      <div className="relative">
                         <Clock className="absolute left-5 top-5 h-4 w-4 text-fg-dim" />
                         <select value={logData.hours} onChange={e => setLogData({...logData, hours: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 pl-14 outline-none focus:border-blue-600 text-fg-primary font-bold uppercase">
                            {[...Array(17)].map((_, i) => <option key={i} value={i+1}>{i+1} Hours</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Strategic Remarks</label>
                      <input type="text" placeholder="Shift objectives..." value={logData.remarks} onChange={e => setLogData({...logData, remarks: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 text-fg-primary font-medium" />
                   </div>
                   <div className="md:col-span-4 flex justify-end gap-6 pt-4 border-t border-blue-500/10">
                      <button type="button" onClick={() => { setShowLogForm(false); setEditingId(null); }} className="px-8 py-4 text-fg-muted font-black text-[10px] uppercase">Abort</button>
                      <button type="submit" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">{editingId ? 'Update Log' : 'Submit Log'}</button>
                   </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                       <th className="px-12 py-8 text-right">Actions</th>
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
                            <span className="text-sm font-black text-blue-500">₹{log.earnings.toLocaleString()}</span>
                         </td>
                         <td className="px-12 py-8">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${log.type === 'manual' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                               {log.type}
                            </span>
                         </td>
                         <td className="px-12 py-8 text-right">
                            <div className="flex justify-end gap-3 transition-all">
                               <button 
                                 onClick={() => handleEdit(log)}
                                 className="p-3 bg-bg-muted hover:bg-blue-600/10 hover:text-blue-500 rounded-xl transition-all"
                               >
                                 <Edit2 className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={() => handleDelete(log._id)}
                                 className="p-3 bg-bg-muted hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </button>
                            </div>
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
