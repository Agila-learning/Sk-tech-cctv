import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, Flag, Image as ImageIcon, Video, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewCard({ review }: { review: any }) {
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);

  const handleHelpful = async () => {
    if (helpfulClicked) return;
    try {
      setHelpfulCount((c: number) => c + 1);
      setHelpfulClicked(true);
      // await axios.patch(`/api/reviews/${review._id}/helpful`); // API call in production
    } catch (e) {}
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all hover:-translate-y-1 hover:shadow-xl group">
      {/* Pinned / Featured Badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {review.pinned && <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">Pinned</span>}
        {review.featured && <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">Featured</span>}
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-inner overflow-hidden">
          {review.isAnonymous ? (
            <User size={24} />
          ) : (
            review.customer?.avatar ? (
              <img src={review.customer.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold">{review.customer?.name?.[0] || 'U'}</span>
            )
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {review.isAnonymous ? 'Verified Customer' : review.customer?.name || 'User'}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'} />
              ))}
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">&bull; {review.createdAt ? format(new Date(review.createdAt), 'MMM dd, yyyy') : 'Recent'}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                <CheckCircle size={12} className="mr-1" /> Verified Purchase
              </span>
            )}
            {review.verifiedInstallation && (
              <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-100/80 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                <CheckCircle size={12} className="mr-1" /> Verified Installation
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        {review.title && <h5 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">{review.title}</h5>}
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
      </div>

      {/* Detailed Ratings */}
      {(review.productRating || review.installationRating || review.technicianRating || review.valueForMoney) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
          {review.productRating && (
             <div className="text-xs text-center"><span className="block text-slate-500 dark:text-slate-400 font-medium mb-0.5">Product</span><span className="font-bold text-slate-800 dark:text-slate-200">{review.productRating} ★</span></div>
          )}
          {review.installationRating && (
             <div className="text-xs text-center"><span className="block text-slate-500 dark:text-slate-400 font-medium mb-0.5">Installation</span><span className="font-bold text-slate-800 dark:text-slate-200">{review.installationRating} ★</span></div>
          )}
          {review.technicianRating && (
             <div className="text-xs text-center"><span className="block text-slate-500 dark:text-slate-400 font-medium mb-0.5">Technician</span><span className="font-bold text-slate-800 dark:text-slate-200">{review.technicianRating} ★</span></div>
          )}
          {review.valueForMoney && (
             <div className="text-xs text-center"><span className="block text-slate-500 dark:text-slate-400 font-medium mb-0.5">Value</span><span className="font-bold text-slate-800 dark:text-slate-200">{review.valueForMoney} ★</span></div>
          )}
        </div>
      )}

      {/* Media Gallery */}
      {((review.images && review.images.length > 0) || review.videoUrl) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {review.images?.map((img: string, i: number) => (
            <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={img} alt={`Review ${i+1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {review.videoUrl && (
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative group/video">
              <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors z-10 flex items-center justify-center">
                <Video className="text-white drop-shadow-md" />
              </div>
              <video src={review.videoUrl} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {review.adminReply && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-1.5 relative z-10">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md">SK</div>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">SK Technology Team</span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-8 relative z-10">{review.adminReply}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <button 
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${helpfulClicked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'} px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30`}
        >
          <ThumbsUp size={14} className={helpfulClicked ? 'fill-current scale-110' : 'transition-transform group-hover:scale-110'} />
          {helpfulClicked ? 'Helpful' : 'Helpful?'} ({helpfulCount})
        </button>
        <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30">
          <Flag size={14} /> Report
        </button>
      </div>
    </div>
  );
}
