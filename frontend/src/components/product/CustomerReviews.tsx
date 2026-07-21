"use client";
import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ThumbsUp, MessageSquare, Verified, ShieldAlert, CheckCircle2, ChevronDown, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/utils/api';
import NextImage from 'next/image';

interface Review {
  _id: string;
  customer: {
    name: string;
    avatar?: string;
  };
  title?: string;
  comment: string;
  rating: number;
  createdAt: string;
  images: string[];
  videoUrl?: string;
  isAnonymous: boolean;
  isVerifiedPurchase: boolean;
  verifiedInstallation: boolean;
  featured: boolean;
  pinned: boolean;
  technicianRecommended: boolean;
  helpfulCount: number;
  adminReply?: string;
  installationRating?: number;
  productRating?: number;
  technicianRating?: number;
  valueForMoney?: number;
  easyToUse?: number;
  overallExperience?: number;
}

const CustomerReviews = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'with_media', '5_star'

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        fetchWithAuth(`/reviews/product/${productId}`),
        fetchWithAuth(`/reviews/rating/${productId}`)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error: any) {
      console.error("Reviews Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const res = await fetchWithAuth(`/reviews/${reviewId}/helpful`, { method: 'POST' });
      setReviews(reviews.map(r => r._id === reviewId ? { ...r, helpfulCount: res.helpfulCount } : r));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'with_media') return r.images.length > 0 || r.videoUrl;
    if (filter === '5_star') return r.rating === 5;
    return true;
  });

  return (
    <div className="space-y-16 font-inter">
      
      {/* Header & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
         <div className="lg:col-span-5 space-y-8">
            <div>
               <h3 className="text-3xl md:text-4xl font-black text-fg-primary uppercase tracking-tighter">Customer <span className="text-blue-600">Reviews</span></h3>
               <p className="text-fg-muted text-sm font-bold mt-2 uppercase tracking-widest">Verified Feedback & Ratings</p>
            </div>
            
            {stats && stats.count > 0 ? (
              <div className="bg-bg-surface border border-border-base rounded-[2.5rem] p-8 shadow-sm">
                 <div className="flex items-end gap-4 mb-8">
                    <span className="text-6xl font-black text-fg-primary leading-none tracking-tighter">{stats.avgRating.toFixed(1)}</span>
                    <div className="space-y-1 mb-1">
                       <div className="flex text-amber-400">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`h-5 w-5 ${s <= Math.round(stats.avgRating) ? 'fill-current' : 'text-border-subtle'}`} />)}
                       </div>
                       <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Based on {stats.count} reviews</p>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {[5,4,3,2,1].map((star) => {
                       const count = stats[`star${star}`] || 0;
                       const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
                       return (
                         <div key={star} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-fg-muted">
                           <span className="w-12 text-right">{star} Star</span>
                           <div className="flex-1 h-3 bg-bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                           </div>
                           <span className="w-10 text-left">{percentage.toFixed(0)}%</span>
                         </div>
                       );
                    })}
                 </div>
              </div>
            ) : (
              <div className="bg-bg-surface border border-border-base rounded-[2.5rem] p-8 shadow-sm text-center">
                 <Star className="h-12 w-12 text-fg-dim mx-auto mb-4 opacity-30" />
                 <p className="text-sm font-black text-fg-muted uppercase tracking-widest">No ratings yet</p>
              </div>
            )}
         </div>

         <div className="lg:col-span-7 flex flex-col justify-end h-full space-y-6">
            <div className="flex flex-wrap gap-3">
               <button onClick={() => setFilter('all')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${filter === 'all' ? 'bg-fg-primary text-background border-fg-primary shadow-lg' : 'bg-bg-surface text-fg-muted border-border-base hover:border-fg-primary'}`}>All Reviews</button>
               <button onClick={() => setFilter('with_media')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${filter === 'with_media' ? 'bg-fg-primary text-background border-fg-primary shadow-lg' : 'bg-bg-surface text-fg-muted border-border-base hover:border-fg-primary'}`}>With Media</button>
               <button onClick={() => setFilter('5_star')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${filter === '5_star' ? 'bg-fg-primary text-background border-fg-primary shadow-lg' : 'bg-bg-surface text-fg-muted border-border-base hover:border-fg-primary'}`}>5 Stars</button>
            </div>
         </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
         {loading ? (
           <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
         ) : filteredReviews.length === 0 ? (
           <div className="py-20 text-center bg-bg-surface border border-border-base rounded-[3rem]">
              <MessageSquare className="h-12 w-12 text-fg-dim mx-auto mb-4 opacity-20" />
              <p className="text-fg-muted font-black uppercase tracking-widest text-[10px]">No reviews found matching filters.</p>
           </div>
         ) : (
           <AnimatePresence>
             {filteredReviews.map((r, ri) => (
               <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: ri * 0.05 }}
                key={r._id} 
                className={`bg-bg-surface p-8 md:p-12 rounded-[2.5rem] border ${r.pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-border-base'} space-y-8 relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-sm`}
               >
                  {r.featured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-indigo-500 text-white px-8 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest shadow-lg">Featured Review</div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-600/20 shrink-0">
                          {r.isAnonymous ? 'A' : (r.customer?.name?.[0] || 'U')}
                        </div>
                        <div>
                           <div className="flex flex-wrap items-center gap-3">
                              <p className="text-lg font-black text-fg-primary uppercase tracking-tight">{r.isAnonymous ? 'Anonymous User' : r.customer?.name}</p>
                              {r.isVerifiedPurchase && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                   <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                                </span>
                              )}
                              {r.verifiedInstallation && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                   <ShieldCheck className="h-3 w-3" /> Pro Installed
                                </span>
                              )}
                           </div>
                           <p className="text-[10px] font-black uppercase text-fg-muted tracking-widest mt-1.5">{new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                     </div>
                     <div className="flex flex-col md:items-end gap-2">
                        <div className="flex items-center gap-1 text-amber-400">
                           {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-4 w-4 sm:h-5 sm:w-5 ${s <= r.rating ? 'fill-current' : 'text-border-subtle'}`} />)}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {r.title && <h4 className="text-xl font-black text-fg-primary tracking-tight">{r.title}</h4>}
                     <p className="text-fg-secondary text-base leading-relaxed font-medium whitespace-pre-wrap">{r.comment}</p>
                  </div>

                  {/* Detailed Ratings Preview (if provided) */}
                  {(r.installationRating || r.productRating) && (
                    <div className="flex flex-wrap gap-6 pt-4">
                       {r.installationRating && (
                         <div className="space-y-1"><p className="text-[9px] font-black uppercase tracking-widest text-fg-muted">Installation</p><div className="flex items-center gap-1 text-blue-500"><Star className="h-3 w-3 fill-current" /><span className="text-xs font-black">{r.installationRating}/5</span></div></div>
                       )}
                       {r.productRating && (
                         <div className="space-y-1"><p className="text-[9px] font-black uppercase tracking-widest text-fg-muted">Product Quality</p><div className="flex items-center gap-1 text-indigo-500"><Star className="h-3 w-3 fill-current" /><span className="text-xs font-black">{r.productRating}/5</span></div></div>
                       )}
                    </div>
                  )}

                  {/* Media */}
                  {(r.images?.length > 0 || r.videoUrl) && (
                    <div className="flex gap-4 overflow-x-auto pb-2 pt-4">
                       {r.videoUrl && (
                         <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-black rounded-2xl relative overflow-hidden flex items-center justify-center group cursor-pointer border border-border-base shadow-sm">
                            <video src={r.videoUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            <PlayCircle className="h-8 w-8 text-white relative z-10 group-hover:scale-110 transition-transform drop-shadow-md" />
                         </div>
                       )}
                       {r.images?.map((img, idx) => (
                          <div key={idx} className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-bg-muted rounded-2xl border border-border-base relative overflow-hidden cursor-zoom-in shadow-sm">
                             <NextImage src={img} alt="Review Image" fill className="object-cover hover:scale-110 transition-transform duration-500" />
                          </div>
                       ))}
                    </div>
                  )}

                  {/* Admin Reply */}
                  {r.adminReply && (
                    <div className="mt-8 p-6 bg-blue-600/5 border border-blue-600/10 rounded-2xl relative">
                       <div className="absolute top-0 left-6 -translate-y-1/2 bg-bg-surface px-2 text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1">
                          <Verified className="h-3 w-3" /> SK Technology Response
                       </div>
                       <p className="text-sm font-semibold text-fg-primary leading-relaxed mt-2">{r.adminReply}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-8 pt-8 border-t border-border-subtle">
                     <button onClick={() => handleHelpful(r._id)} className="flex items-center gap-2 text-[10px] font-black text-fg-muted uppercase tracking-widest hover:text-blue-600 transition-colors group/btn">
                        <ThumbsUp className={`h-4 w-4 transition-transform group-hover/btn:-translate-y-1 ${r.helpfulCount > 0 ? 'text-blue-500' : ''}`} />
                        <span>Helpful ({r.helpfulCount || 0})</span>
                     </button>
                  </div>
                  
               </motion.div>
             ))}
           </AnimatePresence>
         )}
      </div>
    </div>
  );
};

export default CustomerReviews;
