"use client";
import React from 'react';
import Link from 'next/link';
import { Instagram, Youtube, Play, Mail, Phone, MapPin, Camera, ArrowRight, ShieldCheck, Lock, Award, Users } from 'lucide-react';
import { API_URL } from '@/utils/api';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
    const footerRef = React.useRef<HTMLElement>(null);
    const pathname = usePathname();
    const { user } = useAuth();
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
      const footer = footerRef.current;
      if (!footer) return;

      const elements = footer.querySelectorAll('.footer-animate');
      
      gsap.fromTo(elements, 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 85%",
          }
        }
      );
    }, []);

    if (!mounted) {
      if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
      return <footer className="bg-background h-20" />; // Empty placeholder
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;

    const handleSubscribe = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      setStatus('loading');
      try {
        const response = await fetch(`${API_URL}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (response.ok) {
          setStatus('success');
          setEmail('');
        } else {
          setStatus('error');
        }
      } catch (error: any) {
        setStatus('error');
      }
    };

    return (
     <footer ref={footerRef} className="bg-background border-t border-border-base pt-24 pb-12 overflow-hidden relative transition-colors">
       {/* Glow Decor */}
       <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -translate-y-1/2"></div>
       
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
           <div className="footer-animate space-y-10">
             <Link href="/" className="flex items-center space-x-3 group">
               <div className="relative w-12 h-12 overflow-hidden rounded-xl border border-white/10 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-blue-600/20">
                 <img 
                  src="/logo.png" 
                  alt="SK Technology logo" 
                  className="w-full h-full object-contain"
                />
               </div>
               <span className="text-2xl font-black tracking-tighter transition-colors">
                 <span className="text-fg-primary">SK</span><span className="text-blue-500 font-black italic">TECHNOLOGY</span>
               </span>
             </Link>
             <p className="text-sm leading-relaxed font-medium text-fg-muted">
               Building the future of home and business security. We provide smart camera systems for all types of buildings and needs.
             </p>
             <div className="flex items-center space-x-4">
                {[
                  { icon: Instagram, href: 'https://www.instagram.com/sk_technology_soolagiri?utm_source=qr', baseClass: 'text-[#E1306C] border-[#E1306C]/30 bg-[#E1306C]/10', hoverClass: 'hover:bg-[#E1306C]/20 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(225,48,108,0.5)]', anim: 'animate-[pulse_3s_ease-in-out_infinite]' },
                  { icon: Youtube, href: 'https://www.youtube.com/@Skcctvservice', baseClass: 'text-[#FF0000] border-[#FF0000]/30 bg-[#FF0000]/10', hoverClass: 'hover:bg-[#FF0000]/20 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]', anim: 'animate-[pulse_3s_ease-in-out_infinite_1s]' },
                  { icon: Play, href: 'https://play.google.com/store/apps/details?id=com.sktechnology.cctv', baseClass: 'text-[#3DDC84] border-[#3DDC84]/30 bg-[#3DDC84]/10', hoverClass: 'hover:bg-[#3DDC84]/20 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(61,220,132,0.5)]', anim: 'animate-[pulse_3s_ease-in-out_infinite_2s]' }
                ].map((social, i) => (
                  <Link key={i} href={social.href} target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 transform ${social.baseClass} ${social.hoverClass} ${social.anim}`}>
                     <social.icon className="h-5 w-5 fill-current" />
                  </Link>
                ))}
             </div>
           </div>

           <div className="footer-animate">
             <h4 className="text-fg-primary font-bold text-base mb-6">Our Products</h4>
             <ul className="space-y-3 text-sm">
               {['Shop CCTV', 'Home Security', 'Night Vision', 'Smart Monitoring', 'Network Systems'].map((item) => (
                 <li key={item}>
                   <Link href="/products" className="text-fg-secondary hover:text-blue-600 font-medium transition-colors">
                     {item}
                   </Link>
                 </li>
               ))}
             </ul>
           </div>

           <div className="footer-animate">
             <h4 className="text-fg-primary font-bold text-base mb-6">Helpful Links</h4>
             <ul className="space-y-3 text-sm">
               {[
                 { name: 'Success Stories', href: '#' },
                 { name: 'How to Install', href: '/installation' },
                 { name: 'Customer Help', href: '/support' },
                 { name: 'Register Warranty', href: '/warranty' },
                 { name: 'Privacy Policy', href: '/privacy' }
               ].map((item) => (
                 <li key={item.name}>
                   <Link href={item.href} className="text-fg-secondary hover:text-blue-600 font-medium transition-colors">{item.name}</Link>
                 </li>
               ))}
             </ul>
           </div>

           <div className="footer-animate space-y-8">
             <h4 className="text-fg-primary font-bold text-base mb-4">Contact Us</h4>
             <div className="space-y-4 text-sm font-medium">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <span className="text-fg-secondary leading-relaxed">Down street, 2/222A, Berigai - Shoolagiri Rd, Dhoodi, Shoolagiri, Tamil Nadu 635117</span>
                </div>
               <div className="flex items-center space-x-3">
                 <Phone className="h-5 w-5 text-blue-600" />
                 <span className="text-fg-secondary">9600975483, 9940252983</span>
               </div>
               <div className="flex items-center space-x-3">
                 <Mail className="h-5 w-5 text-blue-600" />
                 <span className="text-fg-secondary">sktechnologycctv@gmail.com</span>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3 mt-6">
               {[
                 { icon: ShieldCheck, title: 'Secure', desc: 'Protected Systems' },
                 { icon: Lock, title: 'Payments', desc: '100% Secure' },
                 { icon: Award, title: 'Trusted', desc: '5+ Years Exp' },
                 { icon: Users, title: 'Experts', desc: 'Best Installers' }
               ].map((badge, i) => (
                 <div key={i} className="p-3 bg-bg-muted rounded-xl border border-border-base flex items-center space-x-3 group hover:border-blue-600/30 transition-all">
                    <badge.icon className="h-5 w-5 text-blue-600 transition-transform group-hover:scale-110" />
                    <div>
                       <p className="text-xs font-bold text-fg-primary leading-tight">{badge.title}</p>
                       <p className="text-[10px] text-fg-muted font-medium mt-0.5">{badge.desc}</p>
                    </div>
                 </div>
               ))}
             </div>
           </div>
         </div>

         <div className="footer-animate pt-8 border-t border-border-base flex flex-col lg:flex-row justify-between items-center text-sm font-medium text-fg-secondary gap-6">
           <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
             <p>© 2026 SK Technology. All rights reserved. Developed by <a href="https://forgeindiaconnect.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Forge India Connect</a>.</p>
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs">System Online</span>
             </div>
           </div>
           <div className="flex space-x-6 text-xs">
             <Link href="/privacy" className="hover:text-blue-600 hover:underline transition-colors">Privacy Policy</Link>
             <Link href="/architecture" className="hover:text-blue-600 hover:underline transition-colors">How it works</Link>
             <Link href="/compliance" className="hover:text-blue-600 hover:underline transition-colors">Safety Rules</Link>
           </div>
         </div>
       </div>
     </footer>
    );
};

export default Footer;
