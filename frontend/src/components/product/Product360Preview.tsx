"use client";
import React, { useState, useRef } from 'react';
import { RotateCw, Maximize2, Camera, Shield, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';

const Product360Preview = ({ images = ["/products/dome_4k.png"] }: { images?: string[] }) => {
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      setRotation((prev) => (prev + e.movementX * 0.5) % 360);
    }
    
    if (isZooming && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    }
  };

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const activeIndex = Math.floor((normalizedRotation / 360) * images.length);

  return (
    <>
      <div 
        ref={containerRef}
        className="bg-card p-10 rounded-[3rem] relative overflow-hidden group border border-border"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute top-10 right-10 flex items-center space-x-3 z-20">
           <div className="px-4 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-xl backdrop-blur-md flex items-center">
              <RotateCw className="h-3 w-3 mr-2 animate-spin-slow" />
              360° Professional Orbit
           </div>
           <button 
             onClick={() => setIsFullscreen(true)}
             className="p-2 bg-white/5 hover:bg-blue-600 text-white rounded-xl border border-white/10 transition-all"
           >
              <Maximize2 className="h-4 w-4" />
           </button>
        </div>

        <div className="absolute bottom-10 left-10 z-20">
           <button 
             onMouseEnter={() => setIsZooming(true)}
             onMouseLeave={() => setIsZooming(false)}
             className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center"
           >
              <ZoomIn className="h-3 w-3 mr-2" />
              Hover to Recon
           </button>
        </div>

        <div 
          className="aspect-square relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          {/* HUD Markers */}
          <div className="absolute inset-10 border border-cyan-500/5 rounded-full animate-pulse-slow pointer-events-none"></div>
          <div className="absolute inset-20 border border-blue-500/5 rounded-full pointer-events-none"></div>
          
          {/* Crosshair HUD */}
          <div className="absolute top-1/2 left-4 right-4 h-px bg-white/5 pointer-events-none"></div>
          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/5 pointer-events-none"></div>

          {/* Rotating Product Container */}
          <motion.div 
            className="relative w-full h-full flex items-center justify-center"
            style={{ 
              transform: `perspective(1000px) rotateY(${rotation}deg)`,
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="relative overflow-hidden w-72 h-72 rounded-2xl">
               <motion.div
                 className="w-full h-full relative"
                 animate={{
                   scale: isZooming ? 2.5 : 1,
                   transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 120 }}
               >
                 <NextImage 
                  src={images[activeIndex]} 
                  alt="360 view" 
                  fill
                  className="object-contain drop-shadow-[0_0_50px_rgba(37,99,235,0.3)]" 
                 />
               </motion.div>
               {/* Dynamic Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
            </div>
          </motion.div>

          {/* Drag Hint */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent flex items-center justify-center pointer-events-none">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/10">Refinery Matrix Active</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-10"
          >
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-10 right-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="w-full max-w-5xl aspect-square flex items-center justify-center relative">
               <NextImage src={images[activeIndex]} alt="Full screen preview" fill className="object-contain filter drop-shadow-[0_0_100px_rgba(37,99,235,0.2)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Product360Preview;
