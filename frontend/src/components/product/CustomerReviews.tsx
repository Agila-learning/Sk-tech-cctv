"use client";
import React, { useState, useEffect } from 'react';
import { Star, Camera, ShieldCheck, ThumbsUp, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import NextImage from 'next/image';

interface Review {
  _id: string;
  customer: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  images: string[];
}

const CustomerReviews = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadReviews = async () => {
      if (!productId) return;
      try {
        const data = await fetchWithAuth(`/reviews/product/${productId}`);
        setReviews(data);
      } catch (error) {
        console.error("Reviews Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [productId]);


  return (
    <div className="space-y-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
         <div className="space-y-6">
            <h3 className="text-4xl md:text-5xl font-black text-fg-primary uppercase tracking-tight">Technical <span className="text-fg-muted italic">Assessments</span></h3>
            <p className="text-fg-secondary text-lg font-medium">Post-Service reports from verified end-users.</p>
         </div>
         <button className="px-10 py-5 bg-fg-primary text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl">Submit Professional Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         {reviews.length === 0 ? (
           <div className="md:col-span-2 py-20 text-center glass-card border-dashed border-2 border-border-base rounded-[3rem]">
              <MessageSquare className="h-12 w-12 text-fg-dim mx-auto mb-4 opacity-20" />
              <p className="text-fg-muted font-black uppercase tracking-widest text-[10px]">No active intelligence on this asset.</p>
           </div>
         ) : reviews.map((r, ri) => (
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: ri * 0.1 }}
            key={r._id} 
            className="bg-bg-surface backdrop-blur-sm p-12 rounded-[3.5rem] border border-border-base space-y-8 relative overflow-hidden group hover:bg-bg-muted transition-all"
           >
              <div className="flex justify-between items-start">
                 <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-center font-black text-blue-500 text-lg shadow-inner">{r.customer.name[0]}</div>
                    <div>
                       <div className="flex items-center space-x-3">
                          <p className="text-base font-black text-fg-primary uppercase tracking-tight">{r.customer.name}</p>
                          <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-600/10 border border-blue-600/20 rounded-md">
                               <ShieldCheck className="h-3 w-3 text-blue-500" />
                               <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Verified Technician</span>
                            </div>
                       </div>
                       <p className="text-[10px] font-black uppercase text-fg-muted tracking-[0.2em] mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-1">
                       {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-fg-dim'}`} />)}
                    </div>
                    <span className="text-[8px] font-black text-fg-muted uppercase tracking-[0.3em]">Operational Grade</span>
                 </div>
              </div>

              <p className="text-fg-secondary text-base leading-relaxed font-medium">{r.comment}</p>

              {r.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                   {r.images.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-bg-muted rounded-2xl border border-border-base flex items-center justify-center group/img relative overflow-hidden cursor-zoom-in">
                         <NextImage src={img} alt="Review" fill className="object-cover" />
                         <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                           <span className="text-[8px] font-black text-white uppercase tracking-widest">View Intel</span>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              <div className="flex items-center space-x-8 pt-8 border-t border-border-base">
                 <button className="flex items-center space-x-3 text-[10px] font-black text-fg-muted uppercase tracking-widest hover:text-blue-500 transition-colors group/btn">
                    <ThumbsUp className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    <span>Concur (12)</span>
                 </button>
                 <button className="flex items-center space-x-3 text-[10px] font-black text-fg-muted uppercase tracking-widest hover:text-blue-500 transition-colors group/btn">
                    <MessageSquare className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    <span>Intelligence (0)</span>
                 </button>
              </div>
              
              {/* Subtle background flair */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
           </motion.div>
         ))}
      </div>
    </div>
  );
};

export default CustomerReviews;
