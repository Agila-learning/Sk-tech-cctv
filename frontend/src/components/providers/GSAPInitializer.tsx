"use client";
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const GSAPInitializer = () => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Initial stagger reveal for sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      gsap.fromTo(section, 
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return null;
};

export default GSAPInitializer;
