"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MessageSquare, Search, Filter, CheckCircle2, 
  XCircle, Eye, EyeOff, Edit, X, Pin, Sparkles, Menu, ShieldCheck, Flag
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'technician' | 'unpublished'>('all');
  
  // Modal State
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Edit State
  const [adminReply, setAdminReply] = useState('');
  const [publishStatus, setPublishStatus] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const [reviewsData, analyticsData] = await Promise.all([
        fetchWithAuth('/reviews'),
        fetchWithAuth('/reviews/analytics')
      ]);
      setReviews(reviewsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (review: any) => {
    setSelectedReview(review);
    setAdminReply(review.adminReply || '');
    setPublishStatus(review.publishStatus || false);
    setIsFeatured(review.featured || false);
    setIsPinned(review.pinned || false);
    setShowModal(true);
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;
    try {
      const updated = await fetchWithAuth(`/reviews/${selectedReview._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          publishStatus,
          featured: isFeatured,
          pinned: isPinned,
          adminReply,
          status: publishStatus ? 'approved' : (selectedReview.status === 'rejected' ? 'rejected' : 'pending')
        })
      });
      setReviews(reviews.map(r => r._id === updated._id ? updated : r));
      setShowModal(false);
      // Refresh analytics
      fetchWithAuth('/reviews/analytics').then(setAnalytics);
    } catch (err) {
      console.error(err);
      alert('Error updating review');
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (filterType === 'product') return r.productRating && r.productRating > 0;
    if (filterType === 'technician') return r.technicianRating && r.technicianRating > 0;
    if (filterType === 'unpublished') return r.publishStatus === false || r.status === 'pending';
    return true;
  });

  return (
    <div className="flex h-screen bg-bg-base text-fg-base overflow-hidden selection:bg-blue-500/30 font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0 lg:ml-[280px] flex flex-col h-screen overflow-hidden relative">
        <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-bg-muted hover:bg-bg-surface">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-fg-primary uppercase tracking-tight">Review Management</h1>
              <p className="text-sm font-semibold text-fg-muted mt-1 tracking-wide">Manage and moderate customer reviews</p>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Analytics Dashboard */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Total</p>
                <h3 className="text-3xl font-black text-fg-primary">{analytics.total}</h3>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Pending</p>
                <h3 className="text-3xl font-black text-amber-500">{analytics.pending}</h3>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Approved</p>
                <h3 className="text-3xl font-black text-emerald-500">{analytics.approved}</h3>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Avg Product</p>
                <h3 className="text-3xl font-black text-blue-500">{analytics.avgProductRating} ★</h3>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Avg Tech</p>
                <h3 className="text-3xl font-black text-purple-500">{analytics.avgTechnicianRating} ★</h3>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex bg-bg-surface p-1.5 rounded-2xl border border-border-subtle shadow-sm">
               {(['all', 'product', 'technician', 'unpublished'] as const).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setFilterType(tab)}
                   className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === tab ? 'bg-blue-600 text-white shadow-md' : 'text-fg-muted hover:text-fg-primary hover:bg-bg-muted'}`}
                 >
                   {tab === 'all' ? 'All Reviews' : tab === 'product' ? 'Product Ratings' : tab === 'technician' ? 'Technician Ratings' : 'Unpublished'}
                 </button>
               ))}
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
              <input 
                type="text" 
                placeholder="Search by product or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-blue-600 font-bold text-fg-primary shadow-sm"
              />
            </div>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-muted border-b border-border-subtle">
                    <th className="p-4 text-xs font-black text-fg-muted uppercase tracking-widest whitespace-nowrap">Customer</th>
                    <th className="p-4 text-xs font-black text-fg-muted uppercase tracking-widest whitespace-nowrap">Product</th>
                    <th className="p-4 text-xs font-black text-fg-muted uppercase tracking-widest whitespace-nowrap">Context</th>
                    <th className="p-4 text-xs font-black text-fg-muted uppercase tracking-widest whitespace-nowrap">Rating</th>
                    <th className="p-4 text-xs font-black text-fg-muted uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="p-4 text-xs font-black text-fg-muted uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-fg-muted font-bold animate-pulse">Loading reviews...</td></tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-fg-muted font-bold">No reviews found.</td></tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review._id} className="hover:bg-bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-fg-primary">{review.customer?.name || 'Anonymous'}</p>
                          <p className="text-xs text-fg-muted">{review.customer?.email}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-fg-primary max-w-[150px] truncate">{review.product?.name || 'Unknown Product'}</p>
                          <p className="text-[10px] text-fg-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4 space-y-1">
                          <p className="text-[10px] font-bold text-fg-muted font-mono">ID: {String(review.order).slice(-6)}</p>
                          {review.technician && <p className="text-[10px] text-fg-muted truncate max-w-[120px]">Tech: {review.technician?.name}</p>}
                          {review.technicianRecommended && <span className="inline-flex items-center gap-1 text-[8px] font-black text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded uppercase"><ShieldCheck size={10}/> Recommended</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-fg-primary">{review.rating}</span>
                          </div>
                          {(review.helpfulCount > 0 || review.reportCount > 0) && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-fg-muted">
                              {review.helpfulCount > 0 && <span className="text-emerald-500">{review.helpfulCount} Helpful</span>}
                              {review.reportCount > 0 && <span className="text-red-500 flex items-center gap-0.5"><Flag size={8}/> {review.reportCount}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${review.publishStatus ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                            {review.publishStatus ? 'Live' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleOpenModal(review)}
                            className="p-2 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-bold text-xs uppercase tracking-widest"
                          >
                            Moderate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Moderation Modal */}
      <AnimatePresence>
        {showModal && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl bg-bg-surface border border-border-base rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-muted">
                <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight">Moderate Review</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-bg-surface rounded-xl"><X className="h-5 w-5 text-fg-muted" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                
                <div className="bg-bg-muted p-5 rounded-2xl border border-border-base relative overflow-hidden">
                   {selectedReview.technicianRecommended && (
                     <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                       <ShieldCheck size={12}/> Recommended by Tech
                     </div>
                   )}
                   <div className="flex justify-between items-start mb-4 mt-2">
                     <div>
                       <h4 className="font-black text-fg-primary text-lg">{selectedReview.title || 'No Title'}</h4>
                       <div className="flex items-center gap-2 mt-1">
                          <div className="flex text-amber-400">
                             {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < selectedReview.rating ? 'fill-current' : 'text-border-subtle'}`} />)}
                          </div>
                          <span className="text-xs font-bold text-fg-muted">by {selectedReview.customer?.name}</span>
                       </div>
                     </div>
                   </div>
                   <p className="text-sm font-semibold text-fg-primary/80 whitespace-pre-wrap">{selectedReview.comment}</p>
                   
                   {selectedReview.images?.length > 0 && (
                     <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                       {selectedReview.images.map((img: string, i: number) => (
                         <img key={i} src={img} alt="Review" className="h-20 w-20 object-cover rounded-xl border border-border-subtle" />
                       ))}
                     </div>
                   )}
                   {selectedReview.videoUrl && (
                     <div className="mt-2 text-xs font-bold text-blue-500"><a href={selectedReview.videoUrl} target="_blank" rel="noreferrer">View Video Attached</a></div>
                   )}
                </div>

                {/* Sub Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-bold text-fg-muted">
                  <div className="bg-bg-muted p-2 rounded-xl">Product: {selectedReview.productRating}★</div>
                  <div className="bg-bg-muted p-2 rounded-xl">Tech: {selectedReview.technicianRating}★</div>
                  <div className="bg-bg-muted p-2 rounded-xl">Install: {selectedReview.installationRating}★</div>
                  <div className="bg-bg-muted p-2 rounded-xl">Value: {selectedReview.valueForMoney}★</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-4">
                     <label className="flex items-center gap-3 p-4 border border-border-base rounded-2xl cursor-pointer hover:bg-bg-muted transition-colors">
                        <input type="checkbox" checked={publishStatus} onChange={e => setPublishStatus(e.target.checked)} className="w-5 h-5 accent-emerald-600 rounded" />
                        <div>
                          <p className="font-bold text-sm text-fg-primary flex items-center gap-2"><Eye className="h-4 w-4" /> Publish</p>
                          <p className="text-[10px] text-fg-muted font-bold uppercase">Make visible</p>
                        </div>
                     </label>
                  </div>
                  <div className="space-y-4">
                     <label className="flex items-center gap-3 p-4 border border-border-base rounded-2xl cursor-pointer hover:bg-bg-muted transition-colors">
                        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-5 h-5 accent-purple-600 rounded" />
                        <div>
                          <p className="font-bold text-sm text-fg-primary flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500" /> Featured</p>
                          <p className="text-[10px] text-fg-muted font-bold uppercase">Highlight review</p>
                        </div>
                     </label>
                  </div>
                  <div className="space-y-4">
                     <label className="flex items-center gap-3 p-4 border border-border-base rounded-2xl cursor-pointer hover:bg-bg-muted transition-colors">
                        <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-5 h-5 accent-amber-600 rounded" />
                        <div>
                          <p className="font-bold text-sm text-fg-primary flex items-center gap-2"><Pin className="h-4 w-4 text-amber-500" /> Pinned</p>
                          <p className="text-[10px] text-fg-muted font-bold uppercase">Pin to top</p>
                        </div>
                     </label>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Admin Reply (Public)</label>
                   <textarea 
                     value={adminReply}
                     onChange={e => setAdminReply(e.target.value)}
                     rows={3}
                     placeholder="Write a public response to this review..."
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 outline-none focus:border-blue-600 font-semibold text-fg-primary text-sm resize-none"
                   ></textarea>
                </div>

              </div>
              
              <div className="p-6 border-t border-border-subtle bg-bg-muted flex justify-between gap-3">
                 <button onClick={async () => {
                   if(confirm('Reject this review?')) {
                     try {
                       await fetchWithAuth(`/reviews/${selectedReview._id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'rejected', publishStatus: false })
                       });
                       setShowModal(false);
                       fetchReviews();
                     } catch(e) {}
                   }
                 }} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors">Reject Review</button>
                 <div className="flex gap-3">
                   <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-fg-muted hover:bg-bg-surface transition-colors">Cancel</button>
                   <button onClick={handleUpdateReview} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Save Changes</button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
