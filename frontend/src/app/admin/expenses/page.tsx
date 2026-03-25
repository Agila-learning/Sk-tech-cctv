"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { IndianRupee, Plus, Filter, CheckCircle, XCircle, Clock, User, Download, Search, Menu, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Office'
  });
  const router = useRouter();

  const loadExpenses = async () => {
    try {
      const data = await fetchWithAuth(`/expenses?type=${activeTab}${period !== 'all' ? `&period=${period}` : ''}`);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`${API_URL}/expenses/export?type=${activeTab}${period !== 'all' ? `&period=${period}` : ''}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sk_auth_token')}` }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${activeTab}_${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to download report");
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeTab, period]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetchWithAuth(`/expenses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: 'admin', status: 'approved' })
      });
      setShowForm(false);
      setFormData({ description: '', amount: '', category: 'Office' });
      loadExpenses();
    } catch (err) {
      alert("Failed to add expense");
    }
  };

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/admin')}
              className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
              title="Back to Command Center"
            >
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Financial Hub</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Expense <span className="text-blue-500 non-italic">Board</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Audit and Approve Financial Claims</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleDownloadReport}
              className="px-8 py-5 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-green-600 hover:text-white flex items-center gap-3"
            >
               <Download className="h-4 w-4" />
               Report
            </button>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95"
            >
               <Plus className="h-4 w-4" />
               {showForm ? 'Cancel' : 'Add Expense'}
            </button>
          </div>
        </header>

        {showForm && (
          <div className="glass-card p-10 rounded-[3rem] border border-blue-500/30 mb-12 bg-blue-600/5 animate-in slide-in-from-top-4 duration-500">
             <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Category</label>
                   <select 
                     value={formData.category}
                     onChange={e => setFormData({...formData, category: e.target.value})}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs uppercase"
                   >
                      <option>Office</option>
                      <option>Equipment</option>
                      <option>Inventory</option>
                      <option>Salary</option>
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
                     placeholder="Purpose of expense..."
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs"
                   />
                </div>
                <div className="md:col-span-3 flex justify-end gap-4 mt-4">
                   <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 text-fg-muted font-black text-[10px] uppercase">Cancel</button>
                   <button type="submit" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Save Expense</button>
                </div>
             </form>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
           <div className="flex bg-bg-muted rounded-3xl p-2 border border-border-base w-fit">
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-xl' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                Admin Expenses
              </button>
              <button 
                onClick={() => setActiveTab('employee')}
                className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'employee' ? 'bg-blue-600 text-white shadow-xl' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                Employee Claims
              </button>
           </div>

           <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base shadow-sm">
              <button 
                onClick={() => setPeriod('all')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                All
              </button>
              <button 
                onClick={() => setPeriod('week')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'week' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setPeriod('month')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                Month
              </button>
           </div>
        </div>

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                    <tr>
                       <th className="px-10 py-8">Description</th>
                       <th className="px-10 py-8">Amount</th>
                       <th className="px-10 py-8">Date</th>
                       <th className="px-10 py-8">Status</th>
                       {activeTab === 'employee' && <th className="px-10 py-8 text-right">Actions</th>}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-subtle">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-bg-muted/30 transition-all group">
                         <td className="px-10 py-8">
                            <div className="flex items-center space-x-4">
                               <div className="p-3 bg-blue-600/10 rounded-xl">
                                  <Clock className="h-4 w-4 text-blue-500" />
                               </div>
                               <div>
                                  <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{expense.description}</p>
                                  <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{expense.category}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex items-center space-x-2 text-blue-600">
                               <IndianRupee className="h-4 w-4" />
                               <span className="text-lg font-black tracking-tight">{expense.amount.toLocaleString()}</span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-xs font-black text-fg-muted uppercase">
                            {new Date(expense.date).toLocaleDateString()}
                         </td>
                         <td className="px-10 py-8">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              expense.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              expense.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>
                               {expense.status}
                            </span>
                         </td>
                         {activeTab === 'employee' && (
                           <td className="px-10 py-8 text-right">
                              <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleStatusUpdate(expense._id, 'approved')} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                                    <CheckCircle className="h-4 w-4" />
                                 </button>
                                 <button onClick={() => handleStatusUpdate(expense._id, 'rejected')} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                    <XCircle className="h-4 w-4" />
                                 </button>
                              </div>
                           </td>
                         )}
                      </tr>
                    ))}
                 </tbody>
              </table>
              {expenses.length === 0 && !loading && (
                <div className="py-20 text-center text-[10px] font-black text-fg-dim uppercase tracking-[0.3em]">No Expenses Recorded</div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default ExpensesPage;
