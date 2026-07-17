"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import CarouselProductCard from './CarouselProductCard';

const CATEGORIES = [
  'All',
  'CCTV Cameras',
  'DVR',
  'NVR',
  'Hard Disk',
  'Laptops',
  'Printers',
  'Scanners',
  'TV',
  'Networking'
];

interface StrategicHardwareCarouselProps {
  products: any[];
  loading: boolean;
}

export default function StrategicHardwareCarousel({ products, loading }: StrategicHardwareCarouselProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Custom navigation refs
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [swiperInit, setSwiperInit] = useState(false);

  useEffect(() => {
    // Initial filter setup
    filterProducts('All');
  }, [products]);

  const filterProducts = (category: string) => {
    setIsAnimating(true);
    setActiveCategory(category);
    
    setTimeout(() => {
      if (category === 'All') {
        setFilteredProducts(products);
      } else {
        const filtered = products.filter(p => 
          p.category?.toLowerCase() === category.toLowerCase()
        );
        setFilteredProducts(filtered);
      }
      setIsAnimating(false);
    }, 300); // Wait for fade out before changing data
  };

  return (
    <div className="w-full relative">
      {/* Category Filter */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => filterProducts(category)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              activeCategory === category 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-1' 
                : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="relative group/carousel px-4 md:px-12">
        {loading ? (
          <div className="flex justify-center items-center h-[460px] w-full">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex justify-center items-center h-[460px] w-full bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No products found in this category.</p>
          </div>
        ) : (
          <motion.div
            initial={false}
            animate={{ opacity: isAnimating ? 0 : 1, y: isAnimating ? 10 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-full relative"
          >
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              speed={800}
              loop={filteredProducts.length > 5}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              pagination={{
                clickable: true,
                el: '.swiper-custom-pagination',
                bulletClass: 'swiper-custom-bullet',
                bulletActiveClass: 'swiper-custom-bullet-active',
              }}
              onInit={() => setSwiperInit(true)}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
                1400: { slidesPerView: 5 },
              }}
              className="!pb-12"
            >
              {filteredProducts.map((product, index) => (
                <SwiperSlide key={`${product._id}-${index}`} className="h-auto">
                  <CarouselProductCard product={product} index={index} />
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Custom Pagination Container */}
            <div className="swiper-custom-pagination flex justify-center gap-2 mt-8"></div>
          </motion.div>
        )}

        {/* Custom Navigation Arrows */}
        <button
          ref={prevRef}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-[20px] border border-white/20 text-blue-900 shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-[1.08] hover:bg-white hover:text-blue-600 hover:shadow-blue-500/30 ${filteredProducts.length <= 1 ? 'hidden' : ''}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          ref={nextRef}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-[20px] border border-white/20 text-blue-900 shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-[1.08] hover:bg-white hover:text-blue-600 hover:shadow-blue-500/30 ${filteredProducts.length <= 1 ? 'hidden' : ''}`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <style jsx global>{`
        .swiper-custom-bullet {
          width: 8px;
          height: 8px;
          background-color: #d1d5db; /* light gray */
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .swiper-custom-bullet-active {
          width: 24px;
          border-radius: 999px;
          background-color: #2563eb; /* blue-600 */
        }
      `}</style>
    </div>
  );
}
