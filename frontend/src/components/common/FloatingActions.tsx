"use client";
import React, { useState, useEffect } from 'react';
import { ArrowUp, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

const FloatingActions = () => {
   const pathname = usePathname();
   const [showScroll, setShowScroll] = useState(false);
   
   const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/technician');
   
   // Show WhatsApp only if NOT on Admin/Tech dashboard
   const showWhatsApp = !isDashboard;

   useEffect(() => {
     const handleScroll = () => {
       setShowScroll(window.scrollY > 300);
     };
     window.addEventListener('scroll', handleScroll);
     return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   const scrollToTop = () => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   return (
     <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-4">
        {/* WhatsApp Button */}
        {showWhatsApp && (
          <a 
            href="https://wa.me/919600975483" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
            aria-label="Contact on WhatsApp"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.031 2.01c-5.518 0-9.998 4.48-9.998 9.998 0 1.765.46 3.491 1.332 5.013L2.012 22l5.12-1.343a9.96 9.96 0 004.898 1.284v-.002c5.516 0 9.997-4.482 9.997-10.002 0-2.673-1.04-5.182-2.928-7.072-1.89-1.89-4.403-2.932-7.068-2.855zm-1.6 13.916c-.328.002-.638-.112-.876-.322-1.282-1.12-3.1-3.6-3.8-4.8-.266-.454-.37-.992-.303-1.522.067-.534.348-1.012.793-1.354.382-.294.946-.226 1.21.144l1.192 1.666c.216.302.263.693.125 1.036-.1.25-.218.498-.35.742l-.04.075c.67 1.39 1.8 2.522 3.19 3.193l.074-.04c.244-.132.492-.25.743-.35.343-.138.734-.09 1.036.126l1.666 1.192c.37.265.438.828.144 1.21-.342.445-.82.726-1.354.793-.166.02-.338.03-.51.03-.326 0-.64-.062-.934-.18H10.43zm6.366-2.02l-.5-.956c-.058-.11-.158-.184-.275-.205-.138-.026-.28.016-.388.113l-1.002.902c-.894-.403-1.748-1.258-2.152-2.153l.904-1.002c.096-.108.138-.25.112-.387-.023-.117-.097-.217-.206-.275l-.956-.5c-.172-.09-.38-.07-.532.05l-.962 1.05c-.126.138-.187.323-.162.512.445 3.328 3.016 5.9 6.345 6.345.188.025.373-.036.51-.162l1.052-.962c.12-.152.14-.36.05-.532z" />
            </svg>
          </a>
        )}

        {/* Scroll To Top Button */}
        {showScroll && (
          <button 
            onClick={scrollToTop}
            className="w-14 h-14 bg-bg-muted border border-border-base text-fg-primary hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group"
            aria-label="Scroll to Top"
          >
             <ArrowUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
          </button>
        )}
     </div>
   );
};

export default FloatingActions;
