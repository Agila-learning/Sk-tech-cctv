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
      const socialIcons = footer.querySelectorAll('.social-icon');
      
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

      gsap.fromTo(socialIcons,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: footer,
            start: "top 85%",
          },
          onComplete: () => {
            gsap.to(socialIcons, {
              y: -3,
              duration: 2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              stagger: 0.1
            });
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
     <footer ref={footerRef} className="bg-background border-t border-border-base pt-24 pb-24 md:pb-12 overflow-hidden relative transition-colors">
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
             <div className="flex items-center space-x-6">
                {[
                  { 
                    id: 'youtube',
                    name: 'YouTube',
                    href: 'https://www.youtube.com/@Skcctvservice', 
                    glowColor: 'rgba(255, 0, 0, 0.4)',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="#FF0000" className="w-[60%] h-[60%]">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    )
                  },
                  { 
                    id: 'instagram',
                    name: 'Instagram',
                    href: 'https://www.instagram.com/sk_technology_soolagiri?utm_source=qr', 
                    glowColor: 'rgba(221, 42, 123, 0.4)',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]">
                        <defs>
                          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F58529" />
                            <stop offset="33%" stopColor="#DD2A7B" />
                            <stop offset="66%" stopColor="#8134AF" />
                            <stop offset="100%" stopColor="#515BD4" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    )
                  },
                  { 
                    id: 'whatsapp',
                    name: 'WhatsApp',
                    href: 'https://wa.me/919600975483', 
                    glowColor: 'rgba(37, 211, 102, 0.4)',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="#25D366" className="w-[60%] h-[60%]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.299-.018-.461.13-.611.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    )
                  }
                ].map((social, i) => (
                  <Link 
                    key={i} 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-icon group relative flex items-center justify-center w-[72px] h-[72px] rounded-[20px] bg-white/[0.18] backdrop-blur-[14px] border border-white/[0.35] transition-all duration-300 ease-in-out shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.1)] hover:scale-[1.12] hover:-translate-y-1 z-50"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `inset 0 1px 1px rgba(255,255,255,0.4), 0 12px 40px ${social.glowColor}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 32px rgba(0,0,0,0.1)`;
                    }}
                    aria-label={social.name}
                  >
                     {social.icon}
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

         <div className="footer-animate pt-8 pb-28 md:pb-8 border-t border-border-base flex flex-col lg:flex-row justify-between items-center text-sm font-medium text-fg-secondary gap-6 relative z-50">
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
