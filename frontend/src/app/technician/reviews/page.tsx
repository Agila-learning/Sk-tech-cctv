"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { ShieldCheck, Star, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TechnicianReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await fetchWithAuth('/reviews/technician');
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async (reviewId: string) => {
    try {
      await fetchWithAuth(`/reviews/${reviewId}/recommend`, { method: 'PATCH' });
      setReviews(reviews.map(r => r._id === reviewId ? { ...r, technicianRecommended: true } : r));
    } catch (err) {
      console.error(err);
      alert('Failed to recommend review.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Customer Reviews</h1>
        <p className="text-slate-500 font-medium mt-2">Reviews from your recent installations. Recommend top reviews to admins to boost your profile visibility.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-3xl text-center border border-slate-200 dark:border-slate-800 border-dashed">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No reviews yet</h3>
          <p className="text-slate-500 mt-2">When customers review your installations, they'll appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map(review => (
            <div key={review._id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{review.title || 'Customer Review'}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {review.rating} Overall</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><Star size={14} className="fill-blue-400 text-blue-400" /> {review.technicianRating || '-'} Technician</span>
                      <span>&bull;</span>
                      <span>{review.customer?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                    <p className="text-xs font-bold text-slate-500 mt-1">{review.product?.name}</p>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm">{review.comment}</p>
                
                {review.images?.length > 0 && (
                  <div className="flex gap-2">
                    {review.images.map((img: string, i: number) => (
                      <img key={i} src={img} className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="review" />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl flex flex-col justify-center gap-4">
                {review.technicianRecommended ? (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">Recommended to Admin</span>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-black uppercase text-slate-500 text-center tracking-widest leading-relaxed">
                      Standout review? Recommend it to be featured on the product page.
                    </p>
                    <button 
                      onClick={() => handleRecommend(review._id)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShieldCheck size={16} /> Recommend
                    </button>
                  </>
                )}
                
                {review.publishStatus && (
                  <div className="text-[9px] font-black uppercase text-center bg-green-500/10 text-green-600 py-1.5 rounded-lg border border-green-500/20">
                    Live on Product Page
                  </div>
                )}
                {!review.publishStatus && review.status === 'pending' && (
                  <div className="text-[9px] font-black uppercase text-center bg-amber-500/10 text-amber-600 py-1.5 rounded-lg border border-amber-500/20 flex items-center justify-center gap-1">
                    <Clock size={10} /> Pending Admin Approval
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
