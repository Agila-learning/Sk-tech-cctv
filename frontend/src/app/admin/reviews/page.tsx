"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Star, Trash2, CheckCircle2, UserIcon, Package, Search, Wrench, Calendar, X } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'service' | 'product'>('all');
  const [search, setSearch] = useState('');

  const loadReviews = async () => {
    setLoading(true);
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
    if (!confirm("Permanently delete this review?")) return;
    try {
      await fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' });
      loadReviews();
    } catch (e) { alert("Delete failed"); }
  };

  const filtered = reviews.filter(rev => {
    if (filter === 'service' && !rev.technician) return false;
    if (filter === 'product' && rev.technician) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (rev.customer?.name || '').toLowerCase().includes(q) ||
           (rev.technician?.name || '').toLowerCase().includes(q) ||
           (rev.comment || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex min-h-screen bg-background text-fg-primary">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-amber-500">
               <Star className="h-5 w-5 fill-amber-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Customer Feedback</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter italic leading-none">Customer <span className="text-amber-500 non-italic">Reviews</span></h1>
            <p className="text-fg-muted font-medium text-lg">Manage ratings from service jobs and product purchases.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {(['all', 'service', 'product'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f ? 'bg-amber-500 text-white border-amber-600' : 'bg-bg-muted border-border-base text-fg-muted hover:text-fg-primary'}`}>
                {f === 'all' ? 'All' : f === 'service' ? 'Service' : 'Product'}
              </button>
            ))}
          </div>
        </header>

        <div className="bg-card border border-card-border rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="p-8 border-b border-card-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-bg-muted/30">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-fg-muted">
                {filtered.length} Reviews Found
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-dim" />
                <input 
                  type="text" 
                  placeholder="Search by customer, technician..." 
                  className="bg-bg-muted border border-border-base rounded-xl pl-12 pr-6 py-3 text-[10px] font-bold outline-none focus:border-amber-500 w-full" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
           </div>

           {loading ? (
             <div className="p-20 text-center">
               <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
             </div>
           ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                 <thead className="bg-bg-muted/50">
                    <tr className="border-b border-card-border">
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-fg-muted">Customer</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-fg-muted">About</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-fg-muted">Rating</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-fg-muted">Comment</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-fg-muted">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-fg-muted text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-card-border">
                    {filtered.map((rev, i) => (
                       <tr key={i} className="hover:bg-bg-muted/30 transition-all group">
                          <td className="px-8 py-6">
                             <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-fg-primary font-black text-sm">
                                   <UserIcon className="h-3 w-3 text-blue-500 shrink-0" />
                                   <span>{rev.customer?.name || 'Anonymous'}</span>
                                </div>
                                <p className="text-[9px] font-bold text-fg-dim tracking-wide">{rev.customer?.email}</p>
                                <p className="text-[9px] font-bold text-fg-dim">{new Date(rev.createdAt).toLocaleDateString()}</p>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             {rev.technician ? (
                               <div className="flex items-center gap-2">
                                 <div className="p-1.5 bg-blue-500/10 rounded-lg"><Wrench className="h-3 w-3 text-blue-500" /></div>
                                 <div>
                                   <p className="text-xs font-black text-fg-primary">{rev.technician.name}</p>
                                   <p className="text-[9px] text-fg-muted">Service Review</p>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex items-center gap-2">
                                 <div className="p-1.5 bg-purple-500/10 rounded-lg"><Package className="h-3 w-3 text-purple-400" /></div>
                                 <div>
                                   <p className="text-xs font-black text-fg-primary">Product</p>
                                   <p className="text-[9px] text-fg-muted">#{(rev.product || '').toString().slice(-6)}</p>
                                 </div>
                               </div>
                             )}
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-1.5">
                                {[1,2,3,4,5].map(n => (
                                   <Star key={n} className={`h-3.5 w-3.5 ${n <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-fg-dim opacity-20'}`} />
                                ))}
                                <span className="ml-1 text-xs font-black text-fg-primary">{rev.rating}/5</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 max-w-xs">
                             <p className="text-xs font-medium text-fg-secondary italic leading-relaxed truncate">"{rev.comment || '—'}"</p>
                          </td>
                          <td className="px-8 py-6">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                rev.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                                rev.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                             }`}>
                                {rev.status}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-2">
                                {rev.status !== 'approved' && (
                                   <button onClick={() => handleUpdateStatus(rev._id, 'approved')} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all" title="Approve">
                                      <CheckCircle2 className="h-4 w-4" />
                                   </button>
                                )}
                                {rev.status !== 'rejected' && (
                                   <button onClick={() => handleUpdateStatus(rev._id, 'rejected')} className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all" title="Reject">
                                      <X className="h-4 w-4" />
                                   </button>
                                )}
                                <button onClick={() => handleDelete(rev._id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Delete">
                                   <Trash2 className="h-4 w-4" />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center opacity-30 font-black uppercase text-xs tracking-[0.2em]">No reviews found.</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default ReviewsPage;
