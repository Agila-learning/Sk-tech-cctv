"use client";
import React, { useState, useEffect } from 'react';
import { 
  Zap, IndianRupee, Plus, Clock, CheckCircle, XCircle, 
  ChevronLeft, LayoutDashboard, User as UserIcon, MessageSquare, LogOut, Menu
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const TechnicianExpenses = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Travel'
  });

  const loadExpenses = async () => {
    try {
      const data = await fetchWithAuth('/expenses'); // Backend should filter by user in controller
      setExpenses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: 'employee' })
      });
      setShowForm(false);
      setFormData({ description: '', amount: '', category: 'Travel' });
      loadExpenses();
    } catch (err) {
      alert("Failed to submit expense");
    }
  };

  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <div className="flex h-screen bg-background overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-card border-r border-card-border transform transition-transform duration-500 ease-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center space-x-4 mb-16">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black text-fg-primary uppercase tracking-tighter block leading-none">SK Team</span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Service Dashboard</span>
              </div>
            </div>
            <nav className="flex-1 space-y-3">
              <button onClick={() => router.push('/technician')} className="w-full flex items-center space-x-4 px-6 py-4 text-fg-muted hover:bg-bg-muted rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all">
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => router.push('/technician/expenses')} className="glow-on-hover w-full flex items-center space-x-4 px-6 py-4 bg-blue-600/10 text-blue-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-blue-600/20 transition-all">
                <IndianRupee className="h-5 w-5" />
                <span>Field Expenses</span>
              </button>
              <button onClick={() => router.push('/technician/profile')} className="w-full flex items-center space-x-4 px-6 py-4 text-fg-muted hover:bg-bg-muted rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all">
                <UserIcon className="h-5 w-5" />
                <span>My Profile</span>
              </button>
            </nav>
            <div className="pt-8 border-t border-card-border mt-auto">
               <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="w-full flex items-center space-x-4 px-6 py-4 text-red-500 hover:bg-red-500/5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all">
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
               </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto w-full p-6 md:p-12">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <div className="flex items-center gap-6">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                <Menu className="h-6 w-6 text-blue-600" />
              </button>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Financial Portal</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Field <span className="text-blue-500 non-italic">Expenses</span></h1>
                <p className="text-fg-muted text-lg font-medium uppercase tracking-widest leading-none">Submit Claims & Reimbursements</p>
              </div>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95"
            >
               <Plus className="h-4 w-4" />
               New Claim
            </button>
          </header>

          {showForm && (
            <div className="glass-card p-10 rounded-[3rem] border border-blue-500/30 mb-12 bg-blue-600/5 animate-in slide-in-from-top-4 duration-500">
               <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Category</label>
                     <select 
                       value={formData.category}
                       onChange={e => setFormData({...formData, category: e.target.value})}
                       className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs uppercase"
                     >
                        <option>Travel</option>
                        <option>Apparatus</option>
                        <option>Lodging</option>
                        <option>Emergency Fix</option>
                        <option>Misc</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Amount (INR)</label>
                     <input 
                       type="number"
                       required
                       placeholder="0.00"
                       value={formData.amount}
                       onChange={e => setFormData({...formData, amount: e.target.value})}
                       className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Description</label>
                     <input 
                       type="text"
                       required
                       placeholder="Purpose of claim..."
                       value={formData.description}
                       onChange={e => setFormData({...formData, description: e.target.value})}
                       className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs"
                     />
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-4 mt-4">
                     <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 text-fg-muted font-black text-[10px] uppercase">Cancel</button>
                     <button type="submit" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Submit Claim</button>
                  </div>
               </form>
            </div>
          )}

          <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl bg-card/30 backdrop-blur-xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                      <tr>
                         <th className="px-10 py-8 text-nowrap">Service Details</th>
                         <th className="px-10 py-8 text-nowrap">Category</th>
                         <th className="px-10 py-8 text-nowrap">Date</th>
                         <th className="px-10 py-8 text-nowrap text-right">Amount</th>
                         <th className="px-10 py-8 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border-subtle">
                      {expenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-bg-muted/30 transition-all group">
                           <td className="px-10 py-8">
                              <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{expense.description}</p>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 px-4 py-2 rounded-lg border border-blue-500/10">{expense.category}</span>
                           </td>
                           <td className="px-10 py-8 text-[10px] font-bold text-fg-muted uppercase">
                              {new Date(expense.date).toLocaleDateString()}
                           </td>
                           <td className="px-10 py-8 text-right font-black text-fg-primary tabular-nums">
                              ₹{expense.amount.toLocaleString()}
                           </td>
                           <td className="px-10 py-8 text-right">
                              <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                expense.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                expense.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              }`}>
                                 {expense.status}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                {expenses.length === 0 && !loading && (
                  <div className="py-24 text-center">
                     <IndianRupee className="h-12 w-12 text-fg-dim mx-auto mb-6 opacity-20" />
                     <p className="text-[10px] font-black text-fg-dim uppercase tracking-[0.4em]">No Claims Registered</p>
                  </div>
                )}
             </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TechnicianExpenses;
