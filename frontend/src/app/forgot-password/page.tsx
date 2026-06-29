"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Mail, ArrowRight, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { fetchWithAuth } from '@/utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await fetchWithAuth('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setMessage(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.data?.error || err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />
      
      {/* Background Decor */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10 pt-40 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-600/10 transition-all"></div>
            
            <div className="text-center space-y-6 mb-12">
               <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/20 shadow-xl shadow-blue-600/5">
                 <ShieldCheck className="h-10 w-10 text-blue-500" />
               </div>
               <div className="space-y-3">
                  <h1 className="text-4xl font-black tracking-tighter uppercase font-poppins text-fg-primary italic leading-none">Recover <span className="text-blue-500 non-italic">Access</span></h1>
                  <p className="text-fg-muted text-[10px] font-black uppercase tracking-[0.3em]">Secure Credential Reset Protocol</p>
               </div>
            </div>

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-8"
                >
                  <p className="text-sm font-medium text-fg-secondary text-center leading-relaxed">
                    Enter the email address associated with your account. We'll generate a secure reset link.
                  </p>

                  <div className="space-y-4">
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center">
                         <Lock className="h-4 w-4 mr-3 shrink-0" />
                         {error}
                      </div>
                    )}

                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-colors" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Verified Email Address" 
                        className="w-full bg-bg-muted border border-border-base rounded-[1.8rem] pl-16 pr-8 py-6 outline-none focus:border-blue-600 transition-all font-bold text-sm text-fg-primary placeholder:text-fg-dim"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !email}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-[0_20px_40px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center space-x-4 group disabled:opacity-50"
                  >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                          <span>Establish Link</span>
                          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8 py-4"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-lg shadow-green-500/5">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight">Dispatch Successful</h3>
                    <p className="text-sm font-medium text-fg-secondary leading-relaxed">
                      {message || "If an account exists for this email, you will receive a reset link shortly."}
                    </p>
                  </div>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 transition-all"
                  >
                    <span>Back to Login Grid</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-12 text-center">
             <Link href="/login" className="text-fg-dim text-[10px] font-black uppercase tracking-widest hover:text-blue-500 transition-colors">Return to Security Checkpoint</Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
