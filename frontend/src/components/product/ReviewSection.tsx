'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewCard from './ReviewCard';
import { Star, SlidersHorizontal, Image as ImageIcon, Video, CheckCircle, MessageSquare } from 'lucide-react';

export default function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [productId, sort, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, statRes] = await Promise.all([
        axios.get(`/api/reviews/product/${productId}?sort=${sort}&filter=${filter}`),
        axios.get(`/api/reviews/rating/${productId}`)
      ]);
      setReviews(revRes.data);
      setStats(statRes.data);
    } catch (e) {
      console.error('Error fetching reviews', e);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={24} className={i < Math.floor(rating) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'} />
        ))}
      </div>
    );
  };

  const getPercentage = (count: number) => {
    if (!stats || stats.count === 0) return 0;
    return Math.round((count / stats.count) * 100);
  };

  return (
    <div className="py-16">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Customer Reviews</h2>
      
      {stats && stats.count > 0 ? (
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          {/* Overall Stats */}
          <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/50 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">{stats.avgRating.toFixed(1)}</h3>
            <div className="mb-2">{renderStars(stats.avgRating)}</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{stats.count} Verified Reviews</p>
          </div>
          
          {/* Breakdown */}
          <div className="lg:col-span-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/50 dark:border-slate-800/80 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-4 mb-3.5 last:mb-0 group">
                <span className="w-14 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">{star} <Star size={14} className="fill-slate-400 text-slate-400 group-hover:fill-amber-400 group-hover:text-amber-400 transition-colors" /></span>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${getPercentage(stats[`star${star}`])}%` }} 
                  />
                </div>
                <span className="w-12 text-sm font-semibold text-right text-slate-500 dark:text-slate-400">{getPercentage(stats[`star${star}`])}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-800 mb-12">
          <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No reviews yet</h3>
          <p className="text-slate-500">Be the first to review this product!</p>
        </div>
      )}

      {/* Filters & Sort */}
      {stats && stats.count > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/80 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setFilter('all')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${filter === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>All Reviews</button>
            <button onClick={() => setFilter('verified')} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${filter === 'verified' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'}`}><CheckCircle size={16}/> Verified</button>
            <button onClick={() => setFilter('images')} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${filter === 'images' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'}`}><ImageIcon size={16}/> Photos</button>
            <button onClick={() => setFilter('videos')} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${filter === 'videos' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50'}`}><Video size={16}/> Videos</button>
          </div>
          
          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
            <SlidersHorizontal size={16} className="text-slate-500" />
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map(review => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
