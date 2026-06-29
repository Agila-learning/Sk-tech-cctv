"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Lock, User, Mail, ArrowRight, Phone, MapPin, Eye, EyeOff, Chrome, ScanFace } from 'lucide-react';
import { motion } from "framer-motion";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import CCTVAnimation from '@/components/auth/CCTVAnimation';
import { Suspense } from 'react';

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      login(data.user, data.token, redirectTo !== '/' ? redirectTo : undefined);
    } catch (err: any) {
      setError(err.data?.error || err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (showAnimation) {
    return <CCTVAnimation onComplete={() => setShowAnimation(false)} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-card/30 backdrop-blur-2xl rounded-[3.5rem] overflow-hidden border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]"
        >
          {/* Left Side: Professional Branding */}
          <div className="bg-bg-muted/50 p-16 text-fg-primary flex flex-col justify-between relative overflow-hidden border-r border-border-base">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            
            <div className="relative z-10">
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center space-x-4 mb-16"
               >
                  <div className="relative w-16 h-16 bg-white overflow-hidden rounded-2xl shadow-xl shadow-blue-600/20 mb-8 p-1">
                     <img 
                       src="/logo.png" 
                       alt="Logo" 
                       className="w-full h-full object-contain"
                     />
                   </div>
                   <div>
                     <span className="text-2xl font-black tracking-tighter uppercase block leading-none text-fg-primary">SK <span className="text-blue-500 italic">TECHNOLOGY</span></span>
                     <span className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em]">Next-Gen Surveillance</span>
                   </div>
               </motion.div>

               <h1 className="text-6xl font-black leading-[0.85] mb-8 tracking-tighter uppercase font-poppins">
                 Securing Your <br />
                 <span className="text-blue-600 italic">Peace of Mind.</span>
               </h1>
               <p className="text-fg-secondary text-lg font-medium leading-relaxed font-manrope max-w-md">Access your security dashboard to manage your products and service requests.</p>
            </div>

            {/* Radar Animation / Status Line */}
            <div className="relative z-10 pt-12">
               <div className="flex items-center space-x-6">
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Network Status</p>
                    <p className="text-xl font-mono text-fg-primary tracking-widest font-bold">ONLINE_SECURE</p>
                  </div>
               </div>
            </div>
            
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mb-32 blur-3xl"></div>
          </div>

          {/* Right Side: Authenticated Entry */}
          <div className="p-16 flex flex-col justify-center space-y-10">
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tighter uppercase font-poppins text-fg-primary">Sign <span className="text-fg-muted">In</span></h2>
              <p className="text-fg-muted text-sm font-manrope font-semibold tracking-wide">Enter your credentials to access your account</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center"
              >
                 <Lock className="h-4 w-4 mr-4 shrink-0" />
                 {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-8">
               <div className="space-y-5">
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address" 
                      className="w-full bg-bg-muted border border-border-base rounded-[1.8rem] pl-16 pr-8 py-6 outline-none focus:border-blue-600 transition-all font-bold text-sm text-fg-primary placeholder:text-fg-dim"
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-hover:text-blue-500 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password" 
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
               </div>
               
               <div className="flex items-center justify-between px-2">
                 <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer h-5 w-5 appearance-none rounded-lg border-2 border-border-base bg-bg-muted checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                        <ArrowRight className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted group-hover:text-fg-secondary transition-colors">Stay Logged In</span>
                 </label>
                  <Link href="/forgot-password" element-id="forgot-password-link" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 transition-colors">Forgot Password?</Link>
               </div>

               <div className="space-y-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-[0_20px_40px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center space-x-4 group disabled:opacity-50"
                  >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                          <span>Login Now</span>
                          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                  </button>
               </div>
            </form>

            <div className="text-center">
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Don't have an account? <Link href="/register" className="text-blue-500 ml-1 hover:underline">Register Now</Link></p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
