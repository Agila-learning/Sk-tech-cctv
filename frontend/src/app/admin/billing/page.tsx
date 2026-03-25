"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { IndianRupee, FileText, Download, Send, CheckCircle, Clock, Search, Filter, Menu, Printer, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BillingPage = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const loadInvoices = async () => {
    try {
      const data = await fetchWithAuth('/api/billing');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.totalAmount, 0);

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Revenue Control</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Billing <span className="text-blue-500 non-italic">System</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Generate Invoices and Track Payments</p>
            </div>
          </div>
        </header>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <div className="glass-card p-10 rounded-[3rem] border border-border-base">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Total Billed</p>
              <h3 className="text-4xl font-black text-fg-primary tracking-tighter flex items-center gap-2">
                 <IndianRupee className="h-6 w-6 text-blue-500" />
                 {totalBilled.toLocaleString()}
              </h3>
           </div>
           <div className="glass-card p-10 rounded-[3rem] border border-border-base">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Collected Revenue</p>
              <h3 className="text-4xl font-black text-green-500 tracking-tighter flex items-center gap-2">
                 <IndianRupee className="h-6 w-6" />
                 {paidAmount.toLocaleString()}
              </h3>
           </div>
           <div className="glass-card p-10 rounded-[3rem] border border-border-base">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Invoice Volume</p>
              <h3 className="text-4xl font-black text-fg-primary tracking-tighter">{invoices.length}</h3>
           </div>
        </div>

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                    <tr>
                       <th className="px-10 py-8">Invoice #</th>
                       <th className="px-10 py-8">Customer</th>
                       <th className="px-10 py-8">Amount</th>
                       <th className="px-10 py-8">Status</th>
                       <th className="px-10 py-8 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-subtle">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-bg-muted/30 transition-all group">
                         <td className="px-10 py-8">
                            <span className="font-mono text-sm font-black text-fg-primary tracking-tight">#{inv.invoiceNumber.split('-')[1]}</span>
                         </td>
                         <td className="px-10 py-8">
                            <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{inv.customer?.name}</p>
                            <p className="text-[10px] font-bold text-fg-muted tracking-widest">{inv.customer?.email}</p>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex items-center space-x-2 text-blue-600 font-black">
                               <IndianRupee className="h-4 w-4" />
                               <span>{inv.totalAmount.toLocaleString()}</span>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              inv.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              inv.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                               {inv.status}
                            </span>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                  <Download className="h-4 w-4" />
                               </button>
                               <button className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                  <Printer className="h-4 w-4" />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              {invoices.length === 0 && !loading && (
                <div className="py-20 text-center text-[10px] font-black text-fg-dim uppercase tracking-[0.3em]">No Invoices Available</div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default BillingPage;
