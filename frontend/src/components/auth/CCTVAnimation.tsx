"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Camera, Shield, Eye, Scan, Cpu } from 'lucide-react';

const CCTVAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete
          });
        }
      });

      // 1. Initial UI flare
      tl.fromTo(overlayRef.current, 
        { opacity: 0, scale: 1.2 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power4.out" }
      );

      // 2. Lens "Power Up"
      tl.fromTo(lensRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.75)" },
        "-=0.2"
      );

      // 3. Scanning Effect
      tl.to(".scan-line", {
        y: "300%",
        duration: 0.8,
        repeat: 1,
        yoyo: true,
        ease: "none"
      }, "-=0.2");

      // 4. Text Data Stream
      tl.fromTo(".hud-text",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.3, ease: "power2.out" },
        "-=0.8"
      );

      // 5. Final Flash
      tl.to(lensRef.current, {
        boxShadow: "0 0 100px 20px rgba(59, 130, 246, 0.5)",
        duration: 0.15,
        yoyo: true,
        repeat: 3
      });

    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] bg-background flex items-center justify-center overflow-hidden font-mono">
      {/* Professional Grid Overlay */}
      <div ref={overlayRef} className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      {/* Scanning Line */}
      <div className="scan-line absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_#3b82f6] opacity-50 z-10"></div>

      <div className="relative flex flex-col items-center">
        {/* The "Lens" Container */}
        <div ref={lensRef} className="w-64 h-64 rounded-full bg-bg-muted border-4 border-blue-500/30 flex items-center justify-center relative group">
           <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping"></div>
           <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-600/20 to-transparent border border-white/5 flex items-center justify-center overflow-hidden">
              <Camera className="h-24 w-24 text-blue-500" />
              {/* Aperture Blades (CSS Visual) */}
              <div className="absolute inset-0 opacity-30">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-blue-500/20 rotate-0"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-blue-500/20 rotate-45"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-blue-500/20 rotate-90"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-blue-500/20 rotate-135"></div>
              </div>
           </div>
           
           {/* HUD Elements */}
           <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap hud-text flex items-center gap-2 text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase">
             <Eye className="h-3 w-3" /> System_Auth_Active
           </div>
           <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap hud-text flex flex-col items-center gap-2">
             <span className="text-fg-primary text-sm font-black tracking-widest uppercase">Initializing Secure Terminal</span>
             <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-1 bg-blue-600/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* Floating Data Nodes */}
        <div className="absolute -left-48 top-0 hud-text space-y-4">
           <div className="flex items-center gap-3 text-cyan-400">
              <Shield className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-widest">ENCRYPTION: AES_256</span>
           </div>
           <div className="flex items-center gap-3 text-cyan-400">
              <Scan className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-widest">RECOGNITION: USER_01</span>
           </div>
        </div>

        <div className="absolute -right-48 bottom-0 hud-text space-y-4 text-right">
           <div className="flex items-center justify-end gap-3 text-blue-400">
              <span className="text-[10px] font-bold tracking-widest">STATUS: AUTHORIZED</span>
              <Cpu className="h-4 w-4" />
           </div>
           <div className="text-[10px] font-bold text-fg-dim tracking-widest underline decoration-blue-500/50">
             SYSTEM_ARCH: SK_V2.0
           </div>
        </div>
      </div>

      {/* Extreme Borders */}
      <div className="absolute top-0 left-0 p-8">
        <div className="w-12 h-12 border-t-2 border-l-2 border-blue-500/50"></div>
      </div>
      <div className="absolute top-0 right-0 p-8">
        <div className="w-12 h-12 border-t-2 border-r-2 border-blue-500/50"></div>
      </div>
      <div className="absolute bottom-0 left-0 p-8">
        <div className="w-12 h-12 border-b-2 border-l-2 border-blue-500/50"></div>
      </div>
      <div className="absolute bottom-0 right-0 p-8">
        <div className="w-12 h-12 border-b-2 border-r-2 border-blue-500/50"></div>
      </div>
    </div>
  );
};

export default CCTVAnimation;
