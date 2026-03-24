"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Star, Send, Camera, Shield, CheckCircle2, 
  ChevronLeft, Loader2, AlertCircle, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth, API_URL, getImageUrl } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ReviewSubmission = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = params.id as string;
  const techId = searchParams.get('techId');
  const type = searchParams.get('type') || 'service'; // 'service' or 'product'

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await fetchWithAuth(`/orders/${orderId}`);
        setOrder(data);
      } catch (e) {
        console.error("Order load error:", e);
      }
    };
    if (orderId) loadOrder();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchWithAuth('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: orderId,
          technician: techId,
          rating,
          comment,
          isVerifiedPurchase: true
        })
      });
      setSubmitted(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (e) {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-card p-12 rounded-[3.5rem] border border-card-border text-center space-y-8 shadow-2xl">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter italic">Review <span className="text-green-500 non-italic">Secured</span></h2>
          <p className="text-fg-muted font-medium leading-relaxed">Your feedback has been decrypted and stored. The operative's rating has been recalibrated.</p>
          <div className="pt-6">
            <button onClick={() => router.push('/')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-all">Redirecting to Base Platform...</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <button onClick={() => router.back()} className="flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-all mb-4">
            <ChevronLeft className="h-4 w-4" />
            <span>Abort and Return</span>
          </button>
          <h1 className="text-5xl lg:text-7xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">Service <span className="text-blue-500 non-italic">Report</span></h1>
          <p className="text-fg-muted font-black text-[10px] uppercase tracking-[0.3em] ml-2">Mission Evaluation: #{orderId.slice(-6)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12">
            <form onSubmit={handleSubmit} className="bg-card p-10 lg:p-16 rounded-[4rem] border border-card-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[150px] -z-10 group-hover:bg-blue-600/[0.05] transition-all duration-1000"></div>
              
              <div className="space-y-16">
                <div className="text-center space-y-8">
                  <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight italic">How was the deployment specialist?</h3>
                  <div className="flex items-center justify-center gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-all transform hover:scale-125 focus:outline-none"
                      >
                        <Star 
                          className={`h-12 w-12 ${
                            star <= (hoverRating || rating) 
                            ? 'text-blue-600 fill-blue-600 shadow- blue-600/20' 
                            : 'text-fg-dim border-fg-dim'
                          } transition-all duration-300`} 
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Selected Rating: {rating}.0 Units</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] ml-6">Operational Feedback</label>
                  <textarea 
                    rows={5}
                    required
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Provide details on the installation quality, specialist professionalism, and overall system performance..."
                    className="w-full bg-bg-muted border border-border-base rounded-[2.5rem] p-10 outline-none focus:border-blue-600 text-fg-primary font-medium resize-none shadow-inner"
                  />
                </div>

                <div className="pt-10 flex flex-col items-center gap-6">
                   <button 
                     disabled={loading}
                     type="submit" 
                     className="w-full max-w-md py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4"
                   >
                     {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                     <span>Transmit Evaluation</span>
                   </button>
                   <div className="flex items-center gap-3 text-fg-muted">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Verification</span>
                   </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewPage = () => {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <ReviewSubmission />
    </ProtectedRoute>
  );
};

export default ReviewPage;
