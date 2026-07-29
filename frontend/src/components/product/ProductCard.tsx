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
  offerPercentage?: number;
  tags?: string[];
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
  discount = 0,
  offerPercentage = 0,
  tags = [],
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
    if (!isAuthenticated) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }
    toggleWishlist(id);
  };

  const [imgError, setImgError] = React.useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop'; // Modern CCTV/Security background

  if (type === 'category') {
    return (
      <Link href={`/products?category=${category}`} className="group block h-full">
        <div className="bg-bg-surface rounded-[2rem] border border-border-base overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-blue/10 p-4 flex flex-col items-center text-center space-y-4 h-full shadow-lg">
          <div className="w-full aspect-square rounded-2xl bg-bg-muted flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-700 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 to-transparent opacity-50"></div>
            <NextImage 
              src={imgError ? fallbackImage : getImageUrl(image)} 
              alt={name} 
              fill 
              className="object-contain filter drop-shadow-xl p-6 relative z-10 transition-all duration-500"
              onError={() => setImgError(true)}
            />
          </div>
          <div className="space-y-1 pb-2">
            <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight group-hover:text-primary-blue transition-colors leading-tight">{name}</h3>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-px w-4 bg-primary-blue/30"></div>
              <p className="text-[8px] font-black text-primary-blue/60 uppercase tracking-[0.3em]">Explore System</p>
              <div className="h-px w-4 bg-primary-blue/30"></div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-card dark:bg-white/[0.04] backdrop-blur-[20px] rounded-[28px] border border-border-base dark:border-white/[0.12] overflow-hidden hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)] transition-all flex flex-col md:flex-row md:items-center p-6 md:p-8 gap-8 group mx-auto w-full max-w-5xl">
        <div className="w-full md:w-56 aspect-video md:aspect-square bg-bg-muted dark:bg-white/[0.05] rounded-2xl overflow-hidden shrink-0 relative flex items-center justify-center">
          <NextImage src={getImageUrl(image)} alt={name} fill className="object-contain p-6 group-hover:scale-[1.12] transition-transform duration-700 ease-out filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]" />
          {/* Quick Actions (Staggered Floating Icons) */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 z-10 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button 
                onClick={handleToggleWishlist}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 transform hover:scale-110 border ${isWishlisted ? 'bg-red-500/90 border-red-400 text-white' : 'bg-black/40 border-white/20 text-white hover:bg-red-500/80 hover:border-red-400'}`}
             >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
             </button>
             <button 
               onClick={() => onCompare?.(id)}
               className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 transform hover:scale-110 border ${isComparing ? 'bg-blue-600/90 border-blue-400 text-white' : 'bg-black/40 border-white/20 text-white hover:bg-blue-600/80 hover:border-blue-400'}`}
             >
               <CheckCircle2 className="h-4 w-4" />
             </button>
             <Link 
               href={`/products/${id}`}
               className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 transform hover:scale-110 border bg-black/40 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
             >
               <Eye className="h-4 w-4" />
             </Link>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{category}</p>
                {tags && tags.length > 0 && tags.slice(0,2).map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-bg-card/80 dark:bg-white/10 text-fg-primary dark:text-white border border-border-base dark:border-white/20 rounded-md text-[8px] font-black uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
                {(discount > 0 || offerPercentage > 0) && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-md">
                    -{offerPercentage > 0 ? offerPercentage : discount}% OFF
                  </span>
                )}
              </div>
              <h3 className="text-[24px] font-bold text-fg-primary dark:text-white uppercase tracking-tight">{name}</h3>
            </div>
            <div className="flex items-center space-x-1.5 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shadow-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse shrink-0"></div>
               <span className="text-[10px] font-black uppercase tracking-wider text-green-400">In Stock</span>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 max-w-2xl leading-relaxed">{description}</p>
          <div className="flex items-center justify-between mt-auto pt-6 border-t border-border-base dark:border-white/[0.08]">
            <div className="flex items-baseline space-x-3">
              <span className="text-[32px] font-black text-fg-primary dark:text-white tracking-tighter drop-shadow-sm">&#8377;{price.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 line-through">&#8377;{oldPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/products/${id}`} className="px-6 py-3.5 bg-bg-muted dark:bg-white/[0.05] border border-border-base dark:border-white/[0.15] hover:border-fg-muted dark:hover:border-white/[0.3] text-fg-primary dark:text-white rounded-[16px] font-black text-[10px] uppercase tracking-wider transition-all flex items-center space-x-2 backdrop-blur-sm group/btn">
                <Info className="h-4 w-4 text-fg-muted group-hover/btn:text-fg-primary dark:text-slate-300 dark:group-hover/btn:text-white transition-colors" />
                <span>Details</span>
              </Link>
              <button 
                onClick={handleAddToCart}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[16px] font-black text-[10px] uppercase tracking-wider hover:from-blue-500 hover:to-indigo-500 transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(79,70,229,0.4)] flex items-center space-x-2 group/add"
              >
                <ShoppingCart className="h-4 w-4 group-hover/add:-rotate-12 transition-transform" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-[520px] rounded-[28px] bg-card dark:bg-white/[0.06] backdrop-blur-[20px] border border-border-base dark:border-white/[0.12] transition-all duration-500 group relative flex flex-col p-4 mx-auto"
      style={{
        boxShadow: '0 25px 60px rgba(0,0,0,0.1)',
        transformStyle: 'preserve-3d'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-12px) scale(1.03) rotateX(3deg)';
        e.currentTarget.style.boxShadow = '0 35px 70px rgba(0,0,0,0.15), 0 0 40px rgba(59,130,246,0.15)';
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
        e.currentTarget.style.boxShadow = '0 25px 60px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = '';
      }}
    >
      {/* Hero Image Workspace */}
      <div className="h-[280px] rounded-[22px] bg-bg-muted dark:bg-gradient-to-br from-white/[0.1] to-white/[0.02] border border-border-base dark:border-white/[0.05] shadow-inner relative overflow-hidden group/img mb-5 flex-shrink-0">
        <Link href={`/products/${id}`} className="block w-full h-full relative z-0">
          <NextImage 
            src={getImageUrl(image)} 
            alt={name} 
            fill
            className="object-contain p-6 group-hover/img:scale-[1.12] group-hover/img:rotate-[3deg] transition-transform duration-700 ease-out filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]"
          />
        </Link>
        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/img:opacity-100 pointer-events-none transition-opacity duration-500 mix-blend-overlay"></div>
        
        {/* Soft Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.15] to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-700 pointer-events-none transform -skew-y-12 translate-y-[-100%] group-hover/img:translate-y-[200%]"></div>
        
        {/* Quick Actions (Staggered Floating Icons) */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 pointer-events-none group-hover:pointer-events-auto">
          <button 
             onClick={handleToggleWishlist}
             className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 delay-75 border ${isWishlisted ? 'bg-red-500/90 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-black/40 border-white/20 text-white hover:bg-red-500/80 hover:border-red-400'}`}
             title="Wishlist"
          >
             <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>
          <button 
            onClick={() => onCompare?.(id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 delay-100 border ${isComparing ? 'bg-blue-600/90 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'bg-black/40 border-white/20 text-white hover:bg-blue-600/80 hover:border-blue-400'}`}
            title="Compare"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <Link 
            href={`/products/${id}`}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 delay-150 border bg-black/40 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
            title="Quick View"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
          {(discount > 0 || offerPercentage > 0) && (
            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-[0_4px_15px_rgba(239,68,68,0.5)] uppercase tracking-wider">
              -{offerPercentage > 0 ? offerPercentage : discount}% OFF
            </span>
          )}
          {tags && tags.length > 0 && tags.slice(0,1).map((tag, idx) => (
            <span key={idx} className="bg-bg-card/80 dark:bg-white/10 backdrop-blur-md border border-border-base dark:border-white/20 text-fg-primary dark:text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              🔥 {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Product Details Workspace */}
      <div className="flex-1 flex flex-col px-2">
        <div className="space-y-1 mb-2 flex-1">
           <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{category}</span>
              <div className="flex items-center space-x-1">
                 <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                 <span className="text-[11px] font-bold text-fg-primary dark:text-white">{rating}</span>
              </div>
           </div>
           <h3 className="text-[20px] font-bold text-fg-primary dark:text-white tracking-tight leading-tight line-clamp-1">{name}</h3>
           <p className="text-slate-600 dark:text-slate-300 text-[12px] leading-relaxed font-medium line-clamp-2 mt-2">{description}</p>
        </div>

        <div className="mt-auto space-y-5">
           <div className="flex items-end justify-between">
              <div className="flex items-baseline space-x-3">
                 <span className="text-[28px] font-black text-fg-primary dark:text-white tracking-tighter drop-shadow-sm">&#8377;{price.toLocaleString()}</span>
                 <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 line-through">&#8377;{oldPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse shrink-0"></div>
                 <span className="text-[9px] font-black uppercase tracking-wider text-green-400 leading-none mt-px">Stock</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[16px] font-black text-[10px] uppercase tracking-wider transform active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center gap-2 group/btn"
              >
                 <ShoppingCart className="h-3.5 w-3.5 group-hover/btn:rotate-12 transition-transform" />
                 Buy Now
              </button>
              <Link href={`/products/${id}`} className="flex-1 py-3.5 bg-bg-muted dark:bg-white/[0.05] backdrop-blur-sm border border-border-base dark:border-white/[0.15] text-fg-primary dark:text-white rounded-[16px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center hover:bg-bg-surface dark:hover:bg-white/[0.15] dark:hover:border-white/30 transition-all text-center">
                 View Details
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
