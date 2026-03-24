"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Star, Trash2, CheckCircle2, AlertTriangle, UserIcon, Package, Search, Filter } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadReviews = async () => {
    try {
      const data = await fetchWithAuth('/reviews');
      setReviews(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetchWithAuth(`/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadReviews();
    } catch (e) { alert("Update failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently purge this record?")) return;
    try {
      await fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' });
      loadReviews();
    } catch (e) { alert("Delete failed"); }
  };

  return (
    <div className="flex min-h-screen bg-background text-fg-primary">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
        <header className="mb-16 flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-amber-500">
               <Star className="h-5 w-5 fill-amber-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Customer Feedback</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter italic leading-none">Review <span className="text-amber-500 non-italic">Override</span></h1>
            <p className="text-fg-muted font-medium text-lg lg:text-xl">Manage grid sentiment and technical ratings.</p>
          </div>
        </header>

        <div className="bg-card border border-card-border rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="p-10 border-b border-card-border flex justify-between items-center bg-bg-muted/30">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-fg-muted">Evidence Logs (Reviews)</h3>
              <div className="flex items-center space-x-4">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-dim" />
                    <input type="text" placeholder="Scan logs..." className="bg-bg-muted border border-border-base rounded-xl pl-12 pr-6 py-3 text-[10px] font-black uppercase outline-none focus:border-amber-500 w-64" />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50">
                    <tr className="border-b border-card-border">
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Operative / Target</th>
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Calibration (Rating)</th>
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Intelligence (Comment)</th>
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted">Status</th>
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-fg-muted text-right">Matrix Control</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-card-border">
                    {reviews.map((rev, i) => (
                       <tr key={i} className="hover:bg-bg-muted/30 transition-all group">
                          <td className="px-10 py-8">
                             <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-fg-primary font-black text-sm">
                                   <UserIcon className="h-3 w-3 text-blue-500" />
                                   <span>{rev.customer?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-[9px] font-bold text-fg-dim uppercase tracking-widest">
                                   <Package className="h-3 w-3" />
                                   <span>Prod ID: {rev.product?.slice(-6)}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-8">
                             <div className="flex items-center space-x-1.5">
                                {[1,2,3,4,5].map(n => (
                                   <Star key={n} className={`h-3.5 w-3.5 ${n <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-fg-dim opacity-20'}`} />
                                ))}
                             </div>
                          </td>
                          <td className="px-10 py-8 max-w-md">
                             <p className="text-xs font-medium text-fg-secondary italic leading-relaxed">"{rev.comment}"</p>
                          </td>
                          <td className="px-10 py-8">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                rev.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                                rev.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                             }`}>
                                {rev.status}
                             </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex items-center justify-end space-x-3">
                                {rev.status !== 'approved' && (
                                   <button onClick={() => handleUpdateStatus(rev._id, 'approved')} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                                      <CheckCircle2 className="h-4 w-4" />
                                   </button>
                                )}
                                <button onClick={() => handleDelete(rev._id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                   <Trash2 className="h-4 w-4" />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {reviews.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center opacity-30 font-black uppercase text-xs tracking-[0.2em]">No intelligence reports found.</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewsPage;
