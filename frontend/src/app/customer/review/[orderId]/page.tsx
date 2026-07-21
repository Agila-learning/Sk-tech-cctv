"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, CheckCircle2, ChevronLeft, Image as ImageIcon, Video, ShieldCheck, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const StarRating = ({ value, onChange, label, description }: any) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-bg-muted/50 border border-border-base gap-4">
      <div>
        <p className="font-black text-fg-primary text-sm tracking-tight">{label}</p>
        {description && <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mt-1">{description}</p>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all hover:scale-110 active:scale-95 ${value >= star ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-border-subtle hover:text-amber-200'}`}
          >
            <Star className={`h-8 w-8 ${value >= star ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ReviewSubmissionPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams?.get('product');
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [recommendedProduct, setRecommendedProduct] = useState<boolean | null>(null);
  
  // Detailed Ratings
  const [installationRating, setInstallationRating] = useState(0);
  const [productRating, setProductRating] = useState(0);
  const [technicianRating, setTechnicianRating] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [easyToUse, setEasyToUse] = useState(0);
  const [overallExperience, setOverallExperience] = useState(0);
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  // We could fetch product details here to show what they are reviewing, but keeping it simple for now.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please provide an overall rating.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      await fetchWithAuth('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: params.orderId,
          product: productId,
          rating,
          title,
          comment,
          recommendedProduct: recommendedProduct ?? true,
          installationRating: installationRating || undefined,
          productRating: productRating || undefined,
          technicianRating: technicianRating || undefined,
          valueForMoney: valueForMoney || undefined,
          easyToUse: easyToUse || undefined,
          overallExperience: overallExperience || undefined,
          isAnonymous,
          images,
          videoUrl
        })
      });
      setSuccess(true);
      setTimeout(() => router.push('/customer'), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit review. You may have already reviewed this product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    // A real implementation would upload to /api/upload and get a URL back.
    // For now, we simulate success or use a placeholder base64 for images if needed.
    // Assuming standard upload mechanism exists:
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    if (type === 'image' && images.length >= 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Mocking the upload since standard endpoint isn't fully verified here,
      // but in real app we'd `await fetchWithAuth('/upload', { method: 'POST', body: formData, headers: {'Accept':'*'} })`
      // For demonstration, we'll just read as dataURL for UI preview.
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') setImages([...images, reader.result as string]);
        if (type === 'video') setVideoUrl(reader.result as string); // Not ideal for prod, but works for mock
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-bg-surface border border-border-base rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
             <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-fg-primary uppercase tracking-tight mb-2">Review Submitted</h2>
          <p className="text-sm font-semibold text-fg-muted mb-8">Thank you! Your verified review has been submitted and is pending approval.</p>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base font-inter pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/customer" className="p-2 bg-bg-muted hover:bg-border-subtle rounded-xl transition-colors">
             <ChevronLeft className="h-5 w-5 text-fg-primary" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-fg-primary uppercase tracking-tight">Write a Review</h1>
            <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-blue-500" /> Verified Purchase
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 font-bold text-sm rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Section 1: Overall Rating */}
          <div className="bg-bg-surface border border-border-base rounded-[2rem] p-8 shadow-sm">
             <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight mb-6 flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span> 
               Overall Rating
             </h3>
             <div className="flex flex-col items-center justify-center py-6 gap-6">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all hover:scale-125 active:scale-95 ${rating >= star ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-110' : 'text-border-base hover:text-amber-200'}`}
                    >
                      <Star className={`h-12 w-12 sm:h-16 sm:w-16 ${rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <p className="text-sm font-bold text-fg-muted uppercase tracking-widest">
                  {rating === 1 && "Very Poor"}
                  {rating === 2 && "Poor"}
                  {rating === 3 && "Average"}
                  {rating === 4 && "Good"}
                  {rating === 5 && "Excellent"}
                  {rating === 0 && "Select a Rating"}
                </p>
             </div>
          </div>

          {/* Section 2: Detailed Review */}
          <div className="bg-bg-surface border border-border-base rounded-[2rem] p-8 shadow-sm space-y-6">
             <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight mb-6 flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">2</span> 
               Detailed Review
             </h3>
             
             <div className="space-y-2">
               <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Review Title</label>
               <input 
                 type="text" 
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="Summarize your experience (e.g., Excellent Camera Quality!)"
                 className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                 required
               />
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Detailed Feedback</label>
               <textarea 
                 rows={5}
                 value={comment}
                 onChange={(e) => setComment(e.target.value)}
                 placeholder="What did you like or dislike? How was the installation process?"
                 className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-medium text-fg-primary resize-none leading-relaxed"
                 required
               />
             </div>

             <div className="pt-6 border-t border-border-subtle">
               <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Would you recommend this product?</p>
               <div className="flex gap-4">
                 <button type="button" onClick={() => setRecommendedProduct(true)} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs border transition-all ${recommendedProduct === true ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-bg-muted border-transparent text-fg-muted hover:bg-bg-surface hover:border-border-base'}`}>
                   <ThumbsUp className="h-4 w-4" /> Yes
                 </button>
                 <button type="button" onClick={() => setRecommendedProduct(false)} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs border transition-all ${recommendedProduct === false ? 'bg-red-500/10 border-red-500/30 text-red-600' : 'bg-bg-muted border-transparent text-fg-muted hover:bg-bg-surface hover:border-border-base'}`}>
                   <ThumbsDown className="h-4 w-4" /> No
                 </button>
               </div>
             </div>
          </div>

          {/* Section 3: Feature Ratings */}
          <div className="bg-bg-surface border border-border-base rounded-[2rem] p-8 shadow-sm space-y-4">
             <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight mb-6 flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">3</span> 
               Rate Specific Features (Optional)
             </h3>
             <StarRating value={installationRating} onChange={setInstallationRating} label="Installation Experience" description="How smooth was the installation?" />
             <StarRating value={productRating} onChange={setProductRating} label="Product Quality" description="Build, features, and reliability" />
             <StarRating value={technicianRating} onChange={setTechnicianRating} label="Technician Rating" description="Professionalism and expertise" />
             <StarRating value={valueForMoney} onChange={setValueForMoney} label="Value for Money" />
             <StarRating value={easyToUse} onChange={setEasyToUse} label="Ease of Use" />
          </div>

          {/* Section 4: Media & Finalize */}
          <div className="bg-bg-surface border border-border-base rounded-[2rem] p-8 shadow-sm space-y-8">
             <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">4</span> 
               Upload Photos & Video (Optional)
             </h3>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {/* Image Upload */}
               <div className="border-2 border-dashed border-border-base rounded-2xl p-6 text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer relative overflow-hidden group">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'image')} />
                  <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-fg-primary uppercase tracking-widest">Add Photos</p>
                  <p className="text-[10px] text-fg-muted font-bold mt-1 uppercase tracking-widest">{images.length}/5 Uploaded</p>
               </div>
               {/* Video Upload */}
               <div className="border-2 border-dashed border-border-base rounded-2xl p-6 text-center hover:border-purple-500 hover:bg-purple-500/5 transition-all cursor-pointer relative overflow-hidden group">
                  <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'video')} />
                  <Video className="h-8 w-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-fg-primary uppercase tracking-widest">Add Video</p>
                  <p className="text-[10px] text-fg-muted font-bold mt-1 uppercase tracking-widest">{videoUrl ? '1 Uploaded' : 'Max 50MB'}</p>
               </div>
             </div>

             {/* Previews */}
             {images.length > 0 && (
               <div className="flex gap-3 overflow-x-auto pb-2">
                 {images.map((img, i) => (
                   <div key={i} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-border-subtle group">
                     <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                     <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <X className="h-3 w-3" />
                     </button>
                   </div>
                 ))}
               </div>
             )}

             <div className="pt-6 border-t border-border-subtle flex items-center gap-4">
               <label className="flex items-center gap-3 cursor-pointer">
                 <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-5 h-5 accent-blue-600 rounded" />
                 <div>
                   <p className="font-bold text-sm text-fg-primary">Post Anonymously</p>
                   <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest">Hide your name from public view</p>
                 </div>
               </label>
             </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" /> Submit Verified Review
              </>
            )}
          </button>
          
        </form>
      </main>
    </div>
  );
}
