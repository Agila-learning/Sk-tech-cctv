"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import gsap from 'gsap';
import SplitType from 'split-type';

export default function AnimatedLogo({ forceWhite = false }: { forceWhite?: boolean }) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(true); // Default true to prevent flash, then update in useEffect

  useEffect(() => {
    // Check session storage to only animate once per session
    const isAnimated = sessionStorage.getItem('skLogoAnimated');
    
    if (isAnimated) {
      // Already animated, ensure styles are normal
      gsap.set(textRef.current, { opacity: 1 });
      gsap.set(scannerRef.current, { display: 'none' });
      return;
    }

    setHasAnimated(false);
    sessionStorage.setItem('skLogoAnimated', 'true');

    if (!textRef.current) return;

    // 1. Split Text
    const splitText = new SplitType(textRef.current, { types: 'chars' });
    
    // Create Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Clean up SplitType so it behaves normally for responsive layouts
        splitText.revert();
        setHasAnimated(true);
      }
    });

    // 2. Setup Initial States
    gsap.set(splitText.chars, {
      opacity: 0,
      y: 40,
      rotateX: -90,
      scale: 0.5,
      transformOrigin: '50% 50% -50px',
      color: '#3b82f6' // start blue
    });

    gsap.set(scannerRef.current, {
      top: '0%',
      opacity: 0,
      height: '2px',
      boxShadow: '0 0 10px 2px rgba(59, 130, 246, 0.8)'
    });

    // 3. Animation Sequence
    // Scanner Beam down
    tl.to(scannerRef.current, {
      opacity: 0.8,
      duration: 0.2,
      ease: 'power2.in'
    }, 0)
    .to(scannerRef.current, {
      top: '100%',
      duration: 1.5,
      ease: 'linear'
    }, 0)
    .to(scannerRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.out'
    }, 1.3);

    // Characters spring in
    tl.to(splitText.chars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      color: (i, target) => {
        // First two letters (SK) remain white/black (fg-primary), rest blue
        return i < 2 ? '' : '#3b82f6';
      },
      stagger: 0.05,
      duration: 1.2,
      ease: 'elastic.out(1, 0.5)'
    }, 0.2);

    // Light Sweep / Glow Pulse
    tl.fromTo(glowRef.current, 
      { left: '-100%', opacity: 0 },
      { left: '100%', opacity: 0.5, duration: 1, ease: 'power2.inOut' },
      1.0
    );

    return () => {
      tl.kill();
      if (splitText) splitText.revert();
    };
  }, []);

  return (
    <Link 
      href="/" 
      ref={containerRef}
      className="flex items-center space-x-3 group shrink-0 relative overflow-hidden p-2 -m-2 rounded-xl"
    >
      {/* CCTV Scanning Beam (only active during animation) */}
      {!hasAnimated && (
        <div 
          ref={scannerRef}
          className="absolute left-0 right-0 w-full bg-blue-500 z-20 pointer-events-none"
        />
      )}

      {/* Light Sweep Glow */}
      <div 
        ref={glowRef}
        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[30deg] z-10 pointer-events-none opacity-0"
      />

      <div className="relative w-12 h-12 overflow-hidden rounded-xl group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-blue-600/20 z-10">
        <NextImage 
          src="/logo.png" 
          alt="SK Technology Logo" 
          fill 
          className="object-contain"
        />
      </div>
      
      {/* The Text to be split */}
      <div 
        ref={textRef}
        className="text-2xl font-black tracking-tighter hidden sm:inline-block relative z-10"
      >
        <span className={forceWhite ? "text-white" : "text-fg-primary dark:text-white"}>SK</span>
        <span className="text-blue-500">TECHNOLOGY</span>
      </div>
    </Link>
  );
}
