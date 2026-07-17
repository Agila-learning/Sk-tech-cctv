"use client";
import React, { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, CheckCircle2 } from 'lucide-react';
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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.1, 0.5), ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full"
    >
      <Link href={`/products/${product._id}`} className="block h-full outline-none">
        <div className="group flex flex-col bg-white border border-gray-100 rounded-[2rem] p-6 h-[460px] relative transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-100">
          
          {/* Top Badges */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
              {product.category || 'Product'}
            </span>
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full shadow-sm border border-gray-100">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-gray-700">4.9</span>
            </div>
          </div>

          {/* Image Container */}
          <div className="h-[220px] w-full relative mb-6 rounded-2xl bg-gray-50/50 flex items-center justify-center p-8 overflow-hidden group-hover:bg-blue-50/30 transition-colors">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <NextImage 
                src={imgError ? fallbackImage : getImageUrl(imageUrl)} 
                alt={product.name}
                fill
                className="object-contain filter drop-shadow-xl transition-all duration-700 group-hover:scale-[1.08] group-hover:rotate-3"
                onError={() => setImgError(true)}
              />
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 text-left">
            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            
            <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4 flex-1">
              {product.description || "Premium surveillance equipment."}
            </p>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 w-full gap-2 overflow-visible">
              <div className="flex flex-col flex-shrink-0 max-w-[50%]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                <span className="text-xl lg:text-2xl font-black text-gray-900 truncate">₹{product.price?.toLocaleString('en-IN') || '0'}</span>
              </div>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* onCompare logic */ }}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-lg shrink-0"
                  aria-label="Compare"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white hover:shadow-lg shrink-0"
                  aria-label="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={handleAddToCart}
                  className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:shadow-lg shrink-0 group/btn"
                  title="Add to Cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover/btn:scale-110" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
