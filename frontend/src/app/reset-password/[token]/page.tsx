"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { fetchWithAuth } from '@/utils/api';

const ResetPasswordPage = () => {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchWithAuth(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setMessage(data.message);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.data?.error || err.message || "Failed to reset password. Link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -mr-64 -mt-64"></div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10 pt-40 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <div className="text-center space-y-6 mb-12">
               <div className="w-20 h-20 bg-blue-600/10 rounded-[2.2rem] flex items-center justify-center mx-auto border border-blue-500/20 shadow-xl shadow-blue-600/10">
                 <ShieldCheck className="h-10 w-10 text-blue-500" />
               </div>
               <div className="space-y-3">
                  <h1 className="text-4xl font-black tracking-tighter uppercase font-poppins text-fg-primary italic leading-none">Security <span className="text-blue-500 non-italic">Reset</span></h1>
                  <p className="text-fg-muted text-[10px] font-black uppercase tracking-[0.3em]">Authorized Credential Override</p>
               </div>
            </div>

            <AnimatePresence mode="wait">
              {!success ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center">
                         <XCircle className="h-4 w-4 mr-3 shrink-0" />
                         {error}
                      </div>
                    )}

                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Core Password" 
                        className="w-full bg-bg-muted border border-border-base rounded-[1.8rem] pl-16 pr-16 py-6 outline-none focus:border-blue-600 transition-all font-bold text-sm text-fg-primary placeholder:text-fg-dim"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Core Password" 
                        className="w-full bg-bg-muted border border-border-base rounded-[1.8rem] pl-16 pr-16 py-6 outline-none focus:border-blue-600 transition-all font-bold text-sm text-fg-primary placeholder:text-fg-dim"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !password || !confirmPassword}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-[0_20px_40px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center space-x-4 group disabled:opacity-50"
                  >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                          <span>Establish Credentials</span>
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
                    <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight">Access Restored</h3>
                    <p className="text-sm font-medium text-fg-secondary leading-relaxed">
                      {message || "Security protocols updated. Redirecting to login terminal..."}
                    </p>
                  </div>
                  <div className="pt-4">
                    <div className="w-full bg-bg-muted h-1 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ x: "-100%" }}
                         animate={{ x: "0%" }}
                         transition={{ duration: 3, ease: "linear" }}
                         className="h-full bg-green-500"
                       />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
