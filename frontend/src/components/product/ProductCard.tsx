"use client";
import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ShoppingCart, Heart, Star, ChevronRight, CheckCircle2, Eye, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { getImageUrl } from '@/utils/api';

interface ProductCardPrSystems {
  id: string;
  name: string;
  price?: number;
  oldPrice?: number;
  rating?: number;
  category: string;
  image: string;
  description?: string;
  discount?: number;
  stock?: boolean;
  onCompare?: (id: string) => void;
  isComparing?: boolean;
  viewMode?: 'grid' | 'list';
  type?: 'product' | 'category';
}

const ProductCard = ({ 
  id, 
  name, 
  price = 0, 
  oldPrice = price * 1.3, 
  rating = 4.8, 
  category, 
  image, 
  description = "Elite security surveillance Technician.",
  discount = 25,
  stock = true,
  onCompare,
  isComparing = false,
  viewMode = 'grid',
  type = 'product'
}: ProductCardPrSystems) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({ id, name, price, image, category }, 'single', 1);
    
    if (!isAuthenticated) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }
    
    router.push('/cart');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  if (type === 'category') {
    return (
      <Link href={`/products?category=${category}`} className="group block h-full">
        <div className="glass-card rounded-[3rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-600/10 border-blue-600/5 hover:border-blue-600/30 p-6 flex flex-col items-center text-center space-y-6">
          <div className="w-full aspect-square rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-transparent flex items-center justify-center p-10 group-hover:scale-105 transition-transform duration-700 relative">
            <NextImage src={getImageUrl(image)} alt={name} fill className="object-contain filter drop-shadow-2xl p-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight group-hover:text-blue-500 transition-colors">{name}</h3>
            <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.3em]">Explore Collection</p>
          </div>
        </div>
      </Link>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-card rounded-[2rem] border border-card-border overflow-hidden hover:shadow-xl transition-all flex items-center p-6 gap-8 group">
        <div className="w-48 aspect-square bg-muted rounded-2xl overflow-hidden shrink-0 relative">
          <NextImage src={getImageUrl(image)} alt={name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{category}</p>
              <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight">{name}</h3>
            </div>
            <div className="flex items-center space-x-3">
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-2.5 rounded-xl transition-all border ${isWishlisted ? 'bg-red-500 border-red-500 text-white' : 'bg-bg-card/60 border-border-base text-fg-primary hover:bg-red-500 hover:text-white'}`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
                </button>
               <button 
                  onClick={() => onCompare?.(id)}
                  className={`p-2.5 rounded-xl border transition-all ${isComparing ? 'bg-blue-600 border-blue-600 text-white' : 'bg-bg-card/60 border-border-base text-fg-primary hover:bg-blue-600/10'}`}
               >
                  <CheckCircle2 className="h-4 w-4" />
               </button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 max-w-2xl">{description}</p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-fg-primary tracking-tighter self-center">₹{price.toLocaleString()}</span>
              <span className="text-xs font-bold text-fg-muted line-through">₹{oldPrice.toLocaleString()}</span>
              <span className="text-green-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-green-500/10 rounded-xl flex items-center h-fit translate-y-[-2px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                In Service
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/products/${id}`} className="px-6 py-4 border border-border-base rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-muted transition-all flex items-center space-x-2 group/btn">
                <Eye className="h-4 w-4 group-hover/btn:text-blue-600 transition-colors" />
                <span>View Details</span>
              </Link>
              <button 
                onClick={handleAddToCart}
                className="px-8 py-4 bg-fg-primary text-bg-surface rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all h-full relative flex flex-col p-4">
      {/* Visual Workspace */}
      <div className="block relative overflow-hidden aspect-square bg-bg-muted rounded-[2.5rem] group/img mb-6">
        <Link href={`/products/${id}`} className="block w-full h-full relative">
          <NextImage 
            src={getImageUrl(image)} 
            alt={name} 
            fill
            className="object-contain p-8 group-hover/img:scale-110 transition-transform duration-700 ease-out"
          />
        </Link>
        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/img:opacity-100 pointer-events-none transition-opacity"></div>
        
        {/* Actions Overlay */}
        <div className="absolute top-4 inset-x-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
          <button 
             onClick={() => onCompare?.(id)}
             className={`p-3 backdrop-blur-xl rounded-2xl transition-all border ${isComparing ? 'bg-blue-600 border-blue-600 text-white' : 'bg-bg-surface/50 border-border-base text-fg-primary hover:bg-blue-600 hover:text-white'}`}
          >
             <CheckCircle2 className="h-4 w-4" />
          </button>
          <button 
            onClick={handleToggleWishlist}
            className={`p-3 backdrop-blur-xl rounded-2xl transition-all border ${isWishlisted ? 'bg-red-500 border-red-500 text-white' : 'bg-bg-surface/50 border-border-base text-fg-primary hover:bg-red-500 hover:text-white'}`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

        {discount && (
          <div className="absolute bottom-6 left-6 bg-blue-600 text-white text-[8px] font-black px-4 py-2 rounded-xl shadow-2xl uppercase tracking-[0.2em]">
            -{discount}% OFF
          </div>
        )}
      </div>

      {/* Strategic Intelligence */}
      <div className="px-6 pb-6 flex-1 flex flex-col">
        <div className="space-y-3 mb-6">
           <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">{category}</span>
              <div className="flex items-center space-x-1.5 opacity-60">
                 <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                 <span className="text-[9px] font-black">{rating}</span>
              </div>
           </div>
           <h3 className="text-xl font-black text-fg-primary uppercase tracking-tighter group-hover:text-blue-500 transition-colors line-clamp-1">{name}</h3>
           <p className="text-fg-muted text-[11px] leading-relaxed font-medium line-clamp-2">{description}</p>
        </div>

        <div className="mt-auto space-y-6">
           <div className="flex items-end justify-between">
              <div>
                 <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-black text-fg-primary tracking-tighter">₹{price.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-fg-muted line-through">₹{oldPrice.toLocaleString()}</span>
                 </div>
              </div>
               {user?.role === 'admin' && (
                  <div className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-wider ${stock ? 'text-blue-600' : 'text-danger-red'} translate-y-[-1px]`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${stock ? 'bg-blue-600 animate-pulse' : 'bg-danger-red'} shrink-0`}></div>
                     <span className="leading-none">{stock ? 'In Stock' : 'Offline'}</span>
                  </div>
               )}
           </div>

           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] transform active:scale-95 transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                 Buy Now
              </button>
              <Link href={`/products/${id}`} className="flex-1 py-4 bg-bg-muted border border-border-base text-fg-primary rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center hover:bg-bg-surface transition-all text-center">
                 Details
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
