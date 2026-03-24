"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Cpu, ChevronRight, CheckCircle2, Award, Camera, Info, X, Heart, ShoppingCart, ArrowLeft, Loader2, Play } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import Link from 'next/link';
import NextImage from 'next/image';
import { useCart } from '@/context/CartContext';

import { Suspense } from 'react';

const ComparisonContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [comparingIds, setComparingIds] = useState<string[]>([]);

    useEffect(() => {
        const ids = searchParams.get('ids')?.split(',') || [];
        if (ids.length === 0) {
            router.push('/products');
            return;
        }
        setComparingIds(ids);
        
        const loadProducts = async () => {
            try {
                const fetchedProducts = await Promise.all(
                    ids.map(id => fetchWithAuth(`/products/${id}`))
                );
                setProducts(fetchedProducts);
                setLoading(false);
            } catch (error) {
                console.error("Comparison Load Error:", error);
                setLoading(false);
            }
        };
        loadProducts();
    }, [searchParams]);

    const handleRemove = (id: string) => {
        const newIds = comparingIds.filter(i => i !== id);
        if (newIds.length === 0) {
            router.push('/products');
        } else {
            router.push(`/compare?ids=${newIds.join(',')}`);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const specKeys = Array.from(new Set(
        products.flatMap(p => [
            ...Object.keys(p.specifications || {}),
            ...Object.keys(p.comparableSpecs || {})
        ])
    ));

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="space-y-2">
                        <Link href="/products" className="flex items-center text-blue-500 text-[10px] font-black uppercase tracking-widest hover:translate-x-[-10px] transition-transform">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Return to Tactical Assets
                        </Link>
                        <h1 className="text-5xl lg:text-7xl font-black text-fg-primary uppercase tracking-tighter">Asset <span className="text-muted-foreground/30 italic">Comparison</span></h1>
                        <p className="text-fg-muted uppercase text-[10px] font-black tracking-[0.5em]">Cross-Referencing Field Intel</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="px-4 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {products.length} Units analyzed
                        </span>
                    </div>
                </div>

                <div className="relative overflow-x-auto pb-12">
                   <div className="min-w-[800px]">
                      {/* Product Headers */}
                      <div className="grid grid-cols-12 gap-8 mb-12 border-b border-border-base pb-12">
                         <div className="col-span-3">
                            <div className="h-full flex flex-col justify-end">
                               <p className="text-[12px] font-black text-fg-primary uppercase tracking-[0.2em]">Parameter Matrix</p>
                               <p className="text-[9px] font-medium text-fg-muted mt-2 uppercase tracking-widest">Institution-Grade Comparison</p>
                            </div>
                         </div>
                         {products.map((product) => (
                           <div key={product._id} className="col-span-3 relative group">
                              <button 
                                onClick={() => handleRemove(product._id)}
                                className="absolute -top-4 -right-4 w-8 h-8 bg-background border border-border-base rounded-full flex items-center justify-center text-fg-muted hover:text-red-500 hover:border-red-500 transition-all z-20 shadow-lg"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              
                              <div className="space-y-6">
                                 <div className="aspect-square glass-card rounded-[2.5rem] flex items-center justify-center p-8 overflow-hidden relative group-hover:border-blue-600/30 transition-all">
                                    <NextImage 
                                      src={product.images[0] || '/placeholder.png'} 
                                      alt={product.name}
                                      fill
                                      className="object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                                    />
                                 </div>
                                 <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                       <Star className="h-3 w-3 text-[#FFD700] fill-[#FFD700]" />
                                       <span className="text-fg-muted text-[10px] font-black uppercase tracking-widest">{product.ratings.average} ({product.ratings.count})</span>
                                    </div>
                                    <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight leading-tight min-h-[3rem]">{product.name}</h3>
                                    <p className="text-2xl font-black text-blue-600 tracking-tighter">₹{product.price.toLocaleString()}</p>
                                    
                                    <button 
                                      onClick={() => addToCart(product, 'single', 1)}
                                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
                                    >
                                       <ShoppingCart className="h-3 w-3" />
                                       <span>Add to Arsenal</span>
                                    </button>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>

                      {/* Specification Rows */}
                      <div className="space-y-2">
                         <div className="grid grid-cols-12 gap-8 px-6 py-4 bg-bg-muted rounded-2xl mb-4">
                            <div className="col-span-12">
                               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tactical Specifications</p>
                            </div>
                         </div>
                         
                         {specKeys.map((key) => (
                           <div key={key} className="grid grid-cols-12 gap-8 px-6 py-5 border-b border-border-base items-center hover:bg-white/5 transition-colors">
                              <div className="col-span-3">
                                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">{key}</p>
                              </div>
                              {products.map((product) => {
                                 const val = product.specifications?.[key] || product.comparableSpecs?.[key] || '-';
                                 return (
                                   <div key={product._id} className="col-span-3">
                                      {val === 'Yes' || val === true ? (
                                        <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                                           <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        </div>
                                      ) : val === 'No' || val === false ? (
                                        <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center">
                                           <X className="h-4 w-4 text-red-500" />
                                        </div>
                                      ) : (
                                        <p className="text-[12px] font-bold text-fg-primary tracking-tight whitespace-pre-line">{val}</p>
                                      )}
                                   </div>
                                 );
                              })}
                           </div>
                         ))}
                      </div>

                      {/* Special Features Row */}
                      <div className="mt-12 space-y-2">
                         <div className="grid grid-cols-12 gap-8 px-6 py-4 bg-bg-muted rounded-2xl mb-4">
                            <div className="col-span-12">
                               <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Institutional Features</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-12 gap-8 px-6 py-8 border-b border-border-base items-start">
                            <div className="col-span-3">
                               <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Multimedia Intelligence</p>
                            </div>
                            {products.map((product) => (
                               <div key={product._id} className="col-span-3 flex flex-col gap-3">
                                  {product.videoUrl && (
                                    <div className="flex items-center space-x-3 p-3 bg-white/5 border border-border-base rounded-xl">
                                       <Play className="h-4 w-4 text-blue-500 fill-blue-500" />
                                       <span className="text-[9px] font-black uppercase text-fg-primary">Field Video Ready</span>
                                    </div>
                                  )}
                                  {product.images360?.length > 0 && (
                                    <div className="flex items-center space-x-3 p-3 bg-white/5 border border-border-base rounded-xl">
                                       <Camera className="h-4 w-4 text-cyan-500" />
                                       <span className="text-[9px] font-black uppercase text-fg-primary">360° Intel Vault</span>
                                    </div>
                                  )}
                                  {!product.videoUrl && !product.images360?.length && (
                                     <p className="text-[9px] font-bold text-fg-dim uppercase">Standard Asset Coverage</p>
                                  )}
                                </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Recommendation Summary */}
                <div className="mt-24 p-12 glass-card rounded-[3rem] border border-blue-600/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full"></div>
                   <div className="flex items-start space-x-8 relative z-10">
                      <div className="p-6 bg-blue-600/10 rounded-3xl">
                         <Shield className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="space-y-4">
                         <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tight">Tactical Summary</h2>
                         <p className="text-fg-secondary font-medium leading-relaxed max-w-2xl italic">
                            Analysis complete. Based on parametric evaluation, {products.sort((a,b) => b.price - a.price)[0]?.name} offers the most robust institutional defense, while {products.sort((a,b) => a.price - b.price)[0]?.name} provides optimal value for sector-specific surveillance.
                         </p>
                         <div className="flex items-center space-x-4 pt-4">
                            <button onClick={() => router.push('/support')} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">Consult Command Hub</button>
                         </div>
                      </div>
                   </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const ProductComparisonPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ComparisonContent />
        </Suspense>
    );
};

export default ProductComparisonPage;
