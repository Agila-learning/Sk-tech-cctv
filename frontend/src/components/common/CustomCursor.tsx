"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Hide on admin/technician dashboards to keep native experience there
  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/technician');

  useEffect(() => {
    if (isDashboard) return;
    
    // Only show on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setIsVisible(true);

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    // Magnetic effect for buttons is handled via framer-motion inside those components,
    // but here we just track the hover state. We won't manipulate the DOM directly here to prevent hydration issues.

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [pathname, isDashboard]);

  if (isDashboard || !isVisible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, button, a, input, textarea, select {
          cursor: none !important;
        }
      `}} />
      <motion.div
        className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full mix-blend-screen transition-colors duration-300 ${isHovering ? 'bg-blue-400/30' : 'bg-blue-600/80'}`}
        animate={{
          x: mousePosition.x - (isHovering ? 24 : 8),
          y: mousePosition.y - (isHovering ? 24 : 8),
          width: isHovering ? 48 : 16,
          height: isHovering ? 48 : 16,
        }}
        transition={{
          type: 'spring',
          stiffness: 700,
          damping: 28,
          mass: 0.5,
        }}
        style={{
          boxShadow: isHovering ? '0 0 30px 10px rgba(96, 165, 250, 0.4)' : '0 0 15px 5px rgba(37, 99, 235, 0.6)',
        }}
      />
    </>
  );
}
