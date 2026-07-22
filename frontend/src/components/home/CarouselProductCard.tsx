"use client";
import React, { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, Heart } from 'lucide-react';
import { getImageUrl } from '@/utils/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface CarouselProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
    images?: string[];
    description?: string;
  };
  index: number;
}

export default function CarouselProductCard({ product, index }: CarouselProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const fallbackImage = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop';
  const imageUrl = product.images?.[0] || product.image || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({ 
      id: product._id, 
      name: product.name, 
      price: product.price, 
      image: imageUrl, 
      category: product.category 
    }, 'single', 1);
    
    if (!isAuthenticated) {
      router.push(`/login`);
      return;
    }
    router.push('/cart');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.1, 0.5) }}
      className="h-[520px] w-full"
    >
      <Link href={`/products/${product._id}`} className="block h-full outline-none">
        <div className="group flex flex-col justify-between bg-white/80 backdrop-blur-[18px] border border-white/25 rounded-[24px] shadow-[0_12px_35px_rgba(0,0,0,0.08)] p-5 h-full transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]">
          
          {/* Top Badges */}
          <div className="flex justify-between items-center z-10 shrink-0 mb-3">
            <span className="px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-widest rounded-full">
              {product.category || 'Product'}
            </span>
          </div>

          {/* Image Container */}
          <div className="h-[220px] w-full relative shrink-0 rounded-2xl bg-transparent flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              className="w-full h-full relative"
            >
              <NextImage 
                src={imgError ? fallbackImage : getImageUrl(imageUrl)} 
                alt={product.name}
                fill
                className="object-contain filter transition-transform duration-500 group-hover:scale-[1.08]"
                onError={() => setImgError(true)}
              />
            </motion.div>
          </div>

          {/* Title */}
          <div className="h-[70px] shrink-0 flex items-start mt-4">
            <h3 className="text-[24px] md:text-[26px] font-[700] text-[#0F172A] leading-tight line-clamp-2 group-hover:text-[#2563EB] transition-colors">
              {product.name}
            </h3>
          </div>
            
          {/* Description */}
          <div className="h-[50px] shrink-0 flex items-start">
            <p className="text-[14px] text-[#475569] font-medium line-clamp-2">
              {product.description || "Premium surveillance equipment and smart security solutions for modern needs."}
            </p>
          </div>

          {/* Price & Icons Row */}
          <div className="flex items-center justify-between shrink-0 mb-3 mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Price</span>
              <span className="text-[24px] font-[800] text-[#0F172A]">&#8377;{product.price?.toLocaleString('en-IN') || '0'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[12px] font-bold text-amber-700">4.9</span>
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all hover:bg-rose-50 hover:text-rose-500"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button 
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                aria-label="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buy Now Button */}
          <button 
            onClick={handleAddToCart}
            className="w-full h-[52px] rounded-[16px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-[600] flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Now
          </button>

        </div>
      </Link>
    </motion.div>
  );
}
