"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Lock, User, Mail, ArrowRight, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { Suspense } from 'react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const registrationData = {
        ...formData,
        email: formData.email.toLowerCase().trim()
      };

      const data = await fetchWithAuth('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      
      login(data.user, data.token, redirectTo !== '/' ? redirectTo : undefined);
    } catch (err: any) {
      const errorMsg = err.message || "Registration failed.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />
      
      <div className="flex items-center justify-center py-20 px-4">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-card rounded-[3rem] overflow-hidden border border-border shadow-2xl">
          {/* Left Side (Simplified for Register) */}
          <div className="bg-blue-600 p-16 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            <div className="relative z-10">
               <div className="flex items-center space-x-3 text-white mb-12">
                  <ShieldCheck className="h-10 w-10" />
                  <span className="text-2xl font-black tracking-tighter uppercase">SK <span className="text-cyan-400">REGISTER</span></span>
               </div>
               <h1 className="text-5xl font-black leading-[1.1] mb-8 tracking-tighter uppercase">
                 Create Your <br />
                 <span className="text-cyan-400 italic">Account.</span>
               </h1>
               <p className="text-blue-100 text-lg font-medium leading-relaxed">Register to access professional security products and maintenance services.</p>
            </div>
            
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          </div>

          {/* Right Side: Form */}
          <div className="p-16 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black tracking-tighter uppercase">Create <span className="text-slate-500">Account</span></h2>
              <p className="text-slate-500 text-sm font-medium">Please enter your details to register</p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl flex items-center">
                 <Lock className="h-4 w-4 mr-3 shrink-0" />
                 {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="relative group col-span-2 sm:col-span-1">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                    <input name="name" required value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full bg-white/5 border border-border rounded-xl pl-14 pr-6 py-4 outline-none focus:border-blue-500 transition-all font-bold text-sm" />
                  </div>
                  <div className="relative group col-span-2 sm:col-span-1">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                    <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full bg-white/5 border border-border rounded-xl pl-14 pr-6 py-4 outline-none focus:border-blue-500 transition-all font-bold text-sm" />
                  </div>
                  <div className="relative group col-span-2">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="Password (Min 8 characters)" className="w-full bg-white/5 border border-border rounded-xl pl-14 pr-6 py-4 outline-none focus:border-blue-500 transition-all font-bold text-sm" />
                  </div>
                  <div className="relative group col-span-2 sm:col-span-1">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                    <input name="phone" required value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full bg-white/5 border border-border rounded-xl pl-14 pr-6 py-4 outline-none focus:border-blue-500 transition-all font-bold text-sm" />
                  </div>
                  <div className="relative group col-span-2 sm:col-span-1">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                    <input name="address" required value={formData.address} onChange={handleChange} placeholder="Delivery Address" className="w-full bg-white/5 border border-border rounded-xl pl-14 pr-6 py-4 outline-none focus:border-blue-500 transition-all font-bold text-sm" />
                  </div>
               </div>

               <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-3 group disabled:opacity-50 mt-4">
                 {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </>
                 )}
               </button>
            </form>

            <div className="text-center">
               <p className="text-slate-500 text-xs font-medium">Already have an account? <Link href={`/login${redirectTo !== '/' ? `?redirect=${redirectTo}` : ''}`} className="text-blue-500 font-black uppercase tracking-widest ml-1 hover:underline">Login</Link></p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const RegisterPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
