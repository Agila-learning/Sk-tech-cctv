"use client";
import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Send, MessageSquare, Camera } from 'lucide-react';
import { API_URL } from '@/utils/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useParams } from 'next/navigation';

const ReviewPage = () => {
  const { id } = useParams();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const fetchContext = async () => {
       try {
          const res = await fetch(`${API_URL}/orders/${id}`);
          const data = await res.json();
          setOrderDetails(data);
       } catch (e) { console.error(e); }
    };
    if (id) fetchContext();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: id,
          customer: orderDetails?.customer?._id,
          technician: orderDetails?.technician?._id || orderDetails?.technician,
          rating,
          comment,
          status: 'approved' 
        })
      });
      if (response.ok) setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
       <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
          <CheckCircle className="h-12 w-12 text-green-500" />
       </div>
       <h1 className="text-4xl font-black text-fg-primary uppercase tracking-tighter mb-4">Thank You!</h1>
       <p className="text-fg-muted max-w-sm font-medium">Your feedback helps us provide better service. Have a great day!</p>
       <button onClick={() => window.location.href = '/'} className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Back to Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background selection:bg-blue-500/30">
      <Navbar />
      <main className="max-w-xl mx-auto pt-32 pb-24 px-6">
        <div className="glass-card p-10 md:p-12 rounded-[3.5rem] border border-border-base relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10"></div>
           
           <div className="space-y-4 mb-12">
              <span className="px-3 py-1 bg-blue-600/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Service Feedback</span>
              <h1 className="text-4xl font-black text-fg-primary uppercase tracking-tighter leading-none">Rate Your <br/><span className="text-blue-500 italic">Experience</span></h1>
              <p className="text-fg-muted font-medium text-sm">How was your interaction with Technician {orderDetails?.technician?.name || 'Assigned Agent'}?</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Overall Rating</p>
                 <div className="flex space-x-4 justify-between bg-bg-muted p-6 rounded-3xl border border-border-base">
                    {[1, 2, 3, 4, 5].map((num) => (
                       <button 
                         key={num}
                         type="button"
                         onClick={() => setRating(num)}
                         className={`transition-all transform hover:scale-125 ${rating >= num ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'text-fg-dim'}`}
                       >
                          <Star className={`h-8 w-8 ${rating >= num ? 'fill-current' : ''}`} />
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Your Comments</p>
                 <div className="relative">
                    <MessageSquare className="absolute top-6 left-6 h-5 w-5 text-fg-dim" />
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about the installation quality and professionalism..."
                      className="w-full h-40 bg-bg-muted border border-border-base rounded-[2rem] p-6 pl-16 outline-none focus:border-blue-600 transition-all font-medium text-sm text-fg-primary resize-none"
                    />
                 </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-blue-600/20 disabled:opacity-50"
              >
                 {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : (
                   <>
                     <Send className="h-4 w-4" />
                     <span>Submit Review</span>
                   </>
                 )}
              </button>
           </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewPage;
