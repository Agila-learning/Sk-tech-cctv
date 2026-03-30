"use client";
import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, Shield, User, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';

const ReviewPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sk-tech-cctv.onrender.com/api'}/internal/review-info/${id}`);
        const data = await res.json();
        if (res.ok) setOrder(data);
        else throw new Error("Order not found");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sk-tech-cctv.onrender.com/api'}/internal/review/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) setSubmitted(true);
      else alert("Submission failed");
    } catch (err) {
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Syncing with SK Security Grid...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10 text-center space-y-6">
      <CheckCircle className="h-16 w-16 text-fg-dim" />
      <h1 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Review Protocol <span className="text-red-500">Offline</span></h1>
      <p className="text-fg-muted text-xs font-medium max-w-xs">This review link has expired or the order identifier is invalid. Contact support for further verification.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-fg-primary p-6 md:p-12 selection:bg-blue-500 selection:text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      
      <main className="max-w-xl mx-auto space-y-12 py-10">
        <header className="space-y-4 text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">
                <Shield className="h-3 w-3" />
                <span>Verification & Quality Control</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">Job <span className="text-blue-500 non-italic">Review</span></h1>
            <p className="text-fg-muted font-bold text-xs uppercase tracking-[0.2em]">Finalizing Project #{id?.toString().slice(-6).toUpperCase() || 'UNKNOWN'}</p>
        </header>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-10 md:p-16 rounded-[4rem] border border-border-base bg-card shadow-2xl space-y-10"
            >
                <div className="flex items-center justify-between p-6 bg-bg-muted rounded-3xl border border-border-base">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-sm">
                            {order.technician?.name?.[0]}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Serviced By</p>
                            <p className="text-sm font-black text-fg-primary uppercase tracking-tight">{order.technician?.name}</p>
                        </div>
                    </div>
                    <User className="h-6 w-6 text-fg-dim" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-6 text-center">
                        <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Assign Rating Status</p>
                        <div className="flex justify-center gap-4">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setRating(s)}
                                    className="relative group p-1"
                                >
                                    <Star 
                                        className={`h-10 w-10 transition-all duration-300 ${s <= rating ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]' : 'text-fg-dim grayscale group-hover:grayscale-0'}`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Deployment Feedback</label>
                        <div className="relative">
                            <MessageSquare className="absolute top-6 left-6 h-4 w-4 text-fg-dim" />
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Describe the quality of service..."
                                className="w-full bg-bg-muted border border-border-base rounded-[2.5rem] p-6 pl-16 text-sm font-medium outline-none focus:border-blue-500 h-40 resize-none transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> <span>Submit Intelligence</span></>}
                    </button>
                </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-16 rounded-[4rem] border border-green-500/20 bg-green-500/5 text-center space-y-8"
            >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
                    <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Report <span className="text-green-500">Verified</span></h3>
                    <p className="text-fg-muted font-medium text-xs max-w-xs mx-auto">Your feedback has been integrated into the SK Security Grid. Thank you for helping us maintain operational excellence.</p>
                </div>
                <button 
                    onClick={() => router.push('/')}
                    className="px-10 py-5 bg-fg-primary text-bg-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                >
                    Back to Terminal
                </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ReviewPage;
