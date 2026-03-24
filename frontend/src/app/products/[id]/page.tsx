"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Cpu, ChevronRight, Play, Maximize2, Activity, Heart, Share2, Info, CheckCircle2, Truck, Award, Camera, Loader2, ShoppingCart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SlotBooking from '@/components/product/SlotBooking';
import Product360Preview from '@/components/product/Product360Preview';
import CustomerReviews from '@/components/product/CustomerReviews';
import ProductCard from '@/components/product/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import Link from 'next/link';
import NextImage from 'next/image';
import BackButton from '@/components/common/BackButton';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [product, setProduct] = useState<any>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState('single');
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [viewMode, setViewMode] = useState<'gallery' | '360' | 'video'>('gallery');
  const [comparingIds, setComparingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [activeTab, setActiveTab] = useState('Mission Brief');

  React.useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      try {
        const data = await fetchWithAuth(`/products/${id}`);
        setProduct(data);
        setLoading(false);
      } catch (error) {
        console.error("Product Load Error:", error);
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);


  const handleToggleCompare = (id: string) => {
    setComparingIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }
    setIsBuying(true);
    try {
      let itemPrice = product.price;
      if (selectedPackage === 'bundle') itemPrice = Math.floor(product.price * 0.9);
      if (selectedPackage === 'perimeter') itemPrice = Math.floor(product.price * 0.8);

      const orderData = {
        products: [{ product: product._id, quantity, price: itemPrice }],
        totalAmount: itemPrice * quantity,
        deliveryAddress: "Site Address",
        installationRequired: true,
        preferredDate: new Date(Date.now() + 86400000)
      };
      await fetchWithAuth('/orders', { method: 'POST', body: JSON.stringify(orderData) });
      setShowSuccess(true);
      setTimeout(() => router.push('/tracking'), 3000);
    } catch (error) {
      console.error("Buy Error:", error);
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <h2 className="text-4xl font-black text-fg-primary uppercase">Asset Not Found</h2>
      <Link href="/products" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest">Return to Armory</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <BackButton className="mb-8" />
        
        <div className="flex items-center space-x-3 mb-16 text-[10px] font-black uppercase tracking-[0.3em] text-fg-muted">
          <Link href="/products" className="hover:text-blue-500 transition-colors">Tactical Assets</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{product.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-fg-primary">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          <div className="lg:col-span-7 space-y-10 lg:sticky lg:top-32">
            <div className="relative">
              <div className="absolute top-8 left-8 z-30 flex flex-col gap-3">
                 {['4K Ultra HD', 'AI Vision', 'IP67 Weatherproof'].map((badge, i) => (
                   <div key={i} className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
                     {badge}
                   </div>
                 ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === 'gallery' ? (
                <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative aspect-square glass-card rounded-[4rem] flex items-center justify-center p-20 overflow-hidden">
                  <NextImage src={product.images[activeImg] || '/placeholder.png'} alt={product.name} fill className="object-contain filter drop-shadow-2xl" />
                </motion.div>
              ) : viewMode === '360' ? (
                <motion.div key="360" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Product360Preview images={product.images360} />
                </motion.div>
              ) : (
                <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="aspect-square glass-card rounded-[4rem] overflow-hidden">
                  <iframe src={product.videoUrl?.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen></iframe>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center flex-wrap gap-4">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => { setViewMode('gallery'); setActiveImg(i); }} className={`w-20 h-20 glass-card rounded-2xl p-4 transition-all ${viewMode === 'gallery' && activeImg === i ? 'ring-2 ring-blue-600' : 'opacity-40'}`}>
                   <div className="relative w-full h-full"><NextImage src={img} alt="thumb" fill className="object-contain" /></div>
                </button>
              ))}
              {product.images360?.length > 0 && (
                <button onClick={() => setViewMode('360')} className={`w-20 h-20 glass-card rounded-2xl flex flex-col items-center justify-center p-2 ${viewMode === '360' ? 'ring-2 ring-blue-600' : 'opacity-40'}`}>
                  <Maximize2 className="h-4 w-4 text-blue-500 mb-1" /><span className="text-[7px] font-black uppercase text-blue-500">360°</span>
                </button>
              )}
              {product.videoUrl && (
                <button onClick={() => setViewMode('video')} className={`w-20 h-20 glass-card rounded-2xl flex flex-col items-center justify-center p-2 ${viewMode === 'video' ? 'ring-2 ring-blue-600' : 'opacity-40'}`}>
                  <Play className="h-4 w-4 text-blue-600 mb-1" /><span className="text-[7px] font-black uppercase text-blue-600">Video</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h1 className="text-6xl font-black uppercase text-fg-primary leading-none">{product.name}</h1>
                 <button 
                   onClick={() => toggleWishlist(product._id)}
                   className={`p-4 glass-card rounded-2xl transition-all ${isInWishlist(product._id) ? 'bg-red-500 text-white' : 'hover:text-red-500'}`}
                 >
                   <Heart className={`h-5 w-5 ${isInWishlist(product._id) ? 'fill-white' : ''}`} />
                 </button>
               </div>
               <p className="text-fg-muted leading-relaxed">{product.description}</p>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-5xl font-black text-fg-primary">₹{product.price.toLocaleString()}</span>
              <div className="px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-xl">
                <span className="text-orange-500 text-xs font-black uppercase italic">🔥 {product.discount || 25}% OFF</span>
              </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[11px] font-black text-fg-primary uppercase tracking-[0.2em]">Deployment Package</h4>
               <div className="grid grid-cols-1 gap-4">
                  {['single', 'bundle', 'enterprise'].map((pkg) => (
                    <button key={pkg} onClick={() => setSelectedPackage(pkg)} className={`w-full p-6 glass-card rounded-3xl text-left border ${selectedPackage === pkg ? 'bg-blue-600/10 border-blue-600' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black uppercase">{pkg} pack</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPackage === pkg ? 'border-blue-600' : ''}`}>
                          {selectedPackage === pkg && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                        </div>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-4 pt-8">
              <button onClick={handleBuyNow} disabled={isBuying} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center space-x-3">
                {isBuying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                <span>🛒 Buy & Get Installed</span>
              </button>
              <button onClick={() => addToCart(product, selectedPackage, quantity)} className="w-full py-6 bg-bg-muted border border-border-base text-fg-primary rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em]">
                Add to Tactical Arsenal
              </button>
            </div>
            <div className="pt-8 border-t border-white/5"><SlotBooking /></div>
          </div>
        </div>

        <section className="mt-32 space-y-12">
           <div className="flex justify-center">
              <div className="inline-flex p-2 bg-card/50 backdrop-blur-md rounded-[2rem] border border-border">
                 {['Mission Brief', 'Technical Specs', 'Compatibility'].map((tab) => (
                   <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 text-[10px] font-black uppercase transition-all rounded-[1.5rem] ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{tab}</button>
                 ))}
              </div>
           </div>
           
           {activeTab === 'Mission Brief' && (
             <div className="p-12 glass-card rounded-[3rem] border border-border">
                <h3 className="text-3xl font-black uppercase mb-6">Strategic Oversight</h3>
                <p className="text-slate-500 leading-relaxed max-w-3xl">Military-grade optics paired with AI-matrix real-time processing. Optimized for elite sectors and critical infrastructure surveillance.</p>
             </div>
           )}
           {activeTab === 'Technical Specs' && (
             <div className="p-12 glass-card rounded-[3rem] border border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {Object.entries(product.specifications || {}).map(([key, val]: any) => (
                     <div key={key} className="space-y-1"><p className="text-[10px] uppercase text-slate-500 font-bold">{key}</p><p className="font-bold">{val || '-'}</p></div>
                   ))}
                </div>
             </div>
           )}
           {activeTab === 'Compatibility' && (
             <div className="p-12 glass-card rounded-[3rem] border border-border">
                <ul className="space-y-4 font-bold text-slate-500">
                  <li className="flex items-center space-x-3"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>SK Matrix NVR Series Compatible</span></li>
                  <li className="flex items-center space-x-3"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>ONVIF Profile S/G/T compliant</span></li>
                </ul>
             </div>
           )}
        </section>

        <div className="mt-40">
           <div className="flex items-center space-x-6 mb-16">
              <h3 className="text-4xl lg:text-5xl font-black text-fg-primary uppercase tracking-tight">Tactical <span className="text-fg-muted italic">Synergies</span></h3>
              <div className="h-px flex-1 bg-border-base"></div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {/* This would normally be a separate loop, simplified here for reliability */}
              <p className="col-span-4 text-center text-fg-muted uppercase text-[10px] font-bold">Scanning for related assets...</p>
           </div>
        </div>

        <section className="mt-40">
           <CustomerReviews productId={product._id} />
        </section>

        <AnimatePresence>
          {comparingIds.length > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-blue-600 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-8 text-white">
               <div className="text-[10px] font-black uppercase tracking-widest">{comparingIds.length} Assets in comparison buffer</div>
               <button onClick={() => router.push(`/compare?ids=${comparingIds.join(',')}`)} className="px-6 py-2 bg-white text-blue-600 rounded-xl font-black text-[9px] uppercase">Compare Now</button>
               <button onClick={() => setComparingIds([])} className="opacity-60 hover:opacity-100"><Info className="h-4 w-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
             <div className="glass-card max-w-md w-full p-12 text-center rounded-[3rem] border border-blue-600/20">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"><CheckCircle2 className="h-12 w-12 text-white" /></div>
                <h3 className="text-3xl font-black text-fg-primary uppercase mb-4">Deployment Syncing</h3>
                <p className="text-fg-secondary italic font-medium">Field units are coordinating your site mission.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailsPage;
