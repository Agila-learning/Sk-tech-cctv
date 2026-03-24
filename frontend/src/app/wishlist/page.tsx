"use client";
import React, { useEffect, useState } from 'react';
import { Shield, Zap, X, Trash2, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';

import { fetchWithAuth, API_URL } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { toggleWishlist } = useWishlist();

  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          const data = await fetchWithAuth('/wishlist');
          setWishlistItems(data || []);
        } else {
          const ids = JSON.parse(localStorage.getItem('sk_wishlist') || '[]');
          if (ids.length > 0) {
             const data = await fetchWithAuth('/products');
             const allProducts = data.products || data || [];
             setWishlistItems(allProducts.filter((p: any) => ids.includes(p._id || p.id)));
          }
        }
      } catch (e) {
        console.error("Failed to load wishlist:", e);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
  }, [isAuthenticated]);

  const removeItem = async (id: string) => {
    toggleWishlist(id);
    setWishlistItems(prev => prev.filter(p => (p._id || p.id) !== id));
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col pt-32">
      <Navbar />
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
        <div className="mb-20 space-y-4">
           <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Secured Asset Vault</p>
           <h1 className="text-6xl font-black text-fg-primary tracking-tighter uppercase font-poppins">Technical <span className="text-slate-500 italic">Nodes</span></h1>
           <p className="text-slate-400 font-manrope font-medium text-lg max-w-2xl">Your curated selection of elite surveillance hardware currently earmarked for Service.</p>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {wishlistItems.map((product) => (
               <div key={product.id} className="relative group">
                  <div className="absolute top-8 right-8 z-20">
                    <button 
                      onClick={() => removeItem(product.id)}
                      className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 shadow-xl shadow-red-500/10"
                    >
                       <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ProductCard {...product} />
               </div>
             ))}
          </div>
        ) : (
          <div className="py-32 text-center glass-card rounded-[4rem] border-2 border-dashed border-white/5 space-y-10">
             <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto">
               <Shield className="h-10 w-10 text-slate-700" />
             </div>
             <div className="space-y-3">
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Vault Offline</h3>
                <p className="text-slate-500 font-manrope font-medium">No Professional nodes secured in your wishlist yet.</p>
             </div>
             <button 
               onClick={() => window.location.href = '/products'}
               className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all active:scale-95"
             >
               Analyze Products
             </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;
